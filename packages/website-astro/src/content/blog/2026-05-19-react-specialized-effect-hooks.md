---
title: "Beyond useEffect: Specialized Effect Hooks for Async, Deep Comparisons, and SSR"
description: "useEffect is the only effect hook React ships, and that single hook leaves you re-inventing the same wrappers in every project. A walkthrough of nine specialized effect hooks from ReactUse — useAsyncEffect, useUpdateEffect, useDeepCompareEffect, useCustomCompareEffect, useOnceEffect, useIsomorphicLayoutEffect, useUpdateLayoutEffect, useMount, useUnmount — and the friction each one removes."
slug: react-specialized-effect-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-19
tags: [react, hooks, performance, tutorial, ssr]
keywords: [react useEffect alternatives, react useAsyncEffect, react useUpdateEffect, react useDeepCompareEffect, react useCustomCompareEffect, react useIsomorphicLayoutEffect, react useMount, react useUnmount, react onceEffect, react useEffect async, react useEffect deep compare, react useEffect skip mount, react useLayoutEffect SSR]
image: /img/og.png
---

# Beyond useEffect: Specialized Effect Hooks for Async, Deep Comparisons, and SSR

React gives you exactly one effect hook: `useEffect`. Every other effect pattern — running once after mount, skipping the first render, comparing object dependencies, handling async work without a race condition, running layout effects on the server without a warning — is something you have to assemble yourself. Most teams end up shipping the same five or six wrapper hooks in a `utils/hooks.ts` file. Different teams write subtly different versions of the same thing. Some of those versions are broken.

<!-- truncate -->

