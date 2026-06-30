---
title: "React useIntersectionObserver Hook：懶載入與可見性偵測（2026）"
description: "一篇實用的 useIntersectionObserver 上手指南：偵測元素何時進入視口、懶載入圖片、做「每次瀏覽只上報一次」的埋點、搭建無限捲動觸發器——而不用 scroll 監聽器的瘋狂抖動，也不會帶上手寫版本必然出現的卸載洩漏 bug。SSR 安全、TypeScript 優先。"
slug: react-useintersectionobserver-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-30
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useIntersectionObserver, useIntersectionObserver hook, react 交叉觀察器, react 偵測元素可見, react 圖片懶載入, react 元素進入視口, react 元素是否在螢幕上, intersection observer react, react 捲動偵測, useIntersectionObserver typescript, ssr 安全 intersection observer, react 無限捲動觸發, react 捲動淡入]
image: /img/og.png
---

# React useIntersectionObserver Hook：懶載入與可見性偵測（2026）

你想等一張圖片快捲進視口時再載入它。或者在一張卡片**真正被看到**的第一時間上報一個埋點。又或者當使用者捲到清單底部時觸發「載入更多」。這些其實是同一個問題——*這個元素進入螢幕了嗎？*——而多年來的答案，是一個一秒鐘觸發上百次的 `scroll` 監聽器，每次都重新讀一遍 `getBoundingClientRect()`，卻還是會漏掉各種邊界情況。

`IntersectionObserver` 就是正確回答這個問題的瀏覽器 API：非同步、批次、跑在主執行緒之外。`useIntersectionObserver` 則是把它接進 React 的 hook——不用 `useEffect`/`useRef`/清理那一堆樣板，也不會帶上手寫版本必然出現的卸載洩漏和過期閉包 bug。本文講清楚真實的 [`@reactuses/core`](https://reactuse.com) API、你真正會用到的三種模式，以及怎麼調 `threshold`、`rootMargin` 和 `root`。SSR 安全、帶型別。

<!-- truncate -->

## 為什麼不直接用 scroll 監聽器？

以前判斷一個元素是否可見的寫法是這樣的：監聽 `scroll`，每次事件裡把元素和視口量一遍。

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

這裡天生帶著兩個問題。第一，`scroll` 跑在主執行緒上，一秒鐘觸發幾十次，而 `getBoundingClientRect()` 每次都會強制一次同步排版——這恰好是捲動卡頓的標準配方。第二，它只能抓到穿過*視口*的元素；一旦你的捲動發生在某個容器裡，你就得手動重新推導幾何關係。

`IntersectionObserver` 把這個模型反了過來。你把一個目標和一個閾值交給瀏覽器，由*它*來非同步、批次、在捲動路徑之外告訴你——元素什麼時候越過了那個閾值。不用測量，不用監聽器抖動。剩下唯一會寫錯的，就是它周圍的 React 生命週期，而那部分正是這個 hook 替你管的。

下面是元件內最直覺的寫法，它帶著每個手寫 observer 都有的那三個 bug：

```tsx
function LazySection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSeen(true); // 🐛 見下文
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{seen ? children : null}</div>;
}
```

1. **忘了清理就會洩漏。** 把 `return () => io.disconnect()` 刪掉——人們真的會刪，尤其是重構的時候——observer 就會比元件活得還久。
2. **它會捕獲過期閉包。** 一旦回呼引用了某個 prop 或第二份 state，掛載時建立的 observer 就把它們凍結在了掛載那一刻的值上，而不是觸發時的值。
3. **它會擴散。** 每個懶載入區塊、每個「已瀏覽」追蹤、每個無限捲動哨兵都在重寫同一套 `useRef` + `observe` + `disconnect` 的舞步，而每一份拷貝都是一次重新引入前兩個 bug 的機會。

一個 hook 在一個地方把這三個都修了。

## API

[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) 接收三個參數，回傳一個 `stop` 函數：

```ts
const stop = useIntersectionObserver(target, callback, options?);
```

- **`target`** —— 要觀察什麼。一個 React ref、一個原始元素，或者一個 getter `() => element`。（它也接受 `null`/`undefined`，所以觀察一個條件渲染的元素是安全的——hook 會直接等著。）
- **`callback`** —— 標準的 `IntersectionObserverCallback`，即 `(entries, observer) => void`。你拿到原始的 `IntersectionObserverEntry[]`，所以由*你*來決定可見對你的場景意味著什麼。
- **`options`** —— 原生的 `IntersectionObserverInit`：`{ root, rootMargin, threshold }`。全部可選。
- **回傳 `stop()`** —— 呼叫它可以提前斷開 observer（下面細講）。hook 也會在卸載時幫你自動呼叫它。

這裡刻意的設計選擇是：hook 是**基於回呼的，而不是基於布林值的**。它不替你判定「相交」就等於可見——因為根據任務不同，它可能意味著「露出 10%」「完全露出」或者「距離視口 200px 以內」。你讀 `entry.isIntersecting`（或 `entry.intersectionRatio`）然後做事。如果你只想要一個樸素的布林值，有一個順手的姊妹 hook 做這件事——[見下文](#只想要一個布林值)。

在內部，回呼被存在一個 ref 裡（透過 `useLatest`），所以它永遠不會過期——即使你的回呼閉包引用了 props，bug #2 也消失了。而且因為 observer 只會在 effect 內部被建構，這個 hook 是 SSR 安全的：渲染期間沒有任何東西碰 `IntersectionObserver`。

## 模式一：懶載入圖片

最經典的用法。先渲染一個佔位，等容器快進入視口時再把真正的 `<img>` 換上去。注意那個 `stop()` 呼叫——一旦載入了，我們就再也不需要 observer 了，所以立刻斷開它。

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
        stop(); // 一次性：決定載入後就停止觀察
      }
    },
    { rootMargin: '200px' }, // 在它捲進來之前 200px 就開始載入
  );

  return (
    <div ref={ref} style={{ minHeight: 200 }}>
      {loaded ? <img src={src} alt={alt} /> : <div className="skeleton" />}
    </div>
  );
}
```

有兩點讓這個寫法感覺對路。`rootMargin: '200px'` 把 observer 的「視口」每條邊都撐大了 200px，所以請求會在圖片*真正可見之前*就發出，使用者基本看不到骨架屏。而回呼裡的 `stop()` 意味著一個 500 張圖的懶載入清單，在全部載入完之後就剩零個活躍的 observer——你繼續往下捲也不會有殘留的工作。

## 模式二：「已瀏覽」埋點，只觸發一次

追蹤使用者實際捲到了哪些區塊是同一個形狀——但這裡你是真的想讓它精確觸發一次，所以 `stop()` 在幹實事。

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
        stop(); // 每個區塊只計一次，而不是每次捲過都計
      }
    },
    { threshold: 0.5 }, // 「已瀏覽」 = 至少露出一半
  );

  return <section ref={ref}>{children}</section>;
}
```

