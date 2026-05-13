---
title: "React Observer Hooks：7 种监听 DOM 而不写样板代码的方式"
description: "ReactUse 中 useIntersectionObserver、useMutationObserver、useResizeObserver、useElementBounding、useElementSize、useElementVisibility 和 useMeasure 的实用指南——什么时候选哪个 observer、各自的开销、以及它们如何替代几十行命令式 DOM 胶水代码。"
slug: react-observer-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-13
tags: [react, hooks, dom, performance, tutorial]
keywords: [react observer hooks, useIntersectionObserver, useResizeObserver, useMutationObserver, useElementBounding, useElementSize, useElementVisibility, useMeasure, react dom observer, react lazy load, react sticky header, react virtual scroll]
image: /img/og.png
---

# React Observer Hooks：7 种监听 DOM 而不写样板代码的方式

DOM 不会主动告诉 React 它变了。React 只掌控数据流的一个方向——state 进来，markup 出去——回程的路上基本是瞎的。如果第三方脚本插入了一个 banner、字体加载完成把布局往下推了 8 像素、用户调整了窗口大小或把一张卡片滚动进视口，React 根本不知道，除非你主动告诉它。浏览器为此提供了 4 个 `*Observer` API，再加上一次性读取用的 `getBoundingClientRect` 家族，它们几乎覆盖了真实应用里所有"对 DOM 做出反应"的需求。

<!-- truncate -->

