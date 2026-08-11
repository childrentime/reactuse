---
title: "React useMount Hook：只在掛載時執行一次的正確姿勢 (2026)"
description: "useMount 實用指南：在元件出現時精確執行一次程式碼，不再手寫空依賴陣列。涵蓋 useMount 的真實實作、StrictMode 雙重執行陷阱與 useOnceEffect 的解法、useUnmount 的過期閉包坑、掛載時的非同步操作，以及什麼時候還是該用普通 useEffect。TypeScript 優先，SSR 安全。"
slug: react-usemount-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-11
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react usemount, usemount, useMount hook, usemount react, componentDidMount hook, useEffect 只執行一次, useEffect 空依賴陣列, react 掛載時執行, useEffect 執行兩次, react strict mode 雙重渲染, useUnmount, react 掛載 hook, react 生命週期 hooks]
image: /img/og.png
---

# React useMount Hook：只在掛載時執行一次的正確姿勢 (2026)

「元件出現時，把這段程式碼跑一次。」這是 React 裡最常見的 effect 需求——聚焦輸入框、上報埋點、建立連線、讀取瀏覽器 API。所有人的第一反應都是空依賴陣列的 `useEffect`：

```tsx
useEffect(() => {
  trackPageView("/checkout");
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

能用，但代價不小：一個必須記得寫的空陣列（忘了寫，effect 就*每次*渲染都跑）；只要 effect 裡碰了任何外部值，就得加一行 lint 抑制註解；最糟的是——**意圖完全沒有表達出來**。`useEffect(fn, [])` 只說了*怎麼做*，從沒說*為什麼*。半年後，同事為了「修掉 lint 警告」往陣列裡加了個依賴，你的「只跑一次」就悄悄變成了「每次變化都跑」。

[`@reactuses/core`](https://reactuse.com) 裡的 [`useMount`](https://reactuse.com/effect/usemount/) 就是給這個慣用法起了名字：`useMount(fn)` 在每次掛載時精確執行一次 `fn`，而這個名字本身就是文件。本文會講清楚它編譯後到底是什麼、React 18+ StrictMode 讓所有人第一次都愣住的雙重執行、手寫卸載清理裡大多數人沒意識到的過期閉包 bug（以及 [`useUnmount`](https://reactuse.com/effect/useunmount/) 怎麼繞開它）、掛載時的非同步操作，以及同樣重要的——哪些場景*不該*用它。

<!-- truncate -->

## 快速開始

```bash
npm install @reactuses/core
```

```tsx
import { useMount, useUnmount } from "@reactuses/core";
import { useRef } from "react";

