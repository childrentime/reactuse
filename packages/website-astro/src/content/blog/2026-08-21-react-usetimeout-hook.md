---
title: "React useTimeout Hook: Declarative setTimeout with Cleanup (2026)"
description: "A practical guide to useTimeout and useTimeoutFn in React: why setTimeout inside useEffect leaks timers, fires stale closures and double-arms in StrictMode, how the [isPending, start, cancel] tuple replaces all of it, why changing the delay restarts the countdown but changing the callback doesn't, the start() argument-forwarding trap, and the delayed-spinner, copy-toast, auto-dismiss and cooldown patterns. TypeScript-first, SSR-safe."
slug: react-usetimeout-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-21
tags: [react, hooks, timers, typescript, tutorial]
keywords: [react usetimeout, usetimeout, usetimeout react, useTimeout hook, react settimeout hook, settimeout in useeffect, react settimeout cleanup, react settimeout not working, clear settimeout react, react delay hook, usetimeoutfn, react cancel settimeout unmount, react settimeout stale closure, react debounce settimeout hook, react delayed loading spinner]
image: /img/og.png
---

# React useTimeout Hook: Declarative setTimeout with Cleanup (2026)

Here is a "Copied!" button. Every codebase has one, and this version has three bugs:

```tsx
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    setTimeout(() => setCopied(false), 2000);
  }, [copied]);

  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); }}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
```

It never clears the timer, so unmounting mid-countdown leaves a callback scheduled against a dead component. It re-arms on every `copied` change instead of restarting cleanly. And in React 18's StrictMode the effect runs twice on mount, so you get two timers where you meant one. Add the missing `clearTimeout` and you've fixed the leak but not the shape of the problem: the timer's lifetime is now tangled into a dependency array, and there is still no way to cancel it from a click handler, restart it on demand, or ask "is it still running?"

