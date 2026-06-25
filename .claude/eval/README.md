# Eval — regression checks for the agent system

ReactUse's version of Chromium's `agents/prompts/eval/` **and** `agents/testing/`. Its job
is to catch regressions in the **prompts, skills, and knowledge base** — not in the library
code. When you edit `CLAUDE.md`, `knowledge-base.md`, or any `SKILL.md`, run a case or two
to confirm the agent still behaves well.

There are two ways to use it: by hand (read a case, eyeball the agent), or via the
**runnable harness** (`eval_runner.py`) that drives Claude Code headless and scores the run
automatically.

## Case structure

Each case is a folder with up to three files:

- `prompt.md` — the user request to give a fresh agent (no extra hand-holding).
- `eval.md` — prose rubric: Must do / Must not / Nice to have (for humans + the `--judge` LLM grader).
- `assert.json` — machine-checkable assertions (for `eval_runner.py`).

`eval.md` + `assert.json` mirror Chromium's `eval.md` + `eval.promptfoo.yaml` split: prose
expectations alongside automated assertions.

## Runnable harness — `eval_runner.py`

The analog of Chromium's `eval_prompts.py`, sized for this repo: stdlib-only Python, driven
by `claude -p` instead of the Gemini CLI, isolated with git worktrees instead of btrfs
snapshots. **Live runs spawn real Claude Code sessions and cost tokens — you start them.**

```bash
# No-cost checks (run these freely):
python3 .claude/eval/eval_runner.py --list          # discover cases + assertion counts
python3 .claude/eval/eval_runner.py --self-test     # validate the assertion engine

# Real runs (spend tokens):
python3 .claude/eval/eval_runner.py add_hook                       # one case
python3 .claude/eval/eval_runner.py --repeat 3 --pass-threshold 2  # Pass@3
python3 .claude/eval/eval_runner.py --run-tests                    # also execute each case's shell checks
python3 .claude/eval/eval_runner.py --judge                        # also grade vs eval.md with an LLM
```

What each run does: spins up an isolated worktree → overlays the prompt system (`.claude/`
+ `CLAUDE.md`) from the version under test → runs `claude -p` on `prompt.md` → captures the
tool calls and the git diff → scores against `assert.json`.

### A/B — the workflow for "I changed a prompt, did it help?"

```bash
git add -A && git commit -m "wip: agent system"     # so there's a baseline to diff against
# …edit a prompt…
python3 .claude/eval/eval_runner.py --baseline HEAD --repeat 3
```

`--baseline <ref>` runs the suite twice — once with the prompts from `<ref>`, once with your
working tree — and prints both pass rates. A drop is a regression; revert. An improvement
with no regressions elsewhere: ship it, and consider freezing the win as a new case.

### `assert.json` schema

```jsonc
{
  "files_changed":   ["path", ...],            // each must be created/modified
  "file_content":    [{ "path": "...",         // substring checks on a file
                        "present": ["..."],     //   all must appear
                        "absent":  ["..."] }],  //   none may appear
  "tools_required":  ["regex", ...],           // must match some tool call (e.g. a test run)
  "tools_forbidden": ["regex", ...],           // must match none (e.g. "newHook")
  "commands":        [{ "run": "shell",        // run in the worktree
                        "expect_exit": 0,
                        "requires": "run-tests" }]  // only when --run-tests is set
}
```

A case **passes** when every assertion passes. `--repeat K` + `--pass-threshold n` gives
Pass@K to absorb LLM non-determinism (the same idea as Chromium's Pass@K).

## Run a case by hand (no harness)

1. Open a fresh session at the repo root (so `CLAUDE.md` + the agent system load).
2. Paste the contents of `prompt.md`.
3. Compare against `eval.md`. Pass if it hits the Must-do items and avoids the Must-not items.
4. Discard any files the agent created — these cases are throwaway.

## Principles (from Chromium)

- **A/B, don't eyeball the new version alone** — always compare against before the change.
- **Pass@K** — run a case several times; LLM output varies, single passes lie.
- **Isolate** — each run in its own worktree; never pollute your working tree.
- **Freeze regressions** — every time the agent does something wrong that a prompt edit
  fixes, add a case so it can't regress silently.

## Cases

| Case | Exercises |
|------|-----------|
| [`add_hook`](./add_hook) | new-hook + hook-test + hook-docs skills, conventions, registry |
| [`fix_failing_test`](./fix_failing_test) | hook-test skill, understand-before-edit, minimal fix |
