---
title: "React useInterval Hook：没有过期闭包的 setInterval (2026)"
description: "useInterval 实用指南：为什么 useEffect 里的 setInterval 总是读到过期状态（那个卡在 1 不动的计数器），声明式的 useInterval hook 如何用一个「最新回调」ref 解决它，delay = null 暂停 vs 命令式 pause()/resume()，immediate 选项，带退避的动态轮询间隔，后台标签页暂停，以及什么时候 useTimeoutFn、useCountDown 或 useRafFn 才是更合适的工具。TypeScript 优先，SSR 安全。"
slug: react-useinterval-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-15
tags: [react, hooks, effect, timers, typescript, tutorial]
keywords: [react useinterval, useinterval, useinterval react, useInterval hook, react setinterval, setinterval 在 useeffect 里, react setinterval hook, setinterval react hooks 状态不更新, react 轮询 hook, 声明式 setinterval react, useinterval 暂停 恢复, react 卸载时 clearinterval, react 定时器 hook, useTimeout react, react 倒计时 hook]
image: /img/og.png
---

# React useInterval Hook：没有过期闭包的 setInterval (2026)

每个 React 开发者都写过一遍这个组件，而它从来不按预期工作：

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <h1>{count}</h1>;
}
```

它显示 `0`、`1`……然后永远停在 `1`。interval 的回调是在第一次渲染时创建的，那时 `count` 是 `0`，而空依赖数组意味着它再也看不到后续的渲染。`setCount(0 + 1)` 每秒跑一次，什么都没变。这是 React 定时器里被搜索最多的一个 bug，而人们找到的"修法"——把 `count` 加进依赖（现在 interval 每秒被拆掉重建一次）、用函数式更新（能用，直到回调需要读*除了*上一个 count 之外的任何东西）——都是在跟同一个底层错配硬扛：`setInterval` 是命令式的，活在 React 渲染周期之外，而它想读的所有东西都活在渲染周期之内。

Dan Abramov 2019 年那篇 *Making setInterval Declarative with React Hooks* 给了这个错配一个真正的解法：一个 `useInterval` hook，把*最新*的回调存在 ref 里，绝不因为你的组件重新渲染就重启定时器。[`@reactuses/core`](https://reactuse.com) 里的 [`useInterval`](https://reactuse.com/effect/useinterval/) 就是这个思路，外加真实应用里你迟早会需要的那几块——`null` 暂停、`pause()` / `resume()` 控制、`immediate` 选项，以及能扛住 StrictMode 的清理。本文会讲清楚它的原理、两种暂停方式、动态轮询间隔、后台标签页问题，以及什么时候该换另一个定时器 hook。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useInterval } from "@reactuses/core";
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useInterval(() => {
    setCount(count + 1); // 读到的是当前的 count——不需要函数式更新
  }, 1000);

  return <h1>{count}</h1>;
}
```

这就是开头那个坏掉的组件，把 `useEffect` + `setInterval` 换成 `useInterval` 就修好了。回调可以直接读任何 prop 或 state，定时器只创建一次、卸载时清除，也没有会写错的依赖数组。

签名是 `useInterval(callback, delay, options?)`——`delay` 以毫秒计，传 `null` 则暂停——返回 `{ isActive, pause, resume }`，给你需要手动控制的场景用。

## 为什么 setInterval 和 React 合不来

底下其实是三个独立的问题，hook 对每一个的解法都不同：

1. **过期闭包。** `setInterval` 一辈子只持有一个函数引用。这个函数闭包住了某一次渲染的 props 和 state。之后每次渲染都会创建新的闭包——而正在跑的 interval 永远看不到。
2. **一渲染就重启。** 显而易见的修法是让 effect 依赖回调读到的所有东西：`useEffect(..., [count])`。现在 interval *正确*了，但每次变化都被清掉重建——计时每次归零，依赖变得快的话，tick 可能一次都触发不了。
3. **生命周期。** 你得在卸载时清除 interval，StrictMode 的开发环境二次挂载时再清一次，还有——会变成一个小状态机的那部分——决定怎么*暂停*它：第二个 state，包住 `setInterval` 的一个 `if`，以及现在得把暂停标志也算进去的依赖。

三个问题都处理好之后，一个正确的手写版本长这样——一个存最新回调的 ref、一个只以 `delay` 为依赖的 effect、用 `null` 表示暂停：

