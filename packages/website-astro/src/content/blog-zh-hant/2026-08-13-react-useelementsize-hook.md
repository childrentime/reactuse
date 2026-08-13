---
title: "React useElementSize Hook：用 ResizeObserver 即時追蹤元素寬高 (2026)"
description: "在 React 裡測量 DOM 元素的實用指南：useElementSize 把 ResizeObserver 變成普通 state——即時的 width 和 height，不用手動管理觀察器，也沒有清理時機的坑。涵蓋 box 選項（content-box、border-box、以及讓 canvas 在任何 DPR 下都清晰的 device-pixel-content-box）、容器查詢式元件、響應式圖表，以及什麼時候該換 useMeasure、useElementBounding 或 CSS 容器查詢。TypeScript 優先，SSR 安全。"
slug: react-useelementsize-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-13
tags: [react, hooks, element, typescript, tutorial]
keywords: [useelementsize, react useelementsize, useElementSize hook, react 元素尺寸, react 測量元素, resizeobserver react hook, react resize observer, react 元素寬高, react 容器查詢 hook, 響應式元件 react, react 測量 div, react 圖表自適應, device-pixel-content-box, react canvas 高清]
image: /img/og.png
---

# React useElementSize Hook：用 ResizeObserver 即時追蹤元素寬高 (2026)

媒體查詢只回答一個問題：*視口有多大？* 但你的元件不住在視口裡——它們住在欄、卡片、面板和網格軌道裡。同一個 `<ProductCard>`，在通欄主列裡是 900px 寬，在打開的側邊欄旁邊就只剩 320px——*同一塊螢幕*。而且元素尺寸變化的原因有一打，全都不觸發視窗 `resize` 事件：側邊欄收起、手風琴展開、字體載入完成、flex 兄弟節點出現、內容串流進來。

