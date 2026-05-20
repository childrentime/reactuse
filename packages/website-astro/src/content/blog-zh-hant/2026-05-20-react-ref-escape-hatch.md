---
title: "Ref 逃生艙:用 React Hook 解決閉包陳舊、回呼身分不穩和強制更新"
description: "React 裡每一次渲染都是一張快照,而閉包捕獲的永遠是它出生那一刻的快照——陳舊的 state、被打破的 memo、還有「在已卸載元件上 setState」都源於此。本文梳理 ReactUse 中七個基於 ref 逃生艙的 hook:useEvent、useLatest、useMountedState、usePrevious、useFirstMountState、useUpdate、useMergedRefs,以及它們各自消除的 bug。"
slug: react-ref-escape-hatch
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-20
tags: [react, hooks, performance, tutorial]
keywords: [react 閉包陳舊, react useEvent, react useLatest, react 穩定回呼, react useMountedState, react 已卸載元件 setState, react usePrevious, react useFirstMountState, react 強制更新, react useUpdate, react 合併 ref, react useMergedRefs, react useEffectEvent]
image: /img/og.png
---

# Ref 逃生艙:用 React Hook 解決閉包陳舊、回呼身分不穩和強制更新

每個函式元件在每次渲染時都會從頭跑一遍,渲染期間建立的每個閉包,捕獲的都是那一刻的 props 和 state。這句話就是 React 模型的全部,同時也是一整族 bug 的源頭:讀到陳舊 count 的事件處理函式、因為回呼身分每次都變而每次渲染都重新訂閱的 `useEffect`、在元件已經卸載之後才觸發的 `setState`。它們看起來是不同的問題,其實是同一個問題——一個閉包死死攥著一張早已過期的快照。

<!-- truncate -->

對於「我需要一個跨渲染存活、又不被閉包捕獲的值」,React 官方的答案是 `useRef`。ref 是一個身分永不改變的可變盒子;讀 `ref.current` 拿到的永遠是*當前*值,而不是閉包建立時那個。這就是逃生艙。麻煩在於,把 ref 接對——保持同步、在正確的時機讀取、不破壞 SSR——足夠瑣碎,以至於每個人都寫出一個略有差異的版本,而其中有些版本會產生競態。

