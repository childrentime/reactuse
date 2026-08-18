---
title: "React scrollIntoView + useRef：滚动到指定元素 (2026)"
description: "怎么在 React 里用 useRef 和 scrollIntoView 滚动到某个元素：正确的基础写法，block/inline/behavior 三个参数到底做什么，为什么固定头部的遮挡该用 scroll-margin-top 而不是硬减一个像素值，怎么滚动到刚刚渲染出来的元素（useEffect vs flushSync vs 回调 ref），以及原生这一行什么时候不够用——没法控制时长和缓动、没有可靠的完成回调、用户一滚也停不下来。然后是 @reactuses/core 的 useScrollIntoView。TypeScript 优先，SSR 安全。"
slug: react-scrollintoview-useref
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-18
tags: [react, hooks, dom, typescript, tutorial]
keywords: [react scrollintoview, scrollintoview react, react useref scrollintoview, react 滚动到元素, react 滚动到 ref, useScrollIntoView, react 点击滚动到指定位置, react 滚动到组件, react 平滑滚动, scrollintoview react 示例, react 滚动到 div, react 滚动到第一个错误, scroll-margin-top react, react 渲染后滚动到元素, react scrollintoview typescript, react 容器内滚动到元素, react 横向滚动到元素]
image: /img/og.png
---

# React scrollIntoView + useRef：滚动到指定元素 (2026)

一个很长的表单。用户点了提交，校验在往下三屏的某个字段挂了，错误提示渲染在了他根本看不见的地方。修起来只要调一个浏览器 API——但**放在哪里调**、**传什么参数**，能耗掉你一个下午。

先给结论，大部分人搜过来就是要这个：

```tsx
import { useRef } from "react";

function Article() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <button onClick={() => sectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
        跳到详情
      </button>
      {/* … 一大堆内容 … */}
      <div ref={sectionRef}>详情</div>
    </>
  );
}
```

整个模式就这些：给元素挂个 ref，在事件处理里调 `.scrollIntoView()`，加 `?.` 是因为 React 提交之前 `sectionRef.current` 一直是 `null`。浏览器原生支持，零成本，对这种静态锚点来说这就是正确答案——别上库。

