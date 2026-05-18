---
title: "Timers in React Without setTimeout: useTimeout, useInterval, useCountDown, and useRafFn"
description: "Stop wrestling with setTimeout cleanup, stale closures, and animation loops. A practical tour of the ReactUse timer hooks — useTimeout, useTimeoutFn, useInterval, useCountDown, useRafFn, and useRafState — with the bugs each one quietly fixes."
slug: react-timer-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-18
tags: [react, hooks, performance, tutorial, animation]
keywords: [react setTimeout, react setInterval, react useTimeout hook, react useInterval hook, react requestAnimationFrame, react countdown timer, useRafFn, useRafState, react timer cleanup, react stale closure, react animation loop]
image: /img/og.png
---

# Timers in React Without setTimeout: useTimeout, useInterval, useCountDown, and useRafFn

Timers are one of those things every React developer writes by hand the first ten times and gets wrong on at least six of them. The pattern looks simple: call `setTimeout` in a `useEffect`, return a cleanup function, ship it. Then a code review finds the stale closure. Then a bug ticket arrives because the delay is being read from props at mount instead of from the current render. Then someone notices the interval keeps running after the component unmounts on a slow page. Then you discover that `setInterval` drifts a little every cycle and your countdown is off by 800ms after a minute. Then your performance audit flags the animation loop that nobody remembered to pause when the tab was hidden.

<!-- truncate -->