```tsx
function useIntervalManual(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useLayoutEffect(() => {
    savedCallback.current = callback; // 永远是最新一次渲染的闭包
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

这基本就是 `@reactuses/core` 里 `useInterval` 的核心——它用 [`useLatest`](https://reactuse.com/state/uselatest/) 做那个 ref，再在上面加控制。这个设计天然带来两条性质，也是最该记住的两条：

- **改回调绝不重启定时器。** 你想怎么重渲染就怎么重渲染，传内联箭头函数、读任何 state——ref 被更新，interval 保持自己的节奏。
- **改 `delay` 会重启。** `delay` 是唯一的依赖，所以 `5000 → 1000` 会清掉旧 interval 再起一个新的。这会重置相位：下一个 tick 距离变更提交的那一刻整整一个 `delay`。通常是对的（下面的退避就靠这个），偶尔会让人意外——如果你以为进行中的那个 tick 会先跑完的话。

## 暂停：`null` vs `pause()` / `resume()`

停掉 interval 有两种方式，选对了组件就简单。

**声明式——把 `null` 当作 delay 传进去。** 当"它该不该跑"能从 state 或 props 推导出来时，把它编码进 delay 表达式，让 hook 跟着走：

```tsx
function LivePrice({ symbol, live }: { symbol: string; live: boolean }) {
  const [price, setPrice] = useState<number | null>(null);

  useInterval(
    async () => setPrice(await fetchPrice(symbol)),
    live ? 5000 : null, // false → 暂停，true → 每 5 秒轮询
  );

  return <span>{price ?? "—"}</span>;
}
```

翻转 `live`，interval 就清除或重启。没有 effect，没有 ref，没有额外的 state。

**命令式——`controls: true` 加上返回的句柄。** 当启停是一个*用户动作*而不是派生条件（开始/停止按钮、"这个弹窗打开期间暂停"）时，退出自动启动，自己来开：

```tsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);

  const { pause, resume } = useInterval(
    () => setElapsed(Date.now() - startedAt.current), // 读时钟，别数 tick
    100,
    { controls: true }, // 挂载时不启动——等 resume()
  );

  const toggle = () => {
    if (running) {
      pause();
    } else {
      startedAt.current = Date.now() - elapsed;
      resume();
    }
    setRunning(!running);
  };

  return (
    <>
      <p>{(elapsed / 1000).toFixed(1)}s</p>
      <button onClick={toggle}>{running ? "暂停" : "开始"}</button>
    </>
  );
}
```

`pause` 和 `resume` 的引用是稳定的（放进依赖数组和事件处理器都安全），而且即使在 `controls` 模式下，interval 依然会在卸载时清除——你不可能因为忘了而漏掉一个定时器。一句实话：返回值里的 `isActive` 是一个 **ref**（`isActive.current`），不是 state——它翻转时不会触发重渲染，所以上面的例子为按钮文案单独维护了 `running` state。

两者也能混用：不开 `controls` 时，`pause()` 也能当临时覆盖用，下一次 `delay` 变化会自动恢复。

## `immediate`：现在就跑一次，然后每 N 毫秒一次

`setInterval` 要等满一个 `delay` 才第一次调用，对轮询来说这几乎从来不是你想要的——用户得盯着空白屏幕五秒。`immediate: true` 会在 interval 启动时同步执行一次回调，然后照常按计划走：

```tsx
useInterval(refreshDashboard, 30_000, { immediate: true });
```

注意，"interval 启动时"包括每一次 `delay` 变化——delay 的值每变一次，回调就立刻跑一次、计划重新开始。*用户*调整刷新频率时这很顺手，但对失败驱动的退避来说恰恰是错的（每次拉长 delay 都会当场再触发一次调用），所以退避场景别开 `immediate`——见下一节。

## 真实场景里的模式

### 带退避的轮询

因为 `delay` 就是个普通值，退避就只是 state。失败时拉长间隔，成功时弹回来：

```tsx
function useJobStatus(jobId: string) {
  const [status, setStatus] = useState<Job | null>(null);
  const [delay, setDelay] = useState<number | null>(2000);

  useInterval(async () => {
    try {
      const job = await getJob(jobId);
      setStatus(job);
      if (job.done) setDelay(null);            // 停止轮询
      else setDelay(2000);                     // 健康 → 基础频率
    } catch {
      setDelay((d) => Math.min((d ?? 2000) * 2, 60_000)); // 退避，封顶 1 分钟
    }
  }, delay);

  return status;
}
```

每次 `setDelay` 都会以新的节奏重启 interval——而且因为没开 `immediate`，一次失败之后会等满*新的、更长的* delay 再试，这正是退避的意义。那个 hook 里没有任何定时器簿记——全是"此刻 delay 应该是多少？"。

### 后台标签页（以及离线时）暂停

浏览器会节流隐藏标签页里的定时器——大约降到每秒一次，Chrome 在标签页隐藏五分钟后更是降到每*分钟*一次。在后台标签页里轮询，既浪费配额，*又*会在不可预测的时刻触发。修法和 `null` 模式天然可以组合，配上 [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) 和 [`useOnline`](https://reactuse.com/browser/useonline/)：

```tsx
const visible = useDocumentVisibility() === "visible";
const online = useOnline();