這裡 `threshold: 0.5` 編碼了一個產品決策——一個區塊只有在露出 50% 之後才算「已瀏覽」，所以快速捲過頂邊不會虛高你的數據。`stop()` 則保證每個區塊每次頁面載入只有一個事件，哪怕使用者把它反覆捲進捲出。

## 模式三：無限捲動觸發器

在清單底部放一個空的哨兵 `<div>`，當它相交時就拉取下一頁。注意這裡我們*沒有*呼叫 `stop()`——我們想讓這個觸發器對每一頁都持續觸發。

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

因為回呼永遠是最新的那個（沒有過期閉包），`loadMore` 和 `hasMore` 在哨兵每次相交時都被新鮮讀取——咬住手寫 `useEffect` 版本的那個 bug 在這裡根本不存在。如果你想要打包好的整套模式，[`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) 正是在這之上搭的，連捲動容器的管線都幫你接好了。

## 調參：threshold、rootMargin 和 root

第三個參數是原生的 `IntersectionObserverInit`，原樣透傳。三個旋鈕，各自回答一個不同的問題：

```ts
useIntersectionObserver(ref, callback, {
  threshold: 0.5,        // 要露出多少才算數？
  rootMargin: '200px',   // 撐大/縮小觸發邊界
  root: containerRef.current, // 相對什麼來測量？
});
```

- **`threshold`** —— 一個從 `0` 到 `1` 的數字（或陣列），表示目標必須露出*多少*回呼才觸發。`0`（預設）一個像素越界就觸發；`1` 要等元素完全進入螢幕。傳一個像 `[0, 0.25, 0.5, 0.75, 1]` 這樣的陣列，你會在每一檔都拿到一次回呼——用 `entry.intersectionRatio` 驅動捲動連動動畫時很有用。
- **`rootMargin`** —— 一個 CSS margin 字串，在計算相交*之前*把 root 的包圍盒撐大或縮小。正值（`'200px'`）提前觸發——就是模式一裡那個提前懶載入的小技巧。負值（`'-100px 0px'`）延後觸發，比如「只有當它越過頂邊 100px 之後才算已瀏覽」。
- **`root`** —— 你拿來測量的那個元素。預設是瀏覽器視口；當你的清單是在一個 `<div>` 裡捲動而不是整頁捲動時，把它設成那個捲動容器的元素。

## stop() 回傳值

回傳的 `stop()` 會斷開 observer。你通常用不到它——hook 會在卸載時自動斷開——但它是表達*一次性*觀察的乾淨方式，就像模式一和模式二那樣：元素第一次相交時，做完事就不再觀察。這既是正確性上的收益（事件精確觸發一次），也是效能上的（一個長長的、已經載入完的清單後面不會拖著一個活躍的 observer）。

## 只想要一個布林值？

有時你根本不在乎 entries 或閾值——你只想要一個針對整個視口的、響應式的 `isVisible` 旗標。[`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) 封裝了 `useIntersectionObserver`，正好把它交給你，形式是一個帶自己 `stop` 的元組：

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

