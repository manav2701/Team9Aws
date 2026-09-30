# Outbound calls (M2)

Shifa phones a clinic to book an appointment, or an insurer to get pre-approval, and reports the result.

The workshop AWS role has no access to Amazon Connect, Lex, Polly, Transcribe or Step Functions, so this does not follow the main README. Calls go through **Twilio** (phone line, speech-to-text, text-to-speech). One Lambda, `workshop-shifa-calls`, places the call and runs the conversation with Bedrock (Claude Haiku 4.5).

## Start a call

Invoke the Lambda `workshop-shifa-calls`:

```json
{
  "journey_id": "abc-123",
  "call_type": "booking",
  "to_number": "+9715XXXXXXXX",
  "lang": "en",
  "context": {
    "provider_name": "Al Noor Neurology Clinic",
    "specialty": "neurology",
    "urgency": "SOON",
    "patient_windows": ["Thursday 2026-10-01, 09:00 to 12:00"],
    "patient_name": "Test Patient One"
  }
}
```

- `call_type` is `booking` or `insurance`. `lang` is `en` or `ar` and fixes the language for the whole call.
- `context` is everything Shifa is allowed to say. Anything missing, it tells the other party it does not have.
- For `insurance` the context fields are `insurer_name`, `policy_id`, `patient_name`, `provider_name`, `doctor_name`, `appointment_date`, `prescription_items` (list of strings).
- It returns `{"call_id": "..."}` as soon as the phone is dialing.

The `journeys` schema has no `patient_name`, `policy_id` or `insurer_name` yet. Whoever starts the call has to supply them.

## Get the result

When the call ends, a message is published to the SNS topic `workshop-shifa-call-results`:

```json
{
  "call_id": "...",
  "journey_id": "abc-123",
  "call_type": "booking",
  "status": "success",
  "outcome": {"weekday": "Thursday", "date": "2026-10-01", "time": "10:30", "doctor_name": "Dr. Hassan"}
}
```

| `status` | Meaning | `outcome` |
|---|---|---|
| `success` | Booked, or approved | booking: `weekday`, `date`, `time`, `doctor_name`, maybe `confirmation_ref`. insurance: `approval_reference` |
| `needs_info` | Insurer wants more (insurance only) | `info_needed`: list |
| `failed` | Did not happen | `reason`: `no_slot`, `rejected`, `wrong_number`, `declined`, `unreachable`, `hung_up`, `turn_limit`, `other`. With `no_slot`, `alternatives` lists what the clinic offered |

The same record, plus the full transcript in `history`, is in the DynamoDB table `workshop-shifa-calls` under `call_id`. Records expire after 7 days.

## Names that cannot change

The kit's Lambda role only reaches DynamoDB tables named `workshop-*` and SSM parameters under `/app/workshop/*`. Config is in SSM under `/app/workshop/shifa/`:

| Parameter | Set by |
|---|---|
| `calls/webhook-url`, `calls/table`, `calls/results-topic-arn` | `deploy.sh` |
| `twilio/account-sid`, `twilio/from-number`, `twilio/auth-token` (SecureString) | by hand, once |

## Run it

From the repo root, with `uv venv .venv && uv pip install -p .venv -r requirements-dev.txt` done once:

```bash
.venv/Scripts/python -m pytest tests                                # unit tests, no AWS needed
.venv/Scripts/python tools/simulate_call.py booking                 # rehearse in the terminal; you type the clinic's lines
.venv/Scripts/python tools/simulate_twilio.py booking               # same, through the deployed Lambda
.venv/Scripts/python tools/place_call.py booking +9715XXXXXXXX      # ring a real phone
./lambda_functions/call_fulfillment/deploy.sh                       # redeploy after a code change (Git Bash)
```

## Limits

- The Twilio account is a trial: it only calls verified numbers and plays a trial notice first.
- Trial requests arrive unsigned, so the webhook accepts an unsigned request only for a call that is open, keyed by its random call id. A request with a wrong signature is refused.
- The Arabic lines in `call_scripts.py` need a native speaker's review, and an Arabic call has not been tried on a real phone.
- Logs carry ids and states only. Do not log what was said.
