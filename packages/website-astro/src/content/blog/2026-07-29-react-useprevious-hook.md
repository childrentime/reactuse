---
title: "React usePrevious Hook: Track Previous State & Props (2026)"
description: "A practical guide to usePrevious in React: why the classic useRef + useEffect recipe silently returns the wrong value after unrelated re-renders, the setState-during-render pattern the React docs actually recommend, previous-distinct-value semantics, the unstable-object infinite-loop gotcha, and when to reach for useLatest instead. TypeScript-first."
slug: react-useprevious-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-29
tags: [react, hooks, state, typescript, tutorial]
keywords: [react usePrevious, usePrevious hook, useprevious react, react previous state, react previous props, how to get previous value in react, react compare previous and current state, usePrevious typescript, react useRef previous value, react detect state change direction]
image: /img/og.png
---

# React usePrevious Hook: Track Previous State & Props (2026)

React gives you the current value of state and props on every render — and no built-in way to ask what the value was *before*. So everyone copies the same ten-line recipe: stash the value in a ref inside `useEffect`, return `ref.current`. It works in the demo, ships to production, and then one day a "count went up ↑" indicator starts claiming nothing changed — because the component re-rendered for a completely unrelated reason and the ref quietly overwrote its own history.

`usePrevious` from [`@reactuses/core`](https://reactuse.com) tracks the previous *distinct* value instead of the previous *render's* value, using the pattern the React docs themselves recommend — no refs, no effects, no drift. The whole implementation is twelve lines, so this post walks through the real bug in the classic recipe, why the fix looks illegal but isn't, and the one gotcha that can send it into an infinite loop. TypeScript-first.

<!-- truncate -->

## The Classic Recipe, and Where It Frays

This is the version that lives in a thousand blog posts and probably a few of your codebases:

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```

Render, then the effect fires and copies the current value into the ref. Next render reads the ref — the value from one render ago. The subtle part is in that last phrase: this hook returns the value from the previous **render**, not the previous **value**. Those are the same thing only as long as the *only* reason your component re-renders is the value changing. It never stays that way.

Watch it break. A counter with a direction indicator, plus one unrelated piece of state:

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const [dark, setDark] = useState(false);
  const prevCount = usePrevious(count); // the ref version

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setDark(!dark)}>toggle theme</button>
      {prevCount !== undefined && prevCount !== count && (
        <span>{count > prevCount ? "↑ went up" : "↓ went down"}</span>
      )}
    </div>
  );
}
```

Click **+1**: `count` is 5, `prevCount` is 4, the indicator shows "↑ went up". Correct. Now click **toggle theme**: `count` hasn't moved, but the component re-renders, the effect runs again, and the ref becomes 5. On the next render `prevCount === count`, and the indicator vanishes — the component now believes the count never changed. Any parent re-render, context update, or sibling state change does the same thing. The comparison you built the hook for is exactly what the hook corrupts.

This isn't a hypothetical: it's the same failure reported against [react-use](https://github.com/streamich/react-use/issues/2605), [ahooks](https://github.com/alibaba/hooks/issues/2162), and [reactuse itself](https://github.com/childrentime/reactuse/issues/115) before the implementation was replaced.

## usePrevious — Previous *Value*, Not Previous *Render*

```tsx
import { useState } from 'react';
import { usePrevious } from '@reactuses/core';

function Counter() {
  const [count, setCount] = useState(0);
  const [dark, setDark] = useState(false);
  const prevCount = usePrevious(count);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setDark(!dark)}>toggle theme</button>
      <p>Now: {count}, before: {prevCount ?? "—"}</p>
    </div>
  );
}
```

The signature:

```ts
function usePrevious<T>(value: T): T | undefined;
```

Toggle the theme as many times as you like — `prevCount` stays 4, because the count never actually changed. On the first render it returns `undefined`, since there is no prior value yet; type your comparisons as `T | undefined` accordingly.

The [implementation](https://reactuse.com/state/useprevious/) is short enough to quote in full, and it contains no refs and no effects:

```ts
export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T>();

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}
```

## Wait — setState During Render?

Yes, and it's not a hack: it's the pattern from the React docs, under [*storing information from previous renders*](https://react.dev/reference/react/useState#storing-information-from-previous-renders). Calling a setter while rendering is legal under two conditions, and this code meets both:

- **It's the component's own state.** React handles a render-phase update by throwing away the current render's output and immediately re-running the component with the new state — before touching the DOM, before painting, before any effect runs. No intermediate frame is ever visible.
- **It's behind a condition that eventually goes quiet.** `value !== current` is true for exactly one render after a change; the re-run then sees `value === current` and falls through. No loop.

Compare what each version anchors its history to. The ref recipe records "whatever the value was last render" — so *every* render rewrites history, related or not. The state version records "whatever the value was before it last *changed*" — unrelated re-renders hit `value === current` and touch nothing. That single guard is the entire bug fix.

It also holds up under React 18's stricter execution models, where the effect-and-ref version gets shakier. StrictMode double-invokes render functions in development: here, the second invocation runs the same comparison against the same state and lands in the same place — idempotent. Concurrent features can throw a render away before committing: a discarded render's state updates are discarded with it, whereas a ref mutation inside a render (the other popular "fix") escapes the render and leaks into a timeline that officially never happened. State-during-render is the one variant that's correct under all of it.

## The Gotcha: Unstable Objects

The comparison is `!==` — strict reference equality. Feed the hook a fresh object literal every render and `value !== current` is *always* true:

```tsx
// 💥 Too many re-renders
const prev = usePrevious({ x: position.x, y: position.y });
```

Every render creates a new object, the guard fires, the render-phase setState triggers a re-run, which creates *another* new object, and React halts the whole thing with "Too many re-renders." The fix is the usual referential-stability discipline: pass primitives, or memoize the object so its identity only changes when its contents do:

```tsx
const point = useMemo(() => ({ x, y }), [x, y]);
const prevPoint = usePrevious(point); // ✅
```

Primitives — numbers, strings, booleans — are always safe, and they're what you're tracking ninety percent of the time. (If your real problem is "run an effect when a deeply-nested object *actually* changes," that's [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/)'s job, not this hook's.)

## usePrevious vs useLatest

The two get confused because both are "a hook holding a value across time," but they answer opposite questions:

- [`usePrevious`](https://reactuse.com/state/useprevious/) answers **"what was this value before it changed?"** — for comparisons during render: direction of change, from/to labels, transition detection.
- [`useLatest`](https://reactuse.com/state/uselatest/) answers **"what is this value right now?"** from inside a stale closure — a `setInterval` callback, a debounced handler, an event listener registered once on mount.

If you're rendering a diff, you want `usePrevious`. If a callback keeps seeing an old value, you want `useLatest`. Needing one is never a sign you need the other.

## Real Use Cases

- **Direction of change.** Sort arrows, price tickers, scroll direction, "↑ 3 more than yesterday" — anything rendered from `value > prev`. This is the case the ref recipe visibly breaks, since one unrelated re-render erases the direction.
- **Transition detection.** Fire logic when a prop crosses a boundary, not merely when it's in a state: `prevStatus === "loading" && status === "success"` shows a toast exactly once per completed request. Pair with [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) to also skip the mount render.
- **From → to animations.** Number tickers and chart transitions need both endpoints; `usePrevious` hands you the starting value for the tween without a second piece of state.
- **"Changed from X to Y" UI.** Audit-style forms and settings panels that show what edits are pending — render `prev` and `value` side by side; on the first render `prev` is `undefined` and you show nothing.

## SSR Safety

`usePrevious` is two `useState` calls and a comparison — no `window`, no `document`, no effects, nothing to guard. On the server it renders once and returns `undefined`, the client's first render returns the same `undefined`, and hydration matches by construction. Unlike hooks that read browser state (a cookie, `localStorage`, a media query), there is no server/client divergence to design around. It's SSR-safe the boring way: by not doing anything.

## Takeaways

- **The classic `useRef` + `useEffect` recipe tracks the previous *render*, not the previous *value*** — any unrelated re-render silently rewrites it, which is precisely the bug filed against every major hooks library that shipped it.
- **[`usePrevious`](https://reactuse.com/state/useprevious/) uses setState-during-render** — the React-docs-sanctioned pattern: conditional, self-terminating, invisible to the user, and correct under StrictMode and concurrent rendering.
- **First render returns `undefined`** — there's no history yet; type against `T | undefined`.
- **Comparison is by reference** — pass primitives or `useMemo`-stabilized objects, or the render-phase guard fires forever and React stops you with "Too many re-renders."
- **Previous value vs current value in a closure are different problems** — comparisons want `usePrevious`; stale callbacks want [`useLatest`](https://reactuse.com/state/uselatest/).

Grab it from [`@reactuses/core`](https://reactuse.com/state/useprevious/) and let "previous" actually mean previous.
