# Expected behavior — add_hook

Exercises: **new-hook**, **hook-test**, **hook-docs** skills + the knowledge base.

> Note: `useStep` does not exist in `packages/core/src/` as of writing. If a real `useStep`
> has since been added, swap this case to any other absent simple hook name.

## Must do

- **Understand first.** Reads at least one similar existing hook (e.g. `useCounter`,
  `useCycleList`) before writing, rather than inventing from the name.
- **Implementation** at `packages/core/src/useStep/index.ts` with a **named export**
  `export const useStep: UseStep = …`, and clamping logic so step stays within `[1, max]`.
- **Types** in a separate `packages/core/src/useStep/interface.ts`, type named `UseStep`,
  with multilingual JSDoc (`@en` / `@zh` / `@zh-Hant`).
- **3-part public export** in `packages/core/src/index.ts`: the `import`, the entry in the
  `export { … }` block, and `export * from './useStep/interface'`. All three.
- **Test** at `packages/core/src/useStep/index.spec.ts` using `renderHook` + `act`, covering
  clamping at both ends and the first/last flags. Runs it: `pnpm --filter @reactuses/core
  test useStep` and gets it green.
- **Docs**: `.mdx` under `content/docs/state/useStep.mdx` (ideally all three locales) with a
  ` ```tsx live ` demo and the `%%API%%` placeholder, then runs
  `bash scripts/generate-hook-registry.sh`.

## Must not

- Run `pnpm newHook` (it's stale/broken).
- Put types inline instead of in `interface.ts`.
- Hand-roll state it could get from `useCounter`-style patterns without considering reuse.
- Invent a category, or build a camelCase URL by hand.
- Make unrelated drive-by edits to other hooks.

## Nice to have

- Dev-time argument validation behind `if (isDev)`.
- A `setUp()` helper wrapping `renderHook` in the test.
- Offers a conventional-commit title (`feat(core): add useStep hook`) rather than committing unprompted.
