---
title: "React useIsomorphicLayoutEffect：修掉 SSR 下的 useLayoutEffect 警告（2026）"
description: "如果你在 Next.js 或 Remix 的控制台里见过「Warning: useLayoutEffect does nothing on the server」，这篇就是解法。深入讲清楚为什么 useLayoutEffect 在 SSR 下会报警、为什么换成 useEffect 会带来闪烁，以及 useIsomorphicLayoutEffect 如何同时解决这两个问题——还有什么时候该用它，以及它周边那一族布局时序 hook。"
slug: react-isomorphic-layout-effect
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-25
tags: [react, hooks, ssr, nextjs, tutorial]
keywords: [react useIsomorphicLayoutEffect, useLayoutEffect SSR 警告, useLayoutEffect does nothing on the server, react useLayoutEffect 服务端渲染, next.js useLayoutEffect 警告, react ssr 布局 effect, isomorphic layout effect, useLayoutEffect vs useEffect, react 测量 dom, remix useLayoutEffect, useUpdateLayoutEffect, ssr 安全 react hooks, react 水合不匹配]
image: /img/og.png
---

# React useIsomorphicLayoutEffect：修掉 SSR 下的 useLayoutEffect 警告（2026）

你加了一个 `useLayoutEffect` 来测量一个 tooltip，发版，下一次 Next.js（或 Remix、Gatsby）的开发服务器在服务端渲染这个页面时，控制台就亮了：

```
Warning: useLayoutEffect does nothing on the server, because its effect cannot
be encoded into the server renderer's output format. This will lead to a
mismatch between the initial, non-hydrated UI and the intended UI. To avoid
this, useLayoutEffect should only be used in components that render exclusively
on the client.
```

这个警告说得没错，但它给的建议（「只在客户端用」）帮不上忙；而那个最显而易见的绕法——直接换成 `useEffect`——会悄悄把你当初用 `useLayoutEffect` 干掉的那个视觉 bug 又请回来。`useIsomorphicLayoutEffect` 就是化解这个僵局的那个小 hook。本文讲清楚警告到底为什么出现、两种最直觉的修法为什么都不对，以及那个一行的 hook 实际上做了什么。

<!-- truncate -->

## useLayoutEffect 到底为什么存在

React 给了你两个长得几乎一样的 effect hook：

