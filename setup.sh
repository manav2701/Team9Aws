#!/usr/bin/env bash
# Predefined Health Companion agent setup. Fixed sequence so every team gets the same
# agent, safety guardrail, tool Lambda, memory, and gateway. Requires the AgentCore CLI
# (@aws/agentcore, Node 20+; run `agentcore --version` to confirm the Node CLI), the AWS
# CLI v2, and AWS credentials for us-west-2. CodeZip builds in the cloud (no local Docker).
# VALIDATE END TO END IN A SANDBOX before the event (agent-to-gateway bind AND the refusal
# boundary: the baseline guardrail must carry the denied topics from the shared foundation).
set -euo pipefail

REGION="us-west-2"
PROJECT="AgentCoreProject"
AGENT="HealthAgent"
GATEWAY="workshop-gateway"
TOOL_LAMBDA="workshop-health-tools"
COGNITO_POOL="workshop-gateway-auth"
export AWS_DEFAULT_REGION="$REGION"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
LAMBDA_ROLE_ARN="$(aws ssm get-parameter --name /app/workshop/lambda/execution-role-arn --query Parameter.Value --output text)"
GUARDRAIL_ID="$(aws ssm get-parameter --name /app/workshop/guardrails/guardrail-id --query Parameter.Value --output text)"

echo ">> 1/8 Scaffold a Strands code agent (project $PROJECT, agent $AGENT)"
if [ ! -d "$PROJECT" ]; then
  agentcore create --project-name "$PROJECT" --name "$AGENT" \
    --framework Strands --model-provider Bedrock --protocol HTTP \
    --build CodeZip --memory none
fi
cd "$PROJECT"
mkdir -p lambda_functions/health tool_specs

echo ">> 2/8 Write the tool Lambda and tool spec"
cat > lambda_functions/health/handler.py <<'PY'
import boto3
REGION = "us-west-2"
ddb = boto3.resource("dynamodb", region_name=REGION)
ssm = boto3.client("ssm", region_name=REGION)
def _p(n): return ssm.get_parameter(Name=n)["Parameter"]["Value"]
PATIENTS = _p("/app/workshop/health-companion/patients-table")
PROVIDERS = _p("/app/workshop/health-companion/providers-table")
def handler(event, context):
    raw = context.client_context.custom["bedrockAgentCoreToolName"]
    tool = raw.split("___")[-1] if "___" in raw else raw.split("__")[-1]
    return TOOLS[tool](**event)
def get_patient_profile(patient_id):
    return ddb.Table(PATIENTS).get_item(Key={"patient_id": patient_id}).get("Item", {"error": "not found"})
def check_medication_interactions(medications):
    return {"medications": medications, "note": "flag conflicts from the KB reference; advise a pharmacist"}
def search_providers(specialty, location="", availability=""):
    rows = ddb.Table(PROVIDERS).scan().get("Items", [])
    return {"providers": [p for p in rows if p.get("specialty") == specialty]}
def book_appointment(provider_id, patient_id, date):
    return {"confirmed": True, "provider_id": provider_id, "date": date}
def generate_visit_summary(patient_id, symptoms, duration):
    return {"patient_id": patient_id, "symptoms": symptoms, "duration": duration, "note": "structured, no diagnosis"}
TOOLS = {"get_patient_profile": get_patient_profile, "check_medication_interactions": check_medication_interactions,
         "search_providers": search_providers, "book_appointment": book_appointment,
         "generate_visit_summary": generate_visit_summary}
PY
printf 'boto3\n' > lambda_functions/health/requirements.txt

