---
title: "React useResizeObserver Hook：追蹤元素尺寸變化（2026）"
description: "一篇實用的 useResizeObserver 上手指南：用原生 ResizeObserver API 監聽任意元素——支援 ref、元素、getter 三種目標形式，自動清理，box 選項詳解——外加 useElementSize 和 useMeasure，只想拿數字時直接用。SSR 安全，TypeScript 優先。"
slug: react-useresizeobserver-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-21
tags: [react, hooks, browser-api, typescript, tutorial]
keywords: [react useResizeObserver, useResizeObserver hook, useresizeobserver react, resize observer react, ResizeObserver react hook, react 元素尺寸 hook, useElementSize, useMeasure react, react-use-measure 替代, react 測量元素, 監聽元素尺寸變化 react, react 容器寬度 hook, useResizeObserver typescript]
image: /img/og.png
---

# React useResizeObserver Hook：追蹤元素尺寸變化（2026）

一個圖表元件在掛載時讀取一次容器寬度，然後按這個寬度繪製自己。接著使用者把側邊欄摺疊了。容器瞬間多出 300 像素，視窗沒有任何變化，`resize` 事件一次都沒觸發——圖表現在待在一個過寬的盒子裡，畫的還是那個已經不存在的版面。監聽 `window.resize` 會漏掉元素在視窗不變的情況下改變尺寸的每一種方式：側邊欄開合、flex 兄弟節點出現、上方內容載入完成、手風琴展開。

