---
title: "React useDebounce Hook：給狀態與回呼做防抖（2026）"
description: "一篇實用的 useDebounce 上手指南：給一個值做防抖、給一個回呼做防抖，以及取消（cancel）或立即執行（flush）待處理的呼叫——而不會帶上手寫 setTimeout 版本那些必然出現的過期閉包 bug。SSR 安全、TypeScript 優先。"
slug: react-usedebounce-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-29
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useDebounce, useDebounce hook, react 防抖輸入, react 防抖 hook, usedebounce react, react 防抖狀態, react 防抖回呼, useDebounceFn, react 搜尋框防抖, react 防抖 typescript, ssr 安全防抖, react 防抖 api 請求, lodash debounce react, react 防抖 onChange]
image: /img/og.png
---

# React useDebounce Hook：給狀態與回呼做防抖（2026）

你有一個搜尋框。使用者輸入 `react hooks`，你的元件就在每一次按鍵上發一個 API 請求——一個查詢發了十一個請求，其中十個在回傳時早就過期了。所有人都會想到的修法是**防抖（debounce）**：等輸入停下來，再發一次。而所有人都會寫錯的修法，是在元件裡用 `setTimeout` 手寫這個防抖——過期閉包、漏掉的清理、re-render 抖動，會悄悄把它弄壞。

