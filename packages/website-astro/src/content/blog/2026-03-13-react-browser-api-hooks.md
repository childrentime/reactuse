---
title: "10 Browser API Hooks Every React Developer Needs"
description: "Learn how to use browser APIs like Geolocation, Clipboard, Fullscreen, Media Queries, and more in React with clean, reusable hooks from ReactUse."
slug: react-browser-api-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, browser-api, tutorial]
keywords: [react browser api hooks, react geolocation hook, react clipboard hook, react fullscreen hook, react media query hook, useMediaQuery react, useClipboard react, useGeolocation react]
image: /img/og.png
date: 2026-03-13
---

# 10 Browser API Hooks Every React Developer Needs

Modern browsers ship with powerful APIs for geolocation, clipboard access, fullscreen mode, network status, and more. Using them directly in React is harder than it should be. You need to guard against server-side rendering, add and remove event listeners, handle permissions, and clean up on unmount. Multiply that by every browser API your app touches and you have a lot of repetitive, error-prone code.

<!-- truncate -->

ReactUse solves this with a library of 100+ hooks that wrap browser APIs into clean, SSR-safe, TypeScript-friendly interfaces. Every hook listed below checks for browser availability before accessing any API, so it works out of the box with Next.js, Remix, and any other SSR framework. Install once and import what you need:

```bash
npm i @reactuses/core
```

## 1. useMediaQuery -- Responsive Design

Respond to CSS media queries in JavaScript. The hook returns a boolean that updates in real time when the viewport changes.

```tsx
import { useMediaQuery } from "@reactuses/core";

function App() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return <div>{isMobile ? <MobileNav /> : <DesktopNav />}</div>;
}
```

Use it to conditionally render layouts, load different assets, or toggle features based on screen size without relying on CSS alone.

## 2. useClipboard -- Copy to Clipboard

Read from and write to the system clipboard using the modern Clipboard API. The hook handles permissions, HTTPS requirements, and focus-state edge cases.

```tsx
import { useClipboard } from "@reactuses/core";

function CopyButton({ text }: { text: string }) {
  const [clipboardText, copy] = useClipboard();

  return (
    <button onClick={() => copy(text)}>
      {clipboardText === text ? "Copied!" : "Copy"}
    </button>
  );
}
```

The returned `copy` function is async and returns a promise, so you can add success and error feedback easily.

## 3. useGeolocation -- User Location

Track the user's geographic coordinates with automatic cleanup of the `watchPosition` listener on unmount.

```tsx
import { useGeolocation } from "@reactuses/core";

function LocationDisplay() {
  const { coordinates, error, isSupported } = useGeolocation();

  if (!isSupported) return <p>Geolocation is not supported.</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <p>
      Lat: {coordinates.latitude}, Lng: {coordinates.longitude}
    </p>
  );
}
```

The hook returns `coordinates`, `locatedAt` (timestamp), `error`, and `isSupported` so you can handle every state in your UI.

## 4. useFullscreen -- Fullscreen Mode

Toggle fullscreen on any element. The hook wraps the Fullscreen API and returns the current state along with control functions.

```tsx
import { useRef } from "react";
import { useFullscreen } from "@reactuses/core";

function VideoPlayer() {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, { enterFullscreen, exitFullscreen, toggleFullscreen }] =
    useFullscreen(ref);

  return (
    <div ref={ref}>
      <video src="/demo.mp4" />
      <button onClick={toggleFullscreen}>
        {isFullscreen ? "Exit" : "Fullscreen"}
      </button>
    </div>
  );
}
```

It also exposes `isEnabled` so you can hide the button on browsers that do not support the API.

## 5. useNetwork -- Online/Offline Status

Monitor the user's network connection. The hook tracks online/offline state and, where available, connection details like `effectiveType` and `downlink`.

```tsx
import { useNetwork } from "@reactuses/core";

function NetworkBanner() {
  const { online, effectiveType } = useNetwork();

  if (!online) return <div className="banner">You are offline</div>;

  return <div>Connection: {effectiveType}</div>;
}
```

Use it to show offline banners, queue requests, or degrade gracefully on slow connections.

## 6. useIdle -- Idle Detection

Detect when the user has stopped interacting with the page. The hook listens for mouse, keyboard, touch, and visibility events and returns `true` after the specified timeout.

