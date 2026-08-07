---
title: "React useEvent Hook: Stable Callbacks Without Stale Closures (2026)"
description: "A practical guide to useEvent in React: a callback whose identity never changes but which always reads the latest state and props. Covers the stale-closure problem, how useEvent differs from useCallback and React 19.2's useEffectEvent, the layout-effect trick inside, and when not to use it. TypeScript-first, SSR-safe."
slug: react-useevent-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-07
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useEvent, useevent, useEvent hook, useEffectEvent, useCallback stale closure, react stable callback, stable function reference react, react event handler hook, useevent react, useCallback alternative, react memo callback prop, fix stale closure react]
image: /img/og.png
---

# React useEvent Hook: Stable Callbacks Without Stale Closures (2026)

Every React developer eventually meets the same fork in the road. You write an event handler that reads state, pass it to a child or an effect, and now you must choose: leave it as a plain inline function and watch every render create a new reference — breaking `React.memo`, re-running effects, re-subscribing listeners — or wrap it in `useCallback` and start playing dependency-array whack-a-mole, where one forgotten dependency means the handler sees state from three renders ago.

That second failure mode has a name — the **stale closure** — and it's arguably the most common React bug in production code. The fix has a name too: `useEvent`, proposed in an [official React RFC in 2022](https://github.com/reactjs/rfcs/blob/main/text/0000-useevent.md), and available today as [`useEvent`](https://reactuse.com/effect/useevent/) in [`@reactuses/core`](https://reactuse.com). It gives you a function whose **identity never changes across renders** but whose body **always sees the latest state and props**. Both halves of the fork, no trade-off.

This post covers the API, the three-line implementation trick that makes it work, how it compares to `useCallback` and to React 19.2's built-in `useEffectEvent`, real patterns, and the one rule you must respect (don't call it during render). TypeScript-first.

<!-- truncate -->

## The Problem in Thirty Seconds

Here's the bug factory. A chat component sends a heartbeat with the current draft text:

```tsx
function Composer({ roomId }: { roomId: string }) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      sendHeartbeat(roomId, draft); // ⚠️ which draft?
    }, 3000);
    return () => clearInterval(id);
  }, [roomId]); // draft intentionally omitted — we don't want to reset the timer

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

The interval closes over the `draft` that existed when the effect ran — the empty string. Every heartbeat sends `''` forever. Add `draft` to the dependency array and the closure is fresh, but now the interval tears down and restarts on **every keystroke**. `useCallback` doesn't help: it has the exact same dependency array, so it forces the exact same choice — stale values or churning identity.

What you actually want is a function that is *one stable thing* over the component's lifetime, but *reads current values* whenever it fires. That's `useEvent`:

```tsx
import { useEvent } from '@reactuses/core';

