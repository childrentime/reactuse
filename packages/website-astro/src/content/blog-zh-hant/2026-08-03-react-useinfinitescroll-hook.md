---
title: "React useInfiniteScroll Hook：無限捲動輕鬆實現（2026）"
description: "一篇實用的 useInfiniteScroll 上手指南：一個 hook 搞定到底載入，支援四個捲動方向，反向載入時保持捲動位置，內建節流——基於 useScroll 建構，SSR 安全，TypeScript 優先。"
slug: react-useinfinitescroll-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-03
tags: [react, hooks, infinite-scroll, typescript, tutorial]
keywords: [react useInfiniteScroll, useinfinitescroll, useInfiniteScroll hook, react 無限捲動 hook, react 無限載入, react 捲動分頁, react 捲動到底載入更多, useScroll react, react 無限捲動 typescript, ssr 安全無限捲動, react 聊天捲動, react 反向捲動]
image: /img/og.png
---

# React useInfiniteScroll Hook：無限捲動輕鬆實現（2026）

每個資訊流、每個聊天記錄、每個搜尋結果頁面最終都會問同一個問題：*使用者捲到底部時怎麼載入更多？* 樸素的答案——一個 scroll 監聽器、一些關於 `scrollHeight` 和 `clientHeight` 的算術、一個防止重複請求的布林值——大約 30 行程式碼，而每一行都是陷阱。你忘了清理監聽器。你比較了錯誤的尺寸。你在 mount 時觸發了回呼，那時候根本沒有內容可以捲動。你硬編碼了「底部」，然後產品要求做一個向上載入歷史記錄的聊天介面。你沒做節流，於是使用者把捲動位置停在閾值附近時回呼每秒觸發 60 次。

