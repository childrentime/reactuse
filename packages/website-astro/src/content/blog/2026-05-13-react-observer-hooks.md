---
title: "React Observer Hooks: 7 Ways to Watch the DOM Without the Boilerplate"
description: "A practical tour of useIntersectionObserver, useMutationObserver, useResizeObserver, useElementBounding, useElementSize, useElementVisibility, and useMeasure from ReactUse — when to reach for which observer, what they cost, and how they replace dozens of lines of imperative DOM glue."
slug: react-observer-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-13
tags: [react, hooks, dom, performance, tutorial]
keywords: [react observer hooks, useIntersectionObserver, useResizeObserver, useMutationObserver, useElementBounding, useElementSize, useElementVisibility, useMeasure, react dom observer, react lazy load, react sticky header, react virtual scroll]
image: /img/og.png
---

# React Observer Hooks: 7 Ways to Watch the DOM Without the Boilerplate

The DOM does not tell React when it changes. React owns one direction of the data flow — state goes in, markup comes out — and is mostly blind on the way back. If a third-party script injects a banner, if a font finishes loading and shoves the layout down 8 pixels, if a user resizes the window or scrolls a card into view, React has no idea unless you tell it. The browser ships four `*Observer` APIs to plug that gap, plus the `getBoundingClientRect` family for one-shot reads, and together they cover almost every "react to the DOM" requirement a real app has.

<!-- truncate -->

