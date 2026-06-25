# Expected behavior — fix_failing_test

Exercises: **hook-test** skill + "understand before editing" + minimal-change discipline.

## Must do

- **Run the test first** to see the actual failure, using the right command
  (`pnpm --filter @reactuses/core test <pattern>`), not a guess about the cause.
- **Read the source** of the failing hook (and at least the failing test) before editing —
  locate the real root cause.
- Make a **minimal, targeted** fix that addresses the root cause.
- **Re-run** the same test and confirm it's green. Ideally run the package suite to confirm
  nothing else regressed.
- If it deliberately broke a hook to create the failure (per the prompt), it restores the
  hook to correct behavior and leaves the tree clean — no leftover intentional bug.

## Must not

- Make speculative/scattershot edits, or change the test to match buggy behavior just to go
  green.
- "Fix" unrelated pre-existing warnings or refactor neighboring code.
- Claim success without actually re-running the test.
- Add a `.only` and forget to remove it.

## Nice to have

- Briefly explains the root cause and why the fix is correct (the self-review bar in
  `.claude/ai-policy.md`).
