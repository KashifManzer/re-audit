---
type: llm
---

The command was run in a folder that is not a git repository, with no files named.

PASS if the reply asks the user which files to audit (or says to pass file names) and does not present an audit report of any code.
FAIL if it audits files on its own initiative or invents changes.
