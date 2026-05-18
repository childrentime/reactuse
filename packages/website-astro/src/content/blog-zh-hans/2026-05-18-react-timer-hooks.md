---
title: "React 里不用 setTimeout 的计时器写法:useTimeout、useInterval、useCountDown 和 useRafFn"
description: "不再跟 setTimeout 清理、过期闭包和动画循环死磕。一次性梳理 ReactUse 的计时器 hook——useTimeout、useTimeoutFn、useInterval、useCountDown、useRafFn 和 useRafState——以及它们各自悄悄修掉的 bug。"
slug: react-timer-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-18
tags: [react, hooks, performance, tutorial, animation]
keywords: [react setTimeout, react setInterval, react useTimeout hook, react useInterval hook, react requestAnimationFrame, react countdown timer, useRafFn, useRafState, react timer cleanup, react stale closure, react animation loop]
image: /img/og.png
---

# React 里不用 setTimeout 的计时器写法:useTimeout、useInterval、useCountDown 和 useRafFn

计时器是那种每个 React 开发者头十次都会自己手写、其中至少六次写错的东西。模式看起来很简单:在 `useEffect` 里 `setTimeout`,返回一个清理函数,提交。然后代码评审发现了过期闭包。然后 bug 单进来了,因为 delay 是在挂载时从 props 读的,而不是当前渲染里的。然后有人注意到在慢页面上组件已经卸载了,interval 还在跑。然后你发现 `setInterval` 每个周期都会漂移一点,你的倒计时跑一分钟之后差了 800ms。然后性能审计指出有个动画循环,没人记得在标签页隐藏时暂停。

<!-- truncate -->

