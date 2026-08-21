---
title: "React useTimeout Hook：宣告式 setTimeout 與自動清理 (2026)"
description: "useTimeout 與 useTimeoutFn 實用指南：為什麼在 useEffect 裡寫 setTimeout 會漏掉定時器、觸發過期閉包、在 StrictMode 下重複掛載，[isPending, start, cancel] 這個元組如何一次解決這些問題，為什麼改延遲會重啟倒數、改回調卻不會，start() 轉發參數的陷阱，以及延遲 loading、複製提示、自動消失、冷卻按鈕這幾個模式。TypeScript 優先，SSR 安全。"
slug: react-usetimeout-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-21
tags: [react, hooks, timers, typescript, tutorial]
keywords: [react usetimeout, usetimeout, usetimeout react, useTimeout hook, react settimeout hook, useeffect 裡的 settimeout, react settimeout 清理, react settimeout 沒作用, react 清除 settimeout, react 延遲 hook, usetimeoutfn, react 卸載時取消 settimeout, react settimeout 閉包陷阱, react 防抖 settimeout hook, react 延遲顯示 loading]
image: /img/og.png
---

# React useTimeout Hook：宣告式 setTimeout 與自動清理 (2026)

這是一個「已複製！」按鈕。每個程式碼庫裡都有一個，而這個版本有三個 bug：

```tsx
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    setTimeout(() => setCopied(false), 2000);
  }, [copied]);

  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); }}>
      {copied ? "已複製！" : "複製"}
    </button>
  );
}
```

它從不清除定時器，所以在倒數途中卸載會留下一個指向已死組件的回調。它在每次 `copied` 變化時重新掛載，而不是乾淨地重啟。而在 React 18 的 StrictMode 下，effect 在掛載時會跑兩次，於是你本來只想要一個定時器，卻拿到了兩個。補上漏掉的 `clearTimeout` 能修掉洩漏，但修不掉問題的形狀：定時器的生命週期現在被綁進了依賴陣列，而你依然沒辦法在點擊事件裡取消它、按需重啟它，或者問一句「它還在跑嗎？」

