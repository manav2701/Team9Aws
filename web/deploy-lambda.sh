#!/usr/bin/env bash
# Deploys the Shifa web app to AWS Lambda with a public HTTPS function URL.
# The workshop role can't use EC2, App Runner or Amplify; Lambda + the official
# AWS Lambda Web Adapter runs the Next.js server as-is.
# Needs the workshop AWS credentials in ../../.aws-env.sh (or already exported).
set -euo pipefail
cd "$(dirname "$0")"
for f in ../.aws-env.sh ../../.aws-env.sh; do [ -f "$f" ] && source "$f" && break; done
export AWS_DEFAULT_REGION=us-west-2 AWS_PAGER=""

FUNCTION=workshop-shifa-web
ROLE=workshop-shifa-web-role
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
BUCKET=cdk-hnb659fds-assets-$ACCOUNT-us-west-2
ADAPTER=arn:aws:lambda:us-west-2:753240598075:layer:LambdaAdapterLayerX86:27

echo ">> build"
npm run build >/dev/null
rm -rf build && mkdir -p build
cp -R .next/standalone build/app
cp -R .next/static build/app/.next/static
[ -d public ] && cp -R public build/app/public
printf '#!/bin/bash\nexec node server.js\n' > build/app/run.sh && chmod +x build/app/run.sh
(cd build/app && zip -qry ../web.zip .)
aws s3 cp build/web.zip "s3://$BUCKET/shifa-web/web.zip" --only-show-errors

echo ">> role"
if ! aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  aws iam create-role --role-name "$ROLE" --assume-role-policy-document \
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  sleep 10
fi
aws iam put-role-policy --role-name "$ROLE" --policy-name shifa-web --policy-document "{
  \"Version\":\"2012-10-17\",\"Statement\":[
    {\"Effect\":\"Allow\",\"Action\":[\"logs:CreateLogGroup\",\"logs:CreateLogStream\",\"logs:PutLogEvents\"],\"Resource\":\"*\"},
    {\"Effect\":\"Allow\",\"Action\":\"bedrock-agentcore:InvokeAgentRuntime\",\"Resource\":\"*\"},
    {\"Effect\":\"Allow\",\"Action\":[\"dynamodb:GetItem\"],\"Resource\":\"arn:aws:dynamodb:us-west-2:$ACCOUNT:table/workshop-*\"},
    {\"Effect\":\"Allow\",\"Action\":\"lambda:InvokeFunction\",\"Resource\":\"arn:aws:lambda:us-west-2:$ACCOUNT:function:workshop-shifa-calls\"}]}"
ROLE_ARN=$(aws iam get-role --role-name "$ROLE" --query Role.Arn --output text)

echo ">> function"
ENV="Variables={AWS_LAMBDA_EXEC_WRAPPER=/opt/bootstrap,PORT=8080,AWS_LWA_READINESS_CHECK_PATH=/en,HOSTNAME=0.0.0.0}"
if aws lambda get-function --function-name "$FUNCTION" >/dev/null 2>&1; then
  aws lambda update-function-code --function-name "$FUNCTION" --s3-bucket "$BUCKET" --s3-key shifa-web/web.zip >/dev/null
  aws lambda wait function-updated-v2 --function-name "$FUNCTION"
else
  aws lambda create-function --function-name "$FUNCTION" --runtime nodejs22.x --handler run.sh \
    --role "$ROLE_ARN" --timeout 120 --memory-size 1024 --layers "$ADAPTER" \
    --environment "$ENV" --code S3Bucket=$BUCKET,S3Key=shifa-web/web.zip >/dev/null
  aws lambda wait function-active-v2 --function-name "$FUNCTION"
  aws lambda create-function-url-config --function-name "$FUNCTION" --auth-type NONE >/dev/null
  aws lambda add-permission --function-name "$FUNCTION" --statement-id public-url \
    --action lambda:InvokeFunctionUrl --principal "*" --function-url-auth-type NONE >/dev/null
  # Older AWS CLIs lack --invoked-via-function-url, so this permission goes through boto3.
  uv run --quiet --no-project --python 3.12 --with boto3 python -c "import boto3; boto3.client('lambda', region_name='us-west-2').add_permission(FunctionName='$FUNCTION', StatementId='public-url-invoke', Action='lambda:InvokeFunction', Principal='*', InvokedViaFunctionUrl=True)"
fi
URL=$(aws lambda get-function-url-config --function-name "$FUNCTION" --query FunctionUrl --output text)
echo "Shifa is live at: ${URL}en/intake"
