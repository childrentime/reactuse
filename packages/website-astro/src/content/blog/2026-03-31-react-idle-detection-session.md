---
title: "Building Idle Detection and Session Management in React"
description: "Learn how to detect user inactivity, manage sessions, and handle tab visibility in React using hooks from ReactUse."
slug: react-idle-detection-session
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, idle-detection, session-management, tutorial]
keywords: [react idle detection, useIdle, session timeout react, react tab visibility, useWakeLock, useDocumentVisibility, react session management]
image: /img/og.png
---

# Building Idle Detection and Session Management in React

Every application that deals with sensitive data -- banking dashboards, healthcare portals, admin panels -- needs to answer a deceptively simple question: *is the user still there?* If they walked away from their laptop with a patient record on screen, you should lock the session. If they switched to another tab during a long-running export, you might want to pause polling to save bandwidth. If they are watching a training video, the screen should stay awake. These are all facets of the same problem: understanding user presence and reacting to it.

<!-- truncate -->

In this post we will build four practical patterns from scratch, see exactly where the manual implementations get painful, and then replace them with concise hooks from [ReactUse](https://reactuse.com). By the end you will have production-ready solutions for session timeouts, background tab detection, screen wake locks, and return-to-tab notifications.

## 1. Session Timeout Warning with Idle Detection

### The Manual Approach

Detecting idle state means tracking every signal that the user is active -- mouse movement, keyboard input, touch events, scrolling -- and resetting a timer each time any of them fires. Here is a naive implementation:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";

function useManualIdle(timeoutMs: number) {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    setIdle(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIdle(true), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer(); // start the timer

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return idle;
}
```

This works for a demo but falls apart in production. You are missing `mousedown`, `pointerdown`, `wheel`, and `visibilitychange`. Every event fires `resetTimer`, which calls `setIdle(false)` even if you are already not idle -- causing unnecessary re-renders on every mouse pixel. There is no way to distinguish between "idle for 5 minutes" and "idle for 30 seconds" without adding more timers. And the timeout is not configurable without remounting the component.

### The Hook Solution: `useIdle`

[`useIdle`](https://reactuse.com/browser/useidle/) from ReactUse handles all of this in a single call:

```tsx
import { useIdle } from "@reactuses/core";

function SessionManager() {
  const idle = useIdle(5 * 60 * 1000); // 5 minutes

  return idle ? <SessionWarningDialog /> : null;
}
```

The hook listens to the right set of DOM events, debounces resets internally, and returns a stable boolean. No timer juggling, no forgotten event types.

### Building a Full Session Timeout Dialog

Let us combine `useIdle` with a countdown to build a real session warning:

```tsx
import { useCallback, useEffect, useState } from "react";
import { useIdle } from "@reactuses/core";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_DURATION = 60; // 60 seconds to respond

function SessionTimeoutGuard({ onLogout }: { onLogout: () => void }) {
  const idle = useIdle(IDLE_TIMEOUT);
  const [countdown, setCountdown] = useState(WARNING_DURATION);

  useEffect(() => {
    if (!idle) {
      setCountdown(WARNING_DURATION);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [idle, onLogout]);

  if (!idle) return null;

  return (
    <div className="session-overlay">
      <div className="session-dialog">
        <h2>Are you still there?</h2>
        <p>
          Your session will expire in <strong>{countdown}</strong> seconds
          due to inactivity.
        </p>
        <p>Move your mouse or press any key to stay signed in.</p>
        <div className="session-progress">
          <div
            className="session-progress-bar"
            style={{ width: `${(countdown / WARNING_DURATION) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

Because `useIdle` returns `false` the moment the user moves their mouse, the dialog dismisses automatically -- no "Stay Signed In" button is needed (though you can add one). The countdown resets cleanly when `idle` flips back to `false`.

## 2. Pausing Background Work When the Tab Is Hidden

### The Manual Approach

Many apps poll an API on an interval. When the user switches to another tab, those requests are wasted bandwidth. Detecting tab visibility manually requires the Page Visibility API:

```tsx
import { useEffect, useState } from "react";

function useManualDocumentVisibility() {
  const [visibility, setVisibility] = useState<DocumentVisibilityState>(
    typeof document !== "undefined" ? document.visibilityState : "visible"
  );

  useEffect(() => {
    const handler = () => setVisibility(document.visibilityState);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visibility;
}
```

Simple enough for a single use, but you need to remember the SSR guard, and if you want to combine this with other signals (like window focus), you end up with multiple hooks and conditional logic scattered across your component.

### The Hook Solution: `useDocumentVisibility`

[`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) wraps the Page Visibility API with SSR safety built in:

```tsx
import { useDocumentVisibility } from "@reactuses/core";

function PollingDashboard() {
  const visibility = useDocumentVisibility();

  useEffect(() => {
    if (visibility === "hidden") return;

    const interval = setInterval(() => {
      fetch("/api/metrics").then(/* update state */);
    }, 10_000);

    return () => clearInterval(interval);
  }, [visibility]);

  return <Dashboard />;
}
```

When the user switches tabs, `visibility` changes to `"hidden"`, the effect cleans up, and polling stops. When they return, the effect re-runs and polling resumes. Zero wasted requests.

### A Smarter Data-Pausing Pattern

For a more robust approach, combine visibility with a data freshness indicator:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useDocumentVisibility } from "@reactuses/core";

interface DashboardData {
  metrics: Record<string, number>;
  updatedAt: number;
}

function SmartPollingDashboard() {
  const visibility = useDocumentVisibility();
  const [data, setData] = useState<DashboardData | null>(null);
  const [stale, setStale] = useState(false);
  const lastFetchRef = useRef(0);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setData(json);
    setStale(false);
    lastFetchRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (visibility === "hidden") {
      // Mark data as stale after 30 seconds in background
      const staleTimer = setTimeout(() => setStale(true), 30_000);
      return () => clearTimeout(staleTimer);
    }

    // Tab is visible -- fetch immediately if data is stale
    if (stale || Date.now() - lastFetchRef.current > 30_000) {
      fetchData();
    }

    // Resume normal polling
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [visibility, stale, fetchData]);

  return (
    <div>
      {stale && <div className="stale-banner">Data may be outdated</div>}
      {data && <MetricsGrid metrics={data.metrics} />}
    </div>
  );
}
```

This pattern gives you: no background polling, instant refresh on tab return, and a stale-data indicator if the user was away for a long time.

## 3. Keeping the Screen Awake

### The Manual Approach

The Screen Wake Lock API prevents the device screen from dimming or locking. It is critical for video players, presentation apps, recipe viewers, and any scenario where the user is looking at the screen but not touching the device:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";

function useManualWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setIsActive(true);

      wakeLockRef.current.addEventListener("release", () => {
        setIsActive(false);
      });
    } catch (err) {
      console.error("Wake Lock request failed:", err);
    }
  }, []);

  const release = useCallback(async () => {
    await wakeLockRef.current?.release();
    wakeLockRef.current = null;
    setIsActive(false);
  }, []);

  // Re-acquire when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isActive) {
        request();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive, request]);

  return { isActive, request, release };
}
```

The gotcha with the Wake Lock API is that the browser automatically releases the lock when the tab becomes hidden. You have to re-acquire it when the tab becomes visible again -- which is exactly the kind of edge case that gets forgotten in production.

### The Hook Solution: `useWakeLock`

[`useWakeLock`](https://reactuse.com/browser/usewakelock/) handles re-acquisition, error handling, and cleanup automatically:

```tsx
import { useWakeLock } from "@reactuses/core";

function PresentationMode() {
  const { isActive, request, release } = useWakeLock();

  return (
    <button onClick={() => (isActive ? release() : request("screen"))}>
      {isActive ? "Screen will stay on" : "Allow screen to sleep"}
    </button>
  );
}
```

### A "Keep Screen Awake" Toggle for Video Apps

Here is a complete component for a video or presentation app:

```tsx
import { useWakeLock, useDocumentVisibility } from "@reactuses/core";
import { useEffect } from "react";

function VideoPlayer({ src }: { src: string }) {
  const { isActive, request, release } = useWakeLock();
  const visibility = useDocumentVisibility();

  // Automatically request wake lock when playing
  const handlePlay = () => {
    if (!isActive) request("screen");
  };

  const handlePause = () => {
    if (isActive) release();
  };

  return (
    <div className="video-container">
      <video
        src={src}
        onPlay={handlePlay}
        onPause={handlePause}
        controls
      />
      <div className="video-controls">
        <span className={`wake-indicator ${isActive ? "active" : ""}`}>
          {isActive ? "Screen lock prevented" : "Screen may sleep"}
        </span>
        {visibility === "hidden" && (
          <span className="background-notice">
            Video is playing in a background tab
          </span>
        )}
      </div>
    </div>
  );
}
```

When the user hits play, the screen stays awake. When they pause or navigate away, the lock is released. The hook handles re-acquisition when the tab becomes visible again -- a detail that would take another 15 lines to implement manually.

## 4. Notify Users When They Return to the Tab

### The Manual Approach

Suppose your app finishes a long task while the user is in another tab. You want to send a browser notification so they know to come back. Doing this manually requires combining the Notification API with visibility and focus detection:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";

function useManualNotifyOnReturn() {
  const [focused, setFocused] = useState(true);
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const notify = useCallback(
    (title: string, body: string) => {
      if (focused) return; // user is already looking

      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification(title, { body });
          }
        });
      }
    },
    [focused]
  );

  return { focused, notify };
}
```

This misses edge cases: What if the user denied notification permission? What happens on mobile where `focus`/`blur` behave differently? What about cleaning up notifications when the user returns?

### The Hook Solution: `useWindowFocus` + `useWebNotification`

Combining [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) and [`useWebNotification`](https://reactuse.com/browser/usewebnotification/) gives you clean, declarative control:

```tsx
import { useWindowFocus, useWebNotification } from "@reactuses/core";

function TaskRunner() {
  const focused = useWindowFocus();
  const { isSupported, show, close } = useWebNotification({
    title: "",
    dir: "auto",
    lang: "en",
    tag: "task-complete",
  });

  const runTask = async () => {
    await performLongRunningTask();

    // Only notify if user is not looking at the tab
    if (!focused) {
      show({
        title: "Task Complete",
        body: "Your export is ready to download.",
      });
    }
  };

  return (
    <div>
      <button onClick={runTask}>Start Export</button>
      {!isSupported && (
        <p className="warning">
          Browser notifications are not supported.
        </p>
      )}
    </div>
  );
}
```

### A Complete Notification System

Let us build a more realistic notification center that queues events while the user is away and notifies them upon return:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useWindowFocus, useWebNotification } from "@reactuses/core";

interface AppEvent {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

function NotificationCenter() {
  const focused = useWindowFocus();
  const { isSupported, show } = useWebNotification({
    title: "",
    dir: "auto",
    lang: "en",
    tag: "app-notification",
  });
  const [missedEvents, setMissedEvents] = useState<AppEvent[]>([]);
  const focusedRef = useRef(focused);

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    focusedRef.current = focused;
  }, [focused]);

  // Simulate incoming events (replace with your WebSocket/SSE handler)
  const onServerEvent = useCallback((event: AppEvent) => {
    if (!focusedRef.current) {
      setMissedEvents((prev) => [...prev, event]);
    }
  }, []);

  // When user returns, show a summary notification
  useEffect(() => {
    if (focused && missedEvents.length > 0) {
      if (isSupported) {
        show({
          title: `${missedEvents.length} updates while you were away`,
          body: missedEvents.map((e) => e.title).join(", "),
        });
      }
      // Clear the queue -- user has seen the notification
      setMissedEvents([]);
    }
  }, [focused, missedEvents, isSupported, show]);

  return (
    <div className="notification-center">
      {missedEvents.length > 0 && (
        <div className="missed-badge">{missedEvents.length}</div>
      )}
    </div>
  );
}
```

This pattern is especially valuable for collaborative apps (like document editors or chat) where things happen while the user is in another tab.

## Combining Everything: A Presence-Aware App Shell

The real power comes from composing these hooks together. Here is an app shell that handles session management, background optimization, and user notifications in one place:

```tsx
import { useEffect, useCallback } from "react";
import {
  useIdle,
  useDocumentVisibility,
  useWindowFocus,
  useWakeLock,
  useWebNotification,
} from "@reactuses/core";

function AppShell({ children }: { children: React.ReactNode }) {
  const idle = useIdle(5 * 60 * 1000);
  const visibility = useDocumentVisibility();
  const focused = useWindowFocus();
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock();
  const { show: showNotification } = useWebNotification({
    title: "",
    dir: "auto",
    lang: "en",
    tag: "app-shell",
  });

  // Session timeout
  useEffect(() => {
    if (idle) {
      // Start logout countdown or lock screen
    }
  }, [idle]);

  // Pause expensive work in background
  useEffect(() => {
    if (visibility === "hidden") {
      // Pause animations, polling, WebSocket heartbeat frequency
    }
  }, [visibility]);

  // Notify on return
  useEffect(() => {
    if (focused) {
      // Check for pending notifications, refresh stale data
    }
  }, [focused]);

  const userState = idle
    ? "idle"
    : visibility === "hidden"
      ? "background"
      : "active";

  return (
    <div className="app-shell" data-user-state={userState}>
      {idle && <SessionTimeoutOverlay />}
      {children}
    </div>
  );
}
```

Five hooks, each doing one thing well, composed together to create a presence-aware application. No manual event listeners, no timer bookkeeping, no SSR guards.

## When to Use Each Hook

| Scenario | Hook | What It Detects |
|----------|------|-----------------|
| Session timeout | [`useIdle`](https://reactuse.com/browser/useidle/) | No user input for N milliseconds |
| Pause background work | [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) | Tab is hidden/visible |
| Detect tab switch | [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) | Window gained/lost focus |
| Keep screen awake | [`useWakeLock`](https://reactuse.com/browser/usewakelock/) | Screen Wake Lock API |
| Browser notifications | [`useWebNotification`](https://reactuse.com/browser/usewebnotification/) | Notification API |

## Installation

```bash
npm install @reactuses/core
# or
pnpm add @reactuses/core
# or
yarn add @reactuses/core
```

## Related Hooks

- [`useIdle`](https://reactuse.com/browser/useidle/) -- detect user inactivity after a configurable timeout
- [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) -- reactive `document.visibilityState`
- [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) -- track whether the window has focus
- [`useWakeLock`](https://reactuse.com/browser/usewakelock/) -- request and manage the Screen Wake Lock API
- [`useWebNotification`](https://reactuse.com/browser/usewebnotification/) -- declarative browser notifications
- [`useInterval`](https://reactuse.com/effect/useinterval/) -- declarative `setInterval` with pause/resume
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) -- attach DOM event listeners with automatic cleanup
- [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) -- persist session state across page reloads

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
