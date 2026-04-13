---
title: "Building Immersive Web Apps in React: Fullscreen, Wake Lock, and Notifications"
description: "Learn how to build immersive React experiences with fullscreen, screen wake lock, web notifications, safe area insets, and dynamic title and favicon hooks from ReactUse."
slug: react-immersive-web-apps
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, fullscreen, pwa, tutorial]
keywords: [react fullscreen, useFullscreen, useWakeLock, useWebNotification, useScreenSafeArea, useFavicon, useTitle, react pwa, react immersive, react notification]
image: /img/og.png
---

# Building Immersive Web Apps in React: Fullscreen, Wake Lock, and Notifications

The web has quietly grown into a real application platform. A reading app should be able to dim the chrome and fill the screen. A video player should keep the screen awake while playing. A timer should buzz the user even when the tab is in the background. A recipe app should respect the curve of an iPhone's notch and the home indicator at the bottom. None of these are exotic features anymore -- they are baseline expectations -- yet wiring each one up in React is its own small adventure of vendor prefixes, permission flows, lifecycle gotchas, and SSR landmines.

<!-- truncate -->

This post walks through six browser capabilities that turn a React app from "page in a browser" into something that feels like an installed application: entering and exiting fullscreen, keeping the screen awake during long tasks, sending OS-level notifications, respecting safe area insets on notched devices, and updating the title and favicon to reflect application state. As always, we will start each section with the manual implementation so you understand what is happening, then swap it out for a focused hook from [ReactUse](https://reactuse.com). At the end, we will combine all six into a focus-mode reading view that goes fullscreen, locks the screen awake, pings the user with a notification when they have been reading too long, and respects the device's safe area.

## 1. Fullscreen Without the Vendor Prefixes

### The Manual Way

The Fullscreen API is one of the oldest examples of why feature detection is hard. Different browsers exposed `requestFullscreen`, `webkitRequestFullscreen`, `mozRequestFullScreen`, and `msRequestFullscreen` -- and a corresponding tangle of `fullscreenchange`, `webkitfullscreenchange`, `mozfullscreenchange`, `MSFullscreenChange` events. Even in 2026 the prefixes have not entirely faded:

```tsx
function ManualFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      setIsFullscreen(Boolean(fsEl));
    };
    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];
    events.forEach((e) => document.addEventListener(e, handleChange));
    return () =>
      events.forEach((e) => document.removeEventListener(e, handleChange));
  }, []);

  const enter = () => {
    const el = elementRef.current as any;
    if (!el) return;
    (
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen
    )?.call(el);
  };

  const exit = () => {
    const doc = document as any;
    (
      doc.exitFullscreen ||
      doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.msExitFullscreen
    )?.call(doc);
  };

  return (
    <div ref={elementRef}>
      <button onClick={isFullscreen ? exit : enter}>
        {isFullscreen ? "Exit fullscreen" : "Go fullscreen"}
      </button>
    </div>
  );
}
```

This works. It is also forty lines of casts, optional chaining, and prefix juggling, none of which add value to the feature you actually wanted. And it is silently incomplete -- it does not detect when the browser cannot enter fullscreen at all (locked-down kiosks, embedded iframes without `allow="fullscreen"`, etc.), so your button just appears to do nothing.

### The ReactUse Way: useFullscreen

`useFullscreen` wraps the [screenfull](https://github.com/sindresorhus/screenfull) library underneath and gives you a single tuple:

```tsx
import { useRef } from "react";
import { useFullscreen } from "@reactuses/core";

function FullscreenViewer() {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, { toggleFullscreen, isEnabled }] = useFullscreen(ref, {
    onEnter: () => console.log("Entered fullscreen"),
    onExit: () => console.log("Exited fullscreen"),
  });

  if (!isEnabled) {
    return <p>Fullscreen is not available in this environment.</p>;
  }

  return (
    <div
      ref={ref}
      style={{
        background: isFullscreen ? "#000" : "#f1f5f9",
        color: isFullscreen ? "#fff" : "#0f172a",
        padding: 40,
        minHeight: 200,
      }}
    >
      <h2>{isFullscreen ? "Focus Mode" : "Click to enter focus mode"}</h2>
      <button onClick={toggleFullscreen}>
        {isFullscreen ? "Exit" : "Enter"} fullscreen
      </button>
    </div>
  );
}
```

A few things worth pointing out:

1. **`isEnabled`** tells you whether fullscreen is even possible in the current context. If you are in an iframe without permission, you can render a fallback instead of a button that lies.
2. **`onEnter`/`onExit` callbacks** let you play a sound, dim other UI, or fire analytics without managing your own listeners.
3. **`toggleFullscreen`** is stable across renders (the hook uses `useEvent` internally), so you can pass it to memoized children without invalidation.

The same pattern works for any element: a video, an article, an editor pane. Just pass the ref and you get the full lifecycle for free.

## 2. Keeping the Screen Awake

### The Manual Way

The Screen Wake Lock API is the right tool for any flow where the user is watching, listening, reading, or otherwise not touching the screen for a while. Without it, mobile devices will dim and lock after the OS-defined timeout. With it, you can request a sentinel that keeps the screen on while you hold it.

The catch is that wake locks can be released by the system at any time, and they must be re-requested when the page becomes visible again -- if a user backgrounds your tab and then comes back, you have to ask for the lock all over again, or the screen will start dimming.

```tsx
function ManualWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    const request = async () => {
      try {
        sentinelRef.current = await navigator.wakeLock.request("screen");
        setActive(true);
        sentinelRef.current.addEventListener("release", () => setActive(false));
      } catch (e) {
        console.error("Wake lock failed:", e);
      }
    };

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        sentinelRef.current === null
      ) {
        request();
      }
    };

    request();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      sentinelRef.current?.release();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <span>Screen lock: {active ? "on" : "off"}</span>;
}
```

This is correct, but you have already encoded three subtle things: feature detection for `'wakeLock' in navigator`, the request flow with try/catch, and the visibility-change re-request. Miss any of them and the lock silently stops working in the wild.

### The ReactUse Way: useWakeLock

`useWakeLock` returns a small object with five members and handles the visibility dance for you:

```tsx
import { useEffect } from "react";
import { useWakeLock } from "@reactuses/core";

function VideoPlayer({ playing }: { playing: boolean }) {
  const { isSupported, isActive, request, release } = useWakeLock({
    onRequest: () => console.log("Wake lock acquired"),
    onRelease: () => console.log("Wake lock released"),
    onError: (e) => console.error(e),
  });

  useEffect(() => {
    if (!isSupported) return;
    if (playing) request();
    else release();
  }, [playing, isSupported, request, release]);

  return (
    <p>
      {isSupported
        ? `Wake lock is ${isActive ? "active" : "idle"}`
        : "Wake lock not supported in this browser"}
    </p>
  );
}
```

What you get without writing it:

- **Visibility re-request**. If the user backgrounds your tab while a video is playing and then comes back, the lock is automatically reacquired.
- **Suspended request**. If you call `request()` while the page is hidden, the hook remembers and acquires it the moment the page becomes visible -- no error, no missed lock.
- **Stable callbacks**. Pass `onRequest`/`onRelease`/`onError` once and they run every time the underlying lifecycle event happens, even if the component re-renders.
- **Force request**. `forceRequest()` is also exposed for cases where you want to skip the visibility check (rare, but useful for kiosk-style apps).

## 3. OS-Level Notifications

### The Manual Way

Web Notifications are simple in principle (`new Notification("title")`) and tedious in practice. You have to ask for permission first, you have to handle the case where the user has denied permission permanently, you have to feature-detect, and you have to remember to close any notifications your component opens when it unmounts -- otherwise you can leave stale toasts hanging around the OS even after the user has closed the page.

```tsx
function ManualNotification({ message }: { message: string }) {
  const notifRef = useRef<Notification | null>(null);

  const send = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "denied") return;
    if (Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      if (result !== "granted") return;
    }
    notifRef.current?.close();
    notifRef.current = new Notification("Reminder", { body: message });
  };

  useEffect(() => {
    return () => notifRef.current?.close();
  }, []);

  return <button onClick={send}>Notify me</button>;
}
```

This is roughly the minimum viable implementation. It still leaks if the user backgrounds the page mid-flow.

### The ReactUse Way: useWebNotification

`useWebNotification` packages the permission flow, the open/close lifecycle, and SSR-safety into a single hook:

```tsx
import { useWebNotification } from "@reactuses/core";

function PomodoroTimer() {
  const { isSupported, show, close, ensurePermissions } =
    useWebNotification(true); // request permission on mount

  const onSessionEnd = async () => {
    const granted = await ensurePermissions();
    if (!granted) {
      alert("Pomodoro session complete!"); // graceful fallback
      return;
    }
    show("Time's up!", {
      body: "Take a 5 minute break.",
      icon: "/icons/tomato.png",
      tag: "pomodoro-session",
    });
  };

  return (
    <div>
      <button onClick={onSessionEnd} disabled={!isSupported}>
        End session
      </button>
      <button onClick={close}>Dismiss</button>
    </div>
  );
}
```

The first argument controls whether the hook should request permission immediately on mount or wait for an explicit `ensurePermissions()` call. Most apps want the lazy version -- ask for permission only after the user has clicked something -- because otherwise you trigger the browser's permission dialog the instant your component appears, which users find off-putting.

The hook also auto-closes the most recent notification on unmount, so navigating away from the timer cleans up any toasts it produced.

## 4. Respecting the Notch and Home Bar

### The Manual Way

iPhones with a notch and Android phones with a punch hole have safe-area insets. CSS exposes them as `env(safe-area-inset-top)`, etc., but only after you set `viewport-fit=cover` in the meta tag. Reading the values from JavaScript is fiddly:

```tsx
function ManualSafeArea() {
  const [insets, setInsets] = useState({
    top: "0px",
    right: "0px",
    bottom: "0px",
    left: "0px",
  });

  useEffect(() => {
    const compute = () => {
      const root = document.documentElement;
      root.style.setProperty("--sa-top", "env(safe-area-inset-top, 0px)");
      root.style.setProperty("--sa-right", "env(safe-area-inset-right, 0px)");
      root.style.setProperty("--sa-bottom", "env(safe-area-inset-bottom, 0px)");
      root.style.setProperty("--sa-left", "env(safe-area-inset-left, 0px)");
      const cs = getComputedStyle(root);
      setInsets({
        top: cs.getPropertyValue("--sa-top"),
        right: cs.getPropertyValue("--sa-right"),
        bottom: cs.getPropertyValue("--sa-bottom"),
        left: cs.getPropertyValue("--sa-left"),
      });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return <div style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} />;
}
```

That is a lot of plumbing for what is conceptually four numbers.

### The ReactUse Way: useScreenSafeArea

`useScreenSafeArea` returns the four insets directly, debounced and reactive to resize:

```tsx
import { useScreenSafeArea } from "@reactuses/core";

function SafeAwareLayout({ children }: { children: React.ReactNode }) {
  const [top, right, bottom, left] = useScreenSafeArea();

  return (
    <div
      style={{
        paddingTop: top || 0,
        paddingRight: right || 0,
        paddingBottom: bottom || 0,
        paddingLeft: left || 0,
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
```

Under the hood, the hook installs CSS variables on `document.documentElement` so the same values are also available to any plain CSS in your stylesheet -- you can use `var(--reactuse-safe-area-top)` in stylesheets that have nothing to do with React. The JS values let you do conditional padding, and the CSS variables let your design system stay declarative.

## 5. Title and Favicon as State

### The Manual Way

Updating the document title and favicon are imperative side effects in DOM-land but conceptually pure derived state in React-land. The naive approach is one effect per change:

```tsx
function ManualTitle({ unread }: { unread: number }) {
  useEffect(() => {
    const original = document.title;
    document.title = unread > 0 ? `(${unread}) Inbox` : "Inbox";
    return () => {
      document.title = original;
    };
  }, [unread]);
  return null;
}

function ManualFavicon({ src }: { src: string }) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) return;
    const previous = link.href;
    link.href = src;
    return () => {
      link.href = previous;
    };
  }, [src]);
  return null;
}
```

Two effects, two cleanup functions, two opportunities to forget the cleanup and ship a stale title.

### The ReactUse Way: useTitle and useFavicon

```tsx
import { useTitle, useFavicon } from "@reactuses/core";

function InboxStatus({ unread }: { unread: number }) {
  useTitle(unread > 0 ? `(${unread}) Inbox` : "Inbox");
  useFavicon(unread > 0 ? "/icons/inbox-unread.svg" : "/icons/inbox.svg");
  return null;
}
```

That is the whole component. Both hooks treat the title/favicon as derived state, so they update whenever the input changes and clean up automatically. The favicon hook even handles the case where multiple `<link rel="icon">` tags exist in the head (modern apps usually have one for `image/svg+xml` and one for `image/png`) by updating all of them.

## Putting It All Together: Focus-Mode Reading View

Now we combine all six hooks into a focus-mode reading view. The user opens an article, hits "Focus", and the app:

1. Goes fullscreen
2. Locks the screen awake so the device does not dim mid-read
3. Updates the title with how long they have been reading
4. Changes the favicon to a "do not disturb" indicator
5. Respects the safe area on the device
6. Sends a notification after 25 minutes suggesting a break

```tsx
import { useEffect, useRef, useState } from "react";
import {
  useFullscreen,
  useWakeLock,
  useWebNotification,
  useScreenSafeArea,
  useTitle,
  useFavicon,
} from "@reactuses/core";

const FOCUS_BREAK_MS = 25 * 60 * 1000;

function FocusReader({ article }: { article: { title: string; body: string } }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);

  const [isFullscreen, { toggleFullscreen, isEnabled: fsEnabled }] =
    useFullscreen(containerRef, {
      onExit: () => setIsFocus(false),
    });

  const wakeLock = useWakeLock();
  const notif = useWebNotification();
  const [top, right, bottom, left] = useScreenSafeArea();

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const timer = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  useTitle(isFocus ? `${timer} -- ${article.title}` : article.title);
  useFavicon(isFocus ? "/icons/dnd.svg" : "/icons/book.svg");

  useEffect(() => {
    if (!isFocus) return;
    startedAt.current = Date.now();
    const id = setInterval(() => {
      if (startedAt.current) {
        setElapsed(Date.now() - startedAt.current);
      }
    }, 1000);
    return () => {
      clearInterval(id);
      startedAt.current = null;
      setElapsed(0);
    };
  }, [isFocus]);

  useEffect(() => {
    if (!isFocus || elapsed < FOCUS_BREAK_MS) return;
    let cancelled = false;
    (async () => {
      const granted = await notif.ensurePermissions();
      if (cancelled || !granted) return;
      notif.show("Time for a break", {
        body: "You've been reading for 25 minutes. Stretch, blink, breathe.",
        tag: "focus-break",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocus, elapsed, notif]);

  const enterFocus = async () => {
    if (!fsEnabled) {
      setIsFocus(true);
      await wakeLock.request();
      return;
    }
    setIsFocus(true);
    toggleFullscreen();
    await wakeLock.request();
  };

  const exitFocus = () => {
    if (isFullscreen) toggleFullscreen();
    wakeLock.release();
    setIsFocus(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        background: isFocus ? "#0f172a" : "#ffffff",
        color: isFocus ? "#f1f5f9" : "#0f172a",
        minHeight: "100vh",
        paddingTop: top || 24,
        paddingRight: right || 24,
        paddingBottom: bottom || 24,
        paddingLeft: left || 24,
        transition: "background 200ms ease, color 200ms ease",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>{article.title}</h1>
        {isFocus ? (
          <button onClick={exitFocus}>Exit focus ({timer})</button>
        ) : (
          <button onClick={enterFocus}>Focus mode</button>
        )}
      </header>

      <article style={{ maxWidth: 680, margin: "0 auto", lineHeight: 1.7 }}>
        {article.body}
      </article>

      {isFocus && wakeLock.isSupported && (
        <p
          style={{
            position: "fixed",
            bottom: bottom || 12,
            right: right || 12,
            fontSize: 12,
            opacity: 0.6,
            margin: 0,
          }}
        >
          Screen lock: {wakeLock.isActive ? "on" : "off"}
        </p>
      )}
    </div>
  );
}
```

Six hooks, all doing one thing each:

- **`useFullscreen`** turns the container into a true fullscreen element on demand
- **`useWakeLock`** keeps the screen alive while the user is reading
- **`useWebNotification`** pings them after 25 minutes of focus time
- **`useScreenSafeArea`** keeps content out from under the notch
- **`useTitle`** turns the document title into a live timer
- **`useFavicon`** swaps to a "do not disturb" indicator while focus mode is on

None of the hooks know about each other, but they compose cleanly because each one owns a single browser concern. You can add a seventh capability tomorrow (like network-awareness or device orientation) without touching the existing wiring.

## A Note on Permissions

Three of these APIs (notifications, wake lock, fullscreen) require user gestures or explicit permission grants. The hooks expose `isSupported` flags so you can render fallbacks instead of broken buttons, and they accept callbacks so you can gracefully recover from rejections. The pattern is always the same: feature-detect, ask only when the user has expressed intent, and fall back to a non-API alternative if denied.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [`useFullscreen`](https://reactuse.com/browser/useFullscreen/) -- Enter, exit, and toggle fullscreen mode on any element
- [`useWakeLock`](https://reactuse.com/browser/useWakeLock/) -- Keep the screen awake with auto re-request on visibility change
- [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) -- Send OS-level notifications with permission flow handled
- [`useScreenSafeArea`](https://reactuse.com/browser/useScreenSafeArea/) -- Read safe area insets reactively
- [`useTitle`](https://reactuse.com/browser/useTitle/) -- Set the document title declaratively
- [`useFavicon`](https://reactuse.com/browser/useFavicon/) -- Update the favicon based on application state
- [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) -- Track whether the document is visible to the user
- [`usePageLeave`](https://reactuse.com/browser/usePageLeave/) -- Detect when the cursor leaves the page area
- [`useSupported`](https://reactuse.com/state/useSupported/) -- Reactively check whether a browser API is available

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
