---
title: "React useInfiniteScroll Hook：无限滚动轻松实现（2026）"
description: "一篇实用的 useInfiniteScroll 上手指南：一个 hook 搞定到底加载，支持四个滚动方向，反向加载时保持滚动位置，内置节流——基于 useScroll 构建，SSR 安全，TypeScript 优先。"
slug: react-useinfinitescroll-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-03
tags: [react, hooks, infinite-scroll, typescript, tutorial]
keywords: [react useInfiniteScroll, useinfinitescroll, useInfiniteScroll hook, react 无限滚动 hook, react 无限加载, react 滚动分页, react 滚动到底加载更多, useScroll react, react 无限滚动 typescript, ssr 安全无限滚动, react 聊天滚动, react 反向滚动]
image: /img/og.png
---

# React useInfiniteScroll Hook：无限滚动轻松实现（2026）

每个信息流、每个聊天记录、每个搜索结果页面最终都会问同一个问题：*用户滚到底部时怎么加载更多？* 朴素的答案——一个 scroll 监听器、一些关于 `scrollHeight` 和 `clientHeight` 的算术、一个防止重复请求的布尔值——大约 30 行代码，而每一行都是陷阱。你忘了清理监听器。你比较了错误的尺寸。你在 mount 时触发了回调，那时候根本没有内容可以滚动。你硬编码了"底部"，然后产品要求做一个向上加载历史记录的聊天界面。你没做节流，于是用户把滚动位置停在阈值附近时回调每秒触发 60 次。

