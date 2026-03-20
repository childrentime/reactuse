---
title: "React Hooks Performance: How to Avoid Unnecessary Re-renders"
description: "Practical techniques to optimize React hooks performance — learn when to use useMemo, useCallback, and how well-designed hooks libraries like ReactUse help you write faster components."
slug: react-hooks-performance
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-17
tags: [react, hooks, performance, optimization, best-practices]
keywords: [react hooks performance, react re-render, useMemo, useCallback, react optimization, avoid re-renders]
image: /img/og.png
---

# React Hooks Performance: How to Avoid Unnecessary Re-renders

Performance is the concern that separates production-quality React code from tutorial-grade code. Most React applications do not have a rendering problem — but the ones that do can feel sluggish, janky, and frustrating. The key is knowing *when* optimization matters, *what* tools React gives you, and *where* well-designed hooks libraries have already done the work for you.

<!-- truncate -->

## When Does React Re-render?

A component re-renders when one of three things happens:

1. **Its state changes.** Calling `setState` schedules a re-render of that component and all of its children.
2. **Its parent re-renders.** Even if a child's props haven't changed, React re-renders it by default when the parent renders.
3. **A context it consumes changes.** Any component that calls `useContext(SomeContext)` re-renders when that context's value changes.

Understanding these three triggers is the foundation. Every optimization technique in this article addresses one or more of them.

## The Real Cost of Re-renders

Not all re-renders are expensive. React's virtual DOM diffing is fast. A component that returns a few `<div>` elements can re-render thousands of times without the user noticing. The real cost comes from:

- **Expensive calculations** inside the render path (filtering large arrays, complex math).
- **Expensive side effects** triggered by changed dependencies (API calls, DOM measurements).
- **Large component trees** where a single state change at the top cascades through hundreds of children.

Before optimizing, measure. React DevTools Profiler shows you exactly which components re-render and how long each render takes. Optimize the slow parts, not everything.

## Rule 1: Don't Optimize Prematurely

Wrapping every value in `useMemo` and every function in `useCallback` is not an optimization — it is overhead. Each memoization hook has a cost: React must store the previous value, compare dependencies on every render, and manage the cached reference. If the computation being memoized is trivial, the memoization itself costs more than just recomputing the value.

```tsx
// Don't do this — the memoization costs more than the addition
const total = useMemo(() => price + tax, [price, tax]);

// Just compute it directly
const total = price + tax;
```

Reserve `useMemo` and `useCallback` for cases where you have measured a performance problem or where referential equality matters for downstream consumers.

## useMemo — When It Actually Helps

`useMemo` caches a computed value and only recalculates it when its dependencies change. It helps in two specific scenarios:

**Scenario 1: Expensive computations.**

```tsx
function ProductList({ products, filter }: Props) {
  // Without useMemo: filters 10,000 products on every render
  // With useMemo: only re-filters when products or filter change
  const filtered = useMemo(
    () => products.filter((p) => p.category === filter),
    [products, filter]
  );

  return (
    <ul>
      {filtered.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

**Scenario 2: Preserving referential equality for child props.**

```tsx
function Dashboard({ data }: Props) {
  // Without useMemo: new object on every render breaks React.memo on Chart
  const chartConfig = useMemo(
    () => ({ labels: data.map((d) => d.label), values: data.map((d) => d.value) }),
    [data]
  );

  return <MemoizedChart config={chartConfig} />;
}
```

## useCallback — The Misunderstood Hook

`useCallback` is `useMemo` for functions. It returns the same function reference as long as its dependencies haven't changed. The common mistake is using it everywhere "just in case."

`useCallback` only matters when the function is passed as a prop to a memoized child or used as a dependency in another hook.

```tsx
// Before: new function reference every render, MemoizedList re-renders every time
function SearchPage() {
  const [query, setQuery] = useState("");

  const handleSelect = (id: string) => {
    console.log("Selected:", id);
  };

  return <MemoizedList onSelect={handleSelect} />;
}

// After: stable reference, MemoizedList skips re-renders when query changes
function SearchPage() {
  const [query, setQuery] = useState("");

  const handleSelect = useCallback((id: string) => {
    console.log("Selected:", id);
  }, []);

  return <MemoizedList onSelect={handleSelect} />;
}
```

If `MemoizedList` is not wrapped in `React.memo`, `useCallback` does nothing useful — the child re-renders regardless because its parent re-rendered.

## State Structure Matters

How you structure state directly affects which components re-render.

**Split unrelated state.** When two pieces of state always change independently, keep them in separate `useState` calls. Combining them in one object means every update to either field re-renders everything that reads the object.

```tsx
// Bad: updating name re-renders components that only read age
const [form, setForm] = useState({ name: "", age: 0 });

// Good: independent updates, independent re-renders
const [name, setName] = useState("");
const [age, setAge] = useState(0);
```

**Derive what you can.** If a value can be computed from existing state, don't store it in state. Derived values eliminate an entire category of synchronization bugs and unnecessary re-renders.

```tsx
// Bad: extra state that must be kept in sync
const [items, setItems] = useState<Item[]>([]);
const [count, setCount] = useState(0);