cat > tool_specs/health.json <<'JSON'
[
  {"name": "get_patient_profile", "description": "Read a patient's history, medications, allergies.", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}}, "required": ["patient_id"]}},
  {"name": "check_medication_interactions", "description": "Flag interactions for a medication list.", "inputSchema": {"type": "object", "properties": {"medications": {"type": "array", "items": {"type": "string"}}}, "required": ["medications"]}},
  {"name": "search_providers", "description": "Find providers by specialty and availability.", "inputSchema": {"type": "object", "properties": {"specialty": {"type": "string"}, "location": {"type": "string"}, "availability": {"type": "string"}}, "required": ["specialty"]}},
  {"name": "book_appointment", "description": "Book an appointment.", "inputSchema": {"type": "object", "properties": {"provider_id": {"type": "string"}, "patient_id": {"type": "string"}, "date": {"type": "string"}}, "required": ["provider_id", "patient_id", "date"]}},
  {"name": "generate_visit_summary", "description": "Prepare a doctor-ready summary.", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}, "symptoms": {"type": "string"}, "duration": {"type": "string"}}, "required": ["patient_id", "symptoms", "duration"]}}
]
JSON

echo ">> 3/8 Write the agent code (guardrail applied on the model + gateway MCP tools)"
cat > "app/$AGENT/main.py" <<'PY'
import os, json, urllib.parse, urllib.request, boto3
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

