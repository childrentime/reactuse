---
description: Scaffold a new hook end-to-end — implementation, tests, docs, registry, lint.
argument-hint: <useName> "<description>" <category>
---

Add a new hook to `@reactuses/core`, running the full pipeline. Arguments: `$ARGUMENTS`
(hook name starting with `use`, a one-line description in quotes, and a category — one of
`browser` / `effect` / `element` / `state` / `integrations`).

Do it in this order, using the dedicated skills and stopping to confirm understanding
before writing code:

1. **Sanity check.** Confirm the hook name starts with `use`, the category is valid, and
   `packages/core/src/<useName>` does not already exist. If the category wasn't given, ask.

2. **Scaffold** — use the **new-hook** skill. Create
   `packages/core/src/<useName>/{index.ts, interface.ts}` with SSR-safe, util-reusing code
   and multilingual JSDoc, then wire all three parts into `packages/core/src/index.ts`.

3. **Test** — use the **hook-test** skill. Add `packages/core/src/<useName>/index.spec.ts`
   and run `pnpm --filter @reactuses/core test <useName>` until green.

4. **Docs** — use the **hook-docs** skill. Create the `.mdx` for all three locales under
   the chosen `{category}` folder, then run `bash scripts/generate-hook-registry.sh`.

5. **Verify** — run `pnpm lint` and the hook's test once more. Report the files
   created/edited and the test result. Do **not** commit unless asked.

Follow `.claude/knowledge-base.md` for conventions and `.claude/ai-policy.md` for the
self-review bar.
