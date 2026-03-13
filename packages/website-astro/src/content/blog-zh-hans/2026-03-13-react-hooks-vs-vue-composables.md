---
title: "React Hooks vs Vue Composables：2026 年全面对比"
description: "详细的 React Hooks 与 Vue Composables 并排对比，探讨模式、性能，以及 ReactUse 如何将 VueUse 的最佳理念带到 React。"
slug: react-hooks-vs-vue-composables
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, vue, hooks, composables, comparison]
keywords: [react hooks vs vue composables, reactuse vs vueuse, vue composables in react, react equivalent of vueuse, react composition api]
image: /img/og.png
date: 2026-03-13
---

# React Hooks vs Vue Composables：2026 年全面对比

**React Hooks** 是以 `use` 为前缀的函数，让 React 组件无需类即可管理状态、副作用和生命周期行为。**Vue Composables** 是利用 Vue 的 Composition API 来封装和复用组件间响应式逻辑的函数。两者解决的是同一个根本问题——共享有状态逻辑——但它们使用不同的响应式模型、执行语义和生态约定来实现。

<!-- truncate -->

## 为什么这个对比很重要

在 React 和 Vue 之间切换的开发者经常寻找等价的模式。Vue 生态有 [VueUse](https://vueuse.org/)，一个包含 200 多个 Composables 的集合，已成为可复用逻辑的黄金标准。寻求同样丰富实用 Hooks 的 React 开发者现在有了 [ReactUse](https://reactuse.com)，一个包含 100 多个 Hooks 的库，直接受 VueUse 设计理念启发。

理解这两种方式的差异有助于你在任一框架中写出更好的代码，也更容易在两者之间移植模式。

## 并排对比

| 方面 | React Hooks | Vue Composables |
|---|---|---|
| **响应式模型** | 状态变化时重新渲染整个组件 | 通过代理 ref 实现细粒度响应 |
| **执行方式** | 每次渲染都运行 | 在 `setup()` 中只运行一次 |
| **状态原语** | `useState` 返回值 + setter | `ref()` / `reactive()` 返回代理 |
| **副作用** | `useEffect` 带依赖数组 | `watchEffect` 自动追踪 |
| **生命周期** | `useEffect` 清理模式 | `onMounted`、`onUnmounted` 等 |
| **规则** | 必须遵循 Hooks 规则（不能在条件中使用） | 无顺序约束 |
| **SSR** | 需要手动 `typeof window` 防护 | 内置 `onServerPrefetch` |
| **记忆化** | 显式（`useMemo`、`useCallback`） | 通过 `computed()` 自动 |
| **主流实用库** | ReactUse（100+ Hooks） | VueUse（200+ Composables） |

## 底层响应式的差异

React Hooks 在每次渲染时重新执行。当你调用 `useState` 时，React 将值存储在内部 fiber 中，每次组件函数运行时都重新返回。派生值需要 `useMemo` 和显式的依赖数组，遗漏依赖是常见的 Bug 来源。

Vue Composables 在 `setup()` 中只运行一次。Ref 和 reactive 对象是 JavaScript 代理，追踪哪些 effect 依赖它们。当 ref 变化时，只有读取它的特定 effect 会被重新触发——而非整个组件。`computed()` 自动追踪其依赖，无需手动数组。

这种区别对性能很重要。React 开发者必须仔细考虑记忆化以避免不必要的重新渲染。Vue 开发者默认获得细粒度更新，但需要理解代理解包和 ref 访问（`.value`）作为代价。

## 代码对比：useLocalStorage

在两个生态中，将状态持久化到 localStorage 都是常见需求。以下是相同功能在各自框架中的写法。

**React 使用 ReactUse：**

```tsx
import { useLocalStorage } from "@reactuses/core";

function Settings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Current: {theme}
    </button>
  );
}
```

**Vue 使用 VueUse：**

```vue
<script setup>
import { useLocalStorage } from "@vueuse/core";

const theme = useLocalStorage("theme", "light");

function toggle() {
  theme.value = theme.value === "light" ? "dark" : "light";
}
</script>

<template>
  <button @click="toggle">Current: {{ theme }}</button>
</template>
```

API 表面几乎完全相同。ReactUse 返回一个模仿 `useState` 的 `[value, setter]` 元组。VueUse 返回一个你直接修改的响应式 ref。两者都处理序列化、SSR 安全性和跨标签页同步。

## 代码对比：useWindowSize

**React 使用 ReactUse：**

```tsx
import { useWindowSize } from "@reactuses/core";

function Layout() {
  const { width, height } = useWindowSize();
  return <p>Window: {width} x {height}</p>;
}
```

**Vue 使用 VueUse：**

```vue
<script setup>
import { useWindowSize } from "@vueuse/core";

const { width, height } = useWindowSize();
</script>

<template>
  <p>Window: {{ width }} x {{ height }}</p>
</template>
```

两个库都对 resize 事件进行节流，优雅地处理 SSR，并返回响应式尺寸。使用代码几乎可以互换。

## 代码对比：useDark

**React 使用 ReactUse：**

```tsx
import { useDarkMode } from "@reactuses/core";

function ThemeToggle() {
  const [isDark, toggle] = useDarkMode({ classNameDark: "dark", classNameLight: "light" });
  return <button onClick={toggle}>{isDark ? "Light" : "Dark"}</button>;
}
```

**Vue 使用 VueUse：**

```vue
<script setup>
import { useDark, useToggle } from "@vueuse/core";

const isDark = useDark();
const toggle = useToggle(isDark);
</script>

<template>
  <button @click="toggle">{{ isDark ? 'Light' : 'Dark' }}</button>
</template>
```

ReactUse 将 toggle 打包在 Hook 的返回值中。VueUse 将 `useDark` 与通用的 `useToggle` composable 组合使用。两者都持久化偏好、尊重系统配色方案，并将 CSS 类应用到 document。

## 关键差异

**执行模型。** React Hooks 在每次渲染时运行，这意味着 Hook 内的每个变量每次组件更新时都会被重新创建。Vue Composables 只运行一次，响应式通过代理处理。这是最大的架构差异，影响你对性能、闭包和记忆化的思考方式。

**依赖追踪。** React 要求你在数组中显式声明依赖（`useEffect`、`useMemo`、`useCallback`）。Vue 在运行时自动追踪依赖。手动依赖数组是 React 中频繁的 Bug 来源——过期闭包和遗漏依赖是 React ESLint 插件报告的最常见问题之一。

**SSR 方式。** 两个框架都支持服务端渲染，但防护模式不同。React Hooks 通常在访问浏览器 API 前检查 `typeof window !== "undefined"`。Vue 提供了像 `onServerPrefetch` 和 SSR 特定的 context 等生命周期钩子。ReactUse 和 VueUse 都在内部处理这些防护，所以终端用户很少需要考虑它们。

**生态成熟度。** VueUse 自 2020 年以来一直是 Vue 生态中的主导实用库，提供超过 200 个 Composables。ReactUse 较新但增长迅速，拥有 100 多个 Hooks，覆盖相同的类别：浏览器 API、传感器、状态管理、动画和元素观察。

## ReactUse vs VueUse：React 的等价方案

ReactUse 明确作为 VueUse 的 React 等价方案而构建。两个库共享命名约定、分类组织和 API 设计原则。如果你了解 VueUse，你可以几乎无摩擦地上手 ReactUse。

| 能力 | ReactUse | VueUse |
|---|---|---|
| **Hook/Composable 数量** | 100+ | 200+ |
| **TypeScript** | 一等支持 | 一等支持 |
| **Tree-shaking** | 是 | 是 |
| **SSR 安全** | 是 | 是 |
| **交互式文档** | 是 | 是 |
| **分类** | Browser、State、Sensor、Element、Effect | Browser、State、Sensor、Element、Component、Utilities |

对于欣赏 VueUse 的广度和易用性的 React 开发者来说，ReactUse 是目前最接近的等价方案。

## 常见问题

### React Hooks 和 Vue Composables 一样吗？

它们服务于相同的目的——封装可复用的有状态逻辑——但工作方式不同。React Hooks 在每次渲染时重新执行，需要显式的依赖数组。Vue Composables 只执行一次，依赖细粒度的基于代理的响应式来进行自动依赖追踪。

### 我可以在 React 中使用 VueUse 吗？

不可以。VueUse 依赖于 Vue 的响应式系统（`ref`、`reactive`、`watchEffect`），无法在 Vue 应用之外运行。然而，[ReactUse](https://reactuse.com) 为 React 提供了等价的 Hooks，遵循相同的命名约定并覆盖相同的使用场景。

### VueUse 的 React 等价方案是什么？

[ReactUse](https://reactuse.com)（`@reactuses/core`）是最直接的等价方案。它提供 100 多个受 VueUse 启发的 Hooks，按相同的类别组织，具有 TypeScript 优先的 API 和 SSR 兼容性。使用 `npm i @reactuses/core` 安装。

### Vue 的 Composition API 比 React Hooks 更好吗？

两者都不是客观上更好的——它们反映了不同的设计哲学。Vue 的自动依赖追踪减少了样板代码并消除了过期闭包 Bug。React 的显式依赖数组给予开发者更多控制权，使复杂组件中的数据流更容易追踪。最佳选择取决于你的团队经验和项目需求。

## 总结

React Hooks 和 Vue Composables 是对同一个问题的两种解答：如何在组件之间共享有状态逻辑？Vue 依赖细粒度响应式和自动追踪。React 依赖重新执行和显式依赖。两种方式在生产环境中都表现良好，两者都有成熟的实用库——Vue 有 VueUse，React 有 ReactUse——消除了与浏览器 API、状态持久化和 DOM 观察相关的样板代码。

如果你是一个 React 开发者，希望获得 VueUse 为 Vue 带来的那种广度和精致，ReactUse 正是为你而建。

```bash
npm i @reactuses/core
```

[探索 ReactUse →](https://reactuse.com)
