---
title: "React useIsomorphicLayoutEffect：修掉 SSR 下的 useLayoutEffect 警告（2026）"
description: "如果你在 Next.js 或 Remix 的主控台裡見過「Warning: useLayoutEffect does nothing on the server」，這篇就是解法。深入講清楚為什麼 useLayoutEffect 在 SSR 下會報警、為什麼換成 useEffect 會帶來閃爍，以及 useIsomorphicLayoutEffect 如何同時解決這兩個問題——還有什麼時候該用它，以及它周邊那一族佈局時序 hook。"
slug: react-isomorphic-layout-effect
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-25
tags: [react, hooks, ssr, nextjs, tutorial]
keywords: [react useIsomorphicLayoutEffect, useLayoutEffect SSR 警告, useLayoutEffect does nothing on the server, react useLayoutEffect 伺服端渲染, next.js useLayoutEffect 警告, react ssr 佈局 effect, isomorphic layout effect, useLayoutEffect vs useEffect, react 測量 dom, remix useLayoutEffect, useUpdateLayoutEffect, ssr 安全 react hooks, react 水合不匹配]
image: /img/og.png
---

# React useIsomorphicLayoutEffect：修掉 SSR 下的 useLayoutEffect 警告（2026）

你加了一個 `useLayoutEffect` 來測量一個 tooltip，發版，下一次 Next.js（或 Remix、Gatsby）的開發伺服器在伺服端渲染這個頁面時，主控台就亮了：

```
Warning: useLayoutEffect does nothing on the server, because its effect cannot
be encoded into the server renderer's output format. This will lead to a
mismatch between the initial, non-hydrated UI and the intended UI. To avoid
this, useLayoutEffect should only be used in components that render exclusively
on the client.
```

這個警告說得沒錯，但它給的建議（「只在客戶端用」）幫不上忙；而那個最顯而易見的繞法——直接換成 `useEffect`——會悄悄把你當初用 `useLayoutEffect` 幹掉的那個視覺 bug 又請回來。`useIsomorphicLayoutEffect` 就是化解這個僵局的那個小 hook。本文講清楚警告到底為什麼出現、兩種最直覺的修法為什麼都不對，以及那個一行的 hook 實際上做了什麼。

<!-- truncate -->

## useLayoutEffect 到底為什麼存在

React 給了你兩個長得幾乎一樣的 effect hook：

