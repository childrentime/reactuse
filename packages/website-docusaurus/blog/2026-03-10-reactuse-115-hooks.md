---
title: "ReactUse: 100+ Production-Ready React Hooks You Need to Know"
description: "Introducing ReactUse, a comprehensive collection of 100+ React Hooks covering browser APIs, state management, sensors, animations, and more. TypeScript-first, tree-shakable, and SSR-compatible."
slug: reactuse-100-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, typescript, announcement]
keywords: [react hooks, custom hooks, react hook library, reactuse, typescript hooks, SSR hooks, browser hooks]
image: /img/og.png
---

# ReactUse: 100+ Production-Ready React Hooks

Building modern React applications requires handling countless browser APIs, state management patterns, and DOM interactions. **ReactUse** provides 100+ carefully crafted hooks that eliminate boilerplate and let you focus on building features.

<!-- truncate -->

## Why ReactUse?

If you've used [VueUse](https://vueuse.org/) in the Vue ecosystem, ReactUse brings the same philosophy to React: a comprehensive, well-typed, tree-shakable collection of utility hooks.

### What Makes ReactUse Different?

- **100+ hooks** — the most comprehensive React hooks collection available
- **TypeScript-first** — every hook has full type definitions
- **Tree-shakable** — import only what you need, zero bundle bloat
- **SSR-compatible** — works seamlessly with Next.js, Remix, and other frameworks
- **Interactive docs** — every hook has a live, editable demo at [reactuse.com](https://reactuse.com)
- **MCP Support** — AI-powered hook discovery for modern development workflows

### Hook Categories

**Browser Hooks (48):** Everything from clipboard access to geolocation, media queries to web notifications.

```tsx
import { useClipboard, useDarkMode, useGeolocation } from "@reactuses/core";
```

**State Hooks (24):** LocalStorage persistence, debouncing, throttling, toggles, and more.

```tsx
import { useLocalStorage, useDebounce, useToggle } from "@reactuses/core";
```

**Element Hooks (19):** Size measurement, intersection observation, drag & drop, scroll tracking.

```tsx
import { useElementSize, useIntersectionObserver, useDraggable } from "@reactuses/core";
```

**Effect Hooks (20):** Event listeners, timers, lifecycle hooks, and async effects.

```tsx
import { useEventListener, useInterval, useAsyncEffect } from "@reactuses/core";
```

## Quick Start

Install with your favorite package manager:

```bash
npm i @reactuses/core
```

Use any hook immediately:

```tsx
import { useToggle } from "@reactuses/core";

function App() {
  const [on, toggle] = useToggle(true);
  return (
    <button onClick={toggle}>
      {on ? "ON" : "OFF"}
    </button>
  );
}
```

## Used in Production

ReactUse is trusted by major companies including **Shopee**, **PDD (Pinduoduo)**, **Ctrip**, and **Bambu Lab**.

## Get Started

- 📖 [Documentation](https://reactuse.com)
- 💻 [GitHub](https://github.com/childrentime/reactuse)
- 💬 [Discord Community](https://discord.gg/VEMFdByJ)

We'd love your feedback — star us on GitHub and join the community!
