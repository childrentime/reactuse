---
title: "React useDeepCompareEffect: Fix useEffect Object Dependencies (2026)"
description: "Why useEffect re-runs forever when a dependency is an object or array, and how useDeepCompareEffect fixes it. Covers the real implementation, the extra-render cost, the function-in-deps trap lodash isEqual can't solve, useCustomCompareEffect for cheaper comparisons, and the ESLint config that keeps exhaustive-deps working. TypeScript-first."
slug: react-usedeepcompareeffect-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-27
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useDeepCompareEffect, useDeepCompareEffect hook, usedeepcompareeffect react, react useEffect object dependency, useEffect infinite loop, useEffect deep compare, react deep comparison dependencies, useEffect array dependency, react useEffect runs every render, useCustomCompareEffect, react effect dependency array object, useDeepCompareEffect typescript]
image: /img/og.png
---

# React useDeepCompareEffect: Fix useEffect Object Dependencies (2026)

You wire up a fetch. The endpoint takes a query object, so you pass it in the dependency array. The effect fires, sets state, the component re-renders, the query object is rebuilt — a brand-new object with identical contents — and the effect fires again. You have written an infinite loop, and React thinks it did exactly what you asked.

```tsx
function Results({ term, page }: Props) {
  const [rows, setRows] = useState([]);
  const query = { term, page, sort: 'desc' }; // new object, every render

  useEffect(() => {
    fetchRows(query).then(setRows); // setRows → re-render → new query → 🔁
  }, [query]);
}
```

