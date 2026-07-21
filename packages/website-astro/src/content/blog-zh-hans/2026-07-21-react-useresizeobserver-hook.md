---
title: "React useResizeObserver Hook：追踪元素尺寸变化（2026）"
description: "一篇实用的 useResizeObserver 上手指南：用原生 ResizeObserver API 监听任意元素——支持 ref、元素、getter 三种目标形式，自动清理，box 选项详解——外加 useElementSize 和 useMeasure，只想拿数字时直接用。SSR 安全，TypeScript 优先。"
slug: react-useresizeobserver-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-21
tags: [react, hooks, browser-api, typescript, tutorial]
keywords: [react useResizeObserver, useResizeObserver hook, useresizeobserver react, resize observer react, ResizeObserver react hook, react 元素尺寸 hook, useElementSize, useMeasure react, react-use-measure 替代, react 测量元素, 监听元素尺寸变化 react, react 容器宽度 hook, useResizeObserver typescript]
image: /img/og.png
---

# React useResizeObserver Hook：追踪元素尺寸变化（2026）

一个图表组件在挂载时读取一次容器宽度，然后按这个宽度绘制自己。接着用户把侧边栏折叠了。容器瞬间多出 300 像素，窗口没有任何变化，`resize` 事件一次都没触发——图表现在待在一个过宽的盒子里，画的还是那个已经不存在的布局。监听 `window.resize` 会漏掉元素在窗口不变的情况下改变尺寸的每一种方式：侧边栏开合、flex 兄弟节点出现、上方内容加载完成、手风琴展开。