// Good: derive count from items
const [items, setItems] = useState<Item[]>([]);
const count = items.length;
```

## The useRef Pattern for Stable Callbacks

A common pattern in high-performance hooks is storing the latest callback in a ref. This gives you a stable function reference that always calls the latest version of your callback — without adding the callback to dependency arrays.

```tsx
function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}
```

This pattern is so useful that ReactUse ships a `useLatest` hook built on the same idea:

```tsx
import { useLatest } from "@reactuses/core";

function useInterval(callback: () => void, delay: number) {
  const callbackRef = useLatest(callback);

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), delay);
    return () => clearInterval(id);
  }, [delay]); // callback is NOT a dependency — the ref always has the latest version
}
```

## How ReactUse Hooks Handle Performance

ReactUse hooks are built with performance in mind. Here are the key patterns used internally:

**1. Refs for callbacks.** Hooks like `useThrottleFn` and `useDebounceFn` store your callback in a ref via `useLatest`. The throttled/debounced wrapper is created once with `useMemo` and always calls the latest callback through the ref. This means you never need to worry about stale closures or add your callback to dependency arrays.

**2. Memoized return values.** Expensive setup (like creating a throttled function) is wrapped in `useMemo` so it only runs when configuration parameters change, not on every render.

**3. Automatic cleanup.** Hooks like `useThrottleFn` cancel pending timers on unmount via `useUnmount`, preventing state updates on unmounted components without any manual cleanup from your side.

```tsx
// Inside ReactUse's useThrottleFn — simplified
function useThrottleFn(fn, wait, options) {
  const fnRef = useLatest(fn);                   // 1. ref for callback
  const throttled = useMemo(                      // 2. memoized wrapper
    () => throttle((...args) => fnRef.current(...args), wait, options),
    [wait]
  );
  useUnmount(() => throttled.cancel());           // 3. automatic cleanup
  return { run: throttled, cancel: throttled.cancel, flush: throttled.flush };
}
```

These patterns mean that when you use ReactUse hooks, you get optimized behavior out of the box. You don't need to wrap your callbacks in `useCallback` before passing them to ReactUse hooks — the ref-based pattern handles it internally.

## Practical Example: Optimized Search with useDebounce

Here is a before-and-after comparison of a search component. The "before" version makes an API call on every keystroke and re-renders an expensive list unnecessarily.

```tsx
// Before: unoptimized — API call on every keystroke, list re-renders every time
function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);

  useEffect(() => {
    if (query) {
      fetch(`/api/search?q=${query}`)
        .then((r) => r.json())
        .then(setResults);
    }
  }, [query]); // fires on every keystroke

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ResultList items={results} />
    </div>
  );
}
```

```tsx
// After: debounced query, memoized list — API calls reduced by ~90%
import { useDebounce } from "@reactuses/core";
import { memo, useState, useEffect } from "react";

const MemoizedResultList = memo(ResultList);

function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Item[]>([]);

  useEffect(() => {
    if (debouncedQuery) {
      fetch(`/api/search?q=${debouncedQuery}`)
        .then((r) => r.json())
        .then(setResults);
    }
  }, [debouncedQuery]); // fires only after 300ms of inactivity

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <MemoizedResultList items={results} />
    </div>
  );
}
```

The debounced version makes fewer API calls, and the memoized list only re-renders when `results` actually changes — not on every keystroke.

## React 19 Compiler: The Future of Automatic Optimization

The React Compiler (formerly React Forget) aims to automatically insert `useMemo` and `useCallback` at build time. When it ships broadly, many of the manual memoization patterns in this article will become unnecessary. The compiler analyzes your component code and determines which values need stable references, then adds memoization automatically.

However, the compiler does not eliminate the need for good state design, proper use of refs, or library-level optimizations like debouncing and throttling. It automates the mechanical part of memoization, but the architectural decisions — what to put in state, when to debounce, how to structure your component tree — remain your responsibility.

Until the compiler is stable and widely adopted, the patterns in this article remain essential knowledge for React developers.

## Common Mistakes

1. **Memoizing everything.** Adding `useMemo` to trivial computations adds complexity and memory overhead without measurable benefit. Measure first, then optimize.

2. **Using `useCallback` without `React.memo`.** A stable function reference is useless if the child component re-renders anyway because it is not memoized.

3. **Putting all state in one object.** A single state object means every field update triggers a re-render for every consumer. Split state by update frequency.

4. **Ignoring the dependency array.** Missing dependencies cause stale closures. Extra dependencies cause unnecessary re-computation. Both are bugs.

5. **Creating new objects/arrays in render.** Inline objects (`style={{ color: "red" }}`) and arrays (`items={[1, 2, 3]}`) create new references every render, defeating memoization on child components.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [useDebounce documentation](https://reactuse.com/state/useDebounce/) -- Debounce a reactive value
- [useDebounceFn documentation](https://reactuse.com/effect/useDebounceFn/) -- Debounce a function
- [useThrottle documentation](https://reactuse.com/state/useThrottle/) -- Throttle a reactive value
- [useThrottleFn documentation](https://reactuse.com/effect/useThrottleFn/) -- Throttle a function
- [useLatest documentation](https://reactuse.com/state/useLatest/) -- Keep a ref to the latest value

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
