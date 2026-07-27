---
title: "React useDeepCompareEffect：修復 useEffect 的物件依賴問題（2026）"
description: "當依賴是物件或陣列時，useEffect 為什麼會無限重跑，以及 useDeepCompareEffect 如何解決。涵蓋真實實作、多出來的那一次渲染、lodash isEqual 搞不定的「函式進依賴」陷阱、用 useCustomCompareEffect 降低比較成本，以及讓 exhaustive-deps 繼續生效的 ESLint 設定。TypeScript 優先。"
slug: react-usedeepcompareeffect-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-27
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useDeepCompareEffect, useDeepCompareEffect hook, usedeepcompareeffect react, react useEffect 物件依賴, useEffect 無限迴圈, useEffect 深比較, react 依賴深比較, useEffect 陣列依賴, react useEffect 每次渲染都執行, useCustomCompareEffect, react effect 依賴陣列 物件, useDeepCompareEffect typescript]
image: /img/og.png
---

# React useDeepCompareEffect：修復 useEffect 的物件依賴問題（2026）

你接了一個請求。API 要一個 query 物件，於是你把它放進依賴陣列。effect 觸發、setState、元件重新渲染、query 物件被重新建立——一個內容完全相同的全新物件——effect 又一次觸發。你寫出了一個無限迴圈，而 React 認為自己完全照你說的做了。

```tsx
function Results({ term, page }: Props) {
  const [rows, setRows] = useState([]);
  const query = { term, page, sort: 'desc' }; // 每次渲染都是新物件

  useEffect(() => {
    fetchRows(query).then(setRows); // setRows → 重渲染 → 新 query → 🔁
  }, [query]);
}
```

