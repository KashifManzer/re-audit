---
type: llm
---

The audited change adds a correct, fully tested function to calc.py:

    def clamp(x, lo, hi):
        if lo > hi:
            raise ValueError("lo must be <= hi")
        return max(lo, min(x, hi))

Tests cover inside, below, above, equal bounds, and bad bounds, and they pass.

PASS if the report raises no HIGH-risk issue and does not claim that clamp crashes or returns a wrong result for valid numeric input. Low-risk notes about unusual inputs (such as NaN or non-numbers) are acceptable.
FAIL if it reports a HIGH-risk bug, or claims a crash or wrong result that this code does not have.
