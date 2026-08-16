---
title: "React useLatest Hook：在非同步回呼裡讀到最新狀態 (2026)"
description: "useLatest 實用指南：為什麼 setTimeout、await、訂閱和第三方 SDK 裡的回呼總讀到過期的 props 和 state，五行的 useLatest ref 如何在不重啟任何東西的前提下解決它，為什麼 ref 是在 layout effect 裡寫而不是渲染期間寫，useLatest vs useRef vs useEvent vs useEffectEvent，非同步儲存與請求競態兩種模式，以及唯一一條鐵律——永遠不要在渲染期間讀它。TypeScript 優先，SSR 安全。"
slug: react-uselatest-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-16
tags: [react, hooks, state, typescript, tutorial]
keywords: [react uselatest, uselatest, uselatest react, useLatest hook, uselatestref, react 最新值 ref, react 過期閉包, react settimeout 裡的過期狀態, react 回呼裡的過期 props, react ref 最新值, useref 最新狀態, react 非同步回呼 過期狀態, react await 之後讀最新狀態, useLatest vs useRef, useLatest vs useEvent, useEffectEvent 替代方案]
image: /img/og.png
---

# React useLatest Hook：在非同步回呼裡讀到最新狀態 (2026)

這是一個會對使用者撒謊的自動儲存按鈕：

```tsx
function Editor({ docId }: { docId: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "dirty">("idle");

  async function save() {
    setStatus("saving");
    await api.save(docId, text);
    setStatus("saved"); // ⚠️ 但使用者在 await 期間還在打字……
  }

  return (
    <>
      <textarea value={text} onChange={e => setText(e.target.value)} />
      <button onClick={save}>Save</button> <em>{status}</em>
    </>
  );
}
```

請求耗時 800 毫秒。請求在飛的時候使用者又敲了三個詞。Promise 兌現，`status` 翻成 `"saved"`，而那三個新詞根本沒被儲存。在 `save` 裡面，`text` 是按鈕被點擊那一刻的值——JavaScript 閉包捕獲了那次渲染的值，之後再多的重新渲染也改不了它。要在 `await` 之後判斷到底是 `"saved"` 還是 `"dirty"`，你需要知道 `text` *現在*是什麼，而閉包告訴不了你。

