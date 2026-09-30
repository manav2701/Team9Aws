"""Call scripts: what Shifa says and aims for on outbound calls to clinics and insurers."""

from datetime import timedelta

CALL_TYPES = ("booking", "insurance")
STATUSES = ("in_progress", "success", "needs_info", "failed")

# Spoken first on every call, before anything else. Static on purpose: the AI
# disclosure must never depend on a model call succeeding.
DISCLOSURE = {
    "en": "Hello, this is Shifa, an automated AI assistant calling on behalf of a patient.",
    "ar": "مرحباً، معكم شفاء، مساعد آلي يعمل بالذكاء الاصطناعي، أتصل نيابةً عن أحد المرضى.",
}

_PURPOSE = {
    "booking": {
        "en": "I'd like to book an appointment. Is this a good time?",
        "ar": "أودّ حجز موعد طبي. هل الوقت مناسب الآن؟",
    },
    "insurance": {
        "en": "I'm calling to request pre-approval for a prescription. Is this a good time?",
        "ar": "أتصل لطلب موافقة مسبقة على وصفة طبية. هل الوقت مناسب الآن؟",
    },
}

_GIVE_UP = {
    "en": "I'm sorry, I wasn't able to complete this on the call. We'll try again later. Thank you, goodbye.",
    "ar": "عذراً، لم أتمكن من إتمام الطلب في هذه المكالمة. سنحاول مرة أخرى لاحقاً. شكراً لكم، مع السلامة.",
}

_REPEAT = {
    "en": "Sorry, could you say that again?",
    "ar": "عذراً، هل يمكنكم إعادة ما قلتم؟",
}

_CONFIRM_DATE = {
    "en": "Sorry, just to be sure I have it right: what is the exact date of the appointment, day and month?",
    "ar": "عذراً، للتأكد فقط: ما هو تاريخ الموعد بالضبط، اليوم والشهر؟",
}

_URGENCY = {
    "ROUTINE": "routine, any time in the next two weeks is fine",
    "SOON": "should be seen within the next few days",
    "URGENT": "needs to be seen today or tomorrow",
}

# Fields the outcome must carry before a status is accepted (see brain._validate).
REQUIRED_OUTCOME = {
    ("booking", "success"): ("weekday", "date", "time", "doctor_name"),
    ("insurance", "success"): ("approval_reference",),
    ("insurance", "needs_info"): ("info_needed",),
}

_OUTCOME_SCHEMA = {
    "booking": {
        "weekday": {
            "type": "string",
            "enum": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "description": "Day of the week of the agreed appointment.",
        },
        "date": {"type": "string", "description": "Agreed appointment date, YYYY-MM-DD, taken from the calendar."},
        "time": {"type": "string", "description": "Agreed appointment time, 24-hour HH:MM."},
        "doctor_name": {"type": "string"},
        "confirmation_ref": {"type": "string", "description": "Booking reference, if the clinic gave one."},
        "alternatives": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Slots the clinic offered outside the patient's available times, in the clinic's own words.",
        },
        "reason": {
            "type": "string",
            "enum": ["no_slot", "wrong_number", "declined", "other"],
            "description": "Why the call failed. Only with status=failed.",
        },
    },
    "insurance": {
        "approval_reference": {"type": "string", "description": "Approval reference exactly as the insurer gave it."},
        "info_needed": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Each extra document or detail the insurer asked for. Only with status=needs_info.",
        },
        "reason": {
            "type": "string",
            "enum": ["rejected", "wrong_number", "declined", "other"],
            "description": "Why the call failed. Only with status=failed.",
        },
        "notes": {"type": "string", "description": "The insurer's stated reason for a rejection, in a few words."},
    },
}

_GOAL = {
    "booking": """\
Book one appointment for the patient at this clinic.
1. Say which specialty is needed and how soon the patient should be seen.
2. Offer the patient's available times and agree on a slot inside them. You can only accept a slot that falls inside those times, because the patient has not agreed to anything else. If the clinic only has slots outside them, note those slots in `alternatives`, thank them, and end with status "failed" and reason "no_slot" so the patient can be asked.
3. Get the doctor's name for that slot.
4. Read the date, time and doctor's name back in one sentence and ask them to confirm.
5. Only after they confirm the read-back, thank them, say goodbye, and report status "success" with the outcome filled in.""",
    "insurance": """\
Get pre-approval from the insurer for the patient's prescription.
1. Give the policy number, then the clinic and the prescribing doctor.
2. Read out the prescribed items exactly as listed under "What you know", one item at a time. Never change, shorten or comment on an item; you are relaying what the doctor wrote.
3. If they approve, ask for the approval reference, read it back one character at a time, and ask them to confirm it. Only after they confirm, thank them, say goodbye, and report status "success".
4. If they need more documents or details that you don't have, find out exactly what is needed, then end with status "needs_info" and list each item in `info_needed`.
5. If they reject the request, ask for the reason, then end with status "failed", reason "rejected", and the reason in `notes`.""",
}

