---
title: "React useIntersectionObserver Hook：懒加载与可见性检测（2026）"
description: "一篇实用的 useIntersectionObserver 上手指南：检测元素何时进入视口、懒加载图片、做「每次浏览只上报一次」的埋点、搭建无限滚动触发器——而不用 scroll 监听器的疯狂抖动，也不会带上手写版本必然出现的卸载泄漏 bug。SSR 安全、TypeScript 优先。"
slug: react-useintersectionobserver-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-30
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useIntersectionObserver, useIntersectionObserver hook, react 交叉观察器, react 检测元素可见, react 图片懒加载, react 元素进入视口, react 元素是否在屏幕上, intersection observer react, react 滚动检测, useIntersectionObserver typescript, ssr 安全 intersection observer, react 无限滚动触发, react 滚动淡入]
image: /img/og.png
---

# React useIntersectionObserver Hook：懒加载与可见性检测（2026）

你想等一张图片快滚进视口时再加载它。或者在一张卡片**真正被看到**的第一时间上报一个埋点。又或者当用户滚到列表底部时触发「加载更多」。这些其实是同一个问题——*这个元素进入屏幕了吗？*——而多年来的答案，是一个一秒钟触发上百次的 `scroll` 监听器，每次都重新读一遍 `getBoundingClientRect()`，却还是会漏掉各种边界情况。

`IntersectionObserver` 就是正确回答这个问题的浏览器 API：异步、批量、跑在主线程之外。`useIntersectionObserver` 则是把它接进 React 的 hook——不用 `useEffect`/`useRef`/清理那一堆样板，也不会带上手写版本必然出现的卸载泄漏和过期闭包 bug。本文讲清楚真实的 [`@reactuses/core`](https://reactuse.com) API、你真正会用到的三种模式，以及怎么调 `threshold`、`rootMargin` 和 `root`。SSR 安全、带类型。

<!-- truncate -->

## 为什么不直接用 scroll 监听器？

以前判断一个元素是否可见的写法是这样的：监听 `scroll`，每次事件里把元素和视口量一遍。

```tsx
useEffect(() => {
  function onScroll() {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setVisible(true);
    }
  }
  window.addEventListener('scroll', onScroll);
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

这里天生带着两个问题。第一，`scroll` 跑在主线程上，一秒钟触发几十次，而 `getBoundingClientRect()` 每次都会强制一次同步布局——这恰好是滚动卡顿的标准配方。第二，它只能抓到穿过*视口*的元素；一旦你的滚动发生在某个容器里，你就得手动重新推导几何关系。

`IntersectionObserver` 把这个模型反了过来。你把一个目标和一个阈值交给浏览器，由*它*来异步、批量、在滚动路径之外告诉你——元素什么时候越过了那个阈值。不用测量，不用监听器抖动。剩下唯一会写错的，就是它周围的 React 生命周期，而那部分正是这个 hook 替你管的。

下面是组件内最直觉的写法，它带着每个手写 observer 都有的那三个 bug：

```tsx
function LazySection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSeen(true); // 🐛 见下文
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{seen ? children : null}</div>;
}
```

1. **忘了清理就会泄漏。** 把 `return () => io.disconnect()` 删掉——人们真的会删，尤其是重构的时候——observer 就会比组件活得还久。
2. **它会捕获过期闭包。** 一旦回调引用了某个 prop 或第二份 state，挂载时创建的 observer 就把它们冻结在了挂载那一刻的值上，而不是触发时的值。
3. **它会扩散。** 每个懒加载区块、每个「已浏览」追踪、每个无限滚动哨兵都在重写同一套 `useRef` + `observe` + `disconnect` 的舞步，而每一份拷贝都是一次重新引入前两个 bug 的机会。

一个 hook 在一个地方把这三个都修了。

## API

[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) 接收三个参数，返回一个 `stop` 函数：

```ts
const stop = useIntersectionObserver(target, callback, options?);
```

- **`target`** —— 要观察什么。一个 React ref、一个原始元素，或者一个 getter `() => element`。（它也接受 `null`/`undefined`，所以观察一个条件渲染的元素是安全的——hook 会直接等着。）
- **`callback`** —— 标准的 `IntersectionObserverCallback`，即 `(entries, observer) => void`。你拿到原始的 `IntersectionObserverEntry[]`，所以由*你*来决定可见对你的场景意味着什么。
- **`options`** —— 原生的 `IntersectionObserverInit`：`{ root, rootMargin, threshold }`。全部可选。
- **返回 `stop()`** —— 调用它可以提前断开 observer（下面细讲）。hook 也会在卸载时帮你自动调用它。

这里刻意的设计选择是：hook 是**基于回调的，而不是基于布尔值的**。它不替你判定「相交」就等于可见——因为根据任务不同，它可能意味着「露出 10%」「完全露出」或者「距离视口 200px 以内」。你读 `entry.isIntersecting`（或 `entry.intersectionRatio`）然后做事。如果你只想要一个朴素的布尔值，有一个顺手的姊妹 hook 做这件事——[见下文](#只想要一个布尔值)。

在内部，回调被存在一个 ref 里（通过 `useLatest`），所以它永远不会过期——即使你的回调闭包引用了 props，bug #2 也消失了。而且因为 observer 只会在 effect 内部被构造，这个 hook 是 SSR 安全的：渲染期间没有任何东西碰 `IntersectionObserver`。

## 模式一：懒加载图片

最经典的用法。先渲染一个占位，等容器快进入视口时再把真正的 `<img>` 换上去。注意那个 `stop()` 调用——一旦加载了，我们就再也不需要 observer 了，所以立刻断开它。

```tsx
import { useRef, useState } from 'react';
import { useIntersectionObserver } from '@reactuses/core';

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const stop = useIntersectionObserver(
    ref,
    ([entry]) => {
      if (entry.isIntersecting) {
        setLoaded(true);
        stop(); // 一次性：决定加载后就停止观察
      }
    },
    { rootMargin: '200px' }, // 在它滚进来之前 200px 就开始加载
  );

  return (
    <div ref={ref} style={{ minHeight: 200 }}>
      {loaded ? <img src={src} alt={alt} /> : <div className="skeleton" />}
    </div>
  );
}
```

有两点让这个写法感觉对路。`rootMargin: '200px'` 把 observer 的「视口」每条边都撑大了 200px，所以请求会在图片*真正可见之前*就发出，用户基本看不到骨架屏。而回调里的 `stop()` 意味着一个 500 张图的懒加载列表，在全部加载完之后就剩零个活跃的 observer——你继续往下滚也不会有残留的工作。

## 模式二：「已浏览」埋点，只触发一次

追踪用户实际滚到了哪些区块是同一个形状——但这里你是真的想让它精确触发一次，所以 `stop()` 在干实事。

```tsx
import { useRef } from 'react';
import { useIntersectionObserver } from '@reactuses/core';

