---
title: "React Observer Hooks：7 種監聽 DOM 而不寫樣板程式碼的方式"
description: "ReactUse 中 useIntersectionObserver、useMutationObserver、useResizeObserver、useElementBounding、useElementSize、useElementVisibility 和 useMeasure 的實用指南——什麼時候選哪個 observer、各自的開銷、以及它們如何取代幾十行命令式 DOM 膠水程式碼。"
slug: react-observer-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-13
tags: [react, hooks, dom, performance, tutorial]
keywords: [react observer hooks, useIntersectionObserver, useResizeObserver, useMutationObserver, useElementBounding, useElementSize, useElementVisibility, useMeasure, react dom observer, react lazy load, react sticky header, react virtual scroll]
image: /img/og.png
---

# React Observer Hooks：7 種監聽 DOM 而不寫樣板程式碼的方式

DOM 不會主動告訴 React 它變了。React 只掌控資料流的一個方向——state 進來，markup 出去——回程的路上基本是瞎的。如果第三方腳本插入了一個 banner、字型載入完成把版面往下推了 8 像素、使用者調整了視窗大小或把一張卡片捲動進視口，React 根本不知道，除非你主動告訴它。瀏覽器為此提供了 4 個 `*Observer` API,再加上一次性讀取用的 `getBoundingClientRect` 家族,它們幾乎涵蓋了真實應用裡所有「對 DOM 做出反應」的需求。

<!-- truncate -->

