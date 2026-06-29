---
title: "React useDebounce Hook: Debounce State & Callbacks (2026)"
description: "A practical guide to the useDebounce hook in React: debounce a value, debounce a callback, and cancel or flush pending calls — without the stale-closure bugs that the raw setTimeout version always ships with. SSR-safe and TypeScript-first."
slug: react-usedebounce-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-29
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useDebounce, useDebounce hook, react debounce input, debounce react hook, usedebounce react, react debounce state, react debounce callback, useDebounceFn, debounce search input react, react debounce typescript, ssr-safe debounce, react debounce api calls, lodash debounce react, react debounce onChange]
image: /img/og.png
---

# React useDebounce Hook: Debounce State & Callbacks (2026)

You have a search box. The user types `react hooks`, and your component fires an API request on every single keystroke — eleven requests for one query, ten of them already stale by the time they resolve. The fix everyone reaches for is *debouncing*: wait until the typing stops, then fire once. The fix everyone gets *wrong* is writing that debounce by hand with `setTimeout` inside a component, where stale closures, missing cleanup, and re-render churn quietly break it.

`useDebounce` is the hook that gets it right. This post covers the two shapes you actually need — debouncing a **value** and debouncing a **callback** — when to use each, and how to `cancel` or `flush` pending calls. Everything here is the real [`@reactuses/core`](https://reactuse.com) API, SSR-safe and typed.

<!-- truncate -->

## Why Not Just Use setTimeout?

Debouncing itself is simple: delay a function until a quiet period has passed, restarting the timer on every new call. (If you want the full conceptual breakdown — and how it differs from throttling — see [Debounce vs Throttle in React](https://reactuse.com/blog/react-debounce-vs-throttle/).) The hard part is doing it *inside a React component*. Here is the naive version, and it has three bugs:

```tsx
function Search() {
  const [query, setQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetchResults(value); // 🐛 see below
    }, 300);
  }

  return <input value={query} onChange={handleChange} />;
}
```

1. **It leaks on unmount.** If the component unmounts while a timer is pending, the callback still fires 300 ms later — often setting state on a gone component, or hitting an API for a screen the user already left.
2. **It captures stale values.** The moment you debounce anything other than the raw event value — a second piece of state, a prop, a derived value — the closure freezes whatever those were when the timer was set, not when it fires.
3. **It spreads.** Every place that needs debouncing re-implements the `useRef` + `clearTimeout` dance, and each copy is a chance to forget the cleanup.

A hook fixes all three in one place. ReactUse ships two, built on the battle-tested `lodash.debounce` internally so the edge cases (leading edge, max wait, trailing edge) are already handled.

## useDebounce — Debounce a Value

The most common case: you have a value that changes rapidly and you want a *second*, lagging copy of it that only updates after things settle. That second copy is what you feed into expensive work.

```tsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@reactuses/core';

function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search…"
    />
  );
}
```

The signature is `useDebounce(value, wait?, options?)` and it returns the debounced value, with the same type as the input:

```ts
const debounced = useDebounce(value, 300);
```

The input (`query`) updates on every keystroke, so the controlled `<input>` stays perfectly responsive — that's the value you bind to the DOM. The output (`debouncedQuery`) only catches up 300 ms after the user stops typing, so it's the value you put in the effect's dependency array. The API fires once per pause instead of once per keystroke, and your input never feels laggy because the thing you typed into was never the thing being debounced.

This pattern — fast value for the UI, debounced value for the side effect — is the whole point. Keep them as two separate variables and the rest falls into place.

## useDebounceFn — Debounce a Callback

Debouncing a value is great when the thing you want to throttle is *state*. But sometimes you want to debounce an **action** that takes arguments — an autosave, an analytics event, a resize handler — without routing it through state first. That's [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/):

```tsx
import { useDebounceFn } from '@reactuses/core';

function Editor({ docId }: { docId: string }) {
  const { run } = useDebounceFn((content: string) => {
    saveDraft(docId, content);
  }, 1000);

  return (
    <textarea onChange={(e) => run(e.target.value)} />
  );
}
```

`useDebounceFn(fn, wait?, options?)` returns an object with three members:

```ts
const { run, cancel, flush } = useDebounceFn(fn, 1000);
```

- **`run`** — the debounced function. Call it as often as you like; `fn` only actually executes after the calls stop for `wait` ms. It forwards every argument through, so `run(content)` calls `fn(content)`.
- **`cancel`** — drop any pending invocation. Nothing fires.
- **`flush`** — fire the pending invocation *right now*, instead of waiting out the timer.

Crucially, `run` always calls the **latest** version of your `fn`. Internally the hook keeps your callback in a ref, so even though the debounced wrapper is created once, it never goes stale — the `docId` closure problem from the `setTimeout` version simply doesn't exist here. And the hook cancels any pending call automatically on unmount, so bug #1 is gone too.

> `useDebounce` is actually built *on top of* `useDebounceFn` — it debounces a `setState` call and hands you the resulting value. Same engine, two ergonomics.

### cancel and flush in practice

The `cancel`/`flush` pair is what raw `setTimeout` makes painful and a hook makes trivial. Two real cases:

```tsx
function CommentBox() {
  const { run: autosave, cancel, flush } = useDebounceFn(
    (text: string) => saveDraft(text),
    2000,
  );

  return (
    <>
      <textarea onChange={(e) => autosave(e.target.value)} />
      {/* User hit "Post" — persist immediately, don't wait out the 2s */}
      <button onClick={() => flush()}>Post</button>
      {/* User hit "Discard" — throw away the pending autosave */}
      <button onClick={() => cancel()}>Discard</button>
    </>
  );
}
```

`flush` guarantees the in-flight draft is written before the post request goes out; `cancel` makes sure a discarded draft doesn't get saved a beat later. Both are one call.

## Value or Callback — Which One?

A quick decision rule:

- Reach for **`useDebounce`** when you're debouncing a piece of **state** that something else reads — a search term, a filter, a slider value feeding a chart. You want a lagging *value*.
- Reach for **`useDebounceFn`** when you're debouncing an **action with arguments** — autosave, logging, firing a network request directly. You want a lagging *function*, plus `cancel`/`flush` control.

If you find yourself creating a piece of state *only* to debounce it and then immediately fire an effect, `useDebounceFn` is usually the more direct tool.

## Tuning: leading, trailing, and maxWait

The optional third argument is passed straight through to `lodash.debounce`, so you get its full options object:

```ts
useDebounce(value, 300, {
  leading: false,  // don't fire on the very first call (default)
  trailing: true,  // fire after the pause (default)
  maxWait: 1000,   // …but never wait longer than 1s total
});
```

Two knobs worth knowing:

- **`leading: true`** fires on the *first* call immediately, then debounces the rest. Good for "respond instantly, then settle" interactions — the first click of a button feels snappy while rapid repeats are absorbed.
- **`maxWait`** caps the total delay. With a pure trailing debounce, a user who types continuously for ten seconds gets *zero* updates until they stop. `maxWait: 1000` forces an update at least once a second even mid-burst — the difference between a search box that feels alive and one that feels frozen.

## SSR Safety

Both hooks are safe to render on the server. They touch no `window`, `document`, or browser timer during render — the debounced work only ever runs inside effects, which React never executes on the server. Drop them into a Next.js, Remix, or Astro component and there's no `typeof window` guard to write, no hydration warning to chase. (If SSR-safety is a running theme in your codebase, [SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) goes deeper.)

## The Rate-Limiting Family

`useDebounce` has three close relatives in ReactUse; pick by *what* you're limiting and *which* shape you need:

| Hook | Limits a… | Strategy |
| --- | --- | --- |
| [`useDebounce`](https://reactuse.com/state/usedebounce/) | value | debounce (fire after the pause) |
| [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) | callback | debounce, with `cancel`/`flush` |
| [`useThrottle`](https://reactuse.com/state/usethrottle/) | value | throttle (fire at a fixed rate) |
| [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) | callback | throttle, with `cancel`/`flush` |

The throttle pair mirrors the debounce pair exactly — same `(value/fn, wait, options)` signature, same return shapes — but enforces a steady cadence instead of waiting for silence. Use throttle for things that should update *during* a continuous gesture (scroll position, drag coordinates, a live progress readout); use debounce for things that should update only *after* it ends (search, autosave, validation). The full mental model is in [Debounce vs Throttle in React: When to Use Which](https://reactuse.com/blog/react-debounce-vs-throttle/).

## Takeaways

- A hand-rolled `setTimeout` debounce inside a component ships three bugs by default: it leaks on unmount, it captures stale closures, and it gets copy-pasted.
- **`useDebounce(value, wait)`** gives you a lagging copy of a value — type into the fast one, run effects off the slow one. Perfect for search-as-you-type.
- **`useDebounceFn(fn, wait)`** debounces an action and hands you `{ run, cancel, flush }`. `run` always calls your latest callback (no stale closures) and auto-cancels on unmount.
- Use `flush` to commit a pending call early (submit) and `cancel` to drop it (discard).
- The third argument is `lodash.debounce` options — `leading` for instant-first-call, `maxWait` to cap the delay so long bursts still update.
- Both are SSR-safe and sit alongside `useThrottle`/`useThrottleFn` for the fixed-rate case.

Grab them from [`@reactuses/core`](https://reactuse.com/state/usedebounce/) and delete your `clearTimeout` boilerplate.
