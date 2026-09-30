"""Place a real outbound call through the deployed Lambda and wait for the result.

    python tools/place_call.py booking +9715XXXXXXXX
    python tools/place_call.py insurance +9715XXXXXXXX --lang ar

The number rings, Shifa talks to whoever answers, and the outcome is printed.
Needs the Twilio parameters in SSM (see deploy.sh) and, on a Twilio trial
account, the number to be a verified caller ID.
"""

import argparse
import json
import sys
import time
from pathlib import Path

import boto3

ROOT = Path(__file__).resolve().parent.parent
REGION = "us-west-2"
FUNCTION = "workshop-shifa-calls"
TABLE = "workshop-shifa-calls"
WAIT_SECONDS = 180


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("call_type", choices=["booking", "insurance"])
    parser.add_argument("to_number", help="phone to ring, E.164, e.g. +9715XXXXXXXX")
    parser.add_argument("--lang", choices=["en", "ar"], default="en")
    parser.add_argument("--context", type=Path, help="JSON file of call facts (default: tools/fixtures/<call_type>.json)")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    context_path = args.context or ROOT / "tools" / "fixtures" / f"{args.call_type}.json"
    payload = {
        "call_type": args.call_type,
        "to_number": args.to_number,
        "lang": args.lang,
        "journey_id": "manual-test",
        "context": json.loads(context_path.read_text(encoding="utf-8")),
    }
    invoked = boto3.client("lambda", region_name=REGION).invoke(FunctionName=FUNCTION, Payload=json.dumps(payload))
    result = json.load(invoked["Payload"])
    if "call_id" not in result:
        sys.exit(f"could not place the call: {result.get('errorMessage', result)}")

    print(f"dialing {args.to_number} (call {result['call_id']}) ...")
    table = boto3.resource("dynamodb", region_name=REGION).Table(TABLE)
    deadline = time.time() + WAIT_SECONDS
    while True:
        record = table.get_item(Key={"call_id": result["call_id"]}, ConsistentRead=True)["Item"]
        if record["status"] not in ("dialing", "in_progress"):
            break
        if time.time() > deadline:
            print("Still open after 3 minutes: the phone was probably not answered (check Twilio Monitor → Logs → Calls).")
            break
        time.sleep(3)

    for line in record["history"]:
        print(f"{'SHIFA' if line['role'] == 'shifa' else 'THEM '}: {line['text']}")
    print(f"\n--- {record['status']} ---")
    print(json.dumps(record["outcome"], indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
