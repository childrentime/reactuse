---
title: "React useLatest Hook：在异步回调里读到最新状态 (2026)"
description: "useLatest 实用指南：为什么 setTimeout、await、订阅和第三方 SDK 里的回调总读到过期的 props 和 state，五行的 useLatest ref 如何在不重启任何东西的前提下解决它，为什么 ref 是在 layout effect 里写而不是渲染期间写，useLatest vs useRef vs useEvent vs useEffectEvent，异步保存与请求竞态两种模式，以及唯一一条铁律——永远不要在渲染期间读它。TypeScript 优先，SSR 安全。"
slug: react-uselatest-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-16
tags: [react, hooks, state, typescript, tutorial]
keywords: [react uselatest, uselatest, uselatest react, useLatest hook, uselatestref, react 最新值 ref, react 过期闭包, react settimeout 里的过期状态, react 回调里的过期 props, react ref 最新值, useref 最新状态, react 异步回调 过期状态, react await 之后读最新状态, useLatest vs useRef, useLatest vs useEvent, useEffectEvent 替代方案]
image: /img/og.png
---

# React useLatest Hook：在异步回调里读到最新状态 (2026)

这是一个会对用户撒谎的自动保存按钮：

```tsx
function Editor({ docId }: { docId: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "dirty">("idle");

  async function save() {
    setStatus("saving");
    await api.save(docId, text);
    setStatus("saved"); // ⚠️ 但用户在 await 期间还在打字……
  }

  return (
    <>
      <textarea value={text} onChange={e => setText(e.target.value)} />
      <button onClick={save}>Save</button> <em>{status}</em>
    </>
  );
}
```

请求耗时 800 毫秒。请求在飞的时候用户又敲了三个词。Promise 兑现，`status` 翻成 `"saved"`，而那三个新词根本没被保存。在 `save` 里面，`text` 是按钮被点击那一刻的值——JavaScript 闭包捕获了那次渲染的值，之后再多的重新渲染也改不了它。要在 `await` 之后判断到底是 `"saved"` 还是 `"dirty"`，你需要知道 `text` *现在*是什么，而闭包告诉不了你。