function TrackedSection({ id, children }: { id: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  const stop = useIntersectionObserver(
    ref,
    ([entry]) => {
      if (entry.isIntersecting) {
        analytics.track('section_viewed', { id });
        stop(); // 每个区块只计一次，而不是每次滚过都计
      }
    },
    { threshold: 0.5 }, // 「已浏览」 = 至少露出一半
  );

  return <section ref={ref}>{children}</section>;
}
```

这里 `threshold: 0.5` 编码了一个产品决策——一个区块只有在露出 50% 之后才算「已浏览」，所以快速滚过顶边不会虚高你的数据。`stop()` 则保证每个区块每次页面加载只有一个事件，哪怕用户把它反复滚进滚出。

## 模式三：无限滚动触发器

在列表底部放一个空的哨兵 `<div>`，当它相交时就拉取下一页。注意这里我们*没有*调用 `stop()`——我们想让这个触发器对每一页都持续触发。

```tsx
import { useRef } from 'react';
import { useIntersectionObserver } from '@reactuses/core';

function Feed({ items, loadMore, hasMore }: FeedProps) {
  const sentinel = useRef<HTMLDivElement>(null);

  useIntersectionObserver(sentinel, ([entry]) => {
    if (entry.isIntersecting && hasMore) {
      loadMore();
    }
  });

  return (
    <>
      {items.map((it) => <Row key={it.id} item={it} />)}
      {hasMore && <div ref={sentinel} style={{ height: 1 }} />}
    </>
  );
}
```

因为回调永远是最新的那个（没有过期闭包），`loadMore` 和 `hasMore` 在哨兵每次相交时都被新鲜读取——咬住手写 `useEffect` 版本的那个 bug 在这里根本不存在。如果你想要打包好的整套模式，[`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) 正是在这之上搭的，连滚动容器的管线都帮你接好了。

## 调参：threshold、rootMargin 和 root

第三个参数是原生的 `IntersectionObserverInit`，原样透传。三个旋钮，各自回答一个不同的问题：

```ts
useIntersectionObserver(ref, callback, {
  threshold: 0.5,        // 要露出多少才算数？
  rootMargin: '200px',   // 撑大/缩小触发边界
  root: containerRef.current, // 相对什么来测量？
});
```

