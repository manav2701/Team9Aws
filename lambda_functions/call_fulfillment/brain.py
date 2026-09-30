"""Decides what Shifa says next on an outbound phone call.

Transport-agnostic: the Twilio webhook (handler.py) and the local simulator
(tools/simulate_call.py) both go through next_turn().
"""

import logging
import os
from datetime import date, datetime, timedelta, timezone

import boto3

import call_scripts

logger = logging.getLogger(__name__)

MODEL_ID = os.environ.get("CALL_MODEL_ID", "us.anthropic.claude-haiku-4-5-20251001-v1:0")
MAX_SHIFA_TURNS = 12
UAE_TZ = timezone(timedelta(hours=4))  # no DST in the UAE
SILENCE = "[silence]"

_client = None


def _bedrock():
    global _client
    if _client is None:
        _client = boto3.client("bedrock-runtime")
    return _client


def _to_messages(history, heard):
    """history is [{"role": "shifa" | "other", "text": str}], oldest first."""
    turns = [("user", "[call connected]")]
    for entry in history:
        turns.append(("assistant" if entry["role"] == "shifa" else "user", entry["text"]))
    turns.append(("user", heard.strip() if heard and heard.strip() else SILENCE))

    # Converse requires strictly alternating roles; merge any neighbours.
    messages = []
    for role, text in turns:
        if messages and messages[-1]["role"] == role:
            messages[-1]["content"][0]["text"] += "\n" + text
        else:
            messages.append({"role": role, "content": [{"text": text}]})
    return messages


def _date_is_unreliable(outcome, today):
    """The model sometimes maps a spoken day to the wrong date; catch it rather than book it."""
    try:
        day = date.fromisoformat(outcome["date"])
    except ValueError:
        return True
    return day < today or day.strftime("%A") != outcome["weekday"]


def _validate(call_type, turn, today, lang):
    """Never let the workflow advance on a status the outcome doesn't back up."""
    status = turn.get("status")
    outcome = turn.get("outcome") or {}
    say = turn.get("say", "").strip()
    if status not in call_scripts.STATUSES:
        status = "in_progress"
    missing = [f for f in call_scripts.REQUIRED_OUTCOME.get((call_type, status), ()) if not outcome.get(f)]
    if missing:
        logger.warning("status=%s rejected, outcome missing %s", status, missing)
        status = "in_progress"
    elif call_type == "booking" and status == "success" and _date_is_unreliable(outcome, today):
        logger.warning("booking date rejected, asking the clinic for the exact date")
        status, say = "in_progress", call_scripts.confirm_date_line(lang)
    return {"say": say, "status": status, "outcome": outcome}


def next_turn(call_type, context, history, heard=None, lang="en", client=None, now=None):
    """Return {"say", "status", "outcome"} for Shifa's next line.

    With an empty history this is the opening line, which is static so the AI
    disclosure is always spoken first. The call is over when status is anything
    other than "in_progress".
    """
    if call_type not in call_scripts.CALL_TYPES:
        raise ValueError(f"unknown call_type: {call_type}")

    if not history:
        return {"say": call_scripts.opening_line(call_type, lang), "status": "in_progress", "outcome": {}}

    if sum(1 for entry in history if entry["role"] == "shifa") >= MAX_SHIFA_TURNS:
        return {"say": call_scripts.give_up_line(lang), "status": "failed", "outcome": {"reason": "turn_limit"}}

    now = now or datetime.now(UAE_TZ)
    response = (client or _bedrock()).converse(
        modelId=MODEL_ID,
        system=[{"text": call_scripts.system_prompt(call_type, context, now, lang)}],
        messages=_to_messages(history, heard),
        toolConfig={
            "tools": [call_scripts.turn_tool(call_type)],
            "toolChoice": {"tool": {"name": "speak"}},
        },
        inferenceConfig={"maxTokens": 500, "temperature": 0.2},
    )
    for block in response["output"]["message"]["content"]:
        if "toolUse" in block:
            return _validate(call_type, block["toolUse"]["input"], now.date(), lang)
    raise RuntimeError("model returned no speak tool call")
