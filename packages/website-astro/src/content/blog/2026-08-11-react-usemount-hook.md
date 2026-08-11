---
title: "React useMount Hook: Run an Effect Once on Mount (2026)"
description: "A practical guide to useMount in React: run code exactly when a component appears, without the empty-dependency-array ceremony. Covers what useMount actually is under the hood, the StrictMode double-run gotcha and how useOnceEffect solves it, the useUnmount stale-closure trap, async effects on mount, and when a plain useEffect is still the right call. TypeScript-first, SSR-safe."
slug: react-usemount-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-11
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react usemount, usemount, useMount hook, usemount react, componentDidMount hook, useEffect run once on mount, useEffect empty dependency array, react run code on mount, useEffect runs twice, react strict mode double render, useUnmount, react on mount hook, react lifecycle hooks]
image: /img/og.png
---

# React useMount Hook: Run an Effect Once on Mount (2026)

"Run this once, when the component appears." It's the single most common effect in React — focus an input, fire an analytics event, open a connection, read from a browser API. The idiom everyone reaches for is `useEffect` with an empty dependency array:

```tsx
useEffect(() => {
  trackPageView("/checkout");
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

It works, but look at what it costs: an empty array you must remember (forget it and the effect runs on *every* render), a lint suppression comment whenever the effect touches anything, and — worst of all — zero stated intent. `useEffect(fn, [])` says *how*; it never says *why*. Six months later, a teammate adds a dependency to that array "to fix the lint warning" and your run-once effect quietly becomes a run-on-change effect.

[`useMount`](https://reactuse.com/effect/usemount/) from [`@reactuses/core`](https://reactuse.com) is the named version of this idiom: `useMount(fn)` runs `fn` exactly once per mount, and the name *is* the documentation. This post covers what it actually compiles down to, the React 18+ StrictMode double-run that surprises everyone the first time, the subtle stale-closure bug in hand-rolled unmount cleanups (and how [`useUnmount`](https://reactuse.com/effect/useunmount/) dodges it), async work on mount, and — just as important — the cases where you should *not* use it.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useMount, useUnmount } from "@reactuses/core";
import { useRef } from "react";

function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  useMount(() => {
    inputRef.current?.focus();
  });

  useUnmount(() => {
    console.log("search box removed");
  });

  return <input ref={inputRef} placeholder="Search…" />;
}
```

No dependency array, no lint comment, and the reader knows the intent before reading the body: this runs on mount, full stop.

## What useMount Actually Is

No magic — here is the entire implementation, minus a dev-only type check:

```tsx
export const useMount = (fn: () => void) => {
  useEffect(() => {
    fn?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
```

That's it: `useEffect` with an empty array, wrapped once so *you* never write the array or the suppression comment again. Three things fall out of this five-line definition:

1. **Timing is `useEffect` timing.** The callback fires after the component is committed to the DOM — after first paint, browser APIs available. It is not `useLayoutEffect`; if you need to measure and mutate before paint, reach for a layout effect instead.
2. **It is SSR-safe by construction.** Effects simply never run on the server, so `useMount` is the natural home for `window`/`document` access in SSR apps — the same guarantee the manual `useEffect(fn, [])` gives you, with the intent spelled out.
3. **The return value is ignored.** `useMount` calls `fn?.()` and discards the result — it does **not** forward a returned function to React as cleanup. Cleanup belongs to `useUnmount` (below). A side effect of this design: passing an `async` function is safe, which is more than you can say for raw `useEffect` (more on that in a minute).

