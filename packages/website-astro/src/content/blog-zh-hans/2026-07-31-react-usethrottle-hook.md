---
title: "React useThrottle Hook：节流值与回调（2026）"
description: "一篇实用的 useThrottle 与 useThrottleFn 上手指南：把高频变化的值或热事件回调压到稳定节奏，调节 leading/trailing 边缘，随时 cancel 或 flush 挂起的调用——lodash 级别的计时精度、没有闭包陈旧问题、卸载自动清理。SSR 安全，TypeScript 优先。"
slug: react-usethrottle-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-31
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useThrottle, usethrottle, useThrottle hook, react 节流 hook, react 滚动节流, useThrottleFn, react 节流状态, react 节流回调, lodash throttle react, react 节流 防抖 区别, react mousemove 节流, react throttle typescript, ssr 安全节流]
image: /img/og.png
---

# React useThrottle Hook：节流值与回调（2026）

`scroll` 事件的触发频率全看合成器心情——通常一秒 60 次，有时 120 次。`mousemove` 更夸张。把它们直接灌进 `setState`，滚轮每动一下你的组件树就以帧率重渲染一遍；灌进埋点上报或网络请求，你就亲手对自己的后端发起了一次小型 DDoS。防抖（debounce）在这里是错误的药方：防抖后的滚动处理器要等滚动*停下来*才执行，于是阅读进度条在滚动途中直接冻住，到头了才猛地跳一下。你真正想要的是一个稳定节奏——*事件持续到来时，每 N 毫秒至多执行一次*。这就是节流（throttle）。

