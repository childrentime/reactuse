---
title: "React useIntersectionObserver Hook: Lazy Load & Detect Visibility (2026)"
description: "A practical guide to the useIntersectionObserver hook in React: detect when an element enters the viewport, lazy-load images, fire once-per-view analytics, and build infinite-scroll triggers — without the scroll-listener thrash or the leak-on-unmount bug the hand-rolled version always ships. SSR-safe and TypeScript-first."
slug: react-useintersectionobserver-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-30
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useIntersectionObserver, useIntersectionObserver hook, react intersection observer, detect element visibility react, react lazy load images, react in viewport hook, react element on screen, intersection observer react hook, react scroll into view detection, useIntersectionObserver typescript, ssr-safe intersection observer, react infinite scroll trigger, react fade in on scroll]
image: /img/og.png
---

# React useIntersectionObserver Hook: Lazy Load & Detect Visibility (2026)

You want to load an image only when it scrolls near the viewport. Or fire an analytics event the first time a card is actually *seen*. Or trigger "load more" when the user reaches the bottom of a list. Every one of these is the same question — *is this element on screen yet?* — and for years the answer was a `scroll` listener that fired hundreds of times a second, re-read `getBoundingClientRect()` on each tick, and still managed to miss the edge cases.

`IntersectionObserver` is the browser API that answers that question correctly, asynchronously, and off the main thread. `useIntersectionObserver` is the hook that wires it into React without the `useEffect`/`useRef`/cleanup boilerplate — and without the leak-on-unmount and stale-closure bugs the hand-rolled version always ships. This post covers the real [`@reactuses/core`](https://reactuse.com) API, the three patterns you'll actually reach for, and how to tune `threshold`, `rootMargin`, and `root`. SSR-safe and typed.

<!-- truncate -->

## Why Not Just Use a Scroll Listener?

The old way to know whether an element was visible looked like this: listen to `scroll`, and on every event measure the element against the viewport.

```tsx
useEffect(() => {
  function onScroll() {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setVisible(true);
    }
  }
  window.addEventListener('scroll', onScroll);
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

This has two problems baked in. First, `scroll` fires on the main thread, dozens of times per second, and `getBoundingClientRect()` forces a synchronous layout each time — that's exactly the recipe for janky scrolling. Second, it only catches elements crossing the *viewport*; the moment your scroll happens inside a container, you're re-deriving geometry by hand.

`IntersectionObserver` flips the model. You hand the browser a target and a threshold, and it tells *you* — asynchronously, batched, off the scroll path — when the element crosses that threshold. No measuring, no listener thrash. The only thing left to get wrong is the React lifecycle around it, and that's the part the hook owns.

Here's the naive in-component version, which has the same three bugs every hand-rolled observer does:

```tsx
function LazySection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSeen(true); // 🐛 see below
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{seen ? children : null}</div>;
}
```

1. **It leaks if you forget the cleanup.** Drop the `return () => io.disconnect()` — and people do, especially when refactoring — and the observer outlives the component.
2. **It captures stale closures.** The moment the callback references a prop or a second piece of state, the observer created on mount freezes whatever those were at mount time, not when it fires.
3. **It spreads.** Every lazy section, every "viewed" tracker, every infinite-scroll sentinel re-implements the same `useRef` + `observe` + `disconnect` dance, and each copy is a fresh chance to ship one of the first two bugs.

A hook fixes all three in one place.

## The API

[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) takes three arguments and returns a `stop` function:

```ts
const stop = useIntersectionObserver(target, callback, options?);
```

- **`target`** — what to observe. A React ref, a raw element, or a getter `() => element`. (It accepts `null`/`undefined` too, so observing a conditionally-rendered element is safe — the hook simply waits.)
- **`callback`** — the standard `IntersectionObserverCallback`, `(entries, observer) => void`. You get the raw `IntersectionObserverEntry[]`, so *you* decide what visibility means for your case.
- **`options`** — the native `IntersectionObserverInit`: `{ root, rootMargin, threshold }`. All optional.
- **returns `stop()`** — call it to disconnect the observer early (more on this below). The hook also calls it for you automatically on unmount.

The deliberate design choice here is that the hook is **callback-based, not boolean-based**. It doesn't decide for you that "intersecting" means visible — because depending on the job, it might mean "10% visible", "fully visible", or "within 200px of the viewport". You read `entry.isIntersecting` (or `entry.intersectionRatio`) and act. If all you want is a plain boolean, there's a convenience sibling for that — [see below](#just-want-a-boolean).

Internally the callback is kept in a ref (via `useLatest`), so it never goes stale — bug #2 is gone even when your callback closes over props. And because the observer is only ever constructed inside an effect, the hook is SSR-safe: nothing touches `IntersectionObserver` during render.

## Pattern 1: Lazy-Load an Image

The canonical use. Render a placeholder, and only swap in the real `<img>` once the container is about to enter the viewport. Note the `stop()` call — once we've loaded, we never need the observer again, so we disconnect it immediately.

```tsx
import { useRef, useState } from 'react';
import { useIntersectionObserver } from '@reactuses/core';

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const stop = useIntersectionObserver(
    ref,
    ([entry]) => {
      if (entry.isIntersecting) {
        setLoaded(true);
        stop(); // one-shot: stop observing once we've committed to loading
      }
    },
    { rootMargin: '200px' }, // start loading 200px before it scrolls in
  );

  return (
    <div ref={ref} style={{ minHeight: 200 }}>
      {loaded ? <img src={src} alt={alt} /> : <div className="skeleton" />}
    </div>
  );
}
```

Two things make this feel right. The `rootMargin: '200px'` grows the observer's "viewport" by 200px on every side, so the fetch kicks off *before* the image is actually visible and the user rarely sees the skeleton. And `stop()` inside the callback means a list of 500 lazy images ends up with zero live observers once they've all loaded — no lingering work as you keep scrolling.

## Pattern 2: Fire-Once "Viewed" Analytics

Tracking which sections a user actually scrolled to is the same shape — but here you genuinely want it to fire exactly once, so the `stop()` is doing real work.

```tsx
import { useRef } from 'react';
import { useIntersectionObserver } from '@reactuses/core';

