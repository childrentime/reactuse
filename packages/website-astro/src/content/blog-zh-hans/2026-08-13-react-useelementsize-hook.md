---
title: "React useElementSize Hook：用 ResizeObserver 实时追踪元素宽高 (2026)"
description: "在 React 里测量 DOM 元素的实用指南：useElementSize 把 ResizeObserver 变成普通 state——实时的 width 和 height，不用手动管理观察器，也没有清理时机的坑。涵盖 box 选项（content-box、border-box、以及让 canvas 在任何 DPR 下都清晰的 device-pixel-content-box）、容器查询式组件、响应式图表，以及什么时候该换 useMeasure、useElementBounding 或 CSS 容器查询。TypeScript 优先，SSR 安全。"
slug: react-useelementsize-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-13
tags: [react, hooks, element, typescript, tutorial]
keywords: [useelementsize, react useelementsize, useElementSize hook, react 元素尺寸, react 测量元素, resizeobserver react hook, react resize observer, react 元素宽高, react 容器查询 hook, 响应式组件 react, react 测量 div, react 图表自适应, device-pixel-content-box, react canvas 高清]
image: /img/og.png
---

# React useElementSize Hook：用 ResizeObserver 实时追踪元素宽高 (2026)

媒体查询只回答一个问题：*视口有多大？* 但你的组件不住在视口里——它们住在栏、卡片、面板和网格轨道里。同一个 `<ProductCard>`，在通栏主列里是 900px 宽，在打开的侧边栏旁边就只剩 320px——*同一块屏幕*。而且元素尺寸变化的原因有一打，全都不触发窗口 `resize` 事件：侧边栏收起、手风琴展开、字体加载完成、flex 兄弟节点出现、内容流式进来。