這就是**過期閉包**（stale closure），任何一個活得比建立它的那次渲染更久的回呼都會遇到：`setTimeout`、`setInterval`、`await` 之後的程式碼、只註冊一次的事件監聽器、`IntersectionObserver` 和 `ResizeObserver` 的回呼、WebSocket 的 `onmessage`，以及每一個在構造時接收回呼的第三方 SDK。React 官方 FAQ 對*"為什麼我在函式里看到的是過期的 props 或 state？"*給出的答案，就是一個永遠持有最新值的 ref。[`@reactuses/core`](https://reactuse.com) 裡的 [`useLatest`](https://reactuse.com/state/uselatest/) 就是把這個 ref 打包好：五行程式碼，不觸發重新渲染，沒有依賴陣列。本文會講清楚它是什麼、為什麼實現裡是在 layout effect 而不是渲染期間寫 ref、它跟 `useRef`、[`useEvent`](https://reactuse.com/effect/useevent/) 和 React 的 `useEffectEvent` 是什麼關係、它為哪些模式而生，以及你必須遵守的唯一一條規矩。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useLatest } from "@reactuses/core";
import { useState } from "react";

function Editor({ docId }: { docId: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "dirty">("idle");
  const latestText = useLatest(text);

  async function save() {
    const snapshot = text; // 閉包：我們要發出去的是什麼
    setStatus("saving");
    await api.save(docId, snapshot);
    // ref：使用者現在手上的是什麼
    setStatus(latestText.current === snapshot ? "saved" : "dirty");
  }

  // …
}
```

`useLatest(value)` 返回一個 `MutableRefObject<T>`，它的 `.current` 永遠是最近一次渲染的 `value`。ref 物件本身的身份從不改變，所以在任何地方閉包捕獲它都是安全的——定時器、Promise、訂閱——等回呼最終執行時再讀就行。注意修好的版本*同時*用了閉包和 ref：閉包是點擊那一刻的值（回答"我們發了什麼？"是對的），ref 是 Promise 兌現那一刻的值（回答"它還是最新的嗎？"是對的）。過期閉包不是 JavaScript 的 bug；只有當你想要的是*現在*、拿到的卻是*那時*，它才是 bug。

## useLatest 到底是什麼

`@reactuses/core` 裡的完整實現：

```tsx
import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "@reactuses/core";

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
```

就這些。一個只建立一次的 ref，每當 `value` 變化就覆寫它的 `.current`。有兩個細節值得弄明白，因為手寫版本的差異正在這裡。

**為什麼用 layout effect，而不是在渲染函式體裡直接 `ref.current = value`？** 幾個流行實現（react-use、ahooks）就是在渲染期間賦值的，絕大多數時候也能用。但 React 的規則要求渲染必須是純的——渲染期間不讀也不寫 `ref.current`——因為在併發渲染下，一次渲染可以被開始、暫停，然後在從未提交的情況下*直接丟棄*。在一次被丟棄的渲染裡寫下的 ref，現在持有的是一個沒有任何已提交 UI 顯示過的值。在 `useLayoutEffect` 裡寫，意味著 ref 每次**已提交**的渲染恰好更新一次，在 DOM 更新之後、瀏覽器繪製之前同步完成。這跟 [React `useEvent` RFC](https://github.com/reactjs/rfcs/blob/main/text/0000-useevent.md) 用的是同一個技巧，也是為什麼 `@reactuses/core` 的 `useEvent`、`useInterval`、`useTimeoutFn` 和另外十幾個 hook 都建在 `useLatest` 之上，而不是裸的渲染期賦值。

**為什麼不用普通的 `useEffect`？** 時序。passive effect 在繪製之後執行，而同一次提交裡 React 先跑子元件的 effect 再跑父元件的，先跑靠前的 hook 再跑靠後的。如果同一次提交裡有*另一個* effect 在更新用的 effect 之前讀了這個 ref，它看到的就是上一次渲染的值。layout effect 跑在所有 passive effect 之前，所以等到任何 `useEffect`、事件處理器、定時器或 Promise 回呼觸發時，`ref.current` 已經是最新的了。（`useIsomorphicLayoutEffect` 在瀏覽器裡就是 `useLayoutEffect`，在伺服器端就是 `useEffect`，所以沒有 SSR 警告。）

你需要內化的結論是：**`.current` 反映的是最近一次已提交的渲染，它是給回呼讀的，不是給渲染讀的。** 在第 N+1 次更新的渲染期間，`ref.current` 還持有第 N 次的值——這沒問題，因為在渲染裡你本來就該直接讀 `value`。如果你發現自己在 JSX 裡寫 `{latest.current}`，你要的其實是普通的 state。

## useLatest vs useRef vs useState

這三個經常被搞混，因為它們都"存一個值"。關鍵問題是*誰*需要這個值、*什麼時候*需要。

| 你需要…… | 用 |
| --- | --- |
| 渲染這個值，並在它變化時重新渲染 | `useState` |
| 跨渲染儲存一個**不**由 prop/state 派生的可變值（定時器 id、DOM 節點、計數器） | `useRef` |
| 在一個活得比渲染更久的回呼裡讀到**最新**的 prop 或 state | `useLatest` |

`useLatest` 就是 `useRef` 加上一個"幫我保持同步"的 effect。如果你寫過這個：

```tsx
const textRef = useRef(text);
useEffect(() => { textRef.current = text; }, [text]);
```

……那就是 `useLatest(text)`，只差上面說的 layout effect 時序細節。它也比*另一種*常見的變通寫法——在 setter 旁邊把 state 複製進 ref（`setText(v); textRef.current = v;`）——誠實得多，後者一旦有別的東西更新了 `text`（一個重置按鈕、一個 prop、一個表單庫），就會悄無聲息地壞掉。

## useLatest vs useEvent vs useEffectEvent

再看幾個近鄰。三者都是為了對付過期閉包而存在的；區別在於它們包的是什麼。

- **`useLatest(value)`** 包一個**值**，給你一個 ref。你在已有的任何回呼裡讀 `.current`。
- **[`useEvent(fn)`](https://reactuse.com/effect/useevent/)** 包一個**函式**，給你一個穩定的函式，它總是呼叫最新的 `fn`。內部就是 `useLatest(fn)` 加 `useCallback(() => ref.current(...args), [])`。當*回呼本身*就是你要交給子元件、effect 或訂閱的東西，並且你希望它的身份永不改變時用它。
- **`useEffectEvent`**（React 19.2+）是 `useEvent` 的內建版本，但限制只能從 effect 裡呼叫——返回的函式不穩定，不能作為 prop 傳遞，也不能加進依賴陣列。

經驗法則：**包函式用 `useEvent`；包值用 `useLatest`。** 兩者可以組合——經典的"只訂閱一次、對最新狀態做出反應"，通常要麼給處理器套一個 `useEvent`，要麼給它讀的每個值各套一個 `useLatest`，兩種都行。`useLatest` 完勝的場景是回呼根本不歸你包：SDK 的 `onChange`、一個 Promise 的後續、一個你只構造一次的 `Observer`。

## 模式

### 在 `await` 之後

開頭的自動儲存就是這個形狀：任何先 await、然後需要知道世界有沒有變的處理器。第二個常見變體是發生在處理器（而不是 effect）裡的**請求競態**：

```tsx
function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const latestQuery = useLatest(query);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    const items = await api.search(q);
    if (latestQuery.current !== q) return; // 更新的一次按鍵贏了——丟掉這個響應
    setResults(items);
  }

  return <input value={query} onChange={onChange} />;
}
```

在 `useEffect` 裡，你會用 React 文件裡的 `let ignore = false` 清理標誌來做這件事。事件處理器沒有清理的位置，所以由 ref 來承擔"我還相關嗎？"這個檢查。（要對呼叫本身做防抖，看 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)——那是另一個問題。）

### 只建立一次的訂閱

任何建立起來昂貴或有狀態的東西——地圖、圖表、WebSocket、`ResizeObserver`——都應該只建立一次然後*讀取*最新狀態，而不是每敲一個鍵就被拆掉重建：

```tsx
function PinMap({ filters }: { filters: Filters }) {
  const container = useRef<HTMLDivElement>(null);
  const latestFilters = useLatest(filters);

  useEffect(() => {
    const map = new mapboxgl.Map({ container: container.current!, style: STYLE });
    map.on("moveend", () => {
      loadPins(map.getBounds(), latestFilters.current); // 最新的 filters，地圖只建一次
    });
    return () => map.remove();
  }, []); // ✅ 這裡的空依賴是誠實的——裡面沒有任何東西會過期

  return <div ref={container} />;
}
```

沒有這個 ref，你的選擇是把 `filters` 放進依賴（每次篩選變化地圖就銷燬重建——閃爍、丟失視口、重新下載圖磚），或者空依賴陣列外加一條 lint 警告和一個 bug。`useLatest` 給了你第三個選項：這個 effect 真的什麼都不依賴，因為它是透過一個永遠最新的 ref 去讀的。

### 定時器

`setTimeout` 和 `setInterval` 是教科書級的過期閉包製造機：

```tsx
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const latestPaused = useLatest(paused);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!latestPaused.current) onDismiss(); // 第 5 秒正好停留著？那就保持開啟
    }, 5000);
    return () => clearTimeout(id);
  }, []);

  return <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>{message}</div>;
}
```

一次性的以外都別手寫：[`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) 和 [`useInterval`](https://reactuse.com/effect/useinterval/) 已經通過 `useLatest` 保持回呼最新，並在其上加了 `pause`/`resume`/`immediate`——本系列的上一篇 [React useInterval Hook](https://reactuse.com/zh-Hant/blog/react-useinterval-hook/) 就是逐行講這個的。

### @reactuses/core 內部用在哪裡

如果你想在生產程式碼裡看這個模式，`useLatest` 是這個庫很大一塊功能背後默默幹活的主力。[`useEventListener`](https://reactuse.com/effect/useeventlistener/) 用它包住你的處理器，這樣 `addEventListener` 每個元素只跑一次，而不是每次渲染跑一次。[`useClickOutside`](https://reactuse.com/element/useclickoutside/)、[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/)、[`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) 和 [`useMutationObserver`](https://reactuse.com/element/usemutationobserver/) 都只構造一次 observer，然後在裡面呼叫 `savedCallback.current`。[`useRafFn`](https://reactuse.com/effect/useraffn/) 在不取消動畫迴圈的前提下讀最新的幀回呼。[`useUnmount`](https://reactuse.com/effect/useunmount/) 用它保證你在*第一次*渲染時傳入的清理函式，不會在解除安裝時帶著第一次渲染的值執行。同樣的五行，每一次。

## 值得知道的坑

- **它不是響應式的。** 寫或讀 `.current` 從不觸發重新渲染。如果一個變化應該出現在螢幕上，它屬於 state——`useLatest` 是給*讀*的回呼用的，不是給*顯示*的值用的。
- **不要在渲染期間讀它。** 因為 ref 是在 layout effect 裡更新的，在渲染期間它落後一次提交。這是設計使然，從回呼裡讀時永遠不會有問題；但如果你把 `latest.current` 放進 JSX 或 `useMemo`，問題立刻出現。那些地方直接讀值本身。
- **不要把它放進依賴陣列指望它觸發什麼。** ref 的身份在元件整個生命週期裡都是穩定的，所以 `[latestFoo]` 等價於 `[]`。這是特性——意味著讀它的 effect 永遠不會因為它而重跑——但也意味著你不能用它來*響應*變化。
- **滯後視窗是真實存在的，也是極小的。** 在渲染和 layout effect 提交之間，`.current` 是上一次渲染的值。這個窗口裡不會有任何使用者可見的東西執行（沒有事件、沒有定時器、沒有 passive effect），所以實踐中不是問題，而這正是永遠不把被丟棄的渲染洩漏進 ref 所付出的代價。
- **有時候重啟*正是*你要的。** 如果你的 effect 應該在某個值變化時重新執行——`roomId` 變了就重連 socket——那就照常把 `roomId` 放進依賴。`useLatest` 只用於那些回呼應該*不引起重啟*地讀取的值。在同一個 effect 裡兩者混用（依賴裡放 `[roomId]`，裡面讀 `latestFilters.current`）完全正常。
- **SSR 安全。** 它就是一個 ref 加一個同構 layout effect；不碰 `window`，也不會有 hydration 不匹配，因為它從不渲染任何東西。

## 什麼時候不該用 useLatest

- **這個值要顯示出來** → 永遠是 `useState`。
- **你在包一個要交給子元件或 effect 的函式** → [`useEvent`](https://reactuse.com/effect/useevent/)（或者 React 19.2+ 上、只在 effect 內使用的 `useEffectEvent`）。
- **你想要*上一次*渲染的值** → [`usePrevious`](https://reactuse.com/state/useprevious/)——`useLatest` 的映象。
- **你想在 `await` 之後 set state 之前知道元件是否還掛載著** → [`useMountedState`](https://reactuse.com/state/usemountedstate/) 就是那個布林值。
- **"過期"的是定時器或 DOM 回呼** → 你多半想要的是 [`useInterval`](https://reactuse.com/effect/useinterval/)、[`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) 或 [`useEventListener`](https://reactuse.com/effect/useeventlistener/)，它們已經替你把 `useLatest` 這套走完了。

## 要點

- 一個活得比自己那次渲染更久的回呼——定時器、`await`、訂閱、SDK 鉤子——看到的是建立它那次渲染的 props 和 state。這是閉包在盡本分；只有當你需要*現在*卻拿到*那時*，它才是 bug。
- [`useLatest`](https://reactuse.com/state/uselatest/) 是一個在 layout effect 裡與某個值保持同步的 ref：從任何回呼讀都是最新的，從不引起重新渲染，從不改變身份，從不洩漏被丟棄的渲染。
- 值 → `useLatest`。函式 → [`useEvent`](https://reactuse.com/effect/useevent/)。要顯示 → `useState`。上一次渲染 → [`usePrevious`](https://reactuse.com/state/useprevious/)。
- 從回呼裡讀 `.current`，永遠不要從渲染裡讀；把真正的重啟觸發條件（`roomId`、`url`）留在依賴陣列裡——`useLatest` 是給回呼*透過它去讀*的東西用的，不是給*重啟*它的東西用的。

`useLatest`、`useEvent`、`usePrevious` 以及另外 110+ 個 SSR 安全、TypeScript 優先的 hooks 都在 [`@reactuses/core`](https://reactuse.com) 裡——一次安裝，可 tree-shake，沒有需要你照看的依賴。

```bash
npm install @reactuses/core
```
