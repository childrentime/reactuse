---
name: new-hook
category: engineering
description: Scaffold a new React hook in @reactuses/core with the repo's real conventions (interface.ts + multilingual JSDoc, SSR-safe browser access, shared-util reuse, 3-part public export). Triggers on "add a hook", "new hook", "scaffold a hook", "create a useXxx", or when implementing a new piece of hook functionality in packages/core.
---

# new-hook — scaffold a hook the ReactUse way

Use this when adding a new hook to `@reactuses/core`. It encodes how hooks are *actually*
built in this repo today. Pair it with **hook-test** and **hook-docs** afterward.

> ⚠️ **Do not run `pnpm newHook`.** `scripts/newHook.ts` is stale — it writes to
> `packages/core/hooks/` and `packages/website/src/routes.json`, neither of which exists
> anymore (hooks live in `packages/core/src/`). Do the steps below manually.

## Step 0 — Understand before writing (don't skip)

1. Confirm the hook doesn't already exist: `ls packages/core/src/useX`.
2. Read 1-2 *similar* existing hooks end to end (not just their names) to match style —
   e.g. a state hook like `useCounter`, a browser hook like `useClipboard`, an element
   hook like `useEventListener`. Note their return shape and which utils they reuse.
3. Check the [knowledge base](../../knowledge-base.md) reuse cheat-sheet — much of what you
   need (`useLatest`, `useUnmount`, `useEventListener`, `defaultWindow`, `isBrowser`) is
   already written. Reuse before writing.
4. Read **[api-design.md](../../api-design.md)** and apply it to the signature: subject first,
   all config in a trailing optional `options` object, DOM target named `target`, `default*`
   (SSR fallback) vs `initial*` (mutable seed) used correctly, the right return shape (tuple
   vs object), and **no typos — a shipped name is locked forever**.

## Step 1 — Create the hook folder

`packages/core/src/useX/` with two (then three) files:

- `index.ts` — the implementation, **named export** `export const useX: UseX = …`.
- `interface.ts` — the public type `UseX` with multilingual JSDoc.
- `index.spec.ts` — tests (hand off to the **hook-test** skill).

### `interface.ts` template

Types live here (not inline), so the API-doc generator can read them. JSDoc is trilingual:

```ts
/**
 * @title useX
 * @returns_en What the hook returns, described for docs.
 * @returns 返回值说明（简体）。
 * @returns_zh-Hant 返回值說明（繁體）。
 */
export type UseX = (
  /**
   * @en The first argument, described.
   * @zh 第一个参数说明。
   * @zh-Hant 第一個參數說明。
   * @defaultValue 0
   */
  initial?: number,
) => readonly [number, (n: number) => void]
```

(See `packages/core/src/useCounter/interface.ts` for a full real example.)

### `index.ts` template

```ts
import { useState, useCallback } from 'react'
import { isDev, isFunction } from '../utils/is'
import type { UseX } from './interface'

export const useX: UseX = (initial = 0) => {
  if (isDev && initial != null && !isFunction(initial) && typeof initial !== 'number') {
    console.error(`useX: \`initial\` expected number, got "${typeof initial}".`)
  }

  const [value, setValue] = useState(initial)
  const set = useCallback((n: number) => setValue(n), [])

  return [value, set] as const
}
```

## Step 2 — Wire it into the public API

Edit `packages/core/src/index.ts` — **all three** parts, or the hook/types won't ship:

```ts
import { useX } from './useX'        // 1. with the other imports

export {
  // …
  useX,                              // 2. inside the export { } block
}

export * from './useX/interface'    // 3. with the other `export *` lines
```

## Conventions to follow

- **SSR-safety is mandatory.** Guard any `window`/`document`/`navigator` access with
  `defaultWindow` / `defaultDocument` (`../utils/browser`) or `isBrowser` / `isNavigator`
  (`../utils/is`). For subscribed external state, use the `use-sync-external-store/shim`
  pattern with a server fallback (see `useColorMode`, `useLocationSelector`).
- **Reuse utilities** — don't hand-roll `addEventListener` (use `useEventListener`), stale
  closures (`useLatest`), or unmount cleanup (`useUnmount`).
- **Return shape**: a tuple with `as const`, or an explicitly typed object. Be consistent
  with the closest existing hook.
- **Dev-time validation** of arguments behind `if (isDev) { … console.error(…) }`.
- **Stay on task** — don't refactor neighbors or fix unrelated lint while you're here.

## Step 3 — Then

1. Tests → **[hook-test](../hook-test/SKILL.md)** skill.
2. Docs → **[hook-docs](../hook-docs/SKILL.md)** skill (+ `bash scripts/generate-hook-registry.sh`).
3. Verify: `pnpm --filter @reactuses/core test useX` and `pnpm lint`.

Or run `/new-hook <useName> "<description>" <category>` to do the whole pipeline at once.
