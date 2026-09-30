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