function TrackedSection({ id, children }: { id: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  const stop = useIntersectionObserver(
    ref,
    ([entry]) => {
      if (entry.isIntersecting) {
        analytics.track('section_viewed', { id });
        stop(); // count each section once, not once per scroll-past
      }
    },
    { threshold: 0.5 }, // "viewed" = at least half on screen
  );

  return <section ref={ref}>{children}</section>;
}
```

Here `threshold: 0.5` encodes a product decision — a section only counts as "viewed" once 50% of it is on screen, so a fast scroll past the top edge doesn't inflate your numbers. The `stop()` guarantees one event per section per page load even if the user scrolls it in and out repeatedly.

## Pattern 3: Infinite-Scroll Trigger

Put an empty sentinel `<div>` at the bottom of a list and fetch the next page when it intersects. Note that here we *don't* call `stop()` — we want the trigger to keep firing for every page.

```tsx
import { useRef } from 'react';
import { useIntersectionObserver } from '@reactuses/core';

function Feed({ items, loadMore, hasMore }: FeedProps) {
  const sentinel = useRef<HTMLDivElement>(null);

  useIntersectionObserver(sentinel, ([entry]) => {
    if (entry.isIntersecting && hasMore) {
      loadMore();
    }
  });

  return (
    <>
      {items.map((it) => <Row key={it.id} item={it} />)}
      {hasMore && <div ref={sentinel} style={{ height: 1 }} />}
    </>
  );
}
```

Because the callback is always the latest one (no stale closure), `loadMore` and `hasMore` are read fresh every time the sentinel intersects — the bug that bites the hand-rolled `useEffect` version doesn't exist here. If you want this whole pattern packaged, [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) builds exactly this on top, including the scroll-container plumbing.

## Tuning: threshold, rootMargin, and root

The third argument is the native `IntersectionObserverInit`, passed straight through. Three knobs, each answering a different question:

```ts
useIntersectionObserver(ref, callback, {
  threshold: 0.5,        // HOW MUCH must be visible to count?
  rootMargin: '200px',   // grow/shrink the trigger boundary
  root: containerRef.current, // WHAT are we measuring against?
});
```

- **`threshold`** — a number (or array) from `0` to `1` for *how much* of the target must be visible before the callback fires. `0` (the default) fires the instant a single pixel crosses; `1` waits until the element is fully on screen. Pass an array like `[0, 0.25, 0.5, 0.75, 1]` to get a callback at each step — useful for scroll-linked animations driven by `entry.intersectionRatio`.
- **`rootMargin`** — a CSS-margin string that inflates or deflates the root's bounding box *before* intersection is computed. Positive values (`'200px'`) fire early — the lazy-load-ahead trick from Pattern 1. Negative values (`'-100px 0px'`) fire late, e.g. "only count this as viewed once it's 100px past the top edge."
- **`root`** — the element you're measuring against. Defaults to the browser viewport; set it to a scroll container's element when your list scrolls inside a `<div>` rather than the page.

## The stop() Return Value

The returned `stop()` disconnects the observer. You usually don't need it — the hook auto-disconnects on unmount — but it's the clean way to express *one-shot* observation, as in Patterns 1 and 2: the first time the element intersects, do the work and stop watching. That's both a correctness win (the event fires exactly once) and a performance one (no live observer trailing behind a long, already-loaded list).

## Just Want a Boolean?

Sometimes you don't care about entries or thresholds — you just want a reactive `isVisible` flag for the whole viewport. [`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) wraps `useIntersectionObserver` and hands you exactly that, as a tuple with its own `stop`:

