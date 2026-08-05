---
title: "React useMeasure Hook：用 ResizeObserver 测量 DOM 元素 (2026)"
description: "useMeasure 实用指南：用 ResizeObserver 实时追踪元素的宽度、高度和位置——一个 Hook，零手动 observer 配置。涵盖 contentRect 的坑、useMeasure 与 useElementSize / useElementBounding 的对比、从 react-use-measure 迁移，以及 SSR 安全性。TypeScript 优先。"
slug: react-usemeasure-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-05
tags: [react, hooks, element, typescript, tutorial]
keywords: [react useMeasure, usemeasure, useMeasure hook, react-use-measure, react 测量元素, react 元素尺寸 hook, react resizeobserver hook, react 测量 div 宽高, usemeasure react, react 组件尺寸, react getboundingclientrect hook]
image: /img/og.png
---

# React useMeasure Hook：用 ResizeObserver 测量 DOM 元素 (2026)

每个 React 应用早晚都需要知道某个元素有多大。图表要先拿到容器的像素宽度才能绘制；虚拟列表需要行高；自动增高的 textarea、文本截断检测器、根据*自身*（而非视口）宽度切换布局的组件——它们都需要实时的元素尺寸，而 React 本身并不提供。于是你在 effect 里调用 `getBoundingClientRect()`，发现它只执行一次；再给 `window` 加个 `resize` 监听，又发现元素还会因为兄弟节点折叠、字体加载、内容变化而改变尺寸——这些全都不会触发 window 的 resize 事件。

