---
title: "React useInterval Hook: setInterval Without Stale Closures (2026)"
description: "A practical guide to useInterval in React: why setInterval inside useEffect keeps reading stale state (the count that stays stuck at 1), how the declarative useInterval hook fixes it with a latest-callback ref, pausing with delay = null vs. imperative pause()/resume(), the immediate option, dynamic polling intervals with backoff, pausing in background tabs, and when useTimeoutFn, useCountDown or useRafFn is the better tool. TypeScript-first, SSR-safe."
slug: react-useinterval-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-15
tags: [react, hooks, effect, timers, typescript, tutorial]
keywords: [react useinterval, useinterval, useinterval react, useInterval hook, react setinterval, setinterval in useeffect, react setinterval hook, setinterval react hooks state not updating, react polling hook, declarative setinterval react, useinterval pause resume, react clearinterval on unmount, react timer hook, useTimeout react, react countdown hook]
image: /img/og.png
---

# React useInterval Hook: setInterval Without Stale Closures (2026)

Every React developer writes this component once, and it never does what they expect:

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <h1>{count}</h1>;
}
```

It goes `0`, `1`… and stays at `1` forever. The interval callback was created on the first render, where `count` was `0`, and an empty dependency array means it never sees another render. `setCount(0 + 1)` runs every second and nothing changes. This is the single most searched React timer bug, and the "fixes" people find — add `count` to the deps (now the interval is torn down and recreated every second), use the functional updater (works, until the callback needs anything *other* than the previous count) — all fight the underlying mismatch: `setInterval` is imperative and lives outside React's render cycle, while everything it wants to read lives inside it.

Dan Abramov's 2019 essay *Making setInterval Declarative with React Hooks* gave the mismatch a proper solution: a `useInterval` hook that keeps the *latest* callback in a ref and never restarts the timer just because your component re-rendered. [`useInterval`](https://reactuse.com/effect/useinterval/) from [`@reactuses/core`](https://reactuse.com) is that idea, plus the pieces you end up needing in a real app — `null` to pause, `pause()` / `resume()` controls, an `immediate` option, and cleanup that survives StrictMode. This post covers how it works, the two ways to pause, dynamic polling intervals, the background-tab problem, and when a different timer hook is the right call.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useInterval } from "@reactuses/core";
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useInterval(() => {
    setCount(count + 1); // reads the CURRENT count — no functional updater needed
  }, 1000);

  return <h1>{count}</h1>;
}
```

That's the broken component from the intro, fixed by swapping `useEffect` + `setInterval` for `useInterval`. The callback can read any prop or state directly, the timer is created once and cleared on unmount, and there's no dependency array to get wrong.

The signature is `useInterval(callback, delay, options?)` — `delay` in milliseconds, or `null` to pause — and it returns `{ isActive, pause, resume }` for the cases where you want manual control.

## Why setInterval and React Don't Get Along

Under the hood there are three separate problems, and the hook solves each one differently:

1. **Stale closures.** `setInterval` holds one function reference for its whole life. That function closed over one render's props and state. Every later render creates a fresh closure — which the running interval never sees.
2. **Restart-on-render.** The obvious fix is to make the effect depend on whatever the callback reads: `useEffect(..., [count])`. Now the interval is *correct*, but it is cleared and re-created on every change — the timing resets each time, and with a fast-changing dependency the tick may never fire at all.
3. **Lifecycle.** You have to clear the interval on unmount, clear it again on StrictMode's dev remount, and — the part that turns into a small state machine — decide how to *pause* it: a second piece of state, an `if` around `setInterval`, and dependencies that now include the pause flag.

Here's what a correct hand-rolled version looks like once all three are handled — a ref for the latest callback, an effect keyed only on `delay`, and `null` as the pause signal:

