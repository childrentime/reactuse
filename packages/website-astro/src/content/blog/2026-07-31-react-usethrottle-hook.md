---
title: "React useThrottle Hook: Throttle Values & Callbacks (2026)"
description: "A practical guide to useThrottle and useThrottleFn in React: throttle a fast-changing value or a hot event handler to a steady cadence, tune leading/trailing edges, cancel or flush pending calls — with lodash-grade timing, no stale closures, and automatic cleanup on unmount. SSR-safe and TypeScript-first."
slug: react-usethrottle-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-31
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useThrottle, usethrottle, useThrottle hook, react throttle hook, throttle scroll react, useThrottleFn, react throttle state, throttle callback react, lodash throttle react, react throttle vs debounce, throttle mousemove react, react throttle typescript, ssr-safe throttle, throttle event handler react]
image: /img/og.png
---

# React useThrottle Hook: Throttle Values & Callbacks (2026)

A `scroll` listener fires at whatever rate the compositor feels like — often 60 times a second, sometimes 120. `mousemove` is worse. Feed either straight into `setState` and every wiggle of the wheel re-renders your component tree at frame rate; feed it into an analytics call or a network request and you've built a tiny DDoS against your own backend. Debouncing is the wrong fix here: a debounced scroll handler waits for the scrolling to *stop*, so your reading-progress bar freezes mid-scroll and jumps at the end. What you want is a steady cadence — *run this at most once every N milliseconds, while the events keep coming*. That's throttling.

