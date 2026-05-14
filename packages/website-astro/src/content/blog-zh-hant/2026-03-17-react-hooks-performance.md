---
title: "React Hooks 效能優化：如何避免不必要的重新渲染"
description: "實用的 React Hooks 效能優化技巧——了解何時使用 useMemo、useCallback，以及像 ReactUse 這樣設計良好的 Hooks 函式庫如何幫助你撰寫更快的元件。"
slug: react-hooks-performance
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-17
tags: [react, hooks, performance, optimization, best-practices]
keywords: [react hooks performance, react re-render, useMemo, useCallback, react optimization, avoid re-renders]
image: /img/og.png
---

# React Hooks 效能優化：如何避免不必要的重新渲染

效能是區分生產級 React 程式碼和教學級程式碼的關鍵因素。大多數 React 應用程式其實沒有渲染問題——但有問題的那些會讓人感覺遲緩、卡頓和令人沮喪。關鍵在於知道*何時*優化很重要、React 提供了*哪些*工具，以及設計良好的 Hooks 函式庫已經在*哪些地方*為你做好了優化。

<!-- truncate -->

## React 何時重新渲染？

當以下三種情況之一發生時，元件會重新渲染：

1. **狀態改變。** 呼叫 `setState` 會排程該元件及其所有子元件的重新渲染。
2. **父元件重新渲染。** 即使子元件的 props 沒有改變，當父元件渲染時，React 預設也會重新渲染子元件。
3. **消費的 context 改變。** 任何呼叫了 `useContext(SomeContext)` 的元件都會在該 context 值改變時重新渲染。

理解這三個觸發條件是基礎。本文中的每種優化技巧都是針對其中一個或多個問題。

## 重新渲染的真實成本

並非所有重新渲染都是昂貴的。React 的虛擬 DOM diff 演算法很快。一個只回傳幾個 `<div>` 元素的元件可以重新渲染數千次而使用者毫無感覺。真正的成本來自：

- **渲染路徑中的昂貴計算**（過濾大陣列、複雜數學運算）。
- **因相依性變化而觸發的昂貴副作用**（API 呼叫、DOM 測量）。
- **大型元件樹**中頂部的一個狀態變化層層傳播到數百個子元件。

優化之前，先測量。React DevTools Profiler 能精確顯示哪些元件重新渲染了以及每次渲染花了多長時間。優化慢的部分，而非所有東西。

## 規則一：不要過早優化

把每個值都包在 `useMemo` 裡、把每個函式都包在 `useCallback` 裡，這不是優化——而是額外開銷。每個記憶化 Hook 都有成本：React 必須儲存前一個值，在每次渲染時比較相依性，並管理快取的參照。如果被記憶化的計算本身就很簡單，記憶化的成本反而比直接重新計算更高。

```tsx
// 不要這樣做——記憶化的成本比加法運算本身還高
const total = useMemo(() => price + tax, [price, tax]);

// 直接計算就好
const total = price + tax;
```

只在你已經測量到效能問題、或者參照相等性對下游消費者很重要的情況下，才使用 `useMemo` 和 `useCallback`。

## useMemo——它真正有用的場景

`useMemo` 快取一個計算值，只在相依性改變時重新計算。它在兩個特定場景下有幫助：

**場景一：昂貴的計算。**

```tsx
function ProductList({ products, filter }: Props) {
  // 沒有 useMemo：每次渲染都過濾 10,000 個產品
  // 有 useMemo：只在 products 或 filter 變化時重新過濾
  const filtered = useMemo(
    () => products.filter((p) => p.category === filter),
    [products, filter]
  );

  return (
    <ul>
      {filtered.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

**場景二：為子元件 props 保持參照相等性。**

```tsx
function Dashboard({ data }: Props) {
  // 沒有 useMemo：每次渲染建立新物件，導致 React.memo 包裹的 Chart 失效
  const chartConfig = useMemo(
    () => ({ labels: data.map((d) => d.label), values: data.map((d) => d.value) }),
    [data]
  );

  return <MemoizedChart config={chartConfig} />;
}
```

## useCallback——被誤解的 Hook

`useCallback` 是函式版的 `useMemo`。只要相依性沒有改變，它就回傳相同的函式參照。常見的錯誤是「以防萬一」到處使用它。

`useCallback` 只在函式被傳遞給記憶化的子元件作為 prop、或作為其他 Hook 的相依性時才有意義。

```tsx
// 優化前：每次渲染都產生新的函式參照，MemoizedList 每次都重新渲染
function SearchPage() {
  const [query, setQuery] = useState("");

  const handleSelect = (id: string) => {
    console.log("Selected:", id);
  };

  return <MemoizedList onSelect={handleSelect} />;
}