- **`threshold`** —— 一个从 `0` 到 `1` 的数字（或数组），表示目标必须露出*多少*回调才触发。`0`（默认）一个像素越界就触发；`1` 要等元素完全进入屏幕。传一个像 `[0, 0.25, 0.5, 0.75, 1]` 这样的数组，你会在每一档都拿到一次回调——用 `entry.intersectionRatio` 驱动滚动联动动画时很有用。
- **`rootMargin`** —— 一个 CSS margin 字符串，在计算相交*之前*把 root 的包围盒撑大或缩小。正值（`'200px'`）提前触发——就是模式一里那个提前懒加载的小技巧。负值（`'-100px 0px'`）延后触发，比如「只有当它越过顶边 100px 之后才算已浏览」。
- **`root`** —— 你拿来测量的那个元素。默认是浏览器视口；当你的列表是在一个 `<div>` 里滚动而不是整页滚动时，把它设成那个滚动容器的元素。

## stop() 返回值

返回的 `stop()` 会断开 observer。你通常用不到它——hook 会在卸载时自动断开——但它是表达*一次性*观察的干净方式，就像模式一和模式二那样：元素第一次相交时,做完事就不再观察。这既是正确性上的收益（事件精确触发一次），也是性能上的（一个长长的、已经加载完的列表后面不会拖着一个活跃的 observer）。

## 只想要一个布尔值？

有时你根本不在乎 entries 或阈值——你只想要一个针对整个视口的、响应式的 `isVisible` 标志。[`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) 封装了 `useIntersectionObserver`，正好把它交给你，形式是一个带自己 `stop` 的元组：

```tsx
import { useRef } from 'react';
import { useElementVisibility } from '@reactuses/core';

function FadeIn({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible] = useElementVisibility(ref);

  return (
    <div ref={ref} className={visible ? 'fade fade-in' : 'fade'}>
      {children}
    </div>
  );
}
```

当一个布尔值就够用时，用 `useElementVisibility`；一旦你想要自定义 `root`、非默认的 `threshold`、多个阈值，或者原始 entry，就降到 `useIntersectionObserver`。同一个引擎，两种手感。

## SSR 安全

`useIntersectionObserver` 在服务端渲染是安全的。它只在 effect 内部构造 `IntersectionObserver`——而 effect React 在服务端从不执行——并且底层的元素查找在浏览器之外会返回 `undefined`，所以没有 `typeof window` 守卫要写，也没有 hydration mismatch 要追。原样丢进 Next.js、Remix 或 Astro 组件即可。（如果 SSR 安全在你的代码库里是个反复出现的主题，[SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) 讲得更深。）

## 可见性与尺寸家族

`useIntersectionObserver` 是一个 DOM 观察 hook 家族里的底层原语。按你真正想要拿回什么来挑：

| Hook | 给你 | 什么时候用… |
| --- | --- | --- |
| [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) | 原始 entries、一个 `stop()` | 你想要完全的控制：自定义 root、阈值、一次性 |
| [`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) | `[isVisible, stop]` | 一个朴素的「它在屏幕上吗？」布尔值就够 |
| [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) | 接好的 load-more 回调 | 你在搭一个分页/无限列表 |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | 尺寸变化时的回调 | 重要的是元素的*尺寸*，而非可见性 |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | `{ width, height }` 状态 | 你只需要实时的宽高 |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | 完整的包围盒 rect | 你需要视口相对位置（滚动时会变） |

想看这些怎么组合的完整巡览，见 [React 观察器 Hooks：监视 DOM 的 7 种方式](https://reactuse.com/blog/react-observer-hooks/)。

## 要点回顾

- 一个 `scroll` 监听器加 `getBoundingClientRect()` 是判断「这个在屏幕上吗」的错误工具——它折磨主线程，还是会漏掉滚动容器。`IntersectionObserver` 正确地回答它：批量、在滚动路径之外。
- **`useIntersectionObserver(target, callback, options?)`** 把它接进 React：给它一个 ref、一个接收原始 entries 的回调，以及原生 options。它返回一个 `stop()`，并在卸载时自动断开。
- 它**故意是基于回调的**——你通过 `entry.isIntersecting` / `entry.intersectionRatio` 来决定「可见」意味着什么。回调永远不会过期，所以它每次触发都读到新鲜的 props。
- 一次性的活儿（懒加载、只触发一次的埋点）就在回调里调 **`stop()`**；重复触发的（无限滚动）就跳过它。
- 用 **`threshold`**（要露出多少）、**`rootMargin`**（提前/延后触发）和 **`root`**（相对容器而非视口测量）来调。
- 只想要布尔值？**`useElementVisibility`** 返回 `[isVisible, stop]`。两者都 SSR 安全。

从 [`@reactuses/core`](https://reactuse.com/element/useintersectionobserver/) 取用，把你的 scroll 监听器样板删掉吧。
