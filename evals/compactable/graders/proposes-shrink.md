---
type: llm
---

The audited change adds `positives(nums)` in calc.py: a 7-line loop with a needless `else: continue` that is equivalent to `[n for n in nums if n > 0]`.

PASS if the report proposes a shorter version of `positives` (for example a list comprehension or filter) and says behavior stays the same.
FAIL if no shorter version of `positives` is proposed.
