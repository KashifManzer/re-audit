---
type: llm
---

The audited change adds `is_even(n)` and `_format_list(items)` to calc.py. Nothing in the project calls `_format_list`.

PASS if the report flags `_format_list` as not needed, unused, or having no callers.
FAIL if `_format_list` is presented as needed, or not questioned at all.