One consequence to internalize: because the dependency array is empty, the callback closes over **first-render values**. Props and state read inside `useMount` are frozen at their initial values. For a mount effect that's almost always what you want — but if you find yourself wanting fresh values inside, that's the signal you actually want `useEffect` with dependencies, or a [`useLatest`](https://reactuse.com/state/uselatest/) ref.

## The StrictMode Gotcha: "Why Does My Mount Effect Run Twice?"

Search "useEffect runs twice" and you'll find a decade of confusion. Here's the short version: since React 18, `<StrictMode>` in **development** deliberately mounts every component, unmounts it, and mounts it again. Any mount effect — `useEffect(fn, [])`, `useMount`, doesn't matter — runs twice in dev. In production it runs once.

React does this on purpose, to surface effects that don't clean up after themselves. The official guidance is: don't fight the double-run, make the effect **idempotent** — running it twice should be harmless because the cleanup undoes the first run:

```tsx
useMount(() => {
  const controller = new AbortController();
  fetch("/api/config", { signal: controller.signal }).then(applyConfig);
  // pair with useUnmount(() => controller.abort())
});
```

But some effects are *genuinely* once-only, and running them twice is a real bug, not a hygiene warning: an analytics beacon fires twice, a welcome toast pops twice, a payment-intent gets created twice in dev and QA files a ticket. For those, `@reactuses/core` ships [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/):

```tsx
import { useOnceEffect } from "@reactuses/core";

useOnceEffect(() => {
  trackPageView("/checkout"); // fires once, even under StrictMode
});
```

The trick inside is elegant: `useOnceEffect` records each effect function in a `WeakSet` before running it. StrictMode's remount re-invokes the *same* effect function instance from the same render, so the second invocation finds it already recorded and bails. Genuine remounts (the component actually left and came back) create a fresh function and run again — exactly the semantics "once per mount, ignoring StrictMode's rehearsal" implies.

Rule of thumb: **`useMount` + idempotent by default; `useOnceEffect` when a double-fire is observable to a user or a backend.**

## useUnmount — and the Stale-Closure Trap It Avoids

The obvious hand-rolled unmount cleanup has a bug most people ship without noticing:

```tsx
// ⚠️ hand-rolled version
useEffect(() => {
  return () => {
    saveDraft(draft); // draft from the FIRST render — always empty!
  };
}, []); // empty deps ⇒ the cleanup closure was created on render #1
```

The cleanup function was created on the first render, so it captured the first render's `draft`. When the component unmounts three minutes and forty keystrokes later, it saves an empty string. The "fix" of adding `draft` to the deps is worse — now the cleanup runs on every keystroke, not on unmount.

[`useUnmount`](https://reactuse.com/effect/useunmount/) solves this properly. Internally it stores your callback in a [`useLatest`](https://reactuse.com/state/uselatest/) ref that's updated every render, and the unmount cleanup calls through the ref:

```tsx
import { useUnmount } from "@reactuses/core";

function Composer() {
  const [draft, setDraft] = useState("");

  useUnmount(() => {
    saveDraft(draft); // ✅ the draft as of the LAST render
  });

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

Your callback runs exactly once, at unmount, and sees the latest state. This is the concrete reason to prefer `useUnmount` over the `return () => {}` idiom whenever the cleanup reads state or props — it's not sugar, it's a bug fix.

## Async Work on Mount

Raw `useEffect` famously rejects async functions — `useEffect(async () => {...}, [])` hands React a Promise where it expects a cleanup function, and you get a warning plus a skipped cleanup. Because `useMount` discards the callback's return value, an async callback is perfectly fine:

```tsx
useMount(async () => {
  const user = await fetchCurrentUser();
  setUser(user);
});
```

One thing this doesn't give you is protection against the component unmounting mid-`await` — calling `setUser` after unmount is harmless in React 18+ but often still not what you want (you may be writing to state that a remounted instance will clobber). Two library answers:

- [`useMountedState`](https://reactuse.com/state/usemountedstate/) returns an `isMounted()` function backed by a ref — check it after each `await`:

  ```tsx
  const isMounted = useMountedState();

  useMount(async () => {
    const user = await fetchCurrentUser();
    if (isMounted()) setUser(user);
  });
  ```

- [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/) generalizes the pattern for effects with dependencies, handing your async body a liveness check and supporting cleanup.

For real data fetching with caching and retries you'll outgrow both — that's React Query / SWR territory, or your framework's loaders. `useMount` is for the one-shot imperative stuff around the edges.

## The Mirror Image: Skipping the Mount

Sometimes you want the opposite — react to *changes* but not to the initial mount. Sync a filter to the URL, but don't rewrite the URL on first load; show "settings saved" on change, but not on arrival. That's [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/), and its primitive sibling [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) which simply tells you whether this is the first render:

```tsx
import { useUpdateEffect } from "@reactuses/core";

useUpdateEffect(() => {
  syncFilterToUrl(filter); // runs on filter changes, skips the mount
}, [filter]);
```

Together the four hooks cover the whole lifecycle vocabulary that classes used to spell `componentDidMount` / `componentDidUpdate` / `componentWillUnmount`:

| You want to run code… | Reach for |
| --- | --- |
| once, after the component appears | [`useMount`](https://reactuse.com/effect/usemount/) |
| once, even under StrictMode's dev double-run | [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/) |
| when the component is removed, seeing latest state | [`useUnmount`](https://reactuse.com/effect/useunmount/) |
| on updates only, skipping the first render | [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) |
| conditionally, based on "is this the first render?" | [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) |

## When *Not* to Use useMount

Honesty section. `useMount` is intent-naming sugar over a real React primitive, and the primitive is sometimes the right call:

- **The effect reads a prop or state that can change.** If `roomId` changes and you need to reconnect, that is `useEffect(connect, [roomId])` — a mount hook here is a synchronization bug wearing a convenience API. The empty array isn't ceremony in that case; it's wrong.
- **You're fetching server data for rendering.** Framework loaders, React Query, SWR — anything with caching, deduplication, and revalidation beats a fetch in a mount effect. React's own docs have walked away from "fetch in useEffect" as a primary pattern.
- **You need pre-paint measurement.** `useMount` is post-paint. Measure-then-mutate work belongs in a layout effect.
- **The "mount event" is actually a user event.** If code can run in the click handler that caused the component to appear, run it there — effects are for synchronizing with external systems, not a junk drawer.

The test is one question: *would this code ever need to re-run while the component is alive?* If the answer is any form of "yes, when X changes," you want `useEffect` and a dependency array. If it's a clean "no," `useMount` says so in a way `[]` never will.

## Takeaways

- `useMount(fn)` is `useEffect(fn, [])` with the intent in the name — no array to forget, no lint suppression, first-render closure semantics you should embrace, not fight.
- In React 18+ dev StrictMode every mount effect runs twice. Make effects idempotent by default; use [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/) when a double-fire is user- or backend-visible.
- Hand-rolled `return () => {}` cleanups with empty deps capture first-render state — a real, shipping bug. [`useUnmount`](https://reactuse.com/effect/useunmount/) reads through a latest-ref and sees final state.
- `useMount` accepts `async` callbacks (the return value is discarded); guard post-`await` state writes with [`useMountedState`](https://reactuse.com/state/usemountedstate/) or use [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/).
- For change-only effects, [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) is the mirror image.

`useMount`, `useUnmount`, `useOnceEffect`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
