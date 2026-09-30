# Health Companion rules (all teammates)

- The agent is a care navigator, not a doctor: it never diagnoses, prescribes, doses or gives treatment advice.
- Red flags (sudden worst headache, weakness, slurred speech, sudden vision loss, stiff neck with fever, fainting) → emergency care now, no booking.
- Every reply includes "This is not medical advice."
- Region us-west-2. Read resource names from SSM under /app/workshop; never hardcode them.
- Shared guardrail id is in SSM /app/workshop/guardrails/guardrail-id. update_guardrail replaces the whole config: always carry over content, word and other policies.
- Never log patient fields. Tools are read-only except book_appointment.
- Demo patient: PAT-01 (hypertension, amlodipine).
