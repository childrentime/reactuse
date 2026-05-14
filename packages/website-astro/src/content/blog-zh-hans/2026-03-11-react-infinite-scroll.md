---
title: "用一个 Hook 实现 React 无限滚动"
description: "学习如何使用 useInfiniteScroll 在 React 中实现无限滚动。用一个 Hook 替代手动的 IntersectionObserver 代码，自动处理清理、竞态条件和加载状态。"
slug: react-infinite-scroll-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, infinite-scroll, useInfiniteScroll]
keywords: [react infinite scroll, useInfiniteScroll, react infinite loading, react scroll pagination, infinite scroll hook]
image: /img/og.png
---

# 用一个 Hook 实现 React 无限滚动

无限滚动让用户在向下滚动页面时可以加载更多内容，用无缝的浏览体验取代传统的分页。它无处不在：社交媒体信息流、图片画廊、搜索结果和商品列表。然而，在 React 中正确实现它比看起来要难得多。

<!-- truncate -->

## 什么是无限滚动？

无限滚动会在用户到达（或接近）当前列表末尾时自动获取并追加新内容。用户不需要点击"下一页"，只需继续滚动即可。做得好，感觉毫不费力。做得不好，则会导致重复请求、内存泄漏和界面卡顿。

## 使用 IntersectionObserver 的手动方式

标准的 DIY 方法是使用 `IntersectionObserver` API 来检测哨兵元素何时进入视口：

```tsx
import { useEffect, useRef, useState } from "react";

function Feed() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch(`/api/items?page=${page}`)
      .then((res) => res.json())
      .then((data) => setItems((prev) => [...prev, ...data]));
  }, [page]);

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
      <div ref={sentinelRef} />
    </div>
  );
}
```

这对演示来说可以工作，但在生产环境中很快就会暴露问题。

## 手动方式的问题

1. **清理容易出错。** 你必须断开 observer、取消进行中的请求、处理组件卸载。遗漏任何一项都会导致内存泄漏或在已卸载组件上更新状态。
2. **竞态条件。** 快速滚动可能在第一次请求完成之前多次触发 observer 回调，导致重复或乱序的数据。
3. **加载状态。** 滚动检测和异步请求之间没有内置的协调机制。你最终需要在多个 effect 之间传递 `isLoading` 标志。
4. **滚动方向。** 支持向上无限滚动（如聊天记录）需要完全不同的计算方式。
5. **滚动位置保持。** 在当前视口上方加载内容时，除非你手动测量和恢复，否则滚动位置会跳动。

每次你将这个模式复制粘贴到新组件中，就会重新引入同样的风险。

## 更好的方式：useInfiniteScroll

[ReactUse](https://reactuse.com) 提供了 `useInfiniteScroll`，一个处理滚动检测、回调调用和上述所有边界情况的 Hook：

```tsx
import { useInfiniteScroll } from "@reactuses/core";
import { useRef, useState } from "react";

function Feed() {
  const ref = useRef(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useInfiniteScroll(
    ref,
    async () => {
      const res = await fetch(`/api/items?page=${page}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
    }
  );

  return (
    <div ref={ref} style={{ height: 500, overflow: "auto" }}>
      {items.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
}
```

该 Hook 监控目标元素的滚动位置。当用户滚动到足够接近边缘时，它会调用你的 `onLoadMore` 函数。无需设置 observer，无需清理代码，无需哨兵元素。

## 带 API 加载的完整示例

这是一个更完整的示例，包含加载指示器和列表末尾检查：

```tsx
import { useInfiniteScroll } from "@reactuses/core";
import { useRef, useState } from "react";

function ProductList() {
  const containerRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useInfiniteScroll(
    containerRef,
    async () => {
      if (!hasMore) return;

      const res = await fetch(`/api/products?page=${page}&limit=20`);
      const data = await res.json();

      if (data.length < 20) setHasMore(false);
      setProducts((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
    },
    { distance: 200 }
  );

  return (
    <div ref={containerRef} style={{ height: "80vh", overflow: "auto" }}>
      {products.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>{product.price}</p>
        </div>
      ))}
      {!hasMore && <p>You have reached the end.</p>}
    </div>
  );
}
```

`distance` 选项会在用户到达底部之前 200 像素就触发加载，这样新内容会在用户滚完当前内容之前就出现。

## 自定义：触发距离和方向

### 触发距离

设置 `distance` 来控制加载触发的提前量。值为 `0`（默认值）会等到用户滚到最底部。更高的值通过预加载内容提供更流畅的体验：

```tsx
useInfiniteScroll(ref, loadMore, { distance: 300 });
```

### 滚动方向

默认情况下，Hook 监视 `bottom` 边缘。对于像聊天这样的倒序信息流，切换到 `top` 并启用 `preserveScrollPosition`，这样在插入新消息后视口会保持原位：

```tsx
useInfiniteScroll(ref, loadOlderMessages, {
  direction: "top",
  preserveScrollPosition: true,
});
```

你也可以使用 `left` 或 `right` 来支持水平滚动布局，如轮播图或时间线。

## 不适合使用无限滚动的场景

无限滚动并不总是最佳选择：

- **用户需要重新找到的内容。** 如果用户想要收藏或返回到特定项目，分页的 URL 更可靠。
- **小型、有限的数据集。** 如果你只有 20 个项目，直接全部渲染即可。
- **依赖页脚的页面。** 无限滚动使得页脚无法到达，这会让期望在那里找到链接或法律信息的用户感到沮丧。
- **无障碍要求。** 屏幕阅读器和键盘导航配合显式分页控件效果更好。如果你使用无限滚动，请提供一个备选的"加载更多"按钮。

在使用这种模式之前，请考虑这些权衡。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hooks

- [useInfiniteScroll 文档](https://reactuse.com/browser/useinfinitescroll/) -- 交互式演示和完整 API 参考
- [useScroll](https://reactuse.com/browser/usescroll/) -- 响应式滚动位置和方向追踪

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
