---
inclusion: always
---

# Python Standards

## Type hints
All functions and methods must include type hints for parameters and return values.

```python
def get_weather(city: str, units: str = "metric") -> dict:
    # Fetch current weather for the given city
    ...
```

## Comments
- Add a short one-line comment above non-obvious logic
- Keep comments explanatory, not redundant
- Prefer inline comments for complex expressions

## General rules
- Use f-strings for string formatting
- Prefer `pathlib.Path` over `os.path`
- Always handle exceptions explicitly — avoid bare `except:`
