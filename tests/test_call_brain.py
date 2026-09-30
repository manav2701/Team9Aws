import sys
from datetime import datetime
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "lambda_functions" / "call_fulfillment"))

import brain  # noqa: E402
import call_scripts  # noqa: E402

BOOKING = {"specialty": "neurology", "urgency": "SOON", "patient_windows": ["Thursday 09:00 to 12:00"]}
OPENED = [{"role": "shifa", "text": "opening"}]
NOW = datetime(2026, 9, 30, 14, 0, tzinfo=brain.UAE_TZ)  # a Wednesday


class FakeBedrock:
    def __init__(self, tool_input):
        self.tool_input = tool_input
        self.calls = []

    def converse(self, **kwargs):
        self.calls.append(kwargs)
        return {"output": {"message": {"content": [{"toolUse": {"name": "speak", "input": self.tool_input}}]}}}


@pytest.mark.parametrize("call_type", call_scripts.CALL_TYPES)
@pytest.mark.parametrize("lang, marker", [("en", "automated AI assistant"), ("ar", "مساعد آلي يعمل بالذكاء الاصطناعي")])
def test_opening_always_discloses_ai_without_calling_the_model(call_type, lang, marker):
    client = FakeBedrock({})
    turn = brain.next_turn(call_type, {}, [], lang=lang, client=client)
    assert marker in turn["say"]
    assert turn["status"] == "in_progress"
    assert client.calls == []


def test_success_without_required_outcome_keeps_the_call_open():
    client = FakeBedrock({"say": "Great, goodbye.", "status": "success", "outcome": {"date": "2026-10-01"}})
    turn = brain.next_turn("booking", BOOKING, OPENED, "ok", client=client)
    assert turn["status"] == "in_progress"


def _book(outcome, lang="en"):
    client = FakeBedrock({"say": "Thank you, goodbye.", "status": "success", "outcome": outcome})
    return brain.next_turn("booking", BOOKING, OPENED, "confirmed", lang=lang, client=client, now=NOW)


def test_success_with_full_outcome_is_accepted():
    outcome = {"weekday": "Thursday", "date": "2026-10-01", "time": "10:30", "doctor_name": "Dr. Sample"}
    assert _book(outcome) == {"say": "Thank you, goodbye.", "status": "success", "outcome": outcome}


@pytest.mark.parametrize(
    "weekday, day",
    [
        ("Wednesday", "2026-10-08"),  # the 8th is a Thursday
        ("Tuesday", "2026-09-29"),  # in the past
        ("Thursday", "October 1st"),  # not a date
    ],
)
def test_booking_with_unreliable_date_asks_the_clinic_instead_of_booking(weekday, day):
    turn = _book({"weekday": weekday, "date": day, "time": "16:00", "doctor_name": "Dr. Sample"}, lang="ar")
    assert turn["status"] == "in_progress"
    assert turn["say"] == call_scripts.confirm_date_line("ar")


def test_insurance_needs_info_must_list_what_is_needed():
    client = FakeBedrock({"say": "Understood.", "status": "needs_info", "outcome": {}})
    turn = brain.next_turn("insurance", {}, OPENED, "we need more", client=client)
    assert turn["status"] == "in_progress"


def test_turn_limit_ends_the_call_without_calling_the_model():
    history = [{"role": "shifa", "text": "x"}, {"role": "other", "text": "y"}] * brain.MAX_SHIFA_TURNS
    client = FakeBedrock({})
    turn = brain.next_turn("booking", BOOKING, history, "hello?", client=client)
    assert turn["status"] == "failed"
    assert turn["outcome"] == {"reason": "turn_limit"}
    assert client.calls == []


def test_messages_alternate_roles_and_silence_is_marked():
    history = OPENED + [{"role": "other", "text": "a"}, {"role": "other", "text": "b"}, {"role": "shifa", "text": "c"}]
    messages = brain._to_messages(history, "  ")
    roles = [m["role"] for m in messages]
    assert roles == ["user", "assistant", "user", "assistant", "user"]
    assert messages[2]["content"][0]["text"] == "a\nb"
    assert messages[-1]["content"][0]["text"] == brain.SILENCE


def test_facts_omit_missing_values():
    prompt = call_scripts.system_prompt("insurance", {"policy_id": "DEMO-1"}, NOW, "ar")
    assert "Speak Arabic" in prompt
    assert "Policy number: DEMO-1" in prompt
    assert "Prescribing doctor" not in prompt
    assert "None" not in prompt