// 優化後：穩定的參照，query 變化時 MemoizedList 跳過重新渲染
function SearchPage() {
  const [query, setQuery] = useState("");

  const handleSelect = useCallback((id: string) => {
    console.log("Selected:", id);
  }, []);

  return <MemoizedList onSelect={handleSelect} />;
}
```

如果 `MemoizedList` 沒有用 `React.memo` 包裹，`useCallback` 就毫無用處——子元件無論如何都會因為父元件重新渲染而重新渲染。

## 狀態結構很重要

你如何組織狀態直接影響哪些元件會重新渲染。

**拆分無關的狀態。** 當兩個狀態總是獨立變化時，把它們放在不同的 `useState` 中。把它們合併在一個物件裡意味著更新其中任何一個欄位都會導致讀取該物件的所有元件重新渲染。

```tsx
// 不好：更新 name 會導致只讀取 age 的元件也重新渲染
const [form, setForm] = useState({ name: "", age: 0 });

// 好：獨立更新，獨立重新渲染
const [name, setName] = useState("");
const [age, setAge] = useState(0);
```

**能衍生的就衍生。** 如果一個值可以從既有狀態計算得到，就不要把它存在狀態裡。衍生值消除了一整類同步 Bug 和不必要的重新渲染。

```tsx
// 不好：需要保持同步的額外狀態
const [items, setItems] = useState<Item[]>([]);
const [count, setCount] = useState(0);

// 好：從 items 衍生 count
const [items, setItems] = useState<Item[]>([]);
const count = items.length;
```

## useRef 模式：穩定回呼

高效能 Hooks 中的一個常見模式是將最新的回呼儲存在 ref 中。這樣你就得到一個穩定的函式參照，它總是呼叫回呼的最新版本——而不需要將回呼加入相依性陣列中。

```tsx
function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}
```

這個模式非常實用，ReactUse 基於同樣的思路提供了 `useLatest` Hook：

```tsx
import { useLatest } from "@reactuses/core";

function useInterval(callback: () => void, delay: number) {
  const callbackRef = useLatest(callback);

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), delay);
    return () => clearInterval(id);
  }, [delay]); // callback 不是相依性——ref 始終持有最新版本
}
```

## ReactUse Hooks 如何處理效能

ReactUse 的 Hooks 從設計之初就考慮了效能。以下是內部使用的關鍵模式：

**1. 用 ref 儲存回呼。** 像 `useThrottleFn` 和 `useDebounceFn` 這樣的 Hook 透過 `useLatest` 將你的回呼儲存在 ref 中。節流/防抖的包裝器透過 `useMemo` 只建立一次，並始終透過 ref 呼叫最新的回呼。這意味著你永遠不需要擔心閉包過期，也不需要將回呼加入相依性陣列中。

**2. 記憶化回傳值。** 昂貴的初始化（如建立節流函式）被包裹在 `useMemo` 中，只在組態參數改變時執行，而非每次渲染都執行。

**3. 自動清理。** 像 `useThrottleFn` 這樣的 Hook 在卸載時透過 `useUnmount` 取消待執行的計時器，防止在已卸載的元件上更新狀態，無需你手動清理。

```tsx
// ReactUse 的 useThrottleFn 內部——簡化版
function useThrottleFn(fn, wait, options) {
  const fnRef = useLatest(fn);                   // 1. ref 儲存回呼
  const throttled = useMemo(                      // 2. 記憶化包裝器
    () => throttle((...args) => fnRef.current(...args), wait, options),
    [wait]
  );
  useUnmount(() => throttled.cancel());           // 3. 自動清理
  return { run: throttled, cancel: throttled.cancel, flush: throttled.flush };
}
```

這些模式意味著當你使用 ReactUse Hooks 時，開箱即獲優化後的行為。你不需要在傳遞給 ReactUse Hooks 之前先用 `useCallback` 包裹你的回呼——基於 ref 的模式在內部處理了這一切。

## 實際範例：使用 useDebounce 優化搜尋

以下是搜尋元件的優化前後對比。「優化前」版本在每次按鍵時都發起 API 呼叫，並不必要地重新渲染昂貴的列表。

```tsx
// 優化前：每次按鍵都呼叫 API，列表每次都重新渲染
function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);

  useEffect(() => {
    if (query) {
      fetch(`/api/search?q=${query}`)
        .then((r) => r.json())
        .then(setResults);
    }
  }, [query]); // 每次按鍵都觸發

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ResultList items={results} />
    </div>
  );
}
```

```tsx
// 優化後：防抖查詢 + 記憶化列表——API 呼叫減少約 90%
import { useDebounce } from "@reactuses/core";
import { memo, useState, useEffect } from "react";

