---
title: "React useMeasure Hook: Measure DOM Elements with ResizeObserver (2026)"
description: "A practical guide to useMeasure in React: track an element's width, height, and position with ResizeObserver — one hook, zero manual observer wiring. Covers the contentRect gotcha, useMeasure vs useElementSize vs useElementBounding, migrating from react-use-measure, and SSR safety. TypeScript-first."
slug: react-usemeasure-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-05
tags: [react, hooks, element, typescript, tutorial]
keywords: [react useMeasure, usemeasure, useMeasure hook, react-use-measure, react measure element, react element size hook, react resizeobserver hook, measure dom element react, react measure div width height, usemeasure react, react component size hook, react getboundingclientrect hook, react measure ref]
image: /img/og.png
---

# React useMeasure Hook: Measure DOM Elements with ResizeObserver (2026)

Sooner or later every React app needs to know how big an element is. A chart needs its container's pixel width before it can draw. A virtualized list needs row heights. An auto-growing textarea, a truncation detector, a component that switches layout when *it* — not the viewport — gets narrow: all of them need live element dimensions, and React doesn't provide them. So you reach for `getBoundingClientRect()` in an effect, discover it only runs once, add a `resize` listener on `window`, and then notice the element also resizes when a sibling collapses, a font loads, or content changes — none of which fire a window resize event.

