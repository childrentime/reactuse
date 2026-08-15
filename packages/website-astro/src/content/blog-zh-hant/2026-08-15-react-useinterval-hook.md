---
title: "React useInterval Hook：沒有過期閉包的 setInterval (2026)"
description: "useInterval 實用指南：為什麼 useEffect 裡的 setInterval 總是讀到過期狀態（那個卡在 1 不動的計數器），宣告式的 useInterval hook 如何用一個「最新回呼」ref 解決它，delay = null 暫停 vs 命令式 pause()/resume()，immediate 選項，帶退避的動態輪詢間隔，後臺分頁暫停，以及什麼時候 useTimeoutFn、useCountDown 或 useRafFn 才是更合適的工具。TypeScript 優先，SSR 安全。"
slug: react-useinterval-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-15
tags: [react, hooks, effect, timers, typescript, tutorial]
keywords: [react useinterval, useinterval, useinterval react, useInterval hook, react setinterval, setinterval 在 useeffect 裡, react setinterval hook, setinterval react hooks 狀態不更新, react 輪詢 hook, 宣告式 setinterval react, useinterval 暫停 恢復, react 卸載時 clearinterval, react 定時器 hook, useTimeout react, react 倒計時 hook]
image: /img/og.png
---

# React useInterval Hook：沒有過期閉包的 setInterval (2026)

每個 React 開發者都寫過一遍這個元件，而它從來不按預期工作：

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <h1>{count}</h1>;
}
```

它顯示 `0`、`1`……然後永遠停在 `1`。interval 的回呼是在第一次渲染時建立的，那時 `count` 是 `0`，而空依賴陣列意味著它再也看不到後續的渲染。`setCount(0 + 1)` 每秒跑一次，什麼都沒變。這是 React 定時器裡被搜尋最多的一個 bug，而人們找到的"修法"——把 `count` 加進依賴（現在 interval 每秒被拆掉重建一次）、用函式式更新（能用，直到回呼需要讀*除了*上一個 count 之外的任何東西）——都是在跟同一個底層錯配硬扛：`setInterval` 是命令式的，活在 React 渲染週期之外，而它想讀的所有東西都活在渲染週期之內。

Dan Abramov 2019 年那篇 *Making setInterval Declarative with React Hooks* 給了這個錯配一個真正的解法：一個 `useInterval` hook，把*最新*的回呼存在 ref 裡，絕不因為你的元件重新渲染就重啟定時器。[`@reactuses/core`](https://reactuse.com) 裡的 [`useInterval`](https://reactuse.com/effect/useinterval/) 就是這個思路，外加真實應用裡你遲早會需要的那幾塊——`null` 暫停、`pause()` / `resume()` 控制、`immediate` 選項，以及能扛住 StrictMode 的清理。本文會講清楚它的原理、兩種暫停方式、動態輪詢間隔、後臺分頁問題，以及什麼時候該換另一個定時器 hook。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useInterval } from "@reactuses/core";
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useInterval(() => {
    setCount(count + 1); // 讀到的是當前的 count——不需要函式式更新
  }, 1000);

  return <h1>{count}</h1>;
}
```

這就是開頭那個壞掉的元件，把 `useEffect` + `setInterval` 換成 `useInterval` 就修好了。回呼可以直接讀任何 prop 或 state，定時器只建立一次、卸載時清除，也沒有會寫錯的依賴陣列。

簽名是 `useInterval(callback, delay, options?)`——`delay` 以毫秒計，傳 `null` 則暫停——回傳 `{ isActive, pause, resume }`，給你需要手動控制的場景用。

## 為什麼 setInterval 和 React 合不來

底下其實是三個獨立的問題，hook 對每一個的解法都不同：