[ReactUse](https://reactuse.com) 把這些都做成了產品級實作。本文走一遍其中七個,每個的原始碼都不超過十幾行;它的價值在於,這是*正確*的那十幾行,在每個專案裡都一樣。如果你讀過[上週那篇專門 effect hook 的文章](/blog/react-specialized-effect-hooks/),這篇是它的姊妹篇:那些 hook 修的是 `useEffect`,這些修的是流經它的閉包。

## 把 bug 說具體

下面這個聊天元件輪詢未讀訊息並顯示數量。它錯得很隱蔽,能輕鬆通過 code review:

```tsx
function Inbox({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // BUG:這裡的 `count` 永遠是 0——它是 effect 首次執行時捕獲的值。
      // 這個計時器永遠看不到更新後的 count。
      console.log(`Polling, current count is ${count}`);
      fetchUnread(userId).then((n) => setCount(count + n));
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // 故意不放 count,否則每次變化計時器都會重建

  return <Badge>{count}</Badge>;
}
```

計時器回呼閉包捕獲的是 effect 執行那次渲染裡的 `count`。那時 `count` 是 `0`,於是它在那個閉包裡永遠是 `0`——`setCount(count + n)` 實際上是 `setCount(0 + n)`。常見的「修復」各自又換來一個新 bug:把 `count` 加進依賴陣列,計時器就每五秒銷毀重建一次;改用 `setCount((c) => c + n)` 更新函式,寫是修好了,但 `console.log` 仍在撒謊,任何需要在 setter 之外*讀取*最新 count 的邏輯依舊卡住。

你真正想要的是:一個永不重建的穩定計時器,觸發時仍能讀到最新的 `count`。這就是 ref。下面這些 hook 就是補齊了人體工學的 ref。

## 1. useLatest——永遠讀到當前值

[`useLatest`](https://reactuse.com/state/uselatest/) 接收一個值,回傳一個永遠持有它最新版本的 ref。這個 ref 的身分永不改變,所以任何閉包捕獲它——計時器、事件監聽器、長期存活的回呼——都會透過它讀到今天的值,而不是訂閱那一刻凍結的值。

```tsx
import { useLatest } from "@reactuses/core";

function Inbox({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const countRef = useLatest(count);

  useEffect(() => {
    const id = setInterval(() => {
      // 即便 effect 只執行了一次,countRef.current 永遠是最新的 count。
      console.log(`Polling, current count is ${countRef.current}`);
      fetchUnread(userId).then((n) => setCount(countRef.current + n));
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // 依賴裡沒有 count——計時器是穩定的

  return <Badge>{count}</Badge>;
}
```

effect 只依賴 `userId`,於是計時器只建立一次,熬過每一次 count 變化。讀取走 `countRef.current`,而 `useLatest` 透過在每次渲染的 layout effect 裡寫入它來保持其最新。這是這一族裡最有用的成員:任何時候你發現自己把某個值加進依賴陣列*只是*為了讓閉包能讀到它、而不是為了讓 effect 重跑——`useLatest` 就是答案。

## 2. useEvent——身分穩定、又總能看到最新 state 的回呼

`useLatest` 解決的是透過穩定參考讀取一個*值*。[`useEvent`](https://reactuse.com/effect/useevent/) 為一個*函式*解決同樣的問題:它回傳一個回呼,身分在元件整個生命週期內凍結,但每次呼叫執行的都是你傳入的最新版本——把最新的 props 和 state 一併烤進去。

正是這個 hook,讓你能把一個處理函式傳給被 memo 的子元件而不破壞它的 memo:

```tsx
import { useEvent } from "@reactuses/core";

function SearchBox({ onResults }: { onResults: (r: Result[]) => void }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  // 身分穩定,但每次呼叫都讀取最新的 query 和 filters。
  const search = useEvent(() => {
    runSearch(query, filters).then(onResults);
  });

  // <ExpensiveButton> 被 React.memo 了。因為 search 身分永不變,
  // 按鈕在 query/filter 的每次按鍵時都不會重渲染。
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveButton onClick={search}>Search</ExpensiveButton>
    </>
  );
}
```

沒有 `useEvent`,你會去用 `useCallback(() => runSearch(query, filters), [query, filters])`——它在每次按鍵時產出一個*新的* `search`,讓按鈕上的 `React.memo` 失效。把依賴砍成 `[]`,閉包又陳舊了,永遠在搜尋那個空的初始 query。`useEvent` 兩者兼得:穩定身分加新鮮閉包。如果這個名字眼熟,它跟 React 實驗性的 `useEffectEvent` / 舊的 `useEvent` RFC 是同一個想法——今天就能用,不需要 canary 建置。把它用在你向下傳遞的事件處理函式和回呼上;在你確實*想要*重跑的依賴陣列裡別用它。

## 3. useMountedState——別在卸載後 setState

「Can't perform a React state update on an unmounted component」這個警告來自一個非同步操作在元件已經消失之後才完成。修法是一個在卸載時翻轉的旗標,在每次遲到的 `setState` 前檢查它。[`useMountedState`](https://reactuse.com/state/usemountedstate/) 就是這個旗標,以 getter 背後的 ref 形式存在:

```tsx
import { useMountedState } from "@reactuses/core";

function UserCard({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const isMounted = useMountedState();

  useEffect(() => {
    fetchUser(id).then((u) => {
      // 這個 fetch 可能在使用者已經離開之後才完成。
      if (isMounted()) setUser(u);
    });
  }, [id]);

  return user ? <Card user={user} /> : <Spinner />;
}
```

`isMounted` 是一個穩定的 getter——呼叫它會從 ref 裡回傳當前掛載狀態,所以你可以在任何非同步回呼裡呼叫它而不必把它加進依賴陣列。它故意是函式而不是布林值:布林值本身就會是一張陳舊快照。對於 fetch,你往往可以更傾向用 `AbortController`,但 `useMountedState` 覆蓋了 abort 訊號搆不著的場景——計時器、第三方 promise、訂閱回呼。

## 4. usePrevious——和上一次渲染對比

有時你需要*上一次*渲染的值來決定這一次怎麼做:根據一個數字是漲是跌來決定動畫方向、僅當某個值真的從某個舊值變化時才觸發 effect、記錄狀態轉移。[`usePrevious`](https://reactuse.com/state/useprevious/) 正好把它遞給你:

```tsx
import { usePrevious } from "@reactuses/core";

function Price({ value }: { value: number }) {
  const previous = usePrevious(value);
  const direction =
    previous === undefined ? "flat" : value > previous ? "up" : value < previous ? "down" : "flat";

  return <span className={`price price--${direction}`}>${value.toFixed(2)}</span>;
}
```

首次渲染時 `previous` 是 `undefined`(此前沒有渲染過),之後每次渲染它都持有上一次渲染的值。ReactUse 的實作用渲染期間的 state 更新來追蹤它,而不是樸素的「在 effect 裡寫 ref」做法——這很重要,因為基於 effect 的版本在渲染過程中本身會報錯誤的值。了解一下這個 hook 內部怎麼做的有好處,但重點是你不用再重複實作它了。

## 5. useFirstMountState——判斷是不是第一次渲染

一個近親:有時你需要的不是上一個*值*,而僅僅是知道這是不是第一次渲染。[`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) 在首次渲染回傳 `true`,之後每次回傳 `false`——同步地,在渲染期間,早於任何 effect 執行之前。

```tsx
import { useFirstMountState } from "@reactuses/core";

function Analytics({ route }: { route: string }) {
  const isFirstMount = useFirstMountState();

  useEffect(() => {
    // 區分初始頁面載入和之後的客戶端導航。
    track(isFirstMount ? "page_view_initial" : "page_view_spa", { route });
  }, [route]);

  return null;
}
```

它是 `useUpdateEffect` 這類「跳過 mount」effect hook 背後的積木——但直接暴露出來,供你在渲染邏輯裡(而不僅是在 effect 裡)拿到這個布林值。因為它在渲染期間讀取(不等 effect),你可以用它來選擇初始樣式、決定是否動畫、或分支 JSX,這些都是基於 effect 的「已掛載」旗標來不及做到的。

## 6. useUpdate——按需強制重渲染

ref 對 React 的渲染週期是隱形的:改 `ref.current` 不會排程渲染。通常這正是它的意義所在。偶爾你有真正活在 React 之外的狀態——一個 ref 上的值、一個外部 store、一個可變實例——你需要告訴 React「有東西變了,重畫一次」。[`useUpdate`](https://reactuse.com/effect/useupdate/) 回傳一個只做一件事的函式:強制重渲染。

```tsx
import { useUpdate, useLatest } from "@reactuses/core";

function StopwatchDisplay({ stopwatch }: { stopwatch: ExternalStopwatch }) {
  const update = useUpdate();

  useEffect(() => {
    // 這個碼錶自己改自己的 elapsed 時間;它不活在 React state 裡。
    // 訂閱它,每個 tick 強制渲染一次,讓顯示跟上。
    return stopwatch.onTick(() => update());
  }, [stopwatch, update]);

  return <time>{stopwatch.elapsed}ms</time>;
}
```

`update` 身分穩定,所以放在依賴陣列和 effect 體裡都安全。要節制使用——大多數「我需要強制渲染」的直覺,用真正的 state 來滿足更好——但對於把一個外部可變源接進 React 渲染週期,它是精準的工具,而且比人們到處抄的 `useReducer((x) => x + 1, 0)` 咒語清晰得多。

## 7. useMergedRefs——讓多個 ref 指向同一個節點

最後一個是另一種風味的 ref 問題:不是陳舊,而是*組合*。一個 DOM 節點只能交給一個 `ref` prop,但你經常有好幾個消費者各自都需要它——你自己的測量 ref、來自父元件的轉發 ref、還有某個函式庫的 ref(拖曳把手、焦點陷阱、交叉觀察器)。[`useMergedRefs`](https://reactuse.com/state/usemergedrefs/) 把它們合併成一個 ref 回呼,把節點分發給所有人:

```tsx
import { forwardRef, useRef } from "react";
import { useMergedRefs } from "@reactuses/core";

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(props, forwardedRef) {
  const localRef = useRef<HTMLInputElement>(null); // 我們想自己測量/聚焦它
  const mergedRef = useMergedRefs(localRef, forwardedRef);

  // localRef.current 和父元件的 ref 都指向同一個 input。
  return <input ref={mergedRef} {...props} />;
});
```

它同時處理兩種形態的 ref——物件 ref(`{ current }`)和回呼 ref(`(node) => …`)——並把節點賦給每一個。這消除了 React 元件庫作者生活裡最繁瑣的樣板:每個設計系統都重新發明、且通常沒正確處理回呼 ref 的那個手寫 `setRef` 輔助函式。

## 拼到一起

開頭那個 `Inbox` bug,用工具箱而不是繞著它寫:

```tsx
import { useLatest, useMountedState, useEvent } from "@reactuses/core";

function Inbox({ userId, onOpen }: { userId: string; onOpen: (id: string) => void }) {
  const [count, setCount] = useState(0);
  const countRef = useLatest(count);
  const isMounted = useMountedState();

  useEffect(() => {
    const id = setInterval(() => {
      fetchUnread(userId).then((n) => {
        if (isMounted()) setCount(countRef.current + n); // 新鮮的 count,沒有遲到更新
      });
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // 穩定計時器——count 變化時不重建

  // 給被 memo 的列用的穩定處理函式,總是讀到最新的 count。
  const handleOpen = useEvent(() => {
    track("inbox_open", { unread: countRef.current });
    onOpen(userId);
  });

  return <InboxButton onClick={handleOpen} badge={count} />;
}
```

三個 hook,關掉三類閉包 bug:一個能讀新鮮 state 的穩定計時器(`useLatest`)、沒有卸載後 setState(`useMountedState`)、以及一個不破壞被 memo 子元件的穩定處理函式(`useEvent`)。沒有依賴陣列體操,沒有 `setRef` 輔助函式,沒有 `useReducer` 強制更新的小把戲。

## 上手試試

每個 hook 在它的文件頁都有可執行的 demo——打開一個,改改輸入,看看什麼保持穩定、什麼保持新鮮:

- [`useLatest`](https://reactuse.com/state/uselatest/)
- [`useEvent`](https://reactuse.com/effect/useevent/)
- [`useMountedState`](https://reactuse.com/state/usemountedstate/)
- [`usePrevious`](https://reactuse.com/state/useprevious/)
- [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/)
- [`useUpdate`](https://reactuse.com/effect/useupdate/)
- [`useMergedRefs`](https://reactuse.com/state/usemergedrefs/)

用 `npm install @reactuses/core`(或 `pnpm add @reactuses/core`)安裝後直接 import。沒有 provider,除了 React 16.8+ 之外沒有 peer 依賴。完整 hook 列表和上面所有內容的原始碼都在 [reactuse.com](https://reactuse.com)。

心智模型就是全部:每次渲染都是一張快照,閉包捕獲這張快照,而 `useRef` 是出去的那扇門。這七個 hook 就是這扇門,而且鉸鏈已經上好了油。