要追踪这些，就得用 `ResizeObserver`——浏览器专门为此内置的 API——再裹上 React 那套 ref、effect、清理的例行公事。[`@reactuses/core`](https://reactuse.com) 的 [`useElementSize`](https://reactuse.com/element/useelementsize/) 把这一切压缩成组件直接渲染的两个数字：`[width, height]`，实时，任意元素。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useRef } from "react";
import { useElementSize } from "@reactuses/core";

function ChartCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, height] = useElementSize(ref);

  return (
    <div ref={ref} className="chart-card">
      <Chart width={width} height={height} />
    </div>
  );
}
```

集成到此为止。hook 在挂载时挂上 `ResizeObserver`，而 `ResizeObserver` 在 `observe()` 时会立刻上报一次初始尺寸，所以 `width` 和 `height` 在首次绘制后马上就有值，不需要单独写一遍"挂载时测量"。之后的每次尺寸变化——窗口缩放、侧边栏开合、内容回流——都会更新 state。卸载时观察器自动清理。不用存观察器的 ref，不会忘写 `disconnect()`。

## 为什么不用 window.innerWidth 或媒体查询？

因为大多数元素尺寸变化和窗口毫无关系：

- 可折叠侧边栏展开，主列瞬间少了 280px——视口没动。
- 用户拖动分栏面板的分隔条。
- 你元素上方的 `<img>` 加载完成，把整列内容挤下去、重新回流。
- 筛选器清空了一行 flex 项目，剩下的被拉伸。
- 一个 CSS transition 用 300ms 动画改变面板宽度。

窗口级别的工具对这些全都失明。[`useWindowSize`](https://reactuse.com/element/usewindowsize/) 和 [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) 适合*页面级*布局决策——但一个按视口宽度决定布局的组件，只要有人把它放进宽屏上的窄列里，立刻穿帮。

这里必须提一句 CSS 容器查询：如果你对尺寸的响应是*纯样式*，`@container` 零 JavaScript、零重渲染就能搞定——那就用它。hook 的价值在于你需要把数字拿到 **JS 里**的那一刻：图表尺寸、canvas 后备缓冲区、虚拟化计算，或者干脆渲染一棵不同的组件树。

## 手写的方式——以及坑在哪

手写看起来足够短：

```tsx
// ⚠️ 手写版——demo 里能跑，应用里漏 bug
function ChartCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return <div ref={ref}>…</div>;
}
```

十行代码藏着三个问题：

1. **晚挂载的目标永远不会被观察。** 那句 `if (!ref.current) return` 守卫只在挂载时跑一次。如果元素是条件渲染的——藏在加载态、tab、弹窗后面——effect 早就 return 了，什么都挂不上。你需要 effect 在*元素*出现时重跑，而空依赖数组表达不了这件事。
2. **options 的引用身份陷阱。** 想要 `{ box: "border-box" }`？这个对象字面量每次渲染都是新的。放进 effect 依赖数组，观察器每次渲染都拆了重建；不放，lint 规则报警，或者日后一次改动悄悄让它过期。
3. **你读错了 box。** `contentRect` 是为兼容性保留的遗留字段。现代字段——`borderBoxSize`、`contentBoxSize`、`devicePixelContentBoxSize`——都是*数组*（元素在多栏布局里会分片），挑对再求和的代码比观察器本身还多。

`useElementSize` 把三个坑全吸收掉：条件渲染的元素传懒惰 getter（`() => document.querySelector(".panel")`），hook 每次渲染重新解析，元素一出现就挂上观察；options 内部做深比较（内联字面量随便写）；box 的选择——包括分片求和——完全按规范处理。

## useElementSize API

```tsx
const [width, height] = useElementSize(target, options?);
```

**`target`** 很灵活——手上有什么传什么：

```tsx
useElementSize(ref);                                    // ref 对象
useElementSize(document.getElementById("hero"));        // 元素本身
useElementSize(() => document.querySelector(".panel")); // 懒惰 getter
```

**`options`** 就是标准的 `ResizeObserverOptions`——一个字段 `box`，三个取值。而且 hook 内部对 options 做深比较，`useElementSize(ref, { box: "border-box" })` 直接写内联字面量*不会*让观察器每次渲染都翻新。

### 该测量哪个 box？

- **`content-box`**（默认）——只算内容区：不含 padding 和 border。回答的是"我的*内容*有多少空间"，适合给子元素排版、图表、分栏计算。
- **`border-box`**——包含 padding 和 border；对应 `offsetWidth`/`offsetHeight`，也就是元素在布局中实际占的地方。需要和兄弟节点或浮层对齐时用它。
- **`device-pixel-content-box`**——以**物理设备像素**计的内容盒。这个很特殊。

### canvas 高清渲染的诀窍

`<canvas>` 的后备缓冲区和物理像素尺寸对不上，在 2 倍屏上就是糊的。民间偏方——CSS 像素乘 `devicePixelRatio`——在浏览器缩放和小数 DPR 下会取整出错。`device-pixel-content-box` 直接把合成器用的那个整数交给你：

```tsx
function SharpCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [width, height] = useElementSize(ref, {
    box: "device-pixel-content-box",
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !width) return;
    canvas.width = width;   // 物理像素——任何 DPR、任何缩放都逐像素精确
    canvas.height = height;
    draw(canvas.getContext("2d")!);
  }, [width, height]);

  return <canvas ref={ref} style={{ width: "100%", height: 300 }} />;
}
```

（Safari 还不支持 `device-pixel-content-box`——那里 hook 会回退到 `contentRect`，所以要优雅降级，别假设到处都拿得到物理像素。）

## 实战模式

### 容器查询式组件——断点跟着元素走，不跟屏幕

```tsx
function ProductCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [width] = useElementSize(ref);

  const layout =
    width >= 640 ? "horizontal" : width >= 320 ? "compact" : "stacked";

  return (
    <article ref={ref} data-layout={layout}>
      {layout === "horizontal" ? <SideBySide /> : <Stacked />}
    </article>
  );
}
```

把这张卡片扔进侧边栏、弹窗或通栏列表，它都根据*自己的*空间自适应——不用从某个恰好知道上下文的祖先一路把 `variant` prop 钻下来。再强调一次：如果差异只是 CSS，`@container` 更便宜。这个模式是给*组件树*需要变化的场景。

### 静止后才重排的响应式图表

图表库要的是像素数字，而用户拖分隔条的时候每秒重算 60 次图表布局纯属浪费。让 CSS 负责视觉上的拉伸，真正的重排交给 [`useDebounce`](https://reactuse.com/state/usedebounce/) 收尾：

```tsx
const ref = useRef<HTMLDivElement>(null);
const [rawWidth, rawHeight] = useElementSize(ref);
const width = useDebounce(rawWidth, 150);
const height = useDebounce(rawHeight, 150);