这就是**过期闭包**（stale closure），任何一个活得比创建它的那次渲染更久的回调都会遇到：`setTimeout`、`setInterval`、`await` 之后的代码、只注册一次的事件监听器、`IntersectionObserver` 和 `ResizeObserver` 的回调、WebSocket 的 `onmessage`，以及每一个在构造时接收回调的第三方 SDK。React 官方 FAQ 对*"为什么我在函数里看到的是过期的 props 或 state？"*给出的答案，就是一个永远持有最新值的 ref。[`@reactuses/core`](https://reactuse.com) 里的 [`useLatest`](https://reactuse.com/state/uselatest/) 就是把这个 ref 打包好：五行代码，不触发重新渲染，没有依赖数组。本文会讲清楚它是什么、为什么实现里是在 layout effect 而不是渲染期间写 ref、它跟 `useRef`、[`useEvent`](https://reactuse.com/effect/useevent/) 和 React 的 `useEffectEvent` 是什么关系、它为哪些模式而生，以及你必须遵守的唯一一条规矩。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useLatest } from "@reactuses/core";
import { useState } from "react";

function Editor({ docId }: { docId: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "dirty">("idle");
  const latestText = useLatest(text);

  async function save() {
    const snapshot = text; // 闭包：我们要发出去的是什么
    setStatus("saving");
    await api.save(docId, snapshot);
    // ref：用户现在手上的是什么
    setStatus(latestText.current === snapshot ? "saved" : "dirty");
  }

  // …
}
```

`useLatest(value)` 返回一个 `MutableRefObject<T>`，它的 `.current` 永远是最近一次渲染的 `value`。ref 对象本身的身份从不改变，所以在任何地方闭包捕获它都是安全的——定时器、Promise、订阅——等回调最终执行时再读就行。注意修好的版本*同时*用了闭包和 ref：闭包是点击那一刻的值（回答"我们发了什么？"是对的），ref 是 Promise 兑现那一刻的值（回答"它还是最新的吗？"是对的）。过期闭包不是 JavaScript 的 bug；只有当你想要的是*现在*、拿到的却是*那时*，它才是 bug。

## useLatest 到底是什么

`@reactuses/core` 里的完整实现：

```tsx
import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "@reactuses/core";

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
```

就这些。一个只创建一次的 ref，每当 `value` 变化就覆写它的 `.current`。有两个细节值得弄明白，因为手写版本的差异正在这里。

**为什么用 layout effect，而不是在渲染函数体里直接 `ref.current = value`？** 几个流行实现（react-use、ahooks）就是在渲染期间赋值的，绝大多数时候也能用。但 React 的规则要求渲染必须是纯的——渲染期间不读也不写 `ref.current`——因为在并发渲染下，一次渲染可以被开始、暂停，然后在从未提交的情况下*直接丢弃*。在一次被丢弃的渲染里写下的 ref，现在持有的是一个没有任何已提交 UI 显示过的值。在 `useLayoutEffect` 里写，意味着 ref 每次**已提交**的渲染恰好更新一次，在 DOM 更新之后、浏览器绘制之前同步完成。这跟 [React `useEvent` RFC](https://github.com/reactjs/rfcs/blob/main/text/0000-useevent.md) 用的是同一个技巧，也是为什么 `@reactuses/core` 的 `useEvent`、`useInterval`、`useTimeoutFn` 和另外十几个 hook 都建在 `useLatest` 之上，而不是裸的渲染期赋值。

**为什么不用普通的 `useEffect`？** 时序。passive effect 在绘制之后运行，而同一次提交里 React 先跑子组件的 effect 再跑父组件的，先跑靠前的 hook 再跑靠后的。如果同一次提交里有*另一个* effect 在更新用的 effect 之前读了这个 ref，它看到的就是上一次渲染的值。layout effect 跑在所有 passive effect 之前，所以等到任何 `useEffect`、事件处理器、定时器或 Promise 回调触发时，`ref.current` 已经是最新的了。（`useIsomorphicLayoutEffect` 在浏览器里就是 `useLayoutEffect`，在服务端就是 `useEffect`，所以没有 SSR 警告。）

你需要内化的结论是：**`.current` 反映的是最近一次已提交的渲染，它是给回调读的，不是给渲染读的。** 在第 N+1 次更新的渲染期间，`ref.current` 还持有第 N 次的值——这没问题，因为在渲染里你本来就该直接读 `value`。如果你发现自己在 JSX 里写 `{latest.current}`，你要的其实是普通的 state。

## useLatest vs useRef vs useState

这三个经常被搞混，因为它们都"存一个值"。关键问题是*谁*需要这个值、*什么时候*需要。

| 你需要…… | 用 |
| --- | --- |
| 渲染这个值，并在它变化时重新渲染 | `useState` |
| 跨渲染保存一个**不**由 prop/state 派生的可变值（定时器 id、DOM 节点、计数器） | `useRef` |
| 在一个活得比渲染更久的回调里读到**最新**的 prop 或 state | `useLatest` |

`useLatest` 就是 `useRef` 加上一个"帮我保持同步"的 effect。如果你写过这个：

```tsx
const textRef = useRef(text);
useEffect(() => { textRef.current = text; }, [text]);
```

……那就是 `useLatest(text)`，只差上面说的 layout effect 时序细节。它也比*另一种*常见的变通写法——在 setter 旁边把 state 复制进 ref（`setText(v); textRef.current = v;`）——诚实得多，后者一旦有别的东西更新了 `text`（一个重置按钮、一个 prop、一个表单库），就会悄无声息地坏掉。

## useLatest vs useEvent vs useEffectEvent

再看几个近邻。三者都是为了对付过期闭包而存在的；区别在于它们包的是什么。

- **`useLatest(value)`** 包一个**值**，给你一个 ref。你在已有的任何回调里读 `.current`。
- **[`useEvent(fn)`](https://reactuse.com/effect/useevent/)** 包一个**函数**，给你一个稳定的函数，它总是调用最新的 `fn`。内部就是 `useLatest(fn)` 加 `useCallback(() => ref.current(...args), [])`。当*回调本身*就是你要交给子组件、effect 或订阅的东西，并且你希望它的身份永不改变时用它。
- **`useEffectEvent`**（React 19.2+）是 `useEvent` 的内置版本，但限制只能从 effect 里调用——返回的函数不稳定，不能作为 prop 传递，也不能加进依赖数组。

经验法则：**包函数用 `useEvent`；包值用 `useLatest`。** 两者可以组合——经典的"只订阅一次、对最新状态做出反应"，通常要么给处理器套一个 `useEvent`，要么给它读的每个值各套一个 `useLatest`，两种都行。`useLatest` 完胜的场景是回调根本不归你包：SDK 的 `onChange`、一个 Promise 的后续、一个你只构造一次的 `Observer`。

## 模式

### 在 `await` 之后

开头的自动保存就是这个形状：任何先 await、然后需要知道世界有没有变的处理器。第二个常见变体是发生在处理器（而不是 effect）里的**请求竞态**：

```tsx
function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const latestQuery = useLatest(query);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    const items = await api.search(q);
    if (latestQuery.current !== q) return; // 更新的一次按键赢了——丢掉这个响应
    setResults(items);
  }

  return <input value={query} onChange={onChange} />;
}
```

在 `useEffect` 里，你会用 React 文档里的 `let ignore = false` 清理标志来做这件事。事件处理器没有清理的位置，所以由 ref 来承担"我还相关吗？"这个检查。（要对调用本身做防抖，看 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)——那是另一个问题。）

### 只创建一次的订阅

任何建立起来昂贵或有状态的东西——地图、图表、WebSocket、`ResizeObserver`——都应该只创建一次然后*读取*最新状态，而不是每敲一个键就被拆掉重建：

```tsx
function PinMap({ filters }: { filters: Filters }) {
  const container = useRef<HTMLDivElement>(null);
  const latestFilters = useLatest(filters);

  useEffect(() => {
    const map = new mapboxgl.Map({ container: container.current!, style: STYLE });
    map.on("moveend", () => {
      loadPins(map.getBounds(), latestFilters.current); // 最新的 filters，地图只建一次
    });
    return () => map.remove();
  }, []); // ✅ 这里的空依赖是诚实的——里面没有任何东西会过期

  return <div ref={container} />;
}
```

没有这个 ref，你的选择是把 `filters` 放进依赖（每次筛选变化地图就销毁重建——闪烁、丢失视口、重新下载瓦片），或者空依赖数组外加一条 lint 警告和一个 bug。`useLatest` 给了你第三个选项：这个 effect 真的什么都不依赖，因为它是透过一个永远最新的 ref 去读的。

### 定时器

`setTimeout` 和 `setInterval` 是教科书级的过期闭包制造机：

```tsx
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const latestPaused = useLatest(paused);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!latestPaused.current) onDismiss(); // 第 5 秒正好悬停着？那就保持打开
    }, 5000);
    return () => clearTimeout(id);
  }, []);

  return <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>{message}</div>;
}
```

一次性的以外都别手写：[`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) 和 [`useInterval`](https://reactuse.com/effect/useinterval/) 已经通过 `useLatest` 保持回调最新，并在其上加了 `pause`/`resume`/`immediate`——本系列的上一篇 [React useInterval Hook](https://reactuse.com/zh-Hans/blog/react-useinterval-hook/) 就是逐行讲这个的。

### @reactuses/core 内部用在哪里

如果你想在生产代码里看这个模式，`useLatest` 是这个库很大一块功能背后默默干活的主力。[`useEventListener`](https://reactuse.com/effect/useeventlistener/) 用它包住你的处理器，这样 `addEventListener` 每个元素只跑一次，而不是每次渲染跑一次。[`useClickOutside`](https://reactuse.com/element/useclickoutside/)、[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/)、[`useResizeObserver`](https://reactuse.com/element/useresizeobserver/) 和 [`useMutationObserver`](https://reactuse.com/element/usemutationobserver/) 都只构造一次 observer，然后在里面调用 `savedCallback.current`。[`useRafFn`](https://reactuse.com/effect/useraffn/) 在不取消动画循环的前提下读最新的帧回调。[`useUnmount`](https://reactuse.com/effect/useunmount/) 用它保证你在*第一次*渲染时传入的清理函数，不会在卸载时带着第一次渲染的值执行。同样的五行，每一次。

## 值得知道的坑

- **它不是响应式的。** 写或读 `.current` 从不触发重新渲染。如果一个变化应该出现在屏幕上，它属于 state——`useLatest` 是给*读*的回调用的，不是给*显示*的值用的。
- **不要在渲染期间读它。** 因为 ref 是在 layout effect 里更新的，在渲染期间它落后一次提交。这是设计使然，从回调里读时永远不会有问题；但如果你把 `latest.current` 放进 JSX 或 `useMemo`，问题立刻出现。那些地方直接读值本身。
- **不要把它放进依赖数组指望它触发什么。** ref 的身份在组件整个生命周期里都是稳定的，所以 `[latestFoo]` 等价于 `[]`。这是特性——意味着读它的 effect 永远不会因为它而重跑——但也意味着你不能用它来*响应*变化。
- **滞后窗口是真实存在的，也是极小的。** 在渲染和 layout effect 提交之间，`.current` 是上一次渲染的值。这个窗口里不会有任何用户可见的东西运行（没有事件、没有定时器、没有 passive effect），所以实践中不是问题，而这正是永远不把被丢弃的渲染泄漏进 ref 所付出的代价。
- **有时候重启*正是*你要的。** 如果你的 effect 应该在某个值变化时重新运行——`roomId` 变了就重连 socket——那就照常把 `roomId` 放进依赖。`useLatest` 只用于那些回调应该*不引起重启*地读取的值。在同一个 effect 里两者混用（依赖里放 `[roomId]`，里面读 `latestFilters.current`）完全正常。
- **SSR 安全。** 它就是一个 ref 加一个同构 layout effect；不碰 `window`，也不会有 hydration 不匹配，因为它从不渲染任何东西。

## 什么时候不该用 useLatest

- **这个值要显示出来** → 永远是 `useState`。
- **你在包一个要交给子组件或 effect 的函数** → [`useEvent`](https://reactuse.com/effect/useevent/)（或者 React 19.2+ 上、只在 effect 内使用的 `useEffectEvent`）。
- **你想要*上一次*渲染的值** → [`usePrevious`](https://reactuse.com/state/useprevious/)——`useLatest` 的镜像。
- **你想在 `await` 之后 set state 之前知道组件是否还挂载着** → [`useMountedState`](https://reactuse.com/state/usemountedstate/) 就是那个布尔值。
- **"过期"的是定时器或 DOM 回调** → 你多半想要的是 [`useInterval`](https://reactuse.com/effect/useinterval/)、[`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) 或 [`useEventListener`](https://reactuse.com/effect/useeventlistener/)，它们已经替你把 `useLatest` 这套走完了。

## 要点

- 一个活得比自己那次渲染更久的回调——定时器、`await`、订阅、SDK 钩子——看到的是创建它那次渲染的 props 和 state。这是闭包在尽本分；只有当你需要*现在*却拿到*那时*，它才是 bug。
- [`useLatest`](https://reactuse.com/state/uselatest/) 是一个在 layout effect 里与某个值保持同步的 ref：从任何回调读都是最新的，从不引起重新渲染，从不改变身份，从不泄漏被丢弃的渲染。
- 值 → `useLatest`。函数 → [`useEvent`](https://reactuse.com/effect/useevent/)。要显示 → `useState`。上一次渲染 → [`usePrevious`](https://reactuse.com/state/useprevious/)。
- 从回调里读 `.current`，永远不要从渲染里读；把真正的重启触发条件（`roomId`、`url`）留在依赖数组里——`useLatest` 是给回调*透过它去读*的东西用的，不是给*重启*它的东西用的。

`useLatest`、`useEvent`、`usePrevious` 以及另外 110+ 个 SSR 安全、TypeScript 优先的 hooks 都在 [`@reactuses/core`](https://reactuse.com) 里——一次安装，可 tree-shake，没有需要你照看的依赖。

```bash
npm install @reactuses/core
```