```tsx
import { useIdle } from "@reactuses/core";

function IdleWarning() {
  const isIdle = useIdle(300_000); // 5 minutes

  return isIdle ? <div>Are you still there?</div> : null;
}
```

Common use cases include auto-logout, pausing expensive animations, and showing "still watching?" prompts.

## 7. useDarkMode -- Dark Mode Toggle

Manage dark mode with system preference detection, localStorage persistence, and automatic class toggling on the root element.

```tsx
import { useDarkMode } from "@reactuses/core";

function ThemeToggle() {
  const [isDark, toggle] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
  });

  return (
    <button onClick={toggle}>
      {isDark ? "Switch to Light" : "Switch to Dark"}
    </button>
  );
}
```

The hook falls back to the user's `prefers-color-scheme` system setting when no stored preference exists.

## 8. usePermission -- Permission Status

Query the status of a browser permission (geolocation, camera, microphone, notifications, and others) and react to changes in real time.

```tsx
import { usePermission } from "@reactuses/core";

function CameraAccess() {
  const status = usePermission("camera");

  if (status === "denied") return <p>Camera access was denied.</p>;
  if (status === "prompt") return <p>We need camera permission.</p>;

  return <p>Camera access granted.</p>;
}
```

Use it alongside other hooks like `useGeolocation` to show appropriate UI before requesting access.

## 9. useLocalStorage -- Persistent State

A drop-in replacement for `useState` that persists to `localStorage`. It handles serialization, SSR safety, cross-tab sync via the `storage` event, and error recovery.

```tsx
import { useLocalStorage } from "@reactuses/core";

function Settings() {
  const [lang, setLang] = useLocalStorage("language", "en");

  return (
    <select value={lang ?? "en"} onChange={(e) => setLang(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
    </select>
  );
}
```

It supports custom serializers if you need to store dates, Maps, or other non-JSON types.

## 10. useEventListener -- Event Handling

Attach event listeners to any target (window, document, or a specific element) with automatic cleanup and TypeScript-safe event types.

```tsx
import { useEventListener } from "@reactuses/core";

function KeyLogger() {
  useEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
  });

  return <p>Press any key...</p>;
}
```

This is the foundational hook that many other hooks in ReactUse are built on. It avoids stale closures by always referencing the latest handler.

## Manual Implementation vs. ReactUse

Every hook above replaces a significant amount of boilerplate. Here is what you would need to handle yourself without ReactUse:

| Concern | Manual Implementation | ReactUse Hook |
| --- | --- | --- |
| SSR safety checks | `typeof window !== "undefined"` guards everywhere | Built in |
| Event listener cleanup | `useEffect` return with `removeEventListener` | Automatic |
| TypeScript event types | Manual generic constraints per event | Fully typed |
| Permission handling | `navigator.permissions.query` + state management | Single call |
| localStorage serialization | `JSON.parse` / `JSON.stringify` + error handling | Automatic |
| Cross-tab sync | Manual `storage` event listener | Built in |
| Hydration mismatch prevention | `defaultState` patterns, two-pass rendering | Handled internally |
| Fullscreen API differences | Vendor-prefixed API normalization | Abstracted away |

For a single hook the savings are modest. Across an entire application using five or more browser APIs, ReactUse eliminates hundreds of lines of defensive code.

## FAQ

### Are these hooks SSR-safe?

Yes. Every hook in ReactUse checks for browser availability before accessing any API. During server-side rendering, hooks return safe default values and skip browser-only logic. This means no hydration mismatches with Next.js, Remix, Astro, or any other SSR framework.

### Can I tree-shake unused hooks?

Yes. Importing from `@reactuses/core` supports tree-shaking. Your bundler will only include the hooks you actually import, so there is no penalty for installing the full library.

### Do these hooks work with React 18 and 19?

ReactUse supports React 16.8 and above. All hooks are compatible with React 18 concurrent features and React 19.

### How do I install ReactUse?

```bash
npm i @reactuses/core
```

Or use pnpm or yarn:

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

### Where can I find the full API documentation?

Every hook has a dedicated documentation page with a live demo at [reactuse.com](https://reactuse.com). You can also browse the source code on [GitHub](https://github.com/childrentime/reactuse).

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
