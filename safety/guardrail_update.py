# /// script
# requires-python = ">=3.12"
# dependencies = ["boto3"]
# ///
"""Improve the shared guardrail's denied topics and refusal messages, then save a new version.

Dry run by default: prints what would change. Nothing is written without --apply.
  uv run safety/guardrail_update.py           # preview
  uv run safety/guardrail_update.py --apply   # update DRAFT + create a version for Person 1

update_guardrail replaces the whole config, so every existing policy (content filters,
word lists, PII, grounding) is copied over from the current DRAFT unchanged.
"""
import argparse
import json

import boto3

REGION = "us-west-2"
ssm = boto3.client("ssm", region_name=REGION)
br = boto3.client("bedrock", region_name=REGION)
GID = ssm.get_parameter(Name="/app/workshop/guardrails/guardrail-id")["Parameter"]["Value"]

# Names match the baseline so other tracks' expectations don't shift; definitions are narrowed
# so stating a medication (#5) is allowed, and examples cover stopping medication (#18).
TOPICS = [
    {"name": "MedicalDiagnosis", "type": "DENY",
     "definition": "Naming or ruling out a new condition as the cause of symptoms, or acting as the user's doctor. Mentioning known history or which doctor to see is not diagnosis.",
     "examples": ["What disease do I have?", "Based on these symptoms, what is my diagnosis?",
                  "Is it a brain tumor?", "Just tell me what I have.", "Pretend you are my doctor and diagnose me."]},
    {"name": "MedicationDosing", "type": "DENY",
     "definition": "Recommending a specific drug for the user to take, or telling the user what dose or how much to take.",
     "examples": ["What medication and dose should I take?", "How many milligrams of this should I take?",
                  "What medicine should I take?", "Can I take double my usual painkiller dose?"]},
    {"name": "TreatmentRecommendation", "type": "DENY",
     "definition": "Telling the user how to treat a condition, or approving stopping or swapping a medication. Advising to see a doctor or seek emergency care is not treatment.",
     "examples": ["What treatment should I get for this?", "Tell me how to treat this condition at home.",
                  "Should I stop my blood pressure pills?", "My doctor said it's fine to stop my meds, confirm that."]},
]
BLOCKED_INPUT = ("I can't diagnose, prescribe or advise on treatment, because that needs a licensed professional. "
                 "I can help you find a suitable doctor, book a visit and prepare a summary to bring along. "
                 "If your symptoms feel urgent, please contact emergency services. This is not medical advice.")
BLOCKED_OUTPUT = ("I can't provide that, because it needs a licensed professional. I can help you find a doctor and "
                  "book a visit. If your symptoms feel urgent, please contact emergency services. This is not medical advice.")


def carry_over(g):
    """Turn get_guardrail output back into update_guardrail input for the policies we don't change."""
    cfg = {}
    if cp := g.get("contentPolicy"):
        cfg["contentPolicyConfig"] = {"filtersConfig": cp["filters"]}
        if cp.get("tier"):
            cfg["contentPolicyConfig"]["tierConfig"] = cp["tier"]
    if wp := g.get("wordPolicy"):
        words = [{"text": w["text"]} for w in wp.get("words", [])]
        lists = [{"type": m["type"]} for m in wp.get("managedWordLists", [])]
        # The API rejects empty lists, so send only the parts that exist.
        cfg["wordPolicyConfig"] = {k: v for k, v in (("wordsConfig", words), ("managedWordListsConfig", lists)) if v}
    if sp := g.get("sensitiveInformationPolicy"):
        cfg["sensitiveInformationPolicyConfig"] = {
            "piiEntitiesConfig": [{"type": e["type"], "action": e["action"]} for e in sp.get("piiEntities", [])],
            "regexesConfig": [{k: r[k] for k in ("name", "pattern", "action", "description") if k in r}
                              for r in sp.get("regexes", [])]}
    if gp := g.get("contextualGroundingPolicy"):
        cfg["contextualGroundingPolicyConfig"] = {"filtersConfig": [{"type": f["type"], "threshold": f["threshold"]}
                                                                    for f in gp["filters"]]}
    if cr := g.get("crossRegionDetails"):
        cfg["crossRegionConfig"] = {"guardrailProfileIdentifier": cr["guardrailProfileId"]}
    if g.get("kmsKeyArn"):
        cfg["kmsKeyId"] = g["kmsKeyArn"]
    return cfg


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true")
    a = p.parse_args()

    g = br.get_guardrail(guardrailIdentifier=GID)
    topic_cfg = {"topicsConfig": TOPICS}
    # Classic tier: Standard over-blocked plain symptom descriptions, including red flags.
    topic_cfg["tierConfig"] = {"tierName": "CLASSIC"}
    extra = carry_over(g)
    extra.setdefault("crossRegionConfig", {"guardrailProfileIdentifier": "us.guardrail.v1:0"})
    request = {"guardrailIdentifier": GID, "name": g["name"], "description": g.get("description", ""),
               "topicPolicyConfig": topic_cfg, "blockedInputMessaging": BLOCKED_INPUT,
               "blockedOutputsMessaging": BLOCKED_OUTPUT, **extra}

    kept = [k for k in request if k.endswith("Config") and k != "topicPolicyConfig"]
    print("Kept unchanged:", ", ".join(kept) or "nothing")
    print("\nNew denied topics:")
    for t in TOPICS:
        print(f"  - {t['name']}: {t['definition']}")
    print("\nNew blocked input message:\n ", BLOCKED_INPUT)

    if not a.apply:
        print("\nDry run only. Re-run with --apply to update the guardrail and create a version.")
        return
    br.update_guardrail(**request)
    version = br.create_guardrail_version(guardrailIdentifier=GID,
                                          description="Health Companion: narrowed dosing, stop-medication examples")["version"]
    print(json.dumps({"guardrail_id": GID, "version": version}))
    print(f"Give version {version} to Person 1, then run: uv run safety/guardrail_check.py --version {version}")


if __name__ == "__main__":
    main()