```tsx
import { useRef } from 'react';
import { useElementVisibility } from '@reactuses/core';

function FadeIn({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible] = useElementVisibility(ref);

  return (
    <div ref={ref} className={visible ? 'fade fade-in' : 'fade'}>
      {children}
    </div>
  );
}
```

Reach for `useElementVisibility` when a boolean is all you need, and drop down to `useIntersectionObserver` the moment you want a custom `root`, a non-default `threshold`, multiple thresholds, or the raw entry. Same engine, two ergonomics.

## SSR Safety

`useIntersectionObserver` is safe to render on the server. It constructs the `IntersectionObserver` only inside an effect — which React never runs on the server — and the underlying element lookup returns `undefined` outside the browser, so there's no `typeof window` guard to write and no hydration mismatch to chase. Drop it into a Next.js, Remix, or Astro component as-is. (If SSR-safety is a recurring theme in your codebase, [SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) goes deeper.)

## The Visibility & Size Family

`useIntersectionObserver` is the low-level primitive in a family of DOM-watching hooks. Pick by what you actually want back:

| Hook | Gives you | Reach for it when… |
| --- | --- | --- |
| [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) | raw entries, a `stop()` | you want full control: custom root, thresholds, one-shot |
| [`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) | `[isVisible, stop]` | a plain "is it on screen?" boolean is enough |
| [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) | a load-more callback wired up | you're building a paginated/infinite list |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | a callback on size change | the element's *size* matters, not its visibility |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | `{ width, height }` as state | you just need live width/height |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | the full bounding rect | you need viewport-relative position (changes on scroll) |

For the full tour of how these compose, see [React Observer Hooks: 7 Ways to Watch the DOM](https://reactuse.com/blog/react-observer-hooks/).

## Takeaways

- A `scroll` listener plus `getBoundingClientRect()` is the wrong tool for "is this on screen" — it thrashes the main thread and still misses scroll containers. `IntersectionObserver` answers it correctly, batched and off the scroll path.
- **`useIntersectionObserver(target, callback, options?)`** wires it into React: hand it a ref, a callback that receives the raw entries, and the native options. It returns a `stop()` and auto-disconnects on unmount.
- It's **callback-based on purpose** — you decide what "visible" means via `entry.isIntersecting` / `entry.intersectionRatio`. The callback is never stale, so it reads fresh props every time it fires.
- Call **`stop()`** inside the callback for one-shot jobs (lazy-load, fire-once analytics); skip it for repeating triggers (infinite scroll).
- Tune with **`threshold`** (how much must show), **`rootMargin`** (fire early/late), and **`root`** (measure against a container, not the viewport).
- Want just a boolean? **`useElementVisibility`** returns `[isVisible, stop]`. Both are SSR-safe.

Grab it from [`@reactuses/core`](https://reactuse.com/element/useintersectionobserver/) and delete your scroll-listener boilerplate.