```tsx
function useIntervalManual(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useLayoutEffect(() => {
    savedCallback.current = callback; // always the latest render's closure
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

That's essentially the core of `@reactuses/core`'s `useInterval` — it uses [`useLatest`](https://reactuse.com/state/uselatest/) for the ref and adds controls on top. Two properties fall out of the design, and they're the ones to internalize:

- **Changing the callback never restarts the timer.** Re-render as often as you like, pass inline arrow functions, read whatever state you want — the ref is updated, the interval keeps its rhythm.
- **Changing `delay` does restart it.** `delay` is the only dependency, so `5000 → 1000` clears the old interval and starts a fresh one. That resets the phase: the next tick is a full `delay` away from the moment the change committed. Usually right (it's how backoff works, below), occasionally surprising if you were expecting the in-flight tick to complete.

## Pausing: `null` vs. `pause()` / `resume()`

There are two ways to stop the interval, and picking the right one keeps your component simple.

**Declarative — pass `null` as the delay.** When "should this be running?" is derivable from state or props, encode it in the delay expression and let the hook follow:

```tsx
function LivePrice({ symbol, live }: { symbol: string; live: boolean }) {
  const [price, setPrice] = useState<number | null>(null);

  useInterval(
    async () => setPrice(await fetchPrice(symbol)),
    live ? 5000 : null, // false → paused, true → polling every 5s
  );

  return <span>{price ?? "—"}</span>;
}
```

Flip `live` and the interval clears or restarts. No effect, no ref, no extra state.

**Imperative — `controls: true` and the returned handles.** When starting and stopping is a *user action* rather than a derived condition (a Start/Stop button, "pause while this modal is open"), opt out of automatic starting and drive it yourself:

```tsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);

  const { pause, resume } = useInterval(
    () => setElapsed(Date.now() - startedAt.current), // read the clock, don't count ticks
    100,
    { controls: true }, // don't start on mount — wait for resume()
  );

  const toggle = () => {
    if (running) {
      pause();
    } else {
      startedAt.current = Date.now() - elapsed;
      resume();
    }
    setRunning(!running);
  };

  return (
    <>
      <p>{(elapsed / 1000).toFixed(1)}s</p>
      <button onClick={toggle}>{running ? "Pause" : "Start"}</button>
    </>
  );
}
```

`pause` and `resume` have stable identities (safe in dependency arrays and event handlers), and the interval is still cleared on unmount even in `controls` mode — you can't leak a timer by forgetting. One honest note: `isActive` in the return value is a **ref** (`isActive.current`), not state — it won't re-render your component when it flips, which is why the example above keeps its own `running` state for the button label.

You can also mix the two: without `controls`, `pause()` still works as a temporary override, and the next `delay` change resumes automatically.

## `immediate`: Fire Now, Then Every N ms

`setInterval` waits a full `delay` before its first call, which is almost never what you want for polling — the user stares at an empty screen for five seconds. `immediate: true` runs the callback synchronously when the interval starts, then keeps the schedule:

```tsx
useInterval(refreshDashboard, 30_000, { immediate: true });
```

Note that "when the interval starts" includes every `delay` change — every time the delay value changes, the callback fires once right away and the schedule restarts. That's handy when a *user* changes the refresh rate, but it's exactly wrong for a failure-driven backoff (each widening of the delay would trigger another call on the spot), so leave `immediate` off there — see the next section.

## Real-World Patterns

### Polling with backoff

Because `delay` is a normal value, backoff is just state. On failure, widen the interval; on success, snap back:

```tsx
function useJobStatus(jobId: string) {
  const [status, setStatus] = useState<Job | null>(null);
  const [delay, setDelay] = useState<number | null>(2000);

  useInterval(async () => {
    try {
      const job = await getJob(jobId);
      setStatus(job);
      if (job.done) setDelay(null);            // stop polling
      else setDelay(2000);                     // healthy → base rate
    } catch {
      setDelay((d) => Math.min((d ?? 2000) * 2, 60_000)); // back off, cap at 1 min
    }
  }, delay);

  return status;
}
```

Each `setDelay` restarts the interval with the new cadence — and because `immediate` is off, a failure waits the *new, longer* delay before trying again, which is the whole point. There's no timer bookkeeping anywhere in that hook — it's all "what should the delay be right now?".

### Pause in background tabs (and offline)

Browsers throttle timers in hidden tabs — to roughly once per second, and Chrome drops to once per *minute* after a tab has been hidden for five minutes. Polling in a background tab therefore both wastes quota *and* fires at unpredictable times. The fix composes naturally with the `null` pattern using [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) and [`useOnline`](https://reactuse.com/browser/useonline/):

```tsx
const visible = useDocumentVisibility() === "visible";
const online = useOnline();