[`@reactuses/core`](https://reactuse.com) 的 [`useThrottle`](https://reactuse.com/state/usethrottle/) 和 [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 就是这个节奏的 hook 形态——一个管值，一个管回调——底层是久经沙场的 lodash `throttle`，外面包了一层，把 React 里两种经典翻车方式（闭包陈旧、计时器比组件活得久）直接封死。这篇文章会走读真实实现、`leading`/`trailing` 两个旋钮、`cancel`/`flush` 两个逃生舱，以及一个被测试套件钉死的挂载时机细节。TypeScript 优先。

<!-- truncate -->

## useThrottle —— 节流一个值

`useThrottle` 接收一个变化太快的值，返回一份以文明速度更新的副本：

```tsx
import { useState } from 'react';
import { useThrottle } from '@reactuses/core';

function MarkdownEditor() {
  const [source, setSource] = useState('');
  const throttledSource = useThrottle(source, 500);

  return (
    <div className="editor">
      <textarea value={source} onChange={e => setSource(e.target.value)} />
      {/* 即使全速打字，每秒也至多重新解析两次 */}
      <Preview markdown={throttledSource} />
    </div>
  );
}
```

输入框保持完全跟手——`source` 每次击键都更新。被节流的只有昂贵的消费方：`throttledSource` 在第一次变化时立即更新，之后只要变化持续到来就每 500 ms 至多更新一次，停止后落在最终值上。对比这个编辑器的防抖版本：打字期间预览会一脸茫然地空着，只在停顿的间隙追上来。节流让它保持*活着*，只是刷新率低一点。

签名如下：

```ts
function useThrottle<T>(value: T, wait?: number, options?: ThrottleSettings): T;
```

`ThrottleSettings` 就是 lodash 的——`{ leading?: boolean; trailing?: boolean }`——下文细说。

## useThrottleFn —— 节流一个回调

当需要减速的是一个*函数*而不是值时，[`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 把它包起来并交还一组控制器：

```tsx
import { useState } from 'react';
import { useThrottleFn, useEventListener } from '@reactuses/core';

function ScrollSpy({ sectionIds }: { sectionIds: string[] }) {
  const [active, setActive] = useState(sectionIds[0]);

  const { run } = useThrottleFn(() => {
    setActive(computeActiveSection(sectionIds, window.scrollY));
  }, 200);

  useEventListener('scroll', run);

  return <TableOfContents ids={sectionIds} active={active} />;
}
```

滚动事件以帧率触发；`computeActiveSection` 一秒只跑五次。返回值是包含三个函数的对象：

```ts
const { run, cancel, flush } = useThrottleFn(fn, wait, options);
```

- **`run(...args)`** —— 节流后的函数。参数与 `fn` 相同，返回 `fn` 的结果（调用被抑制时返回最近一次的结果——标准 lodash 语义）。
- **`cancel()`** —— 丢弃挂起的 trailing 调用。一个清空界面的「重置」按钮，不应该在 200 ms 后被上一次滚动事件的幽灵更新反杀；交互被放弃时就调 `cancel()`。
- **`flush()`** —— 反过来：不等窗口关闭，挂起的调用*现在*就执行。经典用法：节流的自动保存 + 「提交」时 `flush()`，让最终状态在跳转前落库，而不是 2 秒之后。

这些不是摆设——库的测试套件用假计时器驱动了一整条 `run`/`cancel`/`flush` 时间线，钉死了每一个中间计数：leading 调用同步触发、被抑制的调用坍缩成一次携带*最新*参数的 trailing 调用、`cancel()` 真的会丢弃挂起调用、`flush()` 真的会提前执行它。

## 源码解析：lodash 加两处修补

[实现](https://reactuse.com/effect/usethrottlefn/)短到一杯咖啡就能读完：

```ts
export function useThrottleFn<T extends (...args: any) => any>(
  fn: T, wait?: number, options?: ThrottleSettings,
) {
  const fnRef = useLatest(fn);

  const throttled = useMemo(
    () =>
      throttle(
        (...args: [...Parameters<T>]): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [wait, JSON.stringify(options)],
  );

  useUnmount(() => {
    throttled.cancel();
  });

  return { run: throttled, cancel: throttled.cancel, flush: throttled.flush };
}
```

节流引擎是 `lodash-es` 的 `throttle`——有十年生产里程的计时逻辑，不是手搓的 `setTimeout` 杂技。这个 hook 补上的，恰好是你自己在组件里调 `lodash.throttle` 时必然踩的两个坑：

1. **没有闭包陈旧。** 朴素写法 `useMemo(() => throttle(fn, wait), [])` 会把*首次渲染*的 `fn`——连同首次渲染的 props 和 state——冻结整个组件生命周期。这里 memo 住的 throttle 调用的是 `fnRef.current`，一个由 [`useLatest`](https://reactuse.com/state/uselatest/) 维护、每次渲染都指向最新 `fn` 的 ref。计时状态住在一个稳定的 throttle 实例里；它调用的代码永远是最新的。
2. **没有比组件命长的计时器。** [`useUnmount`](https://reactuse.com/effect/useunmount/) 会调用 `throttled.cancel()`，挂起的 trailing 调用不可能打进一个已卸载的组件。测试套件断言卸载后计时器数量就是零。

依赖数组里有个小彩蛋：`JSON.stringify(options)`。你可以内联传 `{ trailing: false }`——每次渲染都是新对象——而不会重建 throttle 实例，因为 memo 按*内容*而非引用比较 options。而 `useThrottle` 本身就是这个 hook 对准 state 的产物——`useThrottleFn(() => setThrottled(value), wait, options)` 加一个在 `value` 变化时调 `run()` 的 effect。一个计时引擎，两种形态。

## 调参：leading 与 trailing

两个边缘都默认 `true`，这也是你通常想要的行为——首次响应即时、最终值不丢：

```tsx
useThrottle(value, 500);                      // 立即触发，之后每 ≤500ms 一次，最后落在终值
useThrottle(value, 500, { leading: false });  // 跳过即时的首次更新
useThrottle(value, 500, { trailing: false }); // 跳过落到终值的收尾更新
```

- **`leading: false`** 把首次调用推迟到窗口结束。适合突发事件流里第一个事件本身没有意义的场景——比如上报「用户正在滚动」的埋点，你不希望单独一格滚轮就触发。
- **`trailing: false`** 表示窗口中途的调用直接丢弃而非延后。对连续数据流没问题，反正下个窗口会带来新读数；但凡*最后一个*值重要就不行（你的进度条会停在差一点到 100% 的地方）。
- 两个都 `false` 是 lodash 的陷阱——函数只能在没有窗口打开时被调用才会执行，对稳定事件流来说约等于*永远不会*。别这么干。

## 挂载陷阱——第一次变化可能要等

这是 `useThrottle`（值版本）值得知道的细节。它内部在挂载时的 effect 里调用了 `run()`——那次 leading 调用只是把初始值重新 set 了一遍，肉眼不可见。但它同时*打开了节流窗口*。后果是：**挂载后 `wait` 毫秒内**到来的值变化不会立即更新，leading 也救不了——它处在窗口中间，只能等 trailing 边缘。测试套件写得明明白白：

```ts
const { result, rerender } = renderHook(props => useThrottle(props, 100), {
  initialProps: 0,
});
rerender(1);                     // 挂载后立刻变化
jest.advanceTimersByTime(50);
expect(result.current).toBe(0);  // 还是旧值——推迟到 t=100
```

第一个窗口过期之后，落在空档里的变化会拿到自己的 leading 边缘、立即显示。所以稳态下 `useThrottle` 的手感是先即时后节流，与宣传完全一致——但如果组件挂载和值变化几乎同时发生（hydration 交接、挂载即返回的请求结果），第一次变化最多会迟到 `wait` 毫秒。在意的话，要么调小 `wait`，要么改用 `useThrottleFn` 去节流*源头*而不是值。

## 节流还是防抖？

三十秒速览，毕竟它们是同一根谱系的两端：

- **防抖** = 「等待安静」。事件*停止* `wait` 毫秒之前什么都不发生。适合边打边搜、自动保存、resize 结束后的布局计算——只有最终状态重要的场景。对应 [`useDebounce`](https://reactuse.com/state/usedebounce/) / [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)。
- **节流** = 「稳定心跳」。在活动*进行中*以限定频率执行。适合滚动位置、鼠标跟踪、拖拽反馈、进度上报——用户需要在过程中看到反馈的场景。

判别口诀：如果功能的防抖版本在交互过程中给人*冻住*的感觉，你要的是节流。两个 hook 并排的完整决策指南见[《React 中的 Debounce vs Throttle》](https://reactuse.com/blog/react-debounce-vs-throttle/)。

## 限频家族

- [`useDebounce`](https://reactuse.com/state/usedebounce/) / [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) —— 同样的值/回调二人组，「等待安静」的计时策略，同一个 lodash 内核、同样的闭包与卸载修补。
- [`useRafFn`](https://reactuse.com/effect/useraffn/) —— 按*显示器*的节奏而非毫秒预算节流：每个动画帧执行一次回调。给渲染供数据的工作（元素高亮、canvas 绘制），一帧一次胜过任何手挑的 `wait`。
- [`useRafState`](https://reactuse.com/state/userafstate/) —— setter 在下一帧才提交的 `useState`；一帧内多次高频 set 坍缩成一次渲染。治 `mousemove` 驱动状态的最轻量方案。
- [`useScroll`](https://reactuse.com/browser/usescroll/) 与 [`useMouse`](https://reactuse.com/browser/usemouse/) —— 位置追踪 hooks，通常出现在节流的*输入*端。

## SSR 安全

`useThrottleFn` 在渲染期创建 lodash throttle，但创建不启动任何计时器——计时器在 `run()` 被调用时才启动，而所有调用点都在 effect 或事件处理器里，服务端渲染期间永远不会执行。服务端不碰 `window`、不碰 `document`、不碰时钟：你的 Next.js / Remix 构建渲染初始值、干净地完成 hydration，节流在客户端接管后苏醒。与 [`@reactuses/core`](https://reactuse.com) 的所有 hook 一样，SSR 安全是构造使然。

## 要点回顾

- **节流是节奏，防抖是等待。** 用户在交互*过程中*盯着看的东西——滚动、拖拽、鼠标、实时预览——用 [`useThrottle`](https://reactuse.com/state/usethrottle/) / [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/)，别用防抖。
- **值和回调是同一引擎的两种形态**：`useThrottle` 字面上就是对准 `setState` 的 `useThrottleFn`。
- **这层封装赚回了两次门票**：[`useLatest`](https://reactuse.com/state/uselatest/) 杀死闭包陈旧，[`useUnmount`](https://reactuse.com/effect/useunmount/) 取消挂起计时器——每个手搓 lodash.throttle-in-React 迟早都会上线的两个 bug。
- **`cancel()` 和 `flush()` 是逃生舱**——交互被放弃时丢弃挂起调用，用户提交时强制执行。
- **留意挂载窗口**：挂载后 `wait` 毫秒内的值变化要等 trailing 边缘——测试套件验证过，不是感觉。
- **SSR 安全，零配置**——客户端接管之前，没有计时器、没有浏览器全局对象。

装上 [`@reactuses/core`](https://reactuse.com)，把 `useThrottle` 对准你最吵的那个值，让渲染循环拥有脉搏，而不是抽搐。