这些 bug 没一个有意思。它们都是同一类 bug:计时器逻辑没问题,坏的是 React 的接入方式。[ReactUse](https://reactuse.com) 提供了六个小 hook,把这个接入做掉,让你只写计时器逻辑本身:[`useTimeout`](https://reactuse.com/effect/usetimeout/)、[`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)、[`useInterval`](https://reactuse.com/effect/useinterval/)、[`useCountDown`](https://reactuse.com/state/usecountdown/)、[`useRafFn`](https://reactuse.com/effect/useraffn/) 和 [`useRafState`](https://reactuse.com/state/userafstate/)。

这篇文章逐个走一遍——底层原语是什么、在 React 里手写版长什么样、hook 藏了什么 bug、它真正该出现在你代码的哪里。看完你应该知道什么场景该掏哪个计时器 hook,以及为什么。

## 一段代码先把问题说清楚

在引入任何 hook 之前,几乎每个 React 代码库都至少写过一次这个:

```tsx
function Toast({ message, durationMs }: { message: string; durationMs: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(id);
  }, [durationMs]);

  return visible ? <div className="toast">{message}</div> : null;
}
```

这段大体上是对的。bug 在于缺了什么:

1. 依赖数组让 effect 在 `durationMs` 每次变化时重新执行——所以父组件在过程中更新了 prop,会把计时器从零重启,而不是让它跑完。
2. 没办法从外面取消计时器(比如一个"关闭"按钮),除非把 visible 状态提上去。
3. 没办法读取计时器还在不在等待——这在测试里、埋点里、显示一个"2 秒后消失..."的标签里都有用。
4. 清理在卸载时跑,这是对的,但它也会在 `durationMs` 变化导致的每一次重新渲染时跑,这通常不是你想要的。

这四个都能用 `useRef` 拼出来,但是那种没人愿意写第二遍的拼接代码。`useTimeoutFn` 存在的意义就是这个。

## 1. useTimeoutFn——正确的 setTimeout

`useTimeoutFn(callback, interval, options?)` 在 `interval` 毫秒后调度 `callback`,返回 `[isPending, cancel, restart]`。它干了三件 naive 版没干的事:

- 永远调用最新的 `callback`——即使你不把它列在 deps 里,也不会有过期闭包。
- `cancel()` 让父组件或兄弟组件不用卸载就能停掉计时器。
- `restart()` 让你不用改 key、不用重新挂载就能重置时钟。

重写 `Toast`:

```tsx
import { useTimeoutFn } from "@reactuses/core";

function Toast({ message, durationMs, onClose }: {
  message: string;
  durationMs: number;
  onClose: () => void;
}) {
  const [isPending, cancel, restart] = useTimeoutFn(onClose, durationMs);

  return (
    <div className="toast" onMouseEnter={cancel} onMouseLeave={() => restart()}>
      {message}
      {isPending && <span className="fade-bar" />}
    </div>
  );
}
```

注意消失了的东西:没有 `useEffect`、没有 `setTimeout`、没有 `clearTimeout`、没有 `useRef`、没有 `useCallback`。hover 行为——用户在看 toast 时暂停自动消失——一行代码。`isPending` 标志驱动那个淡出条,不需要额外的状态。

`immediate` 选项(默认 `true`)控制计时器是不是在挂载时启动。设为 `false` 就是"按需触发":

```tsx
const [, , scheduleSave] = useTimeoutFn(saveDraft, 2000, { immediate: false });

return <textarea onChange={(e) => { setText(e.target.value); scheduleSave(); }} />;
```

每次按键都把 save 往后推 2 秒。这是构造"用户停止输入 2 秒后保存"防抖的一种方式,不过对这种特定模式 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 通常更干净。

## 2. useTimeout——只想 N 毫秒后重新渲染

`useTimeout(ms, options?)` 跟 `useTimeoutFn` 是同一个东西,只不过回调是组件自己的重新渲染。当你只想让一段 UI 在延迟后"出现",又不想存一个布尔时用它。

```tsx
import { useTimeout } from "@reactuses/core";

function DelayedSpinner({ delayMs = 250 }: { delayMs?: number }) {
  const [isPending] = useTimeout(delayMs);
  return isPending ? null : <Spinner />;
}
```

场景是"不要为低于 250ms 的加载显示 spinner"。如果父组件在 100ms 内完成加载,spinner 永远不会被看见——没有闪烁。如果更长,spinner 出现。没有状态、没有 effect、没有布尔。

返回形状跟 `useTimeoutFn` 一样,所以你如果想打断重新渲染,`cancel` 和 `restart` 也在那。实际中读取的用法占多数。

## 3. useInterval——真的能暂停的 setInterval

`useInterval(callback, delay, options?)` 每 `delay` 毫秒跑一次 `callback`。返回值是 `{ isActive, pause, resume }`,不是一个元组——`useInterval` 是围绕暂停/恢复这件事建的,因为这是所有人都需要、但所有人用原生 `setInterval` 都实现不对的操作。

`setInterval` 在 React 里最常见的 bug **不是**清理——现代 linter 都能抓到——而是**用 `null` 来停掉计时器**。用 `useInterval`,这个模式直接可用:

```tsx
import { useInterval } from "@reactuses/core";

function Polling({ active, onTick }: { active: boolean; onTick: () => void }) {
  useInterval(onTick, active ? 5000 : null);
  return null;
}
```

`active` 翻成 `false` 时,delay 变成 `null`,interval 被清掉。翻回来时,interval 以新的 delay 重启。没有 `useEffect`、没有 ref 杂耍、没有"我是不是在 `active` 的正确取值上清理了"那种担心。

如果你倾向于从 hook 外面显式 pause/resume(比如用户离线时暂停轮询),用 `controls: true` 选项把控制权拿走:

```tsx
const { isActive, pause, resume } = useInterval(refresh, 5000, {
  controls: true,
  immediate: true,
});

useEffect(() => {
  const onVisibilityChange = () =>
    document.hidden ? pause() : resume();
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => document.removeEventListener("visibilitychange", onVisibilityChange);
}, [pause, resume]);
```

光这一段就修了一类在生产环境里到处都是的 bug:用户切到别的标签页之后,轮询还在全速跑,烧电池,烧速率限制的额度。

### 为什么不用 setInterval + 漂移修正?

`setInterval` 不保证两次调用之间是精确的 delay——页面被节流时(后台标签页、电量低、Chrome 的 "intensive throttling")浏览器可能延迟或合并回调。对一个轮询循环,这没事。对一个钟表显示,这是肉眼可见的错:跑了 60 个"每秒一次"的 tick 之后,显示的时间可能比真实墙钟慢一两秒。

对钟表这种东西,不要用 `useInterval` 驱动显示值。用 `useInterval` 调度重新渲染,渲染里读 `Date.now()`:

```tsx
function Clock() {
  const [, force] = useState(0);
  useInterval(() => force((n) => n + 1), 1000);
  return <span>{new Date().toLocaleTimeString()}</span>;
}
```

interval 可以漂,显示的时间在每次渲染时新鲜读出。漂移变成调度问题,不再是正确性问题。

## 4. useCountDown——小时分钟秒,不用自己算日期

倒计时是带额外责任的 interval:跟踪剩余时间、格式化显示、归零时触发回调、之后停掉计时器。组件层面的实现大概是 30 行代码,每个人都至少写过一次。

`useCountDown(time, format?, callback?)` 返回 `[小时, 分钟, 秒]` 三个字符串(零填充)的元组,并把上面这些事都做了:

```tsx
import { useCountDown } from "@reactuses/core";

function OtpResend({ onExpire }: { onExpire: () => void }) {
  const [h, m, s] = useCountDown(60, undefined, onExpire);
  const expired = h === "00" && m === "00" && s === "00";

  return expired
    ? <button onClick={() => /* 再请求一次 */ undefined}>重新发送验证码</button>
    : <span>{m}:{s} 后可重发</span>;
}
```

hook 拥有 interval、剩余时间状态和回调派发。组件拥有渲染决策。如果你想要不同的格式(比如 `X 分 Y 秒` 或者纯秒数),传一个 `format` 函数,它接受剩余秒数返回三个字符串——hook 在每个 tick 上调用它,返回你给的东西。

`useCountDown` 在时间归零后会钳到 `["00", "00", "00"]`,且拒绝溢出超过 99 小时,所以你不用在视图层防御奇怪的输入。

## 5. useRafFn——需要 60fps,而不是"大概每秒一次"

`setInterval(fn, 16)` 是"每帧跑一次"的错误写法。浏览器已经有"每帧一次、跟显示刷新同步、标签页隐藏时跳过"的原语——`requestAnimationFrame`。`useRafFn(callback, initiallyActive?)` 是它的 React 封装。

回调收到当前的高分辨率时间戳(就是 `requestAnimationFrame` 传给回调的那个值),hook 返回 `[stop, start, isActive]`。

一个 canvas 粒子模拟、一段流畅的滚动位置读取、一个 CSS 变量驱动的动画——任何需要每帧更新的东西都该用 `useRafFn`:

```tsx
import { useRafFn } from "@reactuses/core";
import { useRef } from "react";

function FollowCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { target.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useRafFn(() => {
    // 每帧朝目标做一次类似弹簧的 lerp
    current.current.x += (target.current.x - current.current.x) * 0.15;
    current.current.y += (target.current.y - current.current.y) * 0.15;
    if (ref.current) {
      ref.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
    }
  });

  return <div ref={ref} className="follower" />;
}
```

注意两件事。第一,动画**没有**调用 `setState`。直接往 `ref.current.style` 推,把工作放在 React 的渲染周期之外——这是在一个非平凡页面上拿到真正 60fps 的唯一方式。第二,标签页隐藏时,浏览器会自动停掉 `requestAnimationFrame`——没有 `useInterval` 风格的节流断崖,普通情况也不用手写暂停逻辑。

如果你确实想要手动控制(比如只在面板打开时动画),第二个参数传 `false`,在你的 effect 里调 `start()`/`stop()`。

## 6. useRafState——你真的要重新渲染时的动画的批处理 state

`useRafFn` 在你能直接改 DOM 时很棒。有时候你不能——你必须把新值推进 React state,因为它驱动了一棵 JSX 子树。naive 版长这样:

```tsx
const [pos, setPos] = useState({ x: 0, y: 0 });
// ……鼠标移动时每秒 60 次 setPos
```

能跑,但每次 `setPos` 都触发渲染。如果光标比 60Hz 更快地触发 `mousemove`(有些浏览器就是),你会得到比帧还多的渲染。`useRafState` 通过把 state 更新批量到 `requestAnimationFrame` 解决这个问题——即使 `setState` 之间被调用了很多次,每帧最多渲染一次。

```tsx
import { useRafState } from "@reactuses/core";

function CursorBadge() {
  const [pos, setPos] = useRafState({ x: 0, y: 0 });

  useEventListener("mousemove", (e) => {
    setPos({ x: e.clientX, y: e.clientY });
  });

  return <div style={{ left: pos.x, top: pos.y }} className="badge" />;
}
```

不管 `mousemove` 触发多少次,组件每秒最多重新渲染 60 次。它是 `useState` 的一行替换,只要更新源是高频浏览器事件(鼠标、滚动、resize),目标是 JSX。

事件那边搭配 [`useEventListener`](https://reactuse.com/effect/useeventlistener/);目标是 DOM 改动时改用 `useRafFn`。

## 什么时候用哪个

选择不是偏好问题——每个 hook 对应一种特定形状的问题:

| 你想要……                              | 用                  |
|---------------------------------------|---------------------|
| N 毫秒后跑一次回调                    | `useTimeoutFn`      |
| N 毫秒后强制一次重新渲染              | `useTimeout`        |
| 每 N 毫秒跑一次回调,带 pause/resume   | `useInterval`       |
| 显示 hh:mm:ss 剩余时间                | `useCountDown`      |
| 每帧干活,不动 React state             | `useRafFn`          |
| 每帧最多更新一次 React state          | `useRafState`       |
| 等用户停止输入                        | `useDebounceFn`     |
| 把回调速率压到每 N 毫秒一次           | `useThrottleFn`     |

最后两个——`useDebounceFn` 和 `useThrottleFn`——严格说不是计时器 hook,但它们是同一族的。我们在 [React 里的防抖 vs 节流](/blog/react-debounce-vs-throttle/) 里讲过;一句话版本是"阻止高频事件触发得太频繁",而不是"把工作调度到未来"。

## 三个 hook 悄悄防住的错误

上面这些 hook 让一些微妙的 bug 写不出来。

### 错误 1:在 useState 初始化器里 setTimeout

```tsx
const [id] = useState(() => setTimeout(callback, 1000)); // 错
```

这会调度一个在 Strict Mode 故意的双重调用下活下来的计时器,而且没清理。用 effect 和 ref 来"修"是好几行。`useTimeoutFn(callback, 1000)` 是一行,在构造上就对双重调用安全。

### 错误 2:在 interval 回调里读 state

```tsx
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, []); // 永远捕获了 count=0——count 走 0, 1, 1, 1, 1...
```

这是 React 计时器 bug 里被 Google 搜得最多的那个。在原生 React 里的修法是函数式更新(`setCount((c) => c + 1)`)或者 ref。在 `useInterval` 里的修法是"它本来就对"——hook 在内部把最新回调用 ref 路由了。

### 错误 3:在 60fps 上动画 React state

```tsx
const [x, setX] = useState(0);
useEffect(() => {
  const tick = () => { setX((v) => v + 1); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}, []);
```

一个组件能跑。屏幕上十个,React 的渲染队列开始掉帧,因为每个 `setState` 都触发一次完整的协调。`useRafFn` 让你不走 React 直接改 DOM;`useRafState` 在没法改 DOM 时把渲染封到每帧一次。两个都对;上面这个循环只是凑巧对了。

## 组装起来:一个"标签页空闲刷新器"

收尾一个小但真实的组件——一个数据卡片,在标签页可见且用户活跃时每 30 秒轮询一次,并显示到下一次刷新的倒计时:

```tsx
import { useInterval, useCountDown } from "@reactuses/core";
import { useState, useCallback } from "react";

function LiveStat({ fetchValue }: { fetchValue: () => Promise<number> }) {
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, m, s] = useCountDown(30);

  const refresh = useCallback(async () => {
    try {
      setValue(await fetchValue());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    }
  }, [fetchValue]);

  useInterval(refresh, 30_000, { immediate: true });

  return (
    <div className="card">
      <div className="value">{value ?? "—"}</div>
      <div className="footer">
        {error ? `错误:${error}` : `${m}:${s} 后刷新`}
      </div>
    </div>
  );
}
```

`useInterval` 拥有轮询节奏。`useCountDown` 拥有视觉计时器。两个互相不知道对方;它们碰巧落在同一个数字上,因为是用同一个常量种下的。两个 hook,没有 `useEffect`、没有 `setTimeout`、没有 `useRef`。

## 试试看

这篇里每个 hook 在文档页都有可跑的 demo。吸收 API 最快的方式是读 demo、改一个 prop、看看坏在哪:

- [`useTimeout`](https://reactuse.com/effect/usetimeout/)
- [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/)
- [`useInterval`](https://reactuse.com/effect/useinterval/)
- [`useCountDown`](https://reactuse.com/state/usecountdown/)
- [`useRafFn`](https://reactuse.com/effect/useraffn/)
- [`useRafState`](https://reactuse.com/state/userafstate/)

`npm install @reactuses/core`(或 `pnpm add @reactuses/core`)装上,直接 import。没有 provider、没有配置、除了 React 16.8+ 之外没有 peer dependency。完整的 hook 列表和这篇里所有东西的源码在 [reactuse.com](https://reactuse.com)。

别再在 `useEffect` 里写 `setTimeout` 了。对的工具存在,而且更短。
