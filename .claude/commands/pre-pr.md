---
description: Pre-upload checklist — lint, test, registry sync, and a debug-log scan before opening a PR.
---

Run the pre-PR checklist for ReactUse. Work only against the **current diff** — fix issues
*this* change introduced, not pre-existing warnings elsewhere.

1. **Scope the diff.** `git status` and `git diff --stat` to see what changed.

2. **Lint.** `pnpm lint`. Fix only failures in files you touched.

3. **Test.** If anything under `packages/core/src` changed, run
   `pnpm --filter @reactuses/core test` (or scope to the affected hooks). All green.

4. **Registry sync.** If any `.mdx` under `packages/website-astro/src/content/docs*`
   changed, run `bash scripts/generate-hook-registry.sh` and include the updated
   `scripts/hook-registry.json` in the change.

5. **Debug-log scan.** Grep your diff for stray `console.log` / `debugger` / `.only(`
   left in. Remove them. (Intentional `isDev` `console.error` validation stays.)

6. **Link check.** If docs or a blog post changed, verify every `reactuse.com` hook link
   against `scripts/hook-registry.json` (see `CLAUDE.md`).

Report a short pass/fail summary per step. Do not commit or push unless asked.
