---
title: "How to Get Window Size in React (The Right Way)"
description: "Learn the right way to detect window and screen size in React. Compare manual resize listeners with the useWindowSize hook for clean, SSR-safe responsive components."
slug: react-window-size-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, responsive, useWindowSize]
keywords: [react window size, useWindowSize, react screen size, react responsive hook, react resize]
image: /img/og.png
---

# How to Get Window Size in React (The Right Way)

Responsive design doesn't stop at CSS. Sooner or later, you need the actual window width or height inside your React component — to conditionally render a sidebar, swap a chart library between mobile and desktop, or calculate a dynamic layout. Getting that value correctly, especially with server-side rendering in the mix, is trickier than it looks.

<!-- truncate -->

## Why You Need Window Size in JavaScript

CSS media queries cover many responsive scenarios, but some things require JavaScript:

- **Conditionally rendering components** — showing a hamburger menu on mobile while rendering a full navigation bar on desktop.
- **Canvas and chart sizing** — libraries like D3, Chart.js, and Three.js need explicit pixel dimensions.
- **Virtual lists** — react-window and react-virtualized need the container height to calculate how many rows to render.
- **Dynamic calculations** — positioning tooltips, resizing drag handles, or computing aspect ratios.

In all these cases you need a live, reactive value for `window.innerWidth` and `window.innerHeight`.

## The Manual Approach with a Resize Listener

The most common DIY solution looks like this:

```tsx
import { useEffect, useState } from "react";

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}
```

This works for a simple client-only app, but it has real problems once your project grows.

## SSR Pitfalls: window Is Not Defined

If you use Next.js, Remix, Astro, or any framework that renders on the server, the code above will crash:

> **ReferenceError: window is not defined**

The server has no browser window, so any direct access to `window` during render is an error. Common workarounds include wrapping everything in `typeof window !== "undefined"` checks or initializing state to `0`. But then you face **hydration mismatches**: the server renders with width `0`, the client renders with width `1440`, and React warns that the HTML doesn't match.

Handling this correctly requires careful coordination between the server snapshot and the client snapshot — exactly what React's `useSyncExternalStore` was designed for.

## The Clean Solution: useWindowSize from ReactUse

[ReactUse](https://reactuse.com) provides a `useWindowSize` hook that handles all of these details for you. It uses `useSyncExternalStore` under the hood, which means it is **concurrent-mode safe** and **SSR-compatible** out of the box.

```tsx
import { useWindowSize } from "@reactuses/core";

function Dashboard() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>Window: {width} x {height}</p>
      {width < 768 ? <MobileNav /> : <DesktopNav />}
    </div>
  );
}
```

The hook returns a reactive object with `width` and `height` properties. It subscribes to the browser `resize` event, cleans up on unmount, and avoids unnecessary re-renders through referential equality checks. On the server it returns safe initial values, eliminating hydration warnings.

### Dependency Tracking

One subtle feature of the ReactUse implementation is **dependency tracking**. If your component only reads `width`, the hook tracks that and skips re-renders when only `height` changes — and vice versa. This gives you fine-grained performance without any extra configuration.

## Building Responsive Components

Here is a practical example: a responsive grid that switches between column counts based on window width.

```tsx
import { useWindowSize } from "@reactuses/core";

function ResponsiveGrid({ items }: { items: string[] }) {
  const { width } = useWindowSize();

  const columns = width >= 1200 ? 4 : width >= 768 ? 2 : 1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
      {items.map((item) => (
        <div key={item} style={{ padding: 16, background: "#f0f0f0" }}>
          {item}
        </div>
      ))}
    </div>
  );
}
```

Because `useWindowSize` only triggers re-renders when the values you read actually change, this pattern stays performant even on rapid resize.

## Combining with useMediaQuery

For scenarios where you care about breakpoints rather than exact pixel values, combine `useWindowSize` with `useMediaQuery`:

```tsx
import { useMediaQuery } from "@reactuses/core";

function AdaptiveLayout() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  if (isMobile) return <MobileLayout />;
  if (isTablet) return <TabletLayout />;
  return <DesktopLayout />;
}
```

Use `useMediaQuery` when you only need boolean breakpoint flags. Use `useWindowSize` when you need the actual numeric dimensions for calculations. Together they cover virtually every responsive use case in React.

## Installation

```bash
npm i @reactuses/core
```

Or with your preferred package manager:

```bash
pnpm add @reactuses/core
# or
yarn add @reactuses/core
```

## Related Hooks

- [useWindowSize documentation](https://reactuse.com/element/useWindowSize/) — full API reference and interactive demo
- [useMediaQuery](https://reactuse.com/browser/useMediaQuery/) — reactive CSS media query matching
- [useElementSize](https://reactuse.com/element/useElementSize/) — track the size of a specific DOM element

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