The correct primitive is `ResizeObserver`, and [`useMeasure`](https://reactuse.com/element/usemeasure/) from [`@reactuses/core`](https://reactuse.com) is that primitive wrapped into one line: pass a ref, get back a live rect. No observer construction, no disconnect bookkeeping, no stale-closure traps. This post walks the API, the `contentRect` gotcha that trips almost everyone, how the hook works inside, how it compares to its sibling hooks (`useElementSize`, `useElementBounding`, `useResizeObserver`), and migration from `react-use-measure`. TypeScript-first.

<!-- truncate -->

## The Simplest Case: A Live-Sized Container

```tsx
import { useRef } from 'react';
import { useMeasure } from '@reactuses/core';

function Chart() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect] = useMeasure(ref);

  return (
    <div ref={ref} style={{ width: '100%', height: '400px' }}>
      <svg width={rect.width} height={rect.height}>
        {/* draw with real pixel dimensions */}
      </svg>
    </div>
  );
}
```

That's the whole pattern: a ref on the element, `useMeasure(ref)`, and a `rect` that re-renders the component whenever the element's content box changes size — window resizes, flexbox reflows, sidebar toggles, font swaps, anything. You never touch `ResizeObserver` directly and there's no cleanup to remember; the observer disconnects automatically on unmount.

## The Full API

```ts
const [rect, stop] = useMeasure(target, options?);
```

**`target`** accepts the same flexible shapes as every element hook in `@reactuses/core`:

```tsx
useMeasure(ref);                          // a React ref object
useMeasure(document.querySelector('#el')); // a raw Element
useMeasure(() => document.body);           // a function returning an element
```

**`options`** is a standard [`ResizeObserverOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/observe#options) object — `{ box: 'content-box' | 'border-box' | 'device-pixel-content-box' }` — controlling which box triggers observations.

**`rect`** is a `UseMeasureRect`:

```ts
type UseMeasureRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
};
```

Before the first observation fires (including during SSR), every field is `0`.

**`stop`** is a function that disconnects the observer. Call it when you've measured what you needed and don't want further re-renders — say, after capturing an initial layout for an animation:

```tsx
const [rect, stop] = useMeasure(ref);

useEffect(() => {
  if (rect.width > 0) {
    startEnterAnimation(rect);
    stop(); // one measurement was enough
  }
}, [rect, stop]);
```

## The contentRect Gotcha: top/left Are Not Viewport Coordinates

This is the number-one confusion with every ResizeObserver-based measure hook, so let's kill it early. The rect comes from `entry.contentRect`, and `contentRect` is relative to **the element's own box**, not the viewport:

- `width` / `height` — the **content box** size: excludes padding, border, and scrollbars.
- `top` / `left` (and `x` / `y`) — the offset of the content box from the element's border box. In practice: **your `padding-top` and `padding-left`**, not the element's position on the page.

So for an element with `padding: 16px` sitting 300px down the page, `useMeasure` reports `top: 16`, not `top: 300`. If what you actually want is *where the element is on screen* — for positioning a tooltip, a dropdown, a spotlight overlay — you want `getBoundingClientRect()` semantics, and that's a different hook: [`useElementBounding`](https://reactuse.com/element/useelementbounding/), which returns viewport-relative coordinates and also updates on scroll.

Rule of thumb: **`useMeasure` answers "how big is it?"; `useElementBounding` answers "where is it?"**

## How It Works Inside

`useMeasure` is a thin layer over the library's [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) hook:

```ts
import { useState } from 'react';
import { useResizeObserver } from '../useResizeObserver';

export const useMeasure = (target, options = defaultOptions) => {
  const [rect, setRect] = useState(defaultState); // all zeros

  const stop = useResizeObserver(
    target,
    entries => {
      if (entries[0]) {
        const { x, y, width, height, top, left, bottom, right }
          = entries[0].contentRect;
        setRect({ x, y, width, height, top, left, bottom, right });
      }
    },
    options,
  );

  return [rect, stop] as const;
};
```

The interesting machinery lives in `useResizeObserver`:

```ts
export const useResizeObserver = (target, callback, options) => {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<ResizeObserver>();
  const { key: targetKey, ref: targetRef } = useStableTarget(target);

  const stop = useCallback(() => {
    observerRef.current?.disconnect();
  }, []);

  useDeepCompareEffect(() => {
    const element = getTargetElement(targetRef.current);
    if (!element) return;
    observerRef.current = new ResizeObserver(savedCallback.current);
    observerRef.current.observe(element, options);
    return stop;
  }, [targetKey, options]);

  return stop;
};
```

Three details worth noticing:

1. **[`useLatest`](https://reactuse.com/state/uselatest/) wraps the callback** — you can pass an inline arrow function without tearing down and recreating the observer on every render. The observer is constructed once; the ref always points at the latest callback.

2. **[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) guards the options object** — `useMeasure(ref, { box: 'border-box' })` passes a fresh object literal every render. A plain `useEffect` with `[options]` would disconnect and reconnect the observer each time. Deep comparison means the observer only rebuilds when the options *values* actually change.

3. **The observer is created inside an effect** — effects don't run on the server, so `new ResizeObserver(...)` never executes during SSR. The hook is SSR-safe by construction: the server renders with the all-zeros rect, the client hydrates identically, and the first observation fires after mount.

That third point also explains the initial `{ width: 0, height: 0 }` render. Guard against it when zero would break your math:

```tsx
const [rect] = useMeasure(ref);

return (
  <div ref={ref}>
    {rect.width > 0 && <Chart width={rect.width} height={rect.height} />}
  </div>
);
```

## useMeasure vs useElementSize vs useElementBounding vs useResizeObserver

`@reactuses/core` ships four hooks in this space. They're layered, not redundant:

| | [`useMeasure`](https://reactuse.com/element/usemeasure/) | [`useElementSize`](https://reactuse.com/element/useelementsize/) | [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) |
|---|---|---|---|---|
| **Returns** | `[rect, stop]` — full 8-field rect | `[width, height]` | `{ x, y, top, left, ... }` viewport-relative | `stop` (you get raw entries in a callback) |
| **Source** | `contentRect` | `contentBoxSize` / `borderBoxSize` | `getBoundingClientRect()` | Raw `ResizeObserverEntry[]` |
| **Coordinates** | Element-relative (padding offsets) | — (size only) | **Viewport-relative** | Whatever you read from entries |
| **Updates on scroll** | No | No | **Yes** (window scroll + resize listeners) | No |
| **Box option** | Observation trigger only | **Measured value follows `box`** | — | Observation trigger only |
| **Best for** | Size + a stop switch | Just width/height, minimal re-renders | Tooltips, popovers, overlays — positioning | Custom logic; multiple elements; no state updates |

Two distinctions deserve a sentence each:

- **`useElementSize` respects the `box` option in the measured value.** With `{ box: 'border-box' }` it reports `borderBoxSize` — padding and border included — which is what you usually mean by "how big is this element". `useMeasure` always reports the content box regardless of which box triggers observation, because `contentRect` is all ResizeObserver entries expose rect-wise.
- **`useElementBounding` is the only one that tracks position on scroll.** It observes with ResizeObserver *and* listens to window `scroll` / `resize` (passive), recomputing `getBoundingClientRect()` on each. Heavier, but correct for anything anchored to screen position.

If you just need the viewport size, skip element observation entirely — that's [`useWindowSize`](https://reactuse.com/element/usewindowsize/).

## Patterns

### Container-Query-Style Responsive Component

Media queries respond to the viewport; components live in containers. A card in a wide main column and the same card in a narrow sidebar should lay out differently even on the same screen:

```tsx
function ProfileCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect] = useMeasure(ref);
  const compact = rect.width > 0 && rect.width < 320;

  return (
    <div ref={ref} className={compact ? 'card card--stacked' : 'card card--row'}>
      <Avatar />
      <Bio truncated={compact} />
    </div>
  );
}
```

The component adapts to the space it's *given*, wherever it's mounted. (CSS container queries cover the styling half of this; `useMeasure` covers the half where JavaScript needs the number — chart scales, virtualization math, conditional rendering.)

### Canvas / SVG That Fills Its Parent

Canvas and SVG need explicit pixel dimensions. Bind them to the measured parent and redraw on change:

```tsx
function Sparkline({ data }: { data: number[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect] = useMeasure(wrapRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rect.width === 0) return;
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    drawSparkline(canvas, data);
  }, [rect, data]);

  return (
    <div ref={wrapRef} className="sparkline-wrap">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

Every layout change — panel resize, sidebar collapse, orientation flip — re-renders the canvas at the correct resolution. No `window.resize` listener, which would miss the panel-resize and sidebar cases entirely.

### Auto-Height Animation (Measure, Then Animate)

CSS can't transition `height: auto`. Measure the content, animate to the number:

```tsx
function Collapsible({ open, children }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [rect] = useMeasure(innerRef);

  return (
    <div
      style={{
        height: open ? rect.height : 0,
        overflow: 'hidden',
        transition: 'height 200ms ease',
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
```

Because the measurement is live, the panel stays correct even if its content changes while open — an image finishes loading, a nested section expands. A one-shot `getBoundingClientRect()` snapshot would go stale the moment content shifted.

### Truncation Detection

Show a "read more" affordance only when text actually overflows:

```tsx
function Excerpt({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [rect] = useMeasure(ref);
  const truncated =
    ref.current != null && ref.current.scrollHeight > Math.ceil(rect.height);

  return (
    <>
      <p ref={ref} className="clamp-3">{text}</p>
      {truncated && <button>Read more</button>}
    </>
  );
}
```

`rect.height` is the visible (clamped) content height, `scrollHeight` the full content height; comparing them detects overflow — and keeps detecting it as the container resizes, which is exactly when truncation state flips.

## Coming from react-use-measure

If you've used [pmndrs' `react-use-measure`](https://github.com/pmndrs/react-use-measure), the mental model transfers directly — with a few differences:

```tsx
// react-use-measure — hook creates the ref for you
const [ref, bounds] = useMeasure();
<div ref={ref} />

// @reactuses/core — you own the ref (or pass an element/function)
const ref = useRef<HTMLDivElement>(null);
const [rect, stop] = useMeasure(ref);
<div ref={ref} />
```

- **Ref ownership**: `react-use-measure` returns a callback ref; `@reactuses/core` accepts *your* ref, a raw element, or a getter function. Owning the ref means you can share it with other hooks ([`useClickOutside`](https://reactuse.com/element/useclickoutside/), [`useHover`](https://reactuse.com/state/usehover/)) on the same element without ref-merging utilities.
- **Coordinates**: `react-use-measure` reports viewport-relative bounds (with an optional scroll option); `@reactuses/core`'s `useMeasure` reports `contentRect`. For viewport-relative-plus-scroll behavior, use [`useElementBounding`](https://reactuse.com/element/useelementbounding/) — that's the true equivalent.
- **Debounce**: `react-use-measure` takes a `debounce` option. Here you compose instead: pipe the rect through [`useDebounce`](https://reactuse.com/state/usedebounce/) if you need to throttle downstream work.
- **Stop switch**: only `@reactuses/core` gives you `stop` — a clean way to end observation after you've got what you came for.
- **One library, 100+ hooks**: you're pulling from a full [collection](https://reactuse.com) rather than adding a single-purpose dependency.

## Takeaways

- **[`useMeasure`](https://reactuse.com/element/usemeasure/) gives you a live element rect with one line** — ResizeObserver underneath, zero observer bookkeeping, automatic cleanup.
- **It measures the content box, element-relative.** `top`/`left` are padding offsets, not page position. For viewport coordinates and scroll tracking, use [`useElementBounding`](https://reactuse.com/element/useelementbounding/); for border-box sizes, [`useElementSize`](https://reactuse.com/element/useelementsize/) with `{ box: 'border-box' }`.
- **The first render is all zeros** — on the server and before the first observation. Guard `rect.width > 0` where zero breaks your math.
- **Inline callbacks and fresh options objects are safe** — `useLatest` and `useDeepCompareEffect` inside prevent observer churn.
- **`stop` ends observation on demand** — measure once for an animation, then stop paying for re-renders.
- **SSR-safe by construction** — the observer is created in an effect, which never runs on the server.

Grab it from [`@reactuses/core`](https://reactuse.com/element/usemeasure/) and stop hand-rolling ResizeObserver wiring.