function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  useMount(() => {
    inputRef.current?.focus();
  });

  useUnmount(() => {
    console.log("搜尋框已移除");
  });

  return <input ref={inputRef} placeholder="搜尋…" />;
}
```

沒有依賴陣列，沒有 lint 註解，讀程式碼的人不用看函式本體就知道意圖：掛載時執行，僅此而已。

## useMount 到底是什麼

沒有任何魔法——刨去一段僅開發環境的型別檢查，這就是完整實作：

```tsx
export const useMount = (fn: () => void) => {
  useEffect(() => {
    fn?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
```

就這樣：一個空依賴陣列的 `useEffect`，封裝一次，*你*從此不用再寫陣列和抑制註解。從這五行定義能推出三件事：

1. **時機就是 `useEffect` 的時機。** 回呼在元件提交到 DOM 之後觸發——首幀繪製之後，瀏覽器 API 已就緒。它不是 `useLayoutEffect`；如果你需要在繪製前測量並修改，請用 layout effect。
2. **天生 SSR 安全。** effect 在伺服器端根本不會執行，所以 `useMount` 是 SSR 應用裡存取 `window`/`document` 的天然歸宿——和手寫 `useEffect(fn, [])` 同樣的保證，但意圖寫在了名字裡。
3. **回傳值會被忽略。** `useMount` 呼叫 `fn?.()` 後丟棄結果——它**不會**把回傳的函式轉交給 React 作為清理函式。清理屬於 `useUnmount`（見下文）。這個設計還有個副產品：傳 `async` 函式是安全的，這一點裸的 `useEffect` 可做不到（稍後細說）。

有一個推論需要刻進腦子裡：因為依賴陣列是空的，回呼閉包捕獲的是**首次渲染的值**。在 `useMount` 裡讀到的 props 和 state 被凍結在初始值。對掛載 effect 來說這幾乎總是你想要的——但如果你發現自己想在裡面讀到最新值，那就是訊號：你真正需要的是帶依賴的 `useEffect`，或者一個 [`useLatest`](https://reactuse.com/state/uselatest/) ref。

## StrictMode 陷阱：「為什麼我的掛載 effect 跑了兩次？」

搜「useEffect 執行兩次」，你會看到十年的困惑。短版本是：從 React 18 起，**開發環境**下的 `<StrictMode>` 會故意把每個元件掛載、卸載、再掛載一遍。任何掛載 effect——`useEffect(fn, [])` 也好、`useMount` 也好——在開發環境都會跑兩次。正式環境只跑一次。

React 是故意的，為的是暴露那些不會自我清理的 effect。官方建議是：別對抗雙重執行，把 effect 寫成**冪等**的——跑兩次應該無害，因為清理函式會撤銷第一次的效果：

```tsx
useMount(() => {
  const controller = new AbortController();
  fetch("/api/config", { signal: controller.signal }).then(applyConfig);
  // 配合 useUnmount(() => controller.abort())
});
```

但有些 effect *確實*只該發生一次，跑兩次是真 bug 而不是衛生警告：埋點上報發了兩次、歡迎 toast 彈了兩次、支付意向在開發環境建立了兩次然後 QA 開了工單。針對這些場景，`@reactuses/core` 提供了 [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/)：

```tsx
import { useOnceEffect } from "@reactuses/core";

useOnceEffect(() => {
  trackPageView("/checkout"); // 只觸發一次，StrictMode 下也是
});
```

內部的技巧很精巧：`useOnceEffect` 在執行前把每個 effect 函式記錄進一個 `WeakSet`。StrictMode 的重掛載複用的是*同一次渲染*產生的*同一個* effect 函式實例，第二次呼叫發現已被記錄，直接跳過。而真正的重新掛載（元件真的離開又回來）會產生新的函式，照常執行——恰好就是「每次掛載一次、無視 StrictMode 彩排」的語義。

經驗法則：**預設 `useMount` + 冪等；當雙重觸發會被使用者或後端觀察到時，用 `useOnceEffect`。**

## useUnmount——以及它避開的過期閉包坑

最直覺的手寫卸載清理，藏著一個大多數人上線了都沒發現的 bug：

```tsx
// ⚠️ 手寫版本
useEffect(() => {
  return () => {
    saveDraft(draft); // 第一次渲染的 draft——永遠是空字串！
  };
}, []); // 空依賴 ⇒ 清理閉包建立於第 1 次渲染
```

清理函式在首次渲染時建立，捕獲的是首次渲染的 `draft`。三分鐘、四十次按鍵之後元件卸載，它儲存的是一個空字串。把 `draft` 加進依賴陣列的「修法」更糟——清理函式變成每次按鍵都執行，而不是卸載時執行。

[`useUnmount`](https://reactuse.com/effect/useunmount/) 正確地解決了這個問題。它內部把你的回呼存進一個每次渲染都更新的 [`useLatest`](https://reactuse.com/state/uselatest/) ref，卸載清理時透過 ref 呼叫：

```tsx
import { useUnmount } from "@reactuses/core";

function Composer() {
  const [draft, setDraft] = useState("");

  useUnmount(() => {
    saveDraft(draft); // ✅ 最後一次渲染時的 draft
  });

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

你的回呼精確執行一次、在卸載時執行、並且看到最新的 state。這就是清理邏輯讀取 state 或 props 時應該用 `useUnmount` 而不是 `return () => {}` 慣用法的具體理由——它不是語法糖，是 bug 修復。

## 掛載時的非同步操作

裸 `useEffect` 出了名地拒絕非同步函式——`useEffect(async () => {...}, [])` 遞給 React 的是一個 Promise，而 React 期望的是清理函式，結果是一條警告加一個被跳過的清理。而 `useMount` 會丟棄回呼的回傳值，所以非同步回呼完全沒問題：

```tsx
useMount(async () => {
  const user = await fetchCurrentUser();
  setUser(user);
});
```

它不提供的是對「元件在 `await` 中途卸載」的保護——卸載後呼叫 `setUser` 在 React 18+ 裡無害，但往往仍不是你想要的（你可能正在寫入一個會被重新掛載的實例覆蓋的狀態）。庫裡有兩個答案：

- [`useMountedState`](https://reactuse.com/state/usemountedstate/) 回傳一個由 ref 支撐的 `isMounted()` 函式——每個 `await` 之後檢查一下：

  ```tsx
  const isMounted = useMountedState();

  useMount(async () => {
    const user = await fetchCurrentUser();
    if (isMounted()) setUser(user);
  });
  ```

- [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/) 把這個模式泛化到帶依賴的 effect，給你的非同步函式本體一個存活檢查，並支援清理。

真正的資料請求——帶快取、去除重複、重試——這兩個都會不夠用，那是 React Query / SWR 或框架 loader 的領域。`useMount` 負責的是邊緣處那些一次性的命令式操作。

## 鏡像需求：跳過掛載

有時你要的恰恰相反——回應*變化*，但不回應首次掛載。把篩選條件同步到 URL，但首次載入不要改寫 URL；設定變更時提示「已儲存」，但剛進頁面時不要提示。這就是 [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)，以及它的底層兄弟 [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/)——後者只做一件事：告訴你當前是不是首次渲染：

```tsx
import { useUpdateEffect } from "@reactuses/core";

useUpdateEffect(() => {
  syncFilterToUrl(filter); // filter 變化時執行，跳過掛載
}, [filter]);
```

這四個 hook 合起來，覆蓋了 class 時代用 `componentDidMount` / `componentDidUpdate` / `componentWillUnmount` 拼出來的整套生命週期詞彙：

| 你想讓程式碼執行的時機… | 用哪個 |
| --- | --- |
| 一次，元件出現之後 | [`useMount`](https://reactuse.com/effect/usemount/) |
| 一次，StrictMode 開發環境雙重執行下也只一次 | [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/) |
| 元件被移除時，且能讀到最新 state | [`useUnmount`](https://reactuse.com/effect/useunmount/) |
| 僅在更新時，跳過首次渲染 | [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) |
| 按「是否首次渲染」做條件分支 | [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) |

## 什麼時候*不該*用 useMount

誠實環節。`useMount` 是給一個真實 React 原語起名字的糖，而有些時候原語本身才是對的：

- **effect 讀取的 prop 或 state 會變化。** 如果 `roomId` 變了需要重連，那就是 `useEffect(connect, [roomId])`——在這裡用掛載 hook 是一個披著便利 API 外衣的同步 bug。這種情況下空陣列不是繁文縟節，是錯的。
- **你在為渲染取伺服器端資料。** 框架 loader、React Query、SWR——任何帶快取、去除重複、重新驗證的方案都勝過掛載 effect 裡的一次 fetch。React 官方文件自己都不再把「在 useEffect 裡 fetch」當主推模式了。
- **你需要繪製前測量。** `useMount` 在繪製之後。先測量再修改的工作屬於 layout effect。
- **「掛載事件」其實是使用者事件。** 如果程式碼可以放在導致元件出現的那次點擊的處理函式裡，就放在那裡——effect 是用來和外部系統同步的，不是雜物抽屜。

檢驗只需一個問題：*元件存活期間，這段程式碼有沒有可能需要重新執行？*只要答案是任何形式的「是，當 X 變化時」，你要的就是 `useEffect` 加依賴陣列。如果是乾脆的「否」，`useMount` 會把這件事說出來，而 `[]` 永遠不會。

## 要點回顧

- `useMount(fn)` 就是把意圖寫進名字的 `useEffect(fn, [])`——沒有會忘寫的陣列、沒有 lint 抑制註解；首次渲染閉包語義應該擁抱，而不是對抗。
- React 18+ 開發環境 StrictMode 下所有掛載 effect 都跑兩次。預設把 effect 寫成冪等；當雙重觸發對使用者或後端可見時，用 [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/)。
- 空依賴 + 手寫 `return () => {}` 清理會捕獲首次渲染的 state——是真實存在、正在線上跑的 bug。[`useUnmount`](https://reactuse.com/effect/useunmount/) 透過 latest-ref 讀取，看到的是最終 state。
- `useMount` 接受 `async` 回呼（回傳值被丟棄）；`await` 之後的狀態寫入用 [`useMountedState`](https://reactuse.com/state/usemountedstate/) 守衛，或改用 [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/)。
- 只回應變化的 effect，用鏡像 hook [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)。

`useMount`、`useUnmount`、`useOnceEffect` 以及另外 110+ 個 SSR 安全、TypeScript 優先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 裡——一次安裝，可 tree-shake，零依賴負擔。

```bash
npm install @reactuses/core
```
