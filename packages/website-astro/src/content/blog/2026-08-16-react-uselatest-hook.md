---
title: "React useLatest Hook: Read Fresh State in Async Callbacks (2026)"
description: "A practical guide to useLatest in React: why callbacks inside setTimeout, await, subscriptions and third-party SDKs read stale props and state, how the five-line useLatest ref fixes it without restarting anything, why the ref is written in a layout effect instead of during render, useLatest vs useRef vs useEvent vs useEffectEvent, the async-save and request-race patterns, and the one rule — never read it during render. TypeScript-first, SSR-safe."
slug: react-uselatest-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-16
tags: [react, hooks, state, typescript, tutorial]
keywords: [react uselatest, uselatest, uselatest react, useLatest hook, uselatestref, react latest ref, stale closure react, react stale state in settimeout, react stale props in callback, react ref latest value, useref latest state, react async callback stale state, react read latest state after await, useLatest vs useRef, useLatest vs useEvent, useEffectEvent alternative]
image: /img/og.png
---

# React useLatest Hook: Read Fresh State in Async Callbacks (2026)

Here's an autosave button that lies to the user:

```tsx
function Editor({ docId }: { docId: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "dirty">("idle");

  async function save() {
    setStatus("saving");
    await api.save(docId, text);
    setStatus("saved"); // ⚠️ but the user kept typing during the await…
  }

  return (
    <>
      <textarea value={text} onChange={e => setText(e.target.value)} />
      <button onClick={save}>Save</button> <em>{status}</em>
    </>
  );
}
```

The request takes 800 ms. The user types three more words while it's in flight. The promise resolves, `status` flips to `"saved"`, and the three new words are not saved. Inside `save`, `text` is whatever it was when the button was clicked — a JavaScript closure captured that render's value, and no amount of re-rendering will update it. To decide between `"saved"` and `"dirty"` after the `await`, you need to know what `text` is *now*, and the closure can't tell you.

