---
title: "使用 Hooks 构建无障碍 React 组件"
description: "学习如何在 React 中使用 ReactUse 的无障碍 Hooks 来尊重用户的减少动画、颜色对比度和颜色方案偏好。"
slug: react-accessibility-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, accessibility, a11y, tutorial]
keywords: [react accessibility, useReducedMotion, prefers-reduced-motion, react a11y hooks, accessible react components, prefers-color-scheme, prefers-contrast]
image: /img/og.png
---

# 使用 Hooks 构建无障碍 React 组件

无障碍不是上线前才需要检查的清单，而是从第一行代码开始就需要贯彻的设计约束。谈到 React 中的无障碍，大多数开发者会想到 ARIA 属性、语义化 HTML 和屏幕阅读器支持。这些确实重要。但还有一个完整的无障碍类别很少受到关注：**尊重用户在操作系统层面已经设置好的偏好。**

<!-- truncate -->

每个主流操作系统都允许用户配置减少动画、高对比度、深色模式和文本方向等偏好。这些不是装饰性的选择。启用"减少动画"的用户可能患有前庭功能障碍，动画过渡会让他们感到身体不适。启用高对比度的用户可能视力低下。当你的 React 应用忽略这些信号时，这不仅仅是功能缺失——而是一道屏障。

本文将向你展示如何使用 [ReactUse](https://reactuse.com) 的 hooks 在 React 中检测和响应这些操作系统级别的偏好。我们将覆盖减少动画、对比度偏好、颜色方案检测、焦点管理和文本方向——然后将所有内容整合到一个实际的组件中。

## 手动监听媒体查询的问题

浏览器通过 CSS 媒体查询（如 `prefers-reduced-motion`、`prefers-contrast` 和 `prefers-color-scheme`）暴露操作系统级别的偏好。你可以在 JavaScript 中使用 `window.matchMedia` 来读取这些值。手动实现的方式如下：

```tsx
import { useState, useEffect } from "react";

function useManualReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
```

这段代码能工作，但存在问题。你需要处理 SSR（`window` 不存在的情况）、管理事件监听器的清理，并且需要为每个想要跟踪的媒体查询重复这个模式。将这个模式乘以减少动画、对比度、颜色方案和其他查询，你最终会得到大量容易出错的样板代码。

ReactUse 提供的 hooks 封装了这个模式，包含正确的 SSR 处理、适当的清理逻辑，以及当用户更改系统偏好时的实时更新。

## useReducedMotion：尊重动画偏好

[`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) hook 检测用户是否在设备上启用了"减少动画"设置。这是你能使用的最具影响力的无障碍 hooks 之一，因为动画可能会给前庭功能障碍的用户带来真实的身体不适。

```tsx
import { useReducedMotion } from "@reactuses/core";

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      style={{
        transition: prefersReducedMotion
          ? "none"
          : "transform 0.3s ease, opacity 0.3s ease",
        animation: prefersReducedMotion ? "none" : "fadeIn 0.5s ease-in",
      }}
    >
      {children}
    </div>
  );
}
```

这里的关键不是简单地禁用动画——而是在没有动画的情况下提供等价的体验。对于大多数用户需要 500ms 淡入的卡片，对于偏好减少动画的用户应该立即显示。内容相同，只是呈现方式不同。

你还可以使用这个 hook 在不同的动画策略之间切换：

```tsx
import { useReducedMotion } from "@reactuses/core";

function PageTransition({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // 即时过渡——没有动画，但仍然有视觉变化
    return <div style={{ opacity: 1 }}>{children}</div>;
  }

  // 为未选择减少动画的用户提供完整的滑入动画
  return (
    <div
      style={{
        animation: "slideInFromRight 0.4s ease-out",
      }}
    >
      {children}
    </div>
  );
}
```

## usePreferredContrast：适应对比度需求

[`usePreferredContrast`](https://reactuse.com/browser/usepreferredcontrast/) hook 读取 `prefers-contrast` 媒体查询，告诉你用户想要更多对比度、更少对比度，还是没有偏好。这对视力低下的用户至关重要。

```tsx
import { usePreferredContrast } from "@reactuses/core";

