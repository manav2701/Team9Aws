import base64
import sys
from pathlib import Path
from urllib.parse import urlencode

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "lambda_functions" / "call_fulfillment"))

import brain  # noqa: E402
import call_scripts  # noqa: E402
import handler  # noqa: E402
import twilio_io  # noqa: E402

WEBHOOK = "https://example.lambda-url.us-west-2.on.aws/"
TOKEN = "test-token"
CFG = {
    "calls/webhook-url": WEBHOOK,
    "calls/table": "workshop-shifa-calls",
    "twilio/auth-token": TOKEN,
    "twilio/account-sid": "AC0",
    "twilio/from-number": "+15550000000",
}


def _sign(url, params, token=TOKEN):
    import hashlib
    import hmac

    payload = url + "".join(k + v for k, v in sorted(params.items()))
    return base64.b64encode(hmac.new(token.encode(), payload.encode(), hashlib.sha1).digest()).decode()


def _request(query, params, signature=None, encoded=False):
    body = urlencode(params)
    return {
        "requestContext": {"http": {"method": "POST"}},
        "rawQueryString": query,
        "headers": {"x-twilio-signature": _sign(f"{WEBHOOK}?{query}", params) if signature is None else signature},
        "body": base64.b64encode(body.encode()).decode() if encoded else body,
        "isBase64Encoded": encoded,
    }


@pytest.fixture
def world(monkeypatch):
    """The handler with its storage, SNS and dialing replaced by recorders."""
    state = {"calls": {}, "saved": [], "closed": [], "dialed": []}

    def close(call, status, outcome, history=None):
        state["closed"].append((call["call_id"], status, outcome))

    monkeypatch.setattr(handler, "_cfg", lambda: CFG)
    monkeypatch.setattr(handler, "_load", lambda call_id: state["calls"].get(call_id))
    monkeypatch.setattr(handler, "_save_turn", lambda call_id, history, outcome: state["saved"].append(list(history)))
    monkeypatch.setattr(handler, "_close", close)
    monkeypatch.setattr(twilio_io, "place_call", lambda *args: state["dialed"].append(args) or "CA1")
    return state


def _call(world, **overrides):
    call = {"call_id": "c1", "journey_id": "j1", "call_type": "booking", "lang": "en", "context": {}, "history": []}
    call.update(status="dialing", **overrides)
    world["calls"]["c1"] = call
    return call


def test_signature_matches_twilios_documented_example():
    params = {
        "CallSid": "CA1234567890ABCDE",
        "Caller": "+12349013030",
        "Digits": "1234",
        "From": "+12349013030",
        "To": "+18005551212",
    }
    url = "https://mycompany.com/myapp.php?foo=1&bar=2"
    assert twilio_io.valid_signature("12345", url, params, "0/KCTR6DLpKmkAf8muzZqo1nDgQ=")


@pytest.mark.parametrize("signature", ["wrong", _sign(f"{WEBHOOK}?call=c1", {"CallSid": "CA1"}, token="other")])
def test_requests_with_a_bad_twilio_signature_are_refused(world, signature):
    _call(world)
    response = handler.lambda_handler(_request("call=c1", {"CallSid": "CA1"}, signature=signature), None)
    assert response["statusCode"] == 403
    assert world["saved"] == []


def test_unsigned_request_from_a_trial_account_is_served_for_an_open_call(world):
    _call(world)
    response = handler.lambda_handler(_request("call=c1", {"CallSid": "CA1"}, signature=""), None)
    assert response["statusCode"] == 200
    assert call_scripts.DISCLOSURE["en"] in response["body"]


def test_unsigned_request_for_an_unknown_call_gets_nothing_but_a_hangup(world):
    response = handler.lambda_handler(_request("call=guess", {"CallSid": "CA1"}, signature=""), None)
    assert response["body"] == twilio_io.hangup()


def test_a_turn_request_reporting_the_call_ended_closes_it_instead_of_talking(world):
    _call(world)
    response = handler.lambda_handler(_request("call=c1", {"CallStatus": "completed"}), None)
    assert response["statusCode"] == 204
    assert world["closed"] == [("c1", "failed", {"reason": "hung_up"})]
    assert world["saved"] == []


