---
title: "useEffect 之外:專門處理非同步、深比較和 SSR 的 Effect Hook"
description: "React 只內建了一個 effect hook,這意味著你要在每個專案裡重複造同一批 wrapper。這篇文章梳理 ReactUse 裡的九個專門 effect hook——useAsyncEffect、useUpdateEffect、useDeepCompareEffect、useCustomCompareEffect、useOnceEffect、useIsomorphicLayoutEffect、useUpdateLayoutEffect、useMount、useUnmount——以及它們各自消除的摩擦。"
slug: react-specialized-effect-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-19
tags: [react, hooks, performance, tutorial, ssr]
keywords: [react useEffect 替代, react useAsyncEffect, react useUpdateEffect, react useDeepCompareEffect, react useCustomCompareEffect, react useIsomorphicLayoutEffect, react useMount, react useUnmount, react useEffect 非同步, react useEffect 深比較, react useEffect 跳過 mount, react useLayoutEffect SSR]
image: /img/og.png
---

# useEffect 之外:專門處理非同步、深比較和 SSR 的 Effect Hook

React 只給了你一個 effect hook:`useEffect`。其他所有 effect 模式——掛載後只跑一次、跳過首次渲染、比較物件依賴、不帶競態地處理非同步、不在服務端報警告地跑 layout effect——都得你自己拼。大多數團隊最後都會在 `utils/hooks.ts` 裡塞五六個 wrapper hook。不同團隊寫的是同一個東西的不同變體,其中有些版本是錯的。

<!-- truncate -->

