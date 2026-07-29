---
title: "React usePrevious Hook：追蹤上一次的 State 和 Props（2026）"
description: "一篇實用的 usePrevious 上手指南：為什麼經典的 useRef + useEffect 寫法會在無關的 re-render 之後悄悄回傳錯誤的值、React 官方文件真正推薦的 render 期間 setState 模式、「上一個不同值」的語義、不穩定物件導致無限迴圈的坑，以及什麼時候應該改用 useLatest。TypeScript 優先。"
slug: react-useprevious-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-29
tags: [react, hooks, state, typescript, tutorial]
keywords: [react usePrevious, usePrevious hook, useprevious react, react 上一次 state, react 上一次 props, react 取得之前的值, react 比較前後 state, usePrevious typescript, react useRef 上一個值, react 偵測 state 變化方向]
image: /img/og.png
---

# React usePrevious Hook：追蹤上一次的 State 和 Props（2026）

React 在每次渲染時都會給你 state 和 props 的當前值——但沒有任何內建手段問一句：這個值*之前*是多少？於是所有人都在複製同一份十行的老配方：在 `useEffect` 裡把值塞進 ref，再回傳 `ref.current`。demo 裡它沒問題，上了正式環境也沒問題，直到某一天，一個「計數上升了 ↑」的指示器開始聲稱什麼都沒變——因為元件出於一個完全無關的原因重新渲染了一次，ref 悄悄把自己的歷史覆蓋掉了。

