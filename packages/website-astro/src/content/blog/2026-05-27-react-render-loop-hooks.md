---
title: "Animating React Without Fighting the Render Loop: useRafFn, useRafState, useFps, useDevicePixelRatio, useUpdate"
description: "React's reconciler runs whenever it pleases; the browser's compositor runs at sixty frames a second; your animation has to land on the second one without getting tangled in the first. A walk through five ReactUse hooks — useRafFn, useRafState, useFps, useDevicePixelRatio, and useUpdate — that sit on top of requestAnimationFrame so React state, canvas drawing, and high-DPI rendering stop blocking each other."
slug: react-render-loop-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-27
tags: [react, hooks, animation, performance, tutorial]
keywords: [react requestAnimationFrame hook, react useRafFn, react animation hook, react raf state, react useRafState, react fps hook, react useFps, react device pixel ratio hook, react useDevicePixelRatio, retina canvas react, react force rerender, react useUpdate, react 60fps animation, react canvas hook, react performance hook, react animation loop, react render frame batching]
image: /img/og.png
---

# Animating React Without Fighting the Render Loop: useRafFn, useRafState, useFps, useDevicePixelRatio, useUpdate

React owns one clock and the browser owns another. React's reconciler decides when components re-render based on state updates, effects, and the scheduler's idea of "soon". The browser's compositor paints the screen at whatever rate the display can sustain — sixty frames a second on most monitors, a hundred and twenty on a few. The two clocks are not synced. State updates can land between paints and get coalesced; long render trees can miss a paint entirely; a `setInterval(handler, 16)` will drift by hundreds of milliseconds over a minute because `setInterval` does not care what the GPU is doing.

<!-- truncate -->

The standard fix is `requestAnimationFrame`. It hands you a callback that fires *just before the next paint*, with a high-resolution timestamp, throttled automatically when the tab is hidden. It is the right primitive for everything that has to look smooth. It is also tedious to wire up correctly in React: you need a ref to hold the frame ID, an effect to start the loop, a cleanup to cancel it on unmount, a `useLatest` so the callback sees fresh props, and another ref if you want pause/resume. Every animated component reinvents this scaffolding, and most of them get one of the cleanups wrong the first time around.