這種重複性的基礎設施不應該出現在你的程式碼庫裡。[ReactUse](https://reactuse.com) 已經把這些專門 effect hook 給你做好了——圍繞 `useEffect` 和 `useLayoutEffect` 的一組小而專的封裝,把最常見的缺口都補齊了。這篇文章過一遍其中九個:`useEffect` 在哪裡彆扭、專門 hook 做了什麼不同的事、以及一個能用上的具體例子。

如果你已經在用 ReactUse 的計時器([上週寫過](/blog/react-timer-hooks/))、observer 或者瀏覽器 API,可能已經無意識地匯入過其中幾個了。專門走一遍的意義是:在你下次再寫那個 wrapper 之前,先知道工具箱裡有什麼。

## 為什麼單個 useEffect 不夠用

來看一個真實元件裡的一行:

```tsx
useEffect(() => {
  fetch(`/api/user/${id}`).then((r) => r.json()).then(setUser);
}, [id]);
```

這一段第一天就有四個問題,過一個月還會有第五個:

1. **沒有 abort。** 如果 `id` 在請求飛行中變了,舊請求會在新請求之後才返回,把新資料覆蓋掉——經典的競態。
2. **沒法用 async/await。** 你不能把 effect 回撥標成 `async`,因為 React 要的是 `undefined` 或者一個清理函式,不是 Promise。所以每個非同步 effect 不是用 `.then` 鏈就是包一個 IIFE。
3. **沒法跳過 mount。** 有時候你只想在 `id` 變化時響應,而不是在元件首次渲染時跑(初始資料是父元件給的)。普通 `useEffect` 至少要跑一次。
4. **依賴不會做深比較。** 如果 `id` 是 `{ workspace: "a", user: "b" }`,父元件每次重渲染都會產生新的物件引用,effect 每次都會跑,即使內容沒變。
5. **SSR + `useLayoutEffect`。** 一個月後有人把元件改成用 `useLayoutEffect` 做 DOM 測量,SSR 每次渲染都會打警告。

每個問題都能修,但修起來 5 到 30 行程式碼,而且很容易錯得很隱蔽。下面這些 hook 直接把每個缺口堵上。

## 1. useAsyncEffect — 不需要 IIFE 的 async/await

第一次寫都會寫出來的模式:

```tsx
useEffect(() => {
  let cancelled = false;
  (async () => {
    const r = await fetch(`/api/user/${id}`);
    const data = await r.json();
    if (!cancelled) setUser(data);
  })();
  return () => { cancelled = true; };
}, [id]);
```

這是對的。這也是 6 行樣板程式碼,本來如果 React 允許的話,一句 `async () => { setUser(await fetch(...).then((r) => r.json())); }` 就能搞定。[`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/) 就是把這個缺口補上:

```tsx
import { useAsyncEffect } from "@reactuses/core";

useAsyncEffect(async () => {
  const r = await fetch(`/api/user/${id}`);
  setUser(await r.json());
}, [id]);
```

這個 hook 直接接受 `async` 回撥,並忽略掉返回的 Promise(不會產生 cleanup 警告)。它**不會**幫你處理取消——那是下一個 hook 的事,或者你手動用 `AbortController`。當非同步體很短、不需要中途退出時,用 `useAsyncEffect`。需要取消時,接一個 `AbortController`:

```tsx
useAsyncEffect(async (signal) => {
  const r = await fetch(`/api/user/${id}`, { signal });
  setUser(await r.json());
}, [id]);
```

hook 把一個 `AbortSignal` 作為第一個引數傳進來,清理時會 abort 它,所以飛行中的請求被取消,而不是回到一個過期的 state setter 上。

這一個 hook 大約能消除典型程式碼庫裡 80% 的「我本該寫個 wrapper」時刻。大部分資料請求 effect 都是短的、非同步的、希望在變化時被取消。`useAsyncEffect` 就是這個形狀。

## 2. useUpdateEffect — 跳過 mount

`useEffect` 總是在第一次渲染後就跑一次。有時候這是錯的:如果一個元件已經從 props 拿到初始值,在 mount 時跑 effect 要麼重複了工作,要麼在還沒真正變化時就觸發了「值變了」的通知。

普通 React 的繞過辦法是一個 ref:

```tsx
const isFirst = useRef(true);
useEffect(() => {
  if (isFirst.current) { isFirst.current = false; return; }
  onChange(value);
}, [value]);
```

這是對的,但每個團隊的程式碼庫裡都至少有三個這樣的版本。[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 跟 `useEffect` 一樣,只是少了第一次:

```tsx
import { useUpdateEffect } from "@reactuses/core";

useUpdateEffect(() => {
  onChange(value);
}, [value]);
```

最常見的用法是**受控元件的變更通知**。你希望在內部 value 變化時呼叫 `onChange`,而不是在父元件第一次用初始值掛載元件時。普通 `useEffect` 版本會在 mount 時觸發,父元件在使用者什麼都還沒做的時候就收到了一個虛假的 `onChange(initialValue)`。

第二個用法是**埋點**:「filter 變化時發 `viewed_filter` 事件。」mount 不是變化,它是起始狀態。

## 3. useMount — 「掛載時跑一次」的慣用法

`useEffect(() => { /* ... */ }, [])` 在技術上確實是「mount 時跑一次」的正確寫法。它也視覺上吵鬧,而且經常被 lint 規則誤傷(eslint 的 `exhaustive-deps` 會在回撥閉包到任何變數時抱怨,即使你確實想要「mount 時的快照」)。

[`useMount`](https://reactuse.com/effect/usemount/) 是一個單用途的別名,文件化了意圖:

```tsx
import { useMount } from "@reactuses/core";

useMount(() => {
  trackPageView();
  initialiseSentry();
});
```

功能上等同於 `useEffect(fn, [])`,但名字就是文件。看到 `useMount`,你不用看依賴就知道回撥正好跑一次。看到 `useEffect(fn, [])`,你得掃一遍 body 才能確認沒有閉包到本該出現在依賴裡的響應式變數。

## 4. useUnmount — 不需要空 effect 的清理

`useMount` 的映象。普通 React 寫「解除安裝時做 X」是這樣:

```tsx
useEffect(() => () => doCleanup(), []);
```

這解析為「effect 回撥返回一個清理函式」。是對的,但內層的雙箭頭屬於沒人會讀第二遍的東西。[`useUnmount`](https://reactuse.com/effect/useunmount/) 是顯式版本:

```tsx
import { useUnmount } from "@reactuses/core";

useUnmount(() => {
  socket.close();
  flushAnalytics();
});
```

這個 hook 內部用 ref 捕獲最新的回撥,所以你在解除安裝時拿到的是最新的值,而不是 mount 時的值。這修了普通 React 版本里一個隱蔽的 bug:如果你寫 `useEffect(() => () => doCleanup(value), [])`,`value` 是 mount 時被捕獲的,清理跑的是過期資料。`useUnmount` 沒這個 bug。

## 5. useDeepCompareEffect — 當你的依賴是物件

React 用 `Object.is` 比較 effect 依賴。如果依賴是物件或陣列,父元件每次重渲染都產生新引用,即使內容相同 effect 也會跑。大部分團隊會去 `JSON.stringify` 依賴,這對淺資料有效,對帶函式、Date 或不可序列化值的就崩了。

[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 把 `Object.is` 換成結構化的深度相等檢查:

```tsx
import { useDeepCompareEffect } from "@reactuses/core";

useDeepCompareEffect(() => {
  fetcher.run(query);
}, [query]); // query 是 { workspace: "a", filters: { ... } }
```

當父元件重渲染,生成一個內容相同的新 `query` 物件時,effect 不會重跑。當內容真的變了,它才跑。代價是深度相等檢查是 O(n) 的——不是免費的。當你有個小物件依賴、又無法在源頭 memo 它時,選這個。如果能 `useMemo`,優先 `useMemo`。

有一個坑:不要把 `useDeepCompareEffect` 用在只有原始值的依賴上。如果你傳 `[someString, someNumber]`,hook 會拋錯——對那種情況 `useEffect` 才是對的工具,而 hook 會大聲失敗,免得你悄悄拖慢一個本來不需要的 effect。

## 6. useCustomCompareEffect — 深比較,但按你的規則

有時候你想要的相等性既不是淺的也不是完全結構化的。兩種情況經常出現:

- 按單個欄位比較(比如 `prev.id === next.id`)。
- 用你已經依賴的庫比較(比如 `lodash.isEqual`、`dequal`)。

[`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/) 接受第三個引數:一個比較器,決定新依賴是否應該觸發 effect。

```tsx
import { useCustomCompareEffect } from "@reactuses/core";
import { dequal } from "dequal";

useCustomCompareEffect(
  () => loadDashboard(filters),
  [filters],
  (prev, next) => dequal(prev, next),
);
```

相比 `useDeepCompareEffect` 的好處是**你控制成本**。對 200 個欄位的配置物件做深比較很慢;`(prev, next) => prev.version === next.version` 只比較一次。有 version 欄位就用它。

這也是**模糊**相等的正確 hook——比如「兩個滾動位置只要相差 5 畫素以內就認為相等」。普通 `useEffect` 版本需要一個 wrapper ref 加一段 effect 內部的手寫比較;custom-compare 版本把相等性邏輯跟依賴放在一起。

## 7. useOnceEffect — 跑且只跑一次,但依賴是響應式的

`useEffect(fn, [])` 在 mount 時跑一次,但回撥閉包到的是那一刻依賴的值——通常是 `undefined` 或初始值。如果你真正想要的是**`user` 第一次非 loading 的值**觸發 effect,那麼 `useEffect(fn, [user])`(每次 `user` 變都跑)和 `useEffect(fn, [])`(mount 時跑而 `user` 還是 `null`)都不對。

[`useOnceEffect`](https://reactuse.com/effect/useonceeffect/) 在任一依賴第一次從初始值變化時跑 effect,然後再也不跑:

```tsx
import { useOnceEffect } from "@reactuses/core";

function PersonalisedGreeting() {
  const { user } = useAuth(); // user 在載入完成前是 null

  useOnceEffect(() => {
    track("personalised_greeting_seen", { userId: user.id });
  }, [user]);

  return user ? <h1>Hi, {user.name}!</h1> : null;
}
```

effect 觸發一次——`user` 第一次變成非 null 時——之後即使 `user` 再變也不會再觸發。這是首屏埋點、一次性 onboarding 觸發、以及「等前置條件就緒後做這件事」模式的正確形狀。普通 React 版本是 ref 加 flag 的舞蹈,誰都寫過,誰也不想再讀一遍。

`useOnceEffect` 也有 layout-effect 的兄弟,[`useOnceLayoutEffect`](https://reactuse.com/effect/useoncelayouteffect/),用於同樣的模式但需要在 paint 前做 DOM 測量。

## 8. useIsomorphicLayoutEffect — 讓 SSR 警告消失

`useLayoutEffect` 在 DOM 變更後、paint 前同步執行。它是讀取佈局(測元素尺寸)和在同一個 tick 內寫 DOM(把 tooltip 定位到觸發器旁邊)的正確 hook。它也是會在 SSR 時打這條警告的 hook:

> useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format.

標準修法是在 `typeof window === "undefined"` 時把 `useLayoutEffect` 換成 `useEffect`。這就是 [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) 做的事:

```tsx
import { useIsomorphicLayoutEffect } from "@reactuses/core";

useIsomorphicLayoutEffect(() => {
  const { width } = ref.current!.getBoundingClientRect();
  setWidth(width);
}, []);
```

在服務端,這是 `useEffect`(SSR 期間是 no-op——沒問題,因為根本沒有可測的佈局)。在客戶端,這是 `useLayoutEffect`(同步觸發,這正是你做佈局讀取時想要的)。一個 import,沒警告,沒特殊處理。

這是 React 生態裡被複制最多的一段程式碼。如果你在 SSR 程式碼庫(Next.js、Remix、Astro 帶島嶼)裡任何地方用了 `useLayoutEffect`,這個 hook 就該是預設選擇。

## 9. useUpdateLayoutEffect — useUpdateEffect 的 layout 版本

`useUpdateEffect` 的 layout-effect 兄弟。同樣的模式:跳過首次渲染,在之後每次依賴變化時跑,但在 layout-effect 時刻跑,所以 DOM 變更發生在 paint 之前。

[`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) 在 layout 驅動的動畫裡特別有用:

```tsx
import { useUpdateLayoutEffect } from "@reactuses/core";

useUpdateLayoutEffect(() => {
  const el = listRef.current;
  if (!el) return;
  el.style.transform = `translateY(${activeIndex * itemHeight}px)`;
}, [activeIndex]);
```

為什麼不用 `useUpdateEffect`?因為 `useEffect` 在 paint 之後觸發,滑動動畫會肉眼可見地從舊位置出發然後才閃到新位置。`useLayoutEffect` 在 paint 之前跑,新 transform 在同一幀應用。為什麼不用普通 `useLayoutEffect`?因為首次渲染時 `activeIndex` 是初始值,沒有動畫要開始。

「跳過 mount 的 layout effect」組合,正好是「動畫一個變化,但不是初始值」的形狀。也是「受控焦點」的形狀:在 `activeTab` 變化時把焦點移到新 tab 內容上,但不要在元件第一次以 `activeTab="home"` 掛載時這樣做。

## 何時用哪個:決策表

完整一組,集中放在一處:

| 情景                                                | 選用                          |
|-----------------------------------------------------|-------------------------------|
| 非同步 effect 體,需要可取消                          | `useAsyncEffect`              |
| 跳過第一次,響應之後的每次變化                      | `useUpdateEffect`             |
| 同上,但用 layout effect                            | `useUpdateLayoutEffect`       |
| 掛載時跑一次(意圖更清晰)                          | `useMount`                    |
| 解除安裝時跑一次(不會捕獲過期值)                      | `useUnmount`                  |
| effect 依賴是物件,想要結構化相等                   | `useDeepCompareEffect`        |
| effect 依賴需要自定義相等檢查                       | `useCustomCompareEffect`      |
| 只跑一次,但要等某個依賴「就緒」                    | `useOnceEffect`               |
| 同上,layout effect 版本                            | `useOnceLayoutEffect`         |
| SSR 時不會警告的 layout effect                      | `useIsomorphicLayoutEffect`   |

記住三條:

1. **預設還是 `useEffect`。** 專門 hook 是給上面這些情況用的;不要預防性地用。
2. **layout 配 layout,非同步配非同步。** 如果你在做 DOM 測量,選 layout-effect 家族。如果在做資料請求,選 `useAsyncEffect`。混著用會有閃爍或競態。
3. **`useUpdateEffect` 不是「useEffect 的效能最佳化」。** 它改變行為,不是效能。第一次渲染仍然發生,你只是不在它上面跑 effect。如果你的目標是效能,看依賴陣列,不是看 hook。

## 一個真實的組合

一個常見的 React 模式:一個「搜尋結果」面板,在 query 變化時請求,在 mount 時跳過請求(父元件傳了初始結果),並向螢幕閱讀器宣佈「搜尋已更新」——但不在 mount 時宣佈,因為標題已經傳達了相同的資訊。

```tsx
import {
  useAsyncEffect,
  useUpdateEffect,
  useIsomorphicLayoutEffect,
} from "@reactuses/core";

function SearchResults({ query, initialResults }: {
  query: string;
  initialResults: Result[];
}) {
  const [results, setResults] = useState(initialResults);
  const announceRef = useRef<HTMLDivElement>(null);

  // 跳過 mount;之後每次 query 變化都請求。
  useUpdateEffect(() => {
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setResults(data); });
    return () => { cancelled = true; };
  }, [query]);

  // Layout effect:讀取結果數並在 paint 前更新 aria-live。
  // 跳過 mount,因為初始標題已經說過了。
  useIsomorphicLayoutEffect(() => {
    if (!announceRef.current) return;
    announceRef.current.textContent = `${results.length} 條 ${query} 的結果`;
  }, [results, query]);

  return (
    <>
      <div ref={announceRef} role="status" aria-live="polite" className="sr-only" />
      <ul>{results.map((r) => <li key={r.id}>{r.title}</li>)}</ul>
    </>
  );
}
```

三種行為,三個 hook,沒有 ref 加 flag。如果第一個 `useUpdateEffect` 的 body 變複雜到想用 async/await,把它換成 `useAsyncEffect`;其餘照舊。

## 上手試試

上面每個 hook 都有可執行的文件示例。讀 demo,改依賴,看哪些會觸發:

- [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/)
- [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)
- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/)
- [`useMount`](https://reactuse.com/effect/usemount/)
- [`useUnmount`](https://reactuse.com/effect/useunmount/)
- [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/)
- [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/)
- [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/)
- [`useOnceLayoutEffect`](https://reactuse.com/effect/useoncelayouteffect/)
- [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/)

用 `npm install @reactuses/core`(或 `pnpm add @reactuses/core`)安裝,直接 import。沒有 provider,除了 React 16.8+ 之外沒有 peer dependency。完整的 hook 列表和原始碼在 [reactuse.com](https://reactuse.com)。

`useEffect` 是個原語。這些 hook 是你在它之上一次性建好、不再每個專案重新發明的那一層語言。
