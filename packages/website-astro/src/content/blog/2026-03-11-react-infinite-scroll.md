---
title: "Infinite Scroll in React with One Hook"
description: "Learn how to implement infinite scroll in React using useInfiniteScroll. Replace manual IntersectionObserver code with a single hook that handles cleanup, race conditions, and loading states."
slug: react-infinite-scroll-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, infinite-scroll, useInfiniteScroll]
keywords: [react infinite scroll, useInfiniteScroll, react infinite loading, react scroll pagination, infinite scroll hook]
image: /img/og.png
---

# Infinite Scroll in React with One Hook

Infinite scroll lets users load more content as they scroll down a page, replacing traditional pagination with a seamless browsing experience. It is everywhere: social media feeds, image galleries, search results, and product listings. Getting it right in React, however, is harder than it looks.

<!-- truncate -->

## What Is Infinite Scroll?

Infinite scroll automatically fetches and appends new content when the user reaches (or approaches) the end of the current list. Instead of clicking "Next Page," the user simply keeps scrolling. Done well, it feels effortless. Done poorly, it causes duplicate requests, memory leaks, and janky UI.

## The Manual Approach with IntersectionObserver

The standard DIY technique uses the `IntersectionObserver` API to detect when a sentinel element enters the viewport:

```tsx
import { useEffect, useRef, useState } from "react";

function Feed() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch(`/api/items?page=${page}`)
      .then((res) => res.json())
      .then((data) => setItems((prev) => [...prev, ...data]));
  }, [page]);

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
      <div ref={sentinelRef} />
    </div>
  );
}
```

This works for a demo, but production use quickly exposes the cracks.

## The Problems with the Manual Approach

1. **Cleanup is error-prone.** You must disconnect the observer, cancel in-flight requests, and handle component unmounting. Miss any of these and you get memory leaks or state updates on unmounted components.
2. **Race conditions.** Fast scrolling can fire the observer callback multiple times before the first fetch completes, leading to duplicate or out-of-order data.
3. **Loading states.** There is no built-in coordination between the scroll detection and the async fetch. You end up threading `isLoading` flags through multiple effects.
4. **Scroll direction.** Supporting upward infinite scroll (like chat history) requires an entirely different calculation.
5. **Scroll position preservation.** When loading items above the current viewport, the scroll position jumps unless you manually measure and restore it.

Every time you copy-paste this pattern into a new component, you reintroduce the same risks.

## The Better Way: useInfiniteScroll

[ReactUse](https://reactuse.com) provides `useInfiniteScroll`, a single hook that handles scroll detection, callback invocation, and all the edge cases above:

```tsx
import { useInfiniteScroll } from "@reactuses/core";
import { useRef, useState } from "react";

function Feed() {
  const ref = useRef(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useInfiniteScroll(
    ref,
    async () => {
      const res = await fetch(`/api/items?page=${page}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
    }
  );

  return (
    <div ref={ref} style={{ height: 500, overflow: "auto" }}>
      {items.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
}
```

The hook monitors the scroll position of the target element. When the user scrolls close enough to the edge, it calls your `onLoadMore` function. No observer setup, no cleanup code, no sentinel element.

## Full Example with API Loading

Here is a more complete example with loading indicators and an end-of-list check:

```tsx
import { useInfiniteScroll } from "@reactuses/core";
import { useRef, useState } from "react";

function ProductList() {
  const containerRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useInfiniteScroll(
    containerRef,
    async () => {
      if (!hasMore) return;

      const res = await fetch(`/api/products?page=${page}&limit=20`);
      const data = await res.json();

      if (data.length < 20) setHasMore(false);
      setProducts((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
    },
    { distance: 200 }
  );

  return (
    <div ref={containerRef} style={{ height: "80vh", overflow: "auto" }}>
      {products.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>{product.price}</p>
        </div>
      ))}
      {!hasMore && <p>You have reached the end.</p>}
    </div>
  );
}
```

The `distance` option triggers loading 200 pixels *before* the user hits the bottom, so new content appears before they run out of items to scroll through.

## Customization: Distance and Direction

### Trigger distance

Set `distance` to control how early the load fires. A value of `0` (the default) waits until the user reaches the very bottom. Higher values provide a smoother experience by prefetching content:

```tsx
useInfiniteScroll(ref, loadMore, { distance: 300 });
```

### Scroll direction

By default the hook watches the `bottom` edge. For reverse-chronological feeds like chat, switch to `top` and enable `preserveScrollPosition` so the viewport stays in place after new messages are inserted:

```tsx
useInfiniteScroll(ref, loadOlderMessages, {
  direction: "top",
  preserveScrollPosition: true,
});
```

You can also use `left` or `right` for horizontal scroll layouts such as carousels or timelines.

## When NOT to Use Infinite Scroll

Infinite scroll is not always the right choice:

- **Content the user needs to find again.** If users want to bookmark or return to a specific item, paginated URLs are more reliable.
- **Small, finite datasets.** If you only have 20 items, just render them all.
- **Footer-dependent pages.** Infinite scroll makes it impossible to reach a footer, which frustrates users who expect to find links or legal information there.
- **Accessibility requirements.** Screen readers and keyboard navigation work better with explicit pagination controls. If you do use infinite scroll, provide a fallback "Load more" button.

Consider these trade-offs before reaching for the pattern.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [useInfiniteScroll documentation](https://reactuse.com/browser/useInfiniteScroll/) -- interactive demo and full API reference
- [useScroll](https://reactuse.com/browser/useScroll/) -- reactive scroll position and direction tracking

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