// <ExpensiveChart width={width} height={height} />
// 在拖动停止后重排一次，而不是拖动的每一帧都排。
```

### 能放下几列？

CSS 算不了的网格数学——因为答案要喂给 `props`，不是样式：

```tsx
const [width] = useElementSize(ref);
const columns = Math.max(1, Math.floor(width / 280));

return <VirtualGrid columns={columns} items={items} />;
```

## useElementSize 和它的兄弟们

`@reactuses/core` 有一小家族建立在同一个观察器内核上的测量 hook——按你要拿回什么来选：

| Hook | 返回 | 什么时候用 |
| --- | --- | --- |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | `[width, height]` | 只要尺寸，别的都不要 |
| [`useMeasure`](https://reactuse.com/element/usemeasure/) | 完整 `contentRect`（`x/y/top/left/…`）+ `stop()` | 要整个矩形，或要随时停止观察 |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | 实时 `getBoundingClientRect`——滚动*和*缩放都更新 | 要知道它在视口里的*位置*，不只是大小 |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | 原始 entries 交给你的回调 | 要副作用而不是 state；每次 resize 做命令式操作 |
| [`useWindowSize`](https://reactuse.com/element/usewindowsize/) | 视口 `width/height` | 页面级布局，不是元素级 |

经验法则：尺寸用 `useElementSize`，位置（tooltip、popover、滚动联动效果）用 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)，想跑代码而不是存 state 用 [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/)。

## 生产环境备忘

- **SSR 已处理。** 服务器上没有 DOM，hook 渲染 `[0, 0]`，水合后才挂观察器——你的代码里不需要 `typeof window` 守卫。要为零值帧做打算：用 `if (!width) return <Skeleton />` 把昂贵的子组件拦住，别让图表在 0×0 下排版。
- **第一个真实值来自观察器的初始上报**——挂载后紧跟一次额外渲染。这是正确性的代价，别跟它较劲。
- **小心自引用循环。** 如果你*根据*测到的宽度渲染的内容反过来改变了元素自己的宽度，你就造了个 resize 反馈环（控制台里的 `ResizeObserver loop completed with undelivered notifications`）。解法：测量一个尺寸不受你影响的父元素，或者把派生值做钳制。
- **分片布局会正确求和。** 在多栏或分页上下文里元素的盒子会分片；hook 按规范把各片的 `inlineSize`/`blockSize` 求和，而不是只读第一片。
- **每次 hook 调用就是一个观察器。** 给 500 个虚拟化行各测一次就是 500 个观察器——到这个量级，降级为容器上的单个 [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/)，或者只观察一个原型行。

## 要点回顾

- 元素尺寸 ≠ 窗口尺寸。侧边栏、分栏面板、流式内容、字体加载都会在不碰视口的情况下改变元素大小——只有 `ResizeObserver` 看得见，而 [`useElementSize`](https://reactuse.com/element/useelementsize/) 把它端上来变成普通的 `[width, height]` state。
- `box` 选项决定测什么：`content-box` 做内容计算（默认），`border-box` 看布局占位，`device-pixel-content-box` 让 canvas 在任何 DPR、任何缩放下逐像素清晰。
- target 可以是 ref、元素或懒惰 getter——条件渲染的元素用 getter；内联 options 因为深比较不会翻新观察器——手写版必踩的坑，提前都填了。
- 对尺寸的响应是纯 CSS？用 `@container` 查询。hook 是给数字要驱动 JavaScript 的场景：图表、canvas、虚拟化、切换组件树。
- 还要位置？那是 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)。要完整矩形加手动停止？[`useMeasure`](https://reactuse.com/element/usemeasure/)。要原始 entries？[`useResizeObserver`](https://reactuse.com/element/useresizeobserver/)。

`useElementSize` 和其它 110+ 个 SSR 安全、TypeScript 优先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 里——装一次，可摇树，没有需要伺候的依赖。

```bash
npm install @reactuses/core
```
