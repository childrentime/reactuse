---
sidebar_position: 1
slug: /
title: "ReactUse - 115+ Essential React Hooks Library"
sidebar_label: Get Started
description: "ReactUse is a comprehensive collection of 115+ custom React Hooks for browser APIs, state management, sensors, animations, and more. TypeScript-first, tree-shakable, and SSR-compatible."
---
# ReactUse: 115+ Essential React Hooks

Reactuse is a comprehensive collection of custom React Hooks designed to supercharge your functional components! you can easily unlock the full potential of React Hooks and leverage their power to create reusable and efficient code.

## Why ReactUse?

- **115+ Hooks** covering browser APIs, state management, DOM elements, effects, and integrations
- **TypeScript-First** with full type definitions for every hook
- **Tree-Shakable** import only what you need, zero bloat
- **SSR Compatible** works seamlessly with Next.js, Remix, and other SSR frameworks
- **Well Documented** with live interactive examples for every hook
- **Actively Maintained** used in production by Shopee, PDD, Ctrip, and Bambu Lab

## Hook Categories

| Category | Count | Examples |
|----------|-------|----------|
| **Browser** | 48 | useClipboard, useDarkMode, useMediaQuery, useGeolocation |
| **State** | 24 | useLocalStorage, useDebounce, useToggle, useCounter |
| **Effect** | 20 | useEventListener, useTimeout, useInterval, useAsyncEffect |
| **Element** | 19 | useElementSize, useIntersectionObserver, useDraggable, useScroll |
| **Integrations** | 1+ | useQRCode and more coming |

## Installation

```shell
npm i @reactuses/core
```

## Usage Example

```tsx
import { useToggle } from '@reactuses/core'

function Demo() {
  const [on, toggle] = useToggle(true)

  return (
    <div>
      <div>{on ? 'ON' : 'OFF'}</div>
      <button onClick={toggle}>Toggle</button>
      <button onClick={() => toggle(true)}>set ON</button>
      <button onClick={() => toggle(false)}>set OFF</button>
    </div>
  )
}
```