要追蹤這些，就得用 `ResizeObserver`——瀏覽器專門為此內建的 API——再裹上 React 那套 ref、effect、清理的例行公事。[`@reactuses/core`](https://reactuse.com) 的 [`useElementSize`](https://reactuse.com/element/useelementsize/) 把這一切壓縮成元件直接渲染的兩個數字：`[width, height]`，即時，任意元素。

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

整合到此為止。hook 在掛載時掛上 `ResizeObserver`，而 `ResizeObserver` 在 `observe()` 時會立刻回報一次初始尺寸，所以 `width` 和 `height` 在首次繪製後馬上就有值，不需要另外寫一遍「掛載時測量」。之後的每次尺寸變化——視窗縮放、側邊欄開合、內容回流——都會更新 state。卸載時觀察器自動清理。不用存觀察器的 ref，不會忘寫 `disconnect()`。

## 為什麼不用 window.innerWidth 或媒體查詢？

因為大多數元素尺寸變化和視窗毫無關係：

- 可摺疊側邊欄展開，主列瞬間少了 280px——視口沒動。
- 使用者拖動分欄面板的分隔條。
- 你元素上方的 `<img>` 載入完成，把整列內容擠下去、重新回流。
- 篩選器清空了一行 flex 項目，剩下的被拉伸。
- 一個 CSS transition 用 300ms 動畫改變面板寬度。

視窗級別的工具對這些全都失明。[`useWindowSize`](https://reactuse.com/element/usewindowsize/) 和 [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) 適合*頁面級*版面決策——但一個按視口寬度決定版面的元件，只要有人把它放進寬螢幕上的窄欄裡，立刻穿幫。

這裡必須提一句 CSS 容器查詢：如果你對尺寸的回應是*純樣式*，`@container` 零 JavaScript、零重渲染就能搞定——那就用它。hook 的價值在於你需要把數字拿到 **JS 裡**的那一刻：圖表尺寸、canvas 後備緩衝區、虛擬化計算，或者乾脆渲染一棵不同的元件樹。

## 手寫的方式——以及坑在哪

手寫看起來夠短：

```tsx
// ⚠️ 手寫版——demo 裡能跑，應用裡漏 bug
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

十行程式碼藏著三個問題：

1. **晚掛載的目標永遠不會被觀察。** 那句 `if (!ref.current) return` 守衛只在掛載時跑一次。如果元素是條件渲染的——藏在載入狀態、tab、彈窗後面——effect 早就 return 了，什麼都掛不上。你需要 effect 在*元素*出現時重跑，而空依賴陣列表達不了這件事。
2. **options 的參考身分陷阱。** 想要 `{ box: "border-box" }`？這個物件字面量每次渲染都是新的。放進 effect 依賴陣列，觀察器每次渲染都拆了重建；不放，lint 規則報警，或者日後一次改動悄悄讓它過期。
3. **你讀錯了 box。** `contentRect` 是為相容性保留的舊欄位。現代欄位——`borderBoxSize`、`contentBoxSize`、`devicePixelContentBoxSize`——都是*陣列*（元素在多欄版面裡會分片），挑對再求和的程式碼比觀察器本身還多。

`useElementSize` 把三個坑全吸收掉：條件渲染的元素傳惰性 getter（`() => document.querySelector(".panel")`），hook 每次渲染重新解析，元素一出現就掛上觀察；options 內部做深比較（行內字面量隨便寫）；box 的選擇——包括分片求和——完全按規範處理。

## useElementSize API

```tsx
const [width, height] = useElementSize(target, options?);
```

**`target`** 很靈活——手上有什麼傳什麼：

```tsx
useElementSize(ref);                                    // ref 物件
useElementSize(document.getElementById("hero"));        // 元素本身
useElementSize(() => document.querySelector(".panel")); // 惰性 getter
```

**`options`** 就是標準的 `ResizeObserverOptions`——一個欄位 `box`，三個取值。而且 hook 內部對 options 做深比較，`useElementSize(ref, { box: "border-box" })` 直接寫行內字面量*不會*讓觀察器每次渲染都翻新。

### 該測量哪個 box？

- **`content-box`**（預設）——只算內容區：不含 padding 和 border。回答的是「我的*內容*有多少空間」，適合給子元素排版、圖表、分欄計算。
- **`border-box`**——包含 padding 和 border；對應 `offsetWidth`/`offsetHeight`，也就是元素在版面中實際佔的位置。需要和兄弟節點或浮層對齊時用它。
- **`device-pixel-content-box`**——以**實體裝置像素**計的內容盒。這個很特殊。

### canvas 高清渲染的訣竅

`<canvas>` 的後備緩衝區和實體像素尺寸對不上，在 2 倍螢幕上就是糊的。民間偏方——CSS 像素乘 `devicePixelRatio`——在瀏覽器縮放和小數 DPR 下會取整出錯。`device-pixel-content-box` 直接把合成器用的那個整數交給你：

```tsx
function SharpCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [width, height] = useElementSize(ref, {
    box: "device-pixel-content-box",
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !width) return;
    canvas.width = width;   // 實體像素——任何 DPR、任何縮放都逐像素精確
    canvas.height = height;
    draw(canvas.getContext("2d")!);
  }, [width, height]);

  return <canvas ref={ref} style={{ width: "100%", height: 300 }} />;
}
```

（Safari 還不支援 `device-pixel-content-box`——那裡 hook 會回退到 `contentRect`，所以要優雅降級，別假設到處都拿得到實體像素。）

## 實戰模式

### 容器查詢式元件——斷點跟著元素走，不跟螢幕

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

把這張卡片丟進側邊欄、彈窗或通欄清單，它都根據*自己的*空間自適應——不用從某個恰好知道上下文的祖先一路把 `variant` prop 鑽下來。再強調一次：如果差異只是 CSS，`@container` 更便宜。這個模式是給*元件樹*需要變化的場景。

### 靜止後才重排的響應式圖表

圖表函式庫要的是像素數字，而使用者拖分隔條的時候每秒重算 60 次圖表版面純屬浪費。讓 CSS 負責視覺上的拉伸，真正的重排交給 [`useDebounce`](https://reactuse.com/state/usedebounce/) 收尾：

```tsx
const ref = useRef<HTMLDivElement>(null);
const [rawWidth, rawHeight] = useElementSize(ref);
const width = useDebounce(rawWidth, 150);
const height = useDebounce(rawHeight, 150);

