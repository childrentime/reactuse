---
sidebar_position: 1
slug: /
title: "ReactUse - 110+ Essential React Hooks Library for TypeScript"
sidebar_label: Get Started
description: "ReactUse (@reactuses/core) is a collection of 110+ production-ready React Hooks for browser APIs, state management, sensors, DOM elements, and effects. TypeScript-first, tree-shakable, and SSR-compatible with Next.js, Remix, and more."
---

## What is ReactUse?

**ReactUse** (`@reactuses/core`) is an open-source library of **110+ custom React Hooks** for building production applications. It provides TypeScript-first, tree-shakable, and SSR-compatible hooks covering browser APIs, state management, DOM observation, side effects, and third-party integrations. ReactUse supports React 16.8 through React 19 and works with Next.js, Remix, and other server-side rendering frameworks.

## Why ReactUse?

| Feature | Details |
|---------|---------|
| **110+ Hooks** | Covers browser APIs, state management, DOM elements, effects, and integrations |
| **TypeScript-First** | Full type definitions for every hook with generics support |
| **Tree-Shakable** | Import only what you need; unused hooks are eliminated at build time |
| **SSR Compatible** | Works seamlessly with Next.js, Remix, and other SSR frameworks |
| **React 16.8 -- 19** | Supports all modern React versions including React 19 |
| **Well Documented** | Live interactive examples and API references for every hook |
| **Production Proven** | Used in production by Shopee, PDD, Ctrip, and Bambu Lab |

## Hook Categories

| Category | Count | Examples |
|----------|-------|----------|
| **Browser** | 48 | useClipboard, useColorMode, useMediaQuery, useGeolocation, useMouse, useNetwork |
| **State** | 24 | useLocalStorage, useDebounce, useToggle, useCounter, useSessionStorage, useThrottle |
| **Effect** | 20 | useEventListener, useTimeout, useInterval, useAsyncEffect, useDebounceFn, useMount |
| **Element** | 19 | useElementSize, useIntersectionObserver, useDraggable, useWindowSize, useResizeObserver |
| **Integrations** | 1+ | useQRCode and more coming |

## How to Install ReactUse

Install the `@reactuses/core` package using your preferred package manager:

```shell
# npm
npm i @reactuses/core

# yarn
yarn add @reactuses/core

# pnpm
pnpm add @reactuses/core
```

## Getting Started

Import any hook directly from `@reactuses/core`. Each hook is individually tree-shakable, so your bundle only includes the hooks you actually use.

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

## ReactUse vs Other React Hook Libraries

| Feature | ReactUse | react-use | ahooks |
|---------|----------|-----------|--------|
| Hook Count | 110+ | ~100 | ~60 |
| TypeScript-First | Yes | Partial | Yes |
| Tree-Shakable | Yes | No | Yes |
| SSR Compatible | Yes | Partial | Yes |
| React 19 Support | Yes | No | No |
| Actively Maintained | Yes | Inactive since 2023 | Yes |

## Frequently Asked Questions

### Is ReactUse free to use?

Yes. ReactUse is released under the Unlicense, making it free for both personal and commercial use with no restrictions.

### Does ReactUse work with Next.js?

Yes. All ReactUse hooks are SSR-compatible and work with Next.js App Router and Pages Router, Remix, Gatsby, and other React SSR frameworks.

### Does ReactUse support React 19?

Yes. ReactUse supports React 16.8, 17, 18, and 19. Peer dependency compatibility is maintained across all modern React versions.

### How does ReactUse compare to VueUse?

ReactUse is inspired by [VueUse](https://vueuse.org/) and brings a similar developer experience to the React ecosystem. It mirrors many of the same hook concepts adapted for React's hooks API.

### Can I use ReactUse with JavaScript instead of TypeScript?

Yes. While ReactUse is written in TypeScript and provides full type definitions, it works in plain JavaScript projects without any additional configuration.