`setTimeout` 是一個「射後不理」的瀏覽器原語。React 組件可不是射後不理的——它們會卸載、會重新渲染、會改變主意。[`@reactuses/core`](https://reactuse.com) 裡的 [`useTimeout`](https://reactuse.com/effect/usetimeout/) 與 [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) 把這道鴻溝補上了：交給你的不是一個需要小心伺候的數字，而是一份狀態加兩個控制函式。這篇文章講它們底層到底做了什麼、那個所有人都會踩的行為（延遲是依賴，回調不是）、一個會悄悄汙染你參數的 `start()` 陷阱，以及值得直接抄走的幾個模式。

<!-- truncate -->

## 快速開始

```bash
npm install @reactuses/core
```

```tsx
import { useTimeoutFn } from "@reactuses/core";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [, startReset] = useTimeoutFn(() => setCopied(false), 2000, {
    immediate: false,
  });

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        startReset();
      }}
    >
      {copied ? "已複製！" : "複製"}
    </button>
  );
}
```

沒有 effect，沒有依賴陣列，沒有需要記著寫的清理。定時器由一次點擊、而不是由一次渲染來啟動；卸載時自動清除；在提示還掛著的時候再點一次「複製」，會重新開始這兩秒，而不是在第一個定時器上再疊一個。

## 兩個 Hook，一台引擎

兩個 hook 回傳的是同一個三元組——函式庫把它叫做 `Stoppable`：

```tsx
type Stoppable = [isPending: boolean, start: Fn, cancel: Fn];
```

它們的差別只在於：時間到了之後會發生什麼。

**[`useTimeoutFn(cb, ms, options?)`](https://reactuse.com/effect/usetimeoutfn/)** 執行你的回調。當這個「到期」本身有事要做時用它——關掉 toast、重設旗標、送一個埋點。

**[`useTimeout(ms?, options?)`](https://reactuse.com/effect/usetimeout/)** 不跑你的任何回調。它把 `isPending` 從 `true` 翻成 `false` 並觸發一次重新渲染。當這個「到期」本身*就是*狀態時用它——「300ms 過了沒？」就是全部的問題。

`useTimeout` 字面上就是把回調那個位置讓給「強制重新渲染」的 `useTimeoutFn`：

```tsx
export const useTimeout: UseTimeout = (ms = 0, options = {}) => {
  const update = useUpdate();
  return useTimeoutFn(update, ms, options);
};
```

這個 [`useUpdate`](https://reactuse.com/effect/useupdate/) 是一個兩行的 `useReducer`，對一百萬取模遞增計數器——就是那個「不發明假 state 也能強制重新渲染」的標準技巧，取模是為了讓長壽命的組件不會一路飄向 `Number.MAX_SAFE_INTEGER`。它保證了到期那一刻一定會有一次渲染，即使在光靠 `isPending` 不足以觸發渲染的情況下也是如此。正是這一點，讓 `useTimeout` 可以當成一個純粹的「N 毫秒後重新渲染我」原語來用——例如你要重新讀一個並不是 React state 的值時。

預設兩者都在掛載時啟動。傳 `{ immediate: false }`，在你自己呼叫 `start()` 之前什麼都不會發生。

## 它到底做了什麼

實作大約二十行，而每一行都在回答開頭那個範例裡的某個 bug：

```tsx
export const useTimeoutFn = (cb, interval, options = {}) => {
  const { immediate = true } = options;
  const [pending, setPending] = useState(() => immediate);
  const savedCallback = useLatest(cb);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const stop = useEvent(() => {
    setPending(false);
    if (timer.current) clearTimeout(timer.current);
  });

  const start = useEvent((...args: unknown[]) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPending(false);
      savedCallback.current(...args);
    }, interval);
    setPending(true);
  });

  useEffect(() => {
    if (immediate) start();
    return stop;
  }, [stop, immediate, interval, start]);

  return [pending, start, stop];
};
```

這裡塞進了五個決策，每一個都值得知道，因為每一個之後都會出現在你自己的程式碼裡。

**回調住在 ref 裡，不在依賴裡。** [`useLatest`](https://reactuse.com/state/uselatest/) 在每次渲染提交後把 `savedCallback.current` 指向最新的那個函式，定時器透過它來呼叫。所以到期時執行的閉包是你*最近一次*渲染裡的那個——過期閉包的 bug 消失了——但換掉回調**不會**重啟倒數。一個 5 秒的定時器跑到第 4 秒時還剩 1 秒，即使它將要呼叫的那個函式在這期間已經被重新建立了十次。這是正確的行為，倉庫裡有測試覆蓋，但對於「一個長得像 useEffect 的 hook，輸入變了就該重跑」這種預期來說，會讓人意外。

**延遲*確實*在依賴裡。** `interval` 位在依賴陣列中，所以改動它會拆掉當前的定時器、從零開始一個新的。這是刻意的，通常也正是你想要的——但請看下面的坑，因為在渲染裡現算的延遲，是造出一個永遠跑不完的倒數的最快方式。

**`start` 與 `stop` 的參考永不改變。** [`useEvent`](https://reactuse.com/effect/useevent/) 把兩者都包進一個空依賴的 `useCallback` 並轉發給 ref，所以你在第 1 次渲染拿到的函式，和第 500 次渲染拿到的是同一個參考。你可以把它們放進依賴陣列、傳給被 memo 的子組件、或者塞進 context，都不會引發常見的抖動。

**`start()` 先清後設。** 在定時器已經在跑的時候呼叫它不會疊加——而是取消並重啟。這就是「再點一次複製」表現正常的原因；也意味著在每次按鍵時反覆呼叫 `start()`，你就白得了一份防抖語義（不過 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 把意圖說得更清楚）。

**`pending` 是被預先種下的，不是閃出來的。** `useState(() => immediate)` 意味著當 `immediate` 打開時，第一次渲染讀到的就已經是 `true`——掛載時沒有 `false → true` 的閃爍，也沒有浪費掉的一次渲染。而且因為 `immediate` 只是一個普通選項、伺服器端與客戶端取值一致，這個預設值在兩邊完全相同。這個 hook 裡沒有任何東西碰 `window`、`document` 或 `Date`，所以它不需要守衛就能在伺服器端渲染，也不會出現 hydration 不匹配。

effect 的清理函式就是 `stop` 本身，這就是洩漏的修法：卸載時一定清除定時器，無論它當時處於什麼狀態。

## 值得抄走的模式

### 延遲出現的 loading

`useTimeout` 最好的用途。一個出現 80ms 就消失的 spinner 讀起來只是一次閃爍——比完全不顯示還糟。解法是只在載入真的很慢時才顯示，而這恰好就是「300ms 過了沒？」：

```tsx
function UserList() {
  const { data, isLoading } = useUsers();
  const [tooSoon] = useTimeout(300);

  if (isLoading) return tooSoon ? null : <Spinner />;
  return <List items={data} />;
}
```

`tooSoon` 初始為 `true`，掛載 300ms 後翻成 `false`。快速返回的請求在這段空隙裡什麼都不渲染；慢的才會拿到 spinner。一行，無 state，無 effect。

### 自動消失 + 滑鼠懸停暫停

元組裡的 `cancel` 與 `start` 讓這件事變得很簡單——手寫版本需要一個 ref 和兩個 effect：

```tsx
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [, start, cancel] = useTimeoutFn(onDismiss, 5000);

  return (
    <div role="status" onMouseEnter={cancel} onMouseLeave={() => start()}>
      {message}
    </div>
  );
}
```

注意 `onMouseLeave` 上的 `() => start()`。這不是風格偏好——見下面的坑。

### 冷卻按鈕

```tsx
function ResendCodeButton({ onResend }: { onResend: () => void }) {
  const [cooling, startCooldown] = useTimeout(30_000, { immediate: false });

  return (
    <button
      disabled={cooling}
      onClick={() => { onResend(); startCooldown(); }}
    >
      {cooling ? "驗證碼已送出，請稍候" : "重新傳送驗證碼"}
    </button>
  );
}
```

`immediate: false` 是關鍵：按鈕在掛載時是可用的，只有被用過一次之後才進入冷卻。如果你想渲染剩餘秒數而不是一個布林值，那是另一個 hook 的工作——[`useCountDown`](https://reactuse.com/state/usecountdown/) 會幫你倒數並把數字交給你。

### 把控制權交還給瀏覽器

不帶參數的 `useTimeout()` 預設 `ms = 0`，它依然會推遲到一個 macrotask——在繪製之後、在待處理的 microtask 之後。偶爾這正是你想要的那個逃生口：「先讓瀏覽器把這一幀畫出來，我再做那件耗時的事」，而且比一個 `requestIdleCallback` polyfill 更好推理。如果你要的是每一幀執行而不是執行一次，用 [`useRafFn`](https://reactuse.com/effect/useraffn/)。

## 值得知道的坑

- **`start` 會把參數轉發給你的回調。** 這是一個真實的特性——`start(userId)` 會把 `userId` 直接傳給定時器回調——同時也是一個真實的陷阱，只要呼叫方是 DOM 事件處理器。`onMouseLeave={start}` 會把 React 的合成 `MouseEvent` 直接塞進你的 `onDismiss(...)`。如果那個回調是 `onDismiss(id?: string)`，你就用一個事件物件當 id 關掉了一個 toast，而 TypeScript 不會攔你，因為 `start` 的型別是 `Fn`。包一層：`onMouseLeave={() => start()}`。`onClick`、`onBlur` 以及任何會傳事件的地方，同理。

- **延遲一變，倒數就重啟——每一次都是。** `interval` 是依賴，所以下面這個永遠不會觸發：

  ```tsx
  // 有 bug：每次渲染都是新的延遲，定時器被無限重啟
  useTimeoutFn(onDone, Math.max(0, deadline - Date.now()));
  ```

  任何按渲染重算的延遲，都會在它跑完之前把時鐘歸零。傳一個穩定的數字，或者把它 memo 起來。反過來這個特性也有用：當延遲是真的變了——使用者在「3 秒後消失 / 10 秒後消失 / 不消失」之間切換——重啟正是對的。

- **回調變了*不會*重啟它。** 上一條的鏡像，同樣值得記進肌肉記憶。你的回調永遠是最新的那個，但它的到期時刻是 `start()` 執行時定下的那個。

- **`cancel()` 會把 `isPending` 設為 `false`。** 它是停止，不是暫停——沒有「用剩餘時間繼續」這回事。`cancel()` 之後再 `start()`，走的是一個完整的新延遲。如果你需要真正的暫停/恢復語義，得自己記錄已經過去的時間，並把剩餘時間當作新的延遲傳進去。

- **卸載之後 `isPending` 會凍結在最後一次渲染的值上。** 清理函式呼叫了 `stop()`，它清除了定時器並呼叫 `setPending(false)`——但這個狀態更新落在一個已卸載的組件上，React 會丟棄它。如果你在測試裡快照了這個元組、在 `unmount()` 之後再讀，`isPending` 依然會是 `true`。這不是洩漏，也不會有警告；定時器是真的被清掉了。

- **StrictMode 會掛兩次，但結果會收斂。** 在 React 18 的開發模式下，掛載 effect 會執行、清理、再執行一次，所以在 dev 裡你會看到兩次 `setTimeout` 呼叫。永遠不會重複觸發——`stop` 清掉了第一個，`start` 在排新的之前又清了一次——但倒數實際上是從第二次執行開始算的。實際使用中這是次毫秒級的差別；但在一個用假定時器精確推進時間的測試裡，這個差別是會咬人的。

- **`immediate` 在掛載時被讀取，同時也是依賴。** 在後續某次渲染裡把 `immediate` 從 `false` 翻成 `true`，*會*啟動定時器，因為它在 effect 的依賴裡。用切換它的方式來宣告式地武裝一個定時器是完全合理的做法——只是別驚訝於它並不是惰性的。

## 什麼時候不該用它

這兩個 hook 是對單一 `setTimeout` 的一層薄而誠實的封裝。當你的問題有專門的名字時，對應的 hook 已經處理好了那些你否則要重新踩一遍的邊界情況：

- **按週期重複執行** → 用 [`useInterval`](https://reactuse.com/effect/useinterval/)，而不是讓一個 timeout 自己重新武裝自己。自排程的 timeout 會漂移，而且取消起來極其難受。
- **「等使用者停止輸入」** → 回調用 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)，值用 [`useDebounce`](https://reactuse.com/state/usedebounce/)。你*可以*靠每次按鍵呼叫 `start()` 來拼出來，但專用 hook 一眼就能讀懂。
- **「每 N 毫秒最多一次」** → [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) / [`useThrottle`](https://reactuse.com/state/usethrottle/)。timeout 是限流的錯誤原語；第一次呼叫就該立刻通過。
- **看得見的倒數** → [`useCountDown`](https://reactuse.com/state/usecountdown/)。用單一 timeout 渲染「4… 3… 2…」意味著你要自己跑一個 tick 迴圈。
- **「使用者是不是不動了？」** → [`useIdle`](https://reactuse.com/browser/useidle/)，它已經監聽了正確的那組活動事件。
- **逐幀動畫** → [`useRafFn`](https://reactuse.com/effect/useraffn/)。`setTimeout` 不與合成器對齊，而且在背景分頁裡還會繼續跑。
- **只是想在卸載時清理** → [`useUnmount`](https://reactuse.com/effect/useunmount/)。根本不需要定時器。

## 重點回顧

- 在 `useEffect` 裡寫 `setTimeout`，逼著你同時手動管四件事：清理、依賴陣列、過期閉包、以及缺失的控制能力。對三個錯一個，是常態。
- [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) 回傳 `[isPending, start, cancel]`，並且天生在卸載時清除。[`useTimeout`](https://reactuse.com/effect/usetimeout/) 是同一台引擎，只是把回調那一格用來觸發重新渲染——適合「到期本身就是你關心的狀態」的場景。
- 延遲是依賴，回調不是——改延遲會重啟倒數，改回調只會悄悄換掉將要執行的函式。兩者都是刻意設計；分清哪個是哪個能省下一個下午。
- `start` 會轉發參數，所以永遠不要把它直接傳給 DOM 事件處理器。寫 `onMouseLeave={() => start()}`，不要寫 `onMouseLeave={start}`。
- `start` 與 `cancel` 的參考永久穩定，`isPending` 被預先種下所以掛載時不會閃，而且 hook 裡沒有任何東西碰瀏覽器全域物件——它能原封不動地在伺服器端渲染。

`useTimeout`、`useTimeoutFn`、`useInterval`，以及另外 110+ 個 SSR 安全、TypeScript 優先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 裡——一次安裝，支援 tree-shaking，沒有需要伺候的依賴。

```bash
npm install @reactuses/core
```
