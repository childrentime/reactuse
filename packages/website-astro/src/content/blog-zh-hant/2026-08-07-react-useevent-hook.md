---
title: "React useEvent Hook：告別過期閉包的穩定回呼 (2026)"
description: "useEvent 實用指南：一個引用永不變化、但總能讀到最新 state 和 props 的回呼 Hook。涵蓋過期閉包問題、useEvent 與 useCallback 及 React 19.2 useEffectEvent 的區別、內部的 layout effect 技巧，以及什麼時候不該用它。TypeScript 優先，SSR 安全。"
slug: react-useevent-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-07
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useEvent, useevent, useEvent hook, useEffectEvent, useCallback 過期閉包, react 穩定回呼, react 函式引用穩定, react 事件處理 hook, useevent react, useCallback 替代方案, react memo 回呼 prop, react 閉包陷阱]
image: /img/og.png
---

# React useEvent Hook：告別過期閉包的穩定回呼 (2026)

每個 React 開發者遲早都會走到同一個岔路口。你寫了一個讀取 state 的事件處理函式，把它傳給子元件或 effect，然後必須二選一：要麼保持行內函式原樣，看著每次渲染都產生一個新引用——`React.memo` 失效、effect 反覆執行、監聽器反覆重新訂閱；要麼用 `useCallback` 包起來，開始玩依賴陣列打地鼠——漏掉一個依賴，處理函式看到的就是三次渲染之前的 state。