正确的底层原语是 `ResizeObserver`，而 [`useMeasure`](https://reactuse.com/element/usemeasure/)（来自 [`@reactuses/core`](https://reactuse.com)）把这个原语封装成了一行代码：传入一个 ref，拿到一个实时更新的 rect。不用构造 observer，不用记着 disconnect，没有闭包过期的陷阱。本文介绍它的 API、几乎人人都会踩的 `contentRect` 坑、内部实现原理、与同族 Hook（`useElementSize`、`useElementBounding`、`useResizeObserver`）的对比，以及从 `react-use-measure` 迁移。TypeScript 优先。

<!-- truncate -->

## 最简单的场景：实时感知尺寸的容器

```tsx
import { useRef } from 'react';
import { useMeasure } from '@reactuses/core';

function Chart() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect] = useMeasure(ref);

  return (
    <div ref={ref} style={{ width: '100%', height: '400px' }}>
      <svg width={rect.width} height={rect.height}>
        {/* 用真实像素尺寸绘制 */}
      </svg>
    </div>
  );
}
```

这就是完整的模式：元素上挂一个 ref，调用 `useMeasure(ref)`，每当元素的内容盒尺寸变化——窗口缩放、flex 重排、侧边栏开合、字体替换，任何原因——组件都会用新的 `rect` 重新渲染。你完全不用碰 `ResizeObserver`，也不需要清理逻辑；组件卸载时 observer 自动断开。

## 完整 API

```ts
const [rect, stop] = useMeasure(target, options?);
```

**`target`** 接受 `@reactuses/core` 所有元素类 Hook 通用的几种形式：

```tsx
useMeasure(ref);                          // React ref 对象
useMeasure(document.querySelector('#el')); // 原生 Element
useMeasure(() => document.body);           // 返回元素的函数
```

**`options`** 是标准的 [`ResizeObserverOptions`](https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver/observe#options) 对象——`{ box: 'content-box' | 'border-box' | 'device-pixel-content-box' }`——控制以哪个盒模型触发观察。

**`rect`** 是一个 `UseMeasureRect`：

```ts
type UseMeasureRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
};
```

在第一次观察触发之前（包括 SSR 期间），所有字段都是 `0`。

**`stop`** 用于断开 observer。当你已经拿到需要的测量值、不想再因尺寸变化触发重渲染时调用它——比如为动画捕获初始布局之后：

```tsx
const [rect, stop] = useMeasure(ref);

useEffect(() => {
  if (rect.width > 0) {
    startEnterAnimation(rect);
    stop(); // 测一次就够了
  }
}, [rect, stop]);
```

## contentRect 的坑：top/left 不是视口坐标

这是所有基于 ResizeObserver 的测量 Hook 最常见的困惑，先把它讲清楚。rect 来自 `entry.contentRect`，而 `contentRect` 是相对于**元素自身盒子**的，不是相对于视口：

- `width` / `height`——**内容盒**尺寸：不含 padding、border 和滚动条。
- `top` / `left`（以及 `x` / `y`）——内容盒相对于元素边框盒的偏移。实际上就是**你的 `padding-top` 和 `padding-left`**，不是元素在页面上的位置。

所以一个 `padding: 16px`、距页面顶部 300px 的元素，`useMeasure` 报告的是 `top: 16`，不是 `top: 300`。如果你真正想要的是*元素在屏幕上的位置*——定位 tooltip、下拉菜单、聚光灯遮罩——你需要的是 `getBoundingClientRect()` 语义,那是另一个 Hook：[`useElementBounding`](https://reactuse.com/element/useelementbounding/)，它返回视口相对坐标，还会在滚动时更新。

一句话记住：**`useMeasure` 回答"它有多大"；`useElementBounding` 回答"它在哪里"。**

## 内部实现

`useMeasure` 是库内 [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) 之上的一层薄封装：

```ts
import { useState } from 'react';
import { useResizeObserver } from '../useResizeObserver';

export const useMeasure = (target, options = defaultOptions) => {
  const [rect, setRect] = useState(defaultState); // 全 0

  const stop = useResizeObserver(
    target,
    entries => {
      if (entries[0]) {
        const { x, y, width, height, top, left, bottom, right }
          = entries[0].contentRect;
        setRect({ x, y, width, height, top, left, bottom, right });
      }
    },
    options,
  );

  return [rect, stop] as const;
};
```

有意思的机制在 `useResizeObserver` 里：

```ts
export const useResizeObserver = (target, callback, options) => {
  const savedCallback = useLatest(callback);
  const observerRef = useRef<ResizeObserver>();
  const { key: targetKey, ref: targetRef } = useStableTarget(target);

  const stop = useCallback(() => {
    observerRef.current?.disconnect();
  }, []);

  useDeepCompareEffect(() => {
    const element = getTargetElement(targetRef.current);
    if (!element) return;
    observerRef.current = new ResizeObserver(savedCallback.current);
    observerRef.current.observe(element, options);
    return stop;
  }, [targetKey, options]);

  return stop;
};
```

三个值得注意的细节：

1. **[`useLatest`](https://reactuse.com/state/uselatest/) 包裹回调**——你可以传内联箭头函数，而不会导致每次渲染都销毁重建 observer。observer 只构造一次；ref 始终指向最新的回调。

2. **[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 守护 options 对象**——`useMeasure(ref, { box: 'border-box' })` 每次渲染都会传入一个新的对象字面量。如果用普通的 `useEffect` 加 `[options]` 依赖，observer 每次渲染都会断开重连。深比较保证只有 options 的*值*真正变化时才重建 observer。

3. **observer 在 effect 内创建**——effect 不在服务端运行，所以 `new ResizeObserver(...)` 在 SSR 期间永远不会执行。这个 Hook 天生 SSR 安全：服务端用全 0 的 rect 渲染，客户端以相同内容水合，首次观察在挂载后触发。

第三点也解释了初始渲染的 `{ width: 0, height: 0 }`。在 0 会破坏计算的地方要加保护：

```tsx
const [rect] = useMeasure(ref);

return (
  <div ref={ref}>
    {rect.width > 0 && <Chart width={rect.width} height={rect.height} />}
  </div>
);
```

## useMeasure vs useElementSize vs useElementBounding vs useResizeObserver

`@reactuses/core` 在这个领域提供了四个 Hook。它们是分层关系，不是重复：

| | [`useMeasure`](https://reactuse.com/element/usemeasure/) | [`useElementSize`](https://reactuse.com/element/useelementsize/) | [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) |
|---|---|---|---|---|
| **返回值** | `[rect, stop]`——完整 8 字段 rect | `[width, height]` | `{ x, y, top, left, ... }` 视口相对 | `stop`（原始 entries 走回调） |
| **数据来源** | `contentRect` | `contentBoxSize` / `borderBoxSize` | `getBoundingClientRect()` | 原始 `ResizeObserverEntry[]` |
| **坐标系** | 元素相对（padding 偏移） | ——（只有尺寸） | **视口相对** | 你自己从 entries 里读 |
| **滚动时更新** | 否 | 否 | **是**（监听 window scroll + resize） | 否 |
| **box 选项** | 仅影响观察触发 | **测量值跟随 `box`** | —— | 仅影响观察触发 |
| **适用场景** | 尺寸 + 停止开关 | 只要宽高，重渲染最少 | tooltip、popover、遮罩——定位 | 自定义逻辑；多元素；不想触发状态更新 |

有两处区别值得单独说：

- **`useElementSize` 的测量值遵循 `box` 选项。** 传 `{ box: 'border-box' }` 时它报告 `borderBoxSize`——包含 padding 和 border——这通常才是"这个元素有多大"的直觉含义。`useMeasure` 无论用哪个盒触发观察，报告的始终是内容盒，因为 ResizeObserver entry 里唯一的 rect 就是 `contentRect`。
- **`useElementBounding` 是唯一在滚动时追踪位置的。** 它同时用 ResizeObserver 观察*并*监听 window 的 `scroll` / `resize`（passive），每次都重新计算 `getBoundingClientRect()`。开销更大，但对任何锚定屏幕位置的场景来说是正确选择。

如果你只需要视口尺寸，根本不用观察元素——直接用 [`useWindowSize`](https://reactuse.com/element/usewindowsize/)。

## 实战模式

### 容器查询风格的响应式组件

媒体查询响应的是视口；组件活在容器里。同一张卡片放在宽主栏和窄侧栏里，即使屏幕相同也应该有不同布局：

```tsx
function ProfileCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect] = useMeasure(ref);
  const compact = rect.width > 0 && rect.width < 320;

  return (
    <div ref={ref} className={compact ? 'card card--stacked' : 'card card--row'}>
      <Avatar />
      <Bio truncated={compact} />
    </div>
  );
}
```

组件适配的是它*被分配到*的空间，无论挂载在哪里。（CSS 容器查询解决了样式那一半；`useMeasure` 解决的是 JavaScript 需要拿到数字的那一半——图表比例尺、虚拟化计算、条件渲染。）

### 填满父容器的 Canvas / SVG

Canvas 和 SVG 需要显式像素尺寸。把它们绑定到测量出的父容器上，变化时重绘：

```tsx
function Sparkline({ data }: { data: number[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect] = useMeasure(wrapRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rect.width === 0) return;
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    drawSparkline(canvas, data);
  }, [rect, data]);

  return (
    <div ref={wrapRef} className="sparkline-wrap">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

任何布局变化——面板缩放、侧边栏折叠、横竖屏切换——都会以正确分辨率重绘 canvas。不需要 `window.resize` 监听器，而后者完全捕获不到面板缩放和侧边栏这类场景。

### 自动高度动画（先测量，再动画）

CSS 无法对 `height: auto` 做过渡。先测出内容高度，再向这个数字过渡：

```tsx
function Collapsible({ open, children }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [rect] = useMeasure(innerRef);

  return (
    <div
      style={{
        height: open ? rect.height : 0,
        overflow: 'hidden',
        transition: 'height 200ms ease',
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
```

因为测量是实时的，即使面板展开时内容发生变化——图片加载完成、嵌套区块展开——高度依然正确。一次性的 `getBoundingClientRect()` 快照在内容变动的那一刻就过期了。

### 文本截断检测

只在文本真正溢出时显示"展开更多"：

```tsx
function Excerpt({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [rect] = useMeasure(ref);
  const truncated =
    ref.current != null && ref.current.scrollHeight > Math.ceil(rect.height);

  return (
    <>
      <p ref={ref} className="clamp-3">{text}</p>
      {truncated && <button>展开更多</button>}
    </>
  );
}
```

`rect.height` 是可见（被 clamp 的）内容高度，`scrollHeight` 是完整内容高度；两者比较即可检测溢出——而且随着容器尺寸变化持续检测,截断状态翻转的时机恰恰就是容器变化时。

## 从 react-use-measure 迁移

如果你用过 [pmndrs 的 `react-use-measure`](https://github.com/pmndrs/react-use-measure)，心智模型可以直接迁移——但有几处差异：

```tsx
// react-use-measure —— Hook 替你创建 ref
const [ref, bounds] = useMeasure();
<div ref={ref} />

// @reactuses/core —— ref 归你所有（也可以传元素或函数）
const ref = useRef<HTMLDivElement>(null);
const [rect, stop] = useMeasure(ref);
<div ref={ref} />
```

- **ref 归属**：`react-use-measure` 返回回调 ref；`@reactuses/core` 接受*你的* ref、原生元素或 getter 函数。ref 归自己所有意味着可以和其他 Hook（[`useClickOutside`](https://reactuse.com/element/useclickoutside/)、[`useHover`](https://reactuse.com/state/usehover/)）共享同一个元素，无需 ref 合并工具。
- **坐标系**：`react-use-measure` 报告视口相对边界（有可选的 scroll 选项）；`@reactuses/core` 的 `useMeasure` 报告 `contentRect`。想要视口相对 + 滚动追踪，用 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)——那才是真正的等价物。
- **防抖**：`react-use-measure` 有 `debounce` 选项。这里用组合替代：需要限流下游计算时，把 rect 传给 [`useDebounce`](https://reactuse.com/state/usedebounce/)。
- **停止开关**：只有 `@reactuses/core` 提供 `stop`——拿到需要的数据后干净地结束观察。
- **一个库,100+ Hooks**：你引入的是完整的 [Hook 集合](https://reactuse.com)，而不是一个单一用途的依赖。

## 要点回顾

- **[`useMeasure`](https://reactuse.com/element/usemeasure/) 一行代码给你实时元素 rect**——底层是 ResizeObserver，零 observer 管理，自动清理。
- **它测量的是内容盒,坐标是元素相对的。** `top`/`left` 是 padding 偏移，不是页面位置。要视口坐标和滚动追踪用 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)；要 border-box 尺寸用 [`useElementSize`](https://reactuse.com/element/useelementsize/) 加 `{ box: 'border-box' }`。
- **首次渲染全是 0**——服务端和首次观察前都是。在 0 会破坏计算的地方加 `rect.width > 0` 保护。
- **内联回调和新建的 options 对象都安全**——内部的 `useLatest` 和 `useDeepCompareEffect` 防止 observer 反复重建。
- **`stop` 按需结束观察**——为动画测一次，然后不再为重渲染买单。
- **天然 SSR 安全**——observer 在 effect 里创建，而 effect 永远不在服务端运行。

从 [`@reactuses/core`](https://reactuse.com/element/usemeasure/) 获取它，别再手写 ResizeObserver 样板代码了。