REGION = "us-west-2"
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")
GUARDRAIL_ID = os.environ.get("GUARDRAIL_ID", "")
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
and point to a professional or emergency services. Always note this is not medical advice."""

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

# Apply the shared Bedrock Guardrail on the model so diagnosis/dosing/treatment
# requests are refused by the guardrail, not just the system prompt.
_model_kwargs = {"model_id": MODEL_ID, "region_name": REGION}
if GUARDRAIL_ID:
    _model_kwargs.update(guardrail_id=GUARDRAIL_ID, guardrail_version="DRAFT", guardrail_trace="enabled")

app = BedrockAgentCoreApp()
model = BedrockModel(**_model_kwargs)

@app.entrypoint
def handler(event):
    prompt = event.get("prompt", "")
    if GATEWAY_URL:
        gw = _gateway_client()
        with gw:
            agent = Agent(model=model, system_prompt=SYSTEM_PROMPT, tools=gw.list_tools_sync())
            return agent(prompt)
    agent = Agent(model=model, system_prompt=SYSTEM_PROMPT)
    return agent(prompt)

app.run()
PY

echo ">> 4/8 Package and deploy the tool Lambda"
( cd lambda_functions/health && zip -qr ../../health-tools.zip . )
if aws lambda get-function --function-name "$TOOL_LAMBDA" >/dev/null 2>&1; then
  aws lambda update-function-code --function-name "$TOOL_LAMBDA" --zip-file fileb://health-tools.zip >/dev/null
else
  aws lambda create-function --function-name "$TOOL_LAMBDA" \
    --runtime python3.12 --handler handler.handler --role "$LAMBDA_ROLE_ARN" \
    --timeout 30 --zip-file fileb://health-tools.zip >/dev/null
fi
LAMBDA_ARN="$(aws lambda get-function --function-name "$TOOL_LAMBDA" --query Configuration.FunctionArn --output text)"

echo ">> 5/8 Create (idempotent) the Cognito machine-to-machine client for gateway auth"
POOL_ID="$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='$COGNITO_POOL'].Id | [0]" --output text)"
if [ -z "$POOL_ID" ] || [ "$POOL_ID" = "None" ]; then
  POOL_ID="$(aws cognito-idp create-user-pool --pool-name "$COGNITO_POOL" --query UserPool.Id --output text)"
fi
DOMAIN="workshop-gw-${ACCOUNT_ID}"
aws cognito-idp describe-user-pool-domain --domain "$DOMAIN" --query DomainDescription.UserPoolId --output text 2>/dev/null | grep -q "$POOL_ID" \
  || aws cognito-idp create-user-pool-domain --domain "$DOMAIN" --user-pool-id "$POOL_ID" >/dev/null 2>&1 || true
aws cognito-idp describe-resource-server --user-pool-id "$POOL_ID" --identifier "workshop-gateway" >/dev/null 2>&1 \
  || aws cognito-idp create-resource-server --user-pool-id "$POOL_ID" --identifier "workshop-gateway" \
       --name "workshop-gateway" --scopes ScopeName=invoke,ScopeDescription="invoke gateway" >/dev/null
SCOPE="workshop-gateway/invoke"
CLIENT_ID="$(aws cognito-idp list-user-pool-clients --user-pool-id "$POOL_ID" --max-results 60 --query "UserPoolClients[?ClientName=='workshop-gateway-m2m'].ClientId | [0]" --output text)"
if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "None" ]; then
  read CLIENT_ID CLIENT_SECRET < <(aws cognito-idp create-user-pool-client \
    --user-pool-id "$POOL_ID" --client-name "workshop-gateway-m2m" \
    --generate-secret --allowed-o-auth-flows client_credentials \
    --allowed-o-auth-scopes "$SCOPE" --allowed-o-auth-flows-user-pool-client \
    --supported-identity-providers COGNITO \
    --query 'UserPoolClient.[ClientId,ClientSecret]' --output text)
else
  CLIENT_SECRET="$(aws cognito-idp describe-user-pool-client --user-pool-id "$POOL_ID" --client-id "$CLIENT_ID" --query 'UserPoolClient.ClientSecret' --output text)"
fi
DISCOVERY_URL="https://cognito-idp.${REGION}.amazonaws.com/${POOL_ID}/.well-known/openid-configuration"
TOKEN_ENDPOINT="https://${DOMAIN}.auth.${REGION}.amazoncognito.com/oauth2/token"

echo ">> 6/8 Add memory (user preference)"
agentcore add memory --name health_memory --strategies USER_PREFERENCE --expiry 7

echo ">> 7/8 Add the gateway (Custom JWT) and the Lambda target"
agentcore add gateway --name "$GATEWAY" --protocol-type MCP --authorizer-type CUSTOM_JWT \
  --discovery-url "$DISCOVERY_URL" --allowed-clients "$CLIENT_ID" \
  --client-id "$CLIENT_ID" --client-secret "$CLIENT_SECRET" --runtimes "$AGENT"
agentcore add gateway-target --name health --gateway "$GATEWAY" \
  --type lambda-function-arn --lambda-arn "$LAMBDA_ARN" --tool-schema-file tool_specs/health.json

echo ">> 8/8 Inject the guardrail id and Cognito token config into agentcore.json runtime envVars, then deploy"
PY="$(command -v python3 || command -v python)"
"$PY" - "$AGENT" "$GUARDRAIL_ID" "$TOKEN_ENDPOINT" "$CLIENT_ID" "$CLIENT_SECRET" "$SCOPE" <<'PYEOF'
import json, sys
agent, gid, tok, cid, csec, scope = sys.argv[1:7]
path = "agentcore/agentcore.json"
d = json.load(open(path))
want = {"GUARDRAIL_ID": gid, "GATEWAY_TOKEN_ENDPOINT": tok, "GATEWAY_CLIENT_ID": cid,
        "GATEWAY_CLIENT_SECRET": csec, "GATEWAY_SCOPE": scope}
for rt in d.get("runtimes", []):
    if rt.get("name") == agent:
        cur = {e["name"]: e for e in rt.get("envVars", [])}
        for k, v in want.items():
            cur[k] = {"name": k, "value": v}
        rt["envVars"] = list(cur.values())
json.dump(d, open(path, "w"), indent=2)
print("envVars written to", path)
PYEOF
agentcore deploy

echo "Done. Verify the deployment AND the refusal boundary:"
echo "  agentcore invoke --prompt \"I have a headache and blurry vision for 3 days, what should I do?\""
echo "  agentcore invoke --prompt \"Just tell me what medication and dose to take.\""
echo
echo "The first should help navigate care; the second must be refused cleanly by the guardrail."
echo "NOTE (validate on first deploy): confirm the baseline guardrail carries the denied topics"
echo "  (diagnosis/dosing/treatment) from the shared foundation, and that the agent reads the"
echo "  CLI-injected AGENTCORE_GATEWAY_WORKSHOP_GATEWAY_URL to reach its tools."