`setTimeout` is a fire-and-forget browser primitive. React components are not fire-and-forget — they unmount, re-render, and change their minds. [`useTimeout`](https://reactuse.com/effect/usetimeout/) and [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) from [`@reactuses/core`](https://reactuse.com) close that gap by handing you the timer as a piece of state plus two controls, instead of a number you have to babysit. This post covers what they actually do under the hood, the one behavior that trips everyone up (the delay is a dependency, the callback isn't), a `start()` trap that silently corrupts your arguments, and the patterns worth copying.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useTimeoutFn } from "@reactuses/core";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [, startReset] = useTimeoutFn(() => setCopied(false), 2000, {
    immediate: false,
  });

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        startReset();
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
```

No effect, no dependency array, no cleanup to remember. The timer is armed by a click rather than by a render, it's cleared automatically on unmount, and clicking Copy again while the badge is still showing restarts the two seconds instead of stacking a second timer on top of the first.

## Two Hooks, One Engine

Both hooks return the same three-element tuple — the library calls it `Stoppable`:

```tsx
type Stoppable = [isPending: boolean, start: Fn, cancel: Fn];
```

They differ only in what happens at the deadline.

**[`useTimeoutFn(cb, ms, options?)`](https://reactuse.com/effect/usetimeoutfn/)** runs your callback. Use it when the deadline has a job to do — dismiss the toast, reset the flag, fire the analytics ping.

**[`useTimeout(ms?, options?)`](https://reactuse.com/effect/usetimeout/)** runs no callback of yours. It flips `isPending` from `true` to `false` and re-renders. Use it when the deadline *is* the state — "has 300ms passed yet?" is the whole question.

`useTimeout` is literally `useTimeoutFn` with the callback slot spent on a forced re-render:

```tsx
export const useTimeout: UseTimeout = (ms = 0, options = {}) => {
  const update = useUpdate();
  return useTimeoutFn(update, ms, options);
};
```

That [`useUpdate`](https://reactuse.com/effect/useupdate/) is a two-line `useReducer` that increments a counter modulo a million — the standard "force a re-render without inventing fake state" trick, with the modulo there so a long-lived component can't drift toward `Number.MAX_SAFE_INTEGER`. It guarantees a render at the deadline even in the cases where `isPending` alone wouldn't produce one, which is what lets you use `useTimeout` as a bare "re-render me in N milliseconds" primitive when you need to re-read something that isn't React state.

By default both start on mount. Pass `{ immediate: false }` and nothing happens until you call `start()` yourself.

## What It Actually Does

The implementation is about twenty lines, and every one of them is answering a bug from the opening example:

```tsx
export const useTimeoutFn = (cb, interval, options = {}) => {
  const { immediate = true } = options;
  const [pending, setPending] = useState(() => immediate);
  const savedCallback = useLatest(cb);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const stop = useEvent(() => {
    setPending(false);
    if (timer.current) clearTimeout(timer.current);
  });

  const start = useEvent((...args: unknown[]) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPending(false);
      savedCallback.current(...args);
    }, interval);
    setPending(true);
  });

  useEffect(() => {
    if (immediate) start();
    return stop;
  }, [stop, immediate, interval, start]);

  return [pending, start, stop];
};
```

Five decisions are packed in there, and each one is worth knowing about because each one shows up in your code later.

**The callback lives in a ref, not in the deps.** [`useLatest`](https://reactuse.com/state/uselatest/) keeps `savedCallback.current` pointing at the newest function after every committed render, and the timer calls through it. So the closure that fires at the deadline is the one from your *most recent* render — the stale-closure bug is gone — but swapping the callback does **not** restart the countdown. A timer started 4 seconds into a 5-second delay still has 1 second left, even if the function it will call has been re-created ten times since. That's the correct behavior and it's covered by a test in the repo, but it surprises people who expect a `useEffect`-shaped hook to re-run when its inputs change.

**The delay *is* in the deps.** `interval` sits in the dependency array, so changing it tears the timer down and starts a fresh one from zero. Deliberate, and usually what you want — but see the gotchas, because a delay computed inline is an easy way to build a countdown that never finishes.

**`start` and `stop` never change identity.** [`useEvent`](https://reactuse.com/effect/useevent/) wraps both in a `useCallback` with an empty dependency array that forwards to a ref, so the functions you get on render 1 are reference-identical to the ones on render 500. You can put them in dependency arrays, hand them to memoized children, or stash them in a context without any of the usual churn.

**`start()` clears before it sets.** Calling it while a timer is already running doesn't stack — it cancels and restarts. That's what makes "click Copy again" behave sanely, and it means repeatedly calling `start()` on every keystroke gives you debounce semantics for free (though [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) says what you mean more clearly).

**`pending` is seeded, not flashed.** `useState(() => immediate)` means that when `immediate` is on, the very first render already reads `true` — no `false → true` flicker on mount, no wasted render. And because `immediate` is a plain option with the same value on the server and the client, the seeded value is identical on both sides. Nothing in this hook touches `window`, `document` or `Date`, so it renders on the server without a guard and hydrates without a mismatch.

The effect's cleanup is `stop` itself, which is the leak fix: unmount clears the timer, always, whatever state it was in.

## The Patterns Worth Copying

### The delayed spinner

The single best use of `useTimeout`. A spinner that appears for 80ms and vanishes reads as a flicker — worse than no spinner at all. The fix is to only show it if loading is actually slow, which is exactly "has 300ms passed?":

```tsx
function UserList() {
  const { data, isLoading } = useUsers();
  const [tooSoon] = useTimeout(300);

  if (isLoading) return tooSoon ? null : <Spinner />;
  return <List items={data} />;
}
```

`tooSoon` starts `true` and flips to `false` 300ms after mount. Fast responses render nothing at all in the gap; slow ones get a spinner. One line, no state, no effect.

### Auto-dismiss with hover-to-pause

The tuple's `cancel` and `start` are what make this trivial — a hand-rolled version needs a ref and two effects:

```tsx
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [, start, cancel] = useTimeoutFn(onDismiss, 5000);

  return (
    <div role="status" onMouseEnter={cancel} onMouseLeave={() => start()}>
      {message}
    </div>
  );
}
```

Note the `() => start()` on `onMouseLeave`. That is not a style choice — see the gotchas.

### A cooldown button

```tsx
function ResendCodeButton({ onResend }: { onResend: () => void }) {
  const [cooling, startCooldown] = useTimeout(30_000, { immediate: false });

  return (
    <button
      disabled={cooling}
      onClick={() => { onResend(); startCooldown(); }}
    >
      {cooling ? "Code sent — try again shortly" : "Resend code"}
    </button>
  );
}
```

`immediate: false` is the important part: the button is live on mount and only goes cold once it's been used. If you want to render the remaining seconds rather than a boolean, that's a different hook — [`useCountDown`](https://reactuse.com/state/usecountdown/) ticks down and hands you the number.

### Yielding to the browser

`useTimeout()` with no arguments defaults to `ms = 0`, which still defers to a macrotask — after paint, after pending microtasks. Occasionally that's exactly the escape hatch you want for "let the browser draw this frame before I do the expensive thing," and it's cheaper to reason about than a `requestIdleCallback` polyfill. For anything that should run per-frame instead of once, use [`useRafFn`](https://reactuse.com/effect/useraffn/).

## Gotchas Worth Knowing

- **`start` forwards its arguments to your callback.** This is a real feature — `start(userId)` passes `userId` through to the timer callback — and a real trap when the caller is a DOM handler. `onMouseLeave={start}` hands React's synthetic `MouseEvent` straight into your `onDismiss(...)`. If that callback is `onDismiss(id?: string)`, you've just dismissed a toast with an event object as its id, and TypeScript won't stop you because `start` is typed as `Fn`. Wrap it: `onMouseLeave={() => start()}`. Same rule for `onClick`, `onBlur`, and anything else that supplies an event.

- **A changing delay restarts the countdown — every time.** `interval` is a dependency, so this never fires:

  ```tsx
  // BROKEN: a new delay on every render restarts the timer forever
  useTimeoutFn(onDone, Math.max(0, deadline - Date.now()));
  ```

  Any delay recomputed per render resets the clock before it can run out. Pass a stable number, or memoize it. The flip side is useful: when the delay genuinely changes — a user picking "dismiss after 3s / 10s / never" — the restart is exactly right.

- **A changing callback does *not* restart it.** The mirror image, and equally worth internalizing. Your callback is always the latest one, but its scheduled deadline is whatever it was when `start()` ran.

- **`cancel()` sets `isPending` to `false`.** It's a stop, not a pause — there is no "resume with the remaining time." `start()` after `cancel()` begins a fresh full delay. If you need true pause/resume semantics, track the elapsed time yourself and pass the remainder as the new delay.

- **After unmount, `isPending` freezes at its last rendered value.** The cleanup calls `stop()`, which clears the timer and calls `setPending(false)` — but that state update lands on an unmounted component, so React discards it. If you snapshot the tuple in a test and read it after `unmount()`, `isPending` will still be `true`. It is not a leak and not a warning; the timer really is cleared.

- **StrictMode double-arms, then converges.** In React 18 development the mount effect runs, cleans up, and runs again, so you'll see two `setTimeout` calls in dev. There's never a duplicate firing — `stop` clears the first one and `start` clears again before scheduling — but the countdown effectively begins on the second run. In practice that's a sub-millisecond difference; in a test with fake timers advanced by exact amounts, it's a difference that can bite.

- **`immediate` is read on mount and as a dependency.** Flipping `immediate` from `false` to `true` on a later render *will* start the timer, because it's in the effect's deps. Toggling it is a legitimate way to arm a timer declaratively — just don't be surprised when it's not inert.

## When Not to Use It

These hooks are a thin, honest wrapper over one `setTimeout`. When your problem has a name, the named hook handles edge cases you'd otherwise rediscover:

- **Repeating on a schedule** → [`useInterval`](https://reactuse.com/effect/useinterval/), not a timeout that re-arms itself. Self-rescheduling timeouts drift and are miserable to cancel.
- **"Wait until the user stops typing"** → [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) for a callback, [`useDebounce`](https://reactuse.com/state/usedebounce/) for a value. You *can* build this by calling `start()` on each keystroke, but the dedicated hooks say so at a glance.
- **"At most once every N ms"** → [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) / [`useThrottle`](https://reactuse.com/state/usethrottle/). A timeout is the wrong primitive for rate limiting; the first call should go through immediately.
- **A visible countdown** → [`useCountDown`](https://reactuse.com/state/usecountdown/). Rendering "4… 3… 2…" from a single timeout means running your own tick loop.
- **"Has the user gone quiet?"** → [`useIdle`](https://reactuse.com/browser/useidle/), which already watches the right set of activity events.
- **Per-frame animation** → [`useRafFn`](https://reactuse.com/effect/useraffn/). `setTimeout` doesn't align to the compositor and keeps running in background tabs.
- **Cleanup on unmount only** → [`useUnmount`](https://reactuse.com/effect/useunmount/). No timer needed.

## Takeaways

- `setTimeout` in a `useEffect` forces you to hand-manage four things at once: the cleanup, the dependency array, the stale closure, and the lack of controls. Getting three right and one wrong is the normal outcome.
- [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) returns `[isPending, start, cancel]` and clears on unmount by construction. [`useTimeout`](https://reactuse.com/effect/usetimeout/) is the same engine with the callback spent on a re-render, for when the deadline itself is the state you care about.
- The delay is a dependency and the callback isn't — changing the delay restarts the countdown, changing the callback silently swaps what fires. Both are deliberate; knowing which is which saves an afternoon.
- `start` forwards its arguments, so never pass it directly to a DOM event handler. `onMouseLeave={() => start()}`, not `onMouseLeave={start}`.
- `start` and `cancel` are identity-stable forever, `isPending` is seeded so it doesn't flash on mount, and nothing in the hook touches a browser global — it renders on the server untouched.

`useTimeout`, `useTimeoutFn`, `useInterval`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
