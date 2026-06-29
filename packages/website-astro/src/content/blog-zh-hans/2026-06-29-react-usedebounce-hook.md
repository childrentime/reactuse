---
title: "React useDebounce Hook：给状态和回调做防抖（2026）"
description: "一篇实用的 useDebounce 上手指南：给一个值做防抖、给一个回调做防抖，以及取消（cancel）或立即执行（flush）待处理的调用——而不会带上手写 setTimeout 版本那些必然出现的过期闭包 bug。SSR 安全、TypeScript 优先。"
slug: react-usedebounce-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-29
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useDebounce, useDebounce hook, react 防抖输入, react 防抖 hook, usedebounce react, react 防抖状态, react 防抖回调, useDebounceFn, react 搜索框防抖, react 防抖 typescript, ssr 安全防抖, react 防抖 api 请求, lodash debounce react, react 防抖 onChange]
image: /img/og.png
---

# React useDebounce Hook：给状态和回调做防抖（2026）

你有一个搜索框。用户输入 `react hooks`，你的组件就在每一次按键上发一个 API 请求——一个查询发了十一个请求，其中十个在返回时早就过期了。所有人都会想到的修法是**防抖（debounce）**：等输入停下来，再发一次。而所有人都会写错的修法，是在组件里用 `setTimeout` 手写这个防抖——过期闭包、漏掉的清理、re-render 抖动，会悄悄把它弄坏。