const MemoizedResultList = memo(ResultList);

function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Item[]>([]);

  useEffect(() => {
    if (debouncedQuery) {
      fetch(`/api/search?q=${debouncedQuery}`)
        .then((r) => r.json())
        .then(setResults);
    }
  }, [debouncedQuery]); // 只在停止輸入 300ms 後觸發

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <MemoizedResultList items={results} />
    </div>
  );
}
```

防抖版本減少了 API 呼叫次數，記憶化的列表只在 `results` 真正變化時才重新渲染——而非每次按鍵都渲染。

## React 19 編譯器：自動優化的未來

React 編譯器（原名 React Forget）旨在建置時自動插入 `useMemo` 和 `useCallback`。當它廣泛發布後，本文中的許多手動記憶化模式將變得不再必要。編譯器會分析你的元件程式碼，確定哪些值需要穩定參照，然後自動新增記憶化。

但是，編譯器無法消除對良好狀態設計、正確使用 ref 或函式庫級優化（如防抖和節流）的需求。它自動化了記憶化的機械部分，但架構層面的決策——什麼放入狀態、何時防抖、如何組織元件樹——仍然是你的責任。

在編譯器穩定並被廣泛採用之前，本文中的模式仍然是 React 開發者的必備知識。

## 常見錯誤

1. **記憶化所有東西。** 對簡單計算新增 `useMemo` 只會增加複雜度和記憶體開銷，而沒有可衡量的收益。先測量，再優化。

2. **使用 `useCallback` 但沒有搭配 `React.memo`。** 如果子元件沒有被記憶化，穩定的函式參照毫無用處——子元件無論如何都會重新渲染。

3. **把所有狀態放在一個物件裡。** 一個狀態物件意味著每個欄位的更新都會觸發所有消費者的重新渲染。按更新頻率拆分狀態。

4. **忽視相依性陣列。** 缺少相依性導致閉包過期。多餘的相依性導致不必要的重新計算。兩者都是 Bug。

5. **在渲染中建立新的物件/陣列。** 行內物件（`style={{ color: "red" }}`）和陣列（`items={[1, 2, 3]}`）每次渲染都建立新參照，使子元件的記憶化失效。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hooks

- [useDebounce 文件](https://reactuse.com/state/usedebounce/) -- 防抖一個響應式值
- [useDebounceFn 文件](https://reactuse.com/effect/usedebouncefn/) -- 防抖一個函式
- [useThrottle 文件](https://reactuse.com/state/usethrottle/) -- 節流一個響應式值
- [useThrottleFn 文件](https://reactuse.com/effect/usethrottlefn/) -- 節流一個函式
- [useLatest 文件](https://reactuse.com/state/uselatest/) -- 保持對最新值的參照

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
