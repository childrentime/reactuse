---
title: "React useTimeout Hook：声明式 setTimeout 与自动清理 (2026)"
description: "useTimeout 与 useTimeoutFn 实用指南：为什么在 useEffect 里写 setTimeout 会漏掉定时器、触发过期闭包、在 StrictMode 下重复挂载，[isPending, start, cancel] 这个元组如何把这些一次性解决，为什么改延迟会重启倒计时、改回调却不会，start() 转发参数的陷阱，以及延迟 loading、复制提示、自动消失、冷却按钮这几个模式。TypeScript 优先，SSR 安全。"
slug: react-usetimeout-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-21
tags: [react, hooks, timers, typescript, tutorial]
keywords: [react usetimeout, usetimeout, usetimeout react, useTimeout hook, react settimeout hook, useeffect 里的 settimeout, react settimeout 清理, react settimeout 不生效, react 清除 settimeout, react 延迟 hook, usetimeoutfn, react 卸载时取消 settimeout, react settimeout 闭包陷阱, react 防抖 settimeout hook, react 延迟显示 loading]
image: /img/og.png
---

# React useTimeout Hook：声明式 setTimeout 与自动清理 (2026)

这是一个「已复制！」按钮。每个代码库里都有一个，而这个版本有三个 bug：

```tsx
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    setTimeout(() => setCopied(false), 2000);
  }, [copied]);

  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); }}>
      {copied ? "已复制！" : "复制"}
    </button>
  );
}
```

它从不清除定时器，所以在倒计时中途卸载会留下一个指向已死组件的回调。它在每次 `copied` 变化时重新挂载，而不是干净地重启。而在 React 18 的 StrictMode 下，effect 在挂载时会跑两次，于是你本想要一个定时器，却拿到了两个。补上漏掉的 `clearTimeout` 能修掉泄漏，但修不掉问题的形状：定时器的生命周期现在被绑进了依赖数组，而你依然没有办法在点击事件里取消它、按需重启它，或者问一句「它还在跑吗？」

