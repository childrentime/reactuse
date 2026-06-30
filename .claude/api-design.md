# API Design Spec — `@reactuses/core`

The contract every public hook signature must follow. It adapts *The Little Manual of API
Design* (Blanchette, Trolltech — the Qt design booklet, mirrored at `/papers/api-design` on the
site) to a React-hooks library, and encodes the conventions this repo already follows so new
hooks don't drift. **Read this before adding or changing a public signature.** It is referenced
from `CLAUDE.md` and the `new-hook` skill.

> The manual's five marks of a good API: **easy to learn**, **leads to readable code**, **hard to
> misuse**, **easy to extend**, **complete**. "Minimal" and "consistent" aren't on that list —
> they serve the five. Consistency ≈ *conceptual integrity*: one coherent design, not many good
> but unaligned ideas.

---

## 1. Signature shape (manual §4.11 — property-based APIs)

A hook signature is `(subject, [essential args], options?)`:

```ts
useX(subject, options?)              // most hooks
useX(subject, essential, options?)   // when one more arg is genuinely required
```

- **Lead with the subject** — the thing the hook operates on (a `target`, a `key`, a `value`,
  a `callback`). Not configuration.
- **All configuration goes in a single trailing `options` object**, named `options`, always
  last, always optional with sensible defaults. Users set only what they want to change, in any
  order, and the call site stays readable without comments.
- **Do not add a 3rd/4th bare positional value.** `useFavicon(href, baseUrl, rel)` is the
  anti-pattern (manual's Qt-3 `QSlider(8,128,1,6,…)`): unreadable at the call site. Fold extras
  into `options`.
- **`options` position is fixed.** It is always the *last* parameter. A required-config object
  in the middle (as `useCookie` once had `options` before `defaultValue`) silently mis-types
  arguments and breaks consistency with sibling hooks.

Mirror a native API's positional shape **only** when users already know it
(`useEventListener(event, handler, target, options)` ≈ `addEventListener`) — manual §3.3
(reuse familiar APIs) balanced against §4.6 (don't be a slave to the underlying API).

## 2. Naming (manual §4.1–4.6)

| Rule | Do | Don't |
|---|---|---|
| Self-explanatory, reads like English (§4.1) | `useScroll(target, options)` | one-letter / cryptic params |
| No abbreviations (§4.4), except the common set `min max dir rect prev ref` | `defaultValue` | `defVal`, `def` |
| Specific over general (§4.5) | `UseScrollOptions` | `Options` |
| `set`/`on` prefix means *only* setter/handler (§4.3) | `setValue`, `onScroll` | `set`-prefixing a non-setter |
| No typos — a published name is **locked forever** (§3.8, the `SHStripMneumonic` story) | review names before export | `useWindowsFocus`, `defauleValue` |

**The `default*` vs `initial*` distinction is intentional — keep it** (flattening it would be
the *false consistency* §4.3 warns against):

- **`default*`** — a fallback for state read from the environment, used when the real value is
  unavailable (SSR / hydration). Hooks reading external state: `useCookie`, `useLocalStorage`,
  `useMediaQuery`, `usePreferredDark`, `useDocumentVisibility`, `useWindowFocus`.
- **`initial*`** — the seed of internal mutable state the hook then owns. Stateful hooks:
  `useBoolean`, `useCounter`, `useToggle`, `useMap`.

Suffix: use **`Value`** for a scalar/boolean, **`State`** only when it is a `useState`-style
container (object or generic `S`, as in `useRafState`). Prefer `Value` when unsure.

**DOM target parameter** is always named **`target`** (type `BasicTarget<…>`), never
`targetElement` / `el` / `element`.

## 3. Return shape (manual §2.2 — readable code)

- **Tuple** `[value, setter]` or `[a, b]` — for ≤2 values, or the `useState`-like
  `[state, set]` idiom. Idiomatic React; lets callers name positions.
- **Object** `{ named, fields }` — for ≥3 fields, or heterogeneous fields where position would
  be ambiguous (manual §4.1 warns positional `[number, number]` hides which is which).
- **Pick one shape per concept and hold it.** Two hooks reporting the same kind of thing must
  return the same shape (see the `useElementSize` / `useWindowSize` deviation below).

## 4. Semantics (manual §4.7–4.9)

- **SSR-safe by default (§4.7, §4.12 "the best API is no API").** Never touch `window`/`document`
  at module top level. Guard with `isBrowser` / `defaultWindow`; the hook should return a sane
  server value with zero extra user code. See `knowledge-base.md`.
- **Boolean options default to `false`** and read affirmatively (`exact`, `preventDefault`),
  user opts in.
- **No clever side effects (§4.8).** No hidden format auto-detection, no one setter quietly
  flipping unrelated state. Least surprise.
- **Edge cases are covered by tests (§4.9)** — empty/undefined target, unmount, repeated calls.
- **Reuse the underlying API's option type when wrapping it** — `ResizeObserverOptions`,
  `IntersectionObserverInit`, `AddEventListenerOptions`, `Cookies.CookieAttributes`. This is
  deliberate (§3.3), not an inconsistency.

## 5. Process (manual §3.x)

- Write the call-site example first; let it shape the signature (§3.2).
- Find a sibling hook and match it (§3.3) — this file + `knowledge-base.md` are the router.
- **When in doubt, leave it out (§3.9).** A param renamed later is cheap; a wrong one shipped
  is locked. Don't add an option until it's actually needed.

---

## Known deviations (grandfathered)

Real inconsistencies that predate this spec. They are **not** runtime-fixed yet because the fix
is either purely cosmetic (param-name only — non-breaking, converge opportunistically) or a
return-shape change that needs a deliberate major-version decision. Do **not** copy these; do
**not** mass-rewrite them in unrelated PRs.

| Deviation | Hooks | Spec rule | Fix path |
|---|---|---|---|
| `Value`/`State` suffix drift | `defaultState` (×5: `useMediaQuery`, `usePreferred*`, `useReducedMotion`), `initialState` (booleans in `useIdle`, `useScrollLock`) | §2 suffix rule | param-rename, non-breaking — converge incrementally |
| Size returns disagree | `useElementSize` → `[w, h]` tuple vs `useWindowSize` → `{ width, height }` object | §3 one-shape-per-concept | breaking — decide at a major bump |
| Trailing bare positionals | `useFavicon(href, baseUrl, rel)` | §1 no 3rd bare value | fold into `options` at a major bump |
| Required mid-positional config | `useSticky(target, params, scrollElement?)` — `params` required, not named `options`, not last | §1 options-last | reshape at a major bump |

## Checklist for a new/changed public signature

1. Subject first; all config in a trailing optional `options` object.
2. No new bare positional beyond the 2nd argument.
3. Names: no abbreviations, no typos, `default*` vs `initial*` used correctly, DOM target = `target`.
4. Return shape matches the rule **and** any sibling hook of the same concept.
5. SSR-safe with no extra user code; boolean options default `false`.
6. A readable call-site example exists and reads without comments.
