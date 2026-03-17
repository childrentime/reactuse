---
title: "React Hooks 性能优化：如何避免不必要的重新渲染"
description: "实用的 React Hooks 性能优化技巧——了解何时使用 useMemo、useCallback，以及像 ReactUse 这样设计良好的 Hooks 库如何帮助你编写更快的组件。"
slug: react-hooks-performance
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, performance, optimization, best-practices]
keywords: [react hooks performance, react re-render, useMemo, useCallback, react optimization, avoid re-renders]
image: /img/og.png
---

# React Hooks 性能优化：如何避免不必要的重新渲染

性能是区分生产级 React 代码和教程级代码的关键因素。大多数 React 应用其实并没有渲染问题——但有问题的那些会让人感觉迟钝、卡顿和令人沮丧。关键在于知道*何时*优化很重要、React 提供了*哪些*工具，以及设计良好的 Hooks 库已经在*哪些地方*为你做好了优化。

<!-- truncate -->

## React 何时重新渲染？

当以下三种情况之一发生时，组件会重新渲染：

1. **状态改变。** 调用 `setState` 会触发该组件及其所有子组件的重新渲染。
2. **父组件重新渲染。** 即使子组件的 props 没有改变，当父组件渲染时，React 默认也会重新渲染子组件。
3. **消费的 context 改变。** 任何调用了 `useContext(SomeContext)` 的组件都会在该 context 值改变时重新渲染。

理解这三个触发条件是基础。本文中的每种优化技巧都是针对其中一个或多个问题。

## 重新渲染的真实成本

并非所有重新渲染都是昂贵的。React 的虚拟 DOM diff 算法很快。一个只返回几个 `<div>` 元素的组件可以重新渲染数千次而用户毫无感觉。真正的成本来自：

- **渲染路径中的昂贵计算**（过滤大数组、复杂数学运算）。
- **因依赖项变化而触发的昂贵副作用**（API 调用、DOM 测量）。
- **大型组件树**中顶部的一个状态变化级联传播到数百个子组件。

优化之前，先测量。React DevTools Profiler 能精确显示哪些组件重新渲染了以及每次渲染花了多长时间。优化慢的部分，而不是所有东西。

## 规则一：不要过早优化

把每个值都包在 `useMemo` 里、把每个函数都包在 `useCallback` 里，这不是优化——而是额外开销。每个记忆化 Hook 都有成本：React 必须存储前一个值，在每次渲染时比较依赖项，并管理缓存的引用。如果被记忆化的计算本身就很简单，记忆化的成本反而比直接重新计算更高。

```tsx
// 不要这样做——记忆化的成本比加法运算本身还高
const total = useMemo(() => price + tax, [price, tax]);

// 直接计算就好
const total = price + tax;
```

只在你已经测量到性能问题、或者引用相等性对下游消费者很重要的情况下，才使用 `useMemo` 和 `useCallback`。

## useMemo——它真正有用的场景

`useMemo` 缓存一个计算值，只在依赖项改变时重新计算。它在两个特定场景下有帮助：

**场景一：昂贵的计算。**

```tsx
function ProductList({ products, filter }: Props) {
  // 没有 useMemo：每次渲染都过滤 10,000 个产品
  // 有 useMemo：只在 products 或 filter 变化时重新过滤
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

**场景二：为子组件 props 保持引用相等性。**

```tsx
function Dashboard({ data }: Props) {
  // 没有 useMemo：每次渲染创建新对象，导致 React.memo 包裹的 Chart 失效
  const chartConfig = useMemo(
    () => ({ labels: data.map((d) => d.label), values: data.map((d) => d.value) }),
    [data]
  );

  return <MemoizedChart config={chartConfig} />;
}
```

## useCallback——被误解的 Hook

`useCallback` 是函数版的 `useMemo`。只要依赖项没有改变，它就返回相同的函数引用。常见的错误是"以防万一"到处使用它。

`useCallback` 只在函数被传递给记忆化的子组件作为 prop、或作为其他 Hook 的依赖项时才有意义。

```tsx
// 优化前：每次渲染都产生新的函数引用，MemoizedList 每次都重新渲染
function SearchPage() {
  const [query, setQuery] = useState("");

  const handleSelect = (id: string) => {
    console.log("Selected:", id);
  };

  return <MemoizedList onSelect={handleSelect} />;
}

// 优化后：稳定的引用，query 变化时 MemoizedList 跳过重新渲染
function SearchPage() {
  const [query, setQuery] = useState("");

  const handleSelect = useCallback((id: string) => {
    console.log("Selected:", id);
  }, []);

  return <MemoizedList onSelect={handleSelect} />;
}
```

如果 `MemoizedList` 没有用 `React.memo` 包裹，`useCallback` 就毫无用处——子组件无论如何都会因为父组件重新渲染而重新渲染。

## 状态结构很重要

你如何组织状态直接影响哪些组件会重新渲染。

**拆分无关的状态。** 当两个状态总是独立变化时，把它们放在不同的 `useState` 中。把它们合并在一个对象里意味着更新其中任何一个字段都会导致读取该对象的所有组件重新渲染。

```tsx
// 不好：更新 name 会导致只读取 age 的组件也重新渲染
const [form, setForm] = useState({ name: "", age: 0 });

// 好：独立更新，独立重新渲染
const [name, setName] = useState("");
const [age, setAge] = useState(0);
```

**能派生的就派生。** 如果一个值可以从已有状态计算得到，就不要把它存在状态里。派生值消除了一整类同步 Bug 和不必要的重新渲染。

```tsx
// 不好：需要保持同步的额外状态
const [items, setItems] = useState<Item[]>([]);
const [count, setCount] = useState(0);

