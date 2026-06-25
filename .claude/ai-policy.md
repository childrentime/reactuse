# AI Usage Policy

Adapted from Chromium's `ai_policy.md`. One idea underneath all of it:

> **AI is a tool, not an author. The human who opens the PR is responsible for every line in it.**

This is the floor for using any AI assistant (Claude Code or otherwise) on ReactUse.

## Rules

1. **Self-review before review.**
   Before you open or push a PR, you must read and *understand* every change — including
   the parts the AI wrote. You are vouching for its correctness, design, types, and style.
   Concretely, confirm:
   - You understand what each changed file does and why.
   - Browser APIs are SSR-safe (see [`knowledge-base.md`](./knowledge-base.md) → SSR).
   - `pnpm lint` passes and the affected package's jest tests pass.
   - The change stays on task — no unrelated "drive-by" edits or invented TODOs.

   Submitting code you don't understand is the one thing this policy exists to prevent.

2. **The work is yours.** Whether or not you used AI, you are claiming the contribution as
   your own original work. Don't paste code you haven't vetted and can't explain.

3. **Never invent hooks or URLs.** `scripts/hook-registry.json` is the source of truth for
   which hooks exist and their canonical (lowercase) URLs. AI must not guess hook names,
   categories, or links — verify against the registry. (This mirrors the existing rule in
   `CLAUDE.md`.)

4. **A human answers humans.** If a maintainer or contributor leaves feedback on an
   AI-assisted PR or issue, a human replies — don't hand the conversation back to the agent.

## Recommended

- **Disclose substantial AI use** in the PR description (e.g. "scaffolded with the
  `new-hook` skill", or include the prompt). It helps reviewers calibrate.
- If a change was driven by a design doc + prompt, consider committing the design doc
  alongside the code so the reasoning is preserved.

## Why this is short

Chromium's policy carries enforcement weight (loss of commit rights) because it operates
at the scale of thousands of committers. ReactUse is a small library — the principle is
identical, the bureaucracy isn't needed. Understand your code; own it.