[`@reactuses/core`](https://reactuse.com) 的 [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) 用一次呼叫替代了所有這些：把它指向一個可捲動元素，給它一個載入更多函式，剩下的它全包了——到達偵測、方向、距離閾值、捲動位置保持和清理。這篇文章會走讀真實實作、關鍵選項，以及資訊流、聊天和水平輪播的實戰模式。TypeScript 優先。

<!-- truncate -->

## 最簡用法：捲到底部載入更多

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

就這麼多。捲到底部，`fetchMoreItems` 觸發。使用者捲走再捲回來之前不會重複觸發。SSR 期間不會觸發。卸載時自動清理監聽器。容器可以是任何可捲動元素——一個帶 `overflow: auto` 的 `div`、一個 `<section>`，只要 ref 指向它就行。

## 函式簽名

```ts
useInfiniteScroll(target, onLoadMore, options?)
```

- **`target`** — 可捲動 DOM 元素的 ref（`RefObject<Element>`）。
- **`onLoadMore`** — 使用者到達捲動邊緣時呼叫的函式（同步或非同步）。它接收來自 [`useScroll`](https://reactuse.com/browser/usescroll/) 的完整捲動狀態：`[x, y, isScrolling, arrivedState, directions]`。
- **`options`** — [`useScroll`](https://reactuse.com/browser/usescroll/) 接受的所有選項，加上三個無限捲動專屬欄位。

## 關鍵選項

### `distance` —— 提前觸發

```tsx
useInfiniteScroll(containerRef, loadMore, {
  distance: 200, // 距底部 200px 時就觸發
});
```

預設值是 `0`——只有捲到絕對邊緣才觸發回呼。設定 `distance` 可以預載入：設為 `200` 時，在還有 200 px 內容可捲動的時候就開始請求下一頁，這樣網速夠快的話使用者永遠看不到載入中。合適的數值取決於列表項高度和請求延遲——從一屏高度開始，往下調。

### `direction` —— 不只是底部

```tsx
useInfiniteScroll(containerRef, loadMore, {
  direction: 'top', // 向上捲動時載入更早的訊息
});
```

四個方向：`'bottom'`（預設）、`'top'`、`'left'`、`'right'`。聊天應用要 `'top'`——使用者向上捲動載入歷史訊息。水平輪播要 `'left'` 或 `'right'`。hook 會自動把到達偵測連接到正確的邊緣。

### `preserveScrollPosition` —— 留在原地

```tsx
useInfiniteScroll(containerRef, loadMore, {
  direction: 'top',
  preserveScrollPosition: true,
});
```

當你在當前視口*上方*載入內容時（聊天歷史、倒序資訊流），新內容會把所有東西往下推，使用者就遺失了位置。`preserveScrollPosition: true` 解決了這個問題：`onLoadMore` resolve 之後，hook 會把 `scrollTop`（水平方向則是 `scrollLeft`）精確偏移新插入內容的高度（或寬度）。使用者看到的捲動位置不變，更早的訊息出現在上方。

### `throttle` —— 繼承自 useScroll

```tsx
useInfiniteScroll(containerRef, loadMore, {
  throttle: 100, // 每 100ms 至多偵測一次到達
});
```

這是 [`useScroll`](https://reactuse.com/browser/usescroll/) 的選項，`useInfiniteScroll` 直接透傳。它節流底層的捲動事件處理器——當你的容器以 120 fps 捲動而你不需要亞幀級到達偵測時很有用。

## 底層實作

[實作](https://reactuse.com/browser/useinfinitescroll/)只有 44 行。它做了這些事：

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

三個關鍵部分讓它運作：

1. **[`useScroll`](https://reactuse.com/browser/usescroll/) 做了所有重活。** 它追蹤 `x`、`y`、`isScrolling`、到達狀態（四個邊緣各一個布林值）和捲動方向。`offset` 選項移動到達閾值——`useInfiniteScroll` 把它的 `distance` 選項映射到 `offset[direction]`，所以「到達底部」實際上是「到達距底部 `distance` 像素以內」。

2. **[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 防止了 mount 時觸發。** 普通 `useEffect` 會在 mount 時呼叫 `onLoadMore`——那時容器還沒有任何內容可捲動。`useUpdateEffect` 跳過首次呼叫，只在 `di`（所選方向的到達布林值）實際*變化*時才觸發。回呼在每次到達時觸發一次，而不是每次捲動事件觸發一次。

3. **[`useLatest`](https://reactuse.com/state/uselatest/) 消滅了閉包過期。** `onLoadMore` 回呼大機率閉包了渲染間會變化的狀態——當前頁碼、已累積的條目、游標。`useLatest` 把它包在 ref 裡，所以呼叫的始終是最新版本，而無需重建捲動機制。

### `preserveScrollPosition` 的技巧

`onLoadMore` resolve 之後（新條目已經在 DOM 裡了），hook 快照 `scrollHeight`/`scrollWidth` 的*變化量*，然後呼叫 `element.scrollTo()` 精確偏移那個差值。這是一個非同步操作之後的同步 DOM 測量——它能運作是因為 `onLoadMore` 中的 React 狀態更新在 `await` 恢復時已經刷新到 DOM 了。

## 實戰模式

### 分頁資訊流

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
      {!hasMore && <p>沒有更多了</p>}
    </div>
  );
}
```

用 `hasMore` 做守衛，API 說沒有更多資料時回呼變成空操作。hook 在邊緣仍然會觸發——守衛讓觸發的代價很低。

### 聊天歷史（反向捲動）

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

`direction: 'top'` 在使用者捲到頂部時觸發。`preserveScrollPosition: true` 在舊訊息前插之後保持視口停在同一條訊息上。這就是 Slack、Discord 和所有聊天 UI 用的模式——也是手寫最容易翻車的模式，因為捲動位置的計算必須在 DOM 更新*之後*、瀏覽器繪製*之前*執行。

### 水平輪播

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

同一個 hook，不同的軸。`direction: 'right'` 監視 `scrollLeft` 相對於 `scrollWidth` 的位置。

## useInfiniteScroll vs. useIntersectionObserver

兩者都能觸發「載入更多」。區別在於它們監視什麼：

- [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) 監視一個*哨兵元素*——列表底部的一個 div。當哨兵進入視口時，載入更多。它適用於任何容器，包括 window 本身，並且能優雅地處理複雜佈局（黏性頭部、巢狀捲動容器），因為瀏覽器的交叉計算會考量所有這些因素。

- [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) 監視特定容器的*捲動位置*。連接更簡單（不需要管理哨兵元素），原生支援四個方向，並且內建 `preserveScrollPosition`。

**在以下情況選 `useInfiniteScroll`**：你有一個單獨的可捲動容器，想要最簡單的設定。**在以下情況選 `useIntersectionObserver`**：你在 window 層級載入、有複雜的巢狀捲動上下文，或者需要對觸發閾值做精細控制。

## 捲動家族

- [`useScroll`](https://reactuse.com/browser/usescroll/) —— 基石：追蹤任何可捲動元素的 `x`、`y`、`isScrolling`、到達狀態和方向。`useInfiniteScroll` 基於它建構。
- [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/) —— 同樣的追蹤，但專門針對 `window`。
- [`useThrottle`](https://reactuse.com/state/usethrottle/) / [`useDebounce`](https://reactuse.com/state/usedebounce/) —— 對任何值做速率限制。`useScroll` 內建了 `throttle` 支援，但如果你因為其他原因需要節流載入更多的*輸出*，這兩個就是你的工具。
- [`useElementSize`](https://reactuse.com/element/useelementsize/) —— 如果你需要知道容器的尺寸來計算每頁該請求多少條目。

## SSR 安全

`useInfiniteScroll` 在伺服器渲染期間不建立任何訂閱。捲動監聽器在 [`useScroll`](https://reactuse.com/browser/usescroll/) 內部附加，而後者會檢查 `window` 是否存在。`useUpdateEffect` 完全跳過首次渲染。在伺服器端，這個 hook 是一個不觸碰任何瀏覽器全域變數的空操作——你的 Next.js / Remix 建構渲染初始條目並乾淨地 hydrate，無限捲動隨客戶端一起醒來。和 [`@reactuses/core`](https://reactuse.com) 的每個 hook 一樣，在建構上就是 SSR 安全的。

## 要點總結

- **一個 hook 替代了捲動監聽器、計算和清理。** [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) 接收一個 ref 和一個回呼，其餘全搞定。
- **`distance` 預載入內容**，讓使用者永遠不用在底部等待。
- **`direction` 處理全部四個邊緣** —— `'bottom'` 用於資訊流，`'top'` 用於聊天歷史，`'left'`/`'right'` 用於輪播。
- **`preserveScrollPosition` 是聊天歷史的救星** —— 前插內容後調整捲動偏移，讓視口不跳動。
- **基於 [`useScroll`](https://reactuse.com/browser/usescroll/) 建構**，意味著你免費獲得了節流、到達狀態追蹤和方向偵測。
- **[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 防止了 mount 時觸發** —— 回呼在使用者實際捲動到邊緣之前不會執行。
- **SSR 安全，無需設定** —— 客戶端接管之前沒有監聽器，沒有瀏覽器全域變數。

安裝 [`@reactuses/core`](https://reactuse.com)，把 `useInfiniteScroll` 指向你的列表容器，告別手寫捲動算術。