This is the kind of repetitive infrastructure that does not belong in your codebase. [ReactUse](https://reactuse.com) ships the specialized effect hooks already — small, focused wrappers around `useEffect` and `useLayoutEffect` that close the most common gaps. This post walks each of nine of them: what `useEffect` makes awkward, what the hook does differently, and a concrete example of where it fits.

If you already use ReactUse for timers ([covered last week](/blog/react-timer-hooks/)), observers, or browser APIs, you have already imported some of these without thinking about it. The point of going through them deliberately is to know what is in the toolbox before you write the wrapper one more time.

## Why useEffect Alone Is Not Enough

Take a single line from a real component:

```tsx
useEffect(() => {
  fetch(`/api/user/${id}`).then((r) => r.json()).then(setUser);
}, [id]);
```

That snippet has four problems on day one and a fifth one a month later:

1. **No abort.** If `id` changes mid-flight, the old request resolves after the new one and overwrites the newer data — the classic race condition.
2. **No async/await.** You cannot mark the effect callback `async` because React expects either `undefined` or a cleanup function, not a Promise. So every async effect either uses `.then` chains or wraps an IIFE.
3. **No skip-on-mount option.** Sometimes you want to react to `id` changing but not run the effect when the component first renders (the parent already gave you the initial data). Plain `useEffect` always runs at least once.
4. **No deep compare on deps.** If `id` is `{ workspace: "a", user: "b" }`, every render produces a new object reference and the effect runs every time, even though nothing changed.
5. **SSR + `useLayoutEffect`.** A month later someone switches the component to use `useLayoutEffect` for some DOM measurement, and now SSR logs a warning on every page render.

Each of these is fixable, but the fix takes 5 to 30 lines and is easy to get subtly wrong. The hooks below close each gap directly.

## 1. useAsyncEffect — async/await Without the IIFE

The pattern everyone writes the first time:

```tsx
useEffect(() => {
  let cancelled = false;
  (async () => {
    const r = await fetch(`/api/user/${id}`);
    const data = await r.json();
    if (!cancelled) setUser(data);
  })();
  return () => { cancelled = true; };
}, [id]);
```

That works. It is also six lines of boilerplate to do what `async () => { setUser(await fetch(...).then((r) => r.json())); }` would do if React allowed it. [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/) closes that gap:

```tsx
import { useAsyncEffect } from "@reactuses/core";

useAsyncEffect(async () => {
  const r = await fetch(`/api/user/${id}`);
  setUser(await r.json());
}, [id]);
```

The hook accepts an `async` callback directly and ignores the Promise return value (no false-positive cleanup warning). It does **not** handle cancellation for you — that is the next hook's job, or a manual `AbortController`. Use `useAsyncEffect` when the async body is short and you do not need to bail out partway through. When you do need cancellation, wire up an `AbortController`:

```tsx
useAsyncEffect(async (signal) => {
  const r = await fetch(`/api/user/${id}`, { signal });
  setUser(await r.json());
}, [id]);
```

The hook passes an `AbortSignal` as the first argument and aborts it on cleanup, so the in-flight request is cancelled instead of resolving into a stale state setter.

This single hook removes about 80% of the "I should have used a wrapper" moments in a typical codebase. Most data-fetching effects are short, async, and want to be cancelled on change. `useAsyncEffect` is exactly that.

## 2. useUpdateEffect — Skip the Mount

`useEffect` always runs after the first render. Sometimes that is wrong: if a component already received its initial value from props, running the effect on mount duplicates work or fires a "value changed" notification when nothing has actually changed yet.

The workaround in plain React is a ref:

```tsx
const isFirst = useRef(true);
useEffect(() => {
  if (isFirst.current) { isFirst.current = false; return; }
  onChange(value);
}, [value]);
```

That works, but every team has at least three versions of this in their codebase. [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) is the same thing as `useEffect` minus the first run:

```tsx
import { useUpdateEffect } from "@reactuses/core";

useUpdateEffect(() => {
  onChange(value);
}, [value]);
```

The most common use case is **controlled-component change notifications**. You want to call `onChange` when the internal value updates, not when the parent first mounts the component with an initial value. The plain `useEffect` version fires on mount and the parent gets a spurious `onChange(initialValue)` before the user has done anything.

A second use case is **analytics**: "fire a `viewed_filter` event when the filter changes." The mount is not a change; it is the starting state.

## 3. useMount — The "Run Once on Mount" Idiom

`useEffect(() => { /* ... */ }, [])` is technically correct for "run once on mount." It is also visually noisy and a common lint-rule misfire (eslint's `exhaustive-deps` will complain if the callback closes over any variables, even when you genuinely mean "snapshot at mount").

[`useMount`](https://reactuse.com/effect/usemount/) is a one-purpose alias that documents intent:

```tsx
import { useMount } from "@reactuses/core";

useMount(() => {
  trackPageView();
  initialiseSentry();
});
```

Functionally identical to `useEffect(fn, [])`, but the name is the documentation. When you see `useMount`, you know without reading the deps that the callback fires exactly once. When you see `useEffect(fn, [])`, you have to scan the body to confirm there are no closed-over reactive variables that should have been in the deps.

## 4. useUnmount — Cleanup Without the Empty Effect

The mirror of `useMount`. The plain-React version of "do X on unmount" is:

```tsx
useEffect(() => () => doCleanup(), []);
```

That parses as "the effect callback returns a cleanup function." It is correct, but the inner double arrow is the kind of thing nobody reads twice. [`useUnmount`](https://reactuse.com/effect/useunmount/) is the explicit version:

```tsx
import { useUnmount } from "@reactuses/core";

useUnmount(() => {
  socket.close();
  flushAnalytics();
});
```

The hook captures the latest callback (via a ref internally) so you get the most recent values at unmount time, not the values from mount. That fixes a subtle bug in the plain-React version: if you write `useEffect(() => () => doCleanup(value), [])`, `value` is captured at mount and the cleanup runs against stale data. `useUnmount` does not have that bug.

## 5. useDeepCompareEffect — When Your Deps Are Objects

React compares effect deps with `Object.is`. If the dep is an object or array, every parent re-render produces a new reference and the effect runs even though the contents are identical. The "fix" most teams reach for is `JSON.stringify`-ing the dep, which works for shallow data and breaks for anything with functions, Dates, or non-serializable values.

[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) replaces `Object.is` with a structural deep equality check:

```tsx
import { useDeepCompareEffect } from "@reactuses/core";

useDeepCompareEffect(() => {
  fetcher.run(query);
}, [query]); // query is { workspace: "a", filters: { ... } }
```

When the parent re-renders and produces a new `query` object with the same contents, the effect does not re-run. When the contents actually change, it does. The trade-off is that deep equality is O(n) on the dependency size — it is not free. Reach for it when you have a small object dep you cannot memoize at the source. If you can `useMemo` the dep, prefer that.

There is one trap: do not use `useDeepCompareEffect` with primitive-only deps. The hook throws if you pass `[someString, someNumber]` — for those, `useEffect` is the right tool, and the hook fails loudly so you do not silently slow down an effect that did not need it.

## 6. useCustomCompareEffect — Deep Compare, Your Rules

Sometimes the equality you want is neither shallow nor fully structural. Two cases come up often:

- Compare by a single key (e.g., `prev.id === next.id`).
- Compare with a library you already depend on (e.g., `lodash.isEqual`, `dequal`).

[`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/) takes a third argument: a comparator that decides whether the new deps should trigger the effect.

```tsx
import { useCustomCompareEffect } from "@reactuses/core";
import { dequal } from "dequal";

useCustomCompareEffect(
  () => loadDashboard(filters),
  [filters],
  (prev, next) => dequal(prev, next),
);
```

The benefit over `useDeepCompareEffect` is **you control the cost**. Deep equality on a 200-key config object is slow; `(prev, next) => prev.version === next.version` is one comparison. If you have a version field, use it.

This is also the right hook for **fuzzy** equality — e.g., "treat two scroll positions as equal if they are within 5 pixels of each other." The plain `useEffect` version requires a wrapper ref and a manual comparison inside the effect body; the custom-compare version puts the equality logic next to the deps.

## 7. useOnceEffect — Run Exactly Once, With Reactive Deps

`useEffect(fn, [])` runs once on mount, but the callback closes over whatever the deps would have been at that moment — usually `undefined` or initial values. If you actually want **the first non-loading value of `user`** to trigger an effect, neither `useEffect(fn, [user])` (runs every time `user` changes) nor `useEffect(fn, [])` (runs at mount when `user` is still `null`) is correct.

[`useOnceEffect`](https://reactuse.com/effect/useonceeffect/) runs the effect the first time any dep changes from its initial value, then never again:

```tsx
import { useOnceEffect } from "@reactuses/core";

function PersonalisedGreeting() {
  const { user } = useAuth(); // user is null until loaded

  useOnceEffect(() => {
    track("personalised_greeting_seen", { userId: user.id });
  }, [user]);

  return user ? <h1>Hi, {user.name}!</h1> : null;
}
```

The effect fires once — the first time `user` becomes non-null — and never fires again, even if `user` changes later. This is the right shape for first-paint analytics, one-time onboarding triggers, and "do this once the prerequisite is ready" patterns. The plain-React version of this is a ref-and-flag dance that everyone has written and nobody enjoys reading.

`useOnceEffect` also has a layout-effect sibling, [`useOnceLayoutEffect`](https://reactuse.com/effect/useoncelayouteffect/), for the same pattern when you need DOM measurements before paint.

## 8. useIsomorphicLayoutEffect — Stop the SSR Warnings

`useLayoutEffect` runs synchronously after DOM mutations and before paint. It is the right hook for reading layout (measuring an element's size) and writing to the DOM in the same tick (positioning a tooltip relative to a trigger). It is also the hook that prints this warning during server-side rendering:

> useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format.

The standard fix is to swap `useLayoutEffect` for `useEffect` when `typeof window === "undefined"`. That is what [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) does:

```tsx
import { useIsomorphicLayoutEffect } from "@reactuses/core";

useIsomorphicLayoutEffect(() => {
  const { width } = ref.current!.getBoundingClientRect();
  setWidth(width);
}, []);
```

On the server, this is `useEffect` (which is a no-op during SSR — fine, because there is no layout to measure). On the client, it is `useLayoutEffect` (which fires synchronously, which is what you want for layout reads). One import, no warning, no special-casing.

This is the single most-copied snippet in the React ecosystem. If you have a `useLayoutEffect` anywhere in an SSR codebase (Next.js, Remix, Astro with islands), this hook should be the default.

## 9. useUpdateLayoutEffect — The Layout Variant of useUpdateEffect

The layout-effect sibling of `useUpdateEffect`. Same pattern: skip the first render, run on every subsequent dep change, but at layout-effect time so the DOM mutations happen before paint.

[`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) shines for layout-driven animations:

```tsx
import { useUpdateLayoutEffect } from "@reactuses/core";

useUpdateLayoutEffect(() => {
  const el = listRef.current;
  if (!el) return;
  el.style.transform = `translateY(${activeIndex * itemHeight}px)`;
}, [activeIndex]);
```

Why not `useUpdateEffect`? Because `useEffect` fires after paint, and the slide animation will visibly start from the previous position before snapping to the new one. `useLayoutEffect` runs before paint, which means the new transform is applied in the same frame. Why not plain `useLayoutEffect`? Because on the first render `activeIndex` is the initial value and there is no animation to start.

The combination "layout effect that skips mount" is the right shape for "animate a change but not the initial value." It is also the right shape for managed focus: focus the new tab content when `activeTab` changes, but not when the component first mounts with `activeTab="home"`.

## When to Use Which: A Decision Table

The full set, in one place:

| Situation                                            | Hook                          |
|------------------------------------------------------|-------------------------------|
| async/await effect body, want cancellation           | `useAsyncEffect`              |
| Skip the first run, react to subsequent changes      | `useUpdateEffect`             |
| Same as above but for layout effects                 | `useUpdateLayoutEffect`       |
| Run a callback once on mount (intent is clearer)     | `useMount`                    |
| Run a callback once on unmount (no stale capture)    | `useUnmount`                  |
| Effect deps are objects, want structural equality    | `useDeepCompareEffect`        |
| Effect deps need a custom equality check             | `useCustomCompareEffect`      |
| Run once, but wait for a dep to become "ready"       | `useOnceEffect`               |
| Same as above for layout effects                     | `useOnceLayoutEffect`         |
| Layout effect that doesn't warn during SSR           | `useIsomorphicLayoutEffect`   |

Three rules to keep in mind:

1. **Default to `useEffect`.** Specialized hooks are for the cases above; do not reach for them speculatively.
2. **Match layout to layout, async to async.** If you are doing DOM measurement, the right family is the layout-effect hooks. If you are doing data fetching, the right family is `useAsyncEffect`. Mixing them produces flicker or race conditions.
3. **`useUpdateEffect` is not "useEffect optimization."** It changes behavior, not performance. The first render still happens, you just do not run the effect on it. If your goal is performance, look at the deps array, not at the hook.

## A Realistic Combination

A common React pattern: a "search results" panel that fetches when the query changes, skips fetching on mount (the parent passed initial results), and announces "search updated" to screen readers — but not on mount, where the heading already conveys the same info.

```tsx
import {
  useAsyncEffect,
  useUpdateEffect,
  useIsomorphicLayoutEffect,
} from "@reactuses/core";

function SearchResults({ query, initialResults }: {
  query: string;
  initialResults: Result[];
}) {
  const [results, setResults] = useState(initialResults);
  const announceRef = useRef<HTMLDivElement>(null);

  // Skip mount; fetch on every subsequent query change.
  useUpdateEffect(() => {
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setResults(data); });
    return () => { cancelled = true; };
  }, [query]);

  // Layout effect: read the results count and update aria-live before paint.
  // Skips mount because the initial heading already says it.
  useIsomorphicLayoutEffect(() => {
    if (!announceRef.current) return;
    announceRef.current.textContent = `${results.length} results for ${query}`;
  }, [results, query]);

  return (
    <>
      <div ref={announceRef} role="status" aria-live="polite" className="sr-only" />
      <ul>{results.map((r) => <li key={r.id}>{r.title}</li>)}</ul>
    </>
  );
}
```

Three behaviors, three hooks, no refs-and-flags. Replace the first `useUpdateEffect` with `useAsyncEffect` if the body grows complicated enough to want async/await; the rest stays the same.

## Try Them Out

Every hook above has a runnable demo on its docs page. Read the demo, change the deps, watch what fires:

- [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/)
- [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)
- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/)
- [`useMount`](https://reactuse.com/effect/usemount/)
- [`useUnmount`](https://reactuse.com/effect/useunmount/)
- [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/)
- [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/)
- [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/)
- [`useOnceLayoutEffect`](https://reactuse.com/effect/useoncelayouteffect/)
- [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/)

Install with `npm install @reactuses/core` (or `pnpm add @reactuses/core`) and import directly. No provider, no peer dependencies beyond React 16.8+. The full hook list and source for everything we discussed is at [reactuse.com](https://reactuse.com).

`useEffect` is a primitive. These hooks are the language you would build on top of it if you did it once and stopped re-inventing it across projects.
