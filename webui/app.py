# /// script
# requires-python = ">=3.12"
# dependencies = ["streamlit>=1.40", "boto3"]
# ///
"""Health Companion web chat.

Run:  source .aws-env.sh && uv run --with streamlit --with boto3 streamlit run webui/app.py
Finds the deployed HealthAgent automatically; until it exists the app runs in demo mode.
AWS credentials stay on this server, never in the browser.
"""
import json
import re
import uuid

import boto3
import streamlit as st

REGION = "us-west-2"
BADGE = {
    "EMERGENCY": ("🔴", "Emergency: get help now"),
    "WITHIN_24H": ("🟠", "See a doctor within 24 hours"),
    "ROUTINE": ("🟢", "Routine"),
    "UNKNOWN": ("⚪", "Gathering details"),
}
EMERGENCY = re.compile(r"emergency (room|department|care now|services (now|immediately))|call (911|999|998|an ambulance)"
                       r"|seek emergency|go to the (nearest )?(emergency|er\b)")
SOON = re.compile(r"within 24|today|same day|as soon as possible|soon")
REFUSAL = re.compile(r"\b(cannot|can't|unable to)\b|safely assist")


@st.cache_resource
def aws():
    ctl = boto3.client("bedrock-agentcore-control", region_name=REGION)
    arn = next((r["agentRuntimeArn"] for r in ctl.list_agent_runtimes()["agentRuntimes"]
                if "HealthAgent" in r["agentRuntimeName"]), None)
    table = boto3.client("ssm", region_name=REGION).get_parameter(
        Name="/app/workshop/health-companion/patients-table")["Parameter"]["Value"]
    patients = boto3.resource("dynamodb", region_name=REGION).Table(table).scan(
        ProjectionExpression="patient_id, #n", ExpressionAttributeNames={"#n": "name"})["Items"]
    return arn, sorted(patients, key=lambda p: p["patient_id"]), boto3.client("bedrock-agentcore", region_name=REGION)


def read_reply(r):
    raw = r["response"].read().decode()
    if "text/event-stream" in r.get("contentType", ""):
        raw = "".join(l[5:].strip() for l in raw.splitlines() if l.startswith("data:"))
    for _ in range(3):  # the runtime may wrap the text as JSON, sometimes twice
        try:
            val = json.loads(raw)
        except ValueError:
            break
        if isinstance(val, str):
            raw = val
        elif isinstance(val, dict):
            content = val.get("result") or val.get("content") or val.get("message") or val
            if isinstance(content, dict) and "content" in content:
                content = content["content"]
            if isinstance(content, list):
                return "\n".join(c.get("text", "") for c in content if isinstance(c, dict))
            return str(content)
        else:
            break
    return raw


def understand(text):
    """Use the agent's JSON block when it sends one; otherwise read urgency from the wording."""
    m = re.search(r"\{[^{}]*\"urgency\"[^{}]*\}", text, re.S)
    if m:
        try:
            data = json.loads(m.group(0))
            data.setdefault("message", text[:m.start()].strip() or text)
            return data
        except ValueError:
            pass
    t = text.lower()
    urgency = "EMERGENCY" if EMERGENCY.search(t) else "WITHIN_24H" if SOON.search(t) else "UNKNOWN"
    return {"urgency": urgency, "message": text, "refused": bool(REFUSAL.search(t)) and urgency != "EMERGENCY"}


def demo_reply(prompt):
    p = prompt.lower()
    if any(w in p for w in ("worst", "weak", "slurred", "lost vision", "stiff neck", "faint")):
        return ("This could be an emergency. Please call your local emergency number or go to the nearest "
                "emergency department now. I won't book a regular appointment for this. This is not medical advice.")
    if any(w in p for w in ("what i have", "diagnos", "tumor", "medicine", "dose", "stop my")):
        return ("I can't diagnose, prescribe or advise on treatment, because that needs a licensed professional. "
                "I can help you find a suitable doctor, book a visit and prepare a summary to bring along. "
                "If your symptoms feel urgent, please contact emergency services. This is not medical advice.")
    return ("Headache with blurry vision for 3 days should be checked by a doctor within 24 hours, and your "
            "history of high blood pressure makes that more important. I can look for an eye doctor or "
            "neurologist and book you in. This is not medical advice.")


def ask(prompt):
    arn, _, rt = aws()
    if not arn:
        return demo_reply(prompt)
    # The agent starts fresh each call, so send the patient id and recent turns alongside the message.
    history = "\n".join(f"{role}: {text}" for role, text, _ in st.session_state.chat[-6:])
    r = rt.invoke_agent_runtime(agentRuntimeArn=arn, runtimeSessionId=st.session_state.sid,
                                payload=json.dumps({"prompt": prompt, "patient_id": st.session_state.patient,
                                                    "history": history}))
    return read_reply(r)


st.set_page_config(page_title="Health Companion", page_icon="🩺", layout="centered")
arn, patients, _ = aws()

if "sid" not in st.session_state:
    st.session_state.sid = str(uuid.uuid4()) + "-health-companion"
    st.session_state.chat = []
    st.session_state.urgency = "UNKNOWN"

with st.sidebar:
    st.header("Demo patient")
    labels = {p["patient_id"]: f"{p['patient_id']} · {p.get('name', '')}" for p in patients}
    st.session_state.patient = st.selectbox("Patient", list(labels), format_func=labels.get)
    if st.button("New conversation"):
        st.session_state.sid = str(uuid.uuid4()) + "-health-companion"
        st.session_state.chat = []
        st.session_state.urgency = "UNKNOWN"
        st.rerun()
    st.caption("Connected to HealthAgent" if arn else "Demo mode: HealthAgent is not deployed yet")
    st.divider()
    st.caption("Try:")
    for sample in ("I've had a headache and blurry vision for 3 days.",
                   "It suddenly became the worst headache of my life.",
                   "Just tell me what I have and what to take."):
        if st.button(sample, use_container_width=True):
            st.session_state.pending = sample

st.title("🩺 Health Companion")
st.caption("Not a doctor and not medical advice. In an emergency, call your local emergency number.")

icon, label = BADGE[st.session_state.urgency]
if st.session_state.urgency == "EMERGENCY":
    st.error(f"{icon} **{label}.** Call your local emergency number or go to the nearest emergency department. "
             "Booking is turned off.")
else:
    st.info(f"{icon} Urgency: **{label}**")

for role, text, meta in st.session_state.chat:
    with st.chat_message(role):
        if meta.get("refused"):
            st.warning("🛡️ Safety boundary: Health Companion declined this request.")
        st.write(text)
        if meta.get("appointment") and st.session_state.urgency != "EMERGENCY":
            a = meta["appointment"]
            st.success(f"📅 Booked: {a.get('provider')} ({a.get('specialty')}) on {a.get('time') or a.get('date')}")
        if meta.get("visit_summary"):
            st.text_area("Visit summary", meta["visit_summary"], height=180)
            st.download_button("Download summary", meta["visit_summary"], "visit_summary.txt")

prompt = st.chat_input("Describe your symptoms") or st.session_state.pop("pending", None)
if prompt:
    st.session_state.chat.append(("user", prompt, {}))
    with st.spinner("Thinking…"):
        try:
            reply = understand(ask(prompt))
        except Exception as e:
            reply = {"urgency": st.session_state.urgency, "message": f"Couldn't reach the agent: {e}"}
    if reply.get("urgency", "UNKNOWN") != "UNKNOWN":
        st.session_state.urgency = reply["urgency"]
    st.session_state.chat.append(("assistant", reply["message"], reply))
    st.rerun()