浏览器给出的答案是 [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)——一个监听元素本身而非窗口的原生 API。[`@reactuses/core`](https://reactuse.com) 的 `useResizeObserver` 把它的生命周期全部接管：挂载时 observe，卸载时 disconnect，不留下任何失控的 observer。以下都是真实 API，TypeScript 优先。

<!-- truncate -->

## 手写版本，以及它在哪里散架

手动把 `ResizeObserver` 接进组件看起来并不难：

```tsx
function Chart() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      redraw(entries[0].contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} />;
}
```

这段代码能跑——直到它遇上真实的组件代码。常见的散架方式：

- **回调需要读 props 或 state。** 空依赖数组意味着 observer 永远调用首次渲染时的那个回调。把依赖加进去，observer 又变成每次变化都销毁重建。两种都不是你想要的。
- **options 对象反复触发 effect。** 把 `{ box: 'border-box' }` 内联写进依赖数组，每次渲染它都是一个新对象——observer 不停地断开再重连。
- **目标不是 ref。** 有时元素来自回调、portal 或 `document.querySelector`，effect + ref 的模式对每种形态都得重新接线。

单看每一条都不难。但这是你会在每个关心自身尺寸的组件里重复推导的生命周期管线——而每一份拷贝离泄漏或 observe/disconnect 死循环都只差一次重构。

## useResizeObserver——原生 API，生命周期已接管

```tsx
import { useResizeObserver } from '@reactuses/core';
import { useRef } from 'react';

function Chart() {
  const ref = useRef<HTMLDivElement>(null);

  useResizeObserver(ref, (entries) => {
    redraw(entries[0].contentRect.width);
  });

  return <div ref={ref} />;
}
```

签名：

```ts
function useResizeObserver(
  target: BasicTarget<Element>,
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions
): () => void;
```

三个值得注意的点，正好对应手写版本散架的地方：

- **目标形式灵活。** `BasicTarget` 接受 ref 对象、普通 `Element`，或返回元素的 getter 函数——同一个 hook 覆盖了 ref 场景、`querySelector` 场景，以及"元素还没挂载"的场景（`null`/`undefined` 目标在存在之前不会被 observe）。
- **回调就是原生的 `ResizeObserverCallback`。** 你拿到的是真正的 `ResizeObserverEntry[]`——`contentRect`、`borderBoxSize`、`contentBoxSize`——不是简化过的包装。而且渲染之间回调变化不会导致 observer 销毁重建；hook 对每个目标只保持一个 observer，不会每次渲染都轮换。
- **options 走深比较。** 内联写 `{ box: 'border-box' }` 没问题——hook 按值比较而非按引用比较，每次渲染的新对象字面量不会折腾 observer。

返回值是一个 `stop()` 函数：想提前断开就调用它——比如测量拿到一次就够了的场景。否则清理会在卸载时自动完成。

## `box` 选项

`ResizeObserverOptions` 只有一个字段 `box`，它决定"尺寸"是指什么：

| `box` 取值 | 测量的内容 |
| --- | --- |
| `'content-box'`（默认） | 仅内容——不含 padding 和 border |
| `'border-box'` | 内容 + padding + border——元素在布局中实际占据的大小 |
| `'device-pixel-content-box'` | 以物理设备像素计的内容盒——用于像素级精确的 canvas 工作 |

大多数布局逻辑用默认值就对了。需要匹配元素在布局中的占位时用 `'border-box'`；给 `<canvas>` 设置后备缓冲区、让它在高 DPI 屏幕上保持清晰时用 `'device-pixel-content-box'`。

## 只想拿数字？useElementSize 和 useMeasure

`useResizeObserver` 交给你的是原始的 observer entries，适合命令式工作——重绘图表、同步 canvas。但很多时候目标只是*把尺寸当作响应式状态*。[`@reactuses/core`](https://reactuse.com) 里有两个 hook 直接构建在 `useResizeObserver` 之上，专门干这个：

[`useElementSize`](https://reactuse.com/element/useelementsize/)——宽高元组：

```tsx
import { useElementSize } from '@reactuses/core';

function Card() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, height] = useElementSize(ref);

  return (
    <div ref={ref}>
      {width}px × {height}px
    </div>
  );
}
```

它支持同样的 `box` 选项（并通过 `borderBoxSize`/`contentBoxSize` 正确累加分片盒），首次测量落地之前返回 `[0, 0]`。

[`useMeasure`](https://reactuse.com/element/usemeasure/)——完整的 content rect，宽高不够用时的选择：

```tsx
import { useMeasure } from '@reactuses/core';

function Panel() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, stop] = useMeasure(ref);
  // rect: { x, y, width, height, top, left, bottom, right }

  return <div ref={ref}>{rect.width}px wide</div>;
}
```

如果你用过独立的 `react-use-measure` 包，思路是一样的——已经在用 `@reactuses/core` 的话，还能少一个依赖。

## 选对尺寸类 hook

element 分类下有好几个听起来很像的 hook，它们回答的是不同的问题：

| Hook | 回答的问题 | 更新时机 |
| --- | --- | --- |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | "元素变化时执行这段代码" | 元素 resize（原始 entries） |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | "这个元素有多大？" | 元素 resize |
| [`useMeasure`](https://reactuse.com/element/usemeasure/) | "这个元素的 content rect 是什么？" | 元素 resize |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | "这个元素在视口的什么位置？" | 元素 resize **加** 窗口滚动/resize |
| [`useWindowSize`](https://reactuse.com/element/usewindowsize/) | "窗口有多大？" | 窗口 resize |

最容易绊倒人的一个区别：`useMeasure` 报告的是 observer 的 content rect（由尺寸驱动），而 [`useElementBounding`](https://reactuse.com/element/useelementbounding/) 报告的是 `getBoundingClientRect()`——相对视口的位置——并且滚动时也会刷新。定位 tooltip 或 overlay？用 `useElementBounding`。响应尺寸？用 `useElementSize` 或 `useMeasure`。更完整的 observer 家族对比——intersection、mutation、resize——见 [React Observer Hooks](https://reactuse.com/blog/react-observer-hooks/)。

## 真实使用场景

- **容器驱动的响应式组件。** 根据*自身*宽度而非视口宽度切换布局的组件，放进侧边栏、模态框、分栏面板都能正确工作。这就是容器查询的思维方式，以普通 state 的形式提供。
- **图表与 canvas。** 在绘图表面真正变化的那一刻重绘，包括 `window.resize` 永远看不到的侧边栏开合和 flex 重排。搭配 `'device-pixel-content-box'` 让高 DPI canvas 保持清晰。
- **虚拟列表。** 变高虚拟化的行测量：observe 每一行，把真实高度喂回虚拟化器。
- **自动增高的 textarea 与截断文本。** 检测内容何时溢出容器，基于测量值而非假设值切换"展开更多"。
- **元素级媒体查询。** 工具栏在自己的容器变窄的那一刻从"图标+文字"切换为"仅图标"，与窗口在做什么无关。

## SSR 安全，从构造上保证

服务端不存在 `ResizeObserver`。这三个 hook 都只在 effect 里触碰它，目标解析也有守卫——服务端渲染期间什么都不执行，`useElementSize` 返回 `[0, 0]`，`useMeasure` 返回全零的 rect，水合正常进行，不会抛 `ReferenceError`。你的代码里不需要任何 `typeof window` 检查。想排查其他手写浏览器 API 代码的同类问题，见 [SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/)。

## 要点回顾

- **`window.resize` 会漏掉大多数元素尺寸变化**——侧边栏开合、flex 重排、内容变化。`ResizeObserver` 监听元素本身，`useResizeObserver` 接管它的生命周期：挂载时 observe，卸载时 disconnect，外加一个提前退出用的 `stop()`。
- **目标形式灵活**——ref、元素或 getter——null 目标也被妥善处理，挂载顺序的杂技动作可以省了。
- **回调和 options 不会折腾 observer。** 内联回调、内联 options 对象都没问题；每个目标只有一个 observer。
- **`box` 决定"尺寸"的含义**——默认 `content-box`，布局占位用 `border-box`，canvas 工作用 `device-pixel-content-box`。
- **想要 state 而不是 entries？** [`useElementSize`](https://reactuse.com/element/useelementsize/) 给 `[width, height]`，[`useMeasure`](https://reactuse.com/element/usemeasure/) 给完整 rect，还需要视口位置就用 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)。
- **SSR 安全**——服务端不构造 observer，你的代码不需要守卫。

从 [`@reactuses/core`](https://reactuse.com/element/useresizeobserver/) 里拿走它，让组件响应它们真正拥有的尺寸。
