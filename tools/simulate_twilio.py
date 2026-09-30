"""Play Twilio's part against the deployed call Lambda: no phone or Twilio account needed.

    python tools/simulate_twilio.py booking
    python tools/simulate_twilio.py insurance --lang ar

Creates a call record (without dialing), then posts signed webhook requests to the
real Function URL, with whatever you type standing in for the recognised speech.
Replies can also be piped in, one per line.
"""

import argparse
import base64
import hashlib
import hmac
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import boto3

ROOT = Path(__file__).resolve().parent.parent
REGION = "us-west-2"
FUNCTION = "workshop-shifa-calls"
SSM_PATH = "/app/workshop/shifa"


def post(url, params, token):
    payload = url + "".join(k + v for k, v in sorted(params.items()))
    signature = base64.b64encode(hmac.new(token.encode(), payload.encode(), hashlib.sha1).digest()).decode()
    request = Request(url, data=urlencode(params).encode(), headers={"X-Twilio-Signature": signature})
    try:
        with urlopen(request, timeout=20) as response:
            return response.status, response.read().decode()
    except HTTPError as error:
        return error.code, error.read().decode()


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("call_type", choices=["booking", "insurance"])
    parser.add_argument("--lang", choices=["en", "ar"], default="en")
    parser.add_argument("--context", type=Path, help="JSON file of call facts (default: tools/fixtures/<call_type>.json)")
    args = parser.parse_args()

    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")

    ssm = boto3.client("ssm", region_name=REGION)
    config = {
        p["Name"][len(SSM_PATH) + 1 :]: p["Value"]
        for page in ssm.get_paginator("get_parameters_by_path").paginate(Path=SSM_PATH, Recursive=True, WithDecryption=True)
        for p in page["Parameters"]
    }
    token = config.get("twilio/auth-token")
    if not token:
        sys.exit(f"No auth token at {SSM_PATH}/twilio/auth-token; the webhook refuses everything until one is set.")

    context_path = args.context or ROOT / "tools" / "fixtures" / f"{args.call_type}.json"
    start = {
        "call_type": args.call_type,
        "lang": args.lang,
        "journey_id": "simulated",
        "context": json.loads(context_path.read_text(encoding="utf-8")),
        "dry_run": True,
    }
    invoked = boto3.client("lambda", region_name=REGION).invoke(FunctionName=FUNCTION, Payload=json.dumps(start))
    result = json.load(invoked["Payload"])
    if "call_id" not in result:
        sys.exit(f"could not start the call: {result}")
    call_id = result["call_id"]
    url = f"{config['calls/webhook-url']}?call={call_id}"

    params = {"CallSid": "CA-simulated"}
    while True:
        status, body = post(url, params, token)
        if status != 200:
            sys.exit(f"webhook returned {status}: {body}")
        twiml = ET.fromstring(body)
        print(f"\nSHIFA: {''.join(say.text or '' for say in twiml.iter('Say'))}")
        if twiml.find("Hangup") is not None:
            break
        try:
            params = {"CallSid": "CA-simulated", "SpeechResult": input("YOU:   ")}
        except EOFError:
            print("\n--- input ended; simulating the other side hanging up ---")
            post(f"{url}&event=status", {"CallSid": "CA-simulated", "CallStatus": "completed"}, token)
            break

    table = boto3.resource("dynamodb", region_name=REGION).Table(config["calls/table"])
    record = table.get_item(Key={"call_id": call_id}, ConsistentRead=True)["Item"]
    print(f"\n--- call record {call_id}: {record['status']} ---")
    print(json.dumps(record["outcome"], indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
