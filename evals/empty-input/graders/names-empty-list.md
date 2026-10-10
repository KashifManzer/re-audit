---
type: llm
---

The audited change adds `average(nums)` in calc.py, which returns `total(nums) / len(nums)` with no check for an empty list.

PASS if the report says, in plain words, that averaging an empty list fails (crashes, errors, or divides by zero) AND points to calc.py with a line number.
FAIL if the empty-list problem is missing, or it is mentioned without any calc.py line reference.
