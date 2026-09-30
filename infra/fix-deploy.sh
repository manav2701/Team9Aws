#!/usr/bin/env bash
# Fixes "CDK bootstrap failed": the workshop role may not create CDK's cdk-* IAM roles.
# Replaces the failed CDKToolkit stack with a minimal one (bucket, repo, version; no roles),
# then deploys the agent with your own credentials.
set -euo pipefail
cd "$(dirname "$0")/.."
source .aws-env.sh

echo ">> 1/3 Remove the failed CDKToolkit stack (it holds nothing; creation was rolled back)"
status="$(aws cloudformation describe-stacks --stack-name CDKToolkit --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo NONE)"
if [ "$status" = "ROLLBACK_COMPLETE" ]; then
  aws cloudformation delete-stack --stack-name CDKToolkit
  aws cloudformation wait stack-delete-complete --stack-name CDKToolkit
fi

echo ">> 2/3 Create the minimal bootstrap stack"
aws cloudformation deploy --stack-name CDKToolkit --template-file infra/cdk-bootstrap-minimal.yaml --no-cli-pager

echo ">> 3/3 Deploy the agent"
cd AgentCoreProject
agentcore deploy -y -v
agentcore status
