"""Rehearse an outbound call in the terminal: Shifa speaks, you play the clinic or insurer.

    python tools/simulate_call.py booking
    python tools/simulate_call.py insurance --lang ar

Uses the same brain as the deployed Lex code hook, against real Bedrock.
Replies can also be piped in, one per line, for a scripted run.
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lambda_functions" / "call_fulfillment"))

import brain  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("call_type", choices=["booking", "insurance"])
    parser.add_argument("--lang", choices=["en", "ar"], default="en", help="language of the opening line")
    parser.add_argument("--context", type=Path, help="JSON file of call facts (default: tools/fixtures/<call_type>.json)")
    args = parser.parse_args()

    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")

    context_path = args.context or ROOT / "tools" / "fixtures" / f"{args.call_type}.json"
    context = json.loads(context_path.read_text(encoding="utf-8"))

    history, heard = [], None
    while True:
        turn = brain.next_turn(args.call_type, context, history, heard, args.lang)
        if heard is not None:
            history.append({"role": "other", "text": heard})
        history.append({"role": "shifa", "text": turn["say"]})
        print(f"\nSHIFA: {turn['say']}")
        if turn["status"] != "in_progress":
            print(f"\n--- call ended: {turn['status']} ---")
            print(json.dumps(turn["outcome"], indent=2, ensure_ascii=False))
            return
        try:
            heard = input("YOU:   ")
        except EOFError:
            print("\n--- input ended before the call did ---")
            return


if __name__ == "__main__":
    main()