function ThemedButton({ children, onClick }: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const contrast = usePreferredContrast();

  const getButtonStyles = () => {
    switch (contrast) {
      case "more":
        return {
          backgroundColor: "#000000",
          color: "#FFFFFF",
          border: "3px solid #FFFFFF",
          fontWeight: 700 as const,
        };
      case "less":
        return {
          backgroundColor: "#E8E8E8",
          color: "#333333",
          border: "1px solid #CCCCCC",
          fontWeight: 400 as const,
        };
      default:
        return {
          backgroundColor: "#3B82F6",
          color: "#FFFFFF",
          border: "2px solid transparent",
          fontWeight: 500 as const,
        };
    }
  };

  return (
    <button onClick={onClick} style={getButtonStyles()}>
      {children}
    </button>
  );
}
```

当用户请求更高对比度时，你应该增大前景和背景颜色之间的差异、使用更粗的字体粗细、让边框更明显。当他们请求更低对比度时，柔化视觉强度。默认分支处理未设置偏好的用户。

## usePreferredColorScheme：系统主题检测

[`usePreferredColorScheme`](https://reactuse.com/browser/usepreferredcolorscheme/) hook 告诉你用户的操作系统是设置为浅色模式、深色模式，还是没有偏好。这是构建主题感知组件的基础。

```tsx
import { usePreferredColorScheme } from "@reactuses/core";