useInterval(refresh, visible && online ? 10_000 : null, { immediate: true });
```

用户回来时，`delay` 从 `null` 翻到 `10_000`，interval 重启，`immediate` 立刻拉一次新数据——正是你原本要用 `visibilitychange` 监听器手写的那套"恢复并追上"行为。

### 时钟：调度 tick，别数 tick

`setInterval` 会漂移。"每 1000ms"跑一分钟，你可能丢掉一秒甚至更多，被节流的标签页里尤其如此。所以别在回调里累加时间——只拿 interval 触发重渲染，然后读真正的时钟：

```tsx
function Clock() {
  const [now, setNow] = useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 1000);
  return <time>{new Date(now).toLocaleTimeString()}</time>;
}
```

interval 允许不准；显示的值永远正确，因为它来自 `Date.now()`，而不是 `tick 数 × 1000`。已用时长的显示同理：存一个起始时间戳，渲染 `Date.now() - start`。

## 什么时候不该用 useInterval

- **你要的是一次延迟调用，不是重复调用。** 那是 [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)——`const [pending, start, stop] = useTimeoutFn(fn, ms)`——或者只需要 N 毫秒后重渲染一次的话用 [`useTimeout`](https://reactuse.com/effect/usetimeout/)。
- **你在做倒计时显示。** [`useCountDown`](https://reactuse.com/state/usecountdown/) 已经在 `useInterval` 之上做好了秒 → `hh:mm:ss` 的换算和完成回调。
- **你在做动画。** 任何应该每帧更新的视觉效果都属于 `requestAnimationFrame`，也就是 [`useRafFn`](https://reactuse.com/effect/useraffn/) 包装的东西——它与显示器刷新率同步，隐藏标签页里自动暂停。16ms 的 `setInterval` 不是一回事。
- **你在给处理器限流，而不是调度它。** 在*用户输入的尾沿*触发是 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) / [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 的地盘。
- **这个"interval"其实是服务端推送。** 如果服务端能告诉你什么时候变了，走 [`useEventSource`](https://reactuse.com/browser/useeventsource/) 的 Server-Sent Events 流在延迟和成本上都胜过轮询。

| 你想要…… | 用 |
| --- | --- |
| 每 N 毫秒跑一次 `fn`，用 `null` 或 `pause()` 暂停 | [`useInterval`](https://reactuse.com/effect/useinterval/) |
| N 毫秒后跑一次 `fn`，带 `start` / `stop` | [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) |
| N 毫秒后重渲染一次 | [`useTimeout`](https://reactuse.com/effect/usetimeout/) |
| 从 N 秒开始的 `hh:mm:ss` 倒计时 | [`useCountDown`](https://reactuse.com/state/usecountdown/) |
| 每个动画帧跑一次 `fn` | [`useRafFn`](https://reactuse.com/effect/useraffn/) |

## 值得知道的坑

- **回调读到的是最新一次*已提交*的渲染。** ref 在每次渲染后的 layout effect 里更新，所以渲染进行中触发的 tick 看到的是上一次已提交的值——实践中不是问题，但这就是 hook 无法"比 React 更新"的原因。
- **`delay` 变化 = 相位重置。** 上面讲过；如果你需要在*不*丢掉进行中 tick 的前提下改节奏，保持 interval 不变、在回调里跳过 tick。
- **`immediate` 在 effect 里触发，挂载时和每次 `delay` 变化时都会。** React 18+ 开发模式的 StrictMode 下，这意味着挂载时 immediate 调用会发生两次（挂载 → 清理 → 挂载）。像对待任何 effect 一样，让它幂等。
- **`async` 回调没问题——但重叠得你自己管。** hook 不会等待返回的 Promise。如果一次 fetch 可能比 `delay` 还久，用一个进行中标志守着，或者在请求挂起期间用 `null` 暂停。
- **SSR 天然安全。** 定时器在 effect 里创建，服务端什么都不跑，也没有需要守护的 `window` 访问。

## 要点回顾

- 卡在 `1` 的计数器是过期闭包 bug：`setInterval` 一直拿着第一次渲染的回调。[`useInterval`](https://reactuse.com/effect/useinterval/) 把最新回调存进 ref，定时器只跑一份、永远看到当前 state。
- 只有 `delay` 会重启 interval——传 `null` 声明式暂停，或者 `controls: true` 配 `pause()` / `resume()` 做用户驱动的启停。
- `immediate: true` 现在跑一次、之后每 N 毫秒一次；退避就是 `setDelay(...)`；把 [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) / [`useOnline`](https://reactuse.com/browser/useonline/) 折进 delay 表达式，在隐藏或离线的标签页里暂停轮询。
- 绝不要在 interval 里累加时间——读 `Date.now()`——当任务不是"每 N 毫秒，永远"时，换 [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)、[`useCountDown`](https://reactuse.com/state/usecountdown/) 或 [`useRafFn`](https://reactuse.com/effect/useraffn/)。

`useInterval`、`useTimeoutFn`、`useCountDown` 以及另外 110+ 个 SSR 安全、TypeScript 优先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 里——一次安装，可 tree-shake，零依赖负担。

```bash
npm install @reactuses/core
```
