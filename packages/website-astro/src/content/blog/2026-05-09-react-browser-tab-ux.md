---
title: "Browser Tab UX in React: Pull Users Back with Titles, Favicons, and Notifications"
description: "Build attention-aware React UIs that update the tab title with unread counts, swap favicons on state changes, pause work when hidden, react to focus, and fire native notifications -- with useTitle, useFavicon, useDocumentVisibility, useWindowFocus, usePageLeave, usePermission, and useWebNotification from ReactUse."
slug: react-browser-tab-ux
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-09
tags: [react, hooks, browser, ux, tutorial]
keywords: [react browser tab ux, useTitle, useFavicon, useDocumentVisibility, useWindowFocus, usePageLeave, useWebNotification, usePermission, react document title, react tab notifications, react attention ux]
image: /img/og.png
---

# Browser Tab UX in React: Pull Users Back with Titles, Favicons, and Notifications

The average laptop has thirty open tabs at any moment, and your app is one of them. The user opens it, switches away to read Slack, comes back fifteen minutes later, and forgets which tab was yours. If your tab title is still "My App" and the favicon is still the same gray square it has been since launch, you have wasted that fifteen minutes — there was a new message, a build finished, an upload completed, and the user never knew.

<!-- truncate -->

The browser already gives you a small but powerful surface for getting attention back: the tab title, the favicon, the visibility state, the focus event, and the system notification. Wired up correctly, an inactive tab can announce "(3) New messages — Acme Chat", flash a red badge on the favicon, pause its expensive polling while hidden, refresh the moment it comes back, and fire a native OS notification when something urgent happens. Wired up incorrectly, the same code leaks event listeners, fights with React's render cycle, and ships a hydration mismatch on the first SSR pass.

