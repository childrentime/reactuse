---
title: "SSR-Safe React Hooks: Avoiding Hydration Errors in Next.js"
description: "Learn how to write SSR-safe React hooks that avoid hydration mismatches in Next.js and other server-rendering frameworks. Covers useIsomorphicLayoutEffect, safe browser API access, and real-world patterns from ReactUse."
slug: ssr-safe-react-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, ssr, nextjs, hydration]
keywords: [react ssr hooks, nextjs hydration error, server side rendering hooks, useIsomorphicLayoutEffect, ssr safe hooks, react hydration mismatch]
image: /img/og.png
---

# SSR-Safe React Hooks: Avoiding Hydration Errors in Next.js

If you have ever seen the dreaded "Text content does not match server-rendered HTML" or "Hydration failed because the initial UI does not match what was rendered on the server," you know how frustrating SSR hydration errors can be. The root cause is almost always the same: a hook tried to access a browser API during server rendering.

<!-- truncate -->

## The Hydration Problem

React server-side rendering works in two phases. First, the server renders your component tree to HTML. Then, the client "hydrates" that HTML by attaching event listeners and reconciling the server output with the client render. If the two renders produce different output, React throws a hydration mismatch error.

Hooks that access `window`, `document`, `localStorage`, `navigator`, or any other browser-only API will return different values (or crash entirely) on the server. When the server renders a default fallback but the client renders the real value, the HTML won't match.

## Common Mistakes

### Accessing Browser APIs at Module Scope

```tsx
// This runs on the server and will crash
const width = window.innerWidth;

function MyComponent() {
  return <div>Width: {width}</div>;
}
```

### Reading Browser State During Initial Render

```tsx
function useScreenWidth() {
  // This causes a hydration mismatch: server returns 0, client returns 1920
  const [width, setWidth] = useState(window.innerWidth);
  return width;
}
```

### Conditional Rendering Based on Browser APIs

```tsx
function Feature() {
  // Server: false, Client: true → hydration mismatch
  const isMobile = window.innerWidth < 768;
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

## Why `typeof window !== 'undefined'` Is Not Enough

Many developers reach for this guard:

```tsx
const isBrowser = typeof window !== "undefined";

function useScreenWidth() {
  const [width, setWidth] = useState(isBrowser ? window.innerWidth : 0);
  return width;
}
```

This prevents the crash, but it **does not prevent the hydration mismatch**. The server returns `0` while the client returns `1920` on the very first render. React sees different output and throws an error.

The `typeof window` check is useful for guarding side effects and event listeners, but it must never be used to produce different **initial render output** between server and client. The initial state must be identical on both sides; the real browser value should only appear after hydration, inside a `useEffect`.

## The Right Patterns

### 1. Defer Browser Reads to useEffect

`useEffect` only runs on the client, after hydration. By initializing state with a safe default and updating it inside `useEffect`, the server and client first render will always match:

```tsx
function useScreenWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}
```

### 2. useIsomorphicLayoutEffect

React's `useLayoutEffect` fires synchronously after DOM mutations, which is useful for measuring layout. But on the server it produces a warning because there is no DOM. The solution is `useIsomorphicLayoutEffect`, which uses `useLayoutEffect` on the client and `useEffect` on the server:

```tsx
import { useIsomorphicLayoutEffect } from "@reactuses/core";
```

ReactUse implements this as:

```tsx
const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;
```

Use it whenever you need synchronous DOM measurement without the SSR warning.

### 3. useSyncExternalStore for Tear-Free Reads

React 18's `useSyncExternalStore` accepts a `getServerSnapshot` parameter specifically for SSR. It guarantees the server render uses a stable fallback while the client subscribes to live updates:

```tsx
const size = useSyncExternalStore(
  subscribeToResize,
  () => ({ width: window.innerWidth, height: window.innerHeight }),
  () => ({ width: 0, height: 0 }) // server snapshot
);
```

## How ReactUse Handles SSR

Every hook in [ReactUse](https://reactuse.com) is designed to be SSR-compatible out of the box. Here are the core strategies the library uses:

- **`isBrowser` guard** — a simple `typeof window !== 'undefined'` check used to protect side-effect registration, never to branch initial render output.
- **`useIsomorphicLayoutEffect`** — used in place of `useLayoutEffect` throughout the library to avoid SSR warnings.
- **`useSupported`** — a utility hook that safely checks whether a browser API exists, always returning `false` on the server and deferring the real check to an effect.
- **`useSyncExternalStore` with server snapshots** — hooks like `useWindowSize` use React 18's external store API with explicit server snapshots to guarantee hydration safety.
- **Safe initial state** — hooks like `useMediaQuery` accept a `defaultState` parameter so you can control the server-rendered value and prevent mismatches.

## Real-World Next.js Examples

### useLocalStorage

```tsx
import { useLocalStorage } from "@reactuses/core";

export default function Settings() {
  // Returns defaultValue on the server, reads localStorage after hydration
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Current: {theme}
    </button>
  );
}
```

### useMediaQuery

```tsx
import { useMediaQuery } from "@reactuses/core";

export default function Layout({ children }) {
  // Pass a defaultState to prevent hydration mismatch
  const isMobile = useMediaQuery("(max-width: 768px)", false);

  return (
    <div>
      {isMobile ? <MobileNav /> : <DesktopNav />}
      {children}
    </div>
  );
}
```

### useWindowSize

```tsx
import { useWindowSize } from "@reactuses/core";

export default function Dashboard() {
  // Returns { width: 0, height: 0 } on the server via getServerSnapshot
  const { width, height } = useWindowSize();

  return (
    <p>
      Viewport: {width} x {height}
    </p>
  );
}
```

All three examples work in Next.js App Router and Pages Router without any additional configuration.

## Checklist for SSR-Safe Hooks

Use this checklist when writing or reviewing custom hooks for an SSR environment:

- [ ] **No browser API access at module scope** — wrap all `window`/`document` usage in effects or guards.
- [ ] **Identical initial render on server and client** — never branch initial state based on browser checks.
- [ ] **Use `useEffect` for browser reads** — defer `window`, `document`, and `navigator` access to effects.
- [ ] **Replace `useLayoutEffect` with `useIsomorphicLayoutEffect`** — avoid SSR warnings.
- [ ] **Provide a `getServerSnapshot`** when using `useSyncExternalStore`.
- [ ] **Accept a `defaultState` or `initialValue` parameter** — let consumers control the server-rendered value.
- [ ] **Test with SSR** — render your component with `renderToString` and verify no errors or mismatches.

## Installation

```bash
npm i @reactuses/core
```

Or with other package managers:

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

Every hook in ReactUse follows the patterns described above. You can drop them into any Next.js, Remix, or Gatsby project without worrying about hydration errors.

---

ReactUse provides 100+ SSR-compatible hooks. [Explore them all →](https://reactuse.com)
