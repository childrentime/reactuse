---
title: "React scrollIntoView + useRef：滾動到指定元素 (2026)"
description: "怎麼在 React 裡用 useRef 和 scrollIntoView 滾動到某個元素：正確的基礎寫法，block/inline/behavior 三個參數到底做什麼，為什麼固定頭部的遮擋該用 scroll-margin-top 而不是硬減一個像素值，怎麼滾動到剛剛渲染出來的元素（useEffect vs flushSync vs 回呼 ref），以及原生這一行什麼時候不夠用——沒法控制時長和緩動、沒有可靠的完成回呼、使用者一滾也停不下來。然後是 @reactuses/core 的 useScrollIntoView。TypeScript 優先，SSR 安全。"
slug: react-scrollintoview-useref
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-18
tags: [react, hooks, dom, typescript, tutorial]
keywords: [react scrollintoview, scrollintoview react, react useref scrollintoview, react 滾動到元素, react 滾動到 ref, useScrollIntoView, react 點擊滾動到指定位置, react 滾動到元件, react 平滑滾動, scrollintoview react 示例, react 滾動到 div, react 滾動到第一個錯誤, scroll-margin-top react, react 渲染後滾動到元素, react scrollintoview typescript, react 容器內滾動到元素, react 橫向滾動到元素]
image: /img/og.png
---

# React scrollIntoView + useRef：滾動到指定元素 (2026)

一個很長的表單。使用者點了提交，校驗在往下三屏的某個欄位掛了，錯誤提示渲染在了他根本看不見的地方。修起來只要調一個瀏覽器 API——但**放在哪裡調**、**傳什麼參數**，能耗掉你一個下午。

先給結論，大部分人搜過來就是要這個：

```tsx
import { useRef } from "react";

function Article() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <button onClick={() => sectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
        跳到詳情
      </button>
      {/* … 一大堆內容 … */}
      <div ref={sectionRef}>詳情</div>
    </>
  );
}
```

整個模式就這些：給元素掛個 ref，在事件處理裡調 `.scrollIntoView()`，加 `?.` 是因為 React 提交之前 `sectionRef.current` 一直是 `null`。瀏覽器原生支援，零成本，對這種靜態錨點來說這就是正確答案——別上庫。