1. **過期閉包。** `setInterval` 一輩子只持有一個函式引用。這個函式閉包住了某一次渲染的 props 和 state。之後每次渲染都會建立新的閉包——而正在跑的 interval 永遠看不到。
2. **一渲染就重啟。** 顯而易見的修法是讓 effect 依賴回呼讀到的所有東西：`useEffect(..., [count])`。現在 interval *正確*了，但每次變化都被清掉重建——計時每次歸零，依賴變得快的話，tick 可能一次都觸發不了。
3. **生命週期。** 你得在卸載時清除 interval，StrictMode 的開發環境二次掛載時再清一次，還有——會變成一個小狀態機的那部分——決定怎麼*暫停*它：第二個 state，包住 `setInterval` 的一個 `if`，以及現在得把暫停標誌也算進去的依賴。

三個問題都處理好之後，一個正確的手寫版本長這樣——一個存最新回呼的 ref、一個只以 `delay` 為依賴的 effect、用 `null` 表示暫停：

```tsx
function useIntervalManual(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useLayoutEffect(() => {
    savedCallback.current = callback; // 永遠是最新一次渲染的閉包
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

這基本就是 `@reactuses/core` 裡 `useInterval` 的核心——它用 [`useLatest`](https://reactuse.com/state/uselatest/) 做那個 ref，再在上面加控制。這個設計天然帶來兩條性質，也是最該記住的兩條：

- **改回調絕不重啟定時器。** 你想怎麼重渲染就怎麼重渲染，傳內聯箭頭函式、讀任何 state——ref 被更新，interval 保持自己的節奏。
- **改 `delay` 會重啟。** `delay` 是唯一的依賴，所以 `5000 → 1000` 會清掉舊 interval 再起一個新的。這會重置相位：下一個 tick 距離變更提交的那一刻整整一個 `delay`。通常是對的（下面的退避就靠這個），偶爾會讓人意外——如果你以為進行中的那個 tick 會先跑完的話。

## 暫停：`null` vs `pause()` / `resume()`

停掉 interval 有兩種方式，選對了元件就簡單。

**宣告式——把 `null` 當作 delay 傳進去。** 當"它該不該跑"能從 state 或 props 推匯出來時，把它編碼進 delay 表示式，讓 hook 跟著走：

```tsx
function LivePrice({ symbol, live }: { symbol: string; live: boolean }) {
  const [price, setPrice] = useState<number | null>(null);

  useInterval(
    async () => setPrice(await fetchPrice(symbol)),
    live ? 5000 : null, // false → 暫停，true → 每 5 秒輪詢
  );

  return <span>{price ?? "—"}</span>;
}
```

翻轉 `live`，interval 就清除或重啟。沒有 effect，沒有 ref，沒有額外的 state。

**命令式——`controls: true` 加上回傳的控制代碼。** 當啟停是一個*使用者動作*而不是派生條件（開始/停止按鈕、"這個彈窗開啟期間暫停"）時，退出自動啟動，自己來開：

```tsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);

  const { pause, resume } = useInterval(
    () => setElapsed(Date.now() - startedAt.current), // 讀時鐘，別數 tick
    100,
    { controls: true }, // 掛載時不啟動——等 resume()
  );

  const toggle = () => {
    if (running) {
      pause();
    } else {
      startedAt.current = Date.now() - elapsed;
      resume();
    }
    setRunning(!running);
  };

  return (
    <>
      <p>{(elapsed / 1000).toFixed(1)}s</p>
      <button onClick={toggle}>{running ? "暫停" : "開始"}</button>
    </>
  );
}
```

`pause` 和 `resume` 的引用是穩定的（放進依賴陣列和事件處理器都安全），而且即使在 `controls` 模式下，interval 依然會在卸載時清除——你不可能因為忘了而漏掉一個定時器。一句實話：回傳值裡的 `isActive` 是一個 **ref**（`isActive.current`），不是 state——它翻轉時不會觸發重渲染，所以上面的例子為按鈕文案單獨維護了 `running` state。

兩者也能混用：不開 `controls` 時，`pause()` 也能當臨時覆蓋用，下一次 `delay` 變化會自動恢復。

## `immediate`：現在就跑一次，然後每 N 毫秒一次

`setInterval` 要等滿一個 `delay` 才第一次呼叫，對輪詢來說這幾乎從來不是你想要的——使用者得盯著空白螢幕五秒。`immediate: true` 會在 interval 啟動時同步執行一次回呼，然後照常按計劃走：

```tsx
useInterval(refreshDashboard, 30_000, { immediate: true });
```

注意，"interval 啟動時"包括每一次 `delay` 變化——delay 的值每變一次，回呼就立刻跑一次、計劃重新開始。*使用者*調整重新整理頻率時這很順手，但對失敗驅動的退避來說恰恰是錯的（每次拉長 delay 都會當場再觸發一次呼叫），所以退避場景別開 `immediate`——見下一節。

## 真實場景裡的模式

### 帶退避的輪詢

因為 `delay` 就是個普通值，退避就只是 state。失敗時拉長間隔，成功時彈回來：

```tsx
function useJobStatus(jobId: string) {
  const [status, setStatus] = useState<Job | null>(null);
  const [delay, setDelay] = useState<number | null>(2000);

  useInterval(async () => {
    try {
      const job = await getJob(jobId);
      setStatus(job);
      if (job.done) setDelay(null);            // 停止輪詢
      else setDelay(2000);                     // 健康 → 基礎頻率
    } catch {
      setDelay((d) => Math.min((d ?? 2000) * 2, 60_000)); // 退避，封頂 1 分鐘
    }
  }, delay);

  return status;
}
```

每次 `setDelay` 都會以新的節奏重啟 interval——而且因為沒開 `immediate`，一次失敗之後會等滿*新的、更長的* delay 再試，這正是退避的意義。那個 hook 裡沒有任何定時器簿記——全是"此刻 delay 應該是多少？"。

### 後臺分頁（以及離線時）暫停

瀏覽器會節流隱藏分頁裡的定時器——大約降到每秒一次，Chrome 在分頁隱藏五分鐘後更是降到每*分鐘*一次。在後臺分頁裡輪詢，既浪費配額，*又*會在不可預測的時刻觸發。修法和 `null` 模式天然可以組合，配上 [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) 和 [`useOnline`](https://reactuse.com/browser/useonline/)：

```tsx
const visible = useDocumentVisibility() === "visible";
const online = useOnline();