瀏覽器給出的答案是 [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)——一個監聽元素本身而非視窗的原生 API。[`@reactuses/core`](https://reactuse.com) 的 `useResizeObserver` 把它的生命週期全部接管：掛載時 observe，卸載時 disconnect，不留下任何失控的 observer。以下都是真實 API，TypeScript 優先。

<!-- truncate -->

## 手寫版本，以及它在哪裡散架

手動把 `ResizeObserver` 接進元件看起來並不難：

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

這段程式碼能跑——直到它遇上真實的元件程式碼。常見的散架方式：

- **回呼需要讀 props 或 state。** 空依賴陣列意味著 observer 永遠呼叫首次渲染時的那個回呼。把依賴加進去，observer 又變成每次變化都銷毀重建。兩種都不是你想要的。
- **options 物件反覆觸發 effect。** 把 `{ box: 'border-box' }` 內聯寫進依賴陣列，每次渲染它都是一個新物件——observer 不停地斷開再重連。
- **目標不是 ref。** 有時元素來自回呼、portal 或 `document.querySelector`，effect + ref 的模式對每種形態都得重新接線。

單看每一條都不難。但這是你會在每個關心自身尺寸的元件裡重複推導的生命週期管線——而每一份拷貝離洩漏或 observe/disconnect 死迴圈都只差一次重構。

## useResizeObserver——原生 API，生命週期已接管

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

簽名：

```ts
function useResizeObserver(
  target: BasicTarget<Element>,
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions
): () => void;
```

三個值得注意的點，正好對應手寫版本散架的地方：

- **目標形式靈活。** `BasicTarget` 接受 ref 物件、普通 `Element`，或回傳元素的 getter 函式——同一個 hook 涵蓋了 ref 場景、`querySelector` 場景，以及「元素還沒掛載」的場景（`null`/`undefined` 目標在存在之前不會被 observe）。
- **回呼就是原生的 `ResizeObserverCallback`。** 你拿到的是真正的 `ResizeObserverEntry[]`——`contentRect`、`borderBoxSize`、`contentBoxSize`——不是簡化過的包裝。而且渲染之間回呼變化不會導致 observer 銷毀重建；hook 對每個目標只保持一個 observer，不會每次渲染都輪換。
- **options 走深比較。** 內聯寫 `{ box: 'border-box' }` 沒問題——hook 按值比較而非按參照比較，每次渲染的新物件字面值不會折騰 observer。

回傳值是一個 `stop()` 函式：想提前斷開就呼叫它——比如測量拿到一次就夠了的場景。否則清理會在卸載時自動完成。

## `box` 選項

`ResizeObserverOptions` 只有一個欄位 `box`，它決定「尺寸」是指什麼：

| `box` 取值 | 測量的內容 |
| --- | --- |
| `'content-box'`（預設） | 僅內容——不含 padding 和 border |
| `'border-box'` | 內容 + padding + border——元素在版面中實際佔據的大小 |
| `'device-pixel-content-box'` | 以實體裝置像素計的內容盒——用於像素級精確的 canvas 工作 |

大多數版面邏輯用預設值就對了。需要匹配元素在版面中的佔位時用 `'border-box'`；給 `<canvas>` 設定後備緩衝區、讓它在高 DPI 螢幕上保持清晰時用 `'device-pixel-content-box'`。

## 只想拿數字？useElementSize 和 useMeasure

`useResizeObserver` 交給你的是原始的 observer entries，適合命令式工作——重繪圖表、同步 canvas。但很多時候目標只是*把尺寸當作響應式狀態*。[`@reactuses/core`](https://reactuse.com) 裡有兩個 hook 直接建構在 `useResizeObserver` 之上，專門做這件事：

[`useElementSize`](https://reactuse.com/element/useelementsize/)——寬高元組：

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

它支援同樣的 `box` 選項（並透過 `borderBoxSize`/`contentBoxSize` 正確累加分片盒），首次測量落地之前回傳 `[0, 0]`。

[`useMeasure`](https://reactuse.com/element/usemeasure/)——完整的 content rect，寬高不夠用時的選擇：

```tsx
import { useMeasure } from '@reactuses/core';

function Panel() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, stop] = useMeasure(ref);
  // rect: { x, y, width, height, top, left, bottom, right }

  return <div ref={ref}>{rect.width}px wide</div>;
}
```

如果你用過獨立的 `react-use-measure` 套件，思路是一樣的——已經在用 `@reactuses/core` 的話，還能少一個依賴。

## 選對尺寸類 hook

element 分類下有好幾個聽起來很像的 hook，它們回答的是不同的問題：

| Hook | 回答的問題 | 更新時機 |
| --- | --- | --- |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | 「元素變化時執行這段程式碼」 | 元素 resize（原始 entries） |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | 「這個元素有多大？」 | 元素 resize |
| [`useMeasure`](https://reactuse.com/element/usemeasure/) | 「這個元素的 content rect 是什麼？」 | 元素 resize |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | 「這個元素在視口的什麼位置？」 | 元素 resize **加** 視窗捲動/resize |
| [`useWindowSize`](https://reactuse.com/element/usewindowsize/) | 「視窗有多大？」 | 視窗 resize |

最容易絆倒人的一個區別：`useMeasure` 回報的是 observer 的 content rect（由尺寸驅動），而 [`useElementBounding`](https://reactuse.com/element/useelementbounding/) 回報的是 `getBoundingClientRect()`——相對視口的位置——並且捲動時也會刷新。定位 tooltip 或 overlay？用 `useElementBounding`。回應尺寸？用 `useElementSize` 或 `useMeasure`。更完整的 observer 家族對比——intersection、mutation、resize——見 [React Observer Hooks](https://reactuse.com/blog/react-observer-hooks/)。

## 真實使用場景

- **容器驅動的響應式元件。** 根據*自身*寬度而非視口寬度切換版面的元件，放進側邊欄、對話框、分欄面板都能正確運作。這就是容器查詢的思維方式，以普通 state 的形式提供。
- **圖表與 canvas。** 在繪圖表面真正變化的那一刻重繪，包括 `window.resize` 永遠看不到的側邊欄開合和 flex 重排。搭配 `'device-pixel-content-box'` 讓高 DPI canvas 保持清晰。
- **虛擬清單。** 變高虛擬化的列測量：observe 每一列，把真實高度餵回虛擬化器。
- **自動增高的 textarea 與截斷文字。** 偵測內容何時溢出容器，基於測量值而非假設值切換「展開更多」。
- **元素級媒體查詢。** 工具列在自己的容器變窄的那一刻從「圖示+文字」切換為「僅圖示」，與視窗在做什麼無關。

## SSR 安全，從構造上保證

伺服器端不存在 `ResizeObserver`。這三個 hook 都只在 effect 裡觸碰它，目標解析也有守衛——伺服器端渲染期間什麼都不執行，`useElementSize` 回傳 `[0, 0]`，`useMeasure` 回傳全零的 rect，水合正常進行，不會拋 `ReferenceError`。你的程式碼裡不需要任何 `typeof window` 檢查。想排查其他手寫瀏覽器 API 程式碼的同類問題，見 [SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/)。

## 要點回顧

- **`window.resize` 會漏掉大多數元素尺寸變化**——側邊欄開合、flex 重排、內容變化。`ResizeObserver` 監聽元素本身，`useResizeObserver` 接管它的生命週期：掛載時 observe，卸載時 disconnect，外加一個提前退出用的 `stop()`。
- **目標形式靈活**——ref、元素或 getter——null 目標也被妥善處理，掛載順序的雜技動作可以省了。
- **回呼和 options 不會折騰 observer。** 內聯回呼、內聯 options 物件都沒問題；每個目標只有一個 observer。
- **`box` 決定「尺寸」的含義**——預設 `content-box`，版面佔位用 `border-box`，canvas 工作用 `device-pixel-content-box`。
- **想要 state 而不是 entries？** [`useElementSize`](https://reactuse.com/element/useelementsize/) 給 `[width, height]`，[`useMeasure`](https://reactuse.com/element/usemeasure/) 給完整 rect，還需要視口位置就用 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)。
- **SSR 安全**——伺服器端不構造 observer，你的程式碼不需要守衛。

從 [`@reactuses/core`](https://reactuse.com/element/useresizeobserver/) 裡拿走它，讓元件回應它們真正擁有的尺寸。