function AdaptiveCard({ title, body }: { title: string; body: string }) {
  const colorScheme = usePreferredColorScheme();

  const isDark = colorScheme === "dark";

  return (
    <div
      style={{
        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        color: isDark ? "#E2E8F0" : "#1E293B",
        border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
        borderRadius: "8px",
        padding: "24px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
```

如果你只需要一个简单的布尔值判断，ReactUse 还提供了 [`usePreferredDark`](https://reactuse.com/browser/usepreferreddark/)，当用户偏好深色方案时返回 `true`。如果你需要一个完整的深色模式切换并持久化用户的选择，[`useDarkMode`](https://reactuse.com/browser/usedarkmode/) 可以开箱即用。

对于更细粒度的媒体查询控制，[`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) 让你订阅任何 CSS 媒体查询字符串并获得实时更新。

## useFocus：键盘导航和焦点管理

键盘导航是核心无障碍要求。无法使用鼠标的用户依赖 Tab 键在交互元素之间移动。[`useFocus`](https://reactuse.com/element/usefocus/) hook 提供了对焦点的编程控制，这对于模态对话框、下拉菜单和动态内容至关重要。

```tsx
import { useRef } from "react";
import { useFocus } from "@reactuses/core";

function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useFocus(inputRef);

  return (
    <div>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search..."
        style={{
          outline: focused ? "2px solid #3B82F6" : "1px solid #D1D5DB",
          padding: "8px 12px",
          borderRadius: "6px",
          width: "100%",
        }}
      />
      <button onClick={() => setFocused(true)}>
        Focus Search (Ctrl+K)
      </button>
    </div>
  );
}
```

这个 hook 同时返回当前焦点状态和一个设置函数。你可以使用焦点状态来应用视觉指示器（超出浏览器默认样式），并使用设置函数来编程式地移动焦点——例如，当模态框打开时或当触发键盘快捷键时。

将此与 [`useActiveElement`](https://reactuse.com/element/useactiveelement/) 配合使用，可以跟踪整个应用中当前拥有焦点的元素，这对于构建焦点陷阱和跳过导航链接非常有用。

## useTextDirection：RTL 和 LTR 支持

国际化和无障碍有很大的重叠。[`useTextDirection`](https://reactuse.com/browser/usetextdirection/) hook 检测和管理文档的文本方向，支持从左到右（LTR）和从右到左（RTL）布局。

```tsx
import { useTextDirection } from "@reactuses/core";

function NavigationMenu() {
  const [dir, setDir] = useTextDirection();

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: dir === "rtl" ? "row-reverse" : "row",
        gap: "16px",
        padding: "12px 24px",
      }}
    >
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
      <button onClick={() => setDir(dir === "rtl" ? "ltr" : "rtl")}>
        Toggle Direction
      </button>
    </nav>
  );
}
```

RTL 支持影响的不仅仅是文本对齐。导航顺序、图标位置和 margin/padding 方向都需要翻转。通过使用 `useTextDirection` 作为唯一数据源，你可以构建自动适应的布局逻辑。

## 综合示例：无障碍通知组件

下面是一个将多个无障碍 hooks 整合到单个组件中的实际示例——一个尊重动画偏好、适应对比度设置、跟随系统颜色方案并正确管理焦点的通知提示：

```tsx
import { useRef, useEffect } from "react";
import {
  useReducedMotion,
  usePreferredContrast,
  usePreferredColorScheme,
  useFocus,
} from "@reactuses/core";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
  onDismiss: () => void;
}

function AccessibleNotification({
  message,
  type,
  visible,
  onDismiss,
}: NotificationProps) {
  const prefersReducedMotion = useReducedMotion();
  const contrast = usePreferredContrast();
  const colorScheme = usePreferredColorScheme();
  const dismissRef = useRef<HTMLButtonElement>(null);
  const [, setFocused] = useFocus(dismissRef);

  const isDark = colorScheme === "dark";
  const isHighContrast = contrast === "more";

  // 通知出现时将焦点移至关闭按钮
  useEffect(() => {
    if (visible) {
      setFocused(true);
    }
  }, [visible, setFocused]);

  if (!visible) return null;

  const colors = {
    success: {
      bg: isDark ? "#064E3B" : "#ECFDF5",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#10B981" : "#6EE7B7",
      text: isDark ? "#A7F3D0" : "#065F46",
    },
    error: {
      bg: isDark ? "#7F1D1D" : "#FEF2F2",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#EF4444" : "#FCA5A5",
      text: isDark ? "#FECACA" : "#991B1B",
    },
    info: {
      bg: isDark ? "#1E3A5F" : "#EFF6FF",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#3B82F6" : "#93C5FD",
      text: isDark ? "#BFDBFE" : "#1E40AF",
    },
  };

  const scheme = colors[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        backgroundColor: scheme.bg,
        color: scheme.text,
        border: `${isHighContrast ? "3px" : "1px"} solid ${scheme.border}`,
        borderRadius: "8px",
        padding: "16px 20px",
        maxWidth: "400px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontWeight: isHighContrast ? 700 : 400,
        // 尊重动画偏好
        animation: prefersReducedMotion ? "none" : "slideIn 0.3s ease-out",
        transition: prefersReducedMotion ? "none" : "opacity 0.2s ease",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        ref={dismissRef}
        onClick={onDismiss}
        aria-label="关闭通知"
        style={{
          background: "none",
          border: `1px solid ${scheme.text}`,
          color: scheme.text,
          cursor: "pointer",
          borderRadius: "4px",
          padding: "4px 8px",
          fontWeight: isHighContrast ? 700 : 500,
        }}
      >
        关闭
      </button>
    </div>
  );
}
```

这个组件展示了几个无障碍原则的协同工作：

1. **`role="alert"` 和 `aria-live="assertive"`** 确保屏幕阅读器立即播报通知。
2. **`useReducedMotion`** 为偏好减少动画的用户禁用滑入动画。
3. **`usePreferredContrast`** 为需要更高对比度的用户增加边框宽度和字体粗细。
4. **`usePreferredColorScheme`** 根据用户的浅色或深色主题适配所有颜色。
5. **`useFocus`** 将键盘焦点移至关闭按钮，使用户无需使用鼠标就能操作通知。

## 为什么 Hooks 是无障碍的正确抽象

Hooks 具有可组合性。每个无障碍关注点都封装在自己的 hook 中，你可以按需组合它们。一个简单的按钮可能只使用 `usePreferredContrast`。一个复杂的模态框可能使用我们介绍的全部五个 hooks。这些 hooks 互相独立，这意味着你可以逐步采用它们，无需重构现有代码。

Hooks 还能实时响应变化。如果用户在你的应用打开时从浅色切换到深色模式，hooks 会更新，你的组件会使用新的偏好重新渲染。这是仅使用 CSS 的方案（依赖静态类名）难以实现的。

## 安装

通过包管理器安装 ReactUse：

```bash
npm install @reactuses/core
```

然后导入你需要的 hooks：

```tsx
import {
  useReducedMotion,
  usePreferredContrast,
  usePreferredColorScheme,
  useFocus,
  useTextDirection,
} from "@reactuses/core";
```

## 相关 Hooks

- [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) — 检测 `prefers-reduced-motion` 偏好
- [`usePreferredContrast`](https://reactuse.com/browser/usepreferredcontrast/) — 检测 `prefers-contrast` 偏好
- [`usePreferredColorScheme`](https://reactuse.com/browser/usepreferredcolorscheme/) — 检测 `prefers-color-scheme`（浅色、深色或无偏好）
- [`usePreferredDark`](https://reactuse.com/browser/usepreferreddark/) — 深色模式检测的布尔值简写
- [`useDarkMode`](https://reactuse.com/browser/usedarkmode/) — 带持久化的完整深色模式切换
- [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) — 订阅任何 CSS 媒体查询
- [`useFocus`](https://reactuse.com/element/usefocus/) — 编程式焦点管理
- [`useActiveElement`](https://reactuse.com/element/useactiveelement/) — 跟踪当前拥有焦点的元素
- [`useTextDirection`](https://reactuse.com/browser/usetextdirection/) — 检测和控制 LTR/RTL 文本方向

ReactUse 提供了 100 多个 React hooks。[探索全部 &rarr;](https://reactuse.com)