麻烦在于：把 observer 接进 React 组件是个小型沼泽——`useEffect`、`useRef`、清理函数、SSR 守卫，还有那个臭名昭著的"observer 在挂载前就触发"的竞态。五行 API 变成三十行胶水，而且胶水代码在组件之间几乎一模一样——于是被复制粘贴、每次都稍微改一点，悄悄地积累 bug。[ReactUse](https://reactuse.com) 提供了 7 个聚焦的 hooks，把胶水藏起来，把你真正想要的 API 表面还给你。

这篇文章会逐个介绍这 7 个 hook：各自观察什么、什么时候选哪个、如果你手写一遍会写成什么样。

## 1. useIntersectionObserver——"这个元素在屏幕里吗？"

`IntersectionObserver` 是现代懒加载的主力。它会在目标元素相对于视口（或滚动容器）越过某个阈值时报告，完全不需要老式 `scroll` 监听器那种连续触发的开销。懒加载图片、无限滚动触发器、用于埋点的"已浏览"追踪、进入视口时的淡入——都建在它之上。

### 手写版

```tsx
import { useEffect, useRef, useState } from "react";

function ManualOnScreen({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true);
      },
      { rootMargin: "0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{seen ? children : null}</div>;
}
```

能跑，于是你需要第二个懒加载块时就复制一份。到第五个组件你已经有五份微妙不同的 observer——三个用了错的 `threshold`，一个因为有人重构清理函数而漏了内存。形状是对的，重复是不对的。

### ReactUse 版

[`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) 接收 ref 和选项，返回元素当前是否相交：

```tsx
import { useRef } from "react";
import { useIntersectionObserver } from "@reactuses/core";

function OnScreen({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, {
    threshold: 0.1,
  });

  return <div ref={ref}>{isVisible ? children : null}</div>;
}
```

Hook 自己管理 observer 的生命周期：卸载时 disconnect、选项变化时重建、SSR 安全。懒加载图片、第一次进入视口时埋点、把一个重型图表延迟到滚动进来再挂载——都是同一个 hook，不同的布尔值。

一个常见模式是无限滚动的"加载更多"触发器：在列表底部放一个哨兵 `<div>`，它进入视口时发起 fetch。这其实正是 [`useInfiniteScroll`](https://reactuse.com/browser/useInfiniteScroll/) 的实现方式，它就建在这个原语之上。

## 2. useElementVisibility——通常你想要的那个布尔值

很多时候你根本不在乎 `IntersectionObserverEntry`——你只要一个布尔值，而且是相对于整个视口的，不是某个滚动容器。[`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) 就是干这个的。

```tsx
import { useRef } from "react";
import { useElementVisibility } from "@reactuses/core";

function FadeInOnView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useElementVisibility(ref);

  return (
    <div
      ref={ref}
      className={`fade ${visible ? "fade-in" : ""}`}
    >
      {children}
    </div>
  );
}
```

用它做滚动淡入、"已浏览"埋点、"视频滚出屏幕时暂停"。如果需要更细粒度的控制——自定义 root、小于 1 的阈值、多阈值——再降级到 `useIntersectionObserver`。

## 3. useResizeObserver——追踪尺寸的正确方式

差不多十年来，"在 React 里追踪元素尺寸"意味着挂一个 `window.resize` 监听器，每次事件都重新读 `clientWidth`。这漏掉了最常见的情况——元素因为父级变化、相邻元素折叠、或下方 flex 项变大而被动 resize。`ResizeObserver` 不管原因，只要被观察的元素尺寸变了就触发。

### 手写版

```tsx
import { useEffect, useRef, useState } from "react";

function ManualSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ width: cr.width, height: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {size.width.toFixed(0)} × {size.height.toFixed(0)}
    </div>
  );
}
```

隐藏成本：每次 entry 更新都会调 `setState`，从而触发渲染。快速拖动父元素，被观察的组件每秒能 rerender 60 次。大多数时候没问题，但如果这个 state 被一棵昂贵的子树消费，你就得节流更新，或者把它写进 ref 而不是 state。

### ReactUse 版

[`useResizeObserver`](https://reactuse.com/element/useResizeObserver/) 接收 ref 和一个对每个 entry 触发的回调：

```tsx
import { useRef, useState } from "react";
import { useResizeObserver } from "@reactuses/core";

function ResponsiveCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<"narrow" | "wide">("narrow");

  useResizeObserver(ref, ([entry]) => {
    setVariant(entry.contentRect.width > 600 ? "wide" : "narrow");
  });

  return <div ref={ref} data-variant={variant}>…</div>;
}
```

这就是 15 行代码实现的容器查询：卡片根据自己的宽度（不是视口宽度）在窄布局和宽布局之间切换。把两个并排放在一个 flex 行里，它们各自独立选自己的布局。

## 4. useElementSize 与 useMeasure——尺寸的两种口味

如果你只需要宽高，回调形式有点过度。ReactUse 提供了两个包装 `ResizeObserver` 并直接返回 state 的便利 hook。

[`useElementSize`](https://reactuse.com/element/useElementSize/) 返回被观察元素的 `{ width, height }`：

```tsx
import { useRef } from "react";
import { useElementSize } from "@reactuses/core";

function AutoFitGrid({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(ref);
  const columns = Math.max(1, Math.floor(width / 240));

  return (
    <div
      ref={ref}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
      }}
    >
      {items.map((it) => <Card key={it.id} item={it} />)}
    </div>
  );
}
```

容器每次 resize，grid 重新计算列数——不需要媒体查询、不需要猜视口、也不需要 JS 控制的 CSS 变量。

[`useMeasure`](https://reactuse.com/element/useMeasure/) 返回完整的 `ResizeObserverEntry.contentRect`（`width`、`height`、`top`、`left` 等），外加一个 ref 用来附着。当你一次调用就想拿到尺寸和局部坐标时用它：

```tsx
import { useMeasure } from "@reactuses/core";

function TooltipAnchor() {
  const [ref, rect] = useMeasure<HTMLButtonElement>();
  return (
    <>
      <button ref={ref}>Hover me</button>
      <Tooltip x={rect.left + rect.width / 2} y={rect.top} />
    </>
  );
}
```

`useElementSize` 和 `useMeasure` 的差别主要是人体工学——挑那个返回值形状已经匹配你组件需要的那个。

## 5. useElementBounding——位置加尺寸，同步更新

`useElementBounding` 是在每次 scroll 和 resize 时调用 `el.getBoundingClientRect()` 的响应式等价物。它返回 `top`、`right`、`bottom`、`left`、`width`、`height`、`x`、`y`——完整的矩形——只要元素由于任何原因移动或调整大小就重新触发。

```tsx
import { useRef } from "react";
import { useElementBounding } from "@reactuses/core";

function StickyShadow() {
  const ref = useRef<HTMLDivElement>(null);
  const { top } = useElementBounding(ref);
  const stuck = top <= 0;

  return (
    <header
      ref={ref}
      className={stuck ? "header header--stuck" : "header"}
    >
      …
    </header>
  );
}
```

一个 `position: sticky` 的页头滚到视口顶部时，它的 `top` 变成 0；hook 捕获到这个变化，给页头加阴影。同样的模式适用于：浮动操作按钮在离开初始位置后改变外观，或者需要在布局变化时持续追踪锚点的 popover。

`useElementBounding` 与 `useMeasure` 的区别：bounding 是相对视口的矩形（滚动会改变它），measure 是元素自身的内容矩形（滚动不会改变）。关心位置选 bounding，关心尺寸选 measure。

## 6. useMutationObserver——当 DOM 在你周围变化时

`MutationObserver` 是 4 个 observer API 里最重的一个，也是合法用例最窄的一个。它在目标元素的属性、子节点或文本内容变化时触发。在一个 React 优先的应用里你几乎从不需要它——React 拥有这些变更，所以 React 当然知道。你需要 `useMutationObserver` 是当**React 以外**的东西在改 DOM 时：

- 第三方组件（Stripe Elements、嵌入的视频播放器、聊天气泡）往一个槽位里塞内容。
- 用户在编辑一个 `contentEditable` 元素，你想在不轮询的情况下响应文本变化。
- 某个脚本在你控制不到的元素上切换 `aria-expanded` 或 `data-state`，你想把它镜像到 React state。

```tsx
import { useRef, useState } from "react";
import { useMutationObserver } from "@reactuses/core";

function ThirdPartyMount({ slot }: { slot: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useMutationObserver(
    ref,
    (mutations) => {
      const injected = mutations.some(
        (m) => m.type === "childList" && m.addedNodes.length > 0,
      );
      if (injected) setReady(true);
    },
    { childList: true, subtree: true },
  );

  return (
    <div ref={ref} data-third-party={slot}>
      {!ready && <Skeleton />}
    </div>
  );
}
```

Skeleton 一直渲染，直到第三方脚本把内容放进槽位，然后消失。没有 `MutationObserver` 时，你的选项是 `setInterval` 轮询，或者 `MutationObserver` 加手写生命周期——前者浪费，后者正是这个 hook 帮你省掉的。

一个常见陷阱：`MutationObserver` 很快但不是免费的，在繁忙元素上一个未限定范围的子树观察者每秒可能触发几十次。永远传你能给的最窄选项——如果你只关心 `childList`，就别开 `attributes: true`。

## 7. 怎么选

7 个 hook 有重叠，重叠是故意的——不同形状适合不同消费者。速查表：

| 你想要…… | Hook |
| --- | --- |
| 表示"在不在屏幕上"的布尔值 | [`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) |
| 自定义 root 或阈值的可见性 | [`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) |
| 以 state 形式拿到宽高 | [`useElementSize`](https://reactuse.com/element/useElementSize/) |
| 以 state 形式拿到完整内容矩形 | [`useMeasure`](https://reactuse.com/element/useMeasure/) |
| 相对视口的矩形（滚动会变） | [`useElementBounding`](https://reactuse.com/element/useElementBounding/) |
| 每次 resize entry 的回调 | [`useResizeObserver`](https://reactuse.com/element/useResizeObserver/) |
| 响应 React 以外的 DOM 变化 | [`useMutationObserver`](https://reactuse.com/element/useMutationObserver/) |

一个有用的心智模型：visibility 类 hook 告诉你元素**相对用户在哪**；size 和 bounding 类告诉你元素**有多大**、**在布局里的什么位置**；mutation 告诉你元素**里面发生了什么**。

## 实战示例：一个会自适应的懒加载卡片

把其中 4 个拼起来——一张卡片在滚动进入后才挂载昂贵的图表、根据自己的宽度选布局、并把 tooltip 定位在自己上方：

```tsx
import { useRef, useState } from "react";
import {
  useElementVisibility,
  useElementSize,
  useElementBounding,
} from "@reactuses/core";

function LazyChartCard({ data }: { data: ChartData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const visible = useElementVisibility(cardRef);
  const { width } = useElementSize(cardRef);
  const { top, left } = useElementBounding(cardRef);

  const [hovered, setHovered] = useState(false);
  const layout = width > 600 ? "horizontal" : "vertical";

  return (
    <>
      <div
        ref={cardRef}
        data-layout={layout}
        className="card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {visible ? <Chart data={data} /> : <Skeleton />}
      </div>
      {hovered && (
        <Tooltip
          x={left + width / 2}
          y={top - 8}
          text={`${data.label}: ${data.value}`}
        />
      )}
    </>
  );
}
```

图表只有在进入视口后才构造。卡片根据自己的宽度切换布局，而不是页面宽度。Tooltip 通过追踪卡片的 bounding 矩形漂浮在卡片上方，所以在滚动和布局抖动中都能保持锚定。三个 hook、二十行胶水代码、零个 `useEffect` 块、零个 `addEventListener`/`removeEventListener` 对。

## 性能须知

Observer 不是免费的，但开销集中且可控：

- **每个元素一个 observer 没问题；千行列表每行一个 observer 不行。** 列表虚拟化时，给滚动容器观察一次，在回调里解析哪一行可见。浏览器有时会合并多个 `IntersectionObserver` 目标，但一个长列表里每行一个 observer 依然伤性能。
- **`useResizeObserver` 回调跑在独立任务里。** 在回调里读布局（`getBoundingClientRect`、`offsetWidth`）很便宜；写布局也可以，但要注意写操作可能再次触发 resize entry。用防抖或者把写操作放进 `requestAnimationFrame` 来防止反馈循环。
- **`MutationObserver` 是 4 个里最贵的**，特别是配合 `subtree: true`。范围尽量收窄。如果你发现自己在观察一棵大子树，考虑一下让嵌入代码自己抛出一个"第三方就绪"事件是不是更便宜。

## 总结

Observer API 是连接"React 知道什么"和"DOM 实际在做什么"的桥梁。用裸 `useEffect` 接它们会积累很多胶水和一长串微妙 bug。用这 7 个 hook 接它们，它们就变成可以自由组合的一行调用。

- 用 [`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) 和 [`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) 回答"是否在屏幕上"。
- 用 [`useResizeObserver`](https://reactuse.com/element/useResizeObserver/)、[`useElementSize`](https://reactuse.com/element/useElementSize/) 和 [`useMeasure`](https://reactuse.com/element/useMeasure/) 回答"它有多大"。
- 用 [`useElementBounding`](https://reactuse.com/element/useElementBounding/) 回答"它在视口的什么位置"。
- 用 [`useMutationObserver`](https://reactuse.com/element/useMutationObserver/) 回答"DOM 在我背后做了什么"。

更多 hook 在 [reactuse.com](https://reactuse.com)——如果你用其中一个替换掉一段笨重的 `useEffect` 加 observer 舞蹈，那今天键盘没白敲。
