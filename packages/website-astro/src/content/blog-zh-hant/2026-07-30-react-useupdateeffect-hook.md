---
title: "React useUpdateEffect Hook：跳過首次渲染（2026）"
description: "一篇實用的 useUpdateEffect 上手指南：讓 effect 只在依賴變化時執行、跳過掛載那一次；背後只有四行的實作；經過實測驗證的 StrictMode 行為（開發模式下回呼真的會在掛載時觸發——附測試輸出為證）；cleanup 語義；以及什麼時候你真正需要的是 useMount、useUpdate 或 useDeepCompareEffect。TypeScript 優先。"
slug: react-useupdateeffect-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-30
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useUpdateEffect, useupdateeffect, useEffect 跳過首次渲染, react useEffect 跳過初次執行, effect 只在更新時執行, useEffect 不在掛載時執行, react 只響應變化, useUpdateEffect typescript, useUpdateEffect strictmode, react 跳過掛載 effect]
image: /img/og.png
---

# React useUpdateEffect Hook：跳過首次渲染（2026）

`useEffect` 從不關心自己*為什麼*在執行。掛載也好、更新也罷——回呼照跑不誤。於是「設定已儲存 ✓」的 toast 在頁面剛載入時就跟使用者打了個招呼，autosave 把一個沒人碰過的表單 POST 了出去，事件追蹤回報了一次「變更」——實際上只是元件出現了而已。你想表達的是*這個值變化時執行*；你實際寫出來的是*這個值變化時執行，另外開頭再無緣無故執行一次*。