useInterval(refresh, visible && online ? 10_000 : null, { immediate: true });
```

When the user comes back, `delay` flips from `null` to `10_000`, the interval restarts, and `immediate` fetches fresh data right away — exactly the "resume and catch up" behavior you'd otherwise hand-code with `visibilitychange` listeners.

### Clocks: schedule ticks, don't count them

`setInterval` drifts. Over a minute of "every 1000ms" you can lose a second or more, especially in throttled tabs. So don't accumulate time in the callback — use the interval only to trigger a re-render and read the real clock:

```tsx
function Clock() {
  const [now, setNow] = useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 1000);
  return <time>{new Date(now).toLocaleTimeString()}</time>;
}
```

The interval is allowed to be sloppy; the displayed value is always correct because it comes from `Date.now()`, not from `ticks × 1000`. Same rule for elapsed-time displays: store a start timestamp, render `Date.now() - start`.

## When Not to Use useInterval

- **You want one delayed call, not a repeating one.** That's [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) — `const [pending, start, stop] = useTimeoutFn(fn, ms)` — or [`useTimeout`](https://reactuse.com/effect/usetimeout/) if all you need is a re-render after N ms.
- **You're building a countdown display.** [`useCountDown`](https://reactuse.com/state/usecountdown/) already does the seconds → `hh:mm:ss` math and completion callback on top of `useInterval`.
- **You're animating.** Anything visual that should update every frame belongs in `requestAnimationFrame`, which is what [`useRafFn`](https://reactuse.com/effect/useraffn/) wraps — it syncs to the display refresh rate and pauses automatically in hidden tabs. A 16ms `setInterval` is not the same thing.
- **You're rate-limiting a handler, not scheduling one.** Firing on the *trailing edge of user input* is [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) / [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) territory.
- **The "interval" is really server push.** If the server can tell you when something changed, a Server-Sent Events stream via [`useEventSource`](https://reactuse.com/browser/useeventsource/) beats polling on latency and cost.

| You want… | Reach for |
| --- | --- |
| run `fn` every N ms, pause with `null` or `pause()` | [`useInterval`](https://reactuse.com/effect/useinterval/) |
| run `fn` once after N ms, with `start` / `stop` | [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) |
| re-render once after N ms | [`useTimeout`](https://reactuse.com/effect/usetimeout/) |
| `hh:mm:ss` countdown from N seconds | [`useCountDown`](https://reactuse.com/state/usecountdown/) |
| run `fn` every animation frame | [`useRafFn`](https://reactuse.com/effect/useraffn/) |

## Gotchas Worth Knowing

- **The callback reads the latest *committed* render.** The ref is updated in a layout effect after each render, so a tick that fires mid-render sees the previous committed values — a non-issue in practice, but the reason the hook can't be "more current than React".
- **`delay` change = phase reset.** Covered above; if you need to change the cadence *without* dropping the in-flight tick, keep the interval fixed and skip ticks in the callback instead.
- **`immediate` fires inside the effect, on mount and on every `delay` change.** Under React 18+ StrictMode in dev, that means the immediate call happens twice on mount (mount → cleanup → mount). Make it idempotent, as with any effect.
- **`async` callbacks are fine — but overlap is on you.** The hook doesn't wait for a returned Promise. If a fetch can take longer than `delay`, guard with an in-flight flag or use `null` to pause while a request is pending.
- **SSR-safe by construction.** The timer is created inside an effect, so nothing runs on the server and there's no `window` access to guard.

## Takeaways

- The stuck-at-`1` counter is a stale-closure bug: `setInterval` keeps the first render's callback. [`useInterval`](https://reactuse.com/effect/useinterval/) stores the latest callback in a ref, so the timer runs once and always sees current state.
- Only `delay` restarts the interval — pass `null` to pause declaratively, or `controls: true` with `pause()` / `resume()` for user-driven start/stop.
- `immediate: true` fires now-then-every-N; backoff is just `setDelay(...)`; pause polling in hidden or offline tabs by folding [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) / [`useOnline`](https://reactuse.com/browser/useonline/) into the delay expression.
- Never accumulate time in an interval — read `Date.now()` — and reach for [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/), [`useCountDown`](https://reactuse.com/state/usecountdown/), or [`useRafFn`](https://reactuse.com/effect/useraffn/) when the job isn't "every N ms, forever".

`useInterval`, `useTimeoutFn`, `useCountDown`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
