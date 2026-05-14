---
title: "如何在 React 中正确获取窗口尺寸"
description: "学习在 React 中检测窗口和屏幕尺寸的正确方式。对比手动 resize 监听器和 useWindowSize Hook，构建简洁、SSR 安全的响应式组件。"
slug: react-window-size-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, responsive, useWindowSize]
keywords: [react window size, useWindowSize, react screen size, react responsive hook, react resize]
image: /img/og.png
---

# 如何在 React 中正确获取窗口尺寸

响应式设计不仅仅停留在 CSS 层面。迟早你会需要在 React 组件中获取实际的窗口宽度或高度——用来条件渲染侧边栏、在移动端和桌面端之间切换图表库，或者计算动态布局。正确地获取这个值，尤其是在涉及服务端渲染的情况下，比看起来要棘手得多。

<!-- truncate -->

## 为什么需要在 JavaScript 中获取窗口尺寸

CSS 媒体查询可以覆盖许多响应式场景，但有些情况需要 JavaScript：

- **条件渲染组件** — 在移动端显示汉堡菜单，在桌面端渲染完整导航栏。
- **Canvas 和图表尺寸** — D3、Chart.js 和 Three.js 等库需要明确的像素尺寸。
- **虚拟列表** — react-window 和 react-virtualized 需要容器高度来计算渲染多少行。
- **动态计算** — 定位工具提示、调整拖拽手柄大小或计算宽高比。

在所有这些场景中，你需要 `window.innerWidth` 和 `window.innerHeight` 的实时响应式值。

## 使用 resize 监听器的手动方式

最常见的 DIY 方案如下：

```tsx
import { useEffect, useState } from "react";

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}
```

这对简单的纯客户端应用来说可以工作，但随着项目增长会暴露真正的问题。

## SSR 陷阱：window is not defined

如果你使用 Next.js、Remix、Astro 或任何在服务端渲染的框架，上面的代码会崩溃：

> **ReferenceError: window is not defined**

服务端没有浏览器窗口，所以在渲染期间直接访问 `window` 会报错。常见的解决方法包括将所有内容包装在 `typeof window !== "undefined"` 检查中或将状态初始化为 `0`。但随后你会面临**水合不匹配**：服务端渲染宽度为 `0`，客户端渲染宽度为 `1440`，React 会警告 HTML 不匹配。

正确处理这个问题需要在服务端快照和客户端快照之间进行精心协调——这正是 React 的 `useSyncExternalStore` 所设计的用途。

## 简洁的解决方案：ReactUse 的 useWindowSize

[ReactUse](https://reactuse.com) 提供了一个 `useWindowSize` Hook，为你处理所有这些细节。它底层使用 `useSyncExternalStore`，这意味着它**兼容并发模式**且**开箱即用支持 SSR**。

```tsx
import { useWindowSize } from "@reactuses/core";

function Dashboard() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>Window: {width} x {height}</p>
      {width < 768 ? <MobileNav /> : <DesktopNav />}
    </div>
  );
}
```

该 Hook 返回一个包含 `width` 和 `height` 属性的响应式对象。它订阅浏览器的 `resize` 事件，在卸载时清理，并通过引用相等性检查避免不必要的重新渲染。在服务端它返回安全的初始值，消除水合警告。

### 依赖追踪

ReactUse 实现的一个巧妙特性是**依赖追踪**。如果你的组件只读取 `width`，Hook 会追踪这一点，在只有 `height` 变化时跳过重新渲染——反之亦然。这在无需任何额外配置的情况下为你提供了细粒度的性能优化。

## 构建响应式组件

这里有一个实际示例：一个根据窗口宽度切换列数的响应式网格。

```tsx
import { useWindowSize } from "@reactuses/core";

function ResponsiveGrid({ items }: { items: string[] }) {
  const { width } = useWindowSize();

  const columns = width >= 1200 ? 4 : width >= 768 ? 2 : 1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
      {items.map((item) => (
        <div key={item} style={{ padding: 16, background: "#f0f0f0" }}>
          {item}
        </div>
      ))}
    </div>
  );
}
```

因为 `useWindowSize` 只在你读取的值实际变化时才触发重新渲染，所以即使在快速调整大小时，这种模式也能保持高性能。

## 结合 useMediaQuery

对于你只关心断点而非精确像素值的场景，可以将 `useWindowSize` 与 `useMediaQuery` 结合使用：

```tsx
import { useMediaQuery } from "@reactuses/core";

function AdaptiveLayout() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  if (isMobile) return <MobileLayout />;
  if (isTablet) return <TabletLayout />;
  return <DesktopLayout />;
}
```

当你只需要布尔断点标志时使用 `useMediaQuery`。当你需要实际的数值尺寸进行计算时使用 `useWindowSize`。两者结合几乎可以覆盖 React 中所有的响应式使用场景。

## 安装

```bash
npm i @reactuses/core
```

或使用你偏好的包管理器：

```bash
pnpm add @reactuses/core
# or
yarn add @reactuses/core
```

## 相关 Hooks

- [useWindowSize 文档](https://reactuse.com/element/usewindowsize/) — 完整 API 参考和交互式演示
- [useMediaQuery](https://reactuse.com/browser/usemediaquery/) — 响应式 CSS 媒体查询匹配
- [useElementSize](https://reactuse.com/element/useelementsize/) — 追踪特定 DOM 元素的尺寸

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