[`useThrottle`](https://reactuse.com/state/usethrottle/) and [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) from [`@reactuses/core`](https://reactuse.com) are that cadence as hooks — one for values, one for callbacks — built on lodash's battle-tested `throttle` and wrapped so the two classic React failure modes (stale closures, timers that outlive the component) can't happen. This post walks the real implementation, the `leading`/`trailing` knobs, the `cancel`/`flush` escape hatches, and one mount-timing subtlety the test suite pins down. TypeScript-first.

<!-- truncate -->

## useThrottle — Throttle a Value

`useThrottle` takes a value that changes too fast and returns a copy that changes at a civilized pace:

```tsx
import { useState } from 'react';
import { useThrottle } from '@reactuses/core';

function MarkdownEditor() {
  const [source, setSource] = useState('');
  const throttledSource = useThrottle(source, 500);

  return (
    <div className="editor">
      <textarea value={source} onChange={e => setSource(e.target.value)} />
      {/* re-parses at most twice per second, even while typing full speed */}
      <Preview markdown={throttledSource} />
    </div>
  );
}
```

The input stays perfectly responsive — `source` updates on every keystroke. Only the expensive consumer is throttled: `throttledSource` updates immediately on the first change, then at most once per 500 ms while changes keep arriving, and settles on the final value once they stop. Compare the debounced version of this editor: the preview would go blank-faced during typing and only catch up in the pauses. Throttle keeps it *live*, just at a lower refresh rate.

The signature:

```ts
function useThrottle<T>(value: T, wait?: number, options?: ThrottleSettings): T;
```

`ThrottleSettings` is lodash's — `{ leading?: boolean; trailing?: boolean }` — and we'll get to it below.

## useThrottleFn — Throttle a Callback

When the thing to slow down is a *function* rather than a value, [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) wraps it and hands back controls:

```tsx
import { useState } from 'react';
import { useThrottleFn, useEventListener } from '@reactuses/core';

function ScrollSpy({ sectionIds }: { sectionIds: string[] }) {
  const [active, setActive] = useState(sectionIds[0]);

  const { run } = useThrottleFn(() => {
    setActive(computeActiveSection(sectionIds, window.scrollY));
  }, 200);

  useEventListener('scroll', run);

  return <TableOfContents ids={sectionIds} active={active} />;
}
```

The scroll event fires at frame rate; `computeActiveSection` runs five times a second. The return value is an object with three functions:

```ts
const { run, cancel, flush } = useThrottleFn(fn, wait, options);
```

- **`run(...args)`** — the throttled function. Same parameters as `fn`, and it returns `fn`'s result (the most recent one, when a call gets suppressed — standard lodash semantics).
- **`cancel()`** — drop whatever trailing call is pending. A "Reset" button that clears the UI shouldn't be followed 200 ms later by a ghost update from the last scroll event; call `cancel()` when the interaction is abandoned.
- **`flush()`** — the opposite: don't wait for the window to close, run the pending call *now*. Classic use: throttled autosave plus `flush()` on "Submit", so the final state is persisted before navigation, not 2 seconds after.

These aren't decorative — the library's test suite drives a full timeline through `run`/`cancel`/`flush` with fake timers and pins every intermediate count: the leading call fires synchronously, suppressed calls collapse into one trailing call carrying the *latest* arguments, `cancel()` really does drop the pending call, and `flush()` really does fire it early.

## Under the Hood: lodash Plus Two Fixes

The [implementation](https://reactuse.com/effect/usethrottlefn/) is short enough to read over coffee:

```ts
export function useThrottleFn<T extends (...args: any) => any>(
  fn: T, wait?: number, options?: ThrottleSettings,
) {
  const fnRef = useLatest(fn);

  const throttled = useMemo(
    () =>
      throttle(
        (...args: [...Parameters<T>]): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [wait, JSON.stringify(options)],
  );

  useUnmount(() => {
    throttled.cancel();
  });

  return { run: throttled, cancel: throttled.cancel, flush: throttled.flush };
}
```

The throttling engine is `lodash-es`'s `throttle` — timing logic with a decade of production mileage, not a hand-rolled `setTimeout` dance. What the hook adds is exactly the two things that go wrong when you call `lodash.throttle` inside a component yourself:

1. **No stale closures.** The naive `useMemo(() => throttle(fn, wait), [])` freezes the *first render's* `fn` — with its first-render props and state — for the component's lifetime. Here the memoized throttle calls `fnRef.current`, a [`useLatest`](https://reactuse.com/state/uselatest/) ref that re-points at the newest `fn` every render. Timing state lives in one stable throttle instance; the code it invokes is always current.
2. **No timers outliving the component.** [`useUnmount`](https://reactuse.com/effect/useunmount/) calls `throttled.cancel()`, so a pending trailing call can't fire into an unmounted component. The test suite asserts the timer count is literally zero after unmount.

One small delight in the deps array: `JSON.stringify(options)`. You can pass `{ trailing: false }` inline — a fresh object every render — without recreating the throttle instance, because the memo compares the options by *content*, not identity. And `useThrottle` itself is just this hook pointed at state — `useThrottleFn(() => setThrottled(value), wait, options)` with an effect calling `run()` whenever `value` changes. One timing engine, two shapes.

## Tuning: leading and trailing

Both edges default to `true`, which is the behavior you usually want — instant first response, no lost final value:

```tsx
useThrottle(value, 500);                      // fire now, then every ≤500ms, then final value
useThrottle(value, 500, { leading: false });  // skip the instant first update
useThrottle(value, 500, { trailing: false }); // skip the settle-to-final-value update
```

- **`leading: false`** delays the first invocation to the end of the window. Useful when the first event of a burst isn't meaningful on its own — e.g. reporting "user is scrolling" analytics where you'd rather not fire on a single wheel tick.
- **`trailing: false`** means calls made mid-window are dropped rather than deferred. Fine for continuous streams where the next window will bring a fresh reading anyway; wrong for anything where the *last* value matters (your progress bar would stop just short of 100%).
- Both `false` is a lodash trap — the function can only fire if called when no window is open, which for a steady event stream means *almost never*. Don't.

## The Mount Gotcha — the First Change Can Wait

Here's the subtlety worth knowing about `useThrottle` (the value version). Internally it calls `run()` in an effect on mount — that leading call just re-sets the initial value, invisible. But it also *opens the throttle window*. The consequence: a value change arriving **within `wait` of mount** doesn't update instantly, leading edge or no — it's mid-window, so it waits for the trailing edge. The test suite states it plainly:

```ts
const { result, rerender } = renderHook(props => useThrottle(props, 100), {
  initialProps: 0,
});
rerender(1);                     // change right after mount
jest.advanceTimersByTime(50);
expect(result.current).toBe(0);  // still the old value — deferred to t=100
```

After that first window expires, a change that arrives in quiet air gets its own leading edge and shows up immediately. So in steady state `useThrottle` feels instant-then-throttled, exactly as advertised — but if your component mounts and the value changes in the same breath (hydration handoffs, an immediate fetch result), that first change lands up to `wait` ms late. If that matters, shorten `wait` or throttle the *source* with `useThrottleFn` instead of the value.

## Throttle or Debounce?

Thirty-second version, since they're the two ends of one spectrum:

- **Debounce** = "wait for silence." Nothing happens until the events *stop* for `wait` ms. Right for search-as-you-type, autosave, resize-finished layout work — cases where only the final state matters. That's [`useDebounce`](https://reactuse.com/state/usedebounce/) / [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/).
- **Throttle** = "steady heartbeat." Runs *during* the activity, at a capped rate. Right for scroll position, mouse tracking, drag feedback, progress reporting — cases where the user needs to see something happening while it happens.

The tell: if a debounced version of your feature feels *frozen* during interaction, you wanted throttle. The full decision guide with both hooks side by side is in [Debounce vs Throttle in React](https://reactuse.com/blog/react-debounce-vs-throttle/).

## The Rate-Limiting Family

- [`useDebounce`](https://reactuse.com/state/usedebounce/) / [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) — the same value/callback pair, wait-for-silence timing, same lodash core and same stale-closure/unmount fixes.
- [`useRafFn`](https://reactuse.com/effect/useraffn/) — throttling to the *display's* rhythm instead of a millisecond budget: runs a callback once per animation frame. For work that feeds rendering (element highlighting, canvas drawing), one-per-frame beats any hand-picked `wait`.
- [`useRafState`](https://reactuse.com/state/userafstate/) — `useState` whose setter commits on the next frame; multiple high-frequency sets per frame collapse into one render. The lightest-touch fix for `mousemove`-driven state.
- [`useScroll`](https://reactuse.com/browser/usescroll/) and [`useMouse`](https://reactuse.com/browser/usemouse/) — position-tracking hooks you'll often find on the *input* side of a throttle.

## SSR Safety

`useThrottleFn` creates the lodash throttle during render, but creating it starts no timers — timers start when `run()` is called, and every call site lives in an effect or an event handler, which never execute during server rendering. No `window`, no `document`, no clock touched on the server: your Next.js / Remix build renders the initial value and hydrates cleanly, and throttling wakes up with the client. SSR-safe by construction, like every hook in [`@reactuses/core`](https://reactuse.com).

## Takeaways

- **Throttle is a cadence, debounce is a wait.** For anything the user watches *during* the interaction — scroll, drag, mouse, live preview — reach for [`useThrottle`](https://reactuse.com/state/usethrottle/) / [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/), not debounce.
- **Values and callbacks are the same engine in two shapes**: `useThrottle` is literally `useThrottleFn` pointed at a `setState`.
- **The wrapper earns its keep twice**: [`useLatest`](https://reactuse.com/state/uselatest/) kills stale closures, [`useUnmount`](https://reactuse.com/effect/useunmount/) cancels pending timers — the two bugs every hand-rolled `lodash.throttle`-in-React eventually ships.
- **`cancel()` and `flush()` are the escape hatches** — drop the pending call when the interaction is abandoned, force it when the user commits.
- **Mind the mount window**: a value change within `wait` of mount waits for the trailing edge — verified by the test suite, not vibes.
- **SSR-safe with nothing to configure** — no timers, no browser globals until the client takes over.

Install [`@reactuses/core`](https://reactuse.com), point `useThrottle` at your noisiest value, and give your render loop a pulse instead of a seizure.