`useDebounce` 就是把这件事做对的那个 hook。本文讲清楚你真正需要的两种形态——给**值**做防抖、给**回调**做防抖——什么时候用哪个，以及怎么 `cancel`（取消）或 `flush`（立即执行）待处理的调用。这里写的全是真实的 [`@reactuses/core`](https://reactuse.com) API，SSR 安全且带类型。

<!-- truncate -->

## 为什么不直接用 setTimeout？

防抖本身很简单：把一个函数推迟到一段安静期之后再执行，每来一次新调用就重置计时器。（如果你想要完整的概念拆解——以及它和节流的区别——见 [React 中的防抖 vs 节流](https://reactuse.com/blog/react-debounce-vs-throttle/)。）难的是在 *React 组件里*做这件事。下面是最直觉的写法，它带了三个 bug：

```tsx
function Search() {
  const [query, setQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetchResults(value); // 🐛 见下文
    }, 300);
  }

  return <input value={query} onChange={handleChange} />;
}
```

1. **卸载时会泄漏。** 如果组件在计时器待处理时卸载，回调依然会在 300 ms 后触发——往往是给一个已经消失的组件 setState，或者为用户早已离开的页面打 API。
2. **它会捕获过期的值。** 一旦你防抖的不是原始事件值——而是第二个 state、一个 prop、一个派生值——闭包冻结的是计时器*设置时*的它们，而不是*触发时*的。
3. **它会到处复制。** 每个需要防抖的地方都重写一遍 `useRef` + `clearTimeout`，每份拷贝都是一次忘掉清理的机会。

一个 hook 在一个地方把这三件事都修好。ReactUse 提供了两个，内部基于久经考验的 `lodash.debounce`，所以那些边角情况（前沿触发、最大等待、后沿触发）都已经处理好了。

## useDebounce —— 给值做防抖

最常见的场景：你有一个快速变化的值，你想要它的*第二份*、滞后的拷贝，只在一切都稳定下来之后才更新。那份拷贝才是你喂给昂贵计算的东西。

```tsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@reactuses/core';

function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="搜索…"
    />
  );
}
```

签名是 `useDebounce(value, wait?, options?)`，它返回防抖后的值，类型和输入一致：

```ts
const debounced = useDebounce(value, 300);
```

输入（`query`）在每次按键都更新，所以受控的 `<input>` 始终跟手——这是你绑到 DOM 上的值。输出（`debouncedQuery`）只在用户停止输入 300 ms 后才追上，所以它是你放进 effect 依赖数组里的值。API 变成每次停顿发一次、而不是每次按键发一次，而你的输入框永远不卡，因为你打字进去的那个东西从来就不是被防抖的那个。

这套模式——给 UI 用快值、给副作用用防抖后的值——就是全部要点。把它们保持成两个独立的变量，其余的自然就顺了。

## useDebounceFn —— 给回调做防抖

给值做防抖在「你想限制的东西是 *state*」时很好用。但有时候你想防抖的是一个带参数的**动作**——自动保存、埋点、resize 处理——而不想先绕过 state。那就是 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)：

```tsx
import { useDebounceFn } from '@reactuses/core';

function Editor({ docId }: { docId: string }) {
  const { run } = useDebounceFn((content: string) => {
    saveDraft(docId, content);
  }, 1000);

  return (
    <textarea onChange={(e) => run(e.target.value)} />
  );
}
```

`useDebounceFn(fn, wait?, options?)` 返回一个带三个成员的对象：

```ts
const { run, cancel, flush } = useDebounceFn(fn, 1000);
```

- **`run`** —— 防抖后的函数。你想调多少次就调多少次；`fn` 只在调用停下来 `wait` ms 之后才真正执行。它会把所有参数透传过去，所以 `run(content)` 会调用 `fn(content)`。
- **`cancel`** —— 丢弃任何待处理的调用。什么都不会触发。
- **`flush`** —— *立刻*触发待处理的调用，而不是等计时器走完。

关键在于，`run` 永远调用你**最新**版本的 `fn`。hook 内部把你的回调存在一个 ref 里，所以即便防抖包装只创建一次，它也永远不会过期——`setTimeout` 版本里那个 `docId` 闭包问题在这里根本不存在。而且这个 hook 在卸载时会自动取消任何待处理的调用，所以 bug #1 也没了。

> `useDebounce` 其实就是*构建在* `useDebounceFn` 之上的——它给一次 `setState` 调用做防抖，然后把结果值交给你。同一个引擎，两种手感。

### cancel 和 flush 的实战

`cancel`/`flush` 这一对，正是裸 `setTimeout` 做起来很痛、而 hook 做起来很简单的地方。两个真实例子：

```tsx
function CommentBox() {
  const { run: autosave, cancel, flush } = useDebounceFn(
    (text: string) => saveDraft(text),
    2000,
  );

  return (
    <>
      <textarea onChange={(e) => autosave(e.target.value)} />
      {/* 用户点了「发布」—— 立刻持久化，别等那 2 秒 */}
      <button onClick={() => flush()}>发布</button>
      {/* 用户点了「丢弃」—— 扔掉待处理的自动保存 */}
      <button onClick={() => cancel()}>丢弃</button>
    </>
  );
}
```

`flush` 保证在发出 post 请求之前，飞行中的草稿已经写下；`cancel` 保证被丢弃的草稿不会在一拍之后又被保存。两者都只是一次调用。

## 用值还是用回调？

一个快速判断规则：

- 当你防抖的是某个会被别处读取的 **state** 时——搜索词、筛选条件、喂给图表的滑块值——用 **`useDebounce`**。你要的是一个滞后的*值*。
- 当你防抖的是一个**带参数的动作**时——自动保存、打日志、直接发网络请求——用 **`useDebounceFn`**。你要的是一个滞后的*函数*，外加 `cancel`/`flush` 控制。

如果你发现自己创建一个 state *只是*为了防抖它、然后马上触发一个 effect，那 `useDebounceFn` 通常是更直接的工具。

## 调参：leading、trailing 和 maxWait

可选的第三个参数会原样传给 `lodash.debounce`，所以你拿到的是它完整的选项对象：

```ts
useDebounce(value, 300, {
  leading: false,  // 第一次调用时不触发（默认）
  trailing: true,  // 停顿之后触发（默认）
  maxWait: 1000,   // …但总等待永远不超过 1 秒
});
```

两个值得知道的旋钮：

- **`leading: true`** 在*第一次*调用时立刻触发，然后再对其余调用做防抖。适合「先即时响应、再稳定下来」的交互——按钮的第一次点击很跟手，而快速连点会被吸收。
- **`maxWait`** 给总延迟封顶。纯后沿防抖下，一个连续打字十秒的用户在停下来之前会得到*零*次更新。`maxWait: 1000` 强制在 burst 中途至少每秒更新一次——这就是一个「活着的」搜索框和一个「冻住的」搜索框之间的区别。

## SSR 安全

这两个 hook 在服务端渲染时都是安全的。它们在 render 期间不碰任何 `window`、`document` 或浏览器计时器——防抖的工作只在 effect 里跑，而 React 从不在服务端执行 effect。把它们丢进 Next.js、Remix 或 Astro 组件，不用写 `typeof window` 守卫，也不用追 hydration 警告。（如果 SSR 安全是你代码库里反复出现的主题，[SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) 讲得更深。）

## 限流家族

`useDebounce` 在 ReactUse 里有三个近亲；按*你在限制什么*以及*你要哪种形态*来挑：

| Hook | 限制的是… | 策略 |
| --- | --- | --- |
| [`useDebounce`](https://reactuse.com/state/usedebounce/) | 值 | 防抖（停顿后触发） |
| [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) | 回调 | 防抖，带 `cancel`/`flush` |
| [`useThrottle`](https://reactuse.com/state/usethrottle/) | 值 | 节流（固定频率触发） |
| [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) | 回调 | 节流，带 `cancel`/`flush` |

节流这一对和防抖这一对完全对称——同样的 `(value/fn, wait, options)` 签名、同样的返回形态——但它强制一个稳定的节奏，而不是等到安静。该用节流的是那些应该在*连续手势进行中*更新的东西（滚动位置、拖拽坐标、实时进度读数）；该用防抖的是那些应该只在手势*结束后*更新的东西（搜索、自动保存、校验）。完整的心智模型在 [React 中的防抖 vs 节流：什么时候用哪个](https://reactuse.com/blog/react-debounce-vs-throttle/)。

## 要点回顾

- 在组件里手写的 `setTimeout` 防抖默认就带三个 bug：卸载时泄漏、捕获过期闭包、到处被复制。
- **`useDebounce(value, wait)`** 给你一个值的滞后拷贝——往快的那个里打字，用慢的那个跑 effect。搜索框即时联想的完美选择。
- **`useDebounceFn(fn, wait)`** 给一个动作做防抖，并交给你 `{ run, cancel, flush }`。`run` 永远调用你最新的回调（没有过期闭包），并在卸载时自动取消。
- 用 `flush` 提前提交一个待处理的调用（提交），用 `cancel` 丢弃它（丢弃）。
- 第三个参数就是 `lodash.debounce` 的选项——`leading` 实现首调即触发，`maxWait` 给延迟封顶，让长 burst 也能更新。
- 两者都 SSR 安全，并和 `useThrottle`/`useThrottleFn` 一起覆盖固定频率的场景。

从 [`@reactuses/core`](https://reactuse.com/state/usedebounce/) 拿走它们，把你的 `clearTimeout` 样板代码删掉吧。