def test_everything_is_refused_until_an_auth_token_is_configured(world, monkeypatch):
    monkeypatch.setattr(handler, "_cfg", lambda: {k: v for k, v in CFG.items() if k != "twilio/auth-token"})
    response = handler.lambda_handler(_request("call=c1", {"CallSid": "CA1"}), None)
    assert response["statusCode"] == 403


def test_answered_call_opens_with_the_ai_disclosure_and_listens(world):
    _call(world, lang="ar")
    response = handler.lambda_handler(_request("call=c1", {"CallSid": "CA1"}, encoded=True), None)

    assert response["statusCode"] == 200
    assert call_scripts.DISCLOSURE["ar"] in response["body"]
    assert '<Gather input="speech" language="ar-AE"' in response["body"]
    assert f'action="{WEBHOOK}?call=c1"' in response["body"]
    assert world["saved"] == [[{"role": "shifa", "text": call_scripts.opening_line("booking", "ar")}]]


def test_final_turn_hangs_up_and_closes_the_call_with_its_outcome(world, monkeypatch):
    outcome = {"approval_reference": "AP1"}
    _call(world, call_type="insurance", history=[{"role": "shifa", "text": "opening"}])
    monkeypatch.setattr(brain, "next_turn", lambda *a, **k: {"say": "Goodbye.", "status": "success", "outcome": outcome})

    response = handler.lambda_handler(_request("call=c1", {"CallSid": "CA1", "SpeechResult": "approved"}), None)

    assert "<Say" in response["body"] and response["body"].endswith("<Hangup/></Response>")
    assert world["closed"] == [("c1", "success", outcome)]


def test_a_failing_turn_asks_to_repeat_instead_of_dropping_the_call(world, monkeypatch):
    _call(world, history=[{"role": "shifa", "text": "opening"}])

    def boom(*args, **kwargs):
        raise RuntimeError("bedrock down")

    monkeypatch.setattr(brain, "next_turn", boom)
    response = handler.lambda_handler(_request("call=c1", {"SpeechResult": "hello"}), None)
    assert call_scripts.repeat_line("en") in response["body"]
    assert world["closed"] == []


def test_silence_is_recorded_as_a_marker_not_an_empty_message(world, monkeypatch):
    _call(world, history=[{"role": "shifa", "text": "opening"}])
    monkeypatch.setattr(brain, "next_turn", lambda *a, **k: {"say": "Are you there?", "status": "in_progress", "outcome": {}})
    handler.lambda_handler(_request("call=c1", {"CallSid": "CA1"}), None)
    assert world["saved"][0][1] == {"role": "other", "text": brain.SILENCE}


def test_finished_or_unknown_calls_just_hang_up(world):
    world["calls"]["c1"] = {"call_id": "c1", "status": "success"}
    for query in ("call=c1", "call=nope"):
        response = handler.lambda_handler(_request(query, {"CallSid": "CA1"}), None)
        assert response["body"] == twilio_io.hangup()


@pytest.mark.parametrize("call_status, reason", [("no-answer", "unreachable"), ("busy", "unreachable"), ("completed", "hung_up")])
def test_status_callback_closes_a_call_that_never_finished(world, call_status, reason):
    _call(world)
    response = handler.lambda_handler(_request("call=c1&event=status", {"CallStatus": call_status}), None)
    assert response["statusCode"] == 204
    assert world["closed"] == [("c1", "failed", {"reason": reason})]


def test_start_call_dials_with_webhook_urls_for_the_new_call(world, monkeypatch):
    stored = []
    monkeypatch.setattr(handler, "_table", lambda: type("T", (), {"put_item": lambda self, Item: stored.append(Item)})())
    result = handler.lambda_handler({"call_type": "booking", "to_number": "+971500000000", "journey_id": "j1", "context": {"fee": 1.5}}, None)

    call_id = result["call_id"]
    assert stored[0]["status"] == "dialing" and "to_number" not in stored[0]
    sid, token, to, from_, url, status_url = world["dialed"][0]
    assert (to, from_) == ("+971500000000", "+15550000000")
    assert url == f"{WEBHOOK}?call={call_id}" and status_url == f"{url}&event=status"


def test_start_call_rejects_bad_input_before_touching_anything(world):
    with pytest.raises(ValueError):
        handler.lambda_handler({"call_type": "booking", "to_number": "0501234567"}, None)
    with pytest.raises(ValueError):
        handler.lambda_handler({"call_type": "chat", "to_number": "+971500000000"}, None)
    assert world["dialed"] == []
