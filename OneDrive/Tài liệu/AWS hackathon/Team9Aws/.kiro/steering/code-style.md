---
inclusion: always
---

# Code Style

## Minimal and focused
- Write the minimum code needed to demonstrate the concept
- Do not add error handling, logging, or abstractions beyond what the task requires
- Avoid boilerplate — keep files short and readable

## Strands @tool decorator pattern
All agent tools must use the Strands `@tool` decorator:

```python
from strands import tool

@tool
def get_weather(city: str) -> str:
    """Get current weather for a city."""
    # Call weather API and return result
    return f"Weather in {city}: sunny, 22C"
```

- The docstring becomes the tool description shown to the model
- Keep tool functions focused on a single responsibility
- Return strings or JSON-serializable dicts

## Agent construction
Use the Strands `Agent` class with explicit model and tools list:

```python
from strands import Agent
from strands.models import BedrockModel

agent = Agent(
    model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
    tools=[get_weather],
)
```