function Composer({ roomId }: { roomId: string }) {
  const [draft, setDraft] = useState('');

  const beat = useEvent(() => {
    sendHeartbeat(roomId, draft); // ✅ always the latest draft and roomId
  });

  useEffect(() => {
    const id = setInterval(beat, 3000);
    return () => clearInterval(id);
  }, [beat]); // beat never changes — effect runs once

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

`beat` is referentially identical on every render, so the effect runs once and the interval survives typing. When it fires, it reads `draft` through the latest render's closure. The dependency array is even honest — `beat` is listed, it just happens to be stable.

## The Full API

There's almost nothing to learn:

```ts
const stableFn = useEvent(fn);
```

- **`fn`** — any function. Arguments and return value pass straight through, `this` included.
- **`stableFn`** — same TypeScript type as `fn`, but its identity is fixed for the lifetime of the component.

The typing is exact, not `(...args: any[]) => any`:

```tsx
const format = useEvent((n: number, unit: string) => `${n}${unit}`);
format(3, 'px');   // ✅ string
format('3', 'px'); // ❌ type error
```

In development, passing a non-function logs `useEvent expected parameter is a function, got …` to the console instead of failing silently.

## How It Works Inside

The entire implementation is short enough to read over coffee, and every line earns its place:

```ts
export const useEvent = <T extends Fn>(fn: T) => {
  const handlerRef = useRef(fn);

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = fn;
  }, [fn]);

  return useCallback((...args) => {
    const fn = handlerRef.current;
    return fn(...args);
  }, []) as T;
};
```

Three details worth noticing:

1. **A ref carries the latest closure.** Each render produces a fresh `fn` closing over fresh state; the effect stashes it in `handlerRef`. The returned wrapper — memoized once with an empty dependency array — reads `handlerRef.current` *at call time*, not at render time. Stable shell, fresh core.

2. **The ref updates in a layout effect, not a passive effect.** [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) runs synchronously after DOM mutation, *before* the browser paints and before passive `useEffect` callbacks. If the ref were updated in a plain `useEffect`, any event that fired in the gap — or any other effect running earlier in the same commit — could call the wrapper and hit the previous render's closure. The layout timing closes that window.

3. **Isomorphic means SSR-safe.** `useLayoutEffect` on the server prints a hydration warning; `useIsomorphicLayoutEffect` swaps in `useEffect` during SSR and the real thing in the browser. No warnings, no special-casing in your code.

If this ref-holding trick sounds familiar, it's the same idea as [`useLatest`](https://reactuse.com/state/uselatest/) — `useEvent` is essentially `useLatest` plus a stable callable wrapper. Reach for `useLatest` when you want to *read* a fresh value inside some existing callback; reach for `useEvent` when the callback itself is the thing you're passing around.

## useEvent vs useCallback

They solve different problems, and the comparison makes both clearer:

| | `useCallback` | [`useEvent`](https://reactuse.com/effect/useevent/) |
|---|---|---|
| **Identity** | Changes whenever deps change | **Never changes** |
| **Closure freshness** | Only as fresh as your dep array is correct | **Always latest** — read at call time |
| **Dependency array** | Required; the bug surface | None |
| **Callable during render?** | ✅ Yes | ❌ No — event/effect time only |
| **Best for** | Values computed *during* render (memoized selectors, render props) | Handlers *fired* later (events, timers, subscriptions) |

The render-time row is the real dividing line. `useCallback`'s result is an ordinary value — you can call it while rendering to compute JSX. `useEvent`'s wrapper reads a ref that is only guaranteed current *after* commit, so calling it during render can observe a previous render's state (and breaks the concurrent-rendering contract the RFC was careful about). The rule of thumb writes itself: **if the function fires in response to something — a click, a tick, a message — use `useEvent`. If it computes something during render, use `useCallback`.**

## useEvent vs React's useEffectEvent

The 2022 RFC was ultimately superseded: React shipped the idea as [`useEffectEvent`](https://react.dev/reference/react/useEffectEvent), stable since React 19.2. If you're on 19.2+ you should know how the two relate:

- **`useEffectEvent` is deliberately narrower.** The returned function may only be called from *inside effects* (the ESLint rule enforces it), and must not be passed to other components or hooks. React's team scoped it to the one pattern they considered airtight: reading fresh values from an effect without re-triggering it.
- **`useEvent` covers the wider surface.** Passing a stable handler to a memoized child, an imperative widget, a WebSocket wrapper, or a third-party SDK — all things `useEffectEvent`'s linter will reject — are precisely what a userland `useEvent` is for. The trade-off is that the wider surface includes the render-time foot-gun above, and *you* hold the discipline instead of the linter.
- **They coexist fine.** Use `useEffectEvent` inside effects on React 19.2+, and `useEvent` for stable identity across component boundaries — or use `useEvent` everywhere below 19.2, where `useEffectEvent` doesn't exist.

## Patterns

### A Handler Prop That Doesn't Break React.memo

The classic list-row scenario — a memoized row re-renders anyway because the parent recreates `onSelect` each render:

```tsx
const Row = React.memo(function Row({ item, onSelect }: RowProps) {
  return (
    <li onClick={() => onSelect(item.id)} className="row">
      {item.label}
    </li>
  );
});

function List({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = useEvent((id: string) => {
    // reads latest `selected`, no dep array to maintain
    setSelected(selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id]);
  });

  return (
    <ul>
      {items.map(item => (
        <Row key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </ul>
  );
}
```

`handleSelect` is the same reference on every render, so `React.memo` actually memoizes. With `useCallback` you'd either list `selected` (identity churns, memo defeated) or use the functional-update form everywhere (fine here, impossible once the handler reads two pieces of state).

### Subscriptions That Never Re-Subscribe

WebSockets, `EventSource`, SDKs — anywhere tearing down a connection just because a closure went stale is embarrassing:

```tsx
function usePriceFeed(symbol: string, threshold: number) {
  const [price, setPrice] = useState(0);

  const onMessage = useEvent((e: MessageEvent) => {
    const next = JSON.parse(e.data).price as number;
    setPrice(next);
    if (next > threshold) notify(symbol, next); // latest threshold, always
  });

  useEffect(() => {
    const ws = new WebSocket(`wss://feed.example.com/${symbol}`);
    ws.addEventListener('message', onMessage);
    return () => ws.close();
  }, [symbol, onMessage]); // reconnects only when symbol changes

  return price;
}
```

The socket reconnects when `symbol` changes — a real reason — and never when `threshold` does. Note that for plain DOM targets, [`useEventListener`](https://reactuse.com/effect/useeventlistener/) already does this internally (it wraps your handler in `useLatest`), so you only need `useEvent` when *you* own the subscription plumbing.

### Timers — or Just Use the Library's

The heartbeat example above is common enough that `@reactuses/core` ships it solved: [`useInterval`](https://reactuse.com/effect/useinterval/) keeps your callback fresh without restarting the timer — and its own implementation is built on `useEvent` and `useLatest`. Same story for [`useTimeout`](https://reactuse.com/effect/usetimeout/), [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/), and [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/): the stale-closure protection is baked in, so check whether the hook you're about to build already exists before wiring `useEvent` yourself.

### Stable Callbacks for Imperative Widgets

Chart libraries, map SDKs, and editors typically take handlers at construction time:

```tsx
function Editor({ docId }: { docId: string }) {
  const [dirty, setDirty] = useState(false);

  const handleSave = useEvent((content: string) => {
    saveDocument(docId, content); // latest docId
    setDirty(false);
  });

  useEffect(() => {
    const editor = createEditor('#mount', { onSave: handleSave });
    return () => editor.destroy();
  }, [handleSave]); // stable → editor created exactly once

  return <div id="mount" data-dirty={dirty} />;
}
```

Recreating a heavyweight editor because `docId` changed identity in a closure is exactly the kind of waste `useEvent` deletes.

## The Rules

Two, and they're both consequences of the ref timing:

1. **Don't call the returned function during render.** It's for event handlers, effects, timers, callbacks — things that fire after commit. During render, the ref may still point at the previous closure.
2. **Don't use it to lie to yourself about effects.** If an effect genuinely *should* re-run when a value changes (a query refetch when filters change, say), wrapping the logic in `useEvent` to silence the linter buries a real dependency. `useEvent` is for "read the latest, don't re-fire"; it's not a universal dependency-array mute button.

## Takeaways

- **[`useEvent`](https://reactuse.com/effect/useevent/) returns a function with permanent identity and an always-fresh closure** — the two things `useCallback` makes you choose between.
- **The trick is a ref updated in a layout effect** plus a once-memoized wrapper that reads the ref at call time. [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) keeps it SSR-safe.
- **`useCallback` for render-time values, `useEvent` for fired handlers.** Never call a `useEvent` function during render.
- **On React 19.2+, `useEffectEvent` covers the inside-an-effect case** with linter enforcement; `useEvent` covers stable handlers passed across component and library boundaries.
- **Check the library first** — [`useEventListener`](https://reactuse.com/effect/useeventlistener/), [`useInterval`](https://reactuse.com/effect/useinterval/), [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) and friends already ship with stale-closure protection built in.

Grab it from [`@reactuses/core`](https://reactuse.com/effect/useevent/) and retire the dependency-array whack-a-mole.
