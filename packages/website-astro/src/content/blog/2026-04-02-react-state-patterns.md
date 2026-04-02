---
title: "Mastering React State Patterns Beyond useState"
description: "Learn advanced React state patterns using hooks from ReactUse -- controlled components, debounced state, throttled state, previous values, cycling options, counters, and class-style setState."
slug: react-state-patterns
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, state, tutorial, useState]
keywords: [react state patterns, useControlled, usePrevious, useDebounce, useThrottle, useCycleList, useCounter, react state management]
image: /img/og.png
---

# Mastering React State Patterns Beyond useState

`useState` is the workhorse of React state management. It covers simple cases beautifully -- a boolean for a modal, a string for an input, a number for a counter. But the moment your requirements grow even slightly -- you need the previous value, you want to debounce a search term, you are building a component that can be either controlled or uncontrolled -- you find yourself writing the same boilerplate wrappers over and over. Refs to stash old values, `setTimeout` IDs that must be cleaned up, controlled-vs-uncontrolled negotiation logic that quickly spirals into a mess of `useEffect` calls.

<!-- truncate -->

This post walks through seven state patterns that go beyond basic `useState`. For each pattern, we start with the manual implementation so you see exactly what is involved, then swap it out for a purpose-built hook from [ReactUse](https://reactuse.com). By the end, we will combine all seven hooks into a single interactive settings panel that demonstrates how they compose.

## 1. Controlled vs Uncontrolled Components with useControlled

### The Problem

Reusable UI components often need to work in two modes: **controlled** (the parent owns the state and passes `value` + `onChange`) and **uncontrolled** (the component manages its own internal state, optionally accepting a `defaultValue`). Supporting both is the hallmark of well-designed component libraries like MUI and Radix -- but it is surprisingly tedious to implement correctly.

### The Manual Way

```tsx
import { useCallback, useRef, useState } from "react";

interface CustomInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

function CustomInput({ value, defaultValue = "", onChange }: CustomInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Keep a ref to always have the latest controlled value
  const valueRef = useRef(value);
  valueRef.current = value;

  const currentValue = isControlled ? value : internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return (
    <input
      value={currentValue}
      onChange={handleChange}
      style={{
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        fontSize: 16,
      }}
    />
  );
}
```

This works for a simple input. But the pattern gets more complicated when the controlled value changes externally (you need to sync), when you want to warn developers who switch between controlled and uncontrolled modes, and when the value is a complex object rather than a primitive. Every component that needs this dual-mode behavior repeats this same logic.

### With useControlled

[`useControlled`](https://reactuse.com/state/useControlled/) encapsulates the entire controlled/uncontrolled negotiation. It returns a `[value, setValue]` tuple that works regardless of which mode the consumer uses.

```tsx
import { useControlled } from "@reactuses/core";

interface CustomInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

function CustomInput({ value, defaultValue = "", onChange }: CustomInputProps) {
  const [currentValue, setCurrentValue] = useControlled({
    value,
    defaultValue,
    onChange,
  });

  return (
    <input
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      style={{
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        fontSize: 16,
      }}
    />
  );
}

// Uncontrolled usage -- component manages its own state
function UncontrolledDemo() {
  return <CustomInput defaultValue="hello" />;
}

// Controlled usage -- parent owns the state
function ControlledDemo() {
  const [text, setText] = useState("");
  return <CustomInput value={text} onChange={setText} />;
}
```

One hook call replaces the ref, the `isControlled` check, and the dual-path update logic. The component works identically in both modes, and if a developer accidentally switches between controlled and uncontrolled, the hook handles it gracefully.

## 2. Tracking Previous Values with usePrevious

### The Problem

You frequently need the value from the previous render -- to compare whether a prop changed, to animate transitions between old and new values, or to show "changed from X to Y" UI feedback. React does not provide this out of the box.

### The Manual Way

```tsx
import { useEffect, useRef, useState } from "react";

function PriceDisplay({ price }: { price: number }) {
  const prevPriceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    prevPriceRef.current = price;
  });

  const prevPrice = prevPriceRef.current;
  const direction =
    prevPrice === undefined
      ? "neutral"
      : price > prevPrice
        ? "up"
        : price < prevPrice
          ? "down"
          : "neutral";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 32, fontWeight: 700 }}>
        ${price.toFixed(2)}
      </span>
      {direction === "up" && (
        <span style={{ color: "#16a34a", fontSize: 20 }}>▲</span>
      )}
      {direction === "down" && (
        <span style={{ color: "#dc2626", fontSize: 20 }}>▼</span>
      )}
      {prevPrice !== undefined && prevPrice !== price && (
        <span style={{ color: "#6b7280", fontSize: 14 }}>
          was ${prevPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}
```

The ref-plus-effect trick works, but it is easy to get wrong. If you put the effect before the render logic (or use `useLayoutEffect` when you should not), the "previous" value may be stale or current. It is also one more piece of boilerplate to copy into every component that needs change detection.

### With usePrevious

[`usePrevious`](https://reactuse.com/state/usePrevious/) returns the value from the previous render, correctly timed so that during the current render you always see the old value.

```tsx
import { usePrevious } from "@reactuses/core";

function PriceDisplay({ price }: { price: number }) {
  const prevPrice = usePrevious(price);

  const direction =
    prevPrice === undefined
      ? "neutral"
      : price > prevPrice
        ? "up"
        : price < prevPrice
          ? "down"
          : "neutral";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 32, fontWeight: 700 }}>
        ${price.toFixed(2)}
      </span>
      {direction === "up" && (
        <span style={{ color: "#16a34a", fontSize: 20 }}>▲</span>
      )}
      {direction === "down" && (
        <span style={{ color: "#dc2626", fontSize: 20 }}>▼</span>
      )}
      {prevPrice !== undefined && prevPrice !== price && (
        <span style={{ color: "#6b7280", fontSize: 14 }}>
          was ${prevPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}

function StockTicker() {
  const [price, setPrice] = useState(142.5);

  return (
    <div style={{ padding: 24 }}>
      <PriceDisplay price={price} />
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={() => setPrice((p) => p + Math.random() * 5)}>
          Price Up
        </button>
        <button onClick={() => setPrice((p) => p - Math.random() * 5)}>
          Price Down
        </button>
      </div>
    </div>
  );
}
```

No refs, no effects. One line gives you the previous value, correctly synchronized with React's render cycle.

## 3. Debounced State with useDebounce

### The Problem

Search inputs, filter fields, and live-preview editors all suffer from the same issue: updating state on every keystroke triggers expensive operations (API calls, heavy re-renders, complex filtering) far more often than necessary. Debouncing -- waiting until the user stops typing for a specified delay -- is the standard solution.

### The Manual Way

```tsx
import { useEffect, useRef, useState } from "react";

function ManualDebouncedSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          width: 300,
          fontSize: 16,
        }}
      />
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Debounced value: <strong>{debouncedQuery}</strong>
      </p>
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        (This would trigger the API call)
      </p>
    </div>
  );
}
```

Two state variables, a ref for the timer, an effect to schedule the debounce, another to clean up on unmount. It works, but it is a lot of ceremony for something you will need in dozens of components.

### With useDebounce

[`useDebounce`](https://reactuse.com/state/useDebounce/) gives you a debounced version of any value. You update the source state normally, and the hook produces a lagging copy that only updates after the specified quiet period.

```tsx
import { useDebounce } from "@reactuses/core";
import { useState } from "react";

function DebouncedSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  return (
    <div style={{ padding: 24 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          width: 300,
          fontSize: 16,
        }}
      />
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Debounced value: <strong>{debouncedQuery}</strong>
      </p>
      {query !== debouncedQuery && (
        <p style={{ color: "#f59e0b", fontSize: 14 }}>
          Waiting for you to stop typing...
        </p>
      )}
    </div>
  );
}
```

One hook, one line. The timer management, cleanup, and synchronization are all handled internally. Compare `query !== debouncedQuery` to show a "typing" indicator for free.

## 4. Throttled State with useThrottle

### The Problem

Throttling is debouncing's cousin. Instead of waiting for silence, it ensures updates happen at most once per interval -- useful for events that fire continuously, like scroll positions, mouse moves, or real-time data feeds where you want a steady stream of updates rather than a burst at the end.

### The Manual Way

```tsx
import { useEffect, useRef, useState } from "react";

function ManualThrottledSlider() {
  const [value, setValue] = useState(50);
  const [throttledValue, setThrottledValue] = useState(50);
  const lastRun = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRun.current;
    const delay = 200;

    if (elapsed >= delay) {
      setThrottledValue(value);
      lastRun.current = now;
    } else {
      timerRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }, delay - elapsed);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value]);

  return (
    <div style={{ padding: 24 }}>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: 300 }}
      />
      <div style={{ marginTop: 12 }}>
        <p>Raw: {value}</p>
        <p>Throttled: {throttledValue}</p>
      </div>
    </div>
  );
}
```

The throttle logic is tricky to get right. You need to track the last execution time, handle the trailing invocation (so the final value is never lost), and clean up timers. And this is just for a single value -- you would need to repeat all of it for each throttled state.

### With useThrottle

[`useThrottle`](https://reactuse.com/state/useThrottle/) returns a throttled version of a value, updating at most once per interval while ensuring the final value is always captured.

```tsx
import { useThrottle } from "@reactuses/core";
import { useState } from "react";

function ThrottledSlider() {
  const [value, setValue] = useState(50);
  const throttledValue = useThrottle(value, 200);

  return (
    <div style={{ padding: 24 }}>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: 300 }}
      />
      <div style={{ marginTop: 12 }}>
        <p>Raw: {value}</p>
        <p>Throttled: {throttledValue}</p>
      </div>
      <div
        style={{
          marginTop: 16,
          height: 20,
          width: `${throttledValue}%`,
          background: "#4f46e5",
          borderRadius: 4,
          transition: "width 0.1s",
        }}
      />
    </div>
  );
}
```

The progress bar updates smoothly at 200ms intervals instead of thrashing on every pixel of slider movement. One line of code handles all the timing logic.

## 5. Cycling Through Options with useCycleList

### The Problem

Many UI controls need to cycle through a fixed set of options: theme toggles (light / dark / system), sort orders (ascending / descending / none), view modes (grid / list / compact). The typical approach is a state variable with a function that manually computes the next value.

### The Manual Way

```tsx
import { useState } from "react";

type ViewMode = "grid" | "list" | "compact";
const viewModes: ViewMode[] = ["grid", "list", "compact"];

function ManualViewToggle() {
  const [index, setIndex] = useState(0);
  const mode = viewModes[index];

  const next = () => setIndex((i) => (i + 1) % viewModes.length);
  const prev = () =>
    setIndex((i) => (i - 1 + viewModes.length) % viewModes.length);

  const icons: Record<ViewMode, string> = {
    grid: "▦",
    list: "☰",
    compact: "═",
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={prev} style={{ fontSize: 20, cursor: "pointer" }}>
          ←
        </button>
        <div
          style={{
            padding: "8px 16px",
            background: "#f1f5f9",
            borderRadius: 8,
            fontSize: 18,
            minWidth: 120,
            textAlign: "center",
          }}
        >
          {icons[mode]} {mode}
        </div>
        <button onClick={next} style={{ fontSize: 20, cursor: "pointer" }}>
          →
        </button>
      </div>
    </div>
  );
}
```

Simple enough for one toggle, but the modular arithmetic for wrapping and the separate index tracking are boilerplate that shows up wherever you need cycling behavior. It also does not support jumping to a specific value or reacting to list changes.

### With useCycleList

[`useCycleList`](https://reactuse.com/state/useCycleList/) manages cycling through an array of values, providing `next`, `prev`, and direct `go` functions along with the current value and index.

```tsx
import { useCycleList } from "@reactuses/core";

type ViewMode = "grid" | "list" | "compact";

function ViewToggle() {
  const [mode, { next, prev }] = useCycleList<ViewMode>(
    ["grid", "list", "compact"]
  );

  const icons: Record<ViewMode, string> = {
    grid: "▦",
    list: "☰",
    compact: "═",
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={prev} style={{ fontSize: 20, cursor: "pointer" }}>
          ←
        </button>
        <div
          style={{
            padding: "8px 16px",
            background: "#f1f5f9",
            borderRadius: 8,
            fontSize: 18,
            minWidth: 120,
            textAlign: "center",
          }}
        >
          {icons[mode]} {mode}
        </div>
        <button onClick={next} style={{ fontSize: 20, cursor: "pointer" }}>
          →
        </button>
      </div>
    </div>
  );
}
```

No index management, no modular arithmetic. The hook gives you the current value and navigation functions. It is especially handy for theme toggles where clicking cycles through light, dark, and system modes.

## 6. Numeric State with useCounter

### The Problem

Counters appear everywhere -- quantity selectors in e-commerce, pagination controls, step indicators, zoom levels. Each one needs increment, decrement, reset, and often min/max clamping. Writing this from scratch every time is tedious.

### The Manual Way

```tsx
import { useCallback, useState } from "react";

function ManualQuantityPicker() {
  const [count, setCount] = useState(1);
  const min = 1;
  const max = 99;

  const increment = useCallback(
    () => setCount((c) => Math.min(c + 1, max)),
    [max]
  );
  const decrement = useCallback(
    () => setCount((c) => Math.max(c - 1, min)),
    [min]
  );
  const reset = useCallback(() => setCount(1), []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={decrement}
          disabled={count <= min}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            background: count <= min ? "#f3f4f6" : "#fff",
            fontSize: 18,
            cursor: count <= min ? "not-allowed" : "pointer",
          }}
        >
          -
        </button>
        <span style={{ fontSize: 24, fontWeight: 600, minWidth: 40, textAlign: "center" }}>
          {count}
        </span>
        <button
          onClick={increment}
          disabled={count >= max}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            background: count >= max ? "#f3f4f6" : "#fff",
            fontSize: 18,
            cursor: count >= max ? "not-allowed" : "pointer",
          }}
        >
          +
        </button>
        <button onClick={reset} style={{ marginLeft: 12, fontSize: 14, color: "#6b7280" }}>
          Reset
        </button>
      </div>
    </div>
  );
}
```

The clamping logic, the disabled states, the memoized callbacks -- all standard boilerplate that repeats for every counter in your app.

### With useCounter

[`useCounter`](https://reactuse.com/state/useCounter/) provides `count`, `inc`, `dec`, `set`, and `reset` out of the box, with optional min/max bounds.

```tsx
import { useCounter } from "@reactuses/core";

function QuantityPicker() {
  const [count, { inc, dec, reset }] = useCounter(1, {
    min: 1,
    max: 99,
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => dec()}
          disabled={count <= 1}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            background: count <= 1 ? "#f3f4f6" : "#fff",
            fontSize: 18,
            cursor: count <= 1 ? "not-allowed" : "pointer",
          }}
        >
          -
        </button>
        <span style={{ fontSize: 24, fontWeight: 600, minWidth: 40, textAlign: "center" }}>
          {count}
        </span>
        <button
          onClick={() => inc()}
          disabled={count >= 99}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            background: count >= 99 ? "#f3f4f6" : "#fff",
            fontSize: 18,
            cursor: count >= 99 ? "not-allowed" : "pointer",
          }}
        >
          +
        </button>
        <button onClick={reset} style={{ marginLeft: 12, fontSize: 14, color: "#6b7280" }}>
          Reset
        </button>
      </div>
    </div>
  );
}
```

The hook handles clamping internally. You pass `min` and `max` once and never worry about boundary violations in your increment/decrement logic.

## 7. Class-Style setState with useSetState

### The Problem

React class components had a convenient `setState` that accepted partial objects and merged them into the existing state. With hooks, `useState` replaces the entire value. If your state is an object with multiple fields, every update needs a spread: `setState(prev => ({ ...prev, name: 'new' }))`. For complex forms or settings objects with many fields, this gets verbose and error-prone (forgetting the spread silently drops fields).

### The Manual Way

```tsx
import { useCallback, useState } from "react";

interface FormState {
  name: string;
  email: string;
  role: string;
  notifications: boolean;
}

function ManualSettingsForm() {
  const [state, setFullState] = useState<FormState>({
    name: "",
    email: "",
    role: "viewer",
    notifications: true,
  });

  // Every update must spread the previous state
  const setState = useCallback(
    (patch: Partial<FormState>) =>
      setFullState((prev) => ({ ...prev, ...patch })),
    []
  );

  return (
    <form style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
      <input
        value={state.name}
        onChange={(e) => setState({ name: e.target.value })}
        placeholder="Name"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <input
        value={state.email}
        onChange={(e) => setState({ email: e.target.value })}
        placeholder="Email"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <select
        value={state.role}
        onChange={(e) => setState({ role: e.target.value })}
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={state.notifications}
          onChange={(e) => setState({ notifications: e.target.checked })}
        />
        Email notifications
      </label>
      <pre style={{ background: "#f8fafc", padding: 12, borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </form>
  );
}
```

You have to create the merging `setState` wrapper yourself. If another developer on your team forgets the wrapper and calls `setFullState` directly with a partial object, fields silently disappear.

### With useSetState

[`useSetState`](https://reactuse.com/state/useSetState/) works like the class component `setState` -- pass a partial object and it merges into the existing state automatically.

```tsx
import { useSetState } from "@reactuses/core";

interface FormState {
  name: string;
  email: string;
  role: string;
  notifications: boolean;
}

function SettingsForm() {
  const [state, setState] = useSetState<FormState>({
    name: "",
    email: "",
    role: "viewer",
    notifications: true,
  });

  return (
    <form style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
      <input
        value={state.name}
        onChange={(e) => setState({ name: e.target.value })}
        placeholder="Name"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <input
        value={state.email}
        onChange={(e) => setState({ email: e.target.value })}
        placeholder="Email"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <select
        value={state.role}
        onChange={(e) => setState({ role: e.target.value })}
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={state.notifications}
          onChange={(e) => setState({ notifications: e.target.checked })}
        />
        Email notifications
      </label>
      <pre style={{ background: "#f8fafc", padding: 12, borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </form>
  );
}
```

The `setState` returned by the hook accepts partial objects and merges them. No wrapper function needed, no risk of accidentally replacing the entire state.

## Putting It All Together: A Settings Panel

These hooks compose naturally. Here is a settings panel that uses all seven:

```tsx
import {
  useControlled,
  usePrevious,
  useDebounce,
  useThrottle,
  useCycleList,
  useCounter,
  useSetState,
} from "@reactuses/core";
import { useState } from "react";

// A controlled/uncontrolled search input
function SearchInput({
  value,
  defaultValue,
  onChange,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
}) {
  const [currentValue, setCurrentValue] = useControlled({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });

  return (
    <input
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      placeholder="Search settings..."
      style={{
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        width: "100%",
        fontSize: 14,
      }}
    />
  );
}

function SettingsPanel() {
  // Search with debounce
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const prevSearch = usePrevious(debouncedSearch);

  // Theme cycling
  const [theme, { next: nextTheme }] = useCycleList([
    "light",
    "dark",
    "system",
  ]);

  // Font size with counter
  const [fontSize, { inc: fontUp, dec: fontDown, reset: fontReset }] =
    useCounter(16, { min: 12, max: 24 });

  // Throttled live preview
  const throttledFontSize = useThrottle(fontSize, 150);

  // Form state with merge
  const [settings, setSettings] = useSetState({
    username: "",
    email: "",
    notifications: true,
    language: "en",
  });

  const themeColors: Record<string, { bg: string; text: string }> = {
    light: { bg: "#ffffff", text: "#1e293b" },
    dark: { bg: "#1e293b", text: "#f8fafc" },
    system: { bg: "#f1f5f9", text: "#334155" },
  };

  const allSettings = [
    "username",
    "email",
    "notifications",
    "language",
    "theme",
    "font size",
  ];

  const filtered = debouncedSearch
    ? allSettings.filter((s) =>
        s.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : allSettings;

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 500,
        margin: "0 auto",
        background: themeColors[theme].bg,
        color: themeColors[theme].text,
        borderRadius: 12,
        transition: "all 0.3s",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Settings</h2>

      {/* Controlled search input */}
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      {prevSearch && prevSearch !== debouncedSearch && (
        <p style={{ fontSize: 12, opacity: 0.6, margin: "4px 0" }}>
          Changed from "{prevSearch}" to "{debouncedSearch}"
        </p>
      )}

      <p style={{ fontSize: 12, opacity: 0.6 }}>
        Showing {filtered.length} of {allSettings.length} settings
      </p>

      {/* Theme toggle */}
      {filtered.includes("theme") && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid rgba(128,128,128,0.2)",
          }}
        >
          <span>Theme</span>
          <button
            onClick={nextTheme}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid rgba(128,128,128,0.3)",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {theme}
          </button>
        </div>
      )}

      {/* Font size counter */}
      {filtered.includes("font size") && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid rgba(128,128,128,0.2)",
          }}
        >
          <span>Font size</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => fontDown()}>-</button>
            <span style={{ fontWeight: 600 }}>{fontSize}px</span>
            <button onClick={() => fontUp()}>+</button>
            <button
              onClick={fontReset}
              style={{ fontSize: 12, color: "inherit", opacity: 0.6 }}
            >
              reset
            </button>
          </div>
        </div>
      )}

      {/* Live preview with throttled font size */}
      <p
        style={{
          fontSize: throttledFontSize,
          padding: "12px 0",
          transition: "font-size 0.15s",
          borderBottom: "1px solid rgba(128,128,128,0.2)",
        }}
      >
        Preview text at {throttledFontSize}px
      </p>

      {/* Merged state form fields */}
      {filtered.includes("username") && (
        <div style={{ padding: "12px 0" }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Username
          </label>
          <input
            value={settings.username}
            onChange={(e) => setSettings({ username: e.target.value })}
            style={{
              padding: "6px 10px",
              border: "1px solid rgba(128,128,128,0.3)",
              borderRadius: 4,
              width: "100%",
              background: "transparent",
              color: "inherit",
            }}
          />
        </div>
      )}

      {filtered.includes("notifications") && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 0",
          }}
        >
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) =>
              setSettings({ notifications: e.target.checked })
            }
          />
          Enable notifications
        </label>
      )}
    </div>
  );
}
```

Seven hooks, zero conflicts. `useControlled` powers the search input so it can also be used uncontrolled elsewhere. `useDebounce` prevents the filter from running on every keystroke. `usePrevious` shows what the search was before. `useCycleList` handles the theme toggle. `useCounter` manages the font size with bounds. `useThrottle` smooths the live preview updates. `useSetState` keeps the form fields in a single merged-state object. Each hook handles one concern, and they compose without any special glue code.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [`useControlled`](https://reactuse.com/state/useControlled/) -- Build components that work both controlled and uncontrolled
- [`usePrevious`](https://reactuse.com/state/usePrevious/) -- Access the value from the previous render
- [`useDebounce`](https://reactuse.com/state/useDebounce/) -- Debounce any value by a specified delay
- [`useThrottle`](https://reactuse.com/state/useThrottle/) -- Throttle any value to update at most once per interval
- [`useCycleList`](https://reactuse.com/state/useCycleList/) -- Cycle through an array of values with next/prev
- [`useCounter`](https://reactuse.com/state/useCounter/) -- Numeric state with inc/dec/reset and optional min/max
- [`useSetState`](https://reactuse.com/state/useSetState/) -- Merge partial objects into state like class-component setState
- [`useBoolean`](https://reactuse.com/state/useBoolean/) -- Boolean state with toggle, setTrue, setFalse
- [`useToggle`](https://reactuse.com/state/useToggle/) -- Toggle between two values
- [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) -- Persist state to localStorage with automatic serialization

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
