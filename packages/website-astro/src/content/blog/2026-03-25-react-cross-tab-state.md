---
title: "Real-time React: Syncing State Across Browser Tabs"
description: "Learn how to keep state synchronized across browser tabs in React using BroadcastChannel, localStorage events, and hooks from ReactUse."
slug: react-cross-tab-state
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, state-management, broadcast-channel, tutorial]
keywords: [react sync tabs, BroadcastChannel react, cross tab state, react localStorage sync, react multi tab, useBroadcastChannel]
image: /img/og.png
---

# Real-time React: Syncing State Across Browser Tabs

Your user logs out in one tab. In another tab, they are still browsing authenticated content. They change the theme to dark mode, but the other three tabs stay light. They add an item to their cart, switch tabs, and the cart count shows zero. These are not edge cases — they are everyday realities of multi-tab browsing, and most React applications handle them poorly or not at all.

<!-- truncate -->

Browsers do not share React state between tabs by default. Each tab runs its own JavaScript context with its own component tree, its own state, and its own memory. Yet users expect a seamless experience. When something changes in one tab, they expect every tab to reflect that change immediately.

In this article, we will explore the browser APIs that make cross-tab communication possible, look at the manual approach and its pitfalls, and then see how hooks from [ReactUse](https://reactuse.com) reduce all of that complexity to a few lines of code.

## Two Browser APIs for Cross-Tab Communication

Before reaching for any library, it helps to understand what the browser gives us natively.

### BroadcastChannel API

The [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) lets you send messages between browsing contexts — tabs, windows, iframes — that share the same origin. You create a channel by name, and any context that opens a channel with the same name can send and receive messages.

```tsx
// Tab A
const channel = new BroadcastChannel("my-app");
channel.postMessage({ type: "LOGOUT" });

// Tab B
const channel = new BroadcastChannel("my-app");
channel.onmessage = (event) => {
  if (event.data.type === "LOGOUT") {
    // redirect to login
  }
};
```

BroadcastChannel is fast, supports structured cloning (so you can send objects, arrays, and even `ArrayBuffer`), and does not touch persistent storage. It is purely in-memory messaging between contexts. The downside is that messages are fire-and-forget — if a tab is not open when the message is sent, it never receives it.

### Storage Events

When one tab writes to `localStorage`, every *other* tab on the same origin receives a `storage` event. This gives you cross-tab reactivity for free — but only for string-serializable data, and only through `localStorage` (not `sessionStorage`, which is scoped to a single tab).

```tsx
// Tab A writes
localStorage.setItem("theme", "dark");

// Tab B listens
window.addEventListener("storage", (event) => {
  if (event.key === "theme") {
    console.log("Theme changed to:", event.newValue); // "dark"
  }
});
```

Storage events have a major advantage: the data persists. If a user opens a new tab after the change was made, the new tab reads the current value from `localStorage` on mount. You get both reactivity and persistence.

## The Manual Approach — And Why It Gets Messy

Let us try to build cross-tab theme syncing from scratch. We need to:

1. Read the initial value from `localStorage`.
2. Parse it (everything in `localStorage` is a string).
3. Set up a `storage` event listener to detect changes from other tabs.
4. Serialize and write back when the local tab changes the value.
5. Clean up the listener on unmount.

```tsx
import { useState, useEffect, useCallback } from "react";

function useCrossTabTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem("app-theme");
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  // Listen for changes from other tabs
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === "app-theme" && event.newValue) {
        setThemeState(event.newValue as "light" | "dark");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Write to localStorage when local state changes
  const setTheme = useCallback((value: "light" | "dark") => {
    setThemeState(value);
    try {
      localStorage.setItem("app-theme", value);
    } catch {
      // storage full or unavailable
    }
  }, []);

  return [theme, setTheme] as const;
}
```

That is about 30 lines for a single string value. Now imagine doing this for auth tokens, user preferences, cart state, and notification counts. Each one needs its own serialization logic, error handling, and cleanup. And we have not even touched BroadcastChannel yet — if we want to send structured messages (not just key-value strings), we need a second communication layer with its own setup and teardown.

This is where well-designed hooks eliminate boilerplate without hiding the underlying concepts.

## useBroadcastChannel: Type-Safe Messaging Between Tabs

The [`useBroadcastChannel`](https://reactuse.com/browser/useBroadcastChannel/) hook from ReactUse wraps the BroadcastChannel API in a clean, declarative interface. It handles channel creation, message listening, cleanup on unmount, and even SSR safety — all in a single call.

```tsx
import { useBroadcastChannel } from "@reactuses/core";

function NotificationSync() {
  const { data, post, error } = useBroadcastChannel<{
    type: string;
    payload?: unknown;
  }>("my-app-notifications");

  // Send a message to all other tabs
  const broadcastLogout = () => {
    post({ type: "LOGOUT" });
  };

  // React to messages from other tabs
  useEffect(() => {
    if (data?.type === "LOGOUT") {
      // Clear local auth state and redirect
      authStore.clear();
      window.location.href = "/login";
    }
  }, [data]);

  return <button onClick={broadcastLogout}>Log out everywhere</button>;
}
```

The generic type parameter gives you full TypeScript safety for the message shape. No manual serialization — BroadcastChannel uses structured cloning natively. No cleanup code — the hook closes the channel when the component unmounts. And the `error` value lets you handle the rare case where BroadcastChannel is not supported.

## useLocalStorage: Automatic Cross-Tab Sync

For state that should persist *and* sync across tabs, [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) is the right tool. It works like `useState`, but the value is backed by `localStorage` and automatically stays in sync across all tabs via storage events.

```tsx
import { useLocalStorage } from "@reactuses/core";

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">(
    "app-theme",
    "light"
  );

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Current: {theme}
    </button>
  );
}
```

When `setTheme` is called in one tab, every other tab running this hook with the same key (`"app-theme"`) updates automatically. The hook handles JSON serialization, initial value fallback, SSR guards, and storage event subscription internally. You write one line of hook usage; the hook writes thirty lines of browser API code for you.

Contrast this with [`useSessionStorage`](https://reactuse.com/state/useSessionStorage/), which provides the same API but scopes the value to the current tab. Session storage does not fire cross-tab events and does not persist after the tab closes. Choose `useLocalStorage` when you want cross-tab sync; choose `useSessionStorage` when you want tab-isolated persistence.

## Practical Patterns

### Pattern 1: Syncing Auth State (Logout Everywhere)

One of the most critical cross-tab scenarios is authentication. When a user logs out in one tab, every other tab must react immediately — otherwise they might continue making authenticated requests that fail silently or expose stale data.

```tsx
import { useBroadcastChannel, useLocalStorage } from "@reactuses/core";

function useAuth() {
  const [token, setToken] = useLocalStorage<string | null>("auth-token", null);
  const { data, post } = useBroadcastChannel<{ type: "LOGOUT" | "LOGIN" }>(
    "auth-channel"
  );

  // Handle messages from other tabs
  useEffect(() => {
    if (data?.type === "LOGOUT") {
      setToken(null);
      window.location.href = "/login";
    }
  }, [data, setToken]);

  const login = (newToken: string) => {
    setToken(newToken);
    post({ type: "LOGIN" });
  };

  const logout = () => {
    setToken(null);
    post({ type: "LOGOUT" });
    window.location.href = "/login";
  };

  return { token, login, logout, isAuthenticated: token !== null };
}
```

This uses both hooks together: `useLocalStorage` persists the token and syncs it across tabs, while `useBroadcastChannel` sends an immediate imperative signal that triggers the redirect. The token sync via localStorage ensures any tab opened *after* the logout reads `null`. The broadcast ensures tabs open *during* the logout react instantly.

### Pattern 2: Syncing Theme Across Tabs

```tsx
import { useLocalStorage } from "@reactuses/core";
import { useEffect } from "react";

function useThemeSync() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">(
    "app-theme",
    "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme ?? "light");
  }, [theme]);

  return { theme: theme ?? "light", setTheme };
}
```

Because `useLocalStorage` already handles cross-tab sync, the `useEffect` fires in every tab whenever the theme changes — keeping the DOM attribute in sync everywhere.

### Pattern 3: Cart State in E-Commerce

Shopping cart data is a classic candidate for cross-tab sync. Users often browse products in multiple tabs and expect the cart to be consistent.

```tsx
import { useLocalStorage } from "@reactuses/core";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

function useCart() {
  const [items, setItems] = useLocalStorage<CartItem[]>("cart-items", []);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const current = prev ?? [];
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        return current.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
  };

  const totalItems = (items ?? []).reduce((sum, i) => sum + i.quantity, 0);

  return { items: items ?? [], addItem, removeItem, totalItems };
}
```

Add an item in Tab A, and the cart badge updates in Tab B instantly. No WebSocket, no polling, no server round-trip.

### Pattern 4: Leader Election

Sometimes you want only one tab to perform a task — polling an API, maintaining a WebSocket connection, or running a background sync. The [`useBroadcastChannel`](https://reactuse.com/browser/useBroadcastChannel/) hook provides the messaging layer for a simple leader election protocol.

```tsx
import { useBroadcastChannel } from "@reactuses/core";
import { useState, useEffect, useRef } from "react";

function useLeaderElection(channelName: string) {
  const [isLeader, setIsLeader] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));
  const { data, post } = useBroadcastChannel<{
    type: "CLAIM" | "HEARTBEAT" | "RELEASE";
    id: string;
  }>(channelName);

  useEffect(() => {
    // On mount, try to claim leadership
    post({ type: "CLAIM", id: idRef.current });
    const timer = setTimeout(() => setIsLeader(true), 200);

    return () => {
      clearTimeout(timer);
      post({ type: "RELEASE", id: idRef.current });
    };
  }, [post]);

  useEffect(() => {
    if (data?.type === "CLAIM" && data.id !== idRef.current) {
      // Another tab is claiming — compare IDs to break ties
      if (data.id > idRef.current) {
        setIsLeader(false);
      }
    }
  }, [data]);

  return isLeader;
}
```

Only the leader tab runs expensive operations. When it closes, it broadcasts a `RELEASE` message and another tab claims leadership.

## Optimizing Background Tabs

Cross-tab sync is only part of the picture. When a tab is in the background, you often want to pause expensive work — polling APIs, running animations, or processing data. Two hooks from ReactUse make this straightforward.

### useDocumentVisibility

[`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) returns the current visibility state of the document — `"visible"` or `"hidden"`. Use it to pause work when the tab is not visible.

```tsx
import { useDocumentVisibility } from "@reactuses/core";
import { useEffect, useState } from "react";

function usePolling(url: string, intervalMs: number) {
  const visibility = useDocumentVisibility();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (visibility === "hidden") return; // stop polling in background

    const fetchData = async () => {
      const res = await fetch(url);
      setData(await res.json());
    };

    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [url, intervalMs, visibility]);

  return data;
}
```

When the user switches away from the tab, the interval is cleared. When they switch back, a fresh interval starts. No wasted network requests while the tab is hidden.

### useWindowFocus

[`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) tracks whether the browser window itself has focus. This is subtler than visibility — a tab can be visible but unfocused (for example, when the user is interacting with DevTools or another window overlapping the browser).

```tsx
import { useWindowFocus } from "@reactuses/core";

function FocusIndicator() {
  const focused = useWindowFocus();

  return (
    <div>
      {focused
        ? "You are viewing this tab"
        : "Welcome back when you return!"}
    </div>
  );
}
```

Combine `useDocumentVisibility` and `useWindowFocus` for fine-grained control: pause non-critical work when the tab is hidden, and throttle less-critical work when the tab is visible but unfocused.

## Combining Hooks: A Cross-Tab Notification System

Let us put it all together. Here is a notification system that broadcasts alerts across tabs, persists unread counts in localStorage, and pauses updates when the tab is hidden.

```tsx
import {
  useBroadcastChannel,
  useLocalStorage,
  useDocumentVisibility,
  useOnline,
} from "@reactuses/core";
import { useEffect, useCallback } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

function useNotificationSync() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>(
    "app-notifications",
    []
  );
  const [unreadCount, setUnreadCount] = useLocalStorage<number>(
    "unread-count",
    0
  );
  const { data, post } = useBroadcastChannel<{
    type: "NEW_NOTIFICATION" | "MARK_READ" | "CLEAR_ALL";
    notification?: Notification;
  }>("notification-channel");
  const visibility = useDocumentVisibility();
  const isOnline = useOnline();

  // Handle messages from other tabs
  useEffect(() => {
    if (!data) return;

    switch (data.type) {
      case "NEW_NOTIFICATION":
        if (data.notification) {
          setNotifications((prev) => [data.notification!, ...(prev ?? [])]);
          setUnreadCount((prev) => (prev ?? 0) + 1);
        }
        break;
      case "MARK_READ":
        setUnreadCount(0);
        break;
      case "CLEAR_ALL":
        setNotifications([]);
        setUnreadCount(0);
        break;
    }
  }, [data, setNotifications, setUnreadCount]);

  const addNotification = useCallback(
    (title: string, body: string) => {
      const notification: Notification = {
        id: crypto.randomUUID(),
        title,
        body,
        timestamp: Date.now(),
      };
      setNotifications((prev) => [notification, ...(prev ?? [])]);
      setUnreadCount((prev) => (prev ?? 0) + 1);
      post({ type: "NEW_NOTIFICATION", notification });
    },
    [post, setNotifications, setUnreadCount]
  );

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    post({ type: "MARK_READ" });
  }, [post, setUnreadCount]);

  // Auto-mark as read when tab becomes visible
  useEffect(() => {
    if (visibility === "visible" && (unreadCount ?? 0) > 0) {
      markAllRead();
    }
  }, [visibility, unreadCount, markAllRead]);

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    addNotification,
    markAllRead,
    isOnline,
  };
}
```

This hook uses four ReactUse hooks working together:

- **`useBroadcastChannel`** sends real-time signals between tabs when notifications arrive or are read.
- **`useLocalStorage`** persists the notification list and unread count so new tabs pick up the current state.
- **`useDocumentVisibility`** automatically marks notifications as read when the user returns to a background tab.
- **`useOnline`** (via [`useOnline`](https://reactuse.com/browser/useOnline/)) exposes the network status so the UI can indicate when the app is offline and notifications may be delayed.

Each hook handles one concern. Composed together, they form a complete system with persistence, real-time sync, visibility awareness, and network status — in under 70 lines.

## When to Use Which Approach

| Scenario | Recommended Hook | Why |
|---|---|---|
| Persisted state that syncs across tabs | `useLocalStorage` | Data survives refresh; storage events provide sync |
| Tab-scoped state that does not sync | `useSessionStorage` | Isolated per tab; no cross-tab events |
| Real-time imperative messages | `useBroadcastChannel` | Fast, supports structured data, no persistence overhead |
| Both persistence and instant messaging | `useLocalStorage` + `useBroadcastChannel` | Best of both: persist for new tabs, broadcast for open tabs |
| Pausing background work | `useDocumentVisibility` / `useWindowFocus` | Reduce unnecessary computation and network requests |

## Installation

```bash
npm install @reactuses/core
```

Or with your preferred package manager:

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

## Related Hooks

- [`useBroadcastChannel`](https://reactuse.com/browser/useBroadcastChannel/) — type-safe cross-tab messaging via the BroadcastChannel API
- [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) — persistent state with automatic cross-tab synchronization
- [`useSessionStorage`](https://reactuse.com/state/useSessionStorage/) — tab-scoped persistent state
- [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) — track whether the current tab is visible
- [`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) — track whether the browser window has focus
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) — declarative event listener management with automatic cleanup
- [`useOnline`](https://reactuse.com/browser/useOnline/) — reactive network connectivity status

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