當一個布林值就夠用時，用 `useElementVisibility`；一旦你想要自訂 `root`、非預設的 `threshold`、多個閾值，或者原始 entry，就降到 `useIntersectionObserver`。同一個引擎，兩種手感。

## SSR 安全

`useIntersectionObserver` 在伺服器渲染是安全的。它只在 effect 內部建構 `IntersectionObserver`——而 effect React 在伺服器從不執行——並且底層的元素查找在瀏覽器之外會回傳 `undefined`，所以沒有 `typeof window` 守衛要寫，也沒有 hydration mismatch 要追。原樣丟進 Next.js、Remix 或 Astro 元件即可。（如果 SSR 安全在你的程式碼庫裡是個反覆出現的主題，[SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) 講得更深。）

## 可見性與尺寸家族

`useIntersectionObserver` 是一個 DOM 觀察 hook 家族裡的底層原語。按你真正想要拿回什麼來挑：

| Hook | 給你 | 什麼時候用… |
| --- | --- | --- |
| [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) | 原始 entries、一個 `stop()` | 你想要完全的控制：自訂 root、閾值、一次性 |
| [`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) | `[isVisible, stop]` | 一個樸素的「它在螢幕上嗎？」布林值就夠 |
| [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/) | 接好的 load-more 回呼 | 你在搭一個分頁/無限清單 |
| [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) | 尺寸變化時的回呼 | 重要的是元素的*尺寸*，而非可見性 |
| [`useElementSize`](https://reactuse.com/element/useelementsize/) | `{ width, height }` 狀態 | 你只需要即時的寬高 |
| [`useElementBounding`](https://reactuse.com/element/useelementbounding/) | 完整的包圍盒 rect | 你需要視口相對位置（捲動時會變） |

想看這些怎麼組合的完整巡覽，見 [React 觀察器 Hooks：監視 DOM 的 7 種方式](https://reactuse.com/blog/react-observer-hooks/)。

## 要點回顧

- 一個 `scroll` 監聽器加 `getBoundingClientRect()` 是判斷「這個在螢幕上嗎」的錯誤工具——它折磨主執行緒，還是會漏掉捲動容器。`IntersectionObserver` 正確地回答它：批次、在捲動路徑之外。
- **`useIntersectionObserver(target, callback, options?)`** 把它接進 React：給它一個 ref、一個接收原始 entries 的回呼，以及原生 options。它回傳一個 `stop()`，並在卸載時自動斷開。
- 它**故意是基於回呼的**——你透過 `entry.isIntersecting` / `entry.intersectionRatio` 來決定「可見」意味著什麼。回呼永遠不會過期，所以它每次觸發都讀到新鮮的 props。
- 一次性的活兒（懶載入、只觸發一次的埋點）就在回呼裡呼叫 **`stop()`**；重複觸發的（無限捲動）就跳過它。
- 用 **`threshold`**（要露出多少）、**`rootMargin`**（提前/延後觸發）和 **`root`**（相對容器而非視口測量）來調。
- 只想要布林值？**`useElementVisibility`** 回傳 `[isVisible, stop]`。兩者都 SSR 安全。

從 [`@reactuses/core`](https://reactuse.com/element/useintersectionobserver/) 取用，把你的 scroll 監聽器樣板刪掉吧。