[ReactUse](https://reactuse.com) bundles the scaffolding into five hooks that share the same underlying loop. This post walks each one — `useRafFn` for the loop itself, `useRafState` for state that updates with the loop, `useFps` for measuring the loop, `useDevicePixelRatio` for drawing into the loop at the right resolution, and `useUpdate` for the cases where you need to nudge React but do not have state to change. Together they cover almost everything you would build outside of a dedicated animation library.

## The Bug, in One Component

A draggable card that follows the mouse:

```tsx
function FloatingCard() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      card
    </div>
  );
}
```

Looks fine. Now open the devtools profiler and wave the mouse across the screen. On a fast laptop `mousemove` fires somewhere between 120 and 500 times a second, depending on the input device and the OS. Every one of those events calls `setPos`, which schedules a re-render, which React batches into the next microtask. You are doing two to eight times more reconciliation work than the screen can possibly show, and the extra renders are pure overhead — the only one that mattered was the last one before the next paint.

[`useRafState`](https://reactuse.com/state/userafstate/) collapses that into one update per frame, no matter how fast the events come in. Drop-in replacement, same `[state, setState]` API, three fewer reconciliations per mouse twitch. The rest of the hooks in this post follow the same pattern: keep the React-shaped API, hide the `requestAnimationFrame` plumbing.

## 1. useRafFn — The Loop, With Pause and Resume

[`useRafFn`](https://reactuse.com/effect/useraffn/) is the primitive everything else builds on. It takes a callback and runs it on every `requestAnimationFrame` tick, passing the high-resolution timestamp. It returns `[stop, start, isActive]` so you can pause the loop on tab blur, user interaction, or any other signal:

```tsx
import { useRef } from 'react';
import { useRafFn } from '@reactuses/core';

function StarField({ count = 200 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.5 + 0.5,
    })),
  );

  const [stop, start, isActive] = useRafFn((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const t = time / 1000;
    for (const star of starsRef.current) {
      const x = ((star.x + t * 0.02 * star.z) % 1) * width;
      const y = star.y * height;
      ctx.fillStyle = `rgba(255, 255, 255, ${star.z})`;
      ctx.fillRect(x, y, 2, 2);
    }
  });

  return (
    <>
      <canvas ref={canvasRef} width={600} height={400} />
      <button onClick={() => (isActive() ? stop() : start())}>
        {isActive() ? 'Pause' : 'Resume'}
      </button>
    </>
  );
}
```

Four design choices in that hook worth understanding. The callback runs *just before paint* — `requestAnimationFrame` semantics — so any DOM read inside it sees the same layout the paint will use, with no extra forced reflow. The callback identity is wrapped in [`useLatest`](https://reactuse.com/state/uselatest/), so you can close over fresh props (`count`, anything in scope) without restarting the loop. The loop auto-starts on mount; pass `false` as the second argument if you want manual control from the first frame. And the cleanup is registered with the effect, so unmounting cancels the pending frame — no rogue callbacks running on a dead component.

The `isActive` return is a function, not a boolean. Reading it inside an event handler always gives the current value; reading it in render only sees the value at render time. That asymmetry catches people. If you want the active flag in the JSX for a `disabled={}` prop, pair `useRafFn` with `useUpdate` and call `update()` inside `stop`/`start` callers — the demo above gets away without it because the button label is regenerated on the next click anyway.

A real-world use beyond canvas is anything tracking time *between* events. A physics simulation that needs to integrate velocity by delta time. A scrub bar that tracks media element `currentTime` without the chunky `timeupdate` event (which fires at the codec's leisure, not yours). A custom cursor that lags behind the real one with a spring — `useRafFn` reads the latest target position, applies the spring step, writes the result to a CSS variable. All of those replace `setInterval` patterns that drift and burn battery in the background tab.

## 2. useRafState — useState That Coalesces Per Frame

[`useRafState`](https://reactuse.com/state/userafstate/) is the version of the floating-card example you actually ship:

```tsx
import { useRafState } from '@reactuses/core';
import { useEventListener } from '@reactuses/core';

function FloatingCard() {
  const [pos, setPos] = useRafState({ x: 0, y: 0 });

  useEventListener('mousemove', (e) => {
    setPos({ x: e.clientX, y: e.clientY });
  });

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        transition: 'transform 0.1s',
      }}
    >
      card
    </div>
  );
}
```

The API is exactly `useState` — same setter signature, same updater-function support — but writes are queued through `requestAnimationFrame`. Five `setPos` calls in the same frame collapse into one React update; the React update flushes at most once per paint; the DOM gets updated at the same rate the screen is refreshing. The mousemove listener still fires at 500Hz, which costs about as much as an empty function call. The reconciliation cost drops to 60Hz, which is what the screen can show anyway.

A few things to know. The hook keys updates by a single pending `requestAnimationFrame` ID per state slot, so consecutive setters within a frame *replace* rather than queue — the last value wins. That is almost always what you want for visual state: you do not care about the intermediate mouse positions, only where the cursor is at paint time. If you do care — if you are sampling sensor data and need every value — use plain `useState` and accept the re-render cost, or buffer into a ref and flush on a `useRafFn` tick.

The cleanup detail is the same as `useRafFn`: a pending frame is cancelled on unmount, so a fast click-drag-unmount sequence does not produce a `setState on unmounted component` warning. Internally it is `useState` + `useRef` for the frame ID + `useUnmount` cleanup, about twenty lines total. You could write it yourself; the hook saves you from having to.

There is one gotcha. Because the state lags one frame behind the event, code reading the state *immediately* after calling the setter will still see the old value:

```tsx
setPos({ x: 100, y: 100 });
console.log(pos); // still { x: 0, y: 0 } — update hasn't run yet
```

With plain `useState` this is also true within the same render cycle, but the lag of one whole frame can surprise you when wiring imperative code together. If you need the value back, store it in a ref alongside.

## 3. useFps — Measuring What You Built

`useRafFn` and `useRafState` both improve smoothness, but smoothness is a measured quantity, not a feeling. [`useFps`](https://reactuse.com/browser/usefps/) returns the current frame rate as a number, computed by counting how often the underlying `requestAnimationFrame` callback fires:

```tsx
import { useFps } from '@reactuses/core';

function FpsOverlay() {
  const fps = useFps();
  const color = fps >= 55 ? 'green' : fps >= 30 ? 'orange' : 'red';

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        padding: '4px 8px',
        background: 'rgba(0,0,0,0.7)',
        color,
        fontFamily: 'monospace',
      }}
    >
      {fps} fps
    </div>
  );
}
```

Drop that into a dev build and you have the FPS counter you would normally reach for Chrome's rendering panel to get. The hook accepts an `every` option (default `10`) that controls how many frames it averages over; smaller numbers respond faster to a hitch but jitter more, larger numbers smooth out the readout but lag behind a sudden drop. Ten is a fine default for a corner overlay; one or two is what you want if you are debugging a specific janky transition.

The more interesting use is *adaptive rendering*. Read the FPS, and when it drops below a threshold, reduce the work you are doing:

```tsx
function ParticleSystem({ baseCount = 1000 }: { baseCount?: number }) {
  const fps = useFps({ every: 30 });
  const count =
    fps >= 55 ? baseCount : fps >= 40 ? baseCount / 2 : baseCount / 4;

  return <Particles count={count} />;
}
```

That is the same trick AAA game engines pull when the frame budget tightens — drop particle counts, reduce shadow resolution, switch a fluid simulation to a lower grid. For a React app it is usually enough to halve the count of an animated background, or stop running a non-essential `useRafFn` loop entirely. The threshold values are taste; 55 is a reasonable "we are basically fine" line on a 60Hz display, since the average can dip into the high fifties just from GC pauses without anyone noticing.

A note on SSR: the hook returns `0` on the server, so do not gate critical UI on the value being non-zero. The first client render also returns `0` for the duration of the first measurement window, then jumps to a real number on the next tick. If you use it for adaptive rendering, default the "high-fidelity" path until the first measurement comes in.

## 4. useDevicePixelRatio — Drawing at the Right Resolution

Canvas elements have two sizes: their CSS size, which is what determines how big the element looks on the page, and their pixel buffer size, which is what determines how detailed it looks. On a Retina display the device pixel ratio is 2, which means a `<canvas width="600" height="400">` element sized at `600px × 400px` in CSS will look fuzzy — the 600×400 pixel buffer is being stretched across 1200×800 physical pixels by the browser's compositor. The fix is to size the buffer at `cssWidth × dpr` and `cssHeight × dpr`, then scale the drawing context by `dpr` so your coordinates stay in CSS units.

[`useDevicePixelRatio`](https://reactuse.com/browser/usedevicepixelratio/) tracks the current pixel ratio reactively — including when the user drags the window between a Retina laptop screen and an external 1x monitor:

```tsx
import { useRef, useEffect } from 'react';
import { useDevicePixelRatio } from '@reactuses/core';

function CrispCanvas({ width, height, draw }: {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pixelRatio } = useDevicePixelRatio();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(pixelRatio, pixelRatio);
    draw(ctx, width, height);
  }, [width, height, pixelRatio, draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
    />
  );
}
```

Three lines of imperative setup, but they are the three lines almost every canvas-in-React tutorial gets wrong: set the buffer size to `css × dpr`, set the CSS size to the original dimensions via inline style, scale the context. The hook makes the third dependency — pixel ratio — reactive, so dragging the window between monitors triggers a redraw at the right density.

Internally the hook uses [`matchMedia`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) on a `(resolution: <ratio>dppx)` query for the current ratio, plus the standard one for `<ratio>dpr`. When the ratio changes, the `matchMedia` listener fires, the hook re-renders, and your effect runs with the new value. The listener is added once on mount and removed on unmount — same lifetime story as everything else in this post.

The same pattern applies to anything drawing pixels: image canvases, WebGL contexts, video frame extraction. It also matters for `<img>` `srcset` selection, but the browser handles that automatically; you only need the hook when you are doing the rendering yourself. SSR returns `1` so layout calculations stay sensible on the server, and the value updates on the first paint after hydration.

## 5. useUpdate — A Re-Render, With No State

The strangest hook in this list and the one you reach for least often. [`useUpdate`](https://reactuse.com/effect/useupdate/) returns a stable function that, when called, forces a re-render of the component:

```tsx
import { useRef } from 'react';
import { useUpdate, useRafFn } from '@reactuses/core';

function StopwatchDisplay() {
  const startRef = useRef(performance.now());
  const update = useUpdate();

  useRafFn(() => {
    update();
  });

  const elapsed = ((performance.now() - startRef.current) / 1000).toFixed(2);
  return <div>{elapsed}s</div>;
}
```

That stopwatch updates every frame without storing the elapsed time in React state. The source of truth is `performance.now()`, read fresh on every render; `useUpdate` exists only to schedule the render. Six lines, no `setState`, no closure over a stale time. You can do the same with a `useState((s) => s + 1)` but the intent is clearer with `useUpdate` — "render this thing again" rather than "increment a counter for the side effect of rendering this thing again".

The more pragmatic uses are for *interop with imperative APIs* that mutate values React does not track. A WebGL renderer that exposes its current camera position by reference; a Three.js scene graph; a `Set` or `Map` you are using as state without re-creating it on every change. After mutating, you call `update()` to tell React the component is dirty:

```tsx
function FavoritesList({ favorites }: { favorites: Set<string> }) {
  const update = useUpdate();

  return (
    <ul>
      {[...favorites].map((id) => (
        <li key={id}>
          {id}{' '}
          <button onClick={() => {
            favorites.delete(id);
            update();
          }}>
            remove
          </button>
        </li>
      ))}
    </ul>
  );
}
```

Mutating the `Set` directly and then re-rendering is faster than the idiomatic `setFavorites(new Set([...favorites].filter(x => x !== id)))` for large sets, and lets the `Set` reference stay stable across renders so memoized children downstream do not have to recompute. It is also a perfectly good way to shoot yourself in the foot — React's optimizations assume immutability, so any place that relied on a reference change to detect an update will silently fail. Use it deliberately, document it loudly, and stick to plain `useState` whenever the perf cost is not measurable.

`useUpdate` also pairs with `useTextSelection` and other hooks that work with mutable platform objects (the post on [event hooks](/blog/react-event-hooks/) covers that case). If the underlying object is the same reference call to call, `setState` is a no-op; `useUpdate` is the workaround.

## Putting It Together: A 60fps Spring-Following Cursor

Four of the five hooks at once. A custom cursor that follows the real one with a spring, draws at the right resolution on Retina, shows its own FPS in the corner, pauses when the tab is hidden:

```tsx
import { useRef } from 'react';
import {
  useRafFn,
  useRafState,
  useFps,
  useDevicePixelRatio,
  useEventListener,
} from '@reactuses/core';

function SpringCursor() {
  const target = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useRafState({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const fps = useFps();
  const { pixelRatio } = useDevicePixelRatio();

  useEventListener('mousemove', (e: MouseEvent) => {
    target.current = { x: e.clientX, y: e.clientY };
  });

  useRafFn(() => {
    const dx = target.current.x - pos.x;
    const dy = target.current.y - pos.y;
    const stiffness = 0.15;
    const damping = 0.7;
    velocity.current.x = velocity.current.x * damping + dx * stiffness;
    velocity.current.y = velocity.current.y * damping + dy * stiffness;
    setPos({
      x: pos.x + velocity.current.x,
      y: pos.y + velocity.current.y,
    });
  });

  useEventListener('visibilitychange', () => {
    if (document.hidden) velocity.current = { x: 0, y: 0 };
  });

  const size = 24;
  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: '50%',
          background: 'currentColor',
          pointerEvents: 'none',
          imageRendering: pixelRatio >= 2 ? 'auto' : 'pixelated',
        }}
      />
      <div style={{ position: 'fixed', top: 8, left: 8, fontFamily: 'monospace' }}>
        {fps} fps @ {pixelRatio}x
      </div>
    </>
  );
}
```

Four hooks, each carrying their share of the work. `useEventListener` reads mouse coordinates at native rate into a ref — no React render. `useRafFn` runs the spring integration once per frame, reading the latest target and writing the spring position. `useRafState` batches the per-frame position update into a single render. `useFps` reports back what frame rate you are hitting. `useDevicePixelRatio` informs an `image-rendering` choice (small detail, but exactly the kind of thing that gets forgotten until someone on a 1x monitor complains).

The naive version of the same component would either call `setState` on every mousemove (renders at 500Hz, costs battery), or run a `setInterval(handler, 16)` that drifts and keeps running in the background tab, or skip the spring entirely and feel cheap. With the hooks it reads at the rate of the question — once per frame — and the React tree never re-renders faster than the user can see.

## When to Reach for Which

| You want to                                                                | Use                                                                          |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Run a callback every animation frame                                       | [`useRafFn`](https://reactuse.com/effect/useraffn/)                          |
| Update state at most once per paint                                        | [`useRafState`](https://reactuse.com/state/userafstate/)                     |
| Measure the current frame rate                                             | [`useFps`](https://reactuse.com/browser/usefps/)                             |
| Draw at the display's native resolution                                    | [`useDevicePixelRatio`](https://reactuse.com/browser/usedevicepixelratio/)   |
| Re-render after mutating something React does not track                    | [`useUpdate`](https://reactuse.com/effect/useupdate/)                        |

Two non-rules. `useRafFn` is not a `setInterval` replacement — it runs at the display's refresh rate, which is 120Hz on a ProMotion display and 30Hz on a power-saving tab. If you need exactly-N-times-per-second timing, use `useInterval` and accept the visual cost. And `useUpdate` is the escape hatch — if you are reaching for it more than once or twice in a codebase, the underlying problem is usually "I am storing state outside React for performance reasons", and the right fix is to fix the perf reason, not normalize the escape hatch.

## Installation

```bash
npm install @reactuses/core
# or
pnpm add @reactuses/core
# or
yarn add @reactuses/core
```

All five hooks tree-shake individually — importing `useRafState` does not pull in `useDevicePixelRatio`. Each ships TypeScript types and works in both client-rendered apps and SSR frameworks (Next.js, Remix, Astro); the loop-based hooks no-op on the server and `useDevicePixelRatio` / `useFps` return safe defaults (`1` and `0` respectively) until hydration.

## Related Hooks

If you find yourself wanting a render-loop hook that is not in this list, three adjacent posts are worth a look. [The ref escape hatch](/blog/react-ref-escape-hatch/) covers [`useLatest`](https://reactuse.com/state/uselatest/) — the internal trick that lets `useRafFn` see fresh closure values without restarting its loop — and is the post to read if you want to understand how these hooks work rather than just use them. [Event hooks](/blog/react-event-hooks/) covers `useEventListener` and `useThrottleFn`, which fit naturally with `useRafFn` for input-driven animation. And [scroll effects](/blog/react-scroll-effects/) covers scroll-linked animation hooks that build on these primitives at a higher level.

Browse the full set at [reactuse.com](https://reactuse.com), or open one of the hooks above and read the source — most of these are under 40 lines, and the loop primitives at the bottom of all five are the same eight-line `useRef` + `useEffect` pattern you have probably already written half a dozen times.
