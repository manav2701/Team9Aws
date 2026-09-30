---
inclusion: always
---

# Documentation Lookup Policy

Before writing any code involving AWS services, AgentCore, or the Strands Agents SDK, always use the MCP tools to fetch current documentation first. Do not rely on prior training knowledge — APIs and SDKs change frequently.

## Required lookup order

1. Use `aws-documentation` MCP tools (`search_documentation`, `read_documentation`) for any AWS service (Bedrock, S3, IAM, etc.)
2. Use `bedrock-agentcore` MCP tools for AgentCore CLI commands, deployment config, and runtime APIs
3. Use `strands-agents` MCP tools (`search_docs`, `fetch_doc`) for Strands SDK usage, tool decorators, and agent patterns

## When to look things up

- Before using any AWS SDK method or boto3 call
- Before writing AgentCore config files or CLI commands
- Before using any Strands class, decorator, or agent pattern
- When unsure about parameter names, return shapes, or defaults

Always prefer live documentation over assumptions.
