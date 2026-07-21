---
title: "React useResizeObserver Hook: Track Element Size Changes (2026)"
description: "A practical guide to useResizeObserver in React: observe any element with the native ResizeObserver API — ref, element, or getter targets, automatic cleanup, the box option explained — plus useElementSize and useMeasure for when you just want the numbers. SSR-safe, TypeScript-first."
slug: react-useresizeobserver-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-21
tags: [react, hooks, browser-api, typescript, tutorial]
keywords: [react useResizeObserver, useResizeObserver hook, useresizeobserver react, resize observer react, ResizeObserver react hook, react element size hook, useElementSize, useMeasure react, react-use-measure alternative, react measure element, observe element resize react, react container width hook, useResizeObserver typescript]
image: /img/og.png
---

# React useResizeObserver Hook: Track Element Size Changes (2026)

A chart component reads its container's width once on mount and draws itself to fit. Then the user collapses the sidebar. The container just gained 300 pixels, the window never resized, no `resize` event fired — and the chart is now sitting in a too-wide box, drawn for a layout that no longer exists. Listening to `window.resize` misses every way an element can change size *without* the window changing: a sidebar toggling, a flex sibling appearing, content loading in above, an accordion expanding.

The browser's answer is [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) — a native API that watches an element, not the window. `useResizeObserver` from [`@reactuses/core`](https://reactuse.com) wraps it with the lifecycle handled: observe on mount, disconnect on unmount, no stale observers left behind. Everything below is the real API, TypeScript-first.

<!-- truncate -->

## The Manual Version, and Where It Frays

Wiring `ResizeObserver` into a component by hand looks simple enough:

```tsx
function Chart() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      redraw(entries[0].contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} />;
}
```

This works — until it meets real component code. The common ways it frays:

- **The callback needs props or state.** The empty dependency array means the observer keeps calling the callback from the first render. Add the dependencies and the observer is torn down and re-created on every change instead. Neither is what you want.
- **The options object re-triggers the effect.** Put `{ box: 'border-box' }` inline in the dependency array and it's a new object every render — the observer disconnects and reconnects continuously.
- **The target isn't a ref.** Sometimes the element comes from a callback, a portal, or `document.querySelector`. The effect-plus-ref pattern needs rewiring for each shape.

None of these are hard individually. But this is lifecycle plumbing you'd be re-deriving in every component that cares about its own size — and each copy is one refactor away from a leak or an observe/disconnect loop.

## useResizeObserver — The Native API, Lifecycle Handled

```tsx
import { useResizeObserver } from '@reactuses/core';
import { useRef } from 'react';

function Chart() {
  const ref = useRef<HTMLDivElement>(null);

  useResizeObserver(ref, (entries) => {
    redraw(entries[0].contentRect.width);
  });

  return <div ref={ref} />;
}
```

The signature:

```ts
function useResizeObserver(
  target: BasicTarget<Element>,
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions
): () => void;
```

Three things worth noting, because they're where the hand-rolled version frays:

- **The target is flexible.** `BasicTarget` accepts a ref object, a plain `Element`, or a getter function returning one — so the same hook covers the ref case, the `querySelector` case, and the "element isn't mounted yet" case (`null`/`undefined` targets are simply not observed until they exist).
- **The callback is the native `ResizeObserverCallback`.** You get the real `ResizeObserverEntry[]` — `contentRect`, `borderBoxSize`, `contentBoxSize` — not a simplified wrapper. And changing the callback between renders doesn't tear down and re-attach the observer; the hook keeps one observer per target instead of cycling it on every render.
- **Options are deep-compared.** Passing `{ box: 'border-box' }` inline is fine — the hook compares by value, not identity, so a fresh object literal each render doesn't churn the observer.

The return value is a `stop()` function: call it to disconnect early — say, once a measurement has been taken and you no longer care. Otherwise cleanup happens automatically on unmount.

## The `box` Option

`ResizeObserverOptions` has one field, `box`, and it decides what "size" means:

| `box` value | What's measured |
| --- | --- |
| `'content-box'` (default) | Content only — excludes padding and border |
| `'border-box'` | Content + padding + border — what the element occupies in layout |
| `'device-pixel-content-box'` | Content box in physical device pixels — for pixel-perfect canvas work |

For most layout logic, the default is right. Reach for `'border-box'` when you're matching the element's footprint in the layout, and `'device-pixel-content-box'` when sizing a `<canvas>` backing store so it stays crisp on high-DPI screens.

## Just Want the Numbers? useElementSize and useMeasure

