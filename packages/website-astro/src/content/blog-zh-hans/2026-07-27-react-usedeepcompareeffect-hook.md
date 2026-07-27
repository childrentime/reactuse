---
title: "React useDeepCompareEffect：修复 useEffect 的对象依赖问题（2026）"
description: "当依赖是对象或数组时，useEffect 为什么会无限重跑，以及 useDeepCompareEffect 如何解决。涵盖真实实现、多出来的那一次渲染、lodash isEqual 搞不定的「函数入依赖」陷阱、用 useCustomCompareEffect 降低比较成本，以及让 exhaustive-deps 继续生效的 ESLint 配置。TypeScript 优先。"
slug: react-usedeepcompareeffect-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-27
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useDeepCompareEffect, useDeepCompareEffect hook, usedeepcompareeffect react, react useEffect 对象依赖, useEffect 无限循环, useEffect 深比较, react 依赖深比较, useEffect 数组依赖, react useEffect 每次渲染都执行, useCustomCompareEffect, react effect 依赖数组 对象, useDeepCompareEffect typescript]
image: /img/og.png
---

# React useDeepCompareEffect：修复 useEffect 的对象依赖问题（2026）

你接了一个请求。接口要一个 query 对象，于是你把它放进依赖数组。effect 触发、setState、组件重新渲染、query 对象被重新构建——一个内容完全相同的全新对象——effect 又一次触发。你写出了一个无限循环，而 React 认为自己完全照你说的做了。

```tsx
function Results({ term, page }: Props) {
  const [rows, setRows] = useState([]);
  const query = { term, page, sort: 'desc' }; // 每次渲染都是新对象

  useEffect(() => {
    fetchRows(query).then(setRows); // setRows → 重渲染 → 新 query → 🔁
  }, [query]);
}
```