`setTimeout` 是一个「发射后不管」的浏览器原语。React 组件可不是发射后不管的——它们会卸载、会重渲染、会改主意。[`@reactuses/core`](https://reactuse.com) 里的 [`useTimeout`](https://reactuse.com/effect/usetimeout/) 和 [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) 把这个鸿沟填上了：交给你的不是一个需要小心伺候的数字，而是一份状态加两个控制函数。这篇文章讲它们底层到底做了什么、那个所有人都会踩的行为（延迟是依赖，回调不是）、一个会悄悄污染你参数的 `start()` 陷阱，以及值得直接抄走的几个模式。

<!-- truncate -->

## 快速开始

```bash
npm install @reactuses/core
```

```tsx
import { useTimeoutFn } from "@reactuses/core";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [, startReset] = useTimeoutFn(() => setCopied(false), 2000, {
    immediate: false,
  });

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        startReset();
      }}
    >
      {copied ? "已复制！" : "复制"}
    </button>
  );
}
```

没有 effect，没有依赖数组，没有需要记着写的清理。定时器由一次点击、而不是由一次渲染来启动；卸载时自动清除；在提示还挂着的时候再点一次「复制」，会重新开始这两秒，而不是在第一个定时器上再叠一个。

## 两个 Hook，一台引擎

两个 hook 返回的是同一个三元组——库里把它叫做 `Stoppable`：

```tsx
type Stoppable = [isPending: boolean, start: Fn, cancel: Fn];
```

它们的区别只在于：时间到了之后发生什么。

**[`useTimeoutFn(cb, ms, options?)`](https://reactuse.com/effect/usetimeoutfn/)** 执行你的回调。当这个「到期」本身有事要做时用它——关掉 toast、重置标志位、发一个埋点。

**[`useTimeout(ms?, options?)`](https://reactuse.com/effect/usetimeout/)** 不跑你的任何回调。它把 `isPending` 从 `true` 翻成 `false` 并触发一次重渲染。当这个「到期」本身*就是*状态时用它——「300ms 过了没？」就是全部的问题。

`useTimeout` 字面上就是把回调那个位置让给「强制重渲染」的 `useTimeoutFn`：

```tsx
export const useTimeout: UseTimeout = (ms = 0, options = {}) => {
  const update = useUpdate();
  return useTimeoutFn(update, ms, options);
};
```

这个 [`useUpdate`](https://reactuse.com/effect/useupdate/) 是一个两行的 `useReducer`，对一百万取模递增计数器——就是那个「不发明假 state 也能强制重渲染」的标准技巧，取模是为了让长命组件不会一路飘向 `Number.MAX_SAFE_INTEGER`。它保证了到期那一刻一定会有一次渲染，哪怕在光靠 `isPending` 不足以触发渲染的场景下也是如此。正是这一点，让 `useTimeout` 可以当作一个纯粹的「N 毫秒后重新渲染我」原语来用——比如你要重新读一个并不是 React state 的值时。

默认两者都在挂载时启动。传 `{ immediate: false }`，在你自己调用 `start()` 之前什么都不会发生。

## 它到底做了什么

实现大约二十行，而每一行都在回答开头那个例子里的某个 bug：

```tsx
export const useTimeoutFn = (cb, interval, options = {}) => {
  const { immediate = true } = options;
  const [pending, setPending] = useState(() => immediate);
  const savedCallback = useLatest(cb);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const stop = useEvent(() => {
    setPending(false);
    if (timer.current) clearTimeout(timer.current);
  });

  const start = useEvent((...args: unknown[]) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPending(false);
      savedCallback.current(...args);
    }, interval);
    setPending(true);
  });

  useEffect(() => {
    if (immediate) start();
    return stop;
  }, [stop, immediate, interval, start]);

  return [pending, start, stop];
};
```

这里塞进了五个决策，每一个都值得知道，因为每一个之后都会出现在你自己的代码里。

**回调住在 ref 里，不在依赖里。** [`useLatest`](https://reactuse.com/state/uselatest/) 在每次渲染提交后把 `savedCallback.current` 指向最新的那个函数，定时器透过它来调用。所以到期时执行的闭包是你*最近一次*渲染里的那个——过期闭包的 bug 没了——但换掉回调**不会**重启倒计时。一个 5 秒的定时器跑到第 4 秒时还剩 1 秒，哪怕它将要调用的那个函数在这期间已经被重新创建了十次。这是正确的行为，仓库里有测试覆盖，但对于「一个长得像 useEffect 的 hook，输入变了就该重跑」这种预期来说，会让人意外。

**延迟*确实*在依赖里。** `interval` 位于依赖数组中，所以改动它会拆掉当前定时器、从零开始一个新的。这是刻意的，通常也正是你想要的——但请看下面的坑，因为在渲染里现算的延迟，是造出一个永远跑不完的倒计时的最快方式。

**`start` 和 `stop` 的引用永不改变。** [`useEvent`](https://reactuse.com/effect/useevent/) 把两者都包进一个空依赖的 `useCallback` 并转发给 ref，所以你在第 1 次渲染拿到的函数，和第 500 次渲染拿到的是同一个引用。你可以把它们放进依赖数组、传给被 memo 的子组件、或者塞进 context，都不会引发常见的抖动。

**`start()` 先清后设。** 在定时器已经在跑的时候调用它不会叠加——而是取消并重启。这就是「再点一次复制」表现正常的原因；也意味着在每次按键时反复调用 `start()`，你就白得了一份防抖语义（不过 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 把意图说得更清楚）。

**`pending` 是被预置的，不是闪出来的。** `useState(() => immediate)` 意味着当 `immediate` 打开时，第一次渲染读到的就已经是 `true`——挂载时没有 `false → true` 的闪烁，也没有浪费掉的一次渲染。而且因为 `immediate` 只是一个普通选项、服务端和客户端取值一致，这个预置值在两边完全相同。这个 hook 里没有任何东西碰 `window`、`document` 或 `Date`，所以它无需守卫就能在服务端渲染，也不会出现 hydration 不匹配。

effect 的清理函数就是 `stop` 本身，这就是泄漏的修复：卸载时一定清除定时器，无论它当时处于什么状态。

## 值得抄走的模式

### 延迟出现的 loading

`useTimeout` 最好的用途。一个出现 80ms 就消失的 spinner 读起来只是一次闪烁——比完全不显示还糟。解法是只在加载真的慢的时候才显示，而这恰好就是「300ms 过了没？」：

```tsx
function UserList() {
  const { data, isLoading } = useUsers();
  const [tooSoon] = useTimeout(300);

  if (isLoading) return tooSoon ? null : <Spinner />;
  return <List items={data} />;
}
```

`tooSoon` 初始为 `true`，挂载 300ms 后翻成 `false`。快速返回的请求在这段间隙里什么都不渲染；慢的才会拿到 spinner。一行，无 state，无 effect。

### 自动消失 + 悬停暂停

元组里的 `cancel` 和 `start` 让这件事变得很简单——手写版本需要一个 ref 和两个 effect：

```tsx
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [, start, cancel] = useTimeoutFn(onDismiss, 5000);

  return (
    <div role="status" onMouseEnter={cancel} onMouseLeave={() => start()}>
      {message}
    </div>
  );
}
```

注意 `onMouseLeave` 上的 `() => start()`。这不是风格偏好——见下面的坑。

### 冷却按钮

```tsx
function ResendCodeButton({ onResend }: { onResend: () => void }) {
  const [cooling, startCooldown] = useTimeout(30_000, { immediate: false });

  return (
    <button
      disabled={cooling}
      onClick={() => { onResend(); startCooldown(); }}
    >
      {cooling ? "验证码已发送，请稍候" : "重新发送验证码"}
    </button>
  );
}
```

`immediate: false` 是关键：按钮在挂载时是可用的，只有被用过一次之后才进入冷却。如果你想渲染剩余秒数而不是一个布尔值，那是另一个 hook 的活——[`useCountDown`](https://reactuse.com/state/usecountdown/) 会帮你倒数并把数字交给你。

### 把控制权交还给浏览器

不带参数的 `useTimeout()` 默认 `ms = 0`，它依然会推迟到一个宏任务——在绘制之后、在待处理的微任务之后。偶尔这正是你想要的那个逃生口：「先让浏览器把这一帧画出来，我再做那件耗时的事」，而且比一个 `requestIdleCallback` polyfill 更好推理。如果你要的是每帧执行而不是执行一次，用 [`useRafFn`](https://reactuse.com/effect/useraffn/)。

## 值得知道的坑

- **`start` 会把参数转发给你的回调。** 这是一个真实的特性——`start(userId)` 会把 `userId` 透传给定时器回调——同时也是一个真实的陷阱，只要调用方是 DOM 事件处理器。`onMouseLeave={start}` 会把 React 的合成 `MouseEvent` 直接塞进你的 `onDismiss(...)`。如果那个回调是 `onDismiss(id?: string)`，你就用一个事件对象当 id 关掉了一个 toast，而 TypeScript 不会拦你，因为 `start` 的类型是 `Fn`。包一层：`onMouseLeave={() => start()}`。`onClick`、`onBlur` 以及任何会传事件的地方，同理。

- **延迟一变，倒计时就重启——每一次都是。** `interval` 是依赖，所以下面这个永远不会触发：

  ```tsx
  // 有 bug：每次渲染都是新的延迟，定时器被无限重启
  useTimeoutFn(onDone, Math.max(0, deadline - Date.now()));
  ```

  任何按渲染重算的延迟，都会在它跑完之前把时钟清零。传一个稳定的数字，或者 memo 掉它。反过来这个特性也有用：当延迟是真的变了——用户在「3 秒后消失 / 10 秒后消失 / 不消失」之间切换——重启正是对的。

- **回调变了*不会*重启它。** 上一条的镜像，同样值得记进肌肉记忆。你的回调永远是最新的那个，但它的到期时刻是 `start()` 执行时定下的那个。

- **`cancel()` 会把 `isPending` 设为 `false`。** 它是停止，不是暂停——没有「用剩余时间继续」这回事。`cancel()` 之后再 `start()`，走的是一个完整的新延迟。如果你需要真正的暂停/恢复语义，得自己记录已经过去的时间，并把剩余时间作为新的延迟传进去。

- **卸载之后 `isPending` 会冻结在最后一次渲染的值上。** 清理函数调用了 `stop()`，它清除了定时器并调用 `setPending(false)`——但这个状态更新落在了一个已卸载的组件上，React 会丢弃它。如果你在测试里快照了这个元组、在 `unmount()` 之后再读，`isPending` 依然会是 `true`。这不是泄漏，也不会有警告；定时器是真的被清掉了。

- **StrictMode 会挂两次，但结果收敛。** 在 React 18 的开发模式下，挂载 effect 会执行、清理、再执行一次，所以在 dev 里你会看到两次 `setTimeout` 调用。永远不会重复触发——`stop` 清掉了第一个，`start` 在排新的之前又清了一次——但倒计时实际上是从第二次执行开始算的。实际使用中这是亚毫秒级的差别；但在一个用假定时器精确推进时间的测试里，这个差别是会咬人的。

- **`immediate` 在挂载时被读取，同时也是依赖。** 在后续某次渲染里把 `immediate` 从 `false` 翻成 `true`，*会*启动定时器，因为它在 effect 的依赖里。用切换它的方式来声明式地武装一个定时器是完全合理的做法——只是别惊讶于它并不是惰性的。

## 什么时候不该用它

这两个 hook 是对单个 `setTimeout` 的一层薄而诚实的封装。当你的问题有专门的名字时，对应的 hook 已经处理好了那些你否则要重新踩一遍的边界情况：

- **按周期重复执行** → 用 [`useInterval`](https://reactuse.com/effect/useinterval/)，而不是让一个 timeout 自己重新武装自己。自排程的 timeout 会漂移，而且取消起来极其难受。
- **「等用户停止输入」** → 回调用 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)，值用 [`useDebounce`](https://reactuse.com/state/usedebounce/)。你*可以*靠每次按键调 `start()` 来搭出来，但专用 hook 一眼就能读懂。
- **「每 N 毫秒最多一次」** → [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) / [`useThrottle`](https://reactuse.com/state/usethrottle/)。timeout 是限流的错误原语；第一次调用就该立刻通过。
- **可见的倒数** → [`useCountDown`](https://reactuse.com/state/usecountdown/)。用单个 timeout 渲染「4… 3… 2…」意味着你要自己跑一个 tick 循环。
- **「用户是不是不动了？」** → [`useIdle`](https://reactuse.com/browser/useidle/)，它已经监听了正确的那组活动事件。
- **逐帧动画** → [`useRafFn`](https://reactuse.com/effect/useraffn/)。`setTimeout` 不与合成器对齐，而且在后台标签页里还会继续跑。
- **只是想在卸载时清理** → [`useUnmount`](https://reactuse.com/effect/useunmount/)。根本不需要定时器。

## 要点回顾

- 在 `useEffect` 里写 `setTimeout`，逼着你同时手动管四件事：清理、依赖数组、过期闭包、以及缺失的控制能力。对三个错一个，是常态。
- [`useTimeoutFn`](https://reactuse.com/effect/usetimeoutfn/) 返回 `[isPending, start, cancel]`，并且天然在卸载时清除。[`useTimeout`](https://reactuse.com/effect/usetimeout/) 是同一台引擎，只是把回调那格用来触发重渲染——适合「到期本身就是你关心的状态」的场景。
- 延迟是依赖，回调不是——改延迟会重启倒计时，改回调只会悄悄换掉将要执行的函数。两者都是刻意设计；分清哪个是哪个能省下一个下午。
- `start` 会转发参数，所以永远不要把它直接传给 DOM 事件处理器。写 `onMouseLeave={() => start()}`，不要写 `onMouseLeave={start}`。
- `start` 和 `cancel` 的引用永久稳定，`isPending` 被预置所以挂载时不会闪，而且 hook 里没有任何东西碰浏览器全局对象——它能原封不动地在服务端渲染。

`useTimeout`、`useTimeoutFn`、`useInterval`，以及另外 110+ 个 SSR 安全、TypeScript 优先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 里——一次安装，支持 tree-shaking，没有需要伺候的依赖。

```bash
npm install @reactuses/core
```