useInterval(refresh, visible && online ? 10_000 : null, { immediate: true });
```

使用者回來時，`delay` 從 `null` 翻到 `10_000`，interval 重啟，`immediate` 立刻拉一次新資料——正是你原本要用 `visibilitychange` 監聽器手寫的那套"恢復並追上"行為。

### 時鐘：排程 tick，別數 tick

`setInterval` 會漂移。"每 1000ms"跑一分鐘，你可能丟掉一秒甚至更多，被節流的分頁裡尤其如此。所以別在回呼裡累加時間——只拿 interval 觸發重渲染，然後讀真正的時鐘：

```tsx
function Clock() {
  const [now, setNow] = useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 1000);
  return <time>{new Date(now).toLocaleTimeString()}</time>;
}
```

interval 允許不準；顯示的值永遠正確，因為它來自 `Date.now()`，而不是 `tick 數 × 1000`。已用時長的顯示同理：存一個起始時間戳記，渲染 `Date.now() - start`。

## 什麼時候不該用 useInterval

- **你要的是一次延遲呼叫，不是重複呼叫。** 那是 [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)——`const [pending, start, stop] = useTimeoutFn(fn, ms)`——或者只需要 N 毫秒後重渲染一次的話用 [`useTimeout`](https://reactuse.com/effect/usetimeout/)。
- **你在做倒計時顯示。** [`useCountDown`](https://reactuse.com/state/usecountdown/) 已經在 `useInterval` 之上做好了秒 → `hh:mm:ss` 的換算和完成回呼。
- **你在做動畫。** 任何應該每幀更新的視覺效果都屬於 `requestAnimationFrame`，也就是 [`useRafFn`](https://reactuse.com/effect/useraffn/) 包裝的東西——它與顯示器重新整理率同步，隱藏分頁裡自動暫停。16ms 的 `setInterval` 不是一回事。
- **你在給處理器限流，而不是排程它。** 在*使用者輸入的尾沿*觸發是 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) / [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 的地盤。
- **這個"interval"其實是伺服器端推送。** 如果伺服器端能告訴你什麼時候變了，走 [`useEventSource`](https://reactuse.com/browser/useeventsource/) 的 Server-Sent Events 流在延遲和成本上都勝過輪詢。

| 你想要…… | 用 |
| --- | --- |
| 每 N 毫秒跑一次 `fn`，用 `null` 或 `pause()` 暫停 | [`useInterval`](https://reactuse.com/effect/useinterval/) |
| N 毫秒後跑一次 `fn`，帶 `start` / `stop` | [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) |
| N 毫秒後重渲染一次 | [`useTimeout`](https://reactuse.com/effect/usetimeout/) |
| 從 N 秒開始的 `hh:mm:ss` 倒計時 | [`useCountDown`](https://reactuse.com/state/usecountdown/) |
| 每個動畫幀跑一次 `fn` | [`useRafFn`](https://reactuse.com/effect/useraffn/) |

## 值得知道的坑

- **回呼讀到的是最新一次*已提交*的渲染。** ref 在每次渲染後的 layout effect 裡更新，所以渲染進行中觸發的 tick 看到的是上一次已提交的值——實踐中不是問題，但這就是 hook 無法"比 React 更新"的原因。
- **`delay` 變化 = 相位重置。** 上面講過；如果你需要在*不*丟掉進行中 tick 的前提下改節奏，保持 interval 不變、在回呼裡跳過 tick。
- **`immediate` 在 effect 裡觸發，掛載時和每次 `delay` 變化時都會。** React 18+ 開發模式的 StrictMode 下，這意味著掛載時 immediate 呼叫會發生兩次（掛載 → 清理 → 掛載）。像對待任何 effect 一樣，讓它冪等。
- **`async` 回呼沒問題——但重疊得你自己管。** hook 不會等待回傳的 Promise。如果一次 fetch 可能比 `delay` 還久，用一個進行中標誌守著，或者在請求掛起期間用 `null` 暫停。
- **SSR 天然安全。** 定時器在 effect 裡建立，伺服器端什麼都不跑，也沒有需要守護的 `window` 訪問。

## 要點回顧

- 卡在 `1` 的計數器是過期閉包 bug：`setInterval` 一直拿著第一次渲染的回呼。[`useInterval`](https://reactuse.com/effect/useinterval/) 把最新回呼存進 ref，定時器只跑一份、永遠看到當前 state。
- 只有 `delay` 會重啟 interval——傳 `null` 宣告式暫停，或者 `controls: true` 配 `pause()` / `resume()` 做使用者驅動的啟停。
- `immediate: true` 現在跑一次、之後每 N 毫秒一次；退避就是 `setDelay(...)`；把 [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) / [`useOnline`](https://reactuse.com/browser/useonline/) 折進 delay 表示式，在隱藏或離線的分頁裡暫停輪詢。
- 絕不要在 interval 裡累加時間——讀 `Date.now()`——當任務不是"每 N 毫秒，永遠"時，換 [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)、[`useCountDown`](https://reactuse.com/state/usecountdown/) 或 [`useRafFn`](https://reactuse.com/effect/useraffn/)。

`useInterval`、`useTimeoutFn`、`useCountDown` 以及另外 110+ 個 SSR 安全、TypeScript 優先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 裡——一次安裝，可 tree-shake，零依賴負擔。

```bash
npm install @reactuses/core
```
