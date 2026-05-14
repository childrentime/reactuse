---
title: "React Dark Mode Toggle: Complete Guide"
description: "Learn how to implement a dark mode toggle in React using CSS, system preferences, and the useDarkMode hook. Covers persistence, theming patterns, and production-ready solutions."
slug: react-dark-mode-toggle
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, dark-mode, useDarkMode]
keywords: [react dark mode, dark mode toggle react, useDarkMode, react theme toggle, dark light mode react]
image: /img/og.png
---

# React Dark Mode Toggle: Complete Guide

Dark mode has become a standard feature that users expect in modern web applications. A dark mode toggle lets users switch between light and dark color schemes, reducing eye strain in low-light environments and saving battery on OLED displays. This guide walks you through implementing dark mode in React, from manual CSS approaches to a production-ready solution with the `useDarkMode` hook.

<!-- truncate -->

## Why Dark Mode Matters

Dark mode is no longer a nice-to-have — it's a user expectation. Studies show that over 80% of users prefer dark mode in at least some contexts. Beyond user preference, dark mode provides real benefits:

- **Reduced eye strain** in low-light conditions
- **Lower battery consumption** on OLED and AMOLED screens
- **Improved accessibility** for users with light sensitivity
- **A more polished product feel** that signals attention to detail

Getting it right involves more than swapping background colors. You need to handle system preferences, persist the user's choice, and avoid flash-of-wrong-theme on page load.

## The Manual CSS Approach

The simplest starting point is a CSS class on the root element:

```css
:root {
  --bg-color: #ffffff;
  --text-color: #1a1a1a;
}

html.dark {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

Then toggle the class in React:

```tsx
import { useState } from "react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((prev) => !prev);
  };

  return <button onClick={toggle}>{isDark ? "Light Mode" : "Dark Mode"}</button>;
}
```

This works for basic cases, but it has problems. The preference resets on page reload, it ignores the user's system setting, and the logic gets duplicated across components.

## Detecting System Preferences

Most operating systems let users set a system-wide dark mode preference. You can detect it with the `prefers-color-scheme` media query:

```tsx
import { useEffect, useState } from "react";

function useSystemDarkMode() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDark;
}
```

This respects the user's OS setting and reacts to changes in real time. But you still need to handle localStorage persistence, SSR safety, applying classes to the DOM, and keeping everything in sync. That's a lot of boilerplate for every project.

## The Easy Way: useDarkMode

The [useDarkMode](https://reactuse.com/browser/usedarkmode/) hook from ReactUse handles all of this in a single call. It detects system preferences, persists the user's choice to localStorage, applies CSS classes to the DOM, and works safely with SSR:

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

The hook returns a tuple of three values:

1. **`isDark`** — a boolean indicating whether dark mode is active
2. **`toggle`** — a function to switch between dark and light mode
3. **`setDark`** — a setter function for programmatic control

## Persisting User Preference

By default, `useDarkMode` stores the user's choice in `localStorage` under the key `reactuses-color-scheme`. You can customize both the key and the storage backend:

```tsx
const [isDark, toggle] = useDarkMode({
  classNameDark: "dark",
  classNameLight: "light",
  storageKey: "my-app-theme",
});
```

If you need `sessionStorage` instead of `localStorage`:

```tsx
const [isDark, toggle] = useDarkMode({
  classNameDark: "dark",
  classNameLight: "light",
  storage: () => sessionStorage,
});
```

When no stored preference exists, the hook automatically falls back to the user's system preference via `prefers-color-scheme`.

## Common Patterns

### Theme-Aware Component

Build components that adapt their styling based on the current theme:

```tsx
import { useDarkMode } from "@reactuses/core";

function Card({ children }: { children: React.ReactNode }) {
  const [isDark] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
  });

  return (
    <div style={{
      background: isDark ? "#2d2d2d" : "#ffffff",
      color: isDark ? "#e0e0e0" : "#1a1a1a",
      padding: "1.5rem",
      borderRadius: "8px",
    }}>
      {children}
    </div>
  );
}
```

### Applying to a Custom Selector

By default, classes are applied to the `<html>` element. You can target a different element:

```tsx
const [isDark, toggle] = useDarkMode({
  selector: "#app-root",
  attribute: "data-theme",
  classNameDark: "dark",
  classNameLight: "light",
});
```

This adds the class to the element matching `#app-root` instead, and you can use a data attribute rather than a class if your CSS framework expects it.

## Installation

```bash
npm i @reactuses/core
```

Or with other package managers:

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

## Related Hooks

- [useDarkMode documentation](https://reactuse.com/browser/usedarkmode/) — full API reference and interactive demo
- [useColorMode](https://reactuse.com/browser/usecolormode/) — for multi-mode theming beyond light/dark
- [useMediaQuery](https://reactuse.com/browser/usemediaquery/) — for responding to any CSS media query
- [useLocalStorage](https://reactuse.com/state/uselocalstorage/) — for general-purpose persistent state

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
