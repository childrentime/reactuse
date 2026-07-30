---
title: "React useUpdateEffect Hook: Skip the First Render (2026)"
description: "A practical guide to useUpdateEffect in React: run an effect on dependency changes but not on mount, the four-line implementation behind it, verified StrictMode behavior (the callback really does fire on mount in dev — with test output to prove it), cleanup semantics, and when useMount, useUpdate, or useDeepCompareEffect is the hook you actually want. TypeScript-first."
slug: react-useupdateeffect-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-30
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useUpdateEffect, useupdateeffect, useEffect skip first render, react useEffect skip initial render, run effect only on update, useEffect not on mount, react effect on change only, useUpdateEffect typescript, useUpdateEffect strictmode, react skip effect on mount]
image: /img/og.png
---

# React useUpdateEffect Hook: Skip the First Render (2026)

`useEffect` has no opinion about *why* it's running. Mount, update, doesn't matter — the callback fires either way. Which is how a "settings saved ✓" toast greets users the moment the page loads, an autosave POSTs a form nobody has touched yet, and an analytics event reports a "change" that was actually just the component appearing. What you meant was *run this when the value changes*; what you wrote was *run this when the value changes, and also once at the start for no reason*.

[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) from [`@reactuses/core`](https://reactuse.com) is `useEffect` minus the mount run: identical signature, identical cleanup semantics, skips exactly one invocation. The implementation is four lines, so this post covers what those four lines do, the one place the abstraction genuinely leaks — React 18 StrictMode, where we'll prove with a test that the callback *does* fire on mount in development — and the neighboring hooks people confuse it with. TypeScript-first.

<!-- truncate -->

## The Hand-Rolled Guard

There's no mystery about how to skip a mount run — every React codebase past a certain age contains this:

```tsx
function SearchFilters({ filters }: { filters: Filters }) {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackEvent("filters_changed", filters); // not on page load, please
  }, [filters]);
  // ...
}
```

It works. The problem isn't correctness, it's that the guard is *per effect*: the ref, the check, and the flip get re-typed into every effect that needs the behavior, and the actual intent — three words, "skip the mount" — is buried under six lines of ceremony. Variants of the recipe also rot in review: someone "simplifies" the flag into `useState` and buys an extra render, or copies the guard into a second effect but shares one ref between them, so whichever effect runs first consumes the skip and the other one fires on mount anyway.

The fix is the standard one for boilerplate with a name: give it the name.

## useUpdateEffect — useEffect, Minus the Mount

```tsx
import { useState } from 'react';
import { useUpdateEffect } from '@reactuses/core';

function EditorSettings({ userId }: { userId: string }) {
  const [settings, setSettings] = useState(loadDefaults);

  useUpdateEffect(() => {
    saveSettings(userId, settings);
    toast("Settings saved ✓");
  }, [settings]);

  return <SettingsForm value={settings} onChange={setSettings} />;
}
```

On mount: nothing — no phantom save, no toast over a form the user hasn't touched. On every `settings` change after that: exactly what `useEffect` would do. The signature is `useEffect`'s, verbatim:

```ts
function useUpdateEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
```

Dependency array, cleanup function returned from the effect, all of it behaves the way your `useEffect` instincts say it should. There is nothing new to learn, which is the point.

## Four Lines, One Primitive

The [implementation](https://reactuse.com/effect/useupdateeffect/) is a wrapper so thin it's almost embarrassing to walk through — almost:

```ts
const createUpdateEffect = (hook) => (effect, deps) => {
  const isFirstMount = useFirstMountState();

  hook(() => {
    if (!isFirstMount) {
      return effect();
    }
  }, deps);
};

export const useUpdateEffect = createUpdateEffect(useEffect);
```

And the primitive underneath, [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/), which answers "is this the first render?" by flipping a ref during render:

```ts
export const useFirstMountState = (): boolean => {
  const isFirst = useRef(true);
  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }
  return isFirst.current;
};
```

Two details are worth pausing on. First, the *effect itself still runs on mount* — React registers it, diffs the deps, schedules the callback as usual. What's skipped is *your* function inside it. That matters because it means the deps array is live from render one; the second render's diff has something real to compare against. Second, `createUpdateEffect` is a factory over the effect hook, which is how [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) exists: same skip, `useLayoutEffect` timing, for when the update-only work measures or mutates the DOM before paint.

Cleanup follows from "your callback never ran": there's nothing to clean up after mount, so the first cleanup runs before the *second* update-run of your effect — and on unmount, if your effect has run at least once, its cleanup fires normally. The library's own test suite pins that down.

## The StrictMode Gotcha — Verified, Not Rumored

Here's the section most `useUpdateEffect` write-ups skip, and it's the one that will actually bite you. Wrap the component in `<StrictMode>` on React 18+ and run it in development:

```tsx
const effect = jest.fn();

function Comp() {
  const [c, setC] = useState(0);
  useUpdateEffect(() => { effect(c); }, [c]);
  // ...
}

render(<StrictMode><Comp /></StrictMode>);
// effect.mock.calls.length === 2   ← on MOUNT. Twice.
```

That's not a hypothetical — it's the output of a test against the real implementation. The "skip the first run" hook runs on mount, twice, in StrictMode dev. Here's the chain:

1. StrictMode **double-invokes the render function**. The first invocation flips the ref: `useFirstMountState` returns `true`. The second invocation — same component instance, same ref — finds it already flipped and returns `false`. Instrumenting the hook shows exactly `[true, false]` across the two passes.
2. The committed render is the second one, so the effect closure captures `isFirstMount === false`. The guard is already defeated before any effect runs.
3. StrictMode then **runs effects twice** (mount → simulated unmount → remount), and both runs sail through the open guard. Two calls.

Before you file the bug: this isn't a reactuse defect, it's the collision StrictMode exists to cause. Flipping a ref during render is how essentially every ref-based first-mount detector works, and "how many times has this function rendered" is precisely the kind of hidden render-count dependency StrictMode's double-invocation is designed to smoke out. Production builds don't double-invoke, so **in production the skip works exactly as advertised** — the divergence is dev-only.

The practical guidance:

- Use `useUpdateEffect` for **UX-grade** skips — toasts, autosaves, analytics, refetch-on-filter-change. A dev-only extra firing costs you nothing real, and in production it behaves.
- Don't use it for **correctness-grade** guarantees — "this network call must never happen at mount" enforced only by `useUpdateEffect` will happen at mount on every StrictMode dev run, and you'll burn an afternoon on it. Correctness wants a condition on *data*, not on render count: compare against the previous value with [`usePrevious`](https://reactuse.com/state/useprevious/), or check the actual state ("form is dirty") before firing.

If you've ever seen a "my useUpdateEffect runs on mount!" issue on a hooks library — this is what happened, every time.

## Don't Confuse It With Its Neighbors

The effect family has some near-collision names, and picking wrong is a category error rather than a bug, so — a field guide:

- [`useMount`](https://reactuse.com/effect/usemount/) is the mirror image: runs the callback **only** on mount, never on updates. Between it and `useUpdateEffect`, the two halves of `useEffect` get names.
- [`useUpdate`](https://reactuse.com/effect/useupdate/) — despite the name — is not in this family at all. It returns a function that **forces a re-render**. If you reached for it wanting "effect on update," you wanted this post's hook instead.
- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) is the same skip on `useLayoutEffect` timing — update-only DOM measurement without a flash of unpainted state.
- [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) solves the *other* classic effect complaint: deps compared by `Object.is`, so a fresh object literal re-fires every render. If your effect over-fires because of object identity rather than mount timing, that's the hook you want.
- [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) is the primitive itself — reach for it directly when you need first-render awareness *during render* (e.g., skipping an animation class on initial paint), not inside an effect.

## Real Use Cases

- **Autosave that respects hydration.** Form state arrives from the server or `localStorage`; saving it back on mount is at best a wasted write and at worst clobbers fresher data with defaults. Save on *change*. (Debounce it too — [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) composes cleanly inside the callback.)
- **Change notifications.** "Theme updated", "Filters applied", "Copied!" — feedback for an *action*. On mount there was no action, so a toast on page load reads as a glitch. This is the single most common reason people go looking for this hook.
- **Skip the duplicate initial fetch.** The page was server-rendered with data, or the first payload came down in props; the effect exists to *re*fetch when the query changes. Mount run = an immediate second request for data already on screen.
- **Analytics on transitions.** `trackEvent("sort_changed", sort)` should mean the user changed the sort — not that the component mounted with a default. Pair with [`usePrevious`](https://reactuse.com/state/useprevious/) when the event payload needs from → to.

## SSR Safety

Nothing to guard. Effects never run during server rendering — that's React, not the library — and `useFirstMountState` touches no `window`, no `document`, only a ref. Server render, hydration, first client render: your callback stays unfired through all three, then wakes on the first real update. SSR-safe by construction, like every hook in [`@reactuses/core`](https://reactuse.com) aims to be — though this one earns it by simply having nothing to get wrong.

## Takeaways

- **`useEffect` runs on mount; sometimes you meant "on change only."** [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) is that intent with a name — same signature, same cleanup, minus one invocation.
- **The implementation is a four-line wrapper** over [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/); the effect still registers on mount, only your callback is skipped, so deps tracking starts from render one.
- **StrictMode dev fires it on mount — twice — and that's verified, not folklore.** Double-invoked renders defeat any ref-flipped-during-render guard. Production is unaffected. Use it for UX-grade skips; enforce correctness-grade rules on data, not render counts.
- **Mind the name collisions**: [`useMount`](https://reactuse.com/effect/usemount/) is the complement, [`useUpdate`](https://reactuse.com/effect/useupdate/) is a re-render trigger from a different universe, and identity-caused over-firing wants [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/).
- **SSR-safe with zero ceremony** — effects don't run on the server, and the mount skip carries through hydration untouched.

Grab it from [`@reactuses/core`](https://reactuse.com/effect/useupdateeffect/) and let your effects stop celebrating their own birth.
