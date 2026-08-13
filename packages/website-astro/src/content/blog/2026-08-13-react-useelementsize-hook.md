---
title: "React useElementSize Hook: Track Element Width & Height with ResizeObserver (2026)"
description: "A practical guide to measuring DOM elements in React with useElementSize: live width and height from a ResizeObserver as plain state — no manual observers, no cleanup bugs. Covers the box option (content-box vs border-box vs device-pixel-content-box for crisp canvases), container-query-style components, responsive charts, and when to reach for useMeasure, useElementBounding, or CSS container queries instead. TypeScript-first, SSR-safe."
slug: react-useelementsize-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-13
tags: [react, hooks, element, typescript, tutorial]
keywords: [useelementsize, react useelementsize, useElementSize hook, react element size hook, measure element react, resizeobserver react hook, react resize observer, element width height react, react container query hook, responsive component react, react measure div, use-resize-observer, react chart resize, device-pixel-content-box, react canvas resize]
image: /img/og.png
---

# React useElementSize Hook: Track Element Width & Height with ResizeObserver (2026)

Media queries answer one question: *how big is the viewport?* But your components don't live in the viewport — they live in columns, cards, panels, and grid tracks. The same `<ProductCard>` is 900px wide in a full-width main column and 320px wide next to an open sidebar, on the *same screen*. And an element's size changes for a dozen reasons that never fire a window `resize` event: a sidebar collapses, an accordion expands, a font finishes loading, a flex sibling appears, content streams in.

Tracking any of that means `ResizeObserver` — the browser API built for exactly this — wrapped in the usual React ceremony of refs, effects, and cleanup. [`useElementSize`](https://reactuse.com/element/useelementsize/) from [`@reactuses/core`](https://reactuse.com) reduces the whole thing to two numbers your component just renders: `[width, height]`, live, for any element.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useRef } from "react";
import { useElementSize } from "@reactuses/core";

function ChartCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, height] = useElementSize(ref);

  return (
    <div ref={ref} className="chart-card">
      <Chart width={width} height={height} />
    </div>
  );
}
```

That's the entire integration. The hook attaches a `ResizeObserver` on mount, and because `ResizeObserver` reports once immediately on `observe()`, `width` and `height` populate right after first paint without a separate "measure on mount" pass. Every subsequent size change — window resize, sidebar toggle, content reflow — updates the state. Unmount cleans up the observer. No refs to observers, no `disconnect()` to forget.

## Why Not window.innerWidth or a Media Query?

Because most element resizes have nothing to do with the window:

- A collapsible sidebar opens and your main column loses 280px — viewport unchanged.
- A user drags a split-pane divider.
- An `<img>` above your element finishes loading and pushes everything down and reflows the column.
- A filter empties a flex row and the survivors stretch.
- A CSS transition animates a panel's width over 300ms.

Window-level tools are blind to all of it. [`useWindowSize`](https://reactuse.com/element/usewindowsize/) and [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) are the right calls for *page-level* layout decisions — but a component that keys its layout on viewport width breaks the first time someone renders it in a narrow column on a wide screen.

CSS container queries deserve a mention here: if your response to size is *pure styling*, `@container` handles it with zero JavaScript and zero re-renders — use that. The hook earns its place the moment you need the number **in JS**: chart dimensions, canvas backing stores, virtualization math, or rendering a genuinely different component tree.

## The Manual Way — and Where It Bites

Hand-rolling looks short enough:

```tsx
// ⚠️ hand-rolled — works in the demo, leaks bugs in the app
function ChartCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return <div ref={ref}>…</div>;
}
```

Three problems hiding in ten lines:

1. **Late-mounting targets never get observed.** That `if (!ref.current) return` guard runs once, on mount. If the element renders conditionally — behind a loading state, a tab, a modal — the effect already returned and nothing ever attaches. You need the effect to re-run when the *element* appears, which an empty dependency array can't express.
2. **The options-identity trap.** Want `{ box: "border-box" }`? That object literal is new every render. Put it in the effect's dependency array and you tear down and recreate the observer on every render; leave it out and the lint rule yells or a later edit silently stales it.
3. **You read the wrong box.** `contentRect` is the legacy field, kept for compatibility. The modern fields — `borderBoxSize`, `contentBoxSize`, `devicePixelContentBoxSize` — are *arrays* (elements can fragment across columns), and picking and summing the right one is more code than the observer itself.

`useElementSize` absorbs all three: for conditionally rendered elements you pass a lazy getter (`() => document.querySelector(".panel")`) and the hook re-resolves it every render, attaching the moment the element exists; options are deep-compared (inline literals are fine); and box selection — including fragment summation — is handled per spec.

## The useElementSize API

```tsx
const [width, height] = useElementSize(target, options?);
```

**`target`** is flexible — pass whichever you have:

```tsx
useElementSize(ref);                                    // a ref object
useElementSize(document.getElementById("hero"));        // an element
useElementSize(() => document.querySelector(".panel")); // a lazy getter
```

**`options`** is a standard `ResizeObserverOptions` — one field, `box`, three values. And because the hook deep-compares options internally, `useElementSize(ref, { box: "border-box" })` with an inline literal does *not* churn the observer every render.

### Which box should you measure?

- **`content-box`** (default) — the content area only: padding and border excluded. This is "how much room does my *content* have," the right box for laying out children, charts, and column math.
- **`border-box`** — padding and border included; matches `offsetWidth`/`offsetHeight` and how much space the element occupies in layout. Reach for it when coordinating with siblings or overlays.
- **`device-pixel-content-box`** — the content box in **physical device pixels**. This one is special.

### The crisp-canvas trick

A `<canvas>` whose backing store doesn't match its physical pixel size renders blurry on 2× displays. The folk fix — multiply CSS pixels by `devicePixelRatio` — rounds wrong under browser zoom and fractional DPR. `device-pixel-content-box` hands you the exact integer the compositor uses:

```tsx
function SharpCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [width, height] = useElementSize(ref, {
    box: "device-pixel-content-box",
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !width) return;
    canvas.width = width;   // physical pixels — pixel-perfect at any DPR or zoom
    canvas.height = height;
    draw(canvas.getContext("2d")!);
  }, [width, height]);

  return <canvas ref={ref} style={{ width: "100%", height: 300 }} />;
}
```

(Safari doesn't support `device-pixel-content-box` yet — the hook falls back to `contentRect` there, so degrade gracefully rather than assuming physical pixels everywhere.)

## Real Patterns

### Container-query components — breakpoints on the element, not the screen

```tsx
function ProductCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [width] = useElementSize(ref);

  const layout =
    width >= 640 ? "horizontal" : width >= 320 ? "compact" : "stacked";

  return (
    <article ref={ref} data-layout={layout}>
      {layout === "horizontal" ? <SideBySide /> : <Stacked />}
    </article>
  );
}
```

Drop this card in a sidebar, a modal, or a full-width list and it adapts to *its own* space — no prop-drilling a `variant` from whoever happens to know the context. Again: if the difference were only CSS, `@container` does this cheaper. This pattern is for when the *component tree* changes.

### Responsive charts that re-layout at rest

Chart libraries want pixel numbers, and re-computing a chart layout 60 times a second while the user drags a splitter is wasted work. Let CSS stretch the canvas visually and settle the real re-layout with [`useDebounce`](https://reactuse.com/state/usedebounce/):

```tsx
const ref = useRef<HTMLDivElement>(null);
const [rawWidth, rawHeight] = useElementSize(ref);
const width = useDebounce(rawWidth, 150);
const height = useDebounce(rawHeight, 150);