`useDeepCompareEffect` from [`@reactuses/core`](https://reactuse.com) is a drop-in replacement for `useEffect` that compares dependencies by *value* instead of by reference. Same signature, same cleanup semantics — the effect just stops firing when nothing actually changed. Everything below is the real implementation, TypeScript-first, including the parts that cost you something.

<!-- truncate -->

## Why `useEffect` Can't See It

React compares dependency arrays with `Object.is`, element by element. For primitives that's exactly what you want: `5` is `5`, `'desc'` is `'desc'`. For anything with an identity — objects, arrays, `Date`s, `Map`s, functions — it compares the *reference*, and a literal written inside a component body produces a fresh reference on every single render:

```js
Object.is({ term: 'react' }, { term: 'react' }); // false — different objects
```

So the dependency "changed" on every render, by React's definition. This isn't a bug in `useEffect`; reference equality is the only comparison that's O(1), and React runs it on every render of every component. The cost of value comparison is real, and React declines to pay it on your behalf.

Which leaves you paying it — one way or another.

## The Usual Workarounds, and Where They Fray

**Memoize the object.** Correct, and the right answer when there's one dependency:

```tsx
const query = useMemo(() => ({ term, page, sort: 'desc' }), [term, page]);
```

It frays when the object doesn't come from you. Data arrives from a fetch, a context, a form library, a parent component that re-renders freely — you can't `useMemo` a prop at its source, so you memoize a copy, and now you maintain a parallel dependency array that has to be kept in sync with the object's shape. Add a field, forget the memo, ship a stale effect.

**Spread the primitives into the array.** Also correct, also brittle:

```tsx
useEffect(() => { fetchRows(query); }, [query.term, query.page, query.sort]);
```

This works right up until the object is nested, or optional, or has fields you don't control. `[config.retry.limit, config.retry.backoff, config.auth?.scheme]` is a dependency array that silently goes wrong the day someone adds a field.

**`JSON.stringify` the dependency.** Tempting, and genuinely popular:

```tsx
useEffect(() => { fetchRows(query); }, [JSON.stringify(query)]);
```

It serializes on *every render* whether anything changed or not, key order changes the string (`{a,b}` and `{b,a}` are "different"), `undefined` and functions vanish silently, `Date`s become strings, `Map`s and `Set`s become `{}`, and it throws outright on circular references. It's a deep comparison with worse semantics and no early exit.

**Disable the lint rule and hope.** The one that actually ships, and the one that causes stale-closure bugs six months later.

## useDeepCompareEffect

```tsx
import { useDeepCompareEffect } from '@reactuses/core';

function Results({ term, page }: Props) {
  const [rows, setRows] = useState([]);
  const query = { term, page, sort: 'desc' };

  useDeepCompareEffect(() => {
    let cancelled = false;
    fetchRows(query).then((r) => !cancelled && setRows(r));
    return () => { cancelled = true; };
  }, [query]);
}
```

The signature is `useEffect`'s, exactly:

```ts
function useDeepCompareEffect(
  effect: EffectCallback,   // may return a cleanup function
  deps: DependencyList
): void;
```

No new concepts: the effect runs after mount, re-runs when the dependency list is *not deeply equal* to the previous one, and its returned cleanup runs before each re-run and on unmount. The loop above stops after the first fetch, because `{ term: 'react', page: 1, sort: 'desc' }` deep-equals the object from last render.

Deep equality comes from lodash's `isEqual`, so the coverage is the good kind — nested objects and arrays, `Date`s by timestamp, `RegExp`s by source and flags, `Map`s and `Set`s by contents rather than insertion order:

```js
isEqual(new Date(0), new Date(0));                    // true
isEqual(new Map([['a', 1]]), new Map([['a', 1]]));    // true
isEqual(new Set([1, 2]), new Set([2, 1]));            // true
isEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } });  // true
```

## How It Actually Works (and the Render It Costs)

Worth understanding, because it explains the one surprising behavior. `useDeepCompareEffect` is a thin wrapper over [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/) with `isEqual` as the comparator, and the core is about ten lines:

```tsx
const ref = useRef<TDeps | undefined>(undefined);
const forceUpdate = useUpdate();

if (!ref.current) ref.current = deps;

useIsomorphicLayoutEffect(() => {
  if (!depsEqual(deps, ref.current)) {
    ref.current = deps;   // adopt the new deps
    forceUpdate();        // and re-render so useEffect sees them
  }
});

useEffect(effect, ref.current); // React only ever sees the stable ref'd array
```

The trick is that React never receives your freshly-built array. It receives `ref.current`, which only gets swapped when the comparison says something genuinely changed. Deeply-equal renders hand React the identical array and it correctly concludes: nothing to do.

The consequence — and this is the honest caveat — is that **a real dependency change costs one extra render**. The layout effect notices the change *after* `useEffect` was already registered with the old array, so it updates the ref and forces a re-render; the effect fires on that second pass. It's a layout effect, so this happens before the browser paints and you'll never see a flash. But if you're counting renders in a hot component, count this one. (Comparison is skipped entirely when the deps are already reference-equal — `isEqual` short-circuits on `===`, so the steady state is cheap.)

It also means the [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) inside keeps the whole thing SSR-safe: no `useLayoutEffect` warning during server rendering.

## The Trap: Functions in the Dependency Array

This one bites people, and no deep-compare hook can save you from it. **lodash's `isEqual` compares functions by reference** — two functions with identical source are never equal:

```js
isEqual(() => {}, () => {});                         // false
isEqual({ url: '/api', onDone: () => {} },
        { url: '/api', onDone: () => {} });          // false ← the object too
```

That second line is the killer. One inline callback anywhere inside an object makes the *entire object* permanently unequal, and your `useDeepCompareEffect` degrades silently back into a plain `useEffect` that fires on every render — infinite loop restored, with an extra render each time for good measure.

```tsx
// 🔴 fires forever — onSuccess is a new function every render
useDeepCompareEffect(() => {
  subscribe(config);
}, [{ ...config, onSuccess: (d) => setData(d) }]);
```

Fix it by keeping functions out of the compared value. Hold the callback in a ref that always points at the latest version and depend only on the data:

```tsx
// ✅ compare the data; read the callback through a ref
const onSuccess = useLatest((d: Data) => setData(d));

useDeepCompareEffect(() => {
  subscribe(config, (d) => onSuccess.current(d));
}, [config]);
```

[`useLatest`](https://reactuse.com/state/uselatest/) keeps a ref pinned to the newest value each render, so the effect calls today's callback without depending on its identity. [`useEvent`](https://reactuse.com/effect/useevent/) does the same job with a stable function identity if you'd rather pass the callback itself. The rule that follows from both: **dependency arrays should carry data, not behavior.**

## When Deep Comparison Is Too Expensive: useCustomCompareEffect

`isEqual` walks the whole structure. On a small config object that's nothing — a handful of property reads, cheaper than the render it prevents. On a 5,000-row API response it's a full traversal on every render, and you've traded an unnecessary effect for a guaranteed one.

When you know what actually matters, compare only that:

```tsx
import { useCustomCompareEffect } from '@reactuses/core';

useCustomCompareEffect(
  () => { renderChart(dataset); },
  [dataset],
  ([prev], [next]) => prev.id === next.id && prev.updatedAt === next.updatedAt,
);
```

Two field reads instead of a 5,000-element walk. The comparator receives the previous and next dependency *arrays* and returns `true` when they should be considered equal — the same contract `isEqual` fulfils, just with your domain knowledge baked in. Anything with a version field, an ETag, a `updatedAt`, or a stable id is a candidate.

A rough decision rule:

| Dependency | Reach for |
| --- | --- |
| Primitives only | plain `useEffect` |
| Small config / options / query object | `useDeepCompareEffect` |
| One object you own and control | `useMemo` at the source |
| Large data, or a natural version key | `useCustomCompareEffect` |
| A function | `useLatest` / `useEvent`, then depend on the data |

## Keep exhaustive-deps Working

The `react-hooks/exhaustive-deps` lint rule doesn't know your custom hook takes a dependency array, so it stops checking — which is how stale closures get in. Tell it:

```js
// eslint.config.js
{
  rules: {
    'react-hooks/exhaustive-deps': ['warn', {
      additionalHooks: '(useDeepCompareEffect|useCustomCompareEffect)',
    }],
  },
}
```

Now the same missing-dependency warnings you rely on for `useEffect` apply here too. Worth doing on day one — a deep-compare hook with an incomplete dependency array is harder to debug than a plain effect, because "it re-runs too often" at least announces itself, while "it never re-runs" just quietly serves old data.

## Two Rules That Prevent Most Surprises

**Don't use it with primitive-only or empty dependencies.** Deep comparison buys you nothing over `Object.is` when every dependency is a string or a number — it's pure overhead plus a possible extra render. Passing an empty array is a mistake the hook actively warns you about in development:

> `useDeepCompareEffect` should not be used with no dependencies. Use React.useEffect instead.

For run-once effects, [`useMount`](https://reactuse.com/effect/usemount/) says what you mean. To skip only the first run, [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/).

**Keep the array a fixed length.** This is React's own constraint, not the hook's: a dependency array that changes size between renders triggers a development warning and undefined comparison behavior. Don't build the array conditionally — `[config, ...(flag ? [extra] : [])]` is a bug waiting for a Tuesday. Put the conditional value *inside* an object dependency instead, where deep comparison handles it.

## Real Use Cases

- **Fetching with a query object.** The canonical case, and the one from the top of this post — filters, pagination, sort state assembled inline and passed to an API.
- **Subscriptions keyed by config.** WebSocket topics, event-source channels, observers configured by an options object — re-subscribing on every render is a resource leak with a heartbeat.
- **Chart and map libraries.** Imperative libraries that take an options object and cost real milliseconds to reconfigure. Deep-comparing a config object is far cheaper than a needless `chart.setOption()`.
- **Effects driven by parsed data.** URL search params parsed to an object, JSON from `localStorage`, a decoded JWT payload — all new references each render, all deeply stable in practice.
- **Props you don't own.** A third-party component hands you an options object it rebuilds internally. You can't memoize at the source; you can compare by value at the destination.

## Takeaways

- **`useEffect` compares by reference,** so an inline object or array dependency is "new" every render — that's the infinite-loop and re-fetch-storm bug, not a mistake in your logic.
- **[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) is `useEffect` with value comparison** — identical signature, identical cleanup semantics, backed by lodash `isEqual` (handles nested structures, `Date`, `Map`, `Set`, `RegExp`).
- **A real change costs one extra render.** It's a layout effect, so nothing flashes — but know it's there before you reach for this in a hot path.
- **Functions in deps defeat it.** `isEqual` compares functions by reference, and one inline callback poisons the whole object. Keep behavior in [`useLatest`](https://reactuse.com/state/uselatest/) / [`useEvent`](https://reactuse.com/effect/useevent/); keep data in the dependency array.
- **Big dependencies want [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/)** — compare an `id` and an `updatedAt` instead of walking 5,000 rows.
- **Add `additionalHooks` to `exhaustive-deps`,** and skip the hook entirely for primitive-only or empty dependency arrays.

Grab it from [`@reactuses/core`](https://reactuse.com/effect/usedeepcompareeffect/) and let your effects fire when your data changes — not when your object literals do.
