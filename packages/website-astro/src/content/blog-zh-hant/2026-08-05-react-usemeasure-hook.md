---
title: "React useMeasure Hook：用 ResizeObserver 測量 DOM 元素 (2026)"
description: "useMeasure 實用指南：用 ResizeObserver 即時追蹤元素的寬度、高度和位置——一個 Hook，零手動 observer 設定。涵蓋 contentRect 的陷阱、useMeasure 與 useElementSize / useElementBounding 的對比、從 react-use-measure 遷移，以及 SSR 安全性。TypeScript 優先。"
slug: react-usemeasure-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-05
tags: [react, hooks, element, typescript, tutorial]
keywords: [react useMeasure, usemeasure, useMeasure hook, react-use-measure, react 測量元素, react 元素尺寸 hook, react resizeobserver hook, react 測量 div 寬高, usemeasure react, react 元件尺寸, react getboundingclientrect hook]
image: /img/og.png
---

# React useMeasure Hook：用 ResizeObserver 測量 DOM 元素 (2026)

每個 React 應用早晚都需要知道某個元素有多大。圖表要先拿到容器的像素寬度才能繪製；虛擬列表需要行高；自動增高的 textarea、文字截斷偵測器、根據*自身*（而非視口）寬度切換佈局的元件——它們都需要即時的元素尺寸，而 React 本身並不提供。於是你在 effect 裡呼叫 `getBoundingClientRect()`，發現它只執行一次；再給 `window` 加個 `resize` 監聽，又發現元素還會因為兄弟節點折疊、字體載入、內容變化而改變尺寸——這些全都不會觸發 window 的 resize 事件。