// 好：从 items 派生 count
const [items, setItems] = useState<Item[]>([]);
const count = items.length;
```

## useRef 模式：稳定回调

高性能 Hooks 中的一个常见模式是将最新的回调存储在 ref 中。这样你就得到一个稳定的函数引用，它总是调用回调的最新版本——而不需要将回调添加到依赖数组中。

```tsx
function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}
```

这个模式非常实用，ReactUse 基于同样的思路提供了 `useLatest` Hook：

```tsx
import { useLatest } from "@reactuses/core";

function useInterval(callback: () => void, delay: number) {
  const callbackRef = useLatest(callback);

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), delay);
    return () => clearInterval(id);
  }, [delay]); // callback 不是依赖项——ref 始终持有最新版本
}
```

## ReactUse Hooks 如何处理性能

ReactUse 的 Hooks 从设计之初就考虑了性能。以下是内部使用的关键模式：

**1. 用 ref 存储回调。** 像 `useThrottleFn` 和 `useDebounceFn` 这样的 Hook 通过 `useLatest` 将你的回调存储在 ref 中。节流/防抖的包装器通过 `useMemo` 只创建一次，并始终通过 ref 调用最新的回调。这意味着你永远不需要担心闭包过期，也不需要将回调添加到依赖数组中。

**2. 记忆化返回值。** 昂贵的初始化（如创建节流函数）被包裹在 `useMemo` 中，只在配置参数改变时执行，而不是每次渲染都执行。

**3. 自动清理。** 像 `useThrottleFn` 这样的 Hook 在卸载时通过 `useUnmount` 取消待执行的定时器，防止在已卸载的组件上更新状态，无需你手动清理。

```tsx
// ReactUse 的 useThrottleFn 内部——简化版
function useThrottleFn(fn, wait, options) {
  const fnRef = useLatest(fn);                   // 1. ref 存储回调
  const throttled = useMemo(                      // 2. 记忆化包装器
    () => throttle((...args) => fnRef.current(...args), wait, options),
    [wait]
  );
  useUnmount(() => throttled.cancel());           // 3. 自动清理
  return { run: throttled, cancel: throttled.cancel, flush: throttled.flush };
}
```

这些模式意味着当你使用 ReactUse Hooks 时，开箱即获优化后的行为。你不需要在传递给 ReactUse Hooks 之前先用 `useCallback` 包裹你的回调——基于 ref 的模式在内部处理了这一切。

## 实际示例：使用 useDebounce 优化搜索

以下是搜索组件的优化前后对比。"优化前"版本在每次按键时都发起 API 调用，并不必要地重新渲染昂贵的列表。

```tsx
// 优化前：每次按键都调用 API，列表每次都重新渲染
function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);

  useEffect(() => {
    if (query) {
      fetch(`/api/search?q=${query}`)
        .then((r) => r.json())
        .then(setResults);
    }
  }, [query]); // 每次按键都触发

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ResultList items={results} />
    </div>
  );
}
```

```tsx
// 优化后：防抖查询 + 记忆化列表——API 调用减少约 90%
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
  }, [debouncedQuery]); // 只在停止输入 300ms 后触发

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <MemoizedResultList items={results} />
    </div>
  );
}
```

防抖版本减少了 API 调用次数，记忆化的列表只在 `results` 真正变化时才重新渲染——而不是每次按键都渲染。

## React 19 编译器：自动优化的未来

React 编译器（原名 React Forget）旨在构建时自动插入 `useMemo` 和 `useCallback`。当它广泛发布后，本文中的许多手动记忆化模式将变得不再必要。编译器会分析你的组件代码，确定哪些值需要稳定引用，然后自动添加记忆化。

但是，编译器不能消除对良好状态设计、正确使用 ref 或库级优化（如防抖和节流）的需求。它自动化了记忆化的机械部分，但架构层面的决策——什么放入状态、何时防抖、如何组织组件树——仍然是你的责任。

在编译器稳定并被广泛采用之前，本文中的模式仍然是 React 开发者的必备知识。

## 常见错误

1. **记忆化所有东西。** 对简单计算添加 `useMemo` 只会增加复杂度和内存开销，而没有可衡量的收益。先测量，再优化。

2. **使用 `useCallback` 但没有配合 `React.memo`。** 如果子组件没有被记忆化，稳定的函数引用毫无用处——子组件无论如何都会重新渲染。

3. **把所有状态放在一个对象里。** 一个状态对象意味着每个字段的更新都会触发所有消费者的重新渲染。按更新频率拆分状态。

4. **忽视依赖数组。** 缺少依赖项导致闭包过期。多余的依赖项导致不必要的重新计算。两者都是 Bug。

5. **在渲染中创建新的对象/数组。** 内联对象（`style={{ color: "red" }}`）和数组（`items={[1, 2, 3]}`）每次渲染都创建新引用，使子组件的记忆化失效。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hooks

- [useDebounce 文档](https://reactuse.com/hooks/useDebounce/) -- 对响应式值进行防抖
- [useDebounceFn 文档](https://reactuse.com/hooks/useDebounceFn/) -- 对函数进行防抖
- [useThrottle 文档](https://reactuse.com/hooks/useThrottle/) -- 对响应式值进行节流
- [useThrottleFn 文档](https://reactuse.com/hooks/useThrottleFn/) -- 对函数进行节流
- [useLatest 文档](https://reactuse.com/hooks/useLatest/) -- 保持对最新值的引用

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
