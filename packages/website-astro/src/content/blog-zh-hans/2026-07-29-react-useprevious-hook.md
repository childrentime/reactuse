---
title: "React usePrevious Hook：追踪上一次的 State 和 Props（2026）"
description: "一篇实用的 usePrevious 上手指南：为什么经典的 useRef + useEffect 写法会在无关的 re-render 之后悄悄返回错误的值、React 官方文档真正推荐的 render 期间 setState 模式、「上一个不同值」的语义、不稳定对象导致无限循环的坑，以及什么时候应该改用 useLatest。TypeScript 优先。"
slug: react-useprevious-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-29
tags: [react, hooks, state, typescript, tutorial]
keywords: [react usePrevious, usePrevious hook, useprevious react, react 上一次 state, react 上一次 props, react 获取之前的值, react 比较前后 state, usePrevious typescript, react useRef 上一个值, react 检测 state 变化方向]
image: /img/og.png
---

# React usePrevious Hook：追踪上一次的 State 和 Props（2026）

React 在每次渲染时都会给你 state 和 props 的当前值——但没有任何内置手段问一句：这个值*之前*是多少？于是所有人都在复制同一份十行的老配方：在 `useEffect` 里把值塞进 ref，再返回 `ref.current`。demo 里它没问题，上了生产也没问题，直到某一天，一个「计数上升了 ↑」的指示器开始声称什么都没变——因为组件出于一个完全无关的原因重新渲染了一次，ref 悄悄把自己的历史覆盖掉了。

