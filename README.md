# re-audit

A Claude Code mod that audits the code Claude just wrote, before you trust it.

Run `/re-audit:run` after Claude changes your code.
A reviewer that never saw Claude's reasoning checks every change and tells you:

- **Why each change was needed**, rated by evidence instead of a made-up confidence score.
- **What could break**, explained in one plain sentence for beginners plus one technical line for experts.
- **How to make it smaller** without changing behavior, applied only if you say yes.
- **What it could not check**, so nothing is passed off as verified when it was not.

Every finding must quote the exact code it is about.
A small TypeScript checker reads your files and removes any finding whose quote is not really there.

## Why it works this way

- **Fresh reviewer.** Research on LLM self-correction finds that models often miss errors in their own output but catch the same errors when shown them as someone else's work. So the review runs in a separate subagent that sees only the diff and your request.
- **Evidence, not percentages.** Self-reported confidence numbers from LLMs are poorly calibrated. Each change is tagged `Verified` (a command or search proved it), `Reasoned` (the cited lines show it), or `Unverified`.
- **Checked citations.** Asking a model "not to invent things" is not enough. The `verify_quotes` tool checks every `file:line` quote in code and drops the ones that do not match.

## Install

In Claude Code, run:

```
/plugin marketplace add KashifManzer/re-audit
/plugin install re-audit@re-audit
```

## Use

```
/re-audit:run                 audit uncommitted changes (git diff HEAD + new files)
/re-audit:run main            audit everything since you branched from main
/re-audit:run src/a.py b.py   audit specific files (works outside git too)
```

After the report, re-audit asks which "could be smaller" suggestions to apply.
It runs your tests before and after, undoes any suggestion that breaks them, and re-reviews once.
If [Codex](https://github.com/openai/codex) is installed, it offers a second opinion from a different model.

The status line shows the last citation check, for example `re-audit: 5 found · 0 moved · 1 dropped`.

## Sample report

From a real run on a change that added `average(nums)` with no empty-list check (trimmed):

```
## re-audit

**In short:** Adds an average(nums) function to calc.py. The biggest risk is that an empty list crashes it, and no test covers it.
1 change (0 needed, 0 not needed, 1 unclear) · 2 could break · 0 could be smaller

### Could break (most serious first)
1. HIGH - An empty list crashes the program instead of giving a result or a clear error.
   `calc.py:6` - average([]) raises ZeroDivisionError - covered by a test: no
2. LOW - Passing a generator crashes, even though total() accepts one.
   `calc.py:6` - sum() uses up the generator, then len() raises TypeError - covered by a test: no

### Checks run
- `python3 -m unittest` -> pass (1 test, test_total only)

All 3 citations passed the check. Nothing was removed.
```

## What is inside

| Path | What it is |
|---|---|
| `skills/run/SKILL.md` | The `/re-audit:run` command: collects the change, runs the reviewer, checks citations, prints the report, handles shrinks and Codex. |
| `agents/reviewer.md` | The fresh-context reviewer and its rules. Edit and Write are blocked. |
| `hooks/register.ts` | Registers the `verify_quotes` tool and sets the status line. |
| `hooks/check.ts` | The quote matcher: `found`, `moved` (with the real line), or `missing`. |
| `hooks/*.test.ts` | Unit tests, run with `claude plugin test .` |
| `evals/` | Behavior tests, run with `claude plugin eval . --scaffold` |

## Limits

- **Manual only.** It never runs on its own. Run it when you want an audit.
- **Not a security audit**, and not a replacement for human review of important code.
- **The reviewer is still Claude.** A fresh context reduces self-review bias but does not remove it. The optional Codex pass adds a different model.
- **"Read-only" Bash means no source edits.** The reviewer may run your tests, and tests can write cache files such as `__pycache__/`.
- **The TypeScript part uses Claude Code's mod API, which is early access.** On versions that cannot load it, the skill falls back to checking quotes with Grep.
- **Evals on macOS:** inside `claude plugin eval`'s sandbox, Apple's `/usr/bin/git` launcher cannot run, so the git-based cases fail there. They are meant for Linux, for example CI.

## Develop

```
claude --plugin-dir ~/path/to/re-audit   # load from disk
claude plugin validate . --strict
claude plugin test .
claude plugin eval . --scaffold --ablation none --allow-tools Edit "Bash(git *)" "Bash(python3 *)" "Bash(command -v *)" mcp__re-audit__verify_quotes
```

## License

MIT
