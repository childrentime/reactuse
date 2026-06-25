# Knowledge Base — task router

This is ReactUse's equivalent of Chromium's `knowledge_base.md`: an if-then router that
points a task at the **real files, utilities, and skills** that already solve it. It is
referenced from `CLAUDE.md`, so treat it as always-in-context.

## Core principle: Consult, then act

> Do not work from general React knowledge alone. This codebase has specific conventions
> (SSR-safety, a shared util layer, a 3-part public export, multilingual JSDoc). **Read the
> real source before editing, and reuse before writing.** When a row below names a file,
> open it.

## Routing table

| When the task involves…​ | Read / do this |
|---|---|
| **Adding or editing a hook** | Conventions live in `packages/core/src/utils/` + existing hooks. Use the **[new-hook](./skills/new-hook/SKILL.md)** skill. Every hook is a folder `packages/core/src/useX/` with `index.ts` + `interface.ts` (+ `index.spec.ts`). |
| **Touching `window` / `document` (SSR safety)** | This is the #1 source of bugs. Use `defaultWindow` / `defaultDocument` from `packages/core/src/utils/browser.ts`, or `isBrowser` / `isNavigator` from `packages/core/src/utils/is.ts`. For subscribed external state, prefer the `use-sync-external-store/shim` pattern with a server fallback (see `useLocationSelector`, `useColorMode`). Never read `window.x` at module top level without a guard. |
| **Attaching event listeners** | Reuse the `useEventListener` hook — do **not** hand-roll `addEventListener`/`removeEventListener`. For non-hook contexts, `on()` / `off()` in `utils/browser.ts` already null-check the target. |
| **Keeping a callback fresh without re-subscribing** | Use `useLatest` (store the latest fn in a ref) to avoid stale closures. |
| **Cleanup on unmount** | Use `useUnmount`. |
| **Exposing a hook publicly** | Edit `packages/core/src/index.ts` with the **3-part pattern**: (1) `import { useX } from './useX'`, (2) add `useX,` to the `export { … }` block, (3) `export * from './useX/interface'`. Miss any part and the hook or its types won't ship. |
| **Writing or fixing a test** | Jest (not vitest), jsdom env. Co-located `index.spec.ts`, `renderHook`/`act` from `@testing-library/react`, helpers in `packages/core/.test/`. Use the **[hook-test](./skills/hook-test/SKILL.md)** skill. Run one file: `pnpm --filter @reactuses/core test <pattern>`. |
| **Testing SSR / hydration** | Add the `@jest-environment ./.test/ssr-environment` pragma and use `ReactDOMServer.renderToString` + `hydrateRoot`. Reference: `packages/core/src/usePreferredDark/index.ssr.spec.tsx`. |
| **Documenting a hook** | `.mdx` under `packages/website-astro/src/content/docs/{category}/` plus `docs-zh-hans/` and `docs-zh-hant/`. Schema: `packages/website-astro/src/content.config.ts`. Use the **[hook-docs](./skills/hook-docs/SKILL.md)** skill, then run `bash scripts/generate-hook-registry.sh`. |
| **Writing types / JSDoc** | Put types in `interface.ts`, type named `UseX`. JSDoc is **multilingual** (`@en` / `@zh` / `@zh-Hant`, plus `@defaultValue`, `@returns_en` / `@returns` / `@returns_zh-Hant`) — the API docs are generated from it. Reference: `packages/core/src/useCounter/interface.ts`. |
| **Linking to a hook (blog/docs/PR)** | `scripts/hook-registry.json` is the source of truth. URLs are lowercase: `https://reactuse.com/{category}/{name.lower()}/`. Never hand-build a camelCase URL. (See `CLAUDE.md`.) |
| **Writing a PR / commit message** | Conventional commits with scope (`feat(core):`, `docs(website):`, `fix(core):`, `chore:`). Use the **[pr-description](./skills/pr-description/SKILL.md)** skill. |
| **SEO / search analysis** | `python3 scripts/gsc-report.py [days]`; playbook in `GSC.md`. |
| **Publishing a blog post** | Existing skills: `medium-push`, `ping-indexnow`, `publish-hashnode`; full workflow in `CLAUDE.md`. |

## Reuse-first cheat-sheet (most-used internal utilities)

Before writing a helper, check whether one of these already exists:

| Need | Import |
|---|---|
| SSR-safe window/document | `import { defaultWindow, defaultDocument } from '../utils/browser'` |
| Environment checks | `import { isBrowser, isNavigator, isDev, isFunction, isString, isDef, noop } from '../utils/is'` |
| Add/remove listener (null-safe) | `import { on, off } from '../utils/browser'` |
| Event listener hook | `import { useEventListener } from '../useEventListener'` |
| Latest value in a ref | `import { useLatest } from '../useLatest'` |
| Unmount cleanup | `import { useUnmount } from '../useUnmount'` |

## Categories (fixed set)

`browser` · `effect` · `element` · `state` · `integrations`

A hook's category is set by which `docs/{category}/` folder its `.mdx` lives in, and that
drives both the registry entry and the canonical URL. Don't guess — look an existing hook
up in `scripts/hook-registry.json`.
