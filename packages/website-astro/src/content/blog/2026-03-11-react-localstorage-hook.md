---
title: "How to Persist State in React with a localStorage Hook"
description: "Learn how to persist React state to localStorage using the useLocalStorage hook. Covers automatic serialization, SSR safety, cross-tab sync, and custom serializers."
slug: react-localstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, useLocalStorage, state-management]
keywords: [react localstorage hook, useLocalStorage react, persist state react, react localstorage]
image: /img/og.png
---

# How to Persist State in React with a localStorage Hook

A React localStorage hook is a custom hook that synchronizes React component state with the browser's `localStorage` API, allowing data to persist across page reloads and browser sessions. Instead of manually reading, writing, and parsing stored values, the hook provides a `useState`-like interface that handles serialization, error recovery, and SSR safety automatically.

<!-- truncate -->

## The Problem

React state is ephemeral. When a user refreshes the page or closes the browser tab, any state stored in `useState` is lost. For things like user preferences, form drafts, shopping cart items, or authentication tokens, this is a poor experience.

The browser's `localStorage` API offers a simple persistence layer, but integrating it with React introduces several challenges:

1. Values must be serialized and deserialized (localStorage only stores strings)
2. Reading from localStorage during server-side rendering causes errors
3. Keeping React state and localStorage in sync requires careful effect management
4. Multiple tabs can modify the same key, leading to stale state

## The Manual Approach

Here is how developers typically wire up localStorage persistence by hand:

```tsx
import { useEffect, useState } from "react";

function useManualLocalStorage(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return defaultValue;
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

This covers the basics, but it still has gaps. It does not handle serialization errors, does not listen for cross-tab changes via the `storage` event, does not support custom serializers for complex data types, and requires you to duplicate this logic everywhere you need persistence.

## The Better Way: useLocalStorage

[ReactUse](https://reactuse.com) provides a `useLocalStorage` hook that handles all of the above in a single import:

```tsx
import { useLocalStorage } from "@reactuses/core";

function ThemeSettings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>Dark Mode</button>
      <button onClick={() => setTheme("light")}>Light Mode</button>
    </div>
  );
}
```

The hook returns a tuple identical to `useState` -- a current value and a setter function. Under the hood it reads from localStorage on mount, writes on every update, and gracefully falls back to the default value during SSR or when localStorage is unavailable.

It works with strings, numbers, booleans, and objects. Type inference is automatic:

```tsx
import { useLocalStorage } from "@reactuses/core";

// Type is inferred as number | null
const [count, setCount] = useLocalStorage("visit-count", 0);

// Type is inferred as boolean | null
const [accepted, setAccepted] = useLocalStorage("cookie-consent", false);

// Type is inferred as { name: string; role: string } | null
const [user, setUser] = useLocalStorage("user", { name: "", role: "viewer" });
```

## Advanced Usage

### Custom Serializer

By default, `useLocalStorage` uses `JSON.parse` and `JSON.stringify`. If you need to store data in a different format -- for example, dates or custom classes -- you can provide a custom serializer:

```tsx
import { useLocalStorage } from "@reactuses/core";

const [lastVisit, setLastVisit] = useLocalStorage("last-visit", new Date(), {
  serializer: {
    read: (raw: string) => new Date(raw),
    write: (value: Date) => value.toISOString(),
  },
});
```

### Cross-Tab Synchronization

The hook listens to the browser's `storage` event by default, so if a user updates a value in one tab, all other open tabs reflect the change immediately. You can disable this if needed:

```tsx
const [token, setToken] = useLocalStorage("auth-token", "", {
  listenToStorageChanges: false,
});
```

### SSR Safety

Because `useLocalStorage` checks for browser availability before accessing `localStorage`, it works out of the box with Next.js, Remix, and any other SSR framework. During server rendering, the hook returns the default value without throwing.

### Error Handling

If localStorage is full, blocked by browser policy, or contains corrupted data, the hook catches errors gracefully. You can supply a custom error handler:

```tsx
const [data, setData] = useLocalStorage("app-data", null, {
  onError: (error) => {
    console.warn("Storage error:", error);
    // Send to your error tracking service
  },
});
```

## Common Use Cases

- **Theme and appearance preferences** -- persist dark/light mode across sessions
- **Form drafts** -- save in-progress form data so users don't lose work on refresh
- **Authentication tokens** -- store JWT or session tokens between page loads
- **Feature flags and onboarding state** -- remember which tooltips a user has dismissed
- **Shopping cart contents** -- keep cart items intact without a backend
- **Language and locale settings** -- remember a user's preferred language

## Installation

```bash
npm i @reactuses/core
```

Then import the hook:

```tsx
import { useLocalStorage } from "@reactuses/core";
```

## Related Hooks

- [useLocalStorage documentation](https://reactuse.com/state/useLocalStorage/) -- full API reference and live demo
- [useSessionStorage](https://reactuse.com/state/useSessionStorage/) -- same API, but data clears when the tab is closed
- [useStorage](https://reactuse.com/state/useStorage/) -- a generic hook that works with any Storage-compatible backend

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