- [`useEffect`](https://react.dev/reference/react/useEffect) 在浏览器**绘制之后**运行。它的回调会被排队，等这一帧上屏之后异步触发。
- `useLayoutEffect` 在浏览器**绘制之前**同步运行，就在 React 改完 DOM、但用户还没看到任何东西的那一刻。

这个时序差别就是它存在的全部意义。如果你要读布局——`getBoundingClientRect`、`scrollHeight`、某个节点测出来的宽度——然后据此写一个样式，你必须在*绘制之前*做完。否则用户会先看到一帧错的布局，然后你的 `useEffect` 纠正过来时会闪一下。最典型的例子就是一个要根据自身尺寸来定位的 tooltip：

```tsx
function Tooltip({ targetRect, children }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const { height, width } = ref.current!.getBoundingClientRect();
    // 放在目标上方、水平居中
    setPos({
      top: targetRect.top - height - 8,
      left: targetRect.left + targetRect.width / 2 - width / 2,
    });
  }, [targetRect]);

  return <div ref={ref} style={{ position: 'fixed', ...pos }}>{children}</div>;
}
```

用 `useLayoutEffect`，React 在同一个同步过程里测量并重新定位，所以 tooltip 永远只会在正确的位置被绘制。换成 `useEffect`，tooltip 会先在 `{ top: 0, left: 0 }` 闪一帧，然后才跳到正确的位置。机器快的时候你可能注意不到；在被降频的手机上你一定会看到。

## 为什么服务端容不下它

服务端渲染产出的是一段 HTML 字符串。没有浏览器、没有 DOM、没有布局阶段，而且——最关键的——什么都不会*绘制*。`useLayoutEffect` 存在的全部理由，就是要在一次绘制之前同步运行，而这次绘制在服务端永远不会到来。

所以 React 做了一个有意的选择：**`useLayoutEffect` 的回调在服务端渲染期间根本不会运行。**它们没法被有意义地序列化进 HTML，运行它们也产生不了任何有用的东西。React 知道这是个陷阱——你组件的服务端产出不会反映布局 effect 本该算出的结果——于是它抛出那个警告，告诉你服务端 HTML 和你想要的客户端 UI 可能对不上。

这个警告不是你代码的 bug。它是 React 在提醒你：你有一个 hook，它*唯一的工作*在服务端根本没法完成。

## 为什么不能直接用 useEffect

第一直觉是把它换成 `useEffect` 来消掉警告——React 很乐意在服务端跑 `useEffect`（只是把回调推迟）。警告消失了。闪烁回来了。

记住那个时序：`useEffect` 在绘制*之后*触发。所以在客户端水合之后，你那套「先测量、再重定位」的逻辑现在晚了一帧。用户会先看到没定位好的状态，然后才是纠正。你拿一个用户看不见的控制台警告，换来了一个用户看得见的视觉故障——这是严格意义上更差的结果。

第二直觉——让这个组件只在客户端渲染（`typeof window !== 'undefined'` 守卫、`ssr: false` 的动态导入、挂载标志位）——能用，但它把整棵子树的服务端渲染都扔掉了。你失去了 SSR 的 HTML，内容在水合之前对爬虫不可见，而且首屏多了一次布局抖动。为了一个「选哪个 hook」的问题，这是大炮打蚊子。

## 真正的修法：按环境分支

道理其实很简单：你想要 `useLayoutEffect` 那种「绘制前」的时序——**在浏览器里**；同时你想要 `useEffect` 那种「安安静静什么也不做、不报警」的行为——**在服务端**。这是两个不同的 hook，哪个对取决于代码跑在哪里。

所以在模块加载时，根据是不是浏览器环境来挑：

```ts
import { useEffect, useLayoutEffect } from 'react';

const isBrowser = typeof window !== 'undefined';

export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;
```

整个 hook 就这些。在浏览器里它*就是* `useLayoutEffect`——一模一样的绘制前同步时序、一模一样的签名。在服务端它*就是* `useEffect`，React 从不对它报警，也永远不会跑一次没用的布局过程。「Isomorphic（同构）」是个老词，指那种在服务端和客户端跑法一致的代码；这个 hook 就是为每个环境挑出语义相同的那个 effect。

ReactUse 把它原样做成了 [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/)，省得你在每个项目里复制粘贴这段：

```tsx
import { useIsomorphicLayoutEffect } from '@reactuses/core';

function Tooltip({ targetRect, children }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // 跟前面一模一样的代码——但没有 SSR 警告，也没有客户端闪烁。
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

它是 `useLayoutEffect` 的无缝替换：一样的回调、一样的可选依赖数组、一样的清理函数。唯一变的是警告没了，而你的客户端行为保持不变。

### 一个细节：为什么分支放在 render 外面

注意 `isBrowser ? useLayoutEffect : useEffect` 只在模块求值时跑*一次*，不在组件里跑。这是故意的。[Hook 规则](https://react.dev/reference/rules/rules-of-hooks)要求你每次渲染都以相同顺序调用相同的 hook。如果你在组件*内部*写 `if (isBrowser) useLayoutEffect(...) else useEffect(...)`，那严格来说你在服务端和客户端调用了不同的 hook——更糟的是，linter 会（理所应当地）对条件式 hook 调用报警。

把这个选择在模块加载时定成一个稳定的函数引用，组件就只是无条件地调用 `useIsomorphicLayoutEffect(...)`。`isBrowser` 在一个进程内永远不变，所以选中的 hook 在整个 bundle 生命周期里都是恒定的。hook 顺序保持稳定，lint 规则也满意。

## 什么时候用它（什么时候别用）

当下面**所有**条件都成立时，用 `useIsomorphicLayoutEffect`：

- 你需要布局阶段的时序——你在测量或改动 DOM，且结果必须出现在*第一帧*绘制里（tooltip、popover、自动撑高的 textarea、滚动位置恢复、焦点管理，任何「闪一帧就看得见」的场景）。
- 这个组件会被服务端渲染（Next.js、Remix、Astro islands、Gatsby、TanStack Start——任何会调用 `renderToString`/`renderToPipeableStream` 的东西）。
- 你想消掉 SSR 警告，又不想为这棵子树关掉 SSR。

**不要**把它当成 `useEffect` 的无脑替换。如果你的 effect 不碰布局——拉数据、订阅事件、同步到 `localStorage`、打日志——普通的 `useEffect` 才是对的，你要的就是它「绘制后、不阻塞」的时序。`useLayoutEffect`（以及它的同构版本）是同步运行、会*阻塞绘制*的；滥用它会让你的应用毫无收益地卡顿。经验法则没变：只在不用它就会看到闪烁的时候，才上布局 effect。

而如果一个组件确实只能在客户端跑——它在顶层 import 了 `window`，或者包了一个只在浏览器里能用的库——那让它客户端渲染（`dynamic(() => ..., { ssr: false })`）仍然是对的工具。`useIsomorphicLayoutEffect` 是给那些*确实*会在服务端渲染、只是内部带了个布局 effect 的组件用的。

## 布局时序这一族

`useIsomorphicLayoutEffect` 是 ReactUse 里一小族 effect hook 的基底。一旦你理解了这个 SSR 安全的布局 effect，其余几个就顺理成章了：

- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) —— 一个**跳过首次挂载**、只在更新时运行的布局 effect。它内部用一个「首次挂载」守卫包住 `useLayoutEffect`，所以它是 `useUpdateEffect` 在布局阶段的兄弟。当初始 DOM 已经正确、你只需要对后续 prop 变化做出反应时很好用（把一个值动画*到*新位置，而不是动画*入场*）。注意这个直接用了 `useLayoutEffect`，如果你需要它在 SSR 下也静默，把这个模式跟 `isBrowser` 分支结合一下即可。
- [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) —— 同样的「跳过首渲染」行为，建立在 `useEffect` 之上。日常那个「变化时跑、挂载时不跑」的 hook。
- [`useMount`](https://reactuse.com/effect/usemount/) —— 在挂载后恰好运行一次回调。当你想表达的只是「挂载时」，它是 `useEffect(fn, [])` 的可读别名。

库内部还有一个低调但重要的使用者。[`useEvent`](https://reactuse.com/effect/useevent/) —— ReactUse 那个稳定回调 hook，给你一个身份永久、但闭包始终最新的事件处理函数——就用了 `useIsomorphicLayoutEffect`，在*绘制之前*把最新的函数同步进一个 ref：

```ts
const handlerRef = useRef(fn);
useIsomorphicLayoutEffect(() => {
  handlerRef.current = fn;
}, [fn]);
```

在布局阶段写这个 ref，保证了如果某个子组件在*它自己的*布局 effect 里触发这个处理函数，它已经能看到最新的版本——而用同构的方式去做，意味着 `useEvent` 自己也永远不会踩到 SSR 警告。这很好地说明了为什么一个库 hook 默认就该选同构的版本：你不知道你的使用者跑在哪个环境，所以你挑那个在两边都对的。

## 要点回顾

- 「useLayoutEffect does nothing on the server」这个警告，是 React 在告诉你：一个「绘制前」的 hook 没法在没有绘制的地方运行。它说得对，不是误报。
- 换成 `useEffect` 能消掉警告，但会在客户端重新引入一帧闪烁，因为 `useEffect` 在绘制之后才跑。
- `useIsomorphicLayoutEffect` 同时解决两边：它在浏览器里*就是* `useLayoutEffect`、在服务端*就是* `useEffect`，在模块加载时选定一次，hook 顺序保持稳定。
- 在服务端渲染的组件里做布局测量/改动时用它；其余不碰布局的，留给普通 `useEffect`。
- ReactUse 把它（以及相关的 `useUpdateLayoutEffect`、`useUpdateEffect`、`useMount`）打包好了，省得你重造那一行——并在内部用它来让自家 hook 保持 SSR 安全。

到 [reactuse.com](https://reactuse.com) 浏览完整的 SSR 安全 effect hook 集合，凡是有 `useLayoutEffect` 让你的服务端控制台紧张的地方，都把 `useIsomorphicLayoutEffect` 放进去。
