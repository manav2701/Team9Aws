# Health Companion by Shifa

An AI care navigator for the AWS Agentic AI Hackathon (Health Companion track). It triages symptoms against public guidance, checks the patient's record, books care or phones the clinic, and never diagnoses or prescribes.

Live app: https://wzihykguzzj72v3ptpba2zpgri0psctu.lambda-url.us-west-2.on.aws/en/intake

## Layout

| Folder | What it is |
|---|---|
| `AgentCoreProject/` | The HealthAgent (Strands on AgentCore Runtime), its tools Lambda, gateway and memory config |
| `web/` | Shifa web app (Next.js); `start-local.sh` runs it locally, `deploy-lambda.sh` publishes it |
| `lambda_functions/call_fulfillment/` | Voice calling service (Twilio + Bedrock) |
| `safety/` | Guardrail setup and the 18-prompt safety test runner |
| `tests/`, `tools/` | Voice calling tests and call simulators |
| `infra/` | Workshop setup script and the CDK bootstrap workaround |
| `docs/` | Architecture, sequence and workflow diagrams, screenshots |
| `slides/` | Pitch deck |

## Run it

Put the workshop credentials in `.aws-env.sh` at the repo root (never committed), then:

```bash
cd web && ./start-local.sh                       # web app on http://localhost:3000
cd AgentCoreProject && agentcore deploy -y       # redeploy the agent
uv run safety/guardrail_check.py                 # guardrail tests, no agent needed
uv run safety/run_tests.py                       # 18 end-to-end safety tests
cd web && ./deploy-lambda.sh                     # publish the web app
```

`AgentCoreProject/agentcore/agentcore.json` holds the gateway client secret locally; git skips it (`git update-index --skip-worktree`), so the committed copy keeps a placeholder.
