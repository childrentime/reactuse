---
title: "React 中的防抖与节流：何时使用哪个"
description: "了解 React 中防抖和节流的区别，何时使用它们，以及如何使用 ReactUse 的 useDebounce 和 useThrottleFn Hooks 来实现。"
slug: react-debounce-vs-throttle
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, performance, useDebounce, useThrottle]
keywords: [react debounce, react throttle, debounce vs throttle, useDebounce, useThrottle, react performance]
image: /img/og.png
---

# React 中的防抖与节流：何时使用哪个

防抖和节流是每个 React 开发者工具箱中不可或缺的两种限流技术。两者都能防止函数被过于频繁地调用，但它们的工作方式有本质区别。选错了会让你的 UI 感觉迟钝或浪费资源。本指南详细解析何时使用哪种技术，以及如何用最少的工作量实现它们。

<!-- truncate -->

## 什么是防抖？

防抖会延迟执行，直到一连串操作停止。可以把它想象成电梯门：每次有新人走进来，关门计时器就会重置。只有在所有人停止进入几秒后，门才会关闭。

用代码来说，一个防抖函数会在最后一次调用之后等待一段静默期（例如 300 毫秒）才真正执行。如果持续有新调用进来，计时器就会不断重启。

**示例：** 用户在搜索框中输入"react hooks"。没有防抖时，每次按键都会触发一个 API 请求（11 次请求）。使用 300 毫秒防抖后，只在用户停止输入后触发一次请求。

## 什么是节流？

节流保证函数在每个时间间隔内最多执行一次，无论被触发多少次。可以把它想象成节拍器：无论你多快地敲桌子，它都以固定的速率滴答响。

节流函数会在第一次调用时立即执行，然后在间隔结束前忽略后续调用。

**示例：** 用户滚动页面时，scroll 事件每秒可能触发数百次。100 毫秒的节流确保你的滚动处理器每秒最多运行 10 次，保持动画流畅而不会让浏览器不堪重负。

## 关键区别一览

| | **防抖** | **节流** |
|---|---|---|
| **触发时机** | 操作停止 *N* 毫秒后 | 每 *N* 毫秒最多一次 |
| **首次调用** | 延迟 | 立即 |
| **保证执行** | 仅在静默期之后 | 按固定间隔 |
| **最适合** | 最终值场景 | 持续反馈场景 |
| **类比** | 电梯门等待关闭 | 节拍器稳定跳动 |

## 何时使用防抖

当你只关心一连串事件之后的**最终结果**时，防抖是正确的选择：

- **搜索输入** -- 等待用户停止输入后再查询 API。
- **表单字段的 API 调用** -- 避免每次字符变化都发送请求。
- **表单验证** -- 在用户编辑完字段后验证，而不是在按键中间。
- **窗口大小调整计算** -- 在用户完成调整大小后重新计算布局。

## 何时使用节流

当你需要在持续事件期间获得**稳定、周期性更新**时，节流是正确的选择：

- **滚动位置追踪** -- 更新进度条或触发无限滚动加载。
- **窗口大小调整** -- 在用户仍在拖拽时进行响应式布局调整。
- **鼠标/触摸移动** -- 追踪指针坐标，用于拖放或绘图。
- **限速 API 调用** -- 确保永远不超过每秒请求次数限制。

## 使用 ReactUse 实现

### 使用 `useDebounce` 防抖值

`useDebounce` 接受一个值并返回其防抖版本。返回的值仅在指定的等待时间内无活动后才更新。

```tsx
import { useDebounce } from "@reactuses/core";
import { useEffect, useState } from "react";

function SearchBox() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // Only fires 300ms after the user stops typing
      fetchSearchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### 使用 `useThrottleFn` 节流函数

`useThrottleFn` 包装一个函数并返回一个带有 `run`、`cancel` 和 `flush` 控制方法的节流版本。

```tsx
import { useThrottleFn } from "@reactuses/core";
import { useEffect, useState } from "react";

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  const { run: handleScroll } = useThrottleFn(
    () => {
      setScrollY(window.scrollY);
    },
    100
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return <div>Scroll position: {scrollY}px</div>;
}
```

## 常见错误

1. **对滚动事件使用防抖。** 回调只在滚动停止后才触发，所以在整个滚动过程中你的 UI 会感觉像冻住了。用户在滚动时期望持续的视觉反馈，所以节流才是正确的选择。

2. **对搜索输入使用节流。** 节流在用户仍在输入时会周期性触发，这会发送不必要的中间 API 请求，包含不完整的查询。防抖等待用户暂停，确保只发送最终的完整查询。

3. **每次渲染都创建新的防抖/节流函数。** 这是一个微妙但常见的 Bug。新函数意味着新的内部计时器，这实际上在每次渲染时都重置了延迟，违背了初衷。ReactUse 的 Hooks 通过使用 refs 和 `useMemo` 在内部记忆化节流或防抖函数来为你处理这个问题。

4. **忘记清理。** 防抖或节流的调用可能在组件卸载后触发，导致令人头疼的"在已卸载组件上更新状态"警告。ReactUse 的 `useDebounce` 和 `useThrottleFn` 在组件卸载时会自动取消所有待执行的调用，你无需担心过期回调。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hooks

- [useDebounce 文档](https://reactuse.com/state/useDebounce/) -- 对响应式值进行防抖
- [useDebounceFn 文档](https://reactuse.com/effect/useDebounceFn/) -- 对函数进行防抖
- [useThrottle 文档](https://reactuse.com/state/useThrottle/) -- 对响应式值进行节流
- [useThrottleFn 文档](https://reactuse.com/effect/useThrottleFn/) -- 对函数进行节流

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