That's the **stale closure**, and it shows up anywhere a callback outlives the render that created it: `setTimeout`, `setInterval`, code after an `await`, event listeners registered once, `IntersectionObserver` and `ResizeObserver` callbacks, WebSocket `onmessage`, and every third-party SDK that takes a callback at construction time. React's own FAQ answers *"why am I seeing stale props or state inside my function?"* with a ref that always holds the latest value. [`useLatest`](https://reactuse.com/state/uselatest/) from [`@reactuses/core`](https://reactuse.com) is that ref, packaged: five lines, no re-renders, no dependency arrays. This post covers what it is, why the implementation writes the ref in a layout effect rather than during render, how it relates to `useRef`, [`useEvent`](https://reactuse.com/effect/useevent/) and React's `useEffectEvent`, the patterns it's built for, and the one rule you must respect.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useLatest } from "@reactuses/core";
import { useState } from "react";

function Editor({ docId }: { docId: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "dirty">("idle");
  const latestText = useLatest(text);

  async function save() {
    const snapshot = text; // the closure: what we're sending
    setStatus("saving");
    await api.save(docId, snapshot);
    // the ref: what the user has NOW
    setStatus(latestText.current === snapshot ? "saved" : "dirty");
  }

  // …
}
```

`useLatest(value)` returns a `MutableRefObject<T>` whose `.current` is always the most recently rendered `value`. The ref object itself never changes identity, so it's safe to close over anywhere — timers, promises, subscriptions — and read whenever the callback finally runs. Notice the fixed example uses *both* the closure and the ref: the closure is the value at the moment of the click (correct for "what did we send?"), the ref is the value at the moment the promise resolves (correct for "is it still current?"). Stale closures aren't a bug in JavaScript; they're only a bug when you wanted *now* and got *then*.

## What useLatest Actually Is

The whole hook, from `@reactuses/core`:

```tsx
import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "@reactuses/core";

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
```

That's it. A ref, created once, whose `.current` is overwritten every time `value` changes. Two details are worth understanding, because they're where hand-rolled versions differ.

**Why a layout effect, and not `ref.current = value` in the render body?** Several popular implementations (react-use, ahooks) assign during render, and it works almost all the time. But React's rules say render must be pure — no reads or writes to `ref.current` during rendering — because with concurrent rendering a render can be started, paused, and *thrown away* without ever committing. A ref written during a discarded render now holds a value that no committed UI ever showed. Writing in `useLayoutEffect` means the ref updates exactly once per **committed** render, synchronously after the DOM is updated and before the browser paints. That's the same trick the [React `useEvent` RFC](https://github.com/reactjs/rfcs/blob/main/text/0000-useevent.md) uses, and it's why `@reactuses/core` builds `useEvent`, `useInterval`, `useTimeoutFn` and a dozen other hooks on top of `useLatest` instead of a bare render-time assignment.

**Why not a plain `useEffect`?** Ordering. Passive effects run after paint, and in the same commit React runs children's effects before parents' and earlier hooks before later ones. If some *other* effect in the same commit reads the ref before the updating effect has run, it sees last render's value. Layout effects run before any passive effect, so by the time any `useEffect`, event handler, timer or promise callback fires, `ref.current` is current. (`useIsomorphicLayoutEffect` is just `useLayoutEffect` in the browser and `useEffect` on the server, so there's no SSR warning.)

The consequence you should internalize: **`.current` reflects the last committed render, and it's meant to be read from callbacks, not from render.** During the render of update N+1, `ref.current` still holds N's value — which is fine, because in render you should be reading `value` directly anyway. If you find yourself writing `{latest.current}` in JSX, you wanted plain state.

## useLatest vs useRef vs useState

These three get confused because they all "hold a value". The question is *who* needs the value and *when*.

| You need to… | Reach for |
| --- | --- |
| render the value, and re-render when it changes | `useState` |
| keep a mutable value across renders that **isn't** derived from a prop/state (a timer id, a DOM node, a counter) | `useRef` |
| read the **latest** prop or state from a callback that outlives the render | `useLatest` |

`useLatest` is `useRef` plus the "keep me in sync" effect. If you've ever written this:

```tsx
const textRef = useRef(text);
useEffect(() => { textRef.current = text; }, [text]);
```

…that's `useLatest(text)`, minus the layout-effect timing detail above. It's also strictly more honest than the *other* common workaround — copying state into a ref inside the setter (`setText(v); textRef.current = v;`) — which silently breaks the moment anything else updates `text` (a reset button, a prop, a form library).

## useLatest vs useEvent vs useEffectEvent

Now the neighbours. All three exist to defeat stale closures; they differ in what they wrap.

- **`useLatest(value)`** wraps a **value** and gives you a ref. You read `.current` inside whatever callback you already have.
- **[`useEvent(fn)`](https://reactuse.com/effect/useevent/)** wraps a **function** and gives you a stable function that always calls the latest `fn`. Internally it's `useLatest(fn)` plus `useCallback(() => ref.current(...args), [])`. Use it when the *callback itself* is what you hand to a child, an effect, or a subscription and you want its identity to never change.
- **`useEffectEvent`** (React 19.2+) is the built-in version of `useEvent`, restricted to being called from effects — the returned function is not stable and must not be passed as a prop or added to dependency arrays.

The rule of thumb: **if you're wrapping a function, use `useEvent`; if you're wrapping a value, use `useLatest`.** They compose — the classic "subscribe once, react to fresh state" is often one `useEvent` for the handler, or one `useLatest` per value it reads, and either is fine. Where `useLatest` wins outright is when the callback isn't yours to wrap: an SDK's `onChange`, a promise continuation, an `Observer` you construct once.

## Patterns

### After an `await`

The intro's autosave is the shape: any handler that awaits and then needs to know whether the world moved on. A second common variant is the **request race** in a handler rather than an effect:

```tsx
function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const latestQuery = useLatest(query);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    const items = await api.search(q);
    if (latestQuery.current !== q) return; // a newer keystroke won — drop this response
    setResults(items);
  }

  return <input value={query} onChange={onChange} />;
}
```

Inside a `useEffect` you'd use the React-docs `let ignore = false` cleanup flag for this. Event handlers have no cleanup slot, so the ref carries the "am I still relevant?" check instead. (For debouncing the calls themselves, see [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) — that's a different problem.)

### Subscriptions you create once

Anything expensive or stateful to set up — a map, a chart, a WebSocket, a `ResizeObserver` — should be created once and *read* fresh state, not be torn down and rebuilt on every keystroke:

```tsx
function PinMap({ filters }: { filters: Filters }) {
  const container = useRef<HTMLDivElement>(null);
  const latestFilters = useLatest(filters);

  useEffect(() => {
    const map = new mapboxgl.Map({ container: container.current!, style: STYLE });
    map.on("moveend", () => {
      loadPins(map.getBounds(), latestFilters.current); // fresh filters, map built once
    });
    return () => map.remove();
  }, []); // ✅ empty deps are honest here — nothing inside is stale

  return <div ref={container} />;
}
```

Without the ref, the choice is `filters` in the deps (map destroyed and recreated on every filter change — flicker, lost viewport, re-download of tiles) or an empty deps array with a lint warning and a bug. `useLatest` gives you a third option: the effect genuinely depends on nothing, because it reads through a ref that's always current.

### Timers

`setTimeout` and `setInterval` are the textbook stale-closure factories:

```tsx
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const latestPaused = useLatest(paused);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!latestPaused.current) onDismiss(); // hovered at the 5s mark? stay open
    }, 5000);
    return () => clearTimeout(id);
  }, []);

  return <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>{message}</div>;
}
```

For anything beyond a one-off, don't hand-roll it: [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) and [`useInterval`](https://reactuse.com/effect/useinterval/) already keep the callback fresh via `useLatest` and add `pause`/`resume`/`immediate` on top — the previous post in this series, [React useInterval Hook](https://reactuse.com/blog/react-useinterval-hook/), walks through exactly that.

### Where @reactuses/core uses it

If you want to see the pattern in production code, `useLatest` is the quiet workhorse behind a large chunk of the library. [`useEventListener`](https://reactuse.com/effect/useeventlistener/) wraps your handler in it so `addEventListener` runs once per element, not once per render. [`useClickOutside`](https://reactuse.com/element/useclickoutside/), [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/), [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) and [`useMutationObserver`](https://reactuse.com/element/usemutationobserver/) all construct their observer once and call `savedCallback.current` from inside it. [`useRafFn`](https://reactuse.com/effect/useraffn/) reads the latest frame callback without cancelling the animation loop. [`useUnmount`](https://reactuse.com/effect/useunmount/) uses it so the cleanup you passed on the *first* render doesn't run with first-render values on unmount. Same five lines, every time.

## Gotchas Worth Knowing

- **It's not reactive.** Writing to or reading from `.current` never triggers a re-render. If a change should show up on screen, it belongs in state — `useLatest` is for callbacks that *read*, not for values that *display*.
- **Don't read it during render.** Because the ref is updated in a layout effect, during render it lags one commit behind. That's by design and never matters when you read it from callbacks; it matters instantly if you put `latest.current` in JSX or in a `useMemo`. Read the value directly there.
- **Don't put it in a dependency array expecting it to trigger anything.** The ref's identity is stable for the component's lifetime, so `[latestFoo]` is equivalent to `[]`. That's a feature — it means the effect that reads it never re-runs because of it — but it also means you can't use it to *react* to changes.
- **The lag window is real, and tiny.** Between render and the layout effect commit, `.current` is last render's value. Nothing user-visible runs in that window (no events, no timers, no passive effects), so it's a non-issue in practice, and it's the price of never leaking a discarded render into the ref.
- **Sometimes a restart *is* what you want.** If your effect should re-run when a value changes — reconnect a socket when the `roomId` changes — put `roomId` in the deps like normal. Use `useLatest` only for values the callback should read *without* causing a restart. Mixing the two in one effect (`[roomId]` in deps, `latestFilters.current` inside) is completely normal.
- **SSR-safe.** It's a ref and an isomorphic layout effect; nothing touches `window`, and there's no hydration mismatch because it never renders anything.

## When Not to Use useLatest

- **The value is displayed** → `useState`, always.
- **You're wrapping a function to hand to a child or effect** → [`useEvent`](https://reactuse.com/effect/useevent/) (or `useEffectEvent` on React 19.2+ if it stays inside an effect).
- **You want the value from the *previous* render** → [`usePrevious`](https://reactuse.com/state/useprevious/) — the mirror image of `useLatest`.
- **You want to know whether the component is still mounted before setting state after an `await`** → [`useMountedState`](https://reactuse.com/state/usemountedstate/) is that exact boolean.
- **The "stale" value is a timer or DOM callback** → you probably want [`useInterval`](https://reactuse.com/effect/useinterval/), [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) or [`useEventListener`](https://reactuse.com/effect/useeventlistener/), which already do the `useLatest` dance for you.

## Takeaways

- A callback that outlives its render — timer, `await`, subscription, SDK hook — sees the props and state of the render that created it. That's a closure doing its job; it's a bug only when you needed *now* and got *then*.
- [`useLatest`](https://reactuse.com/state/uselatest/) is a ref kept in sync with a value in a layout effect: always current from any callback, never causes a re-render, never changes identity, never leaks a discarded render.
- Value → `useLatest`. Function → [`useEvent`](https://reactuse.com/effect/useevent/). Displayed → `useState`. Previous render → [`usePrevious`](https://reactuse.com/state/useprevious/).
- Read `.current` from callbacks, never from render, and keep genuine restart triggers (`roomId`, `url`) in your dependency array — `useLatest` is for what the callback should read *through*, not for what should *restart* it.

`useLatest`, `useEvent`, `usePrevious`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