[`@reactuses/core`](https://reactuse.com) 的 [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 就是去掉掛載那一次的 `useEffect`：簽名完全一致，cleanup 語義完全一致，恰好跳過一次呼叫。實作只有四行，所以這篇文章會講清這四行做了什麼、這層抽象唯一真正漏氣的地方——React 18 StrictMode，我們會用測試證明開發模式下回呼*確實*會在掛載時觸發——以及那幾個容易和它搞混的鄰居 hooks。TypeScript 優先。

<!-- truncate -->

## 手寫的守衛

跳過掛載執行沒什麼玄學——任何有點年頭的 React 程式碼庫裡都有這段：

```tsx
function SearchFilters({ filters }: { filters: Filters }) {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackEvent("filters_changed", filters); // 頁面載入時別回報，拜託
  }, [filters]);
  // ...
}
```

它能用。問題不在正確性，在於這個守衛是*每個 effect 一份*的：ref、判斷、翻轉，每個需要這行為的 effect 都要重新敲一遍，而真正的意圖——「跳過掛載」四個字——被六行儀式感埋住了。這份配方的各種變體還會在 code review 裡慢慢腐爛：有人把旗標「簡化」成 `useState`，白買一次渲染；有人把守衛複製進第二個 effect 卻讓兩個 effect 共用一個 ref，於是誰先執行誰消耗掉那次跳過，另一個照樣在掛載時觸發。

對付有名字的樣板程式碼，標準解法就是：把名字給它。

## useUpdateEffect —— 去掉掛載的 useEffect

```tsx
import { useState } from 'react';
import { useUpdateEffect } from '@reactuses/core';

function EditorSettings({ userId }: { userId: string }) {
  const [settings, setSettings] = useState(loadDefaults);

  useUpdateEffect(() => {
    saveSettings(userId, settings);
    toast("設定已儲存 ✓");
  }, [settings]);

  return <SettingsForm value={settings} onChange={setSettings} />;
}
```

掛載時：什麼都不發生——沒有幽靈儲存，沒有對著使用者還沒碰過的表單彈 toast。之後每次 `settings` 變化：和 `useEffect` 一模一樣。簽名就是 `useEffect` 的原文照抄：

```ts
function useUpdateEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
```

依賴陣列、effect 回傳的 cleanup 函式，全部按你的 `useEffect` 直覺運作。沒有任何新東西要學——這正是它的意義。

## 四行程式碼，一個原語

[實作](https://reactuse.com/effect/useupdateeffect/)是一層薄到幾乎不好意思展開講的包裝——幾乎：

```ts
const createUpdateEffect = (hook) => (effect, deps) => {
  const isFirstMount = useFirstMountState();

  hook(() => {
    if (!isFirstMount) {
      return effect();
    }
  }, deps);
};

export const useUpdateEffect = createUpdateEffect(useEffect);
```

底下的原語 [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/)，靠在渲染期間翻轉一個 ref 來回答「這是第一次渲染嗎」：

```ts
export const useFirstMountState = (): boolean => {
  const isFirst = useRef(true);
  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }
  return isFirst.current;
};
```

有兩個細節值得停下來看。第一，*effect 本身在掛載時仍然會跑*——React 照常註冊它、diff 依賴、排程回呼。被跳過的是裡面*你的*那個函式。這很重要，因為它意味著依賴陣列從第一次渲染起就是活的；第二次渲染 diff 時有真實的東西可比。第二，`createUpdateEffect` 是一個針對 effect hook 的工廠，[`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) 就是這麼來的：同樣的跳過邏輯，換成 `useLayoutEffect` 的時機，用於僅更新時需要在繪製前測量或改動 DOM 的場景。

cleanup 的行為從「你的回呼從沒跑過」自然推出：掛載後沒有東西需要清理，所以第一次 cleanup 發生在你的 effect *第二次*更新執行之前——而卸載時，只要你的 effect 至少跑過一次，它的 cleanup 會正常觸發。函式庫自己的測試套件把這一點釘死了。

## StrictMode 的坑——實測驗證，不是道聽塗說

這是大多數 `useUpdateEffect` 文章跳過的一節，而它恰恰是真正會咬你的那個。在 React 18+ 上用 `<StrictMode>` 包住元件，開發模式下執行：

```tsx
const effect = jest.fn();

function Comp() {
  const [c, setC] = useState(0);
  useUpdateEffect(() => { effect(c); }, [c]);
  // ...
}

render(<StrictMode><Comp /></StrictMode>);
// effect.mock.calls.length === 2   ← 掛載時。兩次。
```

這不是假設——這是對真實實作跑測試的輸出。這個「跳過第一次」的 hook 在 StrictMode 開發模式下，掛載時執行了，還是兩次。鏈條是這樣的：

1. StrictMode 會**把渲染函式呼叫兩遍**。第一遍翻轉了 ref：`useFirstMountState` 回傳 `true`。第二遍——同一個元件實例、同一個 ref——發現它已經翻過了，回傳 `false`。給 hook 加上探針，兩遍的回傳值恰好是 `[true, false]`。
2. 最終提交的是第二遍渲染，所以 effect 閉包捕獲到的是 `isFirstMount === false`。守衛在任何 effect 執行之前就已經被攻破了。
3. 接著 StrictMode 會**把 effect 跑兩遍**（掛載 → 模擬卸載 → 重新掛載），兩次都暢通無阻地穿過了敞開的守衛。兩次呼叫。

先別急著回報 bug：這不是 reactuse 的缺陷，這正是 StrictMode 存在的目的所要製造的碰撞。在渲染期間翻轉 ref 是幾乎所有基於 ref 的首次掛載偵測的運作方式，而「這個函式渲染過幾次」恰恰是 StrictMode 的雙重呼叫被設計出來要揪出的那類隱藏的渲染次數依賴。正式環境的建置不會雙重呼叫，所以**正式環境下這個跳過完全按廣告宣傳的方式運作**——分歧只存在於開發模式。

實用的準則：

- 把 `useUpdateEffect` 用在 **UX 級**的跳過上——toast、autosave、事件追蹤、篩選變化時重新請求。開發模式多觸發一次不會造成真實損失，正式環境行為端正。
- 別把它用在**正確性級**的保證上——「這個網路請求絕不能在掛載時發出」如果只靠 `useUpdateEffect` 兜底，那它在每次 StrictMode 開發執行時都會在掛載時發出，然後你就得搭進去一下午。正確性需要的是基於*資料*的條件，而不是渲染計數：用 [`usePrevious`](https://reactuse.com/state/useprevious/) 對比上一個值，或者在觸發前檢查真實狀態（「表單是否已被編輯」）。

如果你在哪個 hooks 函式庫的 issue 區見過「我的 useUpdateEffect 在掛載時執行了！」——每一次，都是這個原因。

## 別把它和鄰居搞混

effect 家族裡有幾個名字近得容易撞車，選錯了不是 bug 而是範疇錯誤，所以——認門指南：

- [`useMount`](https://reactuse.com/effect/usemount/) 是鏡像：回呼**只**在掛載時執行，更新時永不。它和 `useUpdateEffect` 加起來，`useEffect` 的兩半各自有了名字。
- [`useUpdate`](https://reactuse.com/effect/useupdate/)——雖然名字像——完全不屬於這個家族。它回傳一個**強制重新渲染**的函式。如果你衝著「更新時的 effect」找到了它，你要找的其實是本文這個 hook。
- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) 是同樣的跳過邏輯套在 `useLayoutEffect` 的時機上——僅更新時測量 DOM，不閃一幀未繪製的狀態。
- [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 解決的是 effect 的*另一個*經典抱怨：依賴用 `Object.is` 比較，每次渲染新建的物件字面量都會重新觸發。如果你的 effect 過度觸發是因為物件識別而不是掛載時機，你要的是它。
- [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) 是原語本身——當你需要在*渲染期間*感知首次渲染時直接用它（比如初次繪製時跳過一個動畫 class），而不是在 effect 裡。

## 真實使用場景

- **尊重水合的 autosave。** 表單狀態來自伺服器端或 `localStorage`；掛載時把它存回去，輕則一次浪費的寫入，重則用預設值覆蓋掉更新的資料。在*變化*時儲存。（順手做個防抖——[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 在回呼裡組合得很乾淨。）
- **變更通知。**「主題已更新」「篩選已套用」「已複製！」——這是對*動作*的回饋。掛載時沒有動作，所以頁面載入就彈 toast 看起來像個 bug。這是人們來找這個 hook 的頭號原因。
- **跳過重複的初次請求。** 頁面已經帶著資料伺服器端渲染了，或者首批資料從 props 傳下來了；這個 effect 的存在意義是查詢條件變化時*重新*請求。掛載執行 = 對螢幕上已有的資料立刻再發一次請求。
- **只在變化時追蹤事件。** `trackEvent("sort_changed", sort)` 應該意味著使用者改了排序——而不是元件帶著預設值掛載了。需要 from → to 的事件負載時，配合 [`usePrevious`](https://reactuse.com/state/useprevious/)。

## SSR 安全性

沒什麼需要守衛的。伺服器端渲染期間 effect 根本不執行——這是 React 的規則，不是函式庫的功勞——而 `useFirstMountState` 不碰 `window`、不碰 `document`，只有一個 ref。伺服器端渲染、水合、客戶端首次渲染：你的回呼在這三步裡全程靜默，然後在第一次真實更新時醒來。和 [`@reactuses/core`](https://reactuse.com) 裡每個 hook 的目標一樣是構造上 SSR 安全——只不過這一個是靠根本沒有可出錯的地方來達成的。

## 要點回顧

- **`useEffect` 會在掛載時執行；有時你想要的是「僅變化時」。** [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 就是這個意圖的名字——同樣的簽名、同樣的 cleanup，少一次呼叫。
- **實作是包在 [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) 外面的四行**；effect 在掛載時照常註冊，被跳過的只是你的回呼，所以依賴追蹤從第一次渲染就開始。
- **StrictMode 開發模式下它會在掛載時觸發——兩次——這是實測驗證的，不是傳聞。** 雙重渲染呼叫能攻破任何「渲染期間翻轉 ref」的守衛。正式環境不受影響。UX 級的跳過放心用；正確性級的規則要建立在資料上，而不是渲染計數上。
- **小心撞名**：[`useMount`](https://reactuse.com/effect/usemount/) 是它的另一半，[`useUpdate`](https://reactuse.com/effect/useupdate/) 是來自另一個宇宙的重渲染觸發器，而物件識別導致的過度觸發要找 [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/)。
- **零儀式的 SSR 安全**——伺服器端根本不跑 effect，掛載跳過原封不動地穿過水合。

從 [`@reactuses/core`](https://reactuse.com/effect/useupdateeffect/) 拿走它，讓你的 effect 別再為自己的出生開派對了。