`useDebounce` 就是把這件事做對的那個 hook。本文講清楚你真正需要的兩種形態——給**值**做防抖、給**回呼**做防抖——什麼時候用哪個，以及怎麼 `cancel`（取消）或 `flush`（立即執行）待處理的呼叫。這裡寫的全是真實的 [`@reactuses/core`](https://reactuse.com) API，SSR 安全且帶型別。

<!-- truncate -->

## 為什麼不直接用 setTimeout？

防抖本身很簡單：把一個函式推遲到一段安靜期之後再執行，每來一次新呼叫就重置計時器。（如果你想要完整的概念拆解——以及它和節流的差別——見 [React 中的防抖 vs 節流](https://reactuse.com/blog/react-debounce-vs-throttle/)。）難的是在 *React 元件裡*做這件事。下面是最直覺的寫法，它帶了三個 bug：

```tsx
function Search() {
  const [query, setQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetchResults(value); // 🐛 見下文
    }, 300);
  }

  return <input value={query} onChange={handleChange} />;
}
```

1. **卸載時會洩漏。** 如果元件在計時器待處理時卸載，回呼依然會在 300 ms 後觸發——往往是給一個已經消失的元件 setState，或者為使用者早已離開的頁面打 API。
2. **它會捕捉過期的值。** 一旦你防抖的不是原始事件值——而是第二個 state、一個 prop、一個衍生值——閉包凍結的是計時器*設定時*的它們，而不是*觸發時*的。
3. **它會到處複製。** 每個需要防抖的地方都重寫一遍 `useRef` + `clearTimeout`，每份複本都是一次忘掉清理的機會。

一個 hook 在一個地方把這三件事都修好。ReactUse 提供了兩個，內部基於久經考驗的 `lodash.debounce`，所以那些邊角情況（前沿觸發、最大等待、後沿觸發）都已經處理好了。

## useDebounce —— 給值做防抖

最常見的場景：你有一個快速變化的值，你想要它的*第二份*、滯後的複本，只在一切都穩定下來之後才更新。那份複本才是你餵給昂貴運算的東西。

```tsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@reactuses/core';

function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="搜尋…"
    />
  );
}
```

簽名是 `useDebounce(value, wait?, options?)`，它回傳防抖後的值，型別和輸入一致：

```ts
const debounced = useDebounce(value, 300);
```

輸入（`query`）在每次按鍵都更新，所以受控的 `<input>` 始終跟手——這是你綁到 DOM 上的值。輸出（`debouncedQuery`）只在使用者停止輸入 300 ms 後才追上，所以它是你放進 effect 相依陣列裡的值。API 變成每次停頓發一次、而不是每次按鍵發一次，而你的輸入框永遠不卡，因為你打字進去的那個東西從來就不是被防抖的那個。

這套模式——給 UI 用快值、給副作用用防抖後的值——就是全部要點。把它們保持成兩個獨立的變數，其餘的自然就順了。

## useDebounceFn —— 給回呼做防抖

給值做防抖在「你想限制的東西是 *state*」時很好用。但有時候你想防抖的是一個帶參數的**動作**——自動儲存、埋點、resize 處理——而不想先繞過 state。那就是 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)：

```tsx
import { useDebounceFn } from '@reactuses/core';

function Editor({ docId }: { docId: string }) {
  const { run } = useDebounceFn((content: string) => {
    saveDraft(docId, content);
  }, 1000);

  return (
    <textarea onChange={(e) => run(e.target.value)} />
  );
}
```

`useDebounceFn(fn, wait?, options?)` 回傳一個帶三個成員的物件：

```ts
const { run, cancel, flush } = useDebounceFn(fn, 1000);
```

- **`run`** —— 防抖後的函式。你想呼叫多少次就呼叫多少次；`fn` 只在呼叫停下來 `wait` ms 之後才真正執行。它會把所有參數透傳過去，所以 `run(content)` 會呼叫 `fn(content)`。
- **`cancel`** —— 丟棄任何待處理的呼叫。什麼都不會觸發。
- **`flush`** —— *立刻*觸發待處理的呼叫，而不是等計時器走完。

關鍵在於，`run` 永遠呼叫你**最新**版本的 `fn`。hook 內部把你的回呼存在一個 ref 裡，所以即便防抖包裝只建立一次，它也永遠不會過期——`setTimeout` 版本裡那個 `docId` 閉包問題在這裡根本不存在。而且這個 hook 在卸載時會自動取消任何待處理的呼叫，所以 bug #1 也沒了。

> `useDebounce` 其實就是*構建在* `useDebounceFn` 之上的——它給一次 `setState` 呼叫做防抖，然後把結果值交給你。同一個引擎，兩種手感。

### cancel 和 flush 的實戰

`cancel`/`flush` 這一對，正是裸 `setTimeout` 做起來很痛、而 hook 做起來很簡單的地方。兩個真實例子：

```tsx
function CommentBox() {
  const { run: autosave, cancel, flush } = useDebounceFn(
    (text: string) => saveDraft(text),
    2000,
  );

  return (
    <>
      <textarea onChange={(e) => autosave(e.target.value)} />
      {/* 使用者點了「發布」—— 立刻持久化，別等那 2 秒 */}
      <button onClick={() => flush()}>發布</button>
      {/* 使用者點了「丟棄」—— 扔掉待處理的自動儲存 */}
      <button onClick={() => cancel()}>丟棄</button>
    </>
  );
}
```

`flush` 保證在發出 post 請求之前，飛行中的草稿已經寫下；`cancel` 保證被丟棄的草稿不會在一拍之後又被儲存。兩者都只是一次呼叫。

## 用值還是用回呼？

一個快速判斷規則：

- 當你防抖的是某個會被別處讀取的 **state** 時——搜尋詞、篩選條件、餵給圖表的滑桿值——用 **`useDebounce`**。你要的是一個滯後的*值*。
- 當你防抖的是一個**帶參數的動作**時——自動儲存、打日誌、直接發網路請求——用 **`useDebounceFn`**。你要的是一個滯後的*函式*，外加 `cancel`/`flush` 控制。

如果你發現自己建立一個 state *只是*為了防抖它、然後馬上觸發一個 effect，那 `useDebounceFn` 通常是更直接的工具。

## 調參：leading、trailing 和 maxWait

可選的第三個參數會原樣傳給 `lodash.debounce`，所以你拿到的是它完整的選項物件：

```ts
useDebounce(value, 300, {
  leading: false,  // 第一次呼叫時不觸發（預設）
  trailing: true,  // 停頓之後觸發（預設）
  maxWait: 1000,   // …但總等待永遠不超過 1 秒
});
```

兩個值得知道的旋鈕：

- **`leading: true`** 在*第一次*呼叫時立刻觸發，然後再對其餘呼叫做防抖。適合「先即時回應、再穩定下來」的互動——按鈕的第一次點擊很跟手，而快速連點會被吸收。
- **`maxWait`** 給總延遲封頂。純後沿防抖下，一個連續打字十秒的使用者在停下來之前會得到*零*次更新。`maxWait: 1000` 強制在 burst 中途至少每秒更新一次——這就是一個「活著的」搜尋框和一個「凍住的」搜尋框之間的差別。

## SSR 安全

這兩個 hook 在伺服器端渲染時都是安全的。它們在 render 期間不碰任何 `window`、`document` 或瀏覽器計時器——防抖的工作只在 effect 裡跑，而 React 從不在伺服器端執行 effect。把它們丟進 Next.js、Remix 或 Astro 元件，不用寫 `typeof window` 守衛，也不用追 hydration 警告。（如果 SSR 安全是你程式碼庫裡反覆出現的主題，[SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) 講得更深。）

## 限流家族

`useDebounce` 在 ReactUse 裡有三個近親；按*你在限制什麼*以及*你要哪種形態*來挑：

| Hook | 限制的是… | 策略 |
| --- | --- | --- |
| [`useDebounce`](https://reactuse.com/state/usedebounce/) | 值 | 防抖（停頓後觸發） |
| [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) | 回呼 | 防抖，帶 `cancel`/`flush` |
| [`useThrottle`](https://reactuse.com/state/usethrottle/) | 值 | 節流（固定頻率觸發） |
| [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) | 回呼 | 節流，帶 `cancel`/`flush` |

節流這一對和防抖這一對完全對稱——同樣的 `(value/fn, wait, options)` 簽名、同樣的回傳形態——但它強制一個穩定的節奏，而不是等到安靜。該用節流的是那些應該在*連續手勢進行中*更新的東西（捲動位置、拖曳座標、即時進度讀數）；該用防抖的是那些應該只在手勢*結束後*更新的東西（搜尋、自動儲存、驗證）。完整的心智模型在 [React 中的防抖 vs 節流：什麼時候用哪個](https://reactuse.com/blog/react-debounce-vs-throttle/)。

## 重點回顧

- 在元件裡手寫的 `setTimeout` 防抖預設就帶三個 bug：卸載時洩漏、捕捉過期閉包、到處被複製。
- **`useDebounce(value, wait)`** 給你一個值的滯後複本——往快的那個裡打字，用慢的那個跑 effect。搜尋框即時建議的完美選擇。
- **`useDebounceFn(fn, wait)`** 給一個動作做防抖，並交給你 `{ run, cancel, flush }`。`run` 永遠呼叫你最新的回呼（沒有過期閉包），並在卸載時自動取消。
- 用 `flush` 提前提交一個待處理的呼叫（提交），用 `cancel` 丟棄它（丟棄）。
- 第三個參數就是 `lodash.debounce` 的選項——`leading` 實現首呼即觸發，`maxWait` 給延遲封頂，讓長 burst 也能更新。
- 兩者都 SSR 安全，並和 `useThrottle`/`useThrottleFn` 一起覆蓋固定頻率的場景。

從 [`@reactuses/core`](https://reactuse.com/state/usedebounce/) 拿走它們，把你的 `clearTimeout` 樣板程式碼刪掉吧。
