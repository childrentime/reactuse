---
title: "React useInfiniteScroll Hook: Infinite Scrolling Made Simple (2026)"
description: "A practical guide to useInfiniteScroll in React: wire up bottom-of-list loading with one hook call, handle all four scroll directions, preserve scroll position for reverse feeds, throttle scroll events — built on useScroll, SSR-safe, TypeScript-first."
slug: react-useinfinitescroll-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-03
tags: [react, hooks, infinite-scroll, typescript, tutorial]
keywords: [react useInfiniteScroll, useinfinitescroll, useInfiniteScroll hook, react infinite scroll hook, infinite scroll react, react infinite loading, react scroll pagination, react load more on scroll, useScroll react, react infinite scroll typescript, ssr-safe infinite scroll, react virtual scroll, infinite scroll direction react, react chat scroll]
image: /img/og.png
---

# React useInfiniteScroll Hook: Infinite Scrolling Made Simple (2026)

Every feed, every chat log, every search result page eventually asks the same question: *how do I load more when the user reaches the bottom?* The naive answer — a scroll listener, some arithmetic about `scrollHeight` and `clientHeight`, a boolean to prevent double-fetching — is maybe 30 lines, and every one of them is a trap. You forget to clean up the listener. You compare the wrong dimension. You fire the callback on mount before there's anything to scroll. You hard-code "bottom" and then product asks for a chat that loads history upward. You skip throttling and the callback fires 60 times while the user holds the scroll position at the threshold.