[`@reactuses/core`](https://reactuse.com) 的 `usePrevious` 追蹤的是上一個*不同的值*，而不是上一次*渲染時的值*，用的正是 React 官方文件推薦的模式——沒有 ref，沒有 effect，不會漂移。整個實作只有十二行，所以這篇文章會走一遍經典配方裡的真實 bug、那個看起來「違法」實則合規的修復方式，以及唯一一個可能讓它陷入無限迴圈的坑。TypeScript 優先。

<!-- truncate -->

## 經典配方，以及它在哪裡散架

下面這個版本活在上千篇部落格裡，大概率也活在你的某個程式碼庫裡：

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```

渲染完成後 effect 觸發，把當前值拷進 ref。下一次渲染讀這個 ref——拿到的是一次渲染之前的值。微妙之處就在最後這句話裡：這個 hook 回傳的是上一次**渲染**時的值，不是上一個**值**。這兩者只有在一種情況下才相等：元件重新渲染的*唯一*原因就是這個值變了。而這種情況從來維持不了多久。

看它怎麼壞掉。一個帶方向指示器的計數器，外加一個無關的 state：

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const [dark, setDark] = useState(false);
  const prevCount = usePrevious(count); // ref 版本

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setDark(!dark)}>切換主題</button>
      {prevCount !== undefined && prevCount !== count && (
        <span>{count > prevCount ? "↑ 上升" : "↓ 下降"}</span>
      )}
    </div>
  );
}
```

點 **+1**：`count` 是 5，`prevCount` 是 4，指示器顯示「↑ 上升」。正確。現在點**切換主題**：`count` 一動沒動，但元件重新渲染了，effect 又跑了一次，ref 變成了 5。下一次渲染時 `prevCount === count`，指示器消失了——元件現在堅信計數從來沒變過。任何父元件的 re-render、context 更新、兄弟 state 的變化都會造成同樣的結果。你為「比較」而引入的這個 hook，恰恰把「比較」本身弄壞了。

這不是假想的邊界情況：[react-use](https://github.com/streamich/react-use/issues/2605)、[ahooks](https://github.com/alibaba/hooks/issues/2162)、還有 [reactuse 自己](https://github.com/childrentime/reactuse/issues/115)，都被回報過一模一樣的問題，直到實作被替換掉。

## usePrevious——上一個*值*，不是上一次*渲染*

```tsx
import { useState } from 'react';
import { usePrevious } from '@reactuses/core';

function Counter() {
  const [count, setCount] = useState(0);
  const [dark, setDark] = useState(false);
  const prevCount = usePrevious(count);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setDark(!dark)}>切換主題</button>
      <p>現在：{count}，之前：{prevCount ?? "—"}</p>
    </div>
  );
}
```

簽名：

```ts
function usePrevious<T>(value: T): T | undefined;
```

主題隨便切多少次——`prevCount` 始終是 4，因為計數確實沒變過。首次渲染時它回傳 `undefined`，因為此時還不存在「之前的值」；寫比較邏輯時按 `T | undefined` 來標註型別。

[實作](https://reactuse.com/state/useprevious/)短到可以全文引用，而且裡面沒有任何 ref、任何 effect：

```ts
export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T>();

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}
```

## 等等——render 期間 setState？

對，而且這不是黑魔法：它就是 React 官方文件裡的模式，出處是 [*storing information from previous renders*](https://react.dev/reference/react/useState#storing-information-from-previous-renders)。在渲染期間呼叫 setter 在兩個條件下是合法的，這段程式碼兩條都滿足：

- **改的是元件自己的 state。** React 處理 render 期間更新的方式是：丟棄當前這次渲染的輸出，立刻帶著新 state 重新執行元件——在碰 DOM 之前、在繪製之前、在任何 effect 執行之前。使用者永遠看不到中間畫格。
- **它被一個終會安靜下來的條件守著。** `value !== current` 只在值變化後的那一次渲染裡為真；重跑時 `value === current`，直接落空。不會迴圈。

對比一下兩個版本各自錨定的「歷史」。ref 配方記錄的是「上一次渲染時值是多少」——所以*每一次*渲染都會改寫歷史，不管相關不相關。state 版本記錄的是「值上一次*變化*之前是多少」——無關的 re-render 撞上 `value === current`，什麼都不碰。這一個判斷條件就是整個 bug 修復。

在 React 18 更嚴格的執行模型下它也站得住，而 effect + ref 的版本反而更搖晃。StrictMode 在開發環境會把渲染函式執行兩遍：這裡第二遍跑的是同樣的比較、對著同樣的 state、落到同樣的結果——冪等。並行特性可能在提交前把一次渲染整個丟掉：被丟棄的渲染裡的 state 更新會跟著一起被丟棄，而在渲染期間改 ref（另一種流行的「修法」）會逃逸出這次渲染，洩漏到一條官方口徑裡從未發生過的時間線上。render 期間 setState 是唯一在所有這些場景下都正確的變體。

## 那個坑：不穩定的物件

比較用的是 `!==`——嚴格參考相等。每次渲染都餵給 hook 一個新的物件字面值，`value !== current` 就*永遠*為真：

```tsx
// 💥 Too many re-renders
const prev = usePrevious({ x: position.x, y: position.y });
```

每次渲染建立一個新物件，守衛條件觸發，render 期間的 setState 引發重跑，重跑又建立*另一個*新物件，最後 React 用「Too many re-renders」把整件事攔停。修復方式就是常規的參考穩定性紀律：傳原始值，或者用 memo 讓物件只在內容變化時才換身分：

```tsx
const point = useMemo(() => ({ x, y }), [x, y]);
const prevPoint = usePrevious(point); // ✅
```

原始值——數字、字串、布林——永遠安全，而它們涵蓋了你九成的使用場景。（如果你真正的問題是「當一個深層巢狀物件*真的*變化時才執行 effect」，那是 [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 的活，不歸這個 hook 管。）

## usePrevious vs useLatest

這兩個經常被搞混，因為它們都是「跨時間持有一個值的 hook」，但它們回答的是相反的問題：

- [`usePrevious`](https://reactuse.com/state/useprevious/) 回答的是**「這個值在變化之前是多少？」**——用於渲染期間的比較：變化方向、from/to 標籤、狀態遷移偵測。
- [`useLatest`](https://reactuse.com/state/uselatest/) 回答的是在一個過期閉包裡**「這個值現在是多少？」**——`setInterval` 回呼、防抖過的處理函式、掛載時註冊一次的事件監聽器。

要渲染一個 diff，用 `usePrevious`；某個回呼總是看到舊值，用 `useLatest`。需要其中一個，從來不意味著你需要另一個。

## 真實使用場景

- **變化方向。** 排序箭頭、價格跳動、捲動方向、「↑ 比昨天多 3 個」——一切由 `value > prev` 渲染出來的東西。這正是 ref 配方肉眼可見壞掉的場景，因為一次無關的 re-render 就能抹掉方向。
- **狀態遷移偵測。** 在 prop *跨過邊界*時觸發邏輯，而不是它*處於某狀態*時：`prevStatus === "loading" && status === "success"` 讓 toast 在每個請求完成時恰好彈一次。搭配 [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 還能跳過掛載時的首次渲染。
- **From → to 動畫。** 數字滾動和圖表過渡需要兩個端點；`usePrevious` 直接把補間的起始值遞給你，不用再造第二份 state。
- **「從 X 改為 Y」的介面。** 展示待提交改動的稽核式表單和設定面板——把 `prev` 和 `value` 並排渲染；首次渲染時 `prev` 是 `undefined`，什麼都不顯示即可。

## SSR 安全性

`usePrevious` 就是兩個 `useState` 加一次比較——沒有 `window`，沒有 `document`，沒有 effect，沒有任何需要守衛的東西。伺服器端渲染一次，回傳 `undefined`；客戶端首次渲染回傳同樣的 `undefined`，hydration 天然一致。不像那些讀瀏覽器狀態的 hook（cookie、`localStorage`、媒體查詢），這裡不存在需要專門設計的伺服器端/客戶端分歧。它的 SSR 安全是最無聊的那種：因為它什麼都不做。

## 要點回顧

- **經典的 `useRef` + `useEffect` 配方追蹤的是上一次*渲染*，不是上一個*值***——任何無關的 re-render 都會悄悄改寫它，這正是每個曾經內建這份配方的主流 hooks 函式庫都收到過的 bug 回報。
- **[`usePrevious`](https://reactuse.com/state/useprevious/) 用的是 render 期間 setState**——React 官方文件認可的模式：有條件、自行終止、對使用者不可見，且在 StrictMode 和並行渲染下都正確。
- **首次渲染回傳 `undefined`**——此時還沒有歷史；按 `T | undefined` 標註型別。
- **比較按參考進行**——傳原始值或用 `useMemo` 穩定過的物件，否則 render 期間的守衛會永遠觸發，React 會用「Too many re-renders」攔停你。
- **「上一個值」和「閉包裡的當前值」是兩個不同的問題**——做比較用 `usePrevious`；救過期回呼用 [`useLatest`](https://reactuse.com/state/uselatest/)。

從 [`@reactuses/core`](https://reactuse.com/state/useprevious/) 拿來用，讓「previous」真的是 previous。