// <ExpensiveChart width={width} height={height} />
// 在拖動停止後重排一次，而不是拖動的每一幀都排。
```

### 能放下幾欄？

CSS 算不了的網格數學——因為答案要餵給 `props`，不是樣式：

```tsx
const [width] = useElementSize(ref);
const columns = Math.max(1, Math.floor(width / 280));

return <VirtualGrid columns={columns} items={items} />;
```

## useElementSize 和它的兄弟們

`@reactuses/core` 有一小家族建立在同一個觀察器核心上的測量 hook——按你要拿回什麼來選：

| Hook | 回傳 | 什麼時候用 |
| --- | --- | --- |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | `[width, height]` | 只要尺寸，別的都不要 |
| [`useMeasure`](https://reactuse.com/element/usemeasure/) | 完整 `contentRect`（`x/y/top/left/…`）+ `stop()` | 要整個矩形，或要隨時停止觀察 |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | 即時 `getBoundingClientRect`——捲動*和*縮放都更新 | 要知道它在視口裡的*位置*，不只是大小 |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | 原始 entries 交給你的回呼 | 要副作用而不是 state；每次 resize 做命令式操作 |
| [`useWindowSize`](https://reactuse.com/element/usewindowsize/) | 視口 `width/height` | 頁面級版面，不是元素級 |

經驗法則：尺寸用 `useElementSize`，位置（tooltip、popover、捲動連動效果）用 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)，想跑程式碼而不是存 state 用 [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/)。

## 生產環境備忘

- **SSR 已處理。** 伺服器上沒有 DOM，hook 渲染 `[0, 0]`，hydration 後才掛觀察器——你的程式碼裡不需要 `typeof window` 守衛。要為零值幀做打算：用 `if (!width) return <Skeleton />` 把昂貴的子元件攔住，別讓圖表在 0×0 下排版。
- **第一個真實值來自觀察器的初始回報**——掛載後緊跟一次額外渲染。這是正確性的代價，別跟它較勁。
- **小心自參考迴圈。** 如果你*根據*測到的寬度渲染的內容反過來改變了元素自己的寬度，你就造了個 resize 回饋環（主控台裡的 `ResizeObserver loop completed with undelivered notifications`）。解法：測量一個尺寸不受你影響的父元素，或者把衍生值做鉗制。
- **分片版面會正確求和。** 在多欄或分頁上下文裡元素的盒子會分片；hook 按規範把各片的 `inlineSize`/`blockSize` 求和，而不是只讀第一片。
- **每次 hook 呼叫就是一個觀察器。** 給 500 個虛擬化列各測一次就是 500 個觀察器——到這個量級，降級為容器上的單個 [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/)，或者只觀察一個原型列。

## 重點回顧

- 元素尺寸 ≠ 視窗尺寸。側邊欄、分欄面板、串流內容、字體載入都會在不碰視口的情況下改變元素大小——只有 `ResizeObserver` 看得見，而 [`useElementSize`](https://reactuse.com/element/useelementsize/) 把它端上來變成普通的 `[width, height]` state。
- `box` 選項決定測什麼：`content-box` 做內容計算（預設），`border-box` 看版面佔位，`device-pixel-content-box` 讓 canvas 在任何 DPR、任何縮放下逐像素清晰。
- target 可以是 ref、元素或惰性 getter——條件渲染的元素用 getter；行內 options 因為深比較不會翻新觀察器——手寫版必踩的坑，提前都填了。
- 對尺寸的回應是純 CSS？用 `@container` 查詢。hook 是給數字要驅動 JavaScript 的場景：圖表、canvas、虛擬化、切換元件樹。
- 還要位置？那是 [`useElementBounding`](https://reactuse.com/element/useelementbounding/)。要完整矩形加手動停止？[`useMeasure`](https://reactuse.com/element/usemeasure/)。要原始 entries？[`useResizeObserver`](https://reactuse.com/element/useresizeobserver/)。

`useElementSize` 和其它 110+ 個 SSR 安全、TypeScript 優先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 裡——裝一次，可搖樹，沒有需要伺候的依賴。

```bash
npm install @reactuses/core
```
