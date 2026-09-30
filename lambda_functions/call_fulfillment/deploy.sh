#!/usr/bin/env bash
# Deploys the outbound-call Lambda (Twilio webhook + call starter) with its table,
# results topic and SSM config. Safe to re-run: it only updates the code after the first time.
#
# Run from Git Bash:  ./lambda_functions/call_fulfillment/deploy.sh
set -euo pipefail
export MSYS_NO_PATHCONV=1 AWS_PAGER="" AWS_DEFAULT_REGION=us-west-2
cd "$(dirname "$0")"

# Names start with "workshop-" and SSM sits under /app/workshop because that is
# all the kit's Lambda role (workshop-lambda-role) is allowed to reach.
FUNCTION=workshop-shifa-calls
TABLE=workshop-shifa-calls
TOPIC=workshop-shifa-call-results
SSM=/app/workshop/shifa
ROLE_ARN=$(aws ssm get-parameter --name /app/workshop/lambda/execution-role-arn --query Parameter.Value --output text)

if ! aws dynamodb describe-table --table-name "$TABLE" >/dev/null 2>&1; then
  echo "creating table $TABLE"
  aws dynamodb create-table --table-name "$TABLE" \
    --attribute-definitions AttributeName=call_id,AttributeType=S \
    --key-schema AttributeName=call_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST >/dev/null
  aws dynamodb wait table-exists --table-name "$TABLE"
  aws dynamodb update-time-to-live --table-name "$TABLE" \
    --time-to-live-specification Enabled=true,AttributeName=expires_at >/dev/null
fi

TOPIC_ARN=$(aws sns create-topic --name "$TOPIC" --query TopicArn --output text)

rm -rf build && mkdir build
python -m zipfile -c build/calls.zip brain.py call_scripts.py handler.py twilio_io.py

if aws lambda get-function --function-name "$FUNCTION" >/dev/null 2>&1; then
  echo "updating function $FUNCTION"
  aws lambda update-function-code --function-name "$FUNCTION" --zip-file fileb://build/calls.zip >/dev/null
  aws lambda wait function-updated-v2 --function-name "$FUNCTION"
else
  echo "creating function $FUNCTION"
  aws lambda create-function --function-name "$FUNCTION" \
    --runtime python3.12 --handler handler.lambda_handler --role "$ROLE_ARN" \
    --timeout 15 --memory-size 256 --zip-file fileb://build/calls.zip >/dev/null
  aws lambda wait function-active-v2 --function-name "$FUNCTION"
  # Twilio has to reach the webhook, so the URL is public; handler.py rejects
  # every request that does not carry a valid Twilio signature.
  aws lambda create-function-url-config --function-name "$FUNCTION" --auth-type NONE >/dev/null
  aws lambda add-permission --function-name "$FUNCTION" --statement-id public-url \
    --action lambda:InvokeFunctionUrl --principal "*" --function-url-auth-type NONE >/dev/null
  aws lambda add-permission --function-name "$FUNCTION" --statement-id public-url-invoke \
    --action lambda:InvokeFunction --principal "*" --invoked-via-function-url >/dev/null
fi

URL=$(aws lambda get-function-url-config --function-name "$FUNCTION" --query FunctionUrl --output text)
put() { aws ssm put-parameter --name "$SSM/$1" --value "$2" --type String --overwrite >/dev/null; }
put calls/webhook-url "$URL"
put calls/table "$TABLE"
put calls/results-topic-arn "$TOPIC_ARN"

echo "function:      $FUNCTION"
echo "webhook url:   $URL"
echo "results topic: $TOPIC_ARN"
