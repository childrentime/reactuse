---
title: "ReactUse：100+ 个你需要了解的生产级 React Hooks"
description: "介绍 ReactUse，一个包含 100 多个 React Hooks 的综合集合，涵盖浏览器 API、状态管理、传感器、动画等。TypeScript 优先、支持 Tree-shaking、兼容 SSR。"
slug: reactuse-100-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, typescript, announcement]
keywords: [react hooks, custom hooks, react hook library, reactuse, typescript hooks, SSR hooks, browser hooks]
image: /img/og.png
---

# ReactUse：100+ 个生产级 React Hooks

构建现代 React 应用需要处理大量的浏览器 API、状态管理模式和 DOM 交互。**ReactUse** 提供了 100 多个精心设计的 Hooks，帮助你消除样板代码，专注于功能开发。

<!-- truncate -->

## 为什么选择 ReactUse？

如果你在 Vue 生态中使用过 [VueUse](https://vueuse.org/)，ReactUse 将同样的理念带到了 React：一个全面的、类型完善的、支持 Tree-shaking 的实用 Hooks 集合。

### ReactUse 有何不同？

- **100+ 个 Hooks** — 目前最全面的 React Hooks 集合
- **TypeScript 优先** — 每个 Hook 都有完整的类型定义
- **支持 Tree-shaking** — 按需导入，零捆绑包冗余
- **兼容 SSR** — 与 Next.js、Remix 等框架无缝配合
- **交互式文档** — 每个 Hook 在 [reactuse.com](https://reactuse.com) 上都有可实时编辑的演示
- **MCP 支持** — 为现代开发工作流提供 AI 驱动的 Hook 发现

### Hook 分类

**浏览器 Hooks（48 个）：** 从剪贴板访问到地理定位，从媒体查询到 Web 通知，应有尽有。

```tsx
import { useClipboard, useDarkMode, useGeolocation } from "@reactuses/core";
```

**状态 Hooks（24 个）：** LocalStorage 持久化、防抖、节流、切换等。

```tsx
import { useLocalStorage, useDebounce, useToggle } from "@reactuses/core";
```

**元素 Hooks（19 个）：** 尺寸测量、交叉观察、拖放、滚动追踪。

```tsx
import { useElementSize, useIntersectionObserver, useDraggable } from "@reactuses/core";
```

**副作用 Hooks（20 个）：** 事件监听、定时器、生命周期 Hooks 和异步副作用。

```tsx
import { useEventListener, useInterval, useAsyncEffect } from "@reactuses/core";
```

## 快速开始

使用你喜欢的包管理器安装：

```bash
npm i @reactuses/core
```

立即使用任意 Hook：

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

## 生产环境实践

ReactUse 已被多家知名企业在生产环境中使用，包括 **Shopee**、**拼多多（PDD）**、**携程（Ctrip）** 和 **拓竹科技（Bambu Lab）**。

## 立即开始

- [文档](https://reactuse.com)
- [GitHub](https://github.com/childrentime/reactuse)
- [Discord 社区](https://discord.gg/VEMFdByJ)

我们期待你的反馈——在 GitHub 上给我们加星，加入社区！