這篇講的是剩下的部分：那幾個參數到底做什麼、固定頭部遮擋問題（以及為什麼 CSS 的解法比 JavaScript 的好）、怎麼滾動到**剛剛**渲染出來的東西，還有原生呼叫真正做不到的四件事——到那一步，[`@reactuses/core`](https://reactuse.com) 的 [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) 才配上場。

<!-- truncate -->

## 你手上真正有的參數

`Element.scrollIntoView()` 接一個可選的配置物件，就三個鍵：

| 參數 | 取值 | 預設值 | 作用 |
| --- | --- | --- | --- |
| `block` | `start` · `center` · `end` · `nearest` | `start` | **塊軸**方向的對齊——常規書寫模式下就是垂直方向 |
| `inline` | `start` · `center` · `end` · `nearest` | `nearest` | **行內軸**方向的對齊——水平方向 |
| `behavior` | `auto` · `instant` · `smooth` | `auto` | `auto` 跟隨滾動容器的 CSS `scroll-behavior` |

所以值得背下來的就三種呼叫：

```tsx
el.scrollIntoView();                                        // 頂到頂部
el.scrollIntoView({ behavior: "smooth", block: "center" }); // 平滑滑到中間
el.scrollIntoView({ block: "nearest" });                    // 只在看不見時才移動
```

`block: "nearest"` 是被低估的那個。它只滾動**最小必要距離**把元素帶進視口，元素已經可見時乾脆什麼都不做——這正是列表框鍵盤導航要的效果：每按一次方向鍵就重新居中，會讓列表感覺在跟你較勁。

還有個遺留的布林寫法：`scrollIntoView(true)` 等於 `block: "start"`，`scrollIntoView(false)` 等於 `block: "end"`。到處都還能用，但物件寫法能自解釋。

有個點常讓人意外：`scrollIntoView` 會滾動**所有可滾動的祖先**，不只是最近的那個。如果你的元素在一個可滾動面板裡、面板又在可滾動頁面裡，兩個都會動，最終讓元素露出來。這基本上就是你想要的。

## 固定頭部：用 CSS，別用魔法數字

最高頻的追問：滾到某個標題，結果 64px 的固定頭部正好壓在上面。

第一反應是自己算：

```tsx
// 別這麼寫
const top = el.getBoundingClientRect().top + window.scrollY - 64;
window.scrollTo({ top, behavior: "smooth" });
```

現在這個 `64` 歸你養了。移動端頭部更矮時它是錯的，頭部上方冒出一條促銷 banner 時它是錯的，元素在滾動容器而不是頁面裡時它是錯的——順帶你還放棄了 `scrollIntoView` 處理祖先容器的能力。

平臺就有一個專門幹這事的屬性：

```css
.section {
  scroll-margin-top: 5rem; /* 或者 var(--header-height) */
}
```

`scroll-margin-top` 告訴瀏覽器：**僅在滾動定位時**把這個元素當作多了這麼多外邊距。然後一句樸素的 `el.scrollIntoView({ behavior: "smooth" })` 就會提前 5rem 停住，佈局完全不受影響，而且這個值就寫在它依賴的頭部高度旁邊。它還順手修好了 `:target` 錨點和瀏覽器的頁內查詢定位——這兩個 JavaScript 版本永遠做不到。

優先用 `scroll-margin-top`。每次都是。

## 滾動到剛渲染出來的元素

問題的另一半是時機。你往列表里加一項，想滾過去；展開一個摺疊面板，想露出來；設定了一個錯誤，想跳過去。天真的寫法不管用：

```tsx
// 有 bug：新行還不在 DOM 裡
function addRow() {
  setRows(r => [...r, newRow]);
  lastRowRef.current?.scrollIntoView(); // 還是**舊的**最後一行，或者是 null
}
```

`setRows` 只是排了一次渲染。React 會在之後提交——而在 React 18+ 的併發渲染下，這個"之後"確確實實不在這一個 tick 裡。那行程式碼執行的瞬間，DOM 還是舊的 DOM。

**預設解法是用 effect。** 在加進那一行的提交之後再滾：

```tsx
useEffect(() => {
  lastRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}, [rows.length]);
```

如果你要的是**瞬間**滾動、並且希望它在瀏覽器繪製之前落位，就換成 `useLayoutEffect`——否則使用者會看到一幀停在舊位置，觀感上就是閃一下。平滑滾動則無所謂，動畫反正都要開始。

**"剛建立出來的元素"用回呼 ref 更乾淨。** 不用 effect、不用依賴陣列、也不用維護一個 ref——React 掛上節點的那一刻回呼就觸發：

```tsx
const scrollOnMount = useCallback((node: HTMLElement | null) => {
  node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}, []);

// …
{rows.map((row, i) => (
  <Row key={row.id} ref={i === rows.length - 1 ? scrollOnMount : undefined} />
))}
```

**`flushSync` 是逃生艙，不是預設選項。** 如果你確實必須在改狀態的同一個事件處理裡滾動，可以強制同步提交：

```tsx
import { flushSync } from "react-dom";

flushSync(() => setExpanded(true));
detailsRef.current?.scrollIntoView({ behavior: "smooth" });
```

能用，代價是放棄 React 替你做的批處理和併發排程。在處理函數里偶爾用一次沒問題；一個檔案裡出現三次就是味道不對了。

## 原生呼叫的天花板

對錨點、"滾到錯誤處"、列表鍵盤導航來說，上面這些已經夠了，你可以不用往下讀。原生真正做不到的有四件事：

**1. 控制不了時長和曲線。** `behavior: "smooth"` 具體多快由瀏覽器說了算——Chrome 和 Firefox 不一樣，而且完全沒有旋鈕。如果這個滾動是一段編排好的轉場的一部分、必須和 400ms 的淡入對齊，那你辦不到。

**2. 沒有可靠的"滾完了"回呼。** `scrollend` 事件就是為這個設計的，Chrome/Edge 114、Firefox 109 落地，Safari 更晚一些——依賴它之前先查一下支援度，而且它並不告訴你結束的是**哪一次**程式化滾動。大家退而求其次的那些做法（`setTimeout` 猜一個、輪詢 `scrollY` 直到不變），脆得跟聽起來一樣。

**3. 取消不了。** 開一段長距離平滑滾動，使用者中途抓住滾輪，瀏覽器照樣把他拖到目的地。長頁面上這是最招人煩的滾動 bug，沒有之一，而且沒有 API 能停下它。

**4. 它不管 `prefers-reduced-motion`。** 對於要求減少動效的使用者，瀏覽器並不會統一把 `behavior: "smooth"` 降級——這得你自己來：

```tsx
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
```

寫一次很容易，在另外十一處滾動的地方忘掉也很容易。

## useScrollIntoView

[`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) 自己在 `requestAnimationFrame` 上跑動畫，這四件事就都換回來了：

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
      <button onClick={() => scrollIntoView({ alignment: "center" })}>跳到詳情</button>
      <div style={{ height: "150vh" }} />
      <p ref={targetRef} tabIndex={-1}>詳情</p>
    </>
  );
}
```

`useScrollIntoView(target, options?, scrollContainer?)` 返回 `{ scrollIntoView, cancel }`。它是 SSR 安全的——你不呼叫，它就不碰 DOM——而且 target 可以是 ref、元素，或者一個 getter 函式，你手上有什麼都能用。

配置項全是可選的：

| 參數 | 預設值 | 說明 |
| --- | --- | --- |
| `duration` | `1250` | 毫秒。`0` 表示瞬間跳過去。 |
| `easing` | `easeInOutQuad` | 任意 `0…1` 上的 `(t: number) => number`。 |
| `axis` | `"y"` | 橫向滾動容器用 `"x"`。一個 hook 一個軸。 |
| `offset` | `0` | 離邊緣的額外距離——就是固定頭部的餘量。 |
| `cancelable` | `true` | 滾輪或觸控會中止動畫。 |
| `isList` | `false` | 目標已在視野內就不滾。 |
| `onScrollFinish` | — | 動畫停下時觸發。 |

對齊方式放在呼叫上而不是配置裡，因為它通常每次都不同：`scrollIntoView({ alignment: "start" | "center" | "end" })`。

### cancelable 是你真能感覺到的那個

`cancelable: true`（預設）時，hook 會監聽 `wheel` 和 `touchmove`，一有動靜就把動畫停在當下。使用者飛到一半伸手去夠捲軸，頁面就……讓他滾。對比一下 `behavior: "smooth"`，它能跟使用者較勁整整一秒。

你也可以自己停——比如觸發滾動的那個彈窗被關掉了：

```tsx
const { scrollIntoView, cancel } = useScrollIntoView(targetRef);
useEffect(() => cancel, [cancel]); // 卸載時也會自動取消
```

### 減少動效已經處理好了

hook 內部通過 [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) 讀 `prefers-reduced-motion`。當用戶要求減少動效時，緩動直接坍縮到終值，滾動變成瞬間跳轉——同樣的目的地、同樣會觸發 `onScrollFinish`，只是沒有動畫。這個分支不用你寫。

### 在容器裡滾，以及橫著滾

想動某個具體元素的滾動位置而不是整頁時，把滾動容器作為第三個參數傳進去：

```tsx
const listRef = useRef<HTMLDivElement>(null);
const itemRef = useRef<HTMLLIElement>(null);

const { scrollIntoView } = useScrollIntoView(itemRef, { isList: true }, listRef);
```

不傳第三個參數時，hook 會從目標往上找，挑第一個計算樣式裡 `overflow-x`/`overflow-y` 為 `auto` 或 `scroll` 的祖先，找不到就回退到整頁。這個自動探測大多數時候方便且正確；你確定容器是誰的時候就顯式傳。

輪播就換個軸：

```tsx
const { scrollIntoView } = useScrollIntoView(slideRef, { axis: "x", duration: 400 }, trackRef);
scrollIntoView({ alignment: "center" });
```

### 滾動到第一個校驗失敗的欄位

開頭那個場景，每塊拼圖都放對位置：

```tsx
function CheckoutForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstErrorRef = useRef<HTMLDivElement>(null);

  const { scrollIntoView } = useScrollIntoView(firstErrorRef, {
    offset: 96,          // 讓開固定頭部
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

因為 hook 是在你**呼叫** `scrollIntoView` 的那一刻才去解析目標、而不是在渲染時解析，所以哪怕 `firstErrorRef` 是被 `setErrors` 觸發的那次渲染才掛上的，在同一個處理函數里呼叫它照樣有效。不需要 `flushSync`，也不需要 effect。把焦點轉移放在 `onScrollFinish` 裡而不是立刻執行，能讓讀屏使用者和視力正常的使用者同時抵達。

## 值得知道的坑

- **`offset` 對 `alignment: "center"` 不生效。** 它是從**最近的邊緣**量起的餘量，所以隻影響 `"start"` 和 `"end"`。想把某個東西居中又要避開固定頭部，要麼用 `"start"` 配 offset，要麼接受居中。這一條如果你想當然，它會悄無聲息地什麼都不做。
- **別和 `scroll-behavior: smooth` 一起用。** hook 是靠每幀賦值 `scrollTop`/`scrollLeft` 來做動畫的。如果 CSS 也宣告這個容器要平滑滾動，瀏覽器會試圖給這 ~60 次賦值每一次都做動畫，結果是一坨卡頓。每個容器二選一：要麼 CSS 平滑滾動，要麼這個 hook。
- **一個 hook 只管一個軸。** `axis` 是 `"x"` 或 `"y"`，不能都要。需要斜向移動的網格就用兩個 hook，或者用原生呼叫。
- **自動探測到的滾動父容器會按元素快取。** 某個節點的第一次查詢結果會被記住。如果你的佈局在執行時切換祖先的 `overflow`——比如面板展開後才變得可滾動——那就把容器作為第三個參數傳進去，別靠探測。
- **`cancelable` 管滾輪和觸控，不管鍵盤。** Page Down 和拖捲軸不會中止動畫。它覆蓋的是常見情況，不是全部情況；真在意的話自己在 keydown 裡調 `cancel()`。
- **`isList` 是有方向的。** `isList: true` 時，hook 只在目標位於容器**由 `alignment` 決定的那一側**之外時才移動——已經可見的目標壓根不會產生滾動。這正是它的用意（防止鍵盤導航的列表每敲一次鍵就抖一下），但也意味著 `isList: true` 配錯 alignment 會讓人覺得 hook 在無視你。
- **`duration: 0` 是瞬間跳轉，不是什麼都不做。** 想遵循你自己那個"關閉動畫"設定時很好用，不用去分支判斷該調哪個函式。

## 什麼時候別用這個 hook

原生 `scrollIntoView` 是正解的場合，比你以為的多：

- **靜態錨點或目錄連結** → `el.scrollIntoView({ behavior: "smooth" })` 加 `scroll-margin-top`。沒有依賴，沒有動畫迴圈。
- **列表框的鍵盤導航** → `block: "nearest"` 原生就是最小移動的行為，而且那個場景本來就該是瞬間的手感。
- **需要同時對齊兩個軸** → 原生呼叫同時接 `block` 和 `inline`。
- **你要滾到某個位置而不是某個元素** → `window.scrollTo` / `el.scrollTo`，或者用 [`useScroll`](https://reactuse.com/browser/usescroll/) 讀取和響應滾動位置。
- **你想知道什麼在視野裡，而不是移動過去** → [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/)，目錄裡高亮當前章節也是靠它。
- **你想徹底禁止頁面滾動**（彈窗開啟時）→ [`useScrollLock`](https://reactuse.com/browser/usescrolllock/)。

## 要點

- 基礎寫法就三行：給元素上 `useRef`，處理函數里 `ref.current?.scrollIntoView({ behavior: "smooth" })`，加 `?.` 是因為提交之前 ref 是 `null`。記住 `block: "nearest"`——你用得最多的就是它。
- 固定頭部遮擋用 CSS 的 `scroll-margin-top` 解決，別拿 `getBoundingClientRect()` 減一個寫死的像素值。前者扛得住響應式頭部，還順手修好 `:target` 錨點。
- 要滾動到剛渲染出來的東西，就在按變化取依賴的 effect 裡滾，或者用回呼 ref。`flushSync` 能用，但要放棄批處理——留著當逃生艙。
- 原生平滑滾動沒有時長控制、沒有靠譜的完成事件、不能取消、不處理 `prefers-reduced-motion`。這四條你都不在乎，就別加依賴。
- [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) 補的恰好就是這幾個缺口——可配的 `duration`/`easing`、`onScrollFinish`、滾輪和觸控即時取消、自動的減少動效回退，外加 `offset`、橫向 `axis`、顯式滾動容器，以及讓列表導航不抖的 `isList`。它在呼叫時才解析目標，所以能和渲染出它的那次 `setState` 待在同一個處理函數里。

`useScrollIntoView`、`useScroll`、`useScrollLock`，以及另外 110+ 個 SSR 安全、TypeScript 優先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 裡——裝一次，可 tree-shake，沒有需要你伺候的依賴。

```bash
npm install @reactuses/core
```