正確的底層原語是 `ResizeObserver`，而 [`useMeasure`](https://reactuse.com/element/usemeasure/)（來自 [`@reactuses/core`](https://reactuse.com)）把這個原語封裝成了一行程式碼：傳入一個 ref，拿到一個即時更新的 rect。不用建構 observer，不用記得 disconnect，沒有閉包過期的陷阱。本文介紹它的 API、幾乎人人都會踩的 `contentRect` 陷阱、內部實作原理、與同族 Hook（`useElementSize`、`useElementBounding`、`useResizeObserver`）的對比，以及從 `react-use-measure` 遷移。TypeScript 優先。

<!-- truncate -->

## 最簡單的場景：即時感知尺寸的容器

```tsx
import { useRef } from 'react';
import { useMeasure } from '@reactuses/core';

function Chart() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect] = useMeasure(ref);

  return (
    <div ref={ref} style={{ width: '100%', height: '400px' }}>
      <svg width={rect.width} height={rect.height}>
        {/* 用真實像素尺寸繪製 */}
      </svg>
    </div>
  );
}
```

這就是完整的模式：元素上掛一個 ref，呼叫 `useMeasure(ref)`，每當元素的內容盒尺寸變化——視窗縮放、flex 重排、側邊欄開合、字體替換，任何原因——元件都會用新的 `rect` 重新渲染。你完全不用碰 `ResizeObserver`，也不需要清理邏輯；元件卸載時 observer 自動斷開。

## 完整 API

```ts
const [rect, stop] = useMeasure(target, options?);
```

**`target`** 接受 `@reactuses/core` 所有元素類 Hook 通用的幾種形式：

```tsx
useMeasure(ref);                          // React ref 物件
useMeasure(document.querySelector('#el')); // 原生 Element
useMeasure(() => document.body);           // 回傳元素的函式
```

**`options`** 是標準的 [`ResizeObserverOptions`](https://developer.mozilla.org/zh-TW/docs/Web/API/ResizeObserver/observe#options) 物件——`{ box: 'content-box' | 'border-box' | 'device-pixel-content-box' }`——控制以哪個盒模型觸發觀察。

**`rect`** 是一個 `UseMeasureRect`：

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

在第一次觀察觸發之前（包括 SSR 期間），所有欄位都是 `0`。

**`stop`** 用於斷開 observer。當你已經拿到需要的測量值、不想再因尺寸變化觸發重新渲染時呼叫它——比如為動畫捕獲初始佈局之後：

```tsx
const [rect, stop] = useMeasure(ref);

useEffect(() => {
  if (rect.width > 0) {
    startEnterAnimation(rect);
    stop(); // 測一次就夠了
  }
}, [rect, stop]);
```

## contentRect 的陷阱：top/left 不是視口座標

這是所有基於 ResizeObserver 的測量 Hook 最常見的困惑，先把它講清楚。rect 來自 `entry.contentRect`，而 `contentRect` 是相對於**元素自身盒子**的，不是相對於視口：

- `width` / `height`——**內容盒**尺寸：不含 padding、border 和捲軸。
- `top` / `left`（以及 `x` / `y`）——內容盒相對於元素邊框盒的偏移。實際上就是**你的 `padding-top` 和 `padding-left`**，不是元素在頁面上的位置。

所以一個 `padding: 16px`、距頁面頂部 300px 的元素，`useMeasure` 回報的是 `top: 16`，不是 `top: 300`。如果你真正想要的是*元素在螢幕上的位置*——定位 tooltip、下拉選單、聚光燈遮罩——你需要的是 `getBoundingClientRect()` 語義，那是另一個 Hook：[`useElementBounding`](https://reactuse.com/element/useelementbounding/)，它回傳視口相對座標，還會在捲動時更新。

一句話記住：**`useMeasure` 回答「它有多大」；`useElementBounding` 回答「它在哪裡」。**

## 內部實作

`useMeasure` 是庫內 [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) 之上的一層薄封裝：

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

有意思的機制在 `useResizeObserver` 裡：

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

三個值得注意的細節：

1. **[`useLatest`](https://reactuse.com/state/uselatest/) 包裹回呼**——你可以傳內聯箭頭函式，而不會導致每次渲染都銷毀重建 observer。observer 只建構一次；ref 始終指向最新的回呼。

2. **[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 守護 options 物件**——`useMeasure(ref, { box: 'border-box' })` 每次渲染都會傳入一個新的物件字面量。如果用普通的 `useEffect` 加 `[options]` 依賴，observer 每次渲染都會斷開重連。深比較保證只有 options 的*值*真正變化時才重建 observer。

3. **observer 在 effect 內建立**——effect 不在伺服器端執行，所以 `new ResizeObserver(...)` 在 SSR 期間永遠不會執行。這個 Hook 天生 SSR 安全：伺服器端用全 0 的 rect 渲染，客戶端以相同內容水合，首次觀察在掛載後觸發。

第三點也解釋了初始渲染的 `{ width: 0, height: 0 }`。在 0 會破壞計算的地方要加保護：

```tsx
const [rect] = useMeasure(ref);

return (
  <div ref={ref}>
    {rect.width > 0 && <Chart width={rect.width} height={rect.height} />}
  </div>
);
```

## useMeasure vs useElementSize vs useElementBounding vs useResizeObserver

`@reactuses/core` 在這個領域提供了四個 Hook。它們是分層關係，不是重複：

| | [`useMeasure`](https://reactuse.com/element/usemeasure/) | [`useElementSize`](https://reactuse.com/element/useelementsize/) | [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) |
|---|---|---|---|---|
| **回傳值** | `[rect, stop]`——完整 8 欄位 rect | `[width, height]` | `{ x, y, top, left, ... }` 視口相對 | `stop`（原始 entries 走回呼） |
| **資料來源** | `contentRect` | `contentBoxSize` / `borderBoxSize` | `getBoundingClientRect()` | 原始 `ResizeObserverEntry[]` |
| **座標系** | 元素相對（padding 偏移） | ——（只有尺寸） | **視口相對** | 你自己從 entries 裡讀 |
| **捲動時更新** | 否 | 否 | **是**（監聽 window scroll + resize） | 否 |
| **box 選項** | 僅影響觀察觸發 | **測量值跟隨 `box`** | —— | 僅影響觀察觸發 |
| **適用場景** | 尺寸 + 停止開關 | 只要寬高，重新渲染最少 | tooltip、popover、遮罩——定位 | 自訂邏輯；多元素；不想觸發狀態更新 |

有兩處區別值得單獨說：

- **`useElementSize` 的測量值遵循 `box` 選項。** 傳 `{ box: 'border-box' }` 時它回報 `borderBoxSize`——包含 padding 和 border——這通常才是「這個元素有多大」的直覺含義。`useMeasure` 無論用哪個盒觸發觀察，回報的始終是內容盒，因為 ResizeObserver entry 裡唯一的 rect 就是 `contentRect`。
- **`useElementBounding` 是唯一在捲動時追蹤位置的。** 它同時用 ResizeObserver 觀察*並*監聽 window 的 `scroll` / `resize`（passive），每次都重新計算 `getBoundingClientRect()`。開銷更大，但對任何錨定螢幕位置的場景來說是正確選擇。

如果你只需要視口尺寸，根本不用觀察元素——直接用 [`useWindowSize`](https://reactuse.com/element/usewindowsize/)。

## 實戰模式

### 容器查詢風格的響應式元件

媒體查詢響應的是視口；元件活在容器裡。同一張卡片放在寬主欄和窄側欄裡，即使螢幕相同也應該有不同佈局：

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

元件適配的是它*被分配到*的空間，無論掛載在哪裡。（CSS 容器查詢解決了樣式那一半；`useMeasure` 解決的是 JavaScript 需要拿到數字的那一半——圖表比例尺、虛擬化計算、條件渲染。）

### 填滿父容器的 Canvas / SVG

Canvas 和 SVG 需要顯式像素尺寸。把它們綁定到測量出的父容器上，變化時重繪：

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

任何佈局變化——面板縮放、側邊欄折疊、橫豎屏切換——都會以正確解析度重繪 canvas。不需要 `window.resize` 監聽器，而後者完全捕獲不到面板縮放和側邊欄這類場景。

### 自動高度動畫（先測量，再動畫）

CSS 無法對 `height: auto` 做過渡。先測出內容高度，再向這個數字過渡：

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

因為測量是即時的，即使面板展開時內容發生變化——圖片載入完成、巢狀區塊展開——高度依然正確。一次性的 `getBoundingClientRect()` 快照在內容變動的那一刻就過期了。

### 文字截斷偵測

只在文字真正溢出時顯示「展開更多」：

```tsx
function Excerpt({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [rect] = useMeasure(ref);
  const truncated =
    ref.current != null && ref.current.scrollHeight > Math.ceil(rect.height);

  return (
    <>
      <p ref={ref} className="clamp-3">{text}</p>
      {truncated && <button>展開更多</button>}
    </>
  );
}
```

`rect.height` 是可見（被 clamp 的）內容高度，`scrollHeight` 是完整內容高度；兩者比較即可偵測溢出——而且隨著容器尺寸變化持續偵測，截斷狀態翻轉的時機恰恰就是容器變化時。

## 從 react-use-measure 遷移

如果你用過 [pmndrs 的 `react-use-measure`](https://github.com/pmndrs/react-use-measure)，心智模型可以直接遷移——但有幾處差異：

```tsx
// react-use-measure —— Hook 替你建立 ref
const [ref, bounds] = useMeasure();
<div ref={ref} />

// @reactuses/core —— ref 歸你所有（也可以傳元素或函式）
const ref = useRef<HTMLDivElement>(null);
const [rect, stop] = useMeasure(ref);
<div ref={ref} />
```

- **ref 歸屬**：`react-use-measure` 回傳回呼 ref；`@reactuses/core` 接受*你的* ref、原生元素或 getter 函式。ref 歸自己所有意味著可以和其他 Hook（[`useClickOutside`](https://reactuse.com/element/useclickoutside/)、[`useHover`](https://reactuse.com/state/usehover/)）共享同一個元素，無需 ref 合併工具。
- **座標系**：`react-use-measure` 回報視口相對邊界（有可選的 scroll 選項）；`@reactuses/core` 的 `useMeasure` 回報 `contentRect`。想要視口相對 + 捲動追蹤，用 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)——那才是真正的等價物。
- **防抖**：`react-use-measure` 有 `debounce` 選項。這裡用組合替代：需要限流下游計算時，把 rect 傳給 [`useDebounce`](https://reactuse.com/state/usedebounce/)。
- **停止開關**：只有 `@reactuses/core` 提供 `stop`——拿到需要的資料後乾淨地結束觀察。
- **一個庫，100+ Hooks**：你引入的是完整的 [Hook 集合](https://reactuse.com)，而不是一個單一用途的依賴。

## 要點回顧

- **[`useMeasure`](https://reactuse.com/element/usemeasure/) 一行程式碼給你即時元素 rect**——底層是 ResizeObserver，零 observer 管理，自動清理。
- **它測量的是內容盒，座標是元素相對的。** `top`/`left` 是 padding 偏移，不是頁面位置。要視口座標和捲動追蹤用 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)；要 border-box 尺寸用 [`useElementSize`](https://reactuse.com/element/useelementsize/) 加 `{ box: 'border-box' }`。
- **首次渲染全是 0**——伺服器端和首次觀察前都是。在 0 會破壞計算的地方加 `rect.width > 0` 保護。
- **內聯回呼和新建的 options 物件都安全**——內部的 `useLatest` 和 `useDeepCompareEffect` 防止 observer 反覆重建。
- **`stop` 按需結束觀察**——為動畫測一次，然後不再為重新渲染買單。
- **天生 SSR 安全**——observer 在 effect 裡建立，而 effect 永遠不在伺服器端執行。

從 [`@reactuses/core`](https://reactuse.com/element/usemeasure/) 獲取它，別再手寫 ResizeObserver 樣板程式碼了。
