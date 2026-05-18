---
title: "React 裡不用 setTimeout 的計時器寫法:useTimeout、useInterval、useCountDown 和 useRafFn"
description: "不再跟 setTimeout 清理、過期閉包和動畫迴圈死磕。一次性梳理 ReactUse 的計時器 hook——useTimeout、useTimeoutFn、useInterval、useCountDown、useRafFn 和 useRafState——以及它們各自悄悄修掉的 bug。"
slug: react-timer-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-18
tags: [react, hooks, performance, tutorial, animation]
keywords: [react setTimeout, react setInterval, react useTimeout hook, react useInterval hook, react requestAnimationFrame, react countdown timer, useRafFn, useRafState, react timer cleanup, react stale closure, react animation loop]
image: /img/og.png
---

# React 裡不用 setTimeout 的計時器寫法:useTimeout、useInterval、useCountDown 和 useRafFn

計時器是那種每個 React 開發者頭十次都會自己手寫、其中至少六次寫錯的東西。模式看起來很簡單:在 `useEffect` 裡 `setTimeout`,回傳一個清理函式,提交。然後程式碼評審發現了過期閉包。然後 bug 單進來了,因為 delay 是在掛載時從 props 讀的,而不是當前渲染裡的。然後有人注意到在慢頁面上元件已經卸載了,interval 還在跑。然後你發現 `setInterval` 每個週期都會漂移一點,你的倒數計時跑一分鐘之後差了 800ms。然後效能稽核指出有個動畫迴圈,沒人記得在標籤頁隱藏時暫停。

<!-- truncate -->