This post walks through six primitives for building attention-aware UI in React, using focused hooks from [ReactUse](https://reactuse.com). For each one we will look at the manual implementation, the gotchas, and then the hook that hides them. At the end we combine all six into a chat-tab component that behaves like a real native app.

## 1. The Tab Title as a Notification Channel

The `<title>` element is the most underused notification surface on the web. Gmail, GitHub, Linear, and Discord all use it: a leading `(N)` count or a `•` dot tells you something happened without you switching tabs. The implementation is one line — `document.title = "..."` — but doing it inside a React component the wrong way leaves the title stuck on whatever the last render set, even after the component unmounts.

### The Manual Way

```tsx
import { useEffect, useState } from "react";

function ManualUnreadTitle({ count }: { count: number }) {
  useEffect(() => {
    const previous = document.title;
    document.title = count > 0 ? `(${count}) Acme Chat` : "Acme Chat";
    return () => {
      document.title = previous;
    };
  }, [count]);

  return null;
}
```

The visible bug is subtle: `previous` captures whatever the title was at the moment this effect ran, which means if a parent component sets the title between renders, the cleanup function restores a stale value. The fix is to either pick a single source of truth for the title or to skip the cleanup entirely and let the next render overwrite. Most apps end up with the latter, then forget to write the cleanup at all, then ship a stuck-title bug six months later when somebody adds React StrictMode and the effect fires twice.

### The ReactUse Way: useTitle

[`useTitle`](https://reactuse.com/browser/useTitle/) takes a single string and reflects it onto `document.title` whenever the string changes:

```tsx
import { useTitle } from "@reactuses/core";

function UnreadTitle({ count }: { count: number }) {
  useTitle(count > 0 ? `(${count}) Acme Chat` : "Acme Chat");
  return null;
}
```

That is the entire component. The hook subscribes to its own input, not to the previous DOM value, so no stale-cleanup bug is possible. Drop it anywhere in the tree — typically at the page root or inside the component that owns the unread count — and the tab updates as the data changes.

A common pattern is to combine it with a derived count from a chat store:

```tsx
import { useTitle } from "@reactuses/core";
import { useChatStore } from "./store";

function ChatTitle() {
  const unread = useChatStore((s) => s.unreadCount);
  const channel = useChatStore((s) => s.activeChannel?.name ?? "Chat");
  useTitle(unread > 0 ? `(${unread}) ${channel} — Acme` : `${channel} — Acme`);
  return null;
}
```

The component renders nothing visually. It exists to keep the title in sync with the store. Mount it once at the top of your app and forget it.

## 2. State-Aware Favicons

The favicon has even less screen real estate than the title — sixteen pixels square — but it is the one thing the user sees in the tab bar when titles get truncated. Swapping it on state changes (idle gray, attention red, error orange, success green) is one of the cheapest UX wins in the browser.

### The Manual Way

```tsx
import { useEffect } from "react";

function ManualFavicon({ status }: { status: "idle" | "alert" | "error" }) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) return;
    link.href =
      status === "idle"
        ? "/favicon.ico"
        : status === "alert"
        ? "/favicon-alert.ico"
        : "/favicon-error.ico";
  }, [status]);

  return null;
}
```

This works in the happy path and breaks in three: when there is no `<link rel="icon">` element to start with (some bundlers strip it), when there are multiple icon links of different sizes (Apple touch icons, manifest icons), and when SSR renders a different icon than the client wants. You end up with branching logic for each case.

### The ReactUse Way: useFavicon

[`useFavicon`](https://reactuse.com/browser/useFavicon/) handles all three cases. It updates every `link[rel*="icon"]` tag it finds, creates one if none exist, and supports a base URL prefix for assets served from a CDN.

```tsx
import { useFavicon } from "@reactuses/core";

function StatusFavicon({ status }: { status: "idle" | "alert" | "error" }) {
  const href =
    status === "idle"
      ? "/favicon.ico"
      : status === "alert"
      ? "/favicon-alert.ico"
      : "/favicon-error.ico";
  useFavicon(href);
  return null;
}
```

A neat trick is to combine it with the unread count for a "badged" favicon. Pre-render a few PNG variants (`favicon-1.png` through `favicon-9.png`, plus `favicon-9plus.png`) and pick one based on the count:

```tsx
import { useFavicon } from "@reactuses/core";

function BadgedFavicon({ count }: { count: number }) {
  const variant =
    count === 0 ? "" : count > 9 ? "-9plus" : `-${count}`;
  useFavicon(`/favicon${variant}.png`);
  return null;
}
```

Now the tab bar shows a numbered favicon as messages pile up, even when the title is truncated past the count.

## 3. Pause Expensive Work When the Tab is Hidden

Every app has at least one polling interval, animation, or video that should stop when nobody is looking. Browsers throttle background tabs, but throttling is not the same as stopping — a 1-second poll that becomes a 60-second poll still hits the server, still parses JSON, still updates state, still triggers a render that nobody sees. The Page Visibility API lets you pause cleanly.

### The Manual Way

```tsx
import { useEffect, useState } from "react";

function ManualVisibility() {
  const [hidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return hidden ? "hidden" : "visible";
}
```

Two problems. First, on the server `document` is undefined, so the initial state crashes SSR. Second, the `visibilitychange` event does not fire on the first paint — if the user navigates to your page while it is already in a background tab, your initial `document.hidden` is correct but you never re-read it on focus.

### The ReactUse Way: useDocumentVisibility

[`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) handles SSR via a `defaultValue` argument and re-syncs after mount.

```tsx
import { useEffect } from "react";
import { useDocumentVisibility } from "@reactuses/core";

function PriceTicker() {
  const visibility = useDocumentVisibility("visible");
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    if (visibility === "hidden") return;
    const id = setInterval(async () => {
      const r = await fetch("/api/price");
      setPrice((await r.json()).price);
    }, 1000);
    return () => clearInterval(id);
  }, [visibility]);

  return <span>${price ?? "—"}</span>;
}
```

The interval mounts when the tab is visible, unmounts when it hides, and remounts when it comes back. No throttled-but-still-running poll, no wasted bandwidth, and the user sees a fresh price the moment they switch back.

The hook returns the actual `DocumentVisibilityState` (`'visible'` | `'hidden'`) rather than a boolean, which matches the spec and makes future visibility states (the spec leaves room for `'prerender'`) drop in cleanly.

## 4. Refresh on Focus

`visibilitychange` fires when the tab becomes visible, but a tab can be visible without being focused — picture-in-picture, side-by-side windows, or a tab that is the foreground tab in a background window. For "the user just clicked back to me" semantics you want window focus, not just visibility.

### The Manual Way

```tsx
import { useEffect, useState } from "react";

function ManualFocus() {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setFocused(document.hasFocus());
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return focused ? "focused" : "blurred";
}
```

Same story as before — three event listeners, an initial-state read, an SSR pitfall.

### The ReactUse Way: useWindowsFocus

[`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) (exported as `useWindowsFocus` — the legacy name is preserved) returns a boolean and re-syncs on mount.

```tsx
import { useEffect } from "react";
import { useWindowsFocus } from "@reactuses/core";

function FreshFeed() {
  const focused = useWindowsFocus();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!focused) return;
    fetch("/api/feed").then((r) => r.json()).then(setItems);
  }, [focused]);

  return <Feed items={items} />;
}
```

The feed re-fetches every time the user clicks back to the window. Combined with `useDocumentVisibility`, you can pause a poll when hidden _and_ refresh once when refocused — covering both the "long absence" and "quick glance" cases.

## 5. Catch the User Before They Leave

`usePageLeave` reports when the mouse moves out of the viewport — usually toward the tab bar or the address bar, often a leading indicator that the user is about to switch tabs. It is the foundation of "exit intent" overlays, which are a divisive pattern when used for ad popups but a useful one when used for "you have unsaved changes" hints or "before you go, here is what you missed" prompts.

```tsx
import { usePageLeave } from "@reactuses/core";

function UnsavedHint({ dirty }: { dirty: boolean }) {
  const isLeaving = usePageLeave();
  if (!dirty || !isLeaving) return null;
  return (
    <div className="toast">
      You have unsaved changes. Press ⌘S to save.
    </div>
  );
}
```

The hook listens for `mouseout`, `mouseleave`, and `mouseenter` and flips its boolean as the cursor crosses the viewport edge. Use it sparingly — every site that has shoved a "wait, before you go!" modal in your face on the way out is a reminder that this pattern goes from helpful to annoying very quickly.

A more restrained version: combine it with a dirty-form flag, so the hint only fires when there is actually something at stake.

## 6. Native Notifications — Permission First

The Notification API is the only one of these surfaces that escapes the browser entirely. A native OS notification fires even if your tab is fully buried, even if the window is minimized, even if the user is in another app. It is also the only one that requires explicit user permission, and getting the prompt UX wrong is the fastest way to a permanent "deny" in browser settings.

The two hooks that pair here are `usePermission` and `useWebNotification`.

### Check the State Before You Ask

[`usePermission`](https://reactuse.com/browser/usePermission/) wraps the Permissions API and returns the current state for any permission name — `'granted'`, `'denied'`, `'prompt'`, or empty if the API is not supported. Use it to decide whether to render an "Enable notifications" button (state is `'prompt'`), a "You're all set" indicator (`'granted'`), or a "Notifications are blocked — fix in browser settings" link (`'denied'`).

```tsx
import { usePermission } from "@reactuses/core";

function NotificationStatus() {
  const state = usePermission("notifications");
  if (state === "granted") return <span>Notifications: on</span>;
  if (state === "denied") return <a href="#help">Notifications blocked — fix</a>;
  return null;
}
```

### Ask Only on User Intent

[`useWebNotification`](https://reactuse.com/browser/useWebNotification/) returns `isSupported`, `show`, `close`, and `ensurePermissions`. The cardinal rule of the Notification API: never call `Notification.requestPermission()` on page load. Browsers display the permission prompt as a tab-level chrome popup, and a popup that fires before the user has interacted with your page is the textbook "deny by reflex" UX.

Trigger the request from a button click instead:

```tsx
import { useWebNotification } from "@reactuses/core";

function EnableButton() {
  const { isSupported, ensurePermissions, show } = useWebNotification();
  if (!isSupported) return null;

  return (
    <button
      onClick={async () => {
        const granted = await ensurePermissions();
        if (granted) {
          show("You're all set", {
            body: "We'll let you know about new messages here.",
            icon: "/favicon.ico",
          });
        }
      }}
    >
      Enable desktop notifications
    </button>
  );
}
```

Once the user has granted permission, calling `show(title, options)` from anywhere in your app fires a native notification. The hook tears down its current notification on unmount, so a notification fired from a component that immediately unmounts will not stick around forever.

## Putting it All Together: An Attention-Aware Chat Tab

Here is what a chat tab looks like with all six primitives wired in. Unread messages update the title and the favicon; polling pauses while hidden and refreshes on focus; an exit-intent hint fires for unsaved drafts; and a native notification fires when a new message arrives while the tab is in the background.

```tsx
import { useEffect, useRef } from "react";
import {
  useTitle,
  useFavicon,
  useDocumentVisibility,
  useWindowsFocus,
  usePageLeave,
  useWebNotification,
} from "@reactuses/core";
import { useChatStore } from "./store";

export function AttentionAwareChat() {
  const unread = useChatStore((s) => s.unreadCount);
  const channel = useChatStore((s) => s.activeChannel?.name ?? "Chat");
  const draftDirty = useChatStore((s) => s.composer.length > 0);
  const latest = useChatStore((s) => s.latestMessage);
  const fetchFeed = useChatStore((s) => s.fetchFeed);

  // 1 + 2: title + favicon reflect unread count
  useTitle(unread > 0 ? `(${unread}) ${channel} — Acme` : `${channel} — Acme`);
  const variant = unread === 0 ? "" : unread > 9 ? "-9plus" : `-${unread}`;
  useFavicon(`/favicon${variant}.png`);

  // 3: pause polling when hidden
  const visibility = useDocumentVisibility("visible");
  useEffect(() => {
    if (visibility === "hidden") return;
    const id = setInterval(fetchFeed, 5000);
    return () => clearInterval(id);
  }, [visibility, fetchFeed]);

  // 4: full refresh on focus
  const focused = useWindowsFocus();
  useEffect(() => {
    if (focused) fetchFeed();
  }, [focused, fetchFeed]);

  // 5: exit-intent hint when there is an unsaved draft
  const isLeaving = usePageLeave();

  // 6: native notification when a new message arrives in the background
  const { show, ensurePermissions, isSupported } = useWebNotification();
  const lastNotifiedId = useRef<string | null>(null);
  useEffect(() => {
    if (!isSupported || !latest || visibility === "visible") return;
    if (lastNotifiedId.current === latest.id) return;
    lastNotifiedId.current = latest.id;
    show(`${latest.author} in ${channel}`, {
      body: latest.text,
      icon: "/favicon.ico",
      tag: "chat-message",
    });
  }, [latest, visibility, channel, show, isSupported]);

  return (
    <>
      <ChatPane />
      {draftDirty && isLeaving && (
        <Toast>You have an unsaved draft.</Toast>
      )}
      {!isSupported || (
        <button onClick={ensurePermissions}>Enable desktop notifications</button>
      )}
    </>
  );
}
```

Six hooks, one component, no manual event listeners, no SSR crashes, no leaked timers. Every line of attention-management logic is colocated with the chat that owns it, so the next person reading the file knows where to look.

## Summary

| Hook | What it is for | When to reach for it |
| --- | --- | --- |
| [`useTitle`](https://reactuse.com/browser/useTitle/) | Reflect a string into `document.title` | Unread counts, build status, document name |
| [`useFavicon`](https://reactuse.com/browser/useFavicon/) | Swap the favicon `href` reactively | Status badges, attention dots, branded states |
| [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) | Track tab hidden vs visible | Pause polls, animations, video |
| [`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) | Track window focus | Refresh on return, pause on blur |
| [`usePageLeave`](https://reactuse.com/browser/usePageLeave/) | Detect cursor leaving viewport | Exit-intent hints, unsaved-draft warnings |
| [`usePermission`](https://reactuse.com/browser/usePermission/) | Read Permissions API state | Conditional CTAs for notifications, geo, etc. |
| [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) | Show native OS notifications | Background message alerts, build-done pings |

Browser-tab UX is one of those areas where the gap between "good app" and "great app" is small in code and large in feel. Six hooks, twenty lines of glue, and your app starts to behave like the native ones it competes with for attention. Browse the rest of the catalog at [reactuse.com](https://reactuse.com) — and if you ship one of these tomorrow, drop us a screenshot.
