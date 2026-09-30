"""Outbound phone calls over Twilio.

One Lambda, two entry points:
- invoked directly with {"journey_id", "call_type", "to_number", "lang", "context"}
  it places a call and returns {"call_id"};
- invoked through its Function URL by Twilio it runs one turn of the conversation.

Twilio does the speech-to-text and text-to-speech; brain.py decides what to say.
When a call ends, the result is saved on the call record and published to SNS.

Config lives in SSM under /app/workshop/shifa (see deploy.sh).
Logs carry ids and states only, never what was said (no PHI in logs).
"""

import base64
import json
import logging
import re
import time
import uuid
from decimal import Decimal
from urllib.parse import parse_qsl

import boto3
from botocore.exceptions import ClientError

import brain
import call_scripts
import twilio_io

logger = logging.getLogger()
logger.setLevel(logging.INFO)

SSM_PATH = "/app/workshop/shifa"
CONFIG_TTL = 60
RECORD_TTL = 7 * 86400
OPEN = ("dialing", "in_progress")
UNREACHABLE = ("busy", "no-answer", "failed", "canceled")
ENDED = UNREACHABLE + ("completed",)
DIALING_CONFIG = ("twilio/account-sid", "twilio/auth-token", "twilio/from-number", "calls/webhook-url")

_config = {"at": 0.0, "values": {}}


def _cfg():
    """SSM parameters under SSM_PATH, keyed by the rest of their name. Re-read every minute."""
    if time.time() - _config["at"] > CONFIG_TTL:
        pages = boto3.client("ssm").get_paginator("get_parameters_by_path").paginate(
            Path=SSM_PATH, Recursive=True, WithDecryption=True
        )
        _config["values"] = {p["Name"][len(SSM_PATH) + 1 :]: p["Value"] for page in pages for p in page["Parameters"]}
        _config["at"] = time.time()
    return _config["values"]


def _table():
    return boto3.resource("dynamodb").Table(_cfg()["calls/table"])


def _ddb(value):
    """DynamoDB rejects floats; round-trip through JSON to turn them into Decimals."""
    return json.loads(json.dumps(value, default=str), parse_float=Decimal)


def _load(call_id):
    if not call_id:
        return None
    return _table().get_item(Key={"call_id": call_id}, ConsistentRead=True).get("Item")


def _save_turn(call_id, history, outcome):
    _table().update_item(
        Key={"call_id": call_id},
        UpdateExpression="SET #s = :s, history = :h, outcome = :o, updated_at = :t",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "in_progress", ":h": history, ":o": _ddb(outcome), ":t": int(time.time())},
    )


def _close(call, status, outcome, history=None):
    """End the call once: only the first caller wins, so a late hang-up can't overwrite a success."""
    names = {"#s": "status"}
    values = {":s": status, ":o": _ddb(outcome), ":t": int(time.time()), ":dialing": OPEN[0], ":talking": OPEN[1]}
    update = "SET #s = :s, outcome = :o, updated_at = :t"
    if history is not None:
        update += ", history = :h"
        values[":h"] = history
    try:
        _table().update_item(
            Key={"call_id": call["call_id"]},
            UpdateExpression=update,
            ConditionExpression="#s IN (:dialing, :talking)",
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
        )
    except ClientError as error:
        if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return
        raise
    logger.info("call ended call=%s journey=%s status=%s", call["call_id"], call.get("journey_id"), status)
    _publish(call, status, outcome)


def _publish(call, status, outcome):
    topic = _cfg().get("calls/results-topic-arn")
    if not topic:
        return
    message = {
        "call_id": call["call_id"],
        "journey_id": call.get("journey_id"),
        "call_type": call["call_type"],
        "status": status,
        "outcome": outcome,
    }
    boto3.client("sns").publish(TopicArn=topic, Message=json.dumps(message, ensure_ascii=False, default=str))


