---
title: "React 深色模式切换：完整指南"
description: "学习如何在 React 中使用 CSS、系统偏好设置和 useDarkMode Hook 实现深色模式切换。涵盖持久化、主题模式和生产级解决方案。"
slug: react-dark-mode-toggle
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, dark-mode, useDarkMode]
keywords: [react dark mode, dark mode toggle react, useDarkMode, react theme toggle, dark light mode react]
image: /img/og.png
---

# React 深色模式切换：完整指南

深色模式已经成为用户期望在现代 Web 应用中拥有的标准功能。深色模式切换让用户可以在浅色和深色配色方案之间切换，在低光环境下减少眼部疲劳，并在 OLED 屏幕上节省电量。本指南将带你从手动 CSS 方式到使用 `useDarkMode` Hook 的生产级解决方案，逐步实现 React 中的深色模式。

<!-- truncate -->

## 为什么深色模式很重要

深色模式不再只是锦上添花——它是用户的期望。研究表明，超过 80% 的用户至少在某些场景下偏好深色模式。除了用户偏好之外，深色模式还提供了实实在在的好处：

- **低光条件下减少眼部疲劳**
- **在 OLED 和 AMOLED 屏幕上降低电量消耗**
- **为光敏感用户改善无障碍体验**
- **更精致的产品质感**，体现对细节的关注

要做好深色模式，不仅仅是交换背景颜色。你需要处理系统偏好设置、持久化用户选择，以及避免页面加载时出现错误主题闪烁的问题。

## 手动 CSS 方式

最简单的起点是在根元素上添加 CSS 类：

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

然后在 React 中切换类名：

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

这适用于基本场景，但有一些问题。页面刷新后偏好会重置，它忽略了用户的系统设置，而且逻辑会在组件间重复。

## 检测系统偏好

大多数操作系统允许用户设置全局深色模式偏好。你可以通过 `prefers-color-scheme` 媒体查询来检测它：

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

这尊重了用户的操作系统设置，并能实时响应变化。但你仍然需要处理 localStorage 持久化、SSR 安全性、DOM 上的类名应用以及保持所有状态同步。对于每个项目来说，这是大量的样板代码。

## 简单方式：useDarkMode

ReactUse 的 [useDarkMode](https://reactuse.com/browser/useDarkMode/) Hook 只需一次调用就能处理所有这些。它检测系统偏好，将用户选择持久化到 localStorage，将 CSS 类应用到 DOM，并且安全支持 SSR：

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

该 Hook 返回一个包含三个值的元组：

1. **`isDark`** — 一个布尔值，表示深色模式是否激活
2. **`toggle`** — 在深色和浅色模式之间切换的函数
3. **`setDark`** — 用于程序化控制的设置函数

## 持久化用户偏好

默认情况下，`useDarkMode` 将用户选择存储在 `localStorage` 中，键名为 `reactuses-color-scheme`。你可以自定义键名和存储后端：

```tsx
const [isDark, toggle] = useDarkMode({
  classNameDark: "dark",
  classNameLight: "light",
  storageKey: "my-app-theme",
});
```

如果你需要使用 `sessionStorage` 而不是 `localStorage`：

```tsx
const [isDark, toggle] = useDarkMode({
  classNameDark: "dark",
  classNameLight: "light",
  storage: () => sessionStorage,
});
```

当没有存储的偏好设置时，Hook 会自动通过 `prefers-color-scheme` 回退到用户的系统偏好。

## 常见模式

### 主题感知组件

构建根据当前主题调整样式的组件：

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

### 应用到自定义选择器

默认情况下，类会被应用到 `<html>` 元素。你可以指定不同的元素：

```tsx
const [isDark, toggle] = useDarkMode({
  selector: "#app-root",
  attribute: "data-theme",
  classNameDark: "dark",
  classNameLight: "light",
});
```

这会将类添加到匹配 `#app-root` 的元素上，如果你的 CSS 框架需要，你也可以使用 data 属性而非类名。

## 安装

```bash
npm i @reactuses/core
```

或使用其他包管理器：

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

## 相关 Hooks

- [useDarkMode 文档](https://reactuse.com/browser/useDarkMode/) — 完整 API 参考和交互式演示
- [useColorMode](https://reactuse.com/browser/useColorMode/) — 用于超越浅色/深色的多模式主题
- [useMediaQuery](https://reactuse.com/browser/useMediaQuery/) — 用于响应任何 CSS 媒体查询
- [useLocalStorage](https://reactuse.com/state/useLocalStorage/) — 用于通用的持久化状态

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