這些 bug 沒一個有意思。它們都是同一類 bug:計時器邏輯沒問題,壞的是 React 的接入方式。[ReactUse](https://reactuse.com) 提供了六個小 hook,把這個接入做掉,讓你只寫計時器邏輯本身:[`useTimeout`](https://reactuse.com/effect/usetimeout/)、[`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)、[`useInterval`](https://reactuse.com/effect/useinterval/)、[`useCountDown`](https://reactuse.com/state/usecountdown/)、[`useRafFn`](https://reactuse.com/effect/useraffn/) 和 [`useRafState`](https://reactuse.com/state/userafstate/)。

這篇文章逐個走一遍——底層原語是什麼、在 React 裡手寫版長什麼樣、hook 藏了什麼 bug、它真正該出現在你程式碼的哪裡。看完你應該知道什麼場景該掏哪個計時器 hook,以及為什麼。

## 一段程式碼先把問題說清楚

在引入任何 hook 之前,幾乎每個 React 程式碼庫都至少寫過一次這個:

```tsx
function Toast({ message, durationMs }: { message: string; durationMs: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(id);
  }, [durationMs]);

  return visible ? <div className="toast">{message}</div> : null;
}
```

這段大體上是對的。bug 在於缺了什麼:

1. 依賴陣列讓 effect 在 `durationMs` 每次變化時重新執行——所以父元件在過程中更新了 prop,會把計時器從零重啟,而不是讓它跑完。
2. 沒辦法從外面取消計時器(比如一個「關閉」按鈕),除非把 visible 狀態提上去。
3. 沒辦法讀取計時器還在不在等待——這在測試裡、埋點裡、顯示一個「2 秒後消失……」的標籤裡都有用。
4. 清理在卸載時跑,這是對的,但它也會在 `durationMs` 變化導致的每一次重新渲染時跑,這通常不是你想要的。

這四個都能用 `useRef` 拼出來,但是那種沒人願意寫第二遍的拼接程式碼。`useTimeoutFn` 存在的意義就是這個。

## 1. useTimeoutFn——正確的 setTimeout

`useTimeoutFn(callback, interval, options?)` 在 `interval` 毫秒後排程 `callback`,回傳 `[isPending, cancel, restart]`。它幹了三件 naive 版沒幹的事:

- 永遠呼叫最新的 `callback`——即使你不把它列在 deps 裡,也不會有過期閉包。
- `cancel()` 讓父元件或兄弟元件不用卸載就能停掉計時器。
- `restart()` 讓你不用改 key、不用重新掛載就能重置時鐘。

重寫 `Toast`:

```tsx
import { useTimeoutFn } from "@reactuses/core";

function Toast({ message, durationMs, onClose }: {
  message: string;
  durationMs: number;
  onClose: () => void;
}) {
  const [isPending, cancel, restart] = useTimeoutFn(onClose, durationMs);

  return (
    <div className="toast" onMouseEnter={cancel} onMouseLeave={() => restart()}>
      {message}
      {isPending && <span className="fade-bar" />}
    </div>
  );
}
```

注意消失了的東西:沒有 `useEffect`、沒有 `setTimeout`、沒有 `clearTimeout`、沒有 `useRef`、沒有 `useCallback`。hover 行為——使用者在看 toast 時暫停自動消失——一行程式碼。`isPending` 旗標驅動那個淡出條,不需要額外的狀態。

`immediate` 選項(預設 `true`)控制計時器是不是在掛載時啟動。設為 `false` 就是「按需觸發」:

```tsx
const [, , scheduleSave] = useTimeoutFn(saveDraft, 2000, { immediate: false });

return <textarea onChange={(e) => { setText(e.target.value); scheduleSave(); }} />;
```

每次按鍵都把 save 往後推 2 秒。這是構造「使用者停止輸入 2 秒後儲存」防抖的一種方式,不過對這種特定模式 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 通常更乾淨。

## 2. useTimeout——只想 N 毫秒後重新渲染

`useTimeout(ms, options?)` 跟 `useTimeoutFn` 是同一個東西,只不過回呼是元件自己的重新渲染。當你只想讓一段 UI 在延遲後「出現」,又不想存一個布林時用它。

```tsx
import { useTimeout } from "@reactuses/core";

function DelayedSpinner({ delayMs = 250 }: { delayMs?: number }) {
  const [isPending] = useTimeout(delayMs);
  return isPending ? null : <Spinner />;
}
```

場景是「不要為低於 250ms 的載入顯示 spinner」。如果父元件在 100ms 內完成載入,spinner 永遠不會被看見——沒有閃爍。如果更長,spinner 出現。沒有狀態、沒有 effect、沒有布林。

回傳形狀跟 `useTimeoutFn` 一樣,所以你如果想打斷重新渲染,`cancel` 和 `restart` 也在那。實際中讀取的用法佔多數。

## 3. useInterval——真的能暫停的 setInterval

`useInterval(callback, delay, options?)` 每 `delay` 毫秒跑一次 `callback`。回傳值是 `{ isActive, pause, resume }`,不是一個元組——`useInterval` 是圍繞暫停/恢復這件事建的,因為這是所有人都需要、但所有人用原生 `setInterval` 都實作不對的操作。

`setInterval` 在 React 裡最常見的 bug **不是**清理——現代 linter 都能抓到——而是**用 `null` 來停掉計時器**。用 `useInterval`,這個模式直接可用:

```tsx
import { useInterval } from "@reactuses/core";

function Polling({ active, onTick }: { active: boolean; onTick: () => void }) {
  useInterval(onTick, active ? 5000 : null);
  return null;
}
```

`active` 翻成 `false` 時,delay 變成 `null`,interval 被清掉。翻回來時,interval 以新的 delay 重啟。沒有 `useEffect`、沒有 ref 雜耍、沒有「我是不是在 `active` 的正確取值上清理了」那種擔心。

如果你傾向於從 hook 外面顯式 pause/resume(比如使用者離線時暫停輪詢),用 `controls: true` 選項把控制權拿走:

```tsx
const { isActive, pause, resume } = useInterval(refresh, 5000, {
  controls: true,
  immediate: true,
});

useEffect(() => {
  const onVisibilityChange = () =>
    document.hidden ? pause() : resume();
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => document.removeEventListener("visibilitychange", onVisibilityChange);
}, [pause, resume]);
```

光這一段就修了一類在正式環境裡到處都是的 bug:使用者切到別的標籤頁之後,輪詢還在全速跑,燒電池,燒速率限制的額度。

### 為什麼不用 setInterval + 漂移修正?

`setInterval` 不保證兩次呼叫之間是精確的 delay——頁面被節流時(背景標籤頁、電量低、Chrome 的 "intensive throttling")瀏覽器可能延遲或合併回呼。對一個輪詢迴圈,這沒事。對一個時鐘顯示,這是肉眼可見的錯:跑了 60 個「每秒一次」的 tick 之後,顯示的時間可能比真實牆鐘慢一兩秒。

對時鐘這種東西,不要用 `useInterval` 驅動顯示值。用 `useInterval` 排程重新渲染,渲染裡讀 `Date.now()`:

```tsx
function Clock() {
  const [, force] = useState(0);
  useInterval(() => force((n) => n + 1), 1000);
  return <span>{new Date().toLocaleTimeString()}</span>;
}
```

interval 可以漂,顯示的時間在每次渲染時新鮮讀出。漂移變成排程問題,不再是正確性問題。

## 4. useCountDown——小時分鐘秒,不用自己算日期

倒數計時是帶額外責任的 interval:追蹤剩餘時間、格式化顯示、歸零時觸發回呼、之後停掉計時器。元件層面的實作大概是 30 行程式碼,每個人都至少寫過一次。

`useCountDown(time, format?, callback?)` 回傳 `[小時, 分鐘, 秒]` 三個字串(零填充)的元組,並把上面這些事都做了:

```tsx
import { useCountDown } from "@reactuses/core";

function OtpResend({ onExpire }: { onExpire: () => void }) {
  const [h, m, s] = useCountDown(60, undefined, onExpire);
  const expired = h === "00" && m === "00" && s === "00";

  return expired
    ? <button onClick={() => /* 再請求一次 */ undefined}>重新傳送驗證碼</button>
    : <span>{m}:{s} 後可重發</span>;
}
```

hook 擁有 interval、剩餘時間狀態和回呼分派。元件擁有渲染決策。如果你想要不同的格式(比如 `X 分 Y 秒` 或者純秒數),傳一個 `format` 函式,它接受剩餘秒數回傳三個字串——hook 在每個 tick 上呼叫它,回傳你給的東西。

`useCountDown` 在時間歸零後會鉗到 `["00", "00", "00"]`,且拒絕溢出超過 99 小時,所以你不用在檢視層防禦奇怪的輸入。

## 5. useRafFn——需要 60fps,而不是「大概每秒一次」

`setInterval(fn, 16)` 是「每幀跑一次」的錯誤寫法。瀏覽器已經有「每幀一次、跟顯示更新同步、標籤頁隱藏時跳過」的原語——`requestAnimationFrame`。`useRafFn(callback, initiallyActive?)` 是它的 React 封裝。

回呼收到當前的高解析度時間戳(就是 `requestAnimationFrame` 傳給回呼的那個值),hook 回傳 `[stop, start, isActive]`。

一個 canvas 粒子模擬、一段流暢的捲動位置讀取、一個 CSS 變數驅動的動畫——任何需要每幀更新的東西都該用 `useRafFn`:

```tsx
import { useRafFn } from "@reactuses/core";
import { useRef } from "react";

function FollowCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { target.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useRafFn(() => {
    // 每幀朝目標做一次類似彈簧的 lerp
    current.current.x += (target.current.x - current.current.x) * 0.15;
    current.current.y += (target.current.y - current.current.y) * 0.15;
    if (ref.current) {
      ref.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
    }
  });

  return <div ref={ref} className="follower" />;
}
```

注意兩件事。第一,動畫**沒有**呼叫 `setState`。直接往 `ref.current.style` 推,把工作放在 React 的渲染週期之外——這是在一個非平凡頁面上拿到真正 60fps 的唯一方式。第二,標籤頁隱藏時,瀏覽器會自動停掉 `requestAnimationFrame`——沒有 `useInterval` 風格的節流斷崖,普通情況也不用手寫暫停邏輯。

如果你確實想要手動控制(比如只在面板打開時動畫),第二個引數傳 `false`,在你的 effect 裡呼叫 `start()`/`stop()`。

## 6. useRafState——你真的要重新渲染時的動畫的批次處理 state

`useRafFn` 在你能直接改 DOM 時很棒。有時候你不能——你必須把新值推進 React state,因為它驅動了一棵 JSX 子樹。naive 版長這樣:

```tsx
const [pos, setPos] = useState({ x: 0, y: 0 });
// ……滑鼠移動時每秒 60 次 setPos
```

能跑,但每次 `setPos` 都觸發渲染。如果游標比 60Hz 更快地觸發 `mousemove`(有些瀏覽器就是),你會得到比幀還多的渲染。`useRafState` 透過把 state 更新批次到 `requestAnimationFrame` 解決這個問題——即使 `setState` 之間被呼叫了很多次,每幀最多渲染一次。

```tsx
import { useRafState } from "@reactuses/core";

function CursorBadge() {
  const [pos, setPos] = useRafState({ x: 0, y: 0 });

  useEventListener("mousemove", (e) => {
    setPos({ x: e.clientX, y: e.clientY });
  });

  return <div style={{ left: pos.x, top: pos.y }} className="badge" />;
}
```

不管 `mousemove` 觸發多少次,元件每秒最多重新渲染 60 次。它是 `useState` 的一行替換,只要更新源是高頻瀏覽器事件(滑鼠、捲動、resize),目標是 JSX。

事件那邊搭配 [`useEventListener`](https://reactuse.com/effect/useeventlistener/);目標是 DOM 改動時改用 `useRafFn`。

## 什麼時候用哪個

選擇不是偏好問題——每個 hook 對應一種特定形狀的問題:

| 你想要……                              | 用                  |
|---------------------------------------|---------------------|
| N 毫秒後跑一次回呼                    | `useTimeoutFn`      |
| N 毫秒後強制一次重新渲染              | `useTimeout`        |
| 每 N 毫秒跑一次回呼,帶 pause/resume   | `useInterval`       |
| 顯示 hh:mm:ss 剩餘時間                | `useCountDown`      |
| 每幀幹活,不動 React state             | `useRafFn`          |
| 每幀最多更新一次 React state          | `useRafState`       |
| 等使用者停止輸入                      | `useDebounceFn`     |
| 把回呼速率壓到每 N 毫秒一次           | `useThrottleFn`     |

最後兩個——`useDebounceFn` 和 `useThrottleFn`——嚴格說不是計時器 hook,但它們是同一族的。我們在 [React 裡的防抖 vs 節流](/blog/react-debounce-vs-throttle/) 裡講過;一句話版本是「阻止高頻事件觸發得太頻繁」,而不是「把工作排程到未來」。

## 三個 hook 悄悄防住的錯誤

上面這些 hook 讓一些微妙的 bug 寫不出來。

### 錯誤 1:在 useState 初始化器裡 setTimeout

```tsx
const [id] = useState(() => setTimeout(callback, 1000)); // 錯
```

這會排程一個在 Strict Mode 故意的雙重呼叫下活下來的計時器,而且沒清理。用 effect 和 ref 來「修」是好幾行。`useTimeoutFn(callback, 1000)` 是一行,在構造上就對雙重呼叫安全。

### 錯誤 2:在 interval 回呼裡讀 state

```tsx
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, []); // 永遠捕獲了 count=0——count 走 0, 1, 1, 1, 1...
```

這是 React 計時器 bug 裡被 Google 搜得最多的那個。在原生 React 裡的修法是函式式更新(`setCount((c) => c + 1)`)或者 ref。在 `useInterval` 裡的修法是「它本來就對」——hook 在內部把最新回呼用 ref 路由了。

### 錯誤 3:在 60fps 上動畫 React state

```tsx
const [x, setX] = useState(0);
useEffect(() => {
  const tick = () => { setX((v) => v + 1); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}, []);
```

一個元件能跑。螢幕上十個,React 的渲染佇列開始掉幀,因為每個 `setState` 都觸發一次完整的協調。`useRafFn` 讓你不走 React 直接改 DOM;`useRafState` 在沒法改 DOM 時把渲染封到每幀一次。兩個都對;上面這個迴圈只是湊巧對了。

## 組裝起來:一個「標籤頁閒置刷新器」

收尾一個小但真實的元件——一個資料卡片,在標籤頁可見且使用者活躍時每 30 秒輪詢一次,並顯示到下一次刷新的倒數計時:

```tsx
import { useInterval, useCountDown } from "@reactuses/core";
import { useState, useCallback } from "react";

function LiveStat({ fetchValue }: { fetchValue: () => Promise<number> }) {
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, m, s] = useCountDown(30);

  const refresh = useCallback(async () => {
    try {
      setValue(await fetchValue());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知錯誤");
    }
  }, [fetchValue]);

  useInterval(refresh, 30_000, { immediate: true });

  return (
    <div className="card">
      <div className="value">{value ?? "—"}</div>
      <div className="footer">
        {error ? `錯誤:${error}` : `${m}:${s} 後重新整理`}
      </div>
    </div>
  );
}
```

`useInterval` 擁有輪詢節奏。`useCountDown` 擁有視覺計時器。兩個互相不知道對方;它們湊巧落在同一個數字上,因為是用同一個常數種下的。兩個 hook,沒有 `useEffect`、沒有 `setTimeout`、沒有 `useRef`。

## 試試看

這篇裡每個 hook 在文件頁都有可跑的 demo。吸收 API 最快的方式是讀 demo、改一個 prop、看看壞在哪:

- [`useTimeout`](https://reactuse.com/effect/usetimeout/)
- [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)
- [`useInterval`](https://reactuse.com/effect/useinterval/)
- [`useCountDown`](https://reactuse.com/state/usecountdown/)
- [`useRafFn`](https://reactuse.com/effect/useraffn/)
- [`useRafState`](https://reactuse.com/state/userafstate/)

`npm install @reactuses/core`(或 `pnpm add @reactuses/core`)裝上,直接 import。沒有 provider、沒有設定、除了 React 16.8+ 之外沒有 peer dependency。完整的 hook 列表和這篇裡所有東西的原始碼在 [reactuse.com](https://reactuse.com)。

別再在 `useEffect` 裡寫 `setTimeout` 了。對的工具存在,而且更短。
