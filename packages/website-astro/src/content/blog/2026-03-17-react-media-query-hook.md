---
title: "useMediaQuery: Complete Guide to Responsive Design in React"
description: "Learn how to use the useMediaQuery hook from ReactUse to build responsive React components that adapt to screen size, dark mode preferences, and more."
slug: react-media-query-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-17
tags: [react, hooks, tutorial, responsive-design, useMediaQuery]
keywords: [react media query, useMediaQuery, responsive react, react responsive design, media query hook]
image: /img/og.png
---

# useMediaQuery: Complete Guide to Responsive Design in React

CSS media queries handle most responsive layout work, but sometimes you need your React components to know about the current viewport, user preferences, or device capabilities at the JavaScript level. Whether you are conditionally rendering a mobile navigation, detecting dark mode, or respecting reduced motion preferences, `useMediaQuery` gives you a reactive boolean that stays in sync with any CSS media query string.

<!-- truncate -->

## What is useMediaQuery?

`useMediaQuery` is a hook from [ReactUse](https://reactuse.com) that wraps the browser's `window.matchMedia` API. You pass it a media query string and it returns a boolean indicating whether the query currently matches. It subscribes to the `change` event under the hood, so the returned value updates automatically when the user resizes the window, toggles system dark mode, or changes any other condition the query describes.

```tsx
import { useMediaQuery } from "@reactuses/core";

function Example() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return <p>{isMobile ? "Mobile view" : "Desktop view"}</p>;
}
```

The signature is simple:

```ts
useMediaQuery(query: string, defaultState?: boolean) => boolean
```

- **query** -- any valid CSS media query string.
- **defaultState** -- an optional boolean to use during server-side rendering before `window` is available.

## Basic Usage

The most common use case is detecting screen width breakpoints:

```tsx
import { useMediaQuery } from "@reactuses/core";

function Navigation() {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return (
      <button aria-label="Open menu">
        <HamburgerIcon />
      </button>
    );
  }

  return (
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  );
}
```

The component re-renders only when the boolean value changes -- not on every pixel of a resize.

## Common Breakpoints Pattern

For projects that use multiple breakpoints, define them in a single place and reuse across components:

```tsx
import { useMediaQuery } from "@reactuses/core";

function useBreakpoint() {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return { isMobile, isTablet, isDesktop };
}

function Dashboard() {
  const { isMobile, isTablet } = useBreakpoint();

  const columns = isMobile ? 1 : isTablet ? 2 : 4;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
      <Card title="Revenue" />
      <Card title="Users" />
      <Card title="Orders" />
      <Card title="Growth" />
    </div>
  );
}
```

## Responsive Layouts

Here is a practical example that swaps between a sidebar layout on desktop and a stacked layout on mobile:

```tsx
import { useMediaQuery } from "@reactuses/core";

function AppLayout({ children }: { children: React.ReactNode }) {
  const isWide = useMediaQuery("(min-width: 1024px)");

  if (isWide) {
    return (
      <div style={{ display: "flex" }}>
        <aside style={{ width: 260, flexShrink: 0 }}>
          <SidebarMenu />
        </aside>
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    );
  }

  return (
    <div>
      <TopNavBar />
      <main>{children}</main>
    </div>
  );
}
```

## Detecting User Preferences

Media queries are not limited to screen size. You can detect system-level user preferences:

### Dark Mode

```tsx
import { useMediaQuery } from "@reactuses/core";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <div style={{
      background: prefersDark ? "#1a1a2e" : "#ffffff",
      color: prefersDark ? "#e0e0e0" : "#1a1a1a",
      minHeight: "100vh",
    }}>
      {children}
    </div>
  );
}
```

### Reduced Motion

Respecting `prefers-reduced-motion` is important for accessibility. Users who experience motion sickness or vestibular disorders set this preference at the OS level:

```tsx
import { useMediaQuery } from "@reactuses/core";

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <div style={{
      transition: prefersReducedMotion ? "none" : "transform 0.3s ease",
    }}>
      {children}
    </div>
  );
}
```

### High Contrast and Other Queries

```tsx
const prefersHighContrast = useMediaQuery("(prefers-contrast: high)");
const isPortrait = useMediaQuery("(orientation: portrait)");
const hasHover = useMediaQuery("(hover: hover)");
```

## SSR and Hydration Safety

When rendering on the server, `window.matchMedia` does not exist. If you do not provide a `defaultState`, the hook returns `false` on the server and the real value on the client, which can cause a React hydration mismatch warning.

To avoid this, pass a `defaultState` that matches what you expect most users will see:

```tsx
// Server renders as false, client updates to the real value
const isMobile = useMediaQuery("(max-width: 768px)", false);

// Server renders as true, useful if most traffic is mobile
const isMobile = useMediaQuery("(max-width: 768px)", true);
```

In development mode, the hook logs a console warning if you render on the server without providing `defaultState`, reminding you to handle this case explicitly.

## Combining with Other Hooks

`useMediaQuery` pairs well with other ReactUse hooks:

```tsx
import { useMediaQuery, useLocalStorage } from "@reactuses/core";

function ThemeSwitcher() {
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [userTheme, setUserTheme] = useLocalStorage<"light" | "dark" | "system">("theme", "system");

  const isDark = userTheme === "system" ? systemPrefersDark : userTheme === "dark";

  return (
    <div>
      <p>Current theme: {isDark ? "dark" : "light"}</p>
      <select value={userTheme} onChange={(e) => setUserTheme(e.target.value as "light" | "dark" | "system")}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

## Common Mistakes

**Using window.matchMedia directly in render.** Calling `window.matchMedia` during render without subscribing to changes gives you a stale snapshot. `useMediaQuery` subscribes to the `change` event so the value stays current.

**Forgetting defaultState with SSR.** If you use Next.js, Remix, or Astro, always pass a `defaultState` to prevent hydration warnings.

**Creating too many listeners.** Each call to `useMediaQuery` creates one `matchMedia` listener. This is lightweight, but if you find yourself calling it with dozens of queries, consider grouping related breakpoints into a single custom hook like `useBreakpoint` shown above.

## Installation

```bash
npm i @reactuses/core
```

Or with your preferred package manager:

```bash
pnpm add @reactuses/core
# or
yarn add @reactuses/core
```

## Related Hooks

- [useMediaQuery documentation](https://reactuse.com/browser/useMediaQuery/) -- full API reference and interactive demo
- [useWindowSize](https://reactuse.com/element/useWindowSize/) -- get the actual pixel dimensions of the viewport
- [useDarkMode](https://reactuse.com/browser/useDarkMode/) -- full dark mode management with persistence

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