_LANGUAGE = {"en": "English", "ar": "Arabic"}

_COUNTERPART = {
    "booking": "the reception desk of a medical clinic",
    "insurance": "a health insurer's pre-approval line",
}


def _lang(lang):
    return lang if lang in DISCLOSURE else "en"


def opening_line(call_type, lang):
    lang = _lang(lang)
    return f"{DISCLOSURE[lang]} {_PURPOSE[call_type][lang]}"


def give_up_line(lang):
    return _GIVE_UP[_lang(lang)]


def repeat_line(lang):
    return _REPEAT[_lang(lang)]


def confirm_date_line(lang):
    return _CONFIRM_DATE[_lang(lang)]


def _facts(call_type, context):
    """The only details Shifa may share on this call. Missing values are left out."""
    if call_type == "booking":
        urgency = context.get("urgency")
        rows = [
            ("Clinic you are calling", context.get("provider_name")),
            ("Specialty needed", context.get("specialty")),
            ("How soon", _URGENCY.get(urgency, urgency)),
            ("Patient's available times", "; ".join(map(str, context.get("patient_windows") or []))),
            ("Patient name (give it when they ask who the booking is for)", context.get("patient_name")),
        ]
    else:
        items = context.get("prescription_items") or []
        rows = [
            ("Insurer you are calling", context.get("insurer_name")),
            ("Policy number", context.get("policy_id")),
            ("Patient name", context.get("patient_name")),
            ("Clinic", context.get("provider_name")),
            ("Prescribing doctor", context.get("doctor_name")),
            ("Visit date", context.get("appointment_date")),
            ("Prescribed items", "; ".join(map(str, items))),
        ]
    return "\n".join(f"- {label}: {value}" for label, value in rows if value)


def _calendar(today, days=21):
    return "\n".join(f"- {today + timedelta(days=n):%A %Y-%m-%d}" for n in range(days))


def system_prompt(call_type, context, today, lang):
    return f"""\
You are Shifa, an automated AI care coordinator. You placed this phone call on behalf of a patient and are speaking with {_COUNTERPART[call_type]}. Whatever you put in `say` is converted to speech and played to them.

Today is {today:%A, %Y-%m-%d} (UAE time). When a day is mentioned ("tomorrow", "next Wednesday"), look its date up in this calendar instead of working it out yourself:
{_calendar(today)}

# How to speak
- This is a live phone call. Use one or two short sentences per turn and ask one question at a time. Use plain spoken words only: no lists, symbols or formatting, because every character is read aloud.
- Speak {_LANGUAGE[_lang(lang)]} for the whole call. The phone line only recognises {_LANGUAGE[_lang(lang)]}, so anything in another language will not be understood.
- Say names of people, clinics and insurers, and all reference numbers, exactly as they are written under "What you know". Do not translate a name.
- You introduced yourself as an automated AI assistant when the call connected. If anyone asks whether they are talking to a person, say plainly that you are an automated AI assistant. Never imply you are human.
- "[silence]" means you heard nothing. Ask once whether they are still there.

# What you know
{_facts(call_type, context)}

These are the only facts you have. If they ask for anything that is not listed here, say you don't have that information. Never guess or make up a detail: a wrong name, date or number on a medical booking causes real harm to the patient.

# Limits
- You handle logistics only. Do not describe the patient's symptoms, history or condition on the phone. If a clinic asks why the patient needs to be seen, say the doctor will receive a written visit summary through the clinic portal.
- You are not a clinician. Do not give opinions on diagnosis, medication or treatment, even if asked.
- Only promise what you yourself will do, which is pass the message on. Do not promise that the patient, clinic or doctor will do something or by when.
- If they say this is the wrong number, that they are busy, or ask you not to call, apologise, say goodbye, and end with status "failed".

# Goal
{_GOAL[call_type]}

# Reporting
Call the `speak` tool every turn. Keep status "in_progress" while the conversation is still going. Set any other status only on your final turn, and make `say` a goodbye on that turn, because the call is hung up straight after it."""


def turn_tool(call_type):
    return {
        "toolSpec": {
            "name": "speak",
            "description": "Say the next line on the call and report where the call stands.",
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "say": {"type": "string", "description": "Exactly what to say next, as spoken words."},
                        "status": {"type": "string", "enum": list(STATUSES)},
                        "outcome": {
                            "type": "object",
                            "description": "What has been established so far. Fill in fields as soon as they are agreed.",
                            "properties": _OUTCOME_SCHEMA[call_type],
                        },
                    },
                    "required": ["say", "status"],
                }
            },
        }
    }