这篇讲的是剩下的部分：那几个参数到底做什么、固定头部遮挡问题（以及为什么 CSS 的解法比 JavaScript 的好）、怎么滚动到**刚刚**渲染出来的东西，还有原生调用真正做不到的四件事——到那一步，[`@reactuses/core`](https://reactuse.com) 的 [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) 才配上场。

<!-- truncate -->

## 你手上真正有的参数

`Element.scrollIntoView()` 接一个可选的配置对象，就三个键：

| 参数 | 取值 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `block` | `start` · `center` · `end` · `nearest` | `start` | **块轴**方向的对齐——常规书写模式下就是垂直方向 |
| `inline` | `start` · `center` · `end` · `nearest` | `nearest` | **行内轴**方向的对齐——水平方向 |
| `behavior` | `auto` · `instant` · `smooth` | `auto` | `auto` 跟随滚动容器的 CSS `scroll-behavior` |

所以值得背下来的就三种调用：

```tsx
el.scrollIntoView();                                        // 顶到顶部
el.scrollIntoView({ behavior: "smooth", block: "center" }); // 平滑滑到中间
el.scrollIntoView({ block: "nearest" });                    // 只在看不见时才移动
```

`block: "nearest"` 是被低估的那个。它只滚动**最小必要距离**把元素带进视口，元素已经可见时干脆什么都不做——这正是列表框键盘导航要的效果：每按一次方向键就重新居中，会让列表感觉在跟你较劲。

还有个遗留的布尔写法：`scrollIntoView(true)` 等于 `block: "start"`，`scrollIntoView(false)` 等于 `block: "end"`。到处都还能用，但对象写法能自解释。

有个点常让人意外：`scrollIntoView` 会滚动**所有可滚动的祖先**，不只是最近的那个。如果你的元素在一个可滚动面板里、面板又在可滚动页面里，两个都会动，最终让元素露出来。这基本上就是你想要的。

## 固定头部：用 CSS，别用魔法数字

最高频的追问：滚到某个标题，结果 64px 的固定头部正好压在上面。

第一反应是自己算：

```tsx
// 别这么写
const top = el.getBoundingClientRect().top + window.scrollY - 64;
window.scrollTo({ top, behavior: "smooth" });
```

现在这个 `64` 归你养了。移动端头部更矮时它是错的，头部上方冒出一条促销 banner 时它是错的，元素在滚动容器而不是页面里时它是错的——顺带你还放弃了 `scrollIntoView` 处理祖先容器的能力。

平台就有一个专门干这事的属性：

```css
.section {
  scroll-margin-top: 5rem; /* 或者 var(--header-height) */
}
```

`scroll-margin-top` 告诉浏览器：**仅在滚动定位时**把这个元素当作多了这么多外边距。然后一句朴素的 `el.scrollIntoView({ behavior: "smooth" })` 就会提前 5rem 停住，布局完全不受影响，而且这个值就写在它依赖的头部高度旁边。它还顺手修好了 `:target` 锚点和浏览器的页内查找定位——这两个 JavaScript 版本永远做不到。

优先用 `scroll-margin-top`。每次都是。

## 滚动到刚渲染出来的元素

问题的另一半是时机。你往列表里加一项，想滚过去；展开一个折叠面板，想露出来；设置了一个错误，想跳过去。天真的写法不管用：

```tsx
// 有 bug：新行还不在 DOM 里
function addRow() {
  setRows(r => [...r, newRow]);
  lastRowRef.current?.scrollIntoView(); // 还是**旧的**最后一行，或者是 null
}
```

`setRows` 只是排了一次渲染。React 会在之后提交——而在 React 18+ 的并发渲染下，这个"之后"确确实实不在这一个 tick 里。那行代码执行的瞬间，DOM 还是旧的 DOM。

**默认解法是用 effect。** 在加进那一行的提交之后再滚：

```tsx
useEffect(() => {
  lastRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}, [rows.length]);
```

如果你要的是**瞬间**滚动、并且希望它在浏览器绘制之前落位，就换成 `useLayoutEffect`——否则用户会看到一帧停在旧位置，观感上就是闪一下。平滑滚动则无所谓，动画反正都要开始。

**"刚创建出来的元素"用回调 ref 更干净。** 不用 effect、不用依赖数组、也不用维护一个 ref——React 挂上节点的那一刻回调就触发：

```tsx
const scrollOnMount = useCallback((node: HTMLElement | null) => {
  node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}, []);

// …
{rows.map((row, i) => (
  <Row key={row.id} ref={i === rows.length - 1 ? scrollOnMount : undefined} />
))}
```

**`flushSync` 是逃生舱，不是默认选项。** 如果你确实必须在改状态的同一个事件处理里滚动，可以强制同步提交：

```tsx
import { flushSync } from "react-dom";

flushSync(() => setExpanded(true));
detailsRef.current?.scrollIntoView({ behavior: "smooth" });
```

能用，代价是放弃 React 替你做的批处理和并发调度。在处理函数里偶尔用一次没问题；一个文件里出现三次就是味道不对了。

## 原生调用的天花板

对锚点、"滚到错误处"、列表键盘导航来说，上面这些已经够了，你可以不用往下读。原生真正做不到的有四件事：

**1. 控制不了时长和曲线。** `behavior: "smooth"` 具体多快由浏览器说了算——Chrome 和 Firefox 不一样，而且完全没有旋钮。如果这个滚动是一段编排好的转场的一部分、必须和 400ms 的淡入对齐，那你办不到。

**2. 没有可靠的"滚完了"回调。** `scrollend` 事件就是为这个设计的，Chrome/Edge 114、Firefox 109 落地，Safari 更晚一些——依赖它之前先查一下支持度，而且它并不告诉你结束的是**哪一次**程序化滚动。大家退而求其次的那些做法（`setTimeout` 猜一个、轮询 `scrollY` 直到不变），脆得跟听起来一样。

**3. 取消不了。** 开一段长距离平滑滚动，用户中途抓住滚轮，浏览器照样把他拖到目的地。长页面上这是最招人烦的滚动 bug，没有之一，而且没有 API 能停下它。

**4. 它不管 `prefers-reduced-motion`。** 对于要求减少动效的用户，浏览器并不会统一把 `behavior: "smooth"` 降级——这得你自己来：

```tsx
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
```

写一次很容易，在另外十一处滚动的地方忘掉也很容易。

## useScrollIntoView

[`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) 自己在 `requestAnimationFrame` 上跑动画，这四件事就都换回来了：

```bash
npm install @reactuses/core
```

```tsx
import { useRef } from "react";
import { useScrollIntoView } from "@reactuses/core";

function Article() {
  const targetRef = useRef<HTMLParagraphElement>(null);
  const { scrollIntoView, cancel } = useScrollIntoView(targetRef, {
    duration: 600,
    offset: 80,
    onScrollFinish: () => targetRef.current?.focus(),
  });

  return (
    <>
      <button onClick={() => scrollIntoView({ alignment: "center" })}>跳到详情</button>
      <div style={{ height: "150vh" }} />
      <p ref={targetRef} tabIndex={-1}>详情</p>
    </>
  );
}
```

`useScrollIntoView(target, options?, scrollContainer?)` 返回 `{ scrollIntoView, cancel }`。它是 SSR 安全的——你不调用，它就不碰 DOM——而且 target 可以是 ref、元素，或者一个 getter 函数，你手上有什么都能用。

配置项全是可选的：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `duration` | `1250` | 毫秒。`0` 表示瞬间跳过去。 |
| `easing` | `easeInOutQuad` | 任意 `0…1` 上的 `(t: number) => number`。 |
| `axis` | `"y"` | 横向滚动容器用 `"x"`。一个 hook 一个轴。 |
| `offset` | `0` | 离边缘的额外距离——就是固定头部的余量。 |
| `cancelable` | `true` | 滚轮或触摸会中止动画。 |
| `isList` | `false` | 目标已在视野内就不滚。 |
| `onScrollFinish` | — | 动画停下时触发。 |

对齐方式放在调用上而不是配置里，因为它通常每次都不同：`scrollIntoView({ alignment: "start" | "center" | "end" })`。

### cancelable 是你真能感觉到的那个

`cancelable: true`（默认）时，hook 会监听 `wheel` 和 `touchmove`，一有动静就把动画停在当下。用户飞到一半伸手去够滚动条，页面就……让他滚。对比一下 `behavior: "smooth"`，它能跟用户较劲整整一秒。

你也可以自己停——比如触发滚动的那个弹窗被关掉了：

```tsx
const { scrollIntoView, cancel } = useScrollIntoView(targetRef);
useEffect(() => cancel, [cancel]); // 卸载时也会自动取消
```

### 减少动效已经处理好了

hook 内部通过 [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) 读 `prefers-reduced-motion`。当用户要求减少动效时，缓动直接坍缩到终值，滚动变成瞬间跳转——同样的目的地、同样会触发 `onScrollFinish`，只是没有动画。这个分支不用你写。

### 在容器里滚，以及横着滚

想动某个具体元素的滚动位置而不是整页时，把滚动容器作为第三个参数传进去：

```tsx
const listRef = useRef<HTMLDivElement>(null);
const itemRef = useRef<HTMLLIElement>(null);

const { scrollIntoView } = useScrollIntoView(itemRef, { isList: true }, listRef);
```

不传第三个参数时，hook 会从目标往上找，挑第一个计算样式里 `overflow-x`/`overflow-y` 为 `auto` 或 `scroll` 的祖先，找不到就回退到整页。这个自动探测大多数时候方便且正确；你确定容器是谁的时候就显式传。

轮播就换个轴：

```tsx
const { scrollIntoView } = useScrollIntoView(slideRef, { axis: "x", duration: 400 }, trackRef);
scrollIntoView({ alignment: "center" });
```

### 滚动到第一个校验失败的字段

开头那个场景，每块拼图都放对位置：

```tsx
function CheckoutForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstErrorRef = useRef<HTMLDivElement>(null);

  const { scrollIntoView } = useScrollIntoView(firstErrorRef, {
    offset: 96,          // 让开固定头部
    duration: 500,
    onScrollFinish: () => firstErrorRef.current?.querySelector("input")?.focus(),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0) scrollIntoView({ alignment: "start" });
  }

  const firstErrorField = Object.keys(errors)[0];

  return (
    <form onSubmit={onSubmit}>
      {FIELDS.map(f => (
        <Field key={f.name} ref={f.name === firstErrorField ? firstErrorRef : undefined} {...f} />
      ))}
    </form>
  );
}
```

因为 hook 是在你**调用** `scrollIntoView` 的那一刻才去解析目标、而不是在渲染时解析，所以哪怕 `firstErrorRef` 是被 `setErrors` 触发的那次渲染才挂上的，在同一个处理函数里调用它照样有效。不需要 `flushSync`，也不需要 effect。把焦点转移放在 `onScrollFinish` 里而不是立刻执行，能让读屏用户和视力正常的用户同时抵达。

## 值得知道的坑

- **`offset` 对 `alignment: "center"` 不生效。** 它是从**最近的边缘**量起的余量，所以只影响 `"start"` 和 `"end"`。想把某个东西居中又要避开固定头部，要么用 `"start"` 配 offset，要么接受居中。这一条如果你想当然，它会悄无声息地什么都不做。
- **别和 `scroll-behavior: smooth` 一起用。** hook 是靠每帧赋值 `scrollTop`/`scrollLeft` 来做动画的。如果 CSS 也声明这个容器要平滑滚动，浏览器会试图给这 ~60 次赋值每一次都做动画，结果是一坨卡顿。每个容器二选一：要么 CSS 平滑滚动，要么这个 hook。
- **一个 hook 只管一个轴。** `axis` 是 `"x"` 或 `"y"`，不能都要。需要斜向移动的网格就用两个 hook，或者用原生调用。
- **自动探测到的滚动父容器会按元素缓存。** 某个节点的第一次查找结果会被记住。如果你的布局在运行时切换祖先的 `overflow`——比如面板展开后才变得可滚动——那就把容器作为第三个参数传进去，别靠探测。
- **`cancelable` 管滚轮和触摸，不管键盘。** Page Down 和拖滚动条不会中止动画。它覆盖的是常见情况，不是全部情况；真在意的话自己在 keydown 里调 `cancel()`。
- **`isList` 是有方向的。** `isList: true` 时，hook 只在目标位于容器**由 `alignment` 决定的那一侧**之外时才移动——已经可见的目标压根不会产生滚动。这正是它的用意（防止键盘导航的列表每敲一次键就抖一下），但也意味着 `isList: true` 配错 alignment 会让人觉得 hook 在无视你。
- **`duration: 0` 是瞬间跳转，不是什么都不做。** 想遵循你自己那个"关闭动画"设置时很好用，不用去分支判断该调哪个函数。

## 什么时候别用这个 hook

原生 `scrollIntoView` 是正解的场合，比你以为的多：

- **静态锚点或目录链接** → `el.scrollIntoView({ behavior: "smooth" })` 加 `scroll-margin-top`。没有依赖，没有动画循环。
- **列表框的键盘导航** → `block: "nearest"` 原生就是最小移动的行为，而且那个场景本来就该是瞬间的手感。
- **需要同时对齐两个轴** → 原生调用同时接 `block` 和 `inline`。
- **你要滚到某个位置而不是某个元素** → `window.scrollTo` / `el.scrollTo`，或者用 [`useScroll`](https://reactuse.com/browser/usescroll/) 读取和响应滚动位置。
- **你想知道什么在视野里，而不是移动过去** → [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/)，目录里高亮当前章节也是靠它。
- **你想彻底禁止页面滚动**（弹窗打开时）→ [`useScrollLock`](https://reactuse.com/browser/usescrolllock/)。

## 要点

- 基础写法就三行：给元素上 `useRef`，处理函数里 `ref.current?.scrollIntoView({ behavior: "smooth" })`，加 `?.` 是因为提交之前 ref 是 `null`。记住 `block: "nearest"`——你用得最多的就是它。
- 固定头部遮挡用 CSS 的 `scroll-margin-top` 解决，别拿 `getBoundingClientRect()` 减一个写死的像素值。前者扛得住响应式头部，还顺手修好 `:target` 锚点。
- 要滚动到刚渲染出来的东西，就在按变化取依赖的 effect 里滚，或者用回调 ref。`flushSync` 能用，但要放弃批处理——留着当逃生舱。
- 原生平滑滚动没有时长控制、没有靠谱的完成事件、不能取消、不处理 `prefers-reduced-motion`。这四条你都不在乎，就别加依赖。
- [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) 补的恰好就是这几个缺口——可配的 `duration`/`easing`、`onScrollFinish`、滚轮和触摸即时取消、自动的减少动效回退，外加 `offset`、横向 `axis`、显式滚动容器，以及让列表导航不抖的 `isList`。它在调用时才解析目标，所以能和渲染出它的那次 `setState` 待在同一个处理函数里。

`useScrollIntoView`、`useScroll`、`useScrollLock`，以及另外 110+ 个 SSR 安全、TypeScript 优先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 里——装一次，可 tree-shake，没有需要你伺候的依赖。

```bash
npm install @reactuses/core
```
