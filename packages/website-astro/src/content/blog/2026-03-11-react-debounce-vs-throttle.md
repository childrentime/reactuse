---
title: "Debounce vs Throttle in React: When to Use Which"
description: "Learn the difference between debounce and throttle in React, when to use each, and how to implement them with useDebounce and useThrottleFn hooks from ReactUse."
slug: react-debounce-vs-throttle
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, performance, useDebounce, useThrottle]
keywords: [react debounce, react throttle, debounce vs throttle, useDebounce, useThrottle, react performance]
image: /img/og.png
---

# Debounce vs Throttle in React: When to Use Which

Debounce and throttle are two essential rate-limiting techniques every React developer needs in their toolkit. Both prevent functions from firing too often, but they work in fundamentally different ways. Choosing the wrong one can make your UI feel sluggish or waste resources. This guide breaks down when to use each and how to implement them with minimal effort.

<!-- truncate -->

## What Is Debouncing?

Debouncing delays execution until a burst of activity has stopped. Think of it like an elevator door: it keeps resetting its close timer every time a new person walks in. The door only closes after everyone has stopped entering for a few seconds.

In code terms, a debounced function waits for a quiet period (e.g., 300 ms) after the last call before it actually runs. If new calls keep arriving, the timer keeps restarting.

**Example:** A user types "react hooks" into a search box. Without debounce, you fire an API request on every keystroke (11 requests). With a 300 ms debounce, you fire just one request after the user pauses typing.

## What Is Throttling?

Throttling guarantees a function runs at most once per time interval, no matter how many times it is triggered. Think of it like a metronome: it ticks at a fixed rate regardless of how fast you tap the table.

A throttled function will execute immediately on the first call, then ignore further calls until the interval elapses.

**Example:** As a user scrolls a page, the scroll event can fire hundreds of times per second. A 100 ms throttle ensures your scroll handler runs at most 10 times per second, keeping animations smooth without overwhelming the browser.

## Key Differences at a Glance

| | **Debounce** | **Throttle** |
|---|---|---|
| **Fires when** | Activity stops for *N* ms | At most once every *N* ms |
| **First call** | Delayed | Immediate |
| **Guarantees execution** | Only after the quiet period | At regular intervals |
| **Best for** | Final-value scenarios | Continuous-feedback scenarios |
| **Analogy** | Elevator door waiting to close | Metronome ticking steadily |

## When to Use Debounce

Debounce is the right choice when you only care about the **final result** after a flurry of events:

- **Search input** -- Wait until the user stops typing before querying an API.
- **API calls on form fields** -- Avoid sending a request for every character change.
- **Form validation** -- Validate after the user finishes editing a field, not mid-keystroke.
- **Window resize calculations** -- Recalculate layout once the user finishes resizing.

## When to Use Throttle

Throttle is the right choice when you need **steady, periodic updates** during a continuous event:

- **Scroll position tracking** -- Update a progress bar or trigger infinite scroll loading.
- **Window resize** -- Adjust layout responsively while the user is still dragging.
- **Mouse/touch move** -- Track pointer coordinates for drag-and-drop or drawing.
- **Rate-limited API calls** -- Ensure you never exceed a request-per-second limit.

## Implementation with ReactUse

### Debouncing a Value with `useDebounce`

`useDebounce` accepts a value and returns its debounced version. The returned value only updates after the specified wait period of inactivity.

```tsx
import { useDebounce } from "@reactuses/core";
import { useEffect, useState } from "react";

function SearchBox() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // Only fires 300ms after the user stops typing
      fetchSearchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Throttling a Function with `useThrottleFn`

`useThrottleFn` wraps a function and returns a throttled version with `run`, `cancel`, and `flush` controls.

```tsx
import { useThrottleFn } from "@reactuses/core";
import { useEffect, useState } from "react";

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  const { run: handleScroll } = useThrottleFn(
    () => {
      setScrollY(window.scrollY);
    },
    100
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return <div>Scroll position: {scrollY}px</div>;
}
```

## Common Mistakes

1. **Using debounce for scroll events.** The callback only fires after scrolling stops, so your UI feels frozen during the entire scroll. Users expect continuous visual feedback while scrolling, so throttle is the correct choice here.

2. **Using throttle for search input.** Throttle fires periodically while the user is still typing, which sends unnecessary intermediate API requests with incomplete queries. Debounce waits for the user to pause, ensuring you only send the final intended query.

3. **Creating a new debounced/throttled function on every render.** This is a subtle but common bug. A fresh function means a fresh internal timer, which effectively resets the delay on every render and defeats the purpose. ReactUse hooks handle this for you by memoizing the throttled or debounced function internally using refs and `useMemo`.

4. **Forgetting cleanup.** Debounced or throttled calls can fire after a component unmounts, causing the dreaded "state update on an unmounted component" warning. Both `useDebounce` and `useThrottleFn` from ReactUse automatically cancel any pending calls when the component unmounts, so you don't have to worry about stale callbacks.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [useDebounce documentation](https://reactuse.com/state/useDebounce/) -- Debounce a reactive value
- [useDebounceFn documentation](https://reactuse.com/effect/useDebounceFn/) -- Debounce a function
- [useThrottle documentation](https://reactuse.com/state/useThrottle/) -- Throttle a reactive value
- [useThrottleFn documentation](https://reactuse.com/effect/useThrottleFn/) -- Throttle a function

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