[`@reactuses/core`](https://reactuse.com) 的 [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) 用一次调用替代了所有这些：把它指向一个可滚动元素，给它一个加载更多函数，剩下的它全包了——到达检测、方向、距离阈值、滚动位置保持和清理。这篇文章会走读真实实现、关键选项，以及信息流、聊天和水平轮播的实战模式。TypeScript 优先。

<!-- truncate -->

## 最简用法：滚到底部加载更多

```tsx
import { useRef, useState } from 'react';
import { useInfiniteScroll } from '@reactuses/core';

function Feed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<string[]>(() =>
    Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
  );

  useInfiniteScroll(containerRef, async () => {
    const newItems = await fetchMoreItems(items.length);
    setItems(prev => [...prev, ...newItems]);
  });

  return (
    <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
      {items.map(item => (
        <div key={item} style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          {item}
        </div>
      ))}
    </div>
  );
}
```

就这么多。滚到底部，`fetchMoreItems` 触发。用户滚走再滚回来之前不会重复触发。SSR 期间不会触发。卸载时自动清理监听器。容器可以是任何可滚动元素——一个带 `overflow: auto` 的 `div`、一个 `<section>`，只要 ref 指向它就行。

## 函数签名

```ts
useInfiniteScroll(target, onLoadMore, options?)
```

- **`target`** — 可滚动 DOM 元素的 ref（`RefObject<Element>`）。
- **`onLoadMore`** — 用户到达滚动边缘时调用的函数（同步或异步）。它接收来自 [`useScroll`](https://reactuse.com/browser/usescroll/) 的完整滚动状态：`[x, y, isScrolling, arrivedState, directions]`。
- **`options`** — [`useScroll`](https://reactuse.com/browser/usescroll/) 接受的所有选项，加上三个无限滚动专属字段。

## 关键选项

### `distance` —— 提前触发

```tsx
useInfiniteScroll(containerRef, loadMore, {
  distance: 200, // 距底部 200px 时就触发
});
```

默认值是 `0`——只有滚到绝对边缘才触发回调。设置 `distance` 可以预加载：设为 `200` 时，在还有 200 px 内容可滚动的时候就开始请求下一页，这样网速够快的话用户永远看不到加载中。合适的数值取决于列表项高度和请求延迟——从一屏高度开始，往下调。

### `direction` —— 不只是底部

```tsx
useInfiniteScroll(containerRef, loadMore, {
  direction: 'top', // 向上滚动时加载更早的消息
});
```

四个方向：`'bottom'`（默认）、`'top'`、`'left'`、`'right'`。聊天应用要 `'top'`——用户向上滚动加载历史消息。水平轮播要 `'left'` 或 `'right'`。hook 会自动把到达检测连接到正确的边缘。

### `preserveScrollPosition` —— 留在原地

```tsx
useInfiniteScroll(containerRef, loadMore, {
  direction: 'top',
  preserveScrollPosition: true,
});
```

当你在当前视口*上方*加载内容时（聊天历史、倒序信息流），新内容会把所有东西往下推，用户就丢失了位置。`preserveScrollPosition: true` 解决了这个问题：`onLoadMore` resolve 之后，hook 会把 `scrollTop`（水平方向则是 `scrollLeft`）精确偏移新插入内容的高度（或宽度）。用户看到的滚动位置不变，更早的消息出现在上方。

### `throttle` —— 继承自 useScroll

```tsx
useInfiniteScroll(containerRef, loadMore, {
  throttle: 100, // 每 100ms 至多检测一次到达
});
```

这是 [`useScroll`](https://reactuse.com/browser/usescroll/) 的选项，`useInfiniteScroll` 直接透传。它节流底层的滚动事件处理器——当你的容器以 120 fps 滚动而你不需要亚帧级到达检测时很有用。

## 底层实现

[实现](https://reactuse.com/browser/useinfinitescroll/)只有 44 行。它做了这些事：

```ts
export const useInfiniteScroll = (target, onLoadMore, options = {}) => {
  const savedLoadMore = useLatest(onLoadMore);
  const direction = options.direction ?? 'bottom';
  const state = useScroll(target, {
    ...options,
    offset: {
      [direction]: options.distance ?? 0,
      ...options.offset,
    },
  });

  const di = state[3][direction]; // arrivedState[direction]

  useUpdateEffect(() => {
    const element = getTargetElement(target);
    const fn = async () => {
      const previous = {
        height: element?.scrollHeight ?? 0,
        width: element?.scrollWidth ?? 0,
      };
      await savedLoadMore.current(state);
      if (options.preserveScrollPosition && element) {
        element.scrollTo({
          top: element.scrollHeight - previous.height,
          left: element.scrollWidth - previous.width,
        });
      }
    };
    fn();
  }, [di, options.preserveScrollPosition, target]);
};
```

三个关键部分让它工作：

1. **[`useScroll`](https://reactuse.com/browser/usescroll/) 做了所有重活。** 它跟踪 `x`、`y`、`isScrolling`、到达状态（四个边缘各一个布尔值）和滚动方向。`offset` 选项移动到达阈值——`useInfiniteScroll` 把它的 `distance` 选项映射到 `offset[direction]`，所以"到达底部"实际上是"到达距底部 `distance` 像素以内"。

2. **[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 防止了 mount 时触发。** 普通 `useEffect` 会在 mount 时调用 `onLoadMore`——那时容器还没有任何内容可滚动。`useUpdateEffect` 跳过首次调用，只在 `di`（所选方向的到达布尔值）实际*变化*时才触发。回调在每次到达时触发一次，而不是每次滚动事件触发一次。

3. **[`useLatest`](https://reactuse.com/state/uselatest/) 消灭了闭包陈旧。** `onLoadMore` 回调大概率闭包了渲染间会变化的状态——当前页码、已累积的条目、游标。`useLatest` 把它包在 ref 里，所以调用的始终是最新版本，而无需重建滚动机制。

### `preserveScrollPosition` 的技巧

`onLoadMore` resolve 之后（新条目已经在 DOM 里了），hook 快照 `scrollHeight`/`scrollWidth` 的*变化量*，然后调用 `element.scrollTo()` 精确偏移那个差值。这是一个异步操作之后的同步 DOM 测量——它能工作是因为 `onLoadMore` 中的 React 状态更新在 `await` 恢复时已经刷新到 DOM 了。

## 实战模式

### 分页信息流

```tsx
function PaginatedFeed() {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [hasMore, setHasMore] = useState(true);

  useInfiniteScroll(ref, async () => {
    if (!hasMore) return;
    const data = await fetchPage(page);
    setItems(prev => [...prev, ...data.items]);
    setHasMore(data.hasNextPage);
    setPage(prev => prev + 1);
  }, { distance: 300 });

  return (
    <div ref={ref} style={{ height: '100vh', overflow: 'auto' }}>
      {items.map(item => <Card key={item.id} item={item} />)}
      {!hasMore && <p>没有更多了</p>}
    </div>
  );
}
```

用 `hasMore` 做守卫，API 说没有更多数据时回调变成空操作。hook 在边缘仍然会触发——守卫让触发的代价很低。

### 聊天历史（反向滚动）

```tsx
function ChatHistory({ channelId }: { channelId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  useInfiniteScroll(ref, async () => {
    const data = await fetchMessages(channelId, cursor);
    setMessages(prev => [...data.messages, ...prev]);
    setCursor(data.nextCursor);
  }, {
    direction: 'top',
    preserveScrollPosition: true,
    distance: 100,
  });

  return (
    <div ref={ref} style={{ height: 500, overflow: 'auto' }}>
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
    </div>
  );
}
```

`direction: 'top'` 在用户滚到顶部时触发。`preserveScrollPosition: true` 在旧消息前插之后保持视口停在同一条消息上。这就是 Slack、Discord 和所有聊天 UI 用的模式——也是手写最容易翻车的模式，因为滚动位置的计算必须在 DOM 更新*之后*、浏览器绘制*之前*执行。

### 水平轮播

```tsx
function HorizontalGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);

  useInfiniteScroll(ref, async () => {
    const moreImages = await fetchImages(images.length);
    setImages(prev => [...prev, ...moreImages]);
  }, {
    direction: 'right',
    distance: 200,
  });

  return (
    <div ref={ref} style={{ display: 'flex', overflowX: 'auto', gap: 16 }}>
      {images.map(src => <img key={src} src={src} style={{ width: 300 }} />)}
    </div>
  );
}
```

同一个 hook，不同的轴。`direction: 'right'` 监视 `scrollLeft` 相对于 `scrollWidth` 的位置。

## useInfiniteScroll vs. useIntersectionObserver

两者都能触发"加载更多"。区别在于它们监视什么：

- [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) 监视一个*哨兵元素*——列表底部的一个 div。当哨兵进入视口时，加载更多。它适用于任何容器，包括 window 本身，并且能优雅地处理复杂布局（粘性头部、嵌套滚动容器），因为浏览器的交叉计算会考虑所有这些因素。

- [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) 监视特定容器的*滚动位置*。连接更简单（不需要管理哨兵元素），原生支持四个方向，并且内置 `preserveScrollPosition`。

**在以下情况选 `useInfiniteScroll`**：你有一个单独的可滚动容器，想要最简单的配置。**在以下情况选 `useIntersectionObserver`**：你在 window 级别加载、有复杂的嵌套滚动上下文，或者需要对触发阈值做精细控制。

## 滚动家族

- [`useScroll`](https://reactuse.com/browser/usescroll/) —— 基石：跟踪任何可滚动元素的 `x`、`y`、`isScrolling`、到达状态和方向。`useInfiniteScroll` 基于它构建。
- [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/) —— 同样的跟踪，但专门针对 `window`。
- [`useThrottle`](https://reactuse.com/state/usethrottle/) / [`useDebounce`](https://reactuse.com/state/usedebounce/) —— 对任何值做速率限制。`useScroll` 内置了 `throttle` 支持，但如果你因为其他原因需要节流加载更多的*输出*，这两个就是你的工具。
- [`useElementSize`](https://reactuse.com/element/useelementsize/) —— 如果你需要知道容器的尺寸来计算每页该请求多少条目。

## SSR 安全

`useInfiniteScroll` 在服务端渲染期间不创建任何订阅。滚动监听器在 [`useScroll`](https://reactuse.com/browser/usescroll/) 内部附加，而后者会检查 `window` 是否存在。`useUpdateEffect` 完全跳过首次渲染。在服务端，这个 hook 是一个不触碰任何浏览器全局变量的空操作——你的 Next.js / Remix 构建渲染初始条目并干净地 hydrate，无限滚动随客户端一起醒来。和 [`@reactuses/core`](https://reactuse.com) 的每个 hook 一样，在构造上就是 SSR 安全的。

## 要点总结

- **一个 hook 替代了滚动监听器、计算和清理。** [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) 接收一个 ref 和一个回调，其余全搞定。
- **`distance` 预加载内容**，让用户永远不用在底部等待。
- **`direction` 处理全部四个边缘** —— `'bottom'` 用于信息流，`'top'` 用于聊天历史，`'left'`/`'right'` 用于轮播。
- **`preserveScrollPosition` 是聊天历史的救星** —— 前插内容后调整滚动偏移，让视口不跳动。
- **基于 [`useScroll`](https://reactuse.com/browser/usescroll/) 构建**，意味着你免费获得了节流、到达状态跟踪和方向检测。
- **[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 防止了 mount 时触发** —— 回调在用户实际滚动到边缘之前不会运行。
- **SSR 安全，无需配置** —— 客户端接管之前没有监听器，没有浏览器全局变量。

安装 [`@reactuses/core`](https://reactuse.com)，把 `useInfiniteScroll` 指向你的列表容器，告别手写滚动算术。