- [`useEffect`](https://react.dev/reference/react/useEffect) 在瀏覽器**繪製之後**執行。它的回呼會被排隊，等這一幀上螢幕之後非同步觸發。
- `useLayoutEffect` 在瀏覽器**繪製之前**同步執行，就在 React 改完 DOM、但使用者還沒看到任何東西的那一刻。

這個時序差別就是它存在的全部意義。如果你要讀佈局——`getBoundingClientRect`、`scrollHeight`、某個節點測出來的寬度——然後據此寫一個樣式，你必須在*繪製之前*做完。否則使用者會先看到一幀錯的佈局，然後你的 `useEffect` 糾正過來時會閃一下。最典型的例子就是一個要根據自身尺寸來定位的 tooltip：

```tsx
function Tooltip({ targetRect, children }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const { height, width } = ref.current!.getBoundingClientRect();
    // 放在目標上方、水平置中
    setPos({
      top: targetRect.top - height - 8,
      left: targetRect.left + targetRect.width / 2 - width / 2,
    });
  }, [targetRect]);

  return <div ref={ref} style={{ position: 'fixed', ...pos }}>{children}</div>;
}
```

用 `useLayoutEffect`，React 在同一個同步過程裡測量並重新定位，所以 tooltip 永遠只會在正確的位置被繪製。換成 `useEffect`，tooltip 會先在 `{ top: 0, left: 0 }` 閃一幀，然後才跳到正確的位置。機器快的時候你可能注意不到；在被降頻的手機上你一定會看到。

## 為什麼伺服端容不下它

伺服端渲染產出的是一段 HTML 字串。沒有瀏覽器、沒有 DOM、沒有佈局階段，而且——最關鍵的——什麼都不會*繪製*。`useLayoutEffect` 存在的全部理由，就是要在一次繪製之前同步執行，而這次繪製在伺服端永遠不會到來。

所以 React 做了一個有意的選擇：**`useLayoutEffect` 的回呼在伺服端渲染期間根本不會執行。**它們沒法被有意義地序列化進 HTML，執行它們也產生不了任何有用的東西。React 知道這是個陷阱——你元件的伺服端產出不會反映佈局 effect 本該算出的結果——於是它拋出那個警告，告訴你伺服端 HTML 和你想要的客戶端 UI 可能對不上。

這個警告不是你程式碼的 bug。它是 React 在提醒你：你有一個 hook，它*唯一的工作*在伺服端根本沒法完成。

## 為什麼不能直接用 useEffect

第一直覺是把它換成 `useEffect` 來消掉警告——React 很樂意在伺服端跑 `useEffect`（只是把回呼推遲）。警告消失了。閃爍回來了。

記住那個時序：`useEffect` 在繪製*之後*觸發。所以在客戶端水合之後，你那套「先測量、再重定位」的邏輯現在晚了一幀。使用者會先看到沒定位好的狀態，然後才是糾正。你拿一個使用者看不見的主控台警告，換來了一個使用者看得見的視覺故障——這是嚴格意義上更差的結果。

第二直覺——讓這個元件只在客戶端渲染（`typeof window !== 'undefined'` 守衛、`ssr: false` 的動態匯入、掛載旗標）——能用，但它把整棵子樹的伺服端渲染都扔掉了。你失去了 SSR 的 HTML，內容在水合之前對爬蟲不可見，而且首屏多了一次佈局抖動。為了一個「選哪個 hook」的問題，這是大砲打蚊子。

## 真正的修法：按環境分支

道理其實很簡單：你想要 `useLayoutEffect` 那種「繪製前」的時序——**在瀏覽器裡**；同時你想要 `useEffect` 那種「安安靜靜什麼也不做、不報警」的行為——**在伺服端**。這是兩個不同的 hook，哪個對取決於程式碼跑在哪裡。

所以在模組載入時，根據是不是瀏覽器環境來挑：

```ts
import { useEffect, useLayoutEffect } from 'react';

const isBrowser = typeof window !== 'undefined';

export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;
```

整個 hook 就這些。在瀏覽器裡它*就是* `useLayoutEffect`——一模一樣的繪製前同步時序、一模一樣的簽名。在伺服端它*就是* `useEffect`，React 從不對它報警，也永遠不會跑一次沒用的佈局過程。「Isomorphic（同構）」是個老詞，指那種在伺服端和客戶端跑法一致的程式碼；這個 hook 就是為每個環境挑出語意相同的那個 effect。

ReactUse 把它原樣做成了 [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/)，省得你在每個專案裡複製貼上這段：

```tsx
import { useIsomorphicLayoutEffect } from '@reactuses/core';

function Tooltip({ targetRect, children }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // 跟前面一模一樣的程式碼——但沒有 SSR 警告，也沒有客戶端閃爍。
  useIsomorphicLayoutEffect(() => {
    const { height, width } = ref.current!.getBoundingClientRect();
    setPos({
      top: targetRect.top - height - 8,
      left: targetRect.left + targetRect.width / 2 - width / 2,
    });
  }, [targetRect]);

  return <div ref={ref} style={{ position: 'fixed', ...pos }}>{children}</div>;
}
```

它是 `useLayoutEffect` 的無縫替換：一樣的回呼、一樣的可選相依陣列、一樣的清理函式。唯一變的是警告沒了，而你的客戶端行為保持不變。

### 一個細節：為什麼分支放在 render 外面

注意 `isBrowser ? useLayoutEffect : useEffect` 只在模組求值時跑*一次*，不在元件裡跑。這是故意的。[Hook 規則](https://react.dev/reference/rules/rules-of-hooks)要求你每次渲染都以相同順序呼叫相同的 hook。如果你在元件*內部*寫 `if (isBrowser) useLayoutEffect(...) else useEffect(...)`，那嚴格來說你在伺服端和客戶端呼叫了不同的 hook——更糟的是，linter 會（理所應當地）對條件式 hook 呼叫報警。

把這個選擇在模組載入時定成一個穩定的函式參照，元件就只是無條件地呼叫 `useIsomorphicLayoutEffect(...)`。`isBrowser` 在一個行程內永遠不變，所以選中的 hook 在整個 bundle 生命週期裡都是恆定的。hook 順序保持穩定，lint 規則也滿意。

## 什麼時候用它（什麼時候別用）

當下面**所有**條件都成立時，用 `useIsomorphicLayoutEffect`：

- 你需要佈局階段的時序——你在測量或改動 DOM，且結果必須出現在*第一幀*繪製裡（tooltip、popover、自動撐高的 textarea、捲動位置還原、焦點管理，任何「閃一幀就看得見」的場景）。
- 這個元件會被伺服端渲染（Next.js、Remix、Astro islands、Gatsby、TanStack Start——任何會呼叫 `renderToString`/`renderToPipeableStream` 的東西）。
- 你想消掉 SSR 警告，又不想為這棵子樹關掉 SSR。

**不要**把它當成 `useEffect` 的無腦替換。如果你的 effect 不碰佈局——拉資料、訂閱事件、同步到 `localStorage`、打日誌——普通的 `useEffect` 才是對的，你要的就是它「繪製後、不阻塞」的時序。`useLayoutEffect`（以及它的同構版本）是同步執行、會*阻塞繪製*的；濫用它會讓你的應用毫無收益地卡頓。經驗法則沒變：只在不用它就會看到閃爍的時候，才上佈局 effect。

而如果一個元件確實只能在客戶端跑——它在頂層 import 了 `window`，或者包了一個只在瀏覽器裡能用的庫——那讓它客戶端渲染（`dynamic(() => ..., { ssr: false })`）仍然是對的工具。`useIsomorphicLayoutEffect` 是給那些*確實*會在伺服端渲染、只是內部帶了個佈局 effect 的元件用的。

## 佈局時序這一族

`useIsomorphicLayoutEffect` 是 ReactUse 裡一小族 effect hook 的基底。一旦你理解了這個 SSR 安全的佈局 effect，其餘幾個就順理成章了：

- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) —— 一個**跳過首次掛載**、只在更新時執行的佈局 effect。它內部用一個「首次掛載」守衛包住 `useLayoutEffect`，所以它是 `useUpdateEffect` 在佈局階段的兄弟。當初始 DOM 已經正確、你只需要對後續 prop 變化做出反應時很好用（把一個值動畫*到*新位置，而不是動畫*入場*）。注意這個直接用了 `useLayoutEffect`，如果你需要它在 SSR 下也靜默，把這個模式跟 `isBrowser` 分支結合一下即可。
- [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) —— 同樣的「跳過首渲染」行為，建立在 `useEffect` 之上。日常那個「變化時跑、掛載時不跑」的 hook。
- [`useMount`](https://reactuse.com/effect/usemount/) —— 在掛載後恰好執行一次回呼。當你想表達的只是「掛載時」，它是 `useEffect(fn, [])` 的可讀別名。

庫內部還有一個低調但重要的使用者。[`useEvent`](https://reactuse.com/effect/useevent/) —— ReactUse 那個穩定回呼 hook，給你一個身份永久、但閉包始終最新的事件處理函式——就用了 `useIsomorphicLayoutEffect`，在*繪製之前*把最新的函式同步進一個 ref：

```ts
const handlerRef = useRef(fn);
useIsomorphicLayoutEffect(() => {
  handlerRef.current = fn;
}, [fn]);
```

在佈局階段寫這個 ref，保證了如果某個子元件在*它自己的*佈局 effect 裡觸發這個處理函式，它已經能看到最新的版本——而用同構的方式去做，意味著 `useEvent` 自己也永遠不會踩到 SSR 警告。這很好地說明了為什麼一個庫 hook 預設就該選同構的版本：你不知道你的使用者跑在哪個環境，所以你挑那個在兩邊都對的。

## 要點回顧

- 「useLayoutEffect does nothing on the server」這個警告，是 React 在告訴你：一個「繪製前」的 hook 沒法在沒有繪製的地方執行。它說得對，不是誤報。
- 換成 `useEffect` 能消掉警告，但會在客戶端重新引入一幀閃爍，因為 `useEffect` 在繪製之後才跑。
- `useIsomorphicLayoutEffect` 同時解決兩邊：它在瀏覽器裡*就是* `useLayoutEffect`、在伺服端*就是* `useEffect`，在模組載入時選定一次，hook 順序保持穩定。
- 在伺服端渲染的元件裡做佈局測量/改動時用它；其餘不碰佈局的，留給普通 `useEffect`。
- ReactUse 把它（以及相關的 `useUpdateLayoutEffect`、`useUpdateEffect`、`useMount`）打包好了，省得你重造那一行——並在內部用它來讓自家 hook 保持 SSR 安全。

到 [reactuse.com](https://reactuse.com) 瀏覽完整的 SSR 安全 effect hook 集合，凡是有 `useLayoutEffect` 讓你的伺服端主控台緊張的地方，都把 `useIsomorphicLayoutEffect` 放進去。
