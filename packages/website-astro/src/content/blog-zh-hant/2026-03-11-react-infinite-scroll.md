---
title: "用一個 Hook 在 React 中實作無限捲動"
description: "學習如何使用 useInfiniteScroll 在 React 中實作無限捲動。用一個 hook 取代手動的 IntersectionObserver 程式碼，處理清理、競態條件和載入狀態。"
slug: react-infinite-scroll-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, infinite-scroll, useInfiniteScroll]
keywords: [react infinite scroll, useInfiniteScroll, react infinite loading, react scroll pagination, infinite scroll hook]
image: /img/og.png
---

# 用一個 Hook 在 React 中實作無限捲動

無限捲動讓使用者在向下捲動頁面時載入更多內容，用無縫的瀏覽體驗取代傳統的分頁。它無處不在：社群媒體動態、圖片庫、搜尋結果和產品列表。然而，在 React 中要正確實作它比看起來更難。

<!-- truncate -->

## 什麼是無限捲動？

無限捲動會在使用者到達（或接近）目前列表底部時自動獲取並附加新內容。使用者不需要點擊「下一頁」，只需繼續捲動即可。做得好的話，感覺毫不費力。做得不好的話，會導致重複請求、記憶體洩漏和卡頓的 UI。

## 使用 IntersectionObserver 的手動方式

標準的 DIY 技術使用 `IntersectionObserver` API 來偵測哨兵元素何時進入視窗：

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

這對於示範來說可以運作，但在生產使用中很快就會暴露問題。

## 手動方式的問題

1. **清理容易出錯。** 你必須斷開觀察者、取消進行中的請求，並處理元件卸載。遺漏任何一個，你就會得到記憶體洩漏或在已卸載元件上更新狀態的問題。
2. **競態條件。** 快速捲動可能在第一個請求完成之前多次觸發觀察者回呼，導致重複或亂序的資料。
3. **載入狀態。** 捲動偵測和非同步獲取之間沒有內建的協調。你最終需要在多個 effects 之間串接 `isLoading` 旗標。
4. **捲動方向。** 支援向上的無限捲動（如聊天記錄）需要完全不同的計算方式。
5. **捲動位置保留。** 在目前視窗上方載入項目時，除非你手動測量並恢復，否則捲動位置會跳動。

每次你將這個模式複製貼上到新元件中，都會重新引入相同的風險。

## 更好的方式：useInfiniteScroll

[ReactUse](https://reactuse.com) 提供了 `useInfiniteScroll`，一個處理捲動偵測、回呼呼叫和所有上述邊界情況的 hook：

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

這個 hook 會監控目標元素的捲動位置。當使用者捲動到足夠接近邊緣時，它會呼叫你的 `onLoadMore` 函式。不需要觀察者設定、不需要清理程式碼、不需要哨兵元素。

## 完整範例：帶有 API 載入

以下是一個更完整的範例，包含載入指示器和列表結束檢查：

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

`distance` 選項會在使用者到達底部前 200 像素就觸發載入，這樣新內容會在他們捲完現有項目之前出現。

## 自訂：距離和方向

### 觸發距離

設定 `distance` 來控制載入觸發的時機。值為 `0`（預設值）會等到使用者到達最底部。較高的值透過預先獲取內容提供更流暢的體驗：

```tsx
useInfiniteScroll(ref, loadMore, { distance: 300 });
```

### 捲動方向

預設情況下 hook 監視 `bottom` 邊緣。對於像聊天這樣的逆時間序動態，切換到 `top` 並啟用 `preserveScrollPosition`，這樣在插入新訊息後視窗會保持在原位：

```tsx
useInfiniteScroll(ref, loadOlderMessages, {
  direction: "top",
  preserveScrollPosition: true,
});
```

你也可以使用 `left` 或 `right` 來處理水平捲動佈局，如輪播或時間軸。

## 何時不該使用無限捲動

無限捲動並非總是正確的選擇：

- **使用者需要再次找到的內容。** 如果使用者想要加入書籤或返回特定項目，分頁的 URL 更為可靠。
- **小型、有限的資料集。** 如果你只有 20 個項目，直接全部渲染即可。
- **依賴頁尾的頁面。** 無限捲動使得無法到達頁尾，這會讓期望在那裡找到連結或法律資訊的使用者感到沮喪。
- **無障礙需求。** 螢幕閱讀器和鍵盤導覽與明確的分頁控制配合得更好。如果你使用無限捲動，請提供一個備援的「載入更多」按鈕。

在使用這個模式之前，請考慮這些取捨。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hooks

- [useInfiniteScroll 文件](https://reactuse.com/element/useInfiniteScroll/) -- 互動式範例和完整 API 參考
- [useScroll](https://reactuse.com/element/useScroll/) -- 響應式捲動位置和方向追蹤
- [useVirtualList](https://reactuse.com/element/useVirtualList/) -- 虛擬化長列表，搭配無限捲動使用以獲得更好的效能

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