// <ExpensiveChart width={width} height={height} /> re-lays-out
// once the drag stops, not on every frame of it.
```

### How many columns fit?

Grid math that CSS can't do — because the answer feeds `props`, not styles:

```tsx
const [width] = useElementSize(ref);
const columns = Math.max(1, Math.floor(width / 280));

return <VirtualGrid columns={columns} items={items} />;
```

## useElementSize vs Its Siblings

`@reactuses/core` ships a small family of measurement hooks built on the same observer core — pick by what you need back:

| Hook | Returns | Reach for it when |
| --- | --- | --- |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | `[width, height]` | you need dimensions, nothing else |
| [`useMeasure`](https://reactuse.com/element/usemeasure/) | full `contentRect` (`x/y/top/left/…`) + a `stop()` | you want the whole rect, or to stop observing on demand |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | live `getBoundingClientRect` — updates on scroll *and* resize | you need *where it is* in the viewport, not just how big |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | your callback gets raw entries | side effects instead of state; imperative work per resize |
| [`useWindowSize`](https://reactuse.com/element/usewindowsize/) | viewport `width/height` | page-level layout, not element-level |

The rule of thumb: `useElementSize` for dimensions, [`useElementBounding`](https://reactuse.com/element/useelementbounding/) for position (tooltips, popovers, scroll-linked effects), [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) when you'd rather run code than store state.

## Production Notes

- **SSR is handled.** There's no DOM on the server, so the hook renders `[0, 0]` and attaches the observer after hydration — no `typeof window` guards in your code. Plan for the zero-frame: gate expensive children with `if (!width) return <Skeleton />` rather than letting a chart lay out at 0×0.
- **The first real value arrives via the observer's initial report** — one extra render right after mount. That's the cost of correctness; don't fight it.
- **Beware self-referential loops.** If the content you render *from* the measured width changes the element's own width, you've built a resize feedback loop (`ResizeObserver loop completed with undelivered notifications` in the console). Fix it by measuring a parent whose size you don't alter, or clamping the derived values.
- **Fragmented layouts are summed correctly.** In multi-column or paginated contexts an element's box can fragment; the hook sums `inlineSize`/`blockSize` across fragments per spec instead of reading only the first one.
- **Every hook call is one observer.** Measuring 500 virtualized rows individually means 500 observers — at that scale, drop down to a single [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) on the container, or observe one prototype row.

## Takeaways

- Element size ≠ window size. Sidebars, split panes, streaming content, and font loads all resize elements without touching the viewport — only a `ResizeObserver` sees them, and [`useElementSize`](https://reactuse.com/element/useelementsize/) serves it as plain `[width, height]` state.
- The `box` option picks what you measure: `content-box` for content math (default), `border-box` for layout footprint, `device-pixel-content-box` for pixel-perfect canvases at any DPR or zoom.
- Targets can be refs, elements, or lazy getters — use a getter for conditionally rendered elements; inline options don't churn the observer thanks to deep comparison — the bugs every hand-rolled version has, pre-fixed.
- Pure-CSS response to size? Use `@container` queries. The hook is for when the number drives JavaScript: charts, canvas, virtualization, or swapping component trees.
- Need position too? That's [`useElementBounding`](https://reactuse.com/element/useelementbounding/). The full rect plus manual stop? [`useMeasure`](https://reactuse.com/element/usemeasure/). Raw entries? [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/).

`useElementSize` and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
