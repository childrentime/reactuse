---
title: "The Ref Escape Hatch: React Hooks for Stale Closures, Stable Callbacks, and Force Updates"
description: "Every render in React is a snapshot, and closures capture the snapshot they were born in — that is where stale state, broken memoization, and 'setState on an unmounted component' all come from. A walkthrough of seven ReactUse hooks built on the ref escape hatch — useEvent, useLatest, useMountedState, usePrevious, useFirstMountState, useUpdate, and useMergedRefs — and the exact bug each one removes."
slug: react-ref-escape-hatch
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-20
tags: [react, hooks, performance, tutorial]
keywords: [react stale closure, react useEvent, react useLatest, react stable callback, react useMountedState, react setState unmounted component, react usePrevious, react useFirstMountState, react force update, react useUpdate, react merge refs, react useMergedRefs, react useEffectEvent, react closure captures stale state]
image: /img/og.png
---

# The Ref Escape Hatch: React Hooks for Stale Closures, Stable Callbacks, and Force Updates

Every function component re-runs from scratch on every render, and every closure created during that render captures the props and state as they were *at that moment*. That is the whole React model in one sentence, and it is also the source of an entire family of bugs: the event handler that reads a stale count, the `useEffect` that re-subscribes on every render because its callback identity changed, the `setState` that fires after the component already unmounted. They look like different problems. They are all the same problem — a closure holding onto a snapshot that has moved on.

<!-- truncate -->

React's official answer to "I need a value that survives renders without being captured" is `useRef`. A ref is a mutable box whose identity never changes; reading `ref.current` always gives you the *current* value, not the one from when the closure was created. That is the escape hatch. The trouble is that wiring a ref up correctly — keeping it in sync, reading it at the right time, not breaking SSR — is fiddly enough that everyone writes a slightly different version, and some of those versions race.

