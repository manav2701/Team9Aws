"""Twilio plumbing: request signatures, the REST call that dials, and TwiML responses."""

import base64
import hashlib
import hmac
import json
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape, quoteattr

# lang -> (speech recognition language, text-to-speech voice)
VOICES = {
    "en": ("en-US", "Polly.Joanna-Neural"),
    "ar": ("ar-AE", "Polly.Hala-Neural"),
}


def valid_signature(auth_token, url, params, signature):
    """Twilio signs the full request URL followed by the sorted POST params."""
    payload = url + "".join(key + value for key, value in sorted(params.items()))
    digest = hmac.new(auth_token.encode(), payload.encode(), hashlib.sha1).digest()
    return hmac.compare_digest(base64.b64encode(digest).decode(), signature or "")


def _post_call(account_sid, auth_token, fields):
    request = Request(
        f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json", data=urlencode(fields).encode()
    )
    credentials = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()
    request.add_header("Authorization", f"Basic {credentials}")
    with urlopen(request, timeout=10) as response:
        return json.load(response)["sid"]


def place_call(account_sid, auth_token, to_number, from_number, url, status_url):
    """Dial to_number; Twilio fetches `url` when it is answered. Returns the call SID.

    Twilio trial accounts refuse the Method parameters (POST is the default anyway) and may refuse the status callback. The call is still placed without it,
    but then a hang-up mid-call is not reported and the call record stays open.
    """
    fields = {"To": to_number, "From": from_number, "Url": url}
    with_status = {**fields, "StatusCallback": status_url}
    try:
        try:
            return _post_call(account_sid, auth_token, with_status)
        except HTTPError as error:
            if error.code != 400:
                raise
            return _post_call(account_sid, auth_token, fields)
    except HTTPError as error:
        detail = json.loads(error.read() or b"{}").get("message", "")
        raise RuntimeError(f"Twilio refused the call ({error.code}): {detail}") from error


def _say(text, lang):
    _, voice = VOICES.get(lang, VOICES["en"])
    return f'<Say voice="{voice}">{escape(text)}</Say>'


def _response(body):
    return f'<?xml version="1.0" encoding="UTF-8"?><Response>{body}</Response>'


def gather(text, lang, action_url):
    """Say a line, then listen. actionOnEmptyResult makes silence reach us too."""
    stt, _ = VOICES.get(lang, VOICES["en"])
    return _response(
        f'<Gather input="speech" language="{stt}" speechTimeout="auto" timeout="6" '
        f'actionOnEmptyResult="true" method="POST" action={quoteattr(action_url)}>'
        f"{_say(text, lang)}</Gather>"
    )


def say_and_hangup(text, lang):
    return _response(f"{_say(text, lang)}<Hangup/>")


def hangup():
    return _response("<Hangup/>")