None of these bugs are interesting. They are all the same kind of bug: the timer logic is fine, the React integration is what breaks. [ReactUse](https://reactuse.com) ships six small hooks that handle this integration once and let you write the timer logic by itself: [`useTimeout`](https://reactuse.com/effect/usetimeout/), [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/), [`useInterval`](https://reactuse.com/effect/useinterval/), [`useCountDown`](https://reactuse.com/state/usecountdown/), [`useRafFn`](https://reactuse.com/effect/useraffn/), and [`useRafState`](https://reactuse.com/state/userafstate/).

This post walks each one — what the underlying primitive is, what the manual version looks like in React, what bug the hook hides, and where it actually belongs in your code. By the end you should know which timer hook to reach for and why.

## The Problem in One Snippet

Before any hooks, here is what almost every React codebase does at least once:

```tsx
function Toast({ message, durationMs }: { message: string; durationMs: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(id);
  }, [durationMs]);

  return visible ? <div className="toast">{message}</div> : null;
}
```

That is correct, mostly. The bug is what is missing:

1. The dependency array re-runs the effect every time `durationMs` changes — so a parent updating the prop mid-flight restarts the timer from zero instead of letting it finish.
2. There is no way to cancel the timer from outside (e.g., a "dismiss" button) without lifting the visible state up.
3. There is no way to read whether the timer is still pending — useful for tests, for analytics, for showing a "fading in 2s..." label.
4. The cleanup runs on unmount, which is good, but it also runs on every re-render that touches `durationMs`, which is usually not what you want.

You can fix all four with `useRef` plumbing, but it is the kind of plumbing nobody enjoys writing twice. That is exactly what `useTimeoutFn` exists for.

## 1. useTimeoutFn — The Correct setTimeout

`useTimeoutFn(callback, interval, options?)` schedules `callback` after `interval` ms and returns `[isPending, cancel, restart]`. Three concrete things it does that the naive version does not:

- The latest `callback` is always called — no stale closures even if you do not list the callback in deps.
- `cancel()` lets a parent or sibling component stop the timer without unmounting.
- `restart()` lets you reset the clock without changing keys or remounting.

Rewriting `Toast`:

```tsx
import { useTimeoutFn } from "@reactuses/core";

function Toast({ message, durationMs, onClose }: {
  message: string;
  durationMs: number;
  onClose: () => void;
}) {
  const [isPending, cancel, restart] = useTimeoutFn(onClose, durationMs);

  return (
    <div className="toast" onMouseEnter={cancel} onMouseLeave={() => restart()}>
      {message}
      {isPending && <span className="fade-bar" />}
    </div>
  );
}
```

Notice what disappeared: no `useEffect`, no `setTimeout`, no `clearTimeout`, no `useRef`, no `useCallback`. The hover behavior — pause the auto-dismiss while the user is reading the toast — is a one-liner. The `isPending` flag drives the fade bar without any extra state.

The `immediate` option (default `true`) controls whether the timer starts on mount. Set it to `false` for "fire on demand":

```tsx
const [, , scheduleSave] = useTimeoutFn(saveDraft, 2000, { immediate: false });

return <textarea onChange={(e) => { setText(e.target.value); scheduleSave(); }} />;
```

Every keystroke pushes the save 2 seconds into the future. This is one way to build a "save 2 seconds after the user stops typing" debounce, though [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) is usually the cleaner choice for that specific pattern.

## 2. useTimeout — When You Just Want a Re-Render After N Milliseconds

`useTimeout(ms, options?)` is the same thing as `useTimeoutFn` but the callback is the component's own re-render. Useful when you want a piece of UI to "appear after a delay" without storing a boolean.

```tsx
import { useTimeout } from "@reactuses/core";

function DelayedSpinner({ delayMs = 250 }: { delayMs?: number }) {
  const [isPending] = useTimeout(delayMs);
  return isPending ? null : <Spinner />;
}
```

The use case is "don't show a spinner for sub-250ms loads." If the parent finishes loading in 100ms, the spinner is never seen — no flash. If it takes longer, the spinner appears. No state, no effect, no boolean.

Same return shape as `useTimeoutFn`, so `cancel` and `restart` are there if you need to interrupt the re-render. In practice the read pattern dominates.

## 3. useInterval — The setInterval That Actually Pauses

`useInterval(callback, delay, options?)` runs `callback` every `delay` ms. The return value is `{ isActive, pause, resume }`, not a tuple — `useInterval` is built around the pause/resume idea because that is the operation everyone needs and nobody implements correctly with raw `setInterval`.

The most common bug with `setInterval` in React is **not** the cleanup — modern linters catch that — it is **passing `null` to stop the timer**. With `useInterval`, that pattern just works:

```tsx
import { useInterval } from "@reactuses/core";

function Polling({ active, onTick }: { active: boolean; onTick: () => void }) {
  useInterval(onTick, active ? 5000 : null);
  return null;
}
```

When `active` flips to `false`, the delay becomes `null` and the interval clears. When it flips back, the interval restarts at the new delay. No `useEffect`, no ref dance, no "did I clean up on the right value of `active`" worry.

If you prefer explicit pause/resume from outside the hook (for example, pausing polling while the user is offline), use the `controls: true` option and take the controls:

```tsx
const { isActive, pause, resume } = useInterval(refresh, 5000, {
  controls: true,
  immediate: true,
});

useEffect(() => {
  const onVisibilityChange = () =>
    document.hidden ? pause() : resume();
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => document.removeEventListener("visibilitychange", onVisibilityChange);
}, [pause, resume]);
```

That snippet alone fixes a class of bugs that ships to production all the time: polling that continues at full rate while the user is on another tab, burning battery and rate-limited quota.

### Why Not setInterval + Drift Correction?

`setInterval` does not guarantee an exact delay between calls — the browser may delay or batch callbacks when the page is throttled (background tab, low battery, Chrome's "intensive throttling"). For a polling loop this is fine. For a clock display it is visibly wrong: after 60 ticks of "every 1000ms" the displayed time can be a second or two behind the actual wall clock.

For clocks specifically, do not use `useInterval` to drive the display value. Use `useInterval` to schedule re-renders and read `Date.now()` inside the render:

```tsx
function Clock() {
  const [, force] = useState(0);
  useInterval(() => force((n) => n + 1), 1000);
  return <span>{new Date().toLocaleTimeString()}</span>;
}
```

The interval is allowed to drift; the displayed time is read fresh on every render. Drift becomes a re-render scheduling concern, not a correctness concern.

## 4. useCountDown — Hours, Minutes, Seconds Without the Date Math

Countdowns are intervals with extra responsibility: track remaining time, format it for display, fire a callback when it hits zero, and stop the timer afterwards. The component-level version of this looks like 30 lines of code that everybody has written at least once.

`useCountDown(time, format?, callback?)` returns a `[hours, minutes, seconds]` tuple of strings (zero-padded) and handles all of the above:

```tsx
import { useCountDown } from "@reactuses/core";

function OtpResend({ onExpire }: { onExpire: () => void }) {
  const [h, m, s] = useCountDown(60, undefined, onExpire);
  const expired = h === "00" && m === "00" && s === "00";

  return expired
    ? <button onClick={() => /* request again */ undefined}>Resend code</button>
    : <span>Resend in {m}:{s}</span>;
}
```

The hook owns the interval, the remaining-time state, and the callback dispatch. The component owns the rendering decision. If you want a different format (for example, `Xm Ys` or a raw seconds count), pass a `format` function that takes the remaining-seconds number and returns three strings — the hook calls it on every tick and returns whatever you give it.

`useCountDown` clamps to `["00", "00", "00"]` once time runs out, and refuses to overflow past 99 hours, so you do not have to defend the view layer against silly inputs.

## 5. useRafFn — When You Need 60fps, Not "About Once Per Second"

`setInterval(fn, 16)` is the wrong way to run something on every frame. The browser already has a primitive for "do this once per frame, synchronized to the display refresh, and skip it if the tab is hidden" — `requestAnimationFrame`. `useRafFn(callback, initiallyActive?)` is the React wrapper around it.

The callback receives the current high-resolution timestamp (the same value `requestAnimationFrame` passes to its callback), and the hook returns `[stop, start, isActive]`.

A canvas particle simulation, a smooth scroll position read, a CSS-variable-driven animation — anything that needs to update every frame should use `useRafFn`:

```tsx
import { useRafFn } from "@reactuses/core";
import { useRef } from "react";

function FollowCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { target.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useRafFn(() => {
    // Spring-ish lerp toward the target each frame
    current.current.x += (target.current.x - current.current.x) * 0.15;
    current.current.y += (target.current.y - current.current.y) * 0.15;
    if (ref.current) {
      ref.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
    }
  });

  return <div ref={ref} className="follower" />;
}
```

Two things to notice. First, the animation does **not** call `setState`. Pushing to `ref.current.style` keeps the work outside React's render cycle, which is the only way to get a real 60fps on a non-trivial page. Second, when the tab is hidden the browser stops firing `requestAnimationFrame` automatically — no `useInterval`-style throttling cliff, no manual pause logic needed for the common case.

If you do want manual control (for example, only animate while a panel is open), pass `false` as the second argument and call `start()`/`stop()` from your effect.

## 6. useRafState — Batched State Updates for Animations You Actually Re-render

`useRafFn` is great when you can mutate DOM directly. Sometimes you cannot — you have to push the new value into React state because it drives a JSX subtree. The naive version of this is:

```tsx
const [pos, setPos] = useState({ x: 0, y: 0 });
// ... 60 setPos calls per second when the cursor moves
```

That works, but every `setPos` triggers a render. If the cursor fires `mousemove` faster than 60Hz (some browsers do), you get more renders than frames. `useRafState` solves this by batching state updates to `requestAnimationFrame` — at most one render per frame, even if `setState` is called many times in between.

```tsx
import { useRafState } from "@reactuses/core";

function CursorBadge() {
  const [pos, setPos] = useRafState({ x: 0, y: 0 });

  useEventListener("mousemove", (e) => {
    setPos({ x: e.clientX, y: e.clientY });
  });

  return <div style={{ left: pos.x, top: pos.y }} className="badge" />;
}
```

The component re-renders at most 60 times per second regardless of how many `mousemove` events fire. It is a one-line drop-in replacement for `useState` whenever the source of updates is a high-frequency browser event (mouse, scroll, resize) and the target is JSX.

Pair this with [`useEventListener`](https://reactuse.com/effect/useeventlistener/) for the event side; pair with `useRafFn` instead when the target is a DOM mutation.

## When to Use Which

The decision is not about preference — each hook fits a specific shape of problem:

| You need to...                              | Reach for           |
|---------------------------------------------|---------------------|
| Run a callback once after N ms              | `useTimeoutFn`      |
| Force a re-render once after N ms           | `useTimeout`        |
| Run a callback every N ms with pause/resume | `useInterval`       |
| Display hh:mm:ss remaining                  | `useCountDown`      |
| Do work every frame, no React state         | `useRafFn`          |
| Update React state on every frame at most   | `useRafState`       |
| Wait until the user stops typing            | `useDebounceFn`     |
| Cap callback rate to once per N ms          | `useThrottleFn`     |

The last two — `useDebounceFn` and `useThrottleFn` — are not strictly timer hooks, but they live in the same family. We covered them in [Debounce vs Throttle in React](/blog/react-debounce-vs-throttle/); the short version is "stop a high-frequency event from firing too often" rather than "schedule work in the future."

## Three Mistakes the Hooks Quietly Prevent

A few subtle bugs the hooks above make impossible.

### Mistake 1: The setTimeout in useState Initializer

```tsx
const [id] = useState(() => setTimeout(callback, 1000)); // wrong
```

This schedules a timer that survives across React's intentional double-invocation in Strict Mode, and there is no cleanup. The "fix" with effects and refs is several lines. `useTimeoutFn(callback, 1000)` is one line and double-invocation safe by construction.

### Mistake 2: Reading State Inside an Interval Callback

```tsx
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, []); // captures count=0 forever — count goes 0, 1, 1, 1, 1...
```

This is the most-Googled React timer bug. The fix in plain React is either the functional updater (`setCount((c) => c + 1)`) or a ref. The fix with `useInterval` is "it already works" — the hook routes the latest callback through a ref internally.

### Mistake 3: Animating React State at 60fps

```tsx
const [x, setX] = useState(0);
useEffect(() => {
  const tick = () => { setX((v) => v + 1); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}, []);
```

This works for one component. With ten on screen, React's render queue starts dropping frames because each `setState` triggers a full reconciliation. `useRafFn` lets you mutate DOM directly without going through React; `useRafState` caps re-renders to one per frame when DOM mutation is not an option. Either is correct; the loop above is correct only by accident.

## Putting It Together: A "Tab Idle Refresher"

A small, realistic component to close on — a data card that polls every 30 seconds while the tab is visible and the user is active, and shows a countdown to the next refresh:

```tsx
import { useInterval, useCountDown } from "@reactuses/core";
import { useState, useCallback } from "react";

function LiveStat({ fetchValue }: { fetchValue: () => Promise<number> }) {
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, m, s] = useCountDown(30);

  const refresh = useCallback(async () => {
    try {
      setValue(await fetchValue());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [fetchValue]);

  useInterval(refresh, 30_000, { immediate: true });

  return (
    <div className="card">
      <div className="value">{value ?? "—"}</div>
      <div className="footer">
        {error ? `Error: ${error}` : `Next refresh in ${m}:${s}`}
      </div>
    </div>
  );
}
```

`useInterval` owns the polling cadence. `useCountDown` owns the visual ticker. Neither is told about the other; both happen to land on the same number because they are seeded with the same constant. Two hooks, no `useEffect`, no `setTimeout`, no `useRef`.

## Try Them Out

Every hook in this post has a runnable demo on its docs page. The fastest way to absorb the API surface is to read the demo, change one prop, and see what breaks:

- [`useTimeout`](https://reactuse.com/effect/usetimeout/)
- [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)
- [`useInterval`](https://reactuse.com/effect/useinterval/)
- [`useCountDown`](https://reactuse.com/state/usecountdown/)
- [`useRafFn`](https://reactuse.com/effect/useraffn/)
- [`useRafState`](https://reactuse.com/state/userafstate/)

Install with `npm install @reactuses/core` (or `pnpm add @reactuses/core`) and import directly. No provider, no setup, no peer dependencies beyond React 16.8+. The full hook list and source for everything we discussed is at [reactuse.com](https://reactuse.com).

Stop writing `setTimeout` in `useEffect`. The right hook for the job exists, and it is shorter.