[ReactUse](https://reactuse.com) ships the productized versions. This post walks seven of them. None is more than a dozen lines of source; the value is that they are the *correct* dozen lines, the same in every project. If you read [last week's post on specialized effect hooks](/blog/react-specialized-effect-hooks/), this is the companion piece: those hooks fix `useEffect`, these fix the closures that flow through it.

## The Bug, Concretely

Here is a chat component that polls for unread messages and shows the count. It is wrong in a way that survives code review:

```tsx
function Inbox({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // BUG: `count` here is always 0 — the value captured when the
      // effect first ran. The interval never sees an updated count.
      console.log(`Polling, current count is ${count}`);
      fetchUnread(userId).then((n) => setCount(count + n));
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // count intentionally left out, or the interval resets every change

  return <Badge>{count}</Badge>;
}
```

The interval callback closes over `count` on the render where the effect ran. `count` was `0` then, so it is `0` forever inside that closure — `setCount(count + n)` is really `setCount(0 + n)`. The usual "fixes" each trade one bug for another: add `count` to the deps and the interval tears down and rebuilds every five seconds; use the `setCount((c) => c + n)` updater and you have fixed the write but the `console.log` still lies, and any logic that needs to *read* the latest count outside a setter is still stuck.

What you actually want is: a stable interval that never resets, which can still read the latest `count` when it fires. That is a ref. The hooks below are refs with the ergonomics filled in.

## 1. useLatest — Always Read the Current Value

[`useLatest`](https://reactuse.com/state/uselatest/) takes a value and returns a ref that always holds the most recent version of it. The ref's identity never changes, so anything that closes over the ref — an interval, an event listener, a long-lived callback — reads through it to today's value, not the one frozen at subscription time.

```tsx
import { useLatest } from "@reactuses/core";

function Inbox({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const countRef = useLatest(count);

  useEffect(() => {
    const id = setInterval(() => {
      // countRef.current is always the latest count, even though
      // the effect ran exactly once.
      console.log(`Polling, current count is ${countRef.current}`);
      fetchUnread(userId).then((n) => setCount(countRef.current + n));
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // no `count` in deps — the interval is stable

  return <Badge>{count}</Badge>;
}
```

The effect depends only on `userId`, so the interval is created once and survives every count change. The read goes through `countRef.current`, which `useLatest` keeps current by writing to it in a layout effect on every render. This is the single most useful member of the family: any time you find yourself adding a value to a dependency array *only* so the closure can read it — and not because you want the effect to re-run — `useLatest` is the fix.

## 2. useEvent — A Stable Callback That Always Sees Fresh State

`useLatest` solves reading a *value* through a stable reference. [`useEvent`](https://reactuse.com/effect/useevent/) solves the same problem for a *function*: it returns a callback whose identity is frozen for the component's lifetime, but which always invokes the latest version of the function you passed — with the latest props and state baked in.

This is the hook that lets you pass a handler to a memoized child without breaking its memoization:

```tsx
import { useEvent } from "@reactuses/core";

function SearchBox({ onResults }: { onResults: (r: Result[]) => void }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  // Stable identity, but reads the latest query AND filters every call.
  const search = useEvent(() => {
    runSearch(query, filters).then(onResults);
  });

  // <ExpensiveButton> is React.memo'd. Because `search` never changes
  // identity, the button never re-renders on query/filter keystrokes.
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveButton onClick={search}>Search</ExpensiveButton>
    </>
  );
}
```

Without `useEvent`, you reach for `useCallback(() => runSearch(query, filters), [query, filters])` — which produces a *new* `search` on every keystroke, defeating `React.memo` on the button. Drop the deps to `[]` and the closure goes stale, searching for the empty initial query forever. `useEvent` gives you both: stable identity and fresh closure. If the name looks familiar, this is the same idea as React's experimental `useEffectEvent` / the old `useEvent` RFC — available today, no canary build required. Use it for event handlers and callbacks you pass downward; keep it out of dependency arrays where you actually *want* re-runs.

## 3. useMountedState — Don't setState After Unmount

The "Can't perform a React state update on an unmounted component" warning comes from an async operation resolving after the component is gone. The fix is a flag that flips on unmount, checked before every late `setState`. [`useMountedState`](https://reactuse.com/state/usemountedstate/) is that flag, as a ref behind a getter:

```tsx
import { useMountedState } from "@reactuses/core";

function UserCard({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const isMounted = useMountedState();

  useEffect(() => {
    fetchUser(id).then((u) => {
      // The fetch may resolve after the user navigates away.
      if (isMounted()) setUser(u);
    });
  }, [id]);

  return user ? <Card user={user} /> : <Spinner />;
}
```

`isMounted` is a stable getter — calling it returns the current mount state from a ref, so you can call it inside any async callback without adding it to dependency arrays. It is deliberately a function and not a boolean: a boolean would itself be a stale snapshot. For fetches you can often prefer an `AbortController`, but `useMountedState` covers the cases an abort signal does not reach — timers, third-party promises, subscription callbacks.

## 4. usePrevious — Compare Against the Last Render

Sometimes you need the value from the *previous* render to decide what to do this one: animate in a direction based on whether a number went up or down, fire an effect only when a value actually changed from a specific old value, log transitions. [`usePrevious`](https://reactuse.com/state/useprevious/) hands you exactly that:

```tsx
import { usePrevious } from "@reactuses/core";

function Price({ value }: { value: number }) {
  const previous = usePrevious(value);
  const direction =
    previous === undefined ? "flat" : value > previous ? "up" : value < previous ? "down" : "flat";

  return <span className={`price price--${direction}`}>${value.toFixed(2)}</span>;
}
```

On the first render `previous` is `undefined` (there was no prior render), and on every render after, it holds the value from the render before. ReactUse's implementation tracks this with state updates during render rather than the naive "write a ref in an effect" approach — which matters because the effect-based version reports the wrong value during the render itself. Worth knowing what the hook does under the hood, but the point is you stop reimplementing it.

## 5. useFirstMountState — Know If This Is the First Render

A close cousin: instead of the previous *value*, you sometimes just need to know whether this is the very first render. [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) returns `true` on the initial render and `false` on every render after — synchronously, during render, before any effect runs.

```tsx
import { useFirstMountState } from "@reactuses/core";

function Analytics({ route }: { route: string }) {
  const isFirstMount = useFirstMountState();

  useEffect(() => {
    // Distinguish the initial page load from later client-side navigations.
    track(isFirstMount ? "page_view_initial" : "page_view_spa", { route });
  }, [route]);

  return null;
}
```

This is the building block behind "skip the mount" effect hooks like `useUpdateEffect` — but exposed directly for when you want the boolean in render logic, not just in an effect. Because it reads during render (it does not wait for an effect), you can use it to choose initial styles, decide whether to animate, or branch JSX, none of which an effect-based "did mount" flag can do in time.

## 6. useUpdate — Force a Re-render on Demand

Refs are invisible to React's render cycle: mutating `ref.current` does not schedule a render. Usually that is the point. Occasionally you have state that genuinely lives outside React — a value on a ref, an external store, a mutable instance — and you need to tell React "something changed, paint again." [`useUpdate`](https://reactuse.com/effect/useupdate/) returns a function that does exactly one thing: force a re-render.

```tsx
import { useUpdate, useLatest } from "@reactuses/core";

function StopwatchDisplay({ stopwatch }: { stopwatch: ExternalStopwatch }) {
  const update = useUpdate();

  useEffect(() => {
    // The stopwatch mutates its own elapsed time; it does not live in React state.
    // Subscribe and force a render on each tick so the display reflects it.
    return stopwatch.onTick(() => update());
  }, [stopwatch, update]);

  return <time>{stopwatch.elapsed}ms</time>;
}
```

`update` has a stable identity, so it is safe in dependency arrays and effect bodies. Reach for it sparingly — most "I need to force a render" instincts are better served by actual state — but for bridging an external mutable source into React's render cycle, it is the precise tool, and far clearer than the `useReducer((x) => x + 1, 0)` incantation people copy around.

## 7. useMergedRefs — Point Many Refs at One Node

The last one is a different flavor of ref problem: not staleness, but *composition*. A DOM node can only be handed to one `ref` prop, but you frequently have several consumers that each need it — your own measurement ref, a forwarded ref from a parent, and a library's ref (a drag handle, a focus trap, an intersection observer). [`useMergedRefs`](https://reactuse.com/state/usemergedrefs/) combines them into a single ref callback that fans the node out to all of them:

```tsx
import { forwardRef, useRef } from "react";
import { useMergedRefs } from "@reactuses/core";

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(props, forwardedRef) {
  const localRef = useRef<HTMLInputElement>(null); // we want to measure/focus it ourselves
  const mergedRef = useMergedRefs(localRef, forwardedRef);

  // localRef.current and the parent's ref both point at the same input.
  return <input ref={mergedRef} {...props} />;
});
```

It handles both shapes of ref — object refs (`{ current }`) and callback refs (`(node) => …`) — and assigns the node to each. This removes the most tedious boilerplate in the React component library author's life: the hand-rolled `setRef` helper that every design system reinvents, usually without handling callback refs correctly.

## Putting It Together

The opening `Inbox` bug, written with the toolbox instead of around it:

```tsx
import { useLatest, useMountedState, useEvent } from "@reactuses/core";

function Inbox({ userId, onOpen }: { userId: string; onOpen: (id: string) => void }) {
  const [count, setCount] = useState(0);
  const countRef = useLatest(count);
  const isMounted = useMountedState();

  useEffect(() => {
    const id = setInterval(() => {
      fetchUnread(userId).then((n) => {
        if (isMounted()) setCount(countRef.current + n); // fresh count, no late update
      });
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // stable interval — never rebuilds on count change

  // Stable handler for a memoized row, always reading the latest count.
  const handleOpen = useEvent(() => {
    track("inbox_open", { unread: countRef.current });
    onOpen(userId);
  });

  return <InboxButton onClick={handleOpen} badge={count} />;
}
```

Three hooks, three classes of closure bug closed: a stable interval that reads fresh state (`useLatest`), no setState-after-unmount (`useMountedState`), and a stable handler that does not break the memoized child (`useEvent`). No dependency-array gymnastics, no `setRef` helper, no `useReducer` force-update trick.

## Try Them Out

Each hook has a runnable demo on its docs page — open one, mutate the inputs, and watch what stays stable and what stays fresh:

- [`useLatest`](https://reactuse.com/state/uselatest/)
- [`useEvent`](https://reactuse.com/effect/useevent/)
- [`useMountedState`](https://reactuse.com/state/usemountedstate/)
- [`usePrevious`](https://reactuse.com/state/useprevious/)
- [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/)
- [`useUpdate`](https://reactuse.com/effect/useupdate/)
- [`useMergedRefs`](https://reactuse.com/state/usemergedrefs/)

Install with `npm install @reactuses/core` (or `pnpm add @reactuses/core`) and import directly. No provider, no peer dependencies beyond React 16.8+. The full hook list and source for everything above is at [reactuse.com](https://reactuse.com).

The mental model is the whole game: every render is a snapshot, closures capture the snapshot, and `useRef` is the door out. These seven hooks are the door, with the hinges already oiled.