第二種失敗模式有個名字——**過期閉包（stale closure）**——它大概是生產程式碼裡最常見的 React bug。解決方案也有個名字：`useEvent`，源自 [2022 年的官方 React RFC](https://github.com/reactjs/rfcs/blob/main/text/0000-useevent.md)，今天可以直接用 [`@reactuses/core`](https://reactuse.com) 裡的 [`useEvent`](https://reactuse.com/effect/useevent/)。它給你一個**引用在渲染之間永不變化**、但函式本體**總能讀到最新 state 和 props** 的函式。岔路口的兩邊，全都要。

本文涵蓋它的 API、讓這一切成立的三行實作技巧、與 `useCallback` 及 React 19.2 內建 `useEffectEvent` 的對比、真實使用模式，以及必須遵守的一條規則（不要在渲染期間呼叫它）。TypeScript 優先。

<!-- truncate -->

## 三十秒看懂問題

這就是 bug 製造機。一個聊天元件定時把當前草稿文字發送心跳：

```tsx
function Composer({ roomId }: { roomId: string }) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      sendHeartbeat(roomId, draft); // ⚠️ 哪個 draft？
    }, 3000);
    return () => clearInterval(id);
  }, [roomId]); // 故意省略 draft——我們不想重置計時器

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

interval 閉包捕獲的是 effect 執行時的那個 `draft`——空字串。此後每次心跳發的都是 `''`。把 `draft` 加進依賴陣列，閉包倒是新鮮了，但計時器會在**每次按鍵**時銷毀重建。`useCallback` 幫不上忙：它有一模一樣的依賴陣列，所以逼你做一模一樣的選擇——要麼值過期，要麼引用不停變。

你真正想要的，是一個在元件生命週期內*始終是同一個東西*、但觸發時*讀到當前值*的函式。這就是 `useEvent`：

```tsx
import { useEvent } from '@reactuses/core';

function Composer({ roomId }: { roomId: string }) {
  const [draft, setDraft] = useState('');

  const beat = useEvent(() => {
    sendHeartbeat(roomId, draft); // ✅ 永遠是最新的 draft 和 roomId
  });

  useEffect(() => {
    const id = setInterval(beat, 3000);
    return () => clearInterval(id);
  }, [beat]); // beat 永不變化——effect 只執行一次

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

`beat` 在每次渲染中引用完全相同，所以 effect 只執行一次，計時器在打字過程中穩如泰山。當它觸發時，透過最新一次渲染的閉包讀取 `draft`。依賴陣列甚至是誠實的——`beat` 列在裡面，只是它恰好穩定。

## 完整 API

幾乎沒有學習成本：

```ts
const stableFn = useEvent(fn);
```

- **`fn`** —— 任意函式。參數和回傳值原樣透傳，`this` 也一樣。
- **`stableFn`** —— TypeScript 型別與 `fn` 完全相同，但引用在元件生命週期內固定不變。

型別是精確的，不是 `(...args: any[]) => any`：

```tsx
const format = useEvent((n: number, unit: string) => `${n}${unit}`);
format(3, 'px');   // ✅ string
format('3', 'px'); // ❌ 型別錯誤
```

開發環境下，如果傳入的不是函式，會在主控台印出 `useEvent expected parameter is a function, got …`，而不是悄悄失敗。

## 內部實作原理

整個實作短到一杯咖啡就能讀完，而且每一行都有它的道理：

```ts
export const useEvent = <T extends Fn>(fn: T) => {
  const handlerRef = useRef(fn);

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = fn;
  }, [fn]);

  return useCallback((...args) => {
    const fn = handlerRef.current;
    return fn(...args);
  }, []) as T;
};
```

三個值得注意的細節：

1. **用 ref 攜帶最新閉包。** 每次渲染都產生一個捕獲最新 state 的新 `fn`；effect 把它存進 `handlerRef`。回傳的包裝函式——用空依賴陣列只 memoize 一次——在*呼叫時*而非渲染時讀取 `handlerRef.current`。外殼穩定，內核新鮮。

2. **ref 在 layout effect 裡更新，而不是普通 effect。** [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) 在 DOM 變更後同步執行，早於瀏覽器繪製、也早於被動的 `useEffect` 回呼。如果 ref 在普通 `useEffect` 裡更新，這個間隙中觸發的任何事件——或同一次 commit 中更早執行的其他 effect——呼叫包裝函式時就會命中上一次渲染的閉包。layout 時機堵上了這個窗口。

3. **Isomorphic 意味著 SSR 安全。** 伺服器端使用 `useLayoutEffect` 會印出 hydration 警告；`useIsomorphicLayoutEffect` 在 SSR 時換成 `useEffect`，瀏覽器裡再換回真傢伙。沒有警告，你的程式碼也不用做特殊處理。

如果這個 ref 持有技巧看著眼熟，那是因為它和 [`useLatest`](https://reactuse.com/state/uselatest/) 是同一個思路——`useEvent` 本質上就是 `useLatest` 加一個穩定的可呼叫外殼。想在某個現有回呼裡*讀取*最新值時用 `useLatest`；當回呼本身就是你要到處傳遞的東西時用 `useEvent`。

## useEvent vs useCallback

它們解決的是不同的問題，對比一下兩者都更清楚：

| | `useCallback` | [`useEvent`](https://reactuse.com/effect/useevent/) |
|---|---|---|
| **引用** | 依賴變化就變 | **永不變化** |
| **閉包新鮮度** | 取決於依賴陣列寫得對不對 | **總是最新**——呼叫時才讀取 |
| **依賴陣列** | 必需；bug 的溫床 | 無 |
| **渲染期間可呼叫？** | ✅ 可以 | ❌ 不行——僅限事件/effect 時機 |
| **適合** | *渲染期間*計算的值（memoized selector、render prop） | *事後觸發*的處理函式（事件、計時器、訂閱） |

「渲染期間」這一行是真正的分界線。`useCallback` 的結果是個普通值——你可以在渲染時呼叫它來計算 JSX。`useEvent` 的包裝函式讀取的 ref 只保證在 commit *之後*是最新的，渲染期間呼叫可能觀察到上一次渲染的 state（也違反了 RFC 謹慎設計的並行渲染契約）。經驗法則不言自明：**如果函式是回應某件事而觸發的——點擊、定時、訊息——用 `useEvent`；如果它在渲染期間計算東西——用 `useCallback`。**

## useEvent vs React 官方的 useEffectEvent

2022 年的 RFC 最終被取代：React 把這個想法以 [`useEffectEvent`](https://react.dev/reference/react/useEffectEvent) 的形式發布，自 React 19.2 起穩定。如果你在 19.2+ 上，應該了解兩者的關係：

- **`useEffectEvent` 刻意收窄了範圍。** 回傳的函式只能在 *effect 內部*呼叫（ESLint 規則強制執行），也不能傳給其他元件或 Hook。React 團隊把它限定在他們認為萬無一失的那一種模式：在 effect 裡讀最新值而不重新觸發 effect。
- **`useEvent` 覆蓋更寬的場景。** 把穩定的處理函式傳給 memoized 子元件、命令式元件、WebSocket 封裝或第三方 SDK——這些 `useEffectEvent` 的 linter 全都會拒絕——恰恰是使用者態 `useEvent` 的用武之地。代價是更寬的場景包含了上面那個渲染期呼叫的坑，紀律從 linter 轉移到了*你*身上。
- **兩者可以共存。** React 19.2+ 上 effect 內部用 `useEffectEvent`，跨元件邊界的穩定引用用 `useEvent`；19.2 以下則全部用 `useEvent`——那裡根本沒有 `useEffectEvent`。

## 使用模式

### 不破壞 React.memo 的處理函式 prop

經典的列表行場景——memoized 的行元件照樣重渲染，因為父元件每次渲染都重新建立 `onSelect`：

```tsx
const Row = React.memo(function Row({ item, onSelect }: RowProps) {
  return (
    <li onClick={() => onSelect(item.id)} className="row">
      {item.label}
    </li>
  );
});

function List({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = useEvent((id: string) => {
    // 讀到最新的 selected，沒有依賴陣列要維護
    setSelected(selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id]);
  });

  return (
    <ul>
      {items.map(item => (
        <Row key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </ul>
  );
}
```

`handleSelect` 每次渲染都是同一個引用，`React.memo` 才真正 memo 得起來。換 `useCallback` 的話，你要麼把 `selected` 列進依賴（引用變來變去，memo 白費），要麼到處用函式式更新（這裡還行，一旦處理函式要讀兩份 state 就沒轍了）。

### 永不重新訂閱的訂閱

WebSocket、`EventSource`、SDK——任何僅僅因為閉包過期就要拆掉連線重建的地方，都很難堪：

```tsx
function usePriceFeed(symbol: string, threshold: number) {
  const [price, setPrice] = useState(0);

  const onMessage = useEvent((e: MessageEvent) => {
    const next = JSON.parse(e.data).price as number;
    setPrice(next);
    if (next > threshold) notify(symbol, next); // 永遠是最新的 threshold
  });

  useEffect(() => {
    const ws = new WebSocket(`wss://feed.example.com/${symbol}`);
    ws.addEventListener('message', onMessage);
    return () => ws.close();
  }, [symbol, onMessage]); // 只有 symbol 變化才重連

  return price;
}
```

socket 在 `symbol` 變化時重連——這是正當理由——而 `threshold` 變化時絕不重連。注意：對於普通 DOM 目標，[`useEventListener`](https://reactuse.com/effect/useeventlistener/) 內部已經做了這件事（它用 `useLatest` 包住你的 handler），所以只有當訂閱管道由*你自己*掌管時才需要 `useEvent`。

### 計時器——或者直接用庫裡現成的

上面的心跳例子太常見了，`@reactuses/core` 直接內建了解法：[`useInterval`](https://reactuse.com/effect/useinterval/) 讓回呼保持新鮮而不重啟計時器——它自己的實作就建構在 `useEvent` 和 `useLatest` 之上。[`useTimeout`](https://reactuse.com/effect/usetimeout/)、[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)、[`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 也是同樣的故事：過期閉包防護是內建的，所以在自己動手接 `useEvent` 之前，先看看你要造的 Hook 是不是已經存在了。

### 傳給命令式元件的穩定回呼

圖表庫、地圖 SDK、編輯器通常在建構時接收處理函式：

```tsx
function Editor({ docId }: { docId: string }) {
  const [dirty, setDirty] = useState(false);

  const handleSave = useEvent((content: string) => {
    saveDocument(docId, content); // 最新的 docId
    setDirty(false);
  });

  useEffect(() => {
    const editor = createEditor('#mount', { onSave: handleSave });
    return () => editor.destroy();
  }, [handleSave]); // 穩定 → 編輯器只建立一次

  return <div id="mount" data-dirty={dirty} />;
}
```

僅僅因為 `docId` 在閉包裡換了個引用就重建一個重量級編輯器——這正是 `useEvent` 要消滅的浪費。

## 兩條規則

只有兩條，都是 ref 更新時機的直接推論：

1. **不要在渲染期間呼叫回傳的函式。** 它屬於事件處理、effect、計時器、回呼——commit 之後才觸發的東西。渲染期間，ref 可能還指向上一次的閉包。
2. **不要用它對 effect 撒謊。** 如果一個 effect 確實*應該*在某個值變化時重新執行（比如篩選條件變化時重新請求資料），用 `useEvent` 包住邏輯來讓 linter 閉嘴，等於埋掉了一個真實依賴。`useEvent` 是「讀最新值、不重新觸發」；它不是依賴陣列的萬能靜音鍵。

## 要點回顧

- **[`useEvent`](https://reactuse.com/effect/useevent/) 回傳一個引用永久不變、閉包永遠新鮮的函式**——正是 `useCallback` 逼你二選一的那兩樣東西。
- **技巧是一個在 layout effect 裡更新的 ref**，加一個只 memoize 一次、呼叫時才讀 ref 的包裝函式。[`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) 保證 SSR 安全。
- **渲染期間的值用 `useCallback`，事後觸發的處理函式用 `useEvent`。** 永遠不要在渲染期間呼叫 `useEvent` 的函式。
- **React 19.2+ 上，`useEffectEvent` 覆蓋 effect 內部的場景**且有 linter 保駕；跨元件、跨庫邊界傳遞的穩定處理函式則交給 `useEvent`。
- **先查庫裡有沒有現成的**——[`useEventListener`](https://reactuse.com/effect/useeventlistener/)、[`useInterval`](https://reactuse.com/effect/useinterval/)、[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 等等都已內建過期閉包防護。

從 [`@reactuses/core`](https://reactuse.com/effect/useevent/) 獲取它，退出依賴陣列打地鼠遊戲。