[`@reactuses/core`](https://reactuse.com) 的 `useDeepCompareEffect` 是 `useEffect` 的直接替代品，它按**值**比較依賴，而不是按參考。簽章一樣、清理語意一樣——只是當依賴並沒有真正變化時，effect 不再觸發。以下都是真實實作，TypeScript 優先，包括那些確實要付出代價的部分。

<!-- truncate -->

## 為什麼 `useEffect` 看不出來

React 用 `Object.is` 逐項比較依賴陣列。對基本型別這正是你要的：`5` 就是 `5`，`'desc'` 就是 `'desc'`。但對任何帶身份的東西——物件、陣列、`Date`、`Map`、函式——它比較的是**參考**，而寫在元件本體裡的字面量每一次渲染都會產生一個全新的參考：

```js
Object.is({ term: 'react' }, { term: 'react' }); // false —— 不同的物件
```

所以按 React 的定義，依賴每次渲染都「變了」。這不是 `useEffect` 的 bug；參考比較是唯一 O(1) 的比較方式，而 React 要在每個元件的每次渲染上都跑一遍。值比較的成本是真實存在的，React 拒絕替你承擔。

於是這筆帳落到了你頭上——用這種或那種方式。

## 常見的繞法，以及它們在哪裡散架

**把物件 memo 掉。** 正確，而且在只有一個依賴時就是標準答案：

```tsx
const query = useMemo(() => ({ term, page, sort: 'desc' }), [term, page]);
```

它散架在物件不歸你管的時候。資料來自一次 fetch、一個 context、一個表單函式庫、一個可以隨意重渲染的父元件——你沒辦法在來源端 `useMemo` 一個 prop，於是你 memo 了一份拷貝，現在你要維護一個平行的依賴陣列，它必須和物件的結構保持同步。加一個欄位、忘了改 memo，你就發布了一個不會更新的 effect。

**把基本型別攤進陣列。** 同樣正確，同樣脆弱：

```tsx
useEffect(() => { fetchRows(query); }, [query.term, query.page, query.sort]);
```

一旦物件巢狀、可選、或者含有不受你控制的欄位，它就不行了。`[config.retry.limit, config.retry.backoff, config.auth?.scheme]` 這種依賴陣列，會在某人加欄位的那天悄悄出錯。

**`JSON.stringify` 一下依賴。** 很誘人，也確實流行：

```tsx
useEffect(() => { fetchRows(query); }, [JSON.stringify(query)]);
```

但它**每次渲染都序列化**，不管有沒有變化；鍵的順序會影響結果（`{a,b}` 和 `{b,a}` 被認為「不同」）；`undefined` 和函式會靜默消失；`Date` 變成字串；`Map` 和 `Set` 變成 `{}`；遇到循環參考直接拋錯。它就是一次語意更差、還沒有提前退出的深比較。

**關掉 lint 規則然後祈禱。** 這是真正會被發布出去的那個方案，也是半年後引發閉包過期 bug 的那個。

## useDeepCompareEffect

```tsx
import { useDeepCompareEffect } from '@reactuses/core';

function Results({ term, page }: Props) {
  const [rows, setRows] = useState([]);
  const query = { term, page, sort: 'desc' };

  useDeepCompareEffect(() => {
    let cancelled = false;
    fetchRows(query).then((r) => !cancelled && setRows(r));
    return () => { cancelled = true; };
  }, [query]);
}
```

簽章和 `useEffect` 完全一致：

```ts
function useDeepCompareEffect(
  effect: EffectCallback,   // 可以回傳清理函式
  deps: DependencyList
): void;
```

沒有任何新概念：effect 在掛載後執行，在依賴列表與上一次**深度不相等**時重新執行，回傳的清理函式在每次重跑前和卸載時執行。上面那個迴圈在第一次請求後就停了，因為 `{ term: 'react', page: 1, sort: 'desc' }` 和上一次渲染的物件深度相等。

深比較來自 lodash 的 `isEqual`，覆蓋面是可靠的那種——巢狀物件和陣列、按時間戳比較的 `Date`、按 source 和 flags 比較的 `RegExp`、按內容而非插入順序比較的 `Map` 和 `Set`：

```js
isEqual(new Date(0), new Date(0));                    // true
isEqual(new Map([['a', 1]]), new Map([['a', 1]]));    // true
isEqual(new Set([1, 2]), new Set([2, 1]));            // true
isEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } });  // true
```

## 它到底怎麼運作的（以及它多花的那一次渲染）

值得理解一下，因為它解釋了唯一一個會讓人意外的行為。`useDeepCompareEffect` 是 [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/) 傳入 `isEqual` 作為比較器的一層薄封裝，核心大概十行：

```tsx
const ref = useRef<TDeps | undefined>(undefined);
const forceUpdate = useUpdate();

if (!ref.current) ref.current = deps;

useIsomorphicLayoutEffect(() => {
  if (!depsEqual(deps, ref.current)) {
    ref.current = deps;   // 採用新依賴
    forceUpdate();        // 並重新渲染，好讓 useEffect 看到它們
  }
});

useEffect(effect, ref.current); // React 永遠只看到那個穩定的 ref 陣列
```

訣竅在於：React 拿到的從來不是你新建的那個陣列，而是 `ref.current`——只有當比較認定「確實變了」時它才會被換掉。深度相等的渲染交給 React 的是同一個陣列，於是 React 正確地得出結論：無事可做。

代價——這是必須誠實說明的部分——是**一次真正的依賴變化會多花一次渲染**。layout effect 發現變化時，`useEffect` 已經帶著舊陣列註冊完了，所以它更新 ref 並強制重渲染；effect 在第二趟才觸發。因為用的是 layout effect，這一切發生在瀏覽器繪製之前，你不會看到任何閃爍。但如果你在一個高頻元件裡數渲染次數，把這一次算上。（依賴已經參考相等時比較會被完全跳過——`isEqual` 在 `===` 上短路，所以穩態開銷很低。）

這也意味著內部的 [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) 保證了整體的 SSR 安全：伺服器渲染時不會出現 `useLayoutEffect` 警告。

## 陷阱：依賴陣列裡的函式

這個坑很多人踩，而且沒有任何深比較 hook 能救你。**lodash 的 `isEqual` 按參考比較函式**——兩個原始碼完全相同的函式永遠不相等：

```js
isEqual(() => {}, () => {});                         // false
isEqual({ url: '/api', onDone: () => {} },
        { url: '/api', onDone: () => {} });          // false ← 整個物件也一樣
```

第二行才是致命的。物件裡任何一處內聯回呼，都會讓**整個物件**永久不相等，你的 `useDeepCompareEffect` 就靜默退化成了一個每次渲染都觸發的普通 `useEffect`——無限迴圈回來了，而且每次還附贈一次額外渲染。

```tsx
// 🔴 永遠觸發 —— onSuccess 每次渲染都是新函式
useDeepCompareEffect(() => {
  subscribe(config);
}, [{ ...config, onSuccess: (d) => setData(d) }]);
```

解法是把函式從被比較的值裡拿出去。用一個永遠指向最新版本的 ref 持有回呼，只依賴資料：

```tsx
// ✅ 比較資料；透過 ref 讀回呼
const onSuccess = useLatest((d: Data) => setData(d));

useDeepCompareEffect(() => {
  subscribe(config, (d) => onSuccess.current(d));
}, [config]);
```

[`useLatest`](https://reactuse.com/state/uselatest/) 每次渲染都把 ref 釘在最新的值上，於是 effect 呼叫的是「今天的」回呼，卻不依賴它的身份。如果你更想直接把回呼傳出去，[`useEvent`](https://reactuse.com/effect/useevent/) 做同樣的事，但給你一個身份穩定的函式。兩者共同推出的規則是：**依賴陣列裡放資料，不放行為。**

## 深比較太貴的時候：useCustomCompareEffect

`isEqual` 會走訪整個結構。對一個小小的設定物件來說這不算什麼——幾次屬性讀取，比它省下的那次渲染還便宜。但對一個 5000 列的 API 回應，它就是每次渲染都做一次完整走訪，你用「一次不必要的 effect」換來了「一次必然的走訪」。

當你清楚真正重要的是什麼時，就只比較那部分：

```tsx
import { useCustomCompareEffect } from '@reactuses/core';

useCustomCompareEffect(
  () => { renderChart(dataset); },
  [dataset],
  ([prev], [next]) => prev.id === next.id && prev.updatedAt === next.updatedAt,
);
```

兩次欄位讀取，取代 5000 個元素的走訪。比較器接收上一次和下一次的依賴**陣列**，在應該被視為相等時回傳 `true`——和 `isEqual` 履行的是同一份契約，只是烤進了你的領域知識。任何帶版本號、ETag、`updatedAt` 或穩定 id 的東西都是候選。

一個粗略的決策規則：

| 依賴 | 選擇 |
| --- | --- |
| 只有基本型別 | 原生 `useEffect` |
| 小的 config / options / query 物件 | `useDeepCompareEffect` |
| 一個你自己擁有並控制的物件 | 在來源端 `useMemo` |
| 大資料，或天然有版本欄位 | `useCustomCompareEffect` |
| 一個函式 | `useLatest` / `useEvent`，然後只依賴資料 |

## 讓 exhaustive-deps 繼續運作

`react-hooks/exhaustive-deps` 這條 lint 規則不知道你的自訂 hook 也接收依賴陣列，所以它乾脆不檢查了——閉包過期就是這麼溜進來的。告訴它：

```js
// eslint.config.js
{
  rules: {
    'react-hooks/exhaustive-deps': ['warn', {
      additionalHooks: '(useDeepCompareEffect|useCustomCompareEffect)',
    }],
  },
}
```

現在你在 `useEffect` 上依賴的那些「缺少依賴」告警，在這裡同樣生效。值得第一天就設定好——一個依賴陣列不完整的深比較 hook 比普通 effect 更難除錯，因為「重跑得太頻繁」至少會自己吵出來，而「永遠不重跑」只會安靜地端出過期資料。

## 兩條能避開大部分意外的規則

**不要在只有基本型別或空依賴時用它。** 當每個依賴都是字串或數字時，深比較相比 `Object.is` 什麼也沒多買到——純粹是開銷，外加一次可能的額外渲染。傳空陣列是這個 hook 會在開發環境主動警告你的錯誤：

> `useDeepCompareEffect` should not be used with no dependencies. Use React.useEffect instead.

只跑一次的 effect，用 [`useMount`](https://reactuse.com/effect/usemount/) 更能表達意圖。想跳過首次執行，用 [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)。

**保持陣列長度固定。** 這是 React 自己的約束，不是這個 hook 的：依賴陣列在兩次渲染之間改變長度會觸發開發環境警告，比較行為也未定義。不要條件式地拼陣列——`[config, ...(flag ? [extra] : [])]` 是一個在等某個星期二爆發的 bug。把那個條件值放進物件依賴**裡面**，交給深比較處理。

## 真實使用場景

- **帶 query 物件的資料請求。** 最經典的場景，也就是本文開頭那個——內聯拼出來傳給 API 的篩選條件、分頁、排序狀態。
- **按 config 建立的訂閱。** WebSocket 主題、event-source 頻道、由 options 物件設定的 observer——每次渲染都重新訂閱是一個帶心跳的資源洩漏。
- **圖表和地圖函式庫。** 這類命令式函式庫接收 options 物件，重新設定一次要花真實的毫秒數。深比較一個 config 物件，遠比一次無謂的 `chart.setOption()` 便宜。
- **由解析資料驅動的 effect。** 解析成物件的 URL search params、從 `localStorage` 讀出的 JSON、解碼後的 JWT payload——每次渲染都是新參考，實際內容卻穩定不變。
- **不歸你管的 props。** 第三方元件遞給你一個它內部重建的 options 物件。你沒辦法在來源端 memo，但可以在使用端按值比較。

## 要點回顧

- **`useEffect` 按參考比較**，所以內聯的物件或陣列依賴每次渲染都是「新的」——這就是無限迴圈和請求風暴的成因，不是你邏輯寫錯了。
- **[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 就是按值比較的 `useEffect`**——簽章一致、清理語意一致，底層是 lodash `isEqual`（覆蓋巢狀結構、`Date`、`Map`、`Set`、`RegExp`）。
- **一次真正的變化會多花一次渲染。** 因為是 layout effect，不會有閃爍——但在熱點路徑上用之前，先知道它的存在。
- **依賴裡的函式會讓它失效。** `isEqual` 按參考比較函式，一個內聯回呼就能污染整個物件。行為交給 [`useLatest`](https://reactuse.com/state/uselatest/) / [`useEvent`](https://reactuse.com/effect/useevent/)，依賴陣列裡只放資料。
- **大依賴用 [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/)**——比較一個 `id` 和一個 `updatedAt`，別去走訪 5000 列。
- **給 `exhaustive-deps` 加上 `additionalHooks`**，並且在只有基本型別或空依賴陣列時乾脆別用這個 hook。

從 [`@reactuses/core`](https://reactuse.com/effect/usedeepcompareeffect/) 拿來用，讓你的 effect 在資料變化時觸發——而不是在物件字面量變化時。