[`@reactuses/core`](https://reactuse.com) 的 `usePrevious` 追踪的是上一个*不同的值*，而不是上一次*渲染时的值*，用的正是 React 官方文档推荐的模式——没有 ref，没有 effect，不会漂移。整个实现只有十二行，所以这篇文章会走一遍经典配方里的真实 bug、那个看起来「违法」实则合规的修复方式，以及唯一一个可能让它陷入无限循环的坑。TypeScript 优先。

<!-- truncate -->

## 经典配方，以及它在哪里散架

下面这个版本活在上千篇博客里，大概率也活在你的某个代码库里：

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```

渲染完成后 effect 触发，把当前值拷进 ref。下一次渲染读这个 ref——拿到的是一次渲染之前的值。微妙之处就在最后这句话里：这个 hook 返回的是上一次**渲染**时的值，不是上一个**值**。这两者只有在一种情况下才相等：组件重新渲染的*唯一*原因就是这个值变了。而这种情况从来维持不了多久。

看它怎么坏掉。一个带方向指示器的计数器，外加一个无关的 state：

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  const [dark, setDark] = useState(false);
  const prevCount = usePrevious(count); // ref 版本

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setDark(!dark)}>切换主题</button>
      {prevCount !== undefined && prevCount !== count && (
        <span>{count > prevCount ? "↑ 上升" : "↓ 下降"}</span>
      )}
    </div>
  );
}
```

点 **+1**：`count` 是 5，`prevCount` 是 4，指示器显示「↑ 上升」。正确。现在点**切换主题**：`count` 一动没动，但组件重新渲染了，effect 又跑了一次，ref 变成了 5。下一次渲染时 `prevCount === count`，指示器消失了——组件现在坚信计数从来没变过。任何父组件的 re-render、context 更新、兄弟 state 的变化都会造成同样的结果。你为「比较」而引入的这个 hook，恰恰把「比较」本身弄坏了。

这不是假想的边界情况：[react-use](https://github.com/streamich/react-use/issues/2605)、[ahooks](https://github.com/alibaba/hooks/issues/2162)、还有 [reactuse 自己](https://github.com/childrentime/reactuse/issues/115)，都被报过一模一样的问题，直到实现被替换掉。

## usePrevious——上一个*值*，不是上一次*渲染*

```tsx
import { useState } from 'react';
import { usePrevious } from '@reactuses/core';

function Counter() {
  const [count, setCount] = useState(0);
  const [dark, setDark] = useState(false);
  const prevCount = usePrevious(count);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setDark(!dark)}>切换主题</button>
      <p>现在：{count}，之前：{prevCount ?? "—"}</p>
    </div>
  );
}
```

签名：

```ts
function usePrevious<T>(value: T): T | undefined;
```

主题随便切多少次——`prevCount` 始终是 4，因为计数确实没变过。首次渲染时它返回 `undefined`，因为此时还不存在「之前的值」；写比较逻辑时按 `T | undefined` 来标注类型。

[实现](https://reactuse.com/state/useprevious/)短到可以全文引用，而且里面没有任何 ref、任何 effect：

```ts
export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T>();

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}
```

## 等等——render 期间 setState？

对，而且这不是黑魔法：它就是 React 官方文档里的模式，出处是 [*storing information from previous renders*](https://react.dev/reference/react/useState#storing-information-from-previous-renders)。在渲染期间调用 setter 在两个条件下是合法的，这段代码两条都满足：

- **改的是组件自己的 state。** React 处理 render 期间的更新的方式是：丢弃当前这次渲染的输出，立刻带着新 state 重新执行组件——在碰 DOM 之前、在绘制之前、在任何 effect 运行之前。用户永远看不到中间帧。
- **它被一个终会安静下来的条件守着。** `value !== current` 只在值变化后的那一次渲染里为真；重跑时 `value === current`，直接落空。不会循环。

对比一下两个版本各自锚定的「历史」。ref 配方记录的是「上一次渲染时值是多少」——所以*每一次*渲染都会改写历史，不管相关不相关。state 版本记录的是「值上一次*变化*之前是多少」——无关的 re-render 撞上 `value === current`，什么都不碰。这一个判断条件就是整个 bug 修复。

在 React 18 更严格的执行模型下它也站得住，而 effect + ref 的版本反而更摇晃。StrictMode 在开发环境会把渲染函数执行两遍：这里第二遍跑的是同样的比较、对着同样的 state、落到同样的结果——幂等。并发特性可能在提交前把一次渲染整个扔掉：被丢弃的渲染里的 state 更新会跟着一起被丢弃，而在渲染期间改 ref（另一种流行的「修法」）会逃逸出这次渲染，泄漏到一条官方口径里从未发生过的时间线上。render 期间 setState 是唯一在所有这些场景下都正确的变体。

## 那个坑：不稳定的对象

比较用的是 `!==`——严格引用相等。每次渲染都喂给 hook 一个新的对象字面量，`value !== current` 就*永远*为真：

```tsx
// 💥 Too many re-renders
const prev = usePrevious({ x: position.x, y: position.y });
```

每次渲染创建一个新对象，守卫条件触发，render 期间的 setState 引发重跑，重跑又创建*另一个*新对象，最后 React 用「Too many re-renders」把整件事拦停。修复方式就是常规的引用稳定性纪律：传原始值，或者用 memo 让对象只在内容变化时才换身份：

```tsx
const point = useMemo(() => ({ x, y }), [x, y]);
const prevPoint = usePrevious(point); // ✅
```

原始值——数字、字符串、布尔——永远安全，而它们覆盖了你九成的使用场景。（如果你真正的问题是「当一个深层嵌套对象*真的*变化时才执行 effect」，那是 [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 的活，不归这个 hook 管。）

## usePrevious vs useLatest

这两个经常被搞混，因为它们都是「跨时间持有一个值的 hook」，但它们回答的是相反的问题：

- [`usePrevious`](https://reactuse.com/state/useprevious/) 回答的是**「这个值在变化之前是多少？」**——用于渲染期间的比较：变化方向、from/to 标签、状态迁移检测。
- [`useLatest`](https://reactuse.com/state/uselatest/) 回答的是在一个过期闭包里**「这个值现在是多少？」**——`setInterval` 回调、防抖过的处理函数、挂载时注册一次的事件监听器。

要渲染一个 diff，用 `usePrevious`；某个回调总是看到旧值，用 `useLatest`。需要其中一个，从来不意味着你需要另一个。

## 真实使用场景

- **变化方向。** 排序箭头、价格跳动、滚动方向、「↑ 比昨天多 3 个」——一切由 `value > prev` 渲染出来的东西。这正是 ref 配方肉眼可见坏掉的场景，因为一次无关的 re-render 就能抹掉方向。
- **状态迁移检测。** 在 prop *跨过边界*时触发逻辑，而不是它*处于某状态*时：`prevStatus === "loading" && status === "success"` 让 toast 在每个请求完成时恰好弹一次。搭配 [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 还能跳过挂载时的首次渲染。
- **From → to 动画。** 数字滚动和图表过渡需要两个端点；`usePrevious` 直接把补间的起始值递给你，不用再造第二份 state。
- **「从 X 改为 Y」的界面。** 展示待提交改动的审计式表单和设置面板——把 `prev` 和 `value` 并排渲染；首次渲染时 `prev` 是 `undefined`，什么都不显示即可。

## SSR 安全性

`usePrevious` 就是两个 `useState` 加一次比较——没有 `window`，没有 `document`，没有 effect，没有任何需要守卫的东西。服务端渲染一次，返回 `undefined`；客户端首次渲染返回同样的 `undefined`，hydration 天然一致。不像那些读浏览器状态的 hook（cookie、`localStorage`、媒体查询），这里不存在需要专门设计的服务端/客户端分歧。它的 SSR 安全是最无聊的那种：因为它什么都不做。

## 要点回顾

- **经典的 `useRef` + `useEffect` 配方追踪的是上一次*渲染*，不是上一个*值***——任何无关的 re-render 都会悄悄改写它，这正是每个曾经内置这份配方的主流 hooks 库都收到过的 bug 报告。
- **[`usePrevious`](https://reactuse.com/state/useprevious/) 用的是 render 期间 setState**——React 官方文档认可的模式：有条件、自行终止、对用户不可见，且在 StrictMode 和并发渲染下都正确。
- **首次渲染返回 `undefined`**——此时还没有历史；按 `T | undefined` 标注类型。
- **比较按引用进行**——传原始值或用 `useMemo` 稳定过的对象，否则 render 期间的守卫会永远触发，React 会用「Too many re-renders」拦停你。
- **「上一个值」和「闭包里的当前值」是两个不同的问题**——做比较用 `usePrevious`；救过期回调用 [`useLatest`](https://reactuse.com/state/uselatest/)。

从 [`@reactuses/core`](https://reactuse.com/state/useprevious/) 拿来用，让「previous」真的是 previous。