def start_call(event):
    call_type = event.get("call_type")
    to_number = event.get("to_number", "")
    if call_type not in call_scripts.CALL_TYPES:
        raise ValueError(f"call_type must be one of {call_scripts.CALL_TYPES}")
    if not event.get("dry_run") and not re.fullmatch(r"\+[1-9]\d{7,14}", to_number):
        raise ValueError("to_number must be in E.164 form, e.g. +9715XXXXXXXX")

    cfg = _cfg()
    missing = [] if event.get("dry_run") else [key for key in DIALING_CONFIG if key not in cfg]
    if missing:
        raise RuntimeError(f"missing SSM parameters under {SSM_PATH}: {', '.join(missing)}")

    now = int(time.time())
    call = {
        "call_id": uuid.uuid4().hex,
        "journey_id": event.get("journey_id"),
        "call_type": call_type,
        "lang": event.get("lang", "en"),
        "context": _ddb(event.get("context") or {}),
        "history": [],
        "status": "dialing",
        "outcome": {},
        "created_at": now,
        "expires_at": now + RECORD_TTL,
    }
    _table().put_item(Item=call)

    # dry_run creates the call record without dialing, for tools/simulate_twilio.py.
    if not event.get("dry_run"):
        url = f"{cfg['calls/webhook-url']}?call={call['call_id']}"
        try:
            twilio_io.place_call(
                cfg["twilio/account-sid"],
                cfg["twilio/auth-token"],
                to_number,
                cfg["twilio/from-number"],
                url,
                f"{url}&event=status",
            )
        except Exception:
            _close(call, "failed", {"reason": "unreachable"})
            raise

    logger.info("call started call=%s journey=%s type=%s", call["call_id"], call["journey_id"], call_type)
    return {"call_id": call["call_id"]}


def _turn(call, params, action_url):
    if call["status"] not in OPEN:
        return twilio_io.hangup()

    lang = call["lang"]
    history = call["history"]
    heard = params.get("SpeechResult", "").strip() or brain.SILENCE
    try:
        turn = brain.next_turn(call["call_type"], call["context"], history, heard, lang)
    except Exception:
        logger.exception("call turn failed call=%s", call["call_id"])
        turn = {"say": call_scripts.repeat_line(lang), "status": "in_progress", "outcome": {}}

    if history:  # the first request is Twilio connecting, nothing has been heard yet
        history.append({"role": "other", "text": heard})
    history.append({"role": "shifa", "text": turn["say"]})
    logger.info("call turn call=%s status=%s turns=%d", call["call_id"], turn["status"], len(history))

    if turn["status"] == "in_progress":
        _save_turn(call["call_id"], history, turn["outcome"])
        return twilio_io.gather(turn["say"], lang, action_url)
    _close(call, turn["status"], turn["outcome"], history)
    return twilio_io.say_and_hangup(turn["say"], lang)


def _on_status(call, params):
    """Twilio's end-of-call callback. Only matters if the conversation didn't finish by itself."""
    reason = "unreachable" if params.get("CallStatus") in UNREACHABLE else "hung_up"
    _close(call, "failed", {"reason": reason})


def _webhook(event):
    cfg = _cfg()
    query = event.get("rawQueryString", "")
    body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode()
    posted = dict(parse_qsl(body, keep_blank_values=True))
    target = dict(parse_qsl(query))
    headers = event.get("headers") or {}

    # This URL is public. A signed request must carry a valid Twilio signature. Twilio
    # trial accounts fetch the URL with no signature at all, so an unsigned request is
    # let through on the strength of the call id, which is a random 128-bit value that
    # only Twilio was given and that stops working when the call ends.
    token = cfg.get("twilio/auth-token")
    signature = headers.get("x-twilio-signature", "")
    url = f"{cfg['calls/webhook-url']}?{query}"
    if not token or (signature and not twilio_io.valid_signature(token, url, posted, signature)):
        logger.warning("webhook refused call=%s has_token=%s", target.get("call"), bool(token))
        return {"statusCode": 403, "body": "forbidden"}

    params = {**target, **posted}  # a GET carries Twilio's fields in the query string
    call = _load(target.get("call"))
    logger.info(
        "webhook call=%s method=%s signed=%s event=%s twilio_status=%s found=%s agent=%s",
        target.get("call"),
        event["requestContext"]["http"].get("method"),
        bool(signature),
        target.get("event", "turn"),
        params.get("CallStatus"),
        bool(call),
        headers.get("user-agent", "")[:40],
    )
    if target.get("event") == "status" or params.get("CallStatus") in ENDED:
        if call:
            _on_status(call, params)
        return {"statusCode": 204}

    twiml = _turn(call, params, f"{cfg['calls/webhook-url']}?call={call['call_id']}") if call else twilio_io.hangup()
    return {"statusCode": 200, "headers": {"Content-Type": "text/xml; charset=utf-8"}, "body": twiml}


def lambda_handler(event, _context):
    if "http" in (event.get("requestContext") or {}):
        return _webhook(event)
    return start_call(event)
