import os, json, urllib.parse, urllib.request, boto3
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

REGION = "us-west-2"
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")
GUARDRAIL_ID = os.environ.get("GUARDRAIL_ID", "")
GUARDRAIL_VERSION = os.environ.get("GUARDRAIL_VERSION", "3")
# The gateway MCP URL is injected by the AgentCore CLI at deploy as
# AGENTCORE_GATEWAY_<NAME>_URL (gateway "workshop-gateway" -> WORKSHOP_GATEWAY).
GATEWAY_URL = os.environ.get("AGENTCORE_GATEWAY_WORKSHOP_GATEWAY_URL", os.environ.get("GATEWAY_URL", ""))
TOKEN_ENDPOINT = os.environ.get("GATEWAY_TOKEN_ENDPOINT", "")
CLIENT_ID = os.environ.get("GATEWAY_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GATEWAY_CLIENT_SECRET", "")
SCOPE = os.environ.get("GATEWAY_SCOPE", "")

SYSTEM_PROMPT = """You are Health Companion. You help people navigate care: triage urgency,
check history and medications, find a provider, book, and prepare a visit summary.
You never diagnose, prescribe, or recommend medication doses. If asked, decline briefly
and point to a professional or emergency services. Always note this is not medical advice.

Red flags override everything: sudden worst-ever headache, one-sided weakness or numbness,
slurred speech, sudden vision loss, stiff neck with fever, fainting, chest pain, or trouble
breathing. Then tell the person to call emergency services or go to the nearest emergency
department now, and do not book an appointment."""

def _gateway_token():
    body = urllib.parse.urlencode({"grant_type": "client_credentials",
        "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "scope": SCOPE}).encode()
    req = urllib.request.Request(TOKEN_ENDPOINT, data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req) as r:
        return json.load(r)["access_token"]

def _gateway_client():
    token = _gateway_token()
    return MCPClient(lambda: streamablehttp_client(GATEWAY_URL,
        headers={"Authorization": f"Bearer {token}"}))

# The shared Bedrock Guardrail checks each question before the agent sees it, so
# diagnosis/dosing/treatment requests are refused outside the model. Checking only the
# question (not tool results or answers) stops a patient's own medication list from
# tripping the dosing topic.
bedrock = boto3.client("bedrock-runtime", region_name=REGION)

def _guardrail_refusal(prompt):
    if not GUARDRAIL_ID:
        return None
    r = bedrock.apply_guardrail(guardrailIdentifier=GUARDRAIL_ID, guardrailVersion=GUARDRAIL_VERSION,
                                source="INPUT", content=[{"text": {"text": prompt}}])
    if r["action"] == "GUARDRAIL_INTERVENED":
        return "".join(o.get("text", "") for o in r.get("outputs", []))
    return None

app = BedrockAgentCoreApp()
model = BedrockModel(model_id=MODEL_ID, region_name=REGION)

@app.entrypoint
def handler(event):
    prompt = event.get("prompt", "")
    if not isinstance(prompt, str) or not prompt.strip():
        return "Please describe your symptoms or what you need help with."
    refusal = _guardrail_refusal(prompt)
    if refusal:
        return refusal
    # The patient id travels in the payload, not the chat text, so the guardrail's
    # prompt-attack filter doesn't read "I am patient X" as a role-play attempt.
    system_prompt = SYSTEM_PROMPT
    if patient_id := event.get("patient_id"):
        system_prompt += f"\n\nThe person you are helping is patient {patient_id}. Look up their profile with get_patient_profile."
    history = event.get("history", "")
    message = f"Conversation so far:\n{history}\n\nNew message: {prompt}" if history else prompt
    if GATEWAY_URL:
        gw = _gateway_client()
        with gw:
            agent = Agent(model=model, system_prompt=system_prompt, tools=gw.list_tools_sync())
            return str(agent(message))
    agent = Agent(model=model, system_prompt=system_prompt)
    return str(agent(message))

app.run()