[`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) from [`@reactuses/core`](https://reactuse.com) replaces all of that with one call: point it at a scrollable element, give it a load-more function, and it handles the rest — arrival detection, direction, distance threshold, scroll-position preservation, and cleanup. This post walks the real implementation, the options that matter, and the patterns for feeds, chats, and horizontal carousels. TypeScript-first.

<!-- truncate -->

## The Simplest Case: Load More at the Bottom

```tsx
import { useRef, useState } from 'react';
import { useInfiniteScroll } from '@reactuses/core';

function Feed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<string[]>(() =>
    Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
  );

  useInfiniteScroll(containerRef, async () => {
    const newItems = await fetchMoreItems(items.length);
    setItems(prev => [...prev, ...newItems]);
  });

  return (
    <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
      {items.map(item => (
        <div key={item} style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          {item}
        </div>
      ))}
    </div>
  );
}
```

That's it. Scroll to the bottom, `fetchMoreItems` fires. It doesn't fire again until the user scrolls away from the bottom and back. It doesn't fire during SSR. It cleans up the listener on unmount. The container can be any scrollable element — a `div` with `overflow: auto`, a `<section>`, whatever you point the ref at.

## The Signature

```ts
useInfiniteScroll(target, onLoadMore, options?)
```

- **`target`** — a ref to the scrollable DOM element (`RefObject<Element>`).
- **`onLoadMore`** — a function (sync or async) called when the user reaches the scroll edge. It receives the full scroll state from [`useScroll`](https://reactuse.com/browser/usescroll/): `[x, y, isScrolling, arrivedState, directions]`.
- **`options`** — everything [`useScroll`](https://reactuse.com/browser/usescroll/) accepts, plus three infinite-scroll-specific fields.

## Options That Matter

### `distance` — Fire Before the Edge

```tsx
useInfiniteScroll(containerRef, loadMore, {
  distance: 200, // fire 200px before hitting the bottom
});
```

Default is `0` — the callback fires only when the user reaches the absolute edge. Set `distance` to preload: at `200`, the next page starts fetching while there's still 200 px of content to scroll through, so the user never sees a loading spinner on a fast connection. The right number depends on your item height and fetch latency — start with one viewport height and tune down.

### `direction` — Not Just Bottom

```tsx
useInfiniteScroll(containerRef, loadMore, {
  direction: 'top', // load older messages when scrolling up
});
```

Four directions: `'bottom'` (default), `'top'`, `'left'`, `'right'`. Chat apps want `'top'` — the user scrolls up to load history. Horizontal carousels want `'left'` or `'right'`. The hook wires the arrival detection to the correct edge automatically.

### `preserveScrollPosition` — Stay Where You Were

```tsx
useInfiniteScroll(containerRef, loadMore, {
  direction: 'top',
  preserveScrollPosition: true,
});
```

When loading content *above* the current viewport (chat history, reverse-chronological feeds), the new items push everything down and the user loses their place. `preserveScrollPosition: true` fixes this: after `onLoadMore` resolves, the hook adjusts `scrollTop` (or `scrollLeft` for horizontal) by exactly the height (or width) of the newly inserted content. The scroll position looks unchanged to the user, with older messages appearing above.

### `throttle` — Inherited from useScroll

```tsx
useInfiniteScroll(containerRef, loadMore, {
  throttle: 100, // check arrival at most every 100ms
});
```

This is a [`useScroll`](https://reactuse.com/browser/usescroll/) option that `useInfiniteScroll` passes through. It throttles the underlying scroll event handler — useful when your container scrolls at 120 fps and you don't need sub-frame arrival detection.

## Under the Hood

The [implementation](https://reactuse.com/browser/useinfinitescroll/) is 44 lines. Here's what it does:

```ts
export const useInfiniteScroll = (target, onLoadMore, options = {}) => {
  const savedLoadMore = useLatest(onLoadMore);
  const direction = options.direction ?? 'bottom';
  const state = useScroll(target, {
    ...options,
    offset: {
      [direction]: options.distance ?? 0,
      ...options.offset,
    },
  });

  const di = state[3][direction]; // arrivedState[direction]

  useUpdateEffect(() => {
    const element = getTargetElement(target);
    const fn = async () => {
      const previous = {
        height: element?.scrollHeight ?? 0,
        width: element?.scrollWidth ?? 0,
      };
      await savedLoadMore.current(state);
      if (options.preserveScrollPosition && element) {
        element.scrollTo({
          top: element.scrollHeight - previous.height,
          left: element.scrollWidth - previous.width,
        });
      }
    };
    fn();
  }, [di, options.preserveScrollPosition, target]);
};
```

Three pieces make this work:

1. **[`useScroll`](https://reactuse.com/browser/usescroll/) does the heavy lifting.** It tracks `x`, `y`, `isScrolling`, arrived state (four booleans for four edges), and scroll direction. The `offset` option shifts the arrival threshold — `useInfiniteScroll` maps its `distance` option to `offset[direction]`, so "arrived at bottom" really means "arrived within `distance` pixels of the bottom."

2. **[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) prevents the mount-fire.** A regular `useEffect` would call `onLoadMore` on mount — before the container has any content to scroll. `useUpdateEffect` skips the first invocation and only fires when `di` (the arrived boolean for the chosen direction) actually *changes*. The callback fires once per arrival, not once per scroll event.

3. **[`useLatest`](https://reactuse.com/state/uselatest/) kills stale closures.** The `onLoadMore` callback probably closes over state that changes between renders — the current page number, accumulated items, a cursor. `useLatest` wraps it in a ref so the version called is always current, without recreating the scroll machinery.

### The `preserveScrollPosition` Trick

After `onLoadMore` resolves (new items are in the DOM), the hook snapshots the *change* in `scrollHeight`/`scrollWidth` and calls `element.scrollTo()` to offset by exactly that delta. This is a synchronous DOM measurement after an async operation — it works because React's state update from `onLoadMore` has already flushed to the DOM by the time the `await` resumes.

## Patterns

### Paginated Feed

```tsx
function PaginatedFeed() {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [hasMore, setHasMore] = useState(true);

  useInfiniteScroll(ref, async () => {
    if (!hasMore) return;
    const data = await fetchPage(page);
    setItems(prev => [...prev, ...data.items]);
    setHasMore(data.hasNextPage);
    setPage(prev => prev + 1);
  }, { distance: 300 });

  return (
    <div ref={ref} style={{ height: '100vh', overflow: 'auto' }}>
      {items.map(item => <Card key={item.id} item={item} />)}
      {!hasMore && <p>No more items</p>}
    </div>
  );
}
```

Guard with `hasMore` so the callback becomes a no-op when the API says there's nothing left. The hook still fires at the edge — the guard makes the fire cheap.

### Chat History (Reverse Scroll)

```tsx
function ChatHistory({ channelId }: { channelId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  useInfiniteScroll(ref, async () => {
    const data = await fetchMessages(channelId, cursor);
    setMessages(prev => [...data.messages, ...prev]);
    setCursor(data.nextCursor);
  }, {
    direction: 'top',
    preserveScrollPosition: true,
    distance: 100,
  });

  return (
    <div ref={ref} style={{ height: 500, overflow: 'auto' }}>
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
    </div>
  );
}
```

`direction: 'top'` fires when the user scrolls to the top. `preserveScrollPosition: true` keeps the viewport pinned to the same message after older messages are prepended. This is the pattern Slack, Discord, and every chat UI uses — and the one that's hardest to get right by hand, because the scroll-position math has to run *after* the DOM updates but *before* the browser paints.

### Horizontal Carousel

```tsx
function HorizontalGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);

  useInfiniteScroll(ref, async () => {
    const moreImages = await fetchImages(images.length);
    setImages(prev => [...prev, ...moreImages]);
  }, {
    direction: 'right',
    distance: 200,
  });

  return (
    <div ref={ref} style={{ display: 'flex', overflowX: 'auto', gap: 16 }}>
      {images.map(src => <img key={src} src={src} style={{ width: 300 }} />)}
    </div>
  );
}
```

Same hook, different axis. `direction: 'right'` watches `scrollLeft` against `scrollWidth`.

## useInfiniteScroll vs. useIntersectionObserver

Both can trigger "load more." The difference is what they're watching:

- [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) watches a *sentinel element* — a div at the bottom of your list. When the sentinel enters the viewport, you load more. This works for any container, including the window itself, and handles complex layouts (sticky headers, nested scroll containers) gracefully because the browser's intersection math accounts for all of it.

- [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) watches the *scroll position* of a specific container. It's simpler to wire up (no sentinel element to manage), handles all four directions natively, and includes `preserveScrollPosition` out of the box.

**Pick `useInfiniteScroll` when** you have a single scrollable container and want the simplest possible setup. **Pick `useIntersectionObserver` when** you're loading at the window level, have complex nested scroll contexts, or need fine-grained control over the trigger threshold.

## The Scroll Family

- [`useScroll`](https://reactuse.com/browser/usescroll/) — the foundation: tracks `x`, `y`, `isScrolling`, arrived state, and direction for any scrollable element. `useInfiniteScroll` is built on top of it.
- [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/) — same tracking but for `window` specifically.
- [`useThrottle`](https://reactuse.com/state/usethrottle/) / [`useDebounce`](https://reactuse.com/state/usedebounce/) — rate-limit any value. `useScroll` has built-in `throttle` support, but if you need to throttle the *output* of your load-more for other reasons, these are your tools.
- [`useElementSize`](https://reactuse.com/element/useelementsize/) — if you need to know the container's dimensions to calculate how many items to fetch per page.

## SSR Safety

`useInfiniteScroll` creates no subscriptions during server rendering. The scroll listener is attached inside [`useScroll`](https://reactuse.com/browser/usescroll/), which guards on `window` existence. `useUpdateEffect` skips the first render entirely. On the server, the hook is a no-op that touches no browser globals — your Next.js / Remix build renders the initial items and hydrates cleanly, and infinite scrolling wakes up with the client. SSR-safe by construction, like every hook in [`@reactuses/core`](https://reactuse.com).

## Takeaways

- **One hook replaces the scroll listener, the math, and the cleanup.** [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) takes a ref and a callback; the rest is handled.
- **`distance` preloads content** so the user never waits at the bottom.
- **`direction` handles all four edges** — `'bottom'` for feeds, `'top'` for chat history, `'left'`/`'right'` for carousels.
- **`preserveScrollPosition` is the chat-history fix** — it adjusts the scroll offset after prepending content so the viewport doesn't jump.
- **Built on [`useScroll`](https://reactuse.com/browser/usescroll/)**, which means you inherit throttling, arrived-state tracking, and direction detection for free.
- **[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) prevents the mount-fire** — the callback doesn't run until the user actually scrolls to the edge.
- **SSR-safe with nothing to configure** — no listeners, no browser globals until the client takes over.

Install [`@reactuses/core`](https://reactuse.com), point `useInfiniteScroll` at your list container, and stop writing scroll arithmetic by hand.
