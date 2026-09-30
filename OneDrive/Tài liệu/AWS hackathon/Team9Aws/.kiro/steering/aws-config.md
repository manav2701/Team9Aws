---
inclusion: always
---

# AWS Configuration

## Region
All AWS operations must target **us-west-2**. Set this explicitly in all boto3 clients and resources:

```python
import boto3

client = boto3.client("bedrock-runtime", region_name="us-west-2")
```

## AWS CLI
Always include `--no-cli-pager` in CLI commands to prevent output from being piped to a pager:

```bash
aws bedrock list-foundation-models --region us-west-2 --no-cli-pager
```

## Profile
Use the `workshop` profile when running CLI commands locally:

```bash
aws sts get-caller-identity --profile workshop --no-cli-pager
```