The trouble is that wiring observers into a React component is a small swamp of `useEffect`, `useRef`, cleanup functions, SSR guards, and the dreaded "observer fires before mount" race. Five lines of API turn into thirty lines of glue, and the glue is identical between components — so it gets copy-pasted, slightly mutated each time, and quietly accrues bugs. [ReactUse](https://reactuse.com) ships seven focused hooks that hide the glue and give you back the API surface you actually wanted.

This post walks through all seven: what each observes, when to pick which, and what you would have written by hand if you had not picked them up.

## 1. useIntersectionObserver — "Is this element on screen?"

`IntersectionObserver` is the workhorse of modern lazy-loading. It reports when a target element crosses a threshold relative to the viewport (or a scroll container), without any of the `scroll` listener thrashing that the same job used to require. Lazy images, infinite scroll triggers, "viewed" tracking for analytics, fade-in on enter — all built on top of it.

### The Manual Way

```tsx
import { useEffect, useRef, useState } from "react";

function ManualOnScreen({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true);
      },
      { rootMargin: "0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{seen ? children : null}</div>;
}
```

This works, and the moment you need a second lazy section you copy it. By component number five you have five subtly different observers, three of them with the wrong `threshold`, one of them leaking because somebody refactored the cleanup. The shape is right; the repetition is not.

### The ReactUse Way

[`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) takes the ref and the options, and returns whether the element is currently intersecting:

```tsx
import { useRef } from "react";
import { useIntersectionObserver } from "@reactuses/core";

function OnScreen({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, {
    threshold: 0.1,
  });

  return <div ref={ref}>{isVisible ? children : null}</div>;
}
```

The hook owns the observer's lifecycle: it disconnects on unmount, recreates the observer when the options change, and is SSR-safe. Lazy-load an image, fire an analytics event the first time a card enters the viewport, or defer mounting a heavy chart until it scrolls in — same hook, different boolean.

A common pattern is the "load more" trigger for infinite scroll: place a sentinel `<div>` at the bottom of a list and fire the fetch when it becomes visible. That is essentially the implementation of [`useInfiniteScroll`](https://reactuse.com/browser/useInfiniteScroll/), which builds on this primitive.

## 2. useElementVisibility — The Boolean You Usually Want

A surprising amount of the time you do not care about `IntersectionObserverEntry` at all — you just want a boolean, and you want it for the whole viewport, not a scroll container. [`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) is exactly that.

```tsx
import { useRef } from "react";
import { useElementVisibility } from "@reactuses/core";

function FadeInOnView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useElementVisibility(ref);

  return (
    <div
      ref={ref}
      className={`fade ${visible ? "fade-in" : ""}`}
    >
      {children}
    </div>
  );
}
```

Use it for fade-in-on-scroll, "viewed" telemetry, and "pause this video when it scrolls off-screen" patterns. When you need finer control — a custom root, a threshold below 1, multiple thresholds — drop down to `useIntersectionObserver`.

## 3. useResizeObserver — The Right Way to Track Size

For about a decade, "track an element's size in React" meant attaching a `window.resize` listener and re-reading `clientWidth` on every event. That misses the most common case — the element resizing because its parent did, or because a sibling collapsed, or because a flex item below it grew. `ResizeObserver` fires on any size change to the observed element, regardless of cause.

### The Manual Way

```tsx
import { useEffect, useRef, useState } from "react";

function ManualSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ width: cr.width, height: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {size.width.toFixed(0)} × {size.height.toFixed(0)}
    </div>
  );
}
```

The hidden cost: every entry update calls `setState`, which schedules a render. Resize a parent quickly and the observed component re-renders 60 times a second. Most of the time you can live with this, but if the state is consumed by an expensive subtree you need to either throttle the updates or push them into a ref instead.

### The ReactUse Way

[`useResizeObserver`](https://reactuse.com/element/useResizeObserver/) accepts the ref and a callback that fires on each entry:

```tsx
import { useRef, useState } from "react";
import { useResizeObserver } from "@reactuses/core";

function ResponsiveCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<"narrow" | "wide">("narrow");

  useResizeObserver(ref, ([entry]) => {
    setVariant(entry.contentRect.width > 600 ? "wide" : "narrow");
  });

  return <div ref={ref} data-variant={variant}>…</div>;
}
```

This is the container-query pattern in fifteen lines: the card swaps between a narrow and a wide layout based on its own width, not the viewport's. Place two of them in a flex row and they each pick their own layout independently.

## 4. useElementSize and useMeasure — Size in Two Flavors

If you only need width and height, the callback form is overkill. ReactUse ships two convenience hooks that wrap `ResizeObserver` and return state directly.

[`useElementSize`](https://reactuse.com/element/useElementSize/) returns `{ width, height }` for the observed element:

```tsx
import { useRef } from "react";
import { useElementSize } from "@reactuses/core";

function AutoFitGrid({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(ref);
  const columns = Math.max(1, Math.floor(width / 240));

  return (
    <div
      ref={ref}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
      }}
    >
      {items.map((it) => <Card key={it.id} item={it} />)}
    </div>
  );
}
```

The grid recomputes its column count whenever the container resizes — no media queries, no viewport guess, no JavaScript-controlled CSS variables.

[`useMeasure`](https://reactuse.com/element/useMeasure/) returns the full `ResizeObserverEntry.contentRect` (`width`, `height`, `top`, `left`, etc.) plus a ref to attach. Use it when you want size and the local coordinates in one call:

```tsx
import { useMeasure } from "@reactuses/core";

function TooltipAnchor() {
  const [ref, rect] = useMeasure<HTMLButtonElement>();
  return (
    <>
      <button ref={ref}>Hover me</button>
      <Tooltip x={rect.left + rect.width / 2} y={rect.top} />
    </>
  );
}
```

The split between `useElementSize` and `useMeasure` is mostly ergonomic — pick whichever returns the shape your component already wants to consume.

## 5. useElementBounding — Position Plus Size, Synced

`useElementBounding` is the reactive equivalent of calling `el.getBoundingClientRect()` on every scroll and resize. It returns `top`, `right`, `bottom`, `left`, `width`, `height`, `x`, `y` — the full rect — and re-fires when the element moves or resizes for any reason.

```tsx
import { useRef } from "react";
import { useElementBounding } from "@reactuses/core";

function StickyShadow() {
  const ref = useRef<HTMLDivElement>(null);
  const { top } = useElementBounding(ref);
  const stuck = top <= 0;

  return (
    <header
      ref={ref}
      className={stuck ? "header header--stuck" : "header"}
    >
      …
    </header>
  );
}
```

When a `position: sticky` header reaches the top of the viewport, its `top` becomes 0; the hook picks that up and the header gets a shadow. The same pattern works for floating action buttons that should change appearance once they leave their initial position, or popovers that need to track an anchor through layout changes.

The difference between `useElementBounding` and `useMeasure`: bounding is the viewport-relative rect (it changes on scroll), measure is the element's intrinsic content rect (it does not). Pick bounding when you care about position, measure when you care about size.

## 6. useMutationObserver — When the DOM Changes Around You

`MutationObserver` is the heaviest of the four observer APIs, and the one with the narrowest legitimate use case. It fires when attributes, child nodes, or text content change on a target. In a React-first app you almost never need it — React owns the mutations, so React knows them. You reach for `useMutationObserver` when something *outside* React is mutating the DOM:

- A third-party widget (Stripe Elements, an embedded video player, a chat bubble) injects content into a slot.
- A `contentEditable` element is being edited by the user, and you want to react to text changes without polling.
- A scripts toggles `aria-expanded` or `data-state` on an element you do not control, and you want to mirror it into React state.

```tsx
import { useRef, useState } from "react";
import { useMutationObserver } from "@reactuses/core";

function ThirdPartyMount({ slot }: { slot: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useMutationObserver(
    ref,
    (mutations) => {
      const injected = mutations.some(
        (m) => m.type === "childList" && m.addedNodes.length > 0,
      );
      if (injected) setReady(true);
    },
    { childList: true, subtree: true },
  );

  return (
    <div ref={ref} data-third-party={slot}>
      {!ready && <Skeleton />}
    </div>
  );
}
```

The skeleton renders until the third-party script drops its content into the slot, then disappears. Without `MutationObserver`, your options were `setInterval` polling or `MutationObserver` plus a hand-rolled lifecycle — the former is wasteful, the latter is exactly what this hook saves you from.

A common pitfall: `MutationObserver` is fast but not free, and an unscoped subtree watcher on a busy element can fire dozens of times per second. Always pass the narrowest options object you can — if you only care about `childList`, do not pass `attributes: true`.

## 7. Choosing Between Them

The seven hooks overlap, and the overlap is intentional — different shapes work for different consumers. The cheat sheet:

| You want… | Hook |
| --- | --- |
| A boolean for "is this on screen?" | [`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) |
| Visibility with a custom root or threshold | [`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) |
| Width and height as state | [`useElementSize`](https://reactuse.com/element/useElementSize/) |
| The full content rect as state | [`useMeasure`](https://reactuse.com/element/useMeasure/) |
| The viewport-relative rect (changes on scroll) | [`useElementBounding`](https://reactuse.com/element/useElementBounding/) |
| A callback on every resize entry | [`useResizeObserver`](https://reactuse.com/element/useResizeObserver/) |
| To react to DOM changes from outside React | [`useMutationObserver`](https://reactuse.com/element/useMutationObserver/) |

A useful mental model: visibility hooks tell you *where* an element is relative to the user; size and bounding hooks tell you *how big* it is and *where* in the layout; mutation tells you *what* changed inside it.

## A Worked Example: A Self-Sizing Lazy Card

Putting four of them together — a card that lazy-mounts its expensive chart only after it scrolls in, picks a layout based on its own width, and positions a tooltip relative to itself:

```tsx
import { useRef, useState } from "react";
import {
  useElementVisibility,
  useElementSize,
  useElementBounding,
} from "@reactuses/core";

function LazyChartCard({ data }: { data: ChartData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const visible = useElementVisibility(cardRef);
  const { width } = useElementSize(cardRef);
  const { top, left } = useElementBounding(cardRef);

  const [hovered, setHovered] = useState(false);
  const layout = width > 600 ? "horizontal" : "vertical";

  return (
    <>
      <div
        ref={cardRef}
        data-layout={layout}
        className="card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {visible ? <Chart data={data} /> : <Skeleton />}
      </div>
      {hovered && (
        <Tooltip
          x={left + width / 2}
          y={top - 8}
          text={`${data.label}: ${data.value}`}
        />
      )}
    </>
  );
}
```

The chart only constructs once it enters the viewport. The card flips its layout based on its own width, not the page's. The tooltip floats above the card by tracking its bounding rect, so it stays anchored through scrolls and layout shifts. Three hooks, twenty lines of glue, zero `useEffect` blocks, zero `addEventListener`/`removeEventListener` pairs.

## Performance Notes

Observers are not free, but the cost is concentrated and well-understood:

- **One observer per element is fine; one per row of a thousand-row list is not.** For list virtualization, observe the scroll container once and resolve which row is visible inside the callback. The browser will sometimes coalesce many `IntersectionObserver` targets, but a long list with per-row observers still hurts.
- **`useResizeObserver` callbacks run on a separate task.** Reading layout (`getBoundingClientRect`, `offsetWidth`) inside the callback is cheap; writing layout is also fine, with the catch that the write can trigger another resize entry. Guard against feedback loops by debouncing or by writing into a `requestAnimationFrame`.
- **`MutationObserver` is the most expensive of the four**, especially with `subtree: true`. Scope it as narrowly as possible. If you find yourself watching a large subtree, consider whether a single explicit "third-party-ready" event from the embedded code would be cheaper.

## Summary

The observer APIs are the bridge between "what React knows" and "what the DOM actually does." Wired with raw `useEffect` they accumulate a lot of glue and a long tail of subtle bugs. Wired with these seven hooks they become one-liners that compose freely.

- Use [`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) and [`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) for "is this on screen."
- Use [`useResizeObserver`](https://reactuse.com/element/useResizeObserver/), [`useElementSize`](https://reactuse.com/element/useElementSize/), and [`useMeasure`](https://reactuse.com/element/useMeasure/) for "how big is this."
- Use [`useElementBounding`](https://reactuse.com/element/useElementBounding/) for "where is this in the viewport."
- Use [`useMutationObserver`](https://reactuse.com/element/useMutationObserver/) for "what did the DOM do behind my back."

Browse the rest at [reactuse.com](https://reactuse.com) — and if you replace a chunky `useEffect`-plus-observer dance with one of these, that is a good day at the keyboard.
