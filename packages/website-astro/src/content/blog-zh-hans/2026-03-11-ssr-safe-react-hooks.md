---
title: "SSR 安全的 React Hooks：在 Next.js 中避免水合错误"
description: "学习如何编写 SSR 安全的 React Hooks，避免在 Next.js 和其他服务端渲染框架中出现水合不匹配。涵盖 useIsomorphicLayoutEffect、安全的浏览器 API 访问，以及 ReactUse 中的实际模式。"
slug: ssr-safe-react-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, ssr, nextjs, hydration]
keywords: [react ssr hooks, nextjs hydration error, server side rendering hooks, useIsomorphicLayoutEffect, ssr safe hooks, react hydration mismatch]
image: /img/og.png
---

# SSR 安全的 React Hooks：在 Next.js 中避免水合错误

如果你曾经遇到过可怕的"Text content does not match server-rendered HTML"或"Hydration failed because the initial UI does not match what was rendered on the server"错误，你就知道 SSR 水合错误有多令人沮丧。根本原因几乎总是相同的：某个 Hook 试图在服务端渲染期间访问浏览器 API。

<!-- truncate -->

## 水合问题

React 服务端渲染分两个阶段工作。首先，服务端将你的组件树渲染为 HTML。然后，客户端通过附加事件监听器和将服务端输出与客户端渲染进行对比来"水合"该 HTML。如果两次渲染产生不同的输出，React 会抛出水合不匹配错误。

访问 `window`、`document`、`localStorage`、`navigator` 或任何其他仅限浏览器 API 的 Hooks 在服务端会返回不同的值（或直接崩溃）。当服务端渲染默认的回退值而客户端渲染真实值时，HTML 就不匹配了。

## 常见错误

### 在模块作用域访问浏览器 API

```tsx
// This runs on the server and will crash
const width = window.innerWidth;

function MyComponent() {
  return <div>Width: {width}</div>;
}
```

### 在初始渲染期间读取浏览器状态

```tsx
function useScreenWidth() {
  // This causes a hydration mismatch: server returns 0, client returns 1920
  const [width, setWidth] = useState(window.innerWidth);
  return width;
}
```

### 基于浏览器 API 的条件渲染

```tsx
function Feature() {
  // Server: false, Client: true → hydration mismatch
  const isMobile = window.innerWidth < 768;
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

## 为什么 `typeof window !== 'undefined'` 还不够

许多开发者会使用这个防护：

```tsx
const isBrowser = typeof window !== "undefined";

function useScreenWidth() {
  const [width, setWidth] = useState(isBrowser ? window.innerWidth : 0);
  return width;
}
```

这防止了崩溃，但**并不能防止水合不匹配**。服务端返回 `0`，而客户端在第一次渲染时就返回 `1920`。React 看到不同的输出就会抛出错误。

`typeof window` 检查适用于保护副作用和事件监听器，但绝不能用来在服务端和客户端之间产生不同的**初始渲染输出**。初始状态在两端必须相同；真实的浏览器值应该只在水合之后、在 `useEffect` 内部出现。

## 正确的模式

### 1. 将浏览器读取延迟到 useEffect

`useEffect` 只在客户端运行，在水合之后。通过使用安全的默认值初始化状态，并在 `useEffect` 内部更新它，服务端和客户端的首次渲染将始终匹配：

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

React 的 `useLayoutEffect` 在 DOM 变更后同步触发，这对布局测量很有用。但在服务端它会产生警告，因为没有 DOM。解决方案是 `useIsomorphicLayoutEffect`，它在客户端使用 `useLayoutEffect`，在服务端使用 `useEffect`：

```tsx
import { useIsomorphicLayoutEffect } from "@reactuses/core";
```

ReactUse 的实现如下：

```tsx
const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;
```

当你需要同步 DOM 测量而不想出现 SSR 警告时就使用它。

### 3. useSyncExternalStore 实现无撕裂读取

React 18 的 `useSyncExternalStore` 接受一个专门用于 SSR 的 `getServerSnapshot` 参数。它保证服务端渲染使用稳定的回退值，而客户端订阅实时更新：

```tsx
const size = useSyncExternalStore(
  subscribeToResize,
  () => ({ width: window.innerWidth, height: window.innerHeight }),
  () => ({ width: 0, height: 0 }) // server snapshot
);
```

## ReactUse 如何处理 SSR

[ReactUse](https://reactuse.com) 中的每个 Hook 都设计为开箱即用的 SSR 兼容。以下是该库使用的核心策略：

- **`isBrowser` 防护** — 一个简单的 `typeof window !== 'undefined'` 检查，用于保护副作用注册，从不用于分支初始渲染输出。
- **`useIsomorphicLayoutEffect`** — 在整个库中替代 `useLayoutEffect`，以避免 SSR 警告。
- **`useSupported`** — 一个安全检查浏览器 API 是否存在的实用 Hook，在服务端始终返回 `false`，将真实检查延迟到 effect 中。
- **`useSyncExternalStore` 与服务端快照** — 像 `useWindowSize` 这样的 Hooks 使用 React 18 的外部存储 API 和明确的服务端快照来保证水合安全。
- **安全的初始状态** — 像 `useMediaQuery` 这样的 Hooks 接受 `defaultState` 参数，让你可以控制服务端渲染的值，防止不匹配。

## 实际的 Next.js 示例

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

以上三个示例在 Next.js App Router 和 Pages Router 中都可以正常工作，无需任何额外配置。

## SSR 安全 Hooks 检查清单

在为 SSR 环境编写或审查自定义 Hooks 时，请使用此检查清单：

- [ ] **不在模块作用域访问浏览器 API** — 将所有 `window`/`document` 用法包装在 effect 或防护中。
- [ ] **服务端和客户端的初始渲染相同** — 不要基于浏览器检查来分支初始状态。
- [ ] **使用 `useEffect` 读取浏览器信息** — 将 `window`、`document` 和 `navigator` 的访问延迟到 effect 中。
- [ ] **用 `useIsomorphicLayoutEffect` 替代 `useLayoutEffect`** — 避免 SSR 警告。
- [ ] **使用 `useSyncExternalStore` 时提供 `getServerSnapshot`**。
- [ ] **接受 `defaultState` 或 `initialValue` 参数** — 让使用者控制服务端渲染的值。
- [ ] **用 SSR 测试** — 使用 `renderToString` 渲染你的组件，验证没有错误或不匹配。

## 安装

```bash
npm i @reactuses/core
```

或使用其他包管理器：

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

ReactUse 中的每个 Hook 都遵循上述模式。你可以将它们直接放入任何 Next.js、Remix 或 Gatsby 项目中，无需担心水合错误。

---

ReactUse 提供了 100 多个兼容 SSR 的 Hooks。[查看全部 →](https://reactuse.com)