[`@reactuses/core`](https://reactuse.com) 的 `useDeepCompareEffect` 是 `useEffect` 的直接替代品，它按**值**比较依赖，而不是按引用。签名一样、清理语义一样——只是当依赖并没有真正变化时，effect 不再触发。以下都是真实实现，TypeScript 优先，包括那些确实要付出代价的部分。

<!-- truncate -->

## 为什么 `useEffect` 看不出来

React 用 `Object.is` 逐项比较依赖数组。对基本类型这正是你要的：`5` 就是 `5`，`'desc'` 就是 `'desc'`。但对任何带身份的东西——对象、数组、`Date`、`Map`、函数——它比较的是**引用**，而写在组件体里的字面量每一次渲染都会产生一个全新的引用：

```js
Object.is({ term: 'react' }, { term: 'react' }); // false —— 不同的对象
```

所以按 React 的定义，依赖每次渲染都「变了」。这不是 `useEffect` 的 bug；引用比较是唯一 O(1) 的比较方式，而 React 要在每个组件的每次渲染上都跑一遍。值比较的成本是真实存在的，React 拒绝替你承担。

于是这笔账落到了你头上——用这种或那种方式。

## 常见的绕法，以及它们在哪里散架

**把对象 memo 掉。** 正确，而且在只有一个依赖时就是标准答案：

```tsx
const query = useMemo(() => ({ term, page, sort: 'desc' }), [term, page]);
```

它散架在对象不归你管的时候。数据来自一次 fetch、一个 context、一个表单库、一个可以随意重渲染的父组件——你没法在源头 `useMemo` 一个 prop，于是你 memo 了一份拷贝，现在你要维护一个平行的依赖数组，它必须和对象的结构保持同步。加一个字段、忘了改 memo，你就发布了一个不会更新的 effect。

**把基本类型摊进数组。** 同样正确，同样脆弱：

```tsx
useEffect(() => { fetchRows(query); }, [query.term, query.page, query.sort]);
```

一旦对象嵌套、可选、或者含有不受你控制的字段，它就不行了。`[config.retry.limit, config.retry.backoff, config.auth?.scheme]` 这种依赖数组，会在某人加字段的那天悄悄出错。

**`JSON.stringify` 一下依赖。** 很诱人，也确实流行：

```tsx
useEffect(() => { fetchRows(query); }, [JSON.stringify(query)]);
```

但它**每次渲染都序列化**，不管有没有变化；键顺序会影响结果（`{a,b}` 和 `{b,a}` 被认为「不同」）；`undefined` 和函数会静默消失；`Date` 变成字符串；`Map` 和 `Set` 变成 `{}`；遇到循环引用直接抛错。它就是一次语义更差、还没有提前退出的深比较。

**关掉 lint 规则然后祈祷。** 这是真正会被发布出去的那个方案，也是半年后引发闭包过期 bug 的那个。

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

签名和 `useEffect` 完全一致：

```ts
function useDeepCompareEffect(
  effect: EffectCallback,   // 可以返回清理函数
  deps: DependencyList
): void;
```

没有任何新概念：effect 在挂载后执行，在依赖列表与上一次**深度不相等**时重新执行，返回的清理函数在每次重跑前和卸载时执行。上面那个循环在第一次请求后就停了，因为 `{ term: 'react', page: 1, sort: 'desc' }` 和上一次渲染的对象深度相等。

深比较来自 lodash 的 `isEqual`，覆盖面是靠谱的那种——嵌套对象和数组、按时间戳比较的 `Date`、按 source 和 flags 比较的 `RegExp`、按内容而非插入顺序比较的 `Map` 和 `Set`：

```js
isEqual(new Date(0), new Date(0));                    // true
isEqual(new Map([['a', 1]]), new Map([['a', 1]]));    // true
isEqual(new Set([1, 2]), new Set([2, 1]));            // true
isEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } });  // true
```

## 它到底怎么工作的（以及它多花的那一次渲染）

值得理解一下，因为它解释了唯一一个会让人意外的行为。`useDeepCompareEffect` 是 [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/) 传入 `isEqual` 作为比较器的一层薄封装，核心大概十行：

```tsx
const ref = useRef<TDeps | undefined>(undefined);
const forceUpdate = useUpdate();

if (!ref.current) ref.current = deps;

useIsomorphicLayoutEffect(() => {
  if (!depsEqual(deps, ref.current)) {
    ref.current = deps;   // 采纳新依赖
    forceUpdate();        // 并重新渲染，好让 useEffect 看到它们
  }
});

useEffect(effect, ref.current); // React 永远只看到那个稳定的 ref 数组
```

诀窍在于：React 拿到的从来不是你新建的那个数组，而是 `ref.current`——只有当比较认定「确实变了」时它才会被换掉。深度相等的渲染交给 React 的是同一个数组，于是 React 正确地得出结论：无事可做。

代价——这是必须诚实说明的部分——是**一次真正的依赖变化会多花一次渲染**。layout effect 发现变化时，`useEffect` 已经带着旧数组注册完了，所以它更新 ref 并强制重渲染；effect 在第二趟才触发。因为用的是 layout effect，这一切发生在浏览器绘制之前，你不会看到任何闪烁。但如果你在一个高频组件里数渲染次数，把这一次算上。（依赖已经引用相等时比较会被完全跳过——`isEqual` 在 `===` 上短路，所以稳态开销很低。）

这也意味着内部的 [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) 保证了整体的 SSR 安全：服务端渲染时不会出现 `useLayoutEffect` 警告。

## 陷阱：依赖数组里的函数

这个坑很多人踩，而且没有任何深比较 hook 能救你。**lodash 的 `isEqual` 按引用比较函数**——两个源码完全相同的函数永远不相等：

```js
isEqual(() => {}, () => {});                         // false
isEqual({ url: '/api', onDone: () => {} },
        { url: '/api', onDone: () => {} });          // false ← 整个对象也一样
```

第二行才是致命的。对象里任何一处内联回调，都会让**整个对象**永久不相等，你的 `useDeepCompareEffect` 就静默退化成了一个每次渲染都触发的普通 `useEffect`——无限循环回来了，而且每次还附赠一次额外渲染。

```tsx
// 🔴 永远触发 —— onSuccess 每次渲染都是新函数
useDeepCompareEffect(() => {
  subscribe(config);
}, [{ ...config, onSuccess: (d) => setData(d) }]);
```

解法是把函数从被比较的值里拿出去。用一个永远指向最新版本的 ref 持有回调，只依赖数据：

```tsx
// ✅ 比较数据；通过 ref 读回调
const onSuccess = useLatest((d: Data) => setData(d));

useDeepCompareEffect(() => {
  subscribe(config, (d) => onSuccess.current(d));
}, [config]);
```

[`useLatest`](https://reactuse.com/state/uselatest/) 每次渲染都把 ref 钉在最新的值上，于是 effect 调用的是「今天的」回调，却不依赖它的身份。如果你更想直接把回调传出去，[`useEvent`](https://reactuse.com/effect/useevent/) 做同样的事，但给你一个身份稳定的函数。两者共同推出的规则是：**依赖数组里放数据，不放行为。**

## 深比较太贵的时候：useCustomCompareEffect

`isEqual` 会遍历整个结构。对一个小小的配置对象来说这不算什么——几次属性读取，比它省下的那次渲染还便宜。但对一个 5000 行的 API 响应，它就是每次渲染都做一次完整遍历，你用「一次不必要的 effect」换来了「一次必然的遍历」。

当你清楚真正重要的是什么时，就只比较那部分：

```tsx
import { useCustomCompareEffect } from '@reactuses/core';

useCustomCompareEffect(
  () => { renderChart(dataset); },
  [dataset],
  ([prev], [next]) => prev.id === next.id && prev.updatedAt === next.updatedAt,
);
```

两次字段读取，取代 5000 个元素的遍历。比较器接收上一次和下一次的依赖**数组**，在应该被视为相等时返回 `true`——和 `isEqual` 履行的是同一份契约，只是烤进了你的领域知识。任何带版本号、ETag、`updatedAt` 或稳定 id 的东西都是候选。

一个粗略的决策规则：

| 依赖 | 选择 |
| --- | --- |
| 只有基本类型 | 原生 `useEffect` |
| 小的 config / options / query 对象 | `useDeepCompareEffect` |
| 一个你自己拥有并控制的对象 | 在源头 `useMemo` |
| 大数据，或天然有版本字段 | `useCustomCompareEffect` |
| 一个函数 | `useLatest` / `useEvent`，然后只依赖数据 |

## 让 exhaustive-deps 继续工作

`react-hooks/exhaustive-deps` 这条 lint 规则不知道你的自定义 hook 也接收依赖数组，所以它干脆不检查了——闭包过期就是这么溜进来的。告诉它：

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

现在你在 `useEffect` 上依赖的那些「缺少依赖」告警，在这里同样生效。值得第一天就配上——一个依赖数组不完整的深比较 hook 比普通 effect 更难调试，因为「重跑得太频繁」至少会自己吵出来，而「永远不重跑」只会安静地端出过期数据。

## 两条能避开大部分意外的规则

**不要在只有基本类型或空依赖时用它。** 当每个依赖都是字符串或数字时，深比较相比 `Object.is` 什么也没多买到——纯粹是开销，外加一次可能的额外渲染。传空数组是这个 hook 会在开发环境主动警告你的错误：

> `useDeepCompareEffect` should not be used with no dependencies. Use React.useEffect instead.

只跑一次的 effect，用 [`useMount`](https://reactuse.com/effect/usemount/) 更能表达意图。想跳过首次执行，用 [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)。

**保持数组长度固定。** 这是 React 自己的约束，不是这个 hook 的：依赖数组在两次渲染之间改变长度会触发开发环境警告，比较行为也未定义。不要条件式地拼数组——`[config, ...(flag ? [extra] : [])]` 是一个在等某个周二爆发的 bug。把那个条件值放进对象依赖**里面**，交给深比较处理。

## 真实使用场景

- **带 query 对象的数据请求。** 最经典的场景，也就是本文开头那个——内联拼出来传给接口的筛选条件、分页、排序状态。
- **按 config 建立的订阅。** WebSocket 主题、event-source 频道、由 options 对象配置的 observer——每次渲染都重新订阅是一个带心跳的资源泄漏。
- **图表和地图库。** 这类命令式库接收 options 对象，重新配置一次要花真实的毫秒数。深比较一个 config 对象，远比一次无谓的 `chart.setOption()` 便宜。
- **由解析数据驱动的 effect。** 解析成对象的 URL search params、从 `localStorage` 读出的 JSON、解码后的 JWT payload——每次渲染都是新引用，实际内容却稳定不变。
- **不归你管的 props。** 第三方组件递给你一个它内部重建的 options 对象。你没法在源头 memo，但可以在使用端按值比较。

## 要点回顾

- **`useEffect` 按引用比较**，所以内联的对象或数组依赖每次渲染都是「新的」——这就是无限循环和请求风暴的成因，不是你逻辑写错了。
- **[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 就是按值比较的 `useEffect`**——签名一致、清理语义一致，底层是 lodash `isEqual`（覆盖嵌套结构、`Date`、`Map`、`Set`、`RegExp`）。
- **一次真正的变化会多花一次渲染。** 因为是 layout effect，不会有闪烁——但在热点路径上用之前，先知道它的存在。
- **依赖里的函数会让它失效。** `isEqual` 按引用比较函数，一个内联回调就能污染整个对象。行为交给 [`useLatest`](https://reactuse.com/state/uselatest/) / [`useEvent`](https://reactuse.com/effect/useevent/)，依赖数组里只放数据。
- **大依赖用 [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/)**——比较一个 `id` 和一个 `updatedAt`，别去遍历 5000 行。
- **给 `exhaustive-deps` 加上 `additionalHooks`**，并且在只有基本类型或空依赖数组时干脆别用这个 hook。

从 [`@reactuses/core`](https://reactuse.com/effect/usedeepcompareeffect/) 拿来用，让你的 effect 在数据变化时触发——而不是在对象字面量变化时。
