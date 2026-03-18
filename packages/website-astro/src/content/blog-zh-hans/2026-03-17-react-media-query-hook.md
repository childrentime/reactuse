---
title: "useMediaQuery：React 响应式设计完全指南"
description: "学习如何使用 ReactUse 的 useMediaQuery Hook 构建自适应 React 组件，适配屏幕尺寸、深色模式偏好等。"
slug: react-media-query-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-17
tags: [react, hooks, tutorial, responsive-design, useMediaQuery]
keywords: [react media query, useMediaQuery, responsive react, react responsive design, media query hook]
image: /img/og.png
---

# useMediaQuery：React 响应式设计完全指南

CSS 媒体查询能处理大部分响应式布局工作，但有时你需要在 JavaScript 层面让 React 组件感知当前的视口、用户偏好或设备能力。无论是条件渲染移动端导航、检测深色模式，还是尊重减少动效偏好，`useMediaQuery` 都能给你一个与任意 CSS 媒体查询字符串保持同步的响应式布尔值。

<!-- truncate -->

## 什么是 useMediaQuery？

`useMediaQuery` 是 [ReactUse](https://reactuse.com) 提供的一个 Hook，它封装了浏览器的 `window.matchMedia` API。传入一个媒体查询字符串，返回一个布尔值表示该查询当前是否匹配。它在底层订阅了 `change` 事件，因此当用户调整窗口大小、切换系统深色模式或改变查询描述的任何条件时，返回值会自动更新。

```tsx
import { useMediaQuery } from "@reactuses/core";

function Example() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return <p>{isMobile ? "移动端视图" : "桌面端视图"}</p>;
}
```

函数签名非常简洁：

```ts
useMediaQuery(query: string, defaultState?: boolean) => boolean
```

- **query** -- 任意有效的 CSS 媒体查询字符串。
- **defaultState** -- 可选的布尔值，用于服务端渲染时 `window` 不可用的情况。

## 基本用法

最常见的场景是检测屏幕宽度断点：

```tsx
import { useMediaQuery } from "@reactuses/core";

function Navigation() {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return (
      <button aria-label="打开菜单">
        <HamburgerIcon />
      </button>
    );
  }

  return (
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  );
}
```

组件仅在布尔值变化时重新渲染——而非窗口每移动一个像素都触发。

## 常用断点模式

对于使用多个断点的项目，在一处定义并在各组件间复用：

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
      <Card title="收入" />
      <Card title="用户" />
      <Card title="订单" />
      <Card title="增长" />
    </div>
  );
}
```

## 响应式布局

以下是一个实际示例，在桌面端显示侧边栏布局，在移动端显示堆叠布局：

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

## 检测用户偏好

媒体查询不限于屏幕尺寸。你还可以检测系统级用户偏好：

### 深色模式

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

### 减少动效

尊重 `prefers-reduced-motion` 对无障碍性至关重要。有晕动症或前庭功能障碍的用户会在操作系统层面设置此偏好：

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

### 高对比度及其他查询

```tsx
const prefersHighContrast = useMediaQuery("(prefers-contrast: high)");
const isPortrait = useMediaQuery("(orientation: portrait)");
const hasHover = useMediaQuery("(hover: hover)");
```

## SSR 与 Hydration 安全

在服务端渲染时，`window.matchMedia` 不存在。如果不提供 `defaultState`，Hook 在服务端返回 `false`，在客户端返回真实值，这可能导致 React hydration 不匹配的警告。

为避免此问题，传入一个与大多数用户预期相匹配的 `defaultState`：

```tsx
// 服务端渲染为 false，客户端更新为真实值
const isMobile = useMediaQuery("(max-width: 768px)", false);

// 服务端渲染为 true，适用于大部分流量来自移动端的场景
const isMobile = useMediaQuery("(max-width: 768px)", true);
```

在开发模式下，如果你在服务端渲染时未提供 `defaultState`，Hook 会在控制台输出警告，提醒你显式处理这种情况。

## 与其他 Hooks 组合

`useMediaQuery` 与其他 ReactUse Hook 搭配使用效果很好：

```tsx
import { useMediaQuery, useLocalStorage } from "@reactuses/core";

function ThemeSwitcher() {
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [userTheme, setUserTheme] = useLocalStorage<"light" | "dark" | "system">("theme", "system");

  const isDark = userTheme === "system" ? systemPrefersDark : userTheme === "dark";

  return (
    <div>
      <p>当前主题：{isDark ? "深色" : "浅色"}</p>
      <select value={userTheme} onChange={(e) => setUserTheme(e.target.value as "light" | "dark" | "system")}>
        <option value="system">跟随系统</option>
        <option value="light">浅色</option>
        <option value="dark">深色</option>
      </select>
    </div>
  );
}
```

## 常见错误

**在渲染中直接使用 window.matchMedia。** 在渲染期间调用 `window.matchMedia` 而不订阅变化，只能得到一个过时的快照。`useMediaQuery` 订阅了 `change` 事件，保证值始终是最新的。

**SSR 时忘记 defaultState。** 如果你使用 Next.js、Remix 或 Astro，务必传入 `defaultState` 以防止 hydration 警告。

**创建过多监听器。** 每次调用 `useMediaQuery` 会创建一个 `matchMedia` 监听器。虽然这很轻量，但如果你需要几十个查询，考虑将相关断点归入一个自定义 Hook（如上面的 `useBreakpoint`）。

## 安装

```bash
npm i @reactuses/core
```

或使用其他包管理器：

```bash
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

## 相关 Hooks

- [useMediaQuery 文档](https://reactuse.com/browser/useMediaQuery/) -- 完整 API 参考和交互式演示
- [useWindowSize](https://reactuse.com/browser/useWindowSize/) -- 获取视口的实际像素尺寸
- [useBreakpoints](https://reactuse.com/browser/useBreakpoints/) -- 命名断点辅助工具（sm、md、lg、xl）
- [useDarkMode](https://reactuse.com/browser/useDarkMode/) -- 完整的深色模式管理与持久化

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