麻煩在於:把 observer 接進 React 元件是個小型沼澤——`useEffect`、`useRef`、清理函式、SSR 守衛,還有那個臭名昭著的「observer 在掛載前就觸發」的競態。五行 API 變成三十行膠水,而且膠水程式碼在元件之間幾乎一模一樣——於是被複製貼上、每次都稍微改一點,悄悄地累積 bug。[ReactUse](https://reactuse.com) 提供了 7 個聚焦的 hook,把膠水藏起來,把你真正想要的 API 表面還給你。

這篇文章會逐個介紹這 7 個 hook:各自觀察什麼、什麼時候選哪個、如果你手寫一遍會寫成什麼樣。

## 1. useIntersectionObserver——「這個元素在螢幕裡嗎?」

`IntersectionObserver` 是現代延遲載入的主力。它會在目標元素相對於視口(或捲動容器)越過某個閾值時回報,完全不需要老式 `scroll` 監聽器那種連續觸發的開銷。延遲載入圖片、無限捲動觸發器、用於埋點的「已瀏覽」追蹤、進入視口時的淡入——都建在它之上。

### 手寫版

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

能跑,於是你需要第二個延遲載入區塊時就複製一份。到第五個元件你已經有五份微妙不同的 observer——三個用了錯的 `threshold`,一個因為有人重構清理函式而漏了記憶體。形狀是對的,重複是不對的。

### ReactUse 版

[`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) 接收 ref 和選項,回傳元素當前是否相交:

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

Hook 自己管理 observer 的生命週期:卸載時 disconnect、選項變化時重建、SSR 安全。延遲載入圖片、第一次進入視口時埋點、把一個重量級圖表延遲到捲動進來再掛載——都是同一個 hook,不同的布林值。

一個常見模式是無限捲動的「載入更多」觸發器:在列表底部放一個哨兵 `<div>`,它進入視口時發起 fetch。這其實正是 [`useInfiniteScroll`](https://reactuse.com/browser/useInfiniteScroll/) 的實作方式,它就建在這個原語之上。

## 2. useElementVisibility——通常你想要的那個布林值

很多時候你根本不在乎 `IntersectionObserverEntry`——你只要一個布林值,而且是相對於整個視口的,不是某個捲動容器。[`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) 就是做這個的。

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

用它做捲動淡入、「已瀏覽」埋點、「影片捲出螢幕時暫停」。如果需要更細粒度的控制——自訂 root、小於 1 的閾值、多閾值——再降級到 `useIntersectionObserver`。

## 3. useResizeObserver——追蹤尺寸的正確方式

差不多十年來,「在 React 裡追蹤元素尺寸」意味著掛一個 `window.resize` 監聽器,每次事件都重新讀 `clientWidth`。這漏掉了最常見的情況——元素因為父層變化、相鄰元素摺疊、或下方 flex 項變大而被動 resize。`ResizeObserver` 不管原因,只要被觀察的元素尺寸變了就觸發。

### 手寫版

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

隱藏成本:每次 entry 更新都會呼叫 `setState`,從而觸發渲染。快速拖動父元素,被觀察的元件每秒能 rerender 60 次。大多數時候沒問題,但如果這個 state 被一棵昂貴的子樹消費,你就得節流更新,或者把它寫進 ref 而不是 state。

### ReactUse 版

[`useResizeObserver`](https://reactuse.com/element/useResizeObserver/) 接收 ref 和一個對每個 entry 觸發的回呼:

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

這就是 15 行程式碼實作的容器查詢:卡片根據自己的寬度(不是視口寬度)在窄版面和寬版面之間切換。把兩個並排放在一個 flex 行裡,它們各自獨立選自己的版面。

## 4. useElementSize 與 useMeasure——尺寸的兩種口味

如果你只需要寬高,回呼形式有點過度。ReactUse 提供了兩個包裝 `ResizeObserver` 並直接回傳 state 的便利 hook。

[`useElementSize`](https://reactuse.com/element/useElementSize/) 回傳被觀察元素的 `{ width, height }`:

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

容器每次 resize,grid 重新計算欄數——不需要媒體查詢、不需要猜視口、也不需要 JS 控制的 CSS 變數。

[`useMeasure`](https://reactuse.com/element/useMeasure/) 回傳完整的 `ResizeObserverEntry.contentRect`(`width`、`height`、`top`、`left` 等),外加一個 ref 用來附著。當你一次呼叫就想拿到尺寸和局部座標時用它:

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

`useElementSize` 和 `useMeasure` 的差別主要是人因工學——挑那個回傳值形狀已經符合你元件需要的那個。

## 5. useElementBounding——位置加尺寸,同步更新

`useElementBounding` 是在每次 scroll 和 resize 時呼叫 `el.getBoundingClientRect()` 的響應式等價物。它回傳 `top`、`right`、`bottom`、`left`、`width`、`height`、`x`、`y`——完整的矩形——只要元素由於任何原因移動或調整大小就重新觸發。

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

一個 `position: sticky` 的頁首捲到視口頂端時,它的 `top` 變成 0;hook 捕捉到這個變化,給頁首加陰影。同樣的模式適用於:浮動操作按鈕在離開初始位置後改變外觀,或者需要在版面變化時持續追蹤錨點的 popover。

`useElementBounding` 與 `useMeasure` 的差別:bounding 是相對視口的矩形(捲動會改變它),measure 是元素自身的內容矩形(捲動不會改變)。關心位置選 bounding,關心尺寸選 measure。

## 6. useMutationObserver——當 DOM 在你周圍變化時

`MutationObserver` 是 4 個 observer API 裡最重的一個,也是合法用例最窄的一個。它在目標元素的屬性、子節點或文字內容變化時觸發。在一個 React 優先的應用裡你幾乎從不需要它——React 擁有這些變更,所以 React 當然知道。你需要 `useMutationObserver` 是當 **React 以外**的東西在改 DOM 時:

- 第三方元件(Stripe Elements、嵌入的影片播放器、聊天氣泡)往一個槽位裡塞內容。
- 使用者在編輯一個 `contentEditable` 元素,你想在不輪詢的情況下回應文字變化。
- 某個腳本在你控制不到的元素上切換 `aria-expanded` 或 `data-state`,你想把它鏡像到 React state。

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

Skeleton 一直渲染,直到第三方腳本把內容放進槽位,然後消失。沒有 `MutationObserver` 時,你的選項是 `setInterval` 輪詢,或者 `MutationObserver` 加手寫生命週期——前者浪費,後者正是這個 hook 幫你省掉的。

一個常見陷阱:`MutationObserver` 很快但不是免費的,在繁忙元素上一個未限定範圍的子樹觀察者每秒可能觸發幾十次。永遠傳你能給的最窄選項——如果你只關心 `childList`,就別開 `attributes: true`。

## 7. 怎麼選

7 個 hook 有重疊,重疊是故意的——不同形狀適合不同消費者。速查表:

| 你想要…… | Hook |
| --- | --- |
| 表示「在不在螢幕上」的布林值 | [`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) |
| 自訂 root 或閾值的可見性 | [`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) |
| 以 state 形式拿到寬高 | [`useElementSize`](https://reactuse.com/element/useElementSize/) |
| 以 state 形式拿到完整內容矩形 | [`useMeasure`](https://reactuse.com/element/useMeasure/) |
| 相對視口的矩形(捲動會變) | [`useElementBounding`](https://reactuse.com/element/useElementBounding/) |
| 每次 resize entry 的回呼 | [`useResizeObserver`](https://reactuse.com/element/useResizeObserver/) |
| 回應 React 以外的 DOM 變化 | [`useMutationObserver`](https://reactuse.com/element/useMutationObserver/) |

一個有用的心智模型:visibility 類 hook 告訴你元素**相對使用者在哪**;size 和 bounding 類告訴你元素**有多大**、**在版面裡的什麼位置**;mutation 告訴你元素**裡面發生了什麼**。

## 實戰範例:一個會自動適應的延遲載入卡片

把其中 4 個拼起來——一張卡片在捲動進入後才掛載昂貴的圖表、根據自己的寬度選版面、並把 tooltip 定位在自己上方:

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

圖表只有在進入視口後才建構。卡片根據自己的寬度切換版面,而不是頁面寬度。Tooltip 透過追蹤卡片的 bounding 矩形漂浮在卡片上方,所以在捲動和版面抖動中都能保持錨定。三個 hook、二十行膠水程式碼、零個 `useEffect` 區塊、零個 `addEventListener`/`removeEventListener` 對。

## 效能須知

Observer 不是免費的,但開銷集中且可控:

- **每個元素一個 observer 沒問題;千行列表每行一個 observer 不行。** 列表虛擬化時,給捲動容器觀察一次,在回呼裡解析哪一行可見。瀏覽器有時會合併多個 `IntersectionObserver` 目標,但一個長列表裡每行一個 observer 依然傷效能。
- **`useResizeObserver` 回呼跑在獨立任務裡。** 在回呼裡讀版面(`getBoundingClientRect`、`offsetWidth`)很便宜;寫版面也可以,但要注意寫操作可能再次觸發 resize entry。用防抖或者把寫操作放進 `requestAnimationFrame` 來防止回饋迴圈。
- **`MutationObserver` 是 4 個裡最貴的**,特別是搭配 `subtree: true`。範圍盡量收窄。如果你發現自己在觀察一棵大子樹,考慮一下讓嵌入程式碼自己拋出一個「第三方就緒」事件是不是更便宜。

## 總結

Observer API 是連接「React 知道什麼」和「DOM 實際在做什麼」的橋樑。用裸 `useEffect` 接它們會累積很多膠水和一長串微妙 bug。用這 7 個 hook 接它們,它們就變成可以自由組合的一行呼叫。

- 用 [`useIntersectionObserver`](https://reactuse.com/element/useIntersectionObserver/) 和 [`useElementVisibility`](https://reactuse.com/element/useElementVisibility/) 回答「是否在螢幕上」。
- 用 [`useResizeObserver`](https://reactuse.com/element/useResizeObserver/)、[`useElementSize`](https://reactuse.com/element/useElementSize/) 和 [`useMeasure`](https://reactuse.com/element/useMeasure/) 回答「它有多大」。
- 用 [`useElementBounding`](https://reactuse.com/element/useElementBounding/) 回答「它在視口的什麼位置」。
- 用 [`useMutationObserver`](https://reactuse.com/element/useMutationObserver/) 回答「DOM 在我背後做了什麼」。

更多 hook 在 [reactuse.com](https://reactuse.com)——如果你用其中一個取代掉一段笨重的 `useEffect` 加 observer 舞蹈,那今天鍵盤沒白敲。