`useResizeObserver` hands you raw observer entries, which is what you want for imperative work — redrawing a chart, syncing a canvas. But often the goal is simply *reactive size as state*. Two hooks in [`@reactuses/core`](https://reactuse.com) are built directly on top of `useResizeObserver` for exactly that:

[`useElementSize`](https://reactuse.com/element/useelementsize/) — width and height as a tuple:

```tsx
import { useElementSize } from '@reactuses/core';

function Card() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, height] = useElementSize(ref);

  return (
    <div ref={ref}>
      {width}px × {height}px
    </div>
  );
}
```

It respects the same `box` option (and correctly sums fragmented boxes via `borderBoxSize`/`contentBoxSize`), starting at `[0, 0]` until the first measurement lands.

[`useMeasure`](https://reactuse.com/element/usemeasure/) — the full content rect, when you need more than width and height:

```tsx
import { useMeasure } from '@reactuses/core';

function Panel() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, stop] = useMeasure(ref);
  // rect: { x, y, width, height, top, left, bottom, right }

  return <div ref={ref}>{rect.width}px wide</div>;
}
```

If you've used the standalone `react-use-measure` package, this is the same idea — one dependency fewer if you're already on `@reactuses/core`.

## Picking the Right Size Hook

The element category has several hooks that sound alike; they answer different questions:

| Hook | Answers | Updates on |
| --- | --- | --- |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | "Run this code when the element resizes" | Element resize (raw entries) |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | "How big is this element?" | Element resize |
| [`useMeasure`](https://reactuse.com/element/usemeasure/) | "What's this element's content rect?" | Element resize |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | "Where is this element in the viewport?" | Element resize **and** window scroll/resize |
| [`useWindowSize`](https://reactuse.com/element/usewindowsize/) | "How big is the window?" | Window resize |

The one distinction that trips people up: `useMeasure` reports the observer's content rect (size-driven), while [`useElementBounding`](https://reactuse.com/element/useelementbounding/) reports `getBoundingClientRect()` — viewport-relative position — and also refreshes on scroll. Positioning a tooltip or overlay? `useElementBounding`. Responding to size? `useElementSize` or `useMeasure`. The broader observer family — intersection, mutation, resize — is compared in [React Observer Hooks](https://reactuse.com/blog/react-observer-hooks/).

## Real Use Cases

- **Container-driven responsive components.** A component that switches layout based on *its own* width — not the viewport's — works correctly in a sidebar, a modal, or a split pane. This is the container-query mindset, available as plain state.
- **Charts and canvas.** Redraw exactly when the drawing surface changes, including sidebar toggles and flex reflows that `window.resize` never sees. Pair with `'device-pixel-content-box'` for crisp high-DPI canvases.
- **Virtualized lists.** Row measurement for variable-height virtualization: observe each row, feed real heights back to the virtualizer.
- **Auto-growing textareas and clamped text.** Detect when content overflows its box and toggle "show more" affordances based on measured, not assumed, size.
- **Element-size media queries.** Swap a toolbar from icons+labels to icons-only the moment its container gets tight, regardless of what the window is doing.

## SSR-Safe by Construction

`ResizeObserver` doesn't exist on the server. All three hooks only touch it inside effects, and target resolution is guarded — during server rendering nothing runs, `useElementSize` returns `[0, 0]`, `useMeasure` returns a zeroed rect, and hydration proceeds without a `ReferenceError`. No `typeof window` checks in your code. If you're auditing hand-rolled browser-API code for the same gap, [SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) covers the pattern.

## Takeaways

- **`window.resize` misses most element resizes** — sidebar toggles, flex reflows, content changes. `ResizeObserver` watches the element itself, and `useResizeObserver` handles its lifecycle: observe on mount, disconnect on unmount, plus a `stop()` for early exit.
- **The target is flexible** — ref, element, or getter — and null targets are handled, so mount-order gymnastics disappear.
- **Callback and options don't churn the observer.** Inline callbacks and inline options objects are fine; the hook keeps one observer per target.
- **`box` decides what "size" means** — `content-box` by default, `border-box` for layout footprint, `device-pixel-content-box` for canvas work.
- **Want state instead of entries?** [`useElementSize`](https://reactuse.com/element/useelementsize/) for `[width, height]`, [`useMeasure`](https://reactuse.com/element/usemeasure/) for the full rect, [`useElementBounding`](https://reactuse.com/element/useelementbounding/) when viewport position matters too.
- **SSR-safe** — no observer construction on the server, no guards in your code.

Grab it from [`@reactuses/core`](https://reactuse.com/element/useresizeobserver/) and let your components respond to the size they actually have.
