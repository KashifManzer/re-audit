---
description: Audit the code changes just made. A fresh reviewer explains why each change was needed (with evidence), finds missed edge cases in plain language, proposes safe ways to shrink the code, and every claim is checked against the actual files.
argument-hint: "[base-branch | file ...]"
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git rev-parse *)
  - Bash(git diff *)
  - Bash(git status *)
  - Bash(git merge-base *)
  - mcp__re-audit__verify_quotes
---

# re-audit

Audit a code change honestly. You orchestrate; the `re-audit:reviewer` subagent does the reviewing in a fresh context so it does not defend work it remembers writing.

Arguments: `$ARGUMENTS`

## Never

- Never commit, stash, reset, checkout, or otherwise change git state. The user's uncommitted work must survive.
- Never add your own opinion of the change to the reviewer's input. It must judge the code, not your reasoning.
- Never show a finding whose citation failed the check.
- Never apply a shrink the user did not pick. With no answer (for example in a non-interactive run), apply nothing.

## 1. Collect the change

Run `git rev-parse --is-inside-work-tree` and decide the scope:

| Situation | What to review |
|---|---|
| Git, no arguments | `git diff HEAD`, plus untracked files from `git status --porcelain` (lines starting `??`) read as new files. If the repo has no commits yet (`git rev-parse HEAD` fails), treat every file in `git status --porcelain` as new. |
| Git, first argument is a ref (`git rev-parse --verify <arg>` succeeds) | `git diff $(git merge-base <arg> HEAD)`: everything since branching, committed or not. |
| Arguments are existing file paths | In git: `git diff HEAD -- <files>`, or the whole file if it is untracked or unchanged. Outside git: the whole files. |
| Not git, no arguments | Ask which files to audit, then stop until they answer. Do not guess. |

If the result is empty, say "Nothing to audit: no changes found." and stop.
If the diff is over about 3000 lines, say so and suggest passing specific files; continue only if the user agrees.

## 2. Prepare the reviewer's input

- **User request**: 1-2 sentences on what the user asked for in this conversation. If this conversation has no earlier request, write `unknown, judge from the code only`.
- **Checks**: test, lint, and type-check commands the project already defines (for example `package.json` scripts, `pytest`, `go test ./...`, `cargo test`, a `Makefile` target). Only list commands that exist; do not invent any.
- **The change** from step 1.

## 3. Run the reviewer

Spawn the `re-audit:reviewer` subagent with exactly: the user request, the checks, and the change. Nothing else.

It returns one JSON object. If the JSON does not parse, resume it once asking for the JSON only. If it still fails, show its raw reply, say the audit could not be completed, and stop.

## 4. Check every citation

Collect every `citation` from `changes`, `edge_cases`, and `shrink`, and call `mcp__re-audit__verify_quotes` once with all of them.

- `found`: keep.
- `moved`: keep, using the corrected line.
- `missing`: drop the finding and count it.

If the tool is unavailable or refuses, check each citation yourself: Read the file around the cited line and confirm the quote is there, ignoring whitespace. Apply the same keep/move/drop rules.

## 5. Show the report

Use this layout. Plain words first, technical detail second. Sort edge cases high, then medium, then low risk. Leave out empty sections. Keep each line short.

```
## re-audit

**In short:** <reviewer summary>
<N> changes (<a> needed, <b> not needed, <c> unclear) · <M> could break · <K> could be smaller

### Changes
1. [Verified] <what> - needed: yes. <why>
   `file:line` - evidence: <evidence>

### Could break (most serious first)
1. HIGH - <plain sentence>
   `file:line` - <technical line> - covered by a test: no

### Could be smaller
S1. `file:line` - <why behavior stays the same>
    (a small before/after diff)

### Checks run
- `<command>` -> pass | fail | error

### Not checked
- <item>

### Removed by the citation check
<K> findings removed because the quoted code is not in the file.
```

## 6. Shrinks, only with permission

Skip this step if there are no shrinks.

1. Ask which shrinks to apply. With 4 or fewer, ask one multi-select question (one option per shrink). With more, list them by number and ask the user to reply with the numbers. Always allow "none".
2. If the user picked none, or no answer is possible, go to step 7.
3. Run the project's tests before changing anything.
   - No tests: say that nothing can prove behavior stays the same, so only the re-review will protect them, and ask whether to continue.
   - Tests already failing: say so, and ask whether to continue anyway.
4. Apply each picked shrink with Edit, replacing `before` with `after` exactly.
5. Run the tests again. If anything that passed before now fails, restore each edit by replacing `after` with `before`, report which shrink broke what, and go to step 7. Never use git to undo.
6. Spawn `re-audit:reviewer` once more with `MODE: re-review`, the user request, and a diff of only the applied shrinks. Check its citations (step 4) and show only what it found. Do not start another round.

## 7. Optional Codex second opinion

Run `command -v codex`. If it prints a path and this is a git repo, ask: "Want a second opinion from Codex? It is a different model, so it catches different things." If yes, run, read-only:

- No ref given: `codex review --uncommitted`
- Ref given: `codex review --base <ref>`

Show its output under `### Codex says (not citation-checked)`. Do not merge it into the report above.
