# /// script
# requires-python = ">=3.12"
# dependencies = ["boto3"]
# ///
"""Read-only: show the shared guardrail and test the 18 prompts against it directly.

No agent needed, nothing is changed. Usage:
  uv run safety/guardrail_check.py              # tests the DRAFT
  uv run safety/guardrail_check.py --version 2  # tests a saved version
"""
import argparse

import boto3

from cases import CASES

REGION = "us-west-2"
ssm = boto3.client("ssm", region_name=REGION)
br = boto3.client("bedrock", region_name=REGION)
brt = boto3.client("bedrock-runtime", region_name=REGION)
GID = ssm.get_parameter(Name="/app/workshop/guardrails/guardrail-id")["Parameter"]["Value"]

parser = argparse.ArgumentParser()
parser.add_argument("--version", default="DRAFT")
args = parser.parse_args()

g = br.get_guardrail(guardrailIdentifier=GID, guardrailVersion=args.version)
print(f"Guardrail {g['name']} ({GID}) version {g['version']}")
versions = [v["version"] for v in br.list_guardrails(guardrailIdentifier=GID)["guardrails"]]
print("Saved versions:", ", ".join(versions))
print("\nDenied topics:")
for t in g.get("topicPolicy", {}).get("topics", []):
    print(f"  - {t['name']}: {t['definition']}")
    for e in t.get("examples", []):
        print(f"      e.g. {e}")
print("\nContent filters:", ", ".join(f["type"] for f in g.get("contentPolicy", {}).get("filters", [])))
print("Blocked input message: ", g["blockedInputMessaging"])
print("Blocked output message:", g["blockedOutputsMessaging"])

print(f"\nTesting the 18 prompts against version {args.version} (input side):")
passed = 0
for cid, kind, prompt, expected, _ in CASES:
    r = brt.apply_guardrail(guardrailIdentifier=GID, guardrailVersion=args.version,
                            source="INPUT", content=[{"text": {"text": prompt}}])
    blocked = r["action"] == "GUARDRAIL_INTERVENED"
    hits = [t["name"] for a in r.get("assessments", [])
            for t in a.get("topicPolicy", {}).get("topics", [])]
    hits += [f["type"] for a in r.get("assessments", [])
             for f in a.get("contentPolicy", {}).get("filters", []) if f.get("action") == "BLOCKED"]
    ok = expected == "EITHER" or (expected == "BLOCK") == blocked
    passed += ok
    status = "PASS" if ok else "FAIL"
    got = "BLOCK" if blocked else "ALLOW"
    print(f"{status} | #{cid:<2} {kind:<8} | want {expected:<6} got {got:<5} {','.join(hits):<28} | {prompt}")
print(f"\n{passed}/{len(CASES)} passed (guardrail only)")
