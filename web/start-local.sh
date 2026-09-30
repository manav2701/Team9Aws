#!/usr/bin/env bash
# Start the Shifa web app on http://localhost:3000, connected to the deployed HealthAgent.
# Needs AWS credentials: put the workshop exports in ../../.aws-env.sh (never committed).
set -euo pipefail
cd "$(dirname "$0")"
for f in ../.aws-env.sh ../../.aws-env.sh; do [ -f "$f" ] && source "$f" && break; done
export AWS_REGION="${AWS_DEFAULT_REGION:-us-west-2}"
[ -d node_modules ] || npm install
npm run dev
