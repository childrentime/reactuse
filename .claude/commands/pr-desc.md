---
description: Draft a commit message / PR description from the current diff, in the repo's conventional-commit style.
---

Generate a PR/commit description for the current change. Use the **pr-description** skill.

1. Read the real change: `git diff` (or `git diff origin/main...HEAD` on a branch),
   `git diff --stat`, and `git log --oneline -10` to match the prevailing style.
2. Produce a `type(scope): summary` title and a tight body (What / Why / Test plan, plus an
   optional AI-assistance note).
3. Verify any hook references against `scripts/hook-registry.json` — never invent a name or
   URL.

Output the description in a code block ready to paste. Don't commit.
