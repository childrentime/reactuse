---
title: "Ref 逃生舱:用 React Hook 解决闭包陈旧、回调身份不稳和强制更新"
description: "React 里每一次渲染都是一张快照,而闭包捕获的永远是它出生那一刻的快照——陈旧的 state、被打破的 memo、还有「在已卸载组件上 setState」都源于此。本文梳理 ReactUse 中七个基于 ref 逃生舱的 hook:useEvent、useLatest、useMountedState、usePrevious、useFirstMountState、useUpdate、useMergedRefs,以及它们各自消除的 bug。"
slug: react-ref-escape-hatch
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-20
tags: [react, hooks, performance, tutorial]
keywords: [react 闭包陈旧, react useEvent, react useLatest, react 稳定回调, react useMountedState, react 已卸载组件 setState, react usePrevious, react useFirstMountState, react 强制更新, react useUpdate, react 合并 ref, react useMergedRefs, react useEffectEvent]
image: /img/og.png
---

# Ref 逃生舱:用 React Hook 解决闭包陈旧、回调身份不稳和强制更新

每个函数组件在每次渲染时都会从头跑一遍,渲染期间创建的每个闭包,捕获的都是那一刻的 props 和 state。这句话就是 React 模型的全部,同时也是一整族 bug 的源头:读到陈旧 count 的事件处理函数、因为回调身份每次都变而每次渲染都重新订阅的 `useEffect`、在组件已经卸载之后才触发的 `setState`。它们看起来是不同的问题,其实是同一个问题——一个闭包死死攥着一张早已过期的快照。

<!-- truncate -->

对于「我需要一个跨渲染存活、又不被闭包捕获的值」,React 官方的答案是 `useRef`。ref 是一个身份永不改变的可变盒子;读 `ref.current` 拿到的永远是*当前*值,而不是闭包创建时那个。这就是逃生舱。麻烦在于,把 ref 接对——保持同步、在正确的时机读取、不破坏 SSR——足够琐碎,以至于每个人都写出一个略有差异的版本,而其中有些版本会产生竞态。

[ReactUse](https://reactuse.com) 把这些都做成了产品级实现。本文走一遍其中七个,每个的源码都不超过十几行;它的价值在于,这是*正确*的那十几行,在每个项目里都一样。如果你读过[上周那篇专门 effect hook 的文章](/blog/react-specialized-effect-hooks/),这篇是它的姊妹篇:那些 hook 修的是 `useEffect`,这些修的是流经它的闭包。

## 把 bug 说具体

下面这个聊天组件轮询未读消息并显示数量。它错得很隐蔽,能轻松通过 code review:

```tsx
function Inbox({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // BUG:这里的 `count` 永远是 0——它是 effect 首次运行时捕获的值。
      // 这个定时器永远看不到更新后的 count。
      console.log(`Polling, current count is ${count}`);
      fetchUnread(userId).then((n) => setCount(count + n));
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // 故意不放 count,否则每次变化定时器都会重建

  return <Badge>{count}</Badge>;
}
```

定时器回调闭包捕获的是 effect 运行那次渲染里的 `count`。那时 `count` 是 `0`,于是它在那个闭包里永远是 `0`——`setCount(count + n)` 实际上是 `setCount(0 + n)`。常见的「修复」各自又换来一个新 bug:把 `count` 加进依赖数组,定时器就每五秒销毁重建一次;改用 `setCount((c) => c + n)` 更新函数,写是修好了,但 `console.log` 仍在撒谎,任何需要在 setter 之外*读取*最新 count 的逻辑依旧卡住。

你真正想要的是:一个永不重建的稳定定时器,触发时仍能读到最新的 `count`。这就是 ref。下面这些 hook 就是补齐了人体工学的 ref。

## 1. useLatest——永远读到当前值

[`useLatest`](https://reactuse.com/state/uselatest/) 接收一个值,返回一个永远持有它最新版本的 ref。这个 ref 的身份永不改变,所以任何闭包捕获它——定时器、事件监听器、长期存活的回调——都会透过它读到今天的值,而不是订阅那一刻冻结的值。

```tsx
import { useLatest } from "@reactuses/core";

function Inbox({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const countRef = useLatest(count);

  useEffect(() => {
    const id = setInterval(() => {
      // 即便 effect 只运行了一次,countRef.current 永远是最新的 count。
      console.log(`Polling, current count is ${countRef.current}`);
      fetchUnread(userId).then((n) => setCount(countRef.current + n));
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // 依赖里没有 count——定时器是稳定的

  return <Badge>{count}</Badge>;
}
```

effect 只依赖 `userId`,于是定时器只创建一次,熬过每一次 count 变化。读取走 `countRef.current`,而 `useLatest` 通过在每次渲染的 layout effect 里写入它来保持其最新。这是这一族里最有用的成员:任何时候你发现自己把某个值加进依赖数组*只是*为了让闭包能读到它、而不是为了让 effect 重跑——`useLatest` 就是答案。

## 2. useEvent——身份稳定、又总能看到最新 state 的回调

`useLatest` 解决的是透过稳定引用读取一个*值*。[`useEvent`](https://reactuse.com/effect/useevent/) 为一个*函数*解决同样的问题:它返回一个回调,身份在组件整个生命周期内冻结,但每次调用执行的都是你传入的最新版本——把最新的 props 和 state 一并烤进去。

正是这个 hook,让你能把一个处理函数传给被 memo 的子组件而不破坏它的 memo:

```tsx
import { useEvent } from "@reactuses/core";

function SearchBox({ onResults }: { onResults: (r: Result[]) => void }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  // 身份稳定,但每次调用都读取最新的 query 和 filters。
  const search = useEvent(() => {
    runSearch(query, filters).then(onResults);
  });

  // <ExpensiveButton> 被 React.memo 了。因为 search 身份永不变,
  // 按钮在 query/filter 的每次按键时都不会重渲染。
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveButton onClick={search}>Search</ExpensiveButton>
    </>
  );
}
```

没有 `useEvent`,你会去用 `useCallback(() => runSearch(query, filters), [query, filters])`——它在每次按键时产出一个*新的* `search`,让按钮上的 `React.memo` 失效。把依赖砍成 `[]`,闭包又陈旧了,永远在搜索那个空的初始 query。`useEvent` 两者兼得:稳定身份加新鲜闭包。如果这个名字眼熟,它跟 React 实验性的 `useEffectEvent` / 旧的 `useEvent` RFC 是同一个想法——今天就能用,不需要 canary 构建。把它用在你向下传递的事件处理函数和回调上;在你确实*想要*重跑的依赖数组里别用它。

## 3. useMountedState——别在卸载后 setState

「Can't perform a React state update on an unmounted component」这个警告来自一个异步操作在组件已经消失之后才完成。修法是一个在卸载时翻转的标志,在每次迟到的 `setState` 前检查它。[`useMountedState`](https://reactuse.com/state/usemountedstate/) 就是这个标志,以 getter 背后的 ref 形式存在:

```tsx
import { useMountedState } from "@reactuses/core";

function UserCard({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const isMounted = useMountedState();

  useEffect(() => {
    fetchUser(id).then((u) => {
      // 这个 fetch 可能在用户已经离开之后才完成。
      if (isMounted()) setUser(u);
    });
  }, [id]);

  return user ? <Card user={user} /> : <Spinner />;
}
```

`isMounted` 是一个稳定的 getter——调用它会从 ref 里返回当前挂载状态,所以你可以在任何异步回调里调用它而不必把它加进依赖数组。它故意是函数而不是布尔值:布尔值本身就会是一张陈旧快照。对于 fetch,你往往可以更倾向用 `AbortController`,但 `useMountedState` 覆盖了 abort 信号够不着的场景——定时器、第三方 promise、订阅回调。

## 4. usePrevious——和上一次渲染对比

有时你需要*上一次*渲染的值来决定这一次怎么做:根据一个数字是涨是跌来决定动画方向、仅当某个值真的从某个旧值变化时才触发 effect、记录状态转移。[`usePrevious`](https://reactuse.com/state/useprevious/) 正好把它递给你:

```tsx
import { usePrevious } from "@reactuses/core";

function Price({ value }: { value: number }) {
  const previous = usePrevious(value);
  const direction =
    previous === undefined ? "flat" : value > previous ? "up" : value < previous ? "down" : "flat";

  return <span className={`price price--${direction}`}>${value.toFixed(2)}</span>;
}
```

首次渲染时 `previous` 是 `undefined`(此前没有渲染过),之后每次渲染它都持有上一次渲染的值。ReactUse 的实现用渲染期间的 state 更新来追踪它,而不是朴素的「在 effect 里写 ref」做法——这很重要,因为基于 effect 的版本在渲染过程中本身会报错误的值。了解一下这个 hook 内部怎么做的有好处,但重点是你不用再重复实现它了。

## 5. useFirstMountState——判断是不是第一次渲染

一个近亲:有时你需要的不是上一个*值*,而仅仅是知道这是不是第一次渲染。[`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) 在首次渲染返回 `true`,之后每次返回 `false`——同步地,在渲染期间,早于任何 effect 运行之前。

```tsx
import { useFirstMountState } from "@reactuses/core";

function Analytics({ route }: { route: string }) {
  const isFirstMount = useFirstMountState();

  useEffect(() => {
    // 区分初始页面加载和之后的客户端导航。
    track(isFirstMount ? "page_view_initial" : "page_view_spa", { route });
  }, [route]);

  return null;
}
```

它是 `useUpdateEffect` 这类「跳过 mount」effect hook 背后的积木——但直接暴露出来,供你在渲染逻辑里(而不仅是在 effect 里)拿到这个布尔值。因为它在渲染期间读取(不等 effect),你可以用它来选择初始样式、决定是否动画、或分支 JSX,这些都是基于 effect 的「已挂载」标志来不及做到的。

## 6. useUpdate——按需强制重渲染

ref 对 React 的渲染周期是隐形的:改 `ref.current` 不会调度渲染。通常这正是它的意义所在。偶尔你有真正活在 React 之外的状态——一个 ref 上的值、一个外部 store、一个可变实例——你需要告诉 React「有东西变了,重画一次」。[`useUpdate`](https://reactuse.com/effect/useupdate/) 返回一个只做一件事的函数:强制重渲染。

```tsx
import { useUpdate, useLatest } from "@reactuses/core";

function StopwatchDisplay({ stopwatch }: { stopwatch: ExternalStopwatch }) {
  const update = useUpdate();

  useEffect(() => {
    // 这个秒表自己改自己的 elapsed 时间;它不活在 React state 里。
    // 订阅它,每个 tick 强制渲染一次,让显示跟上。
    return stopwatch.onTick(() => update());
  }, [stopwatch, update]);

  return <time>{stopwatch.elapsed}ms</time>;
}
```

`update` 身份稳定,所以放在依赖数组和 effect 体里都安全。要节制使用——大多数「我需要强制渲染」的直觉,用真正的 state 来满足更好——但对于把一个外部可变源接进 React 渲染周期,它是精准的工具,而且比人们到处抄的 `useReducer((x) => x + 1, 0)` 咒语清晰得多。

## 7. useMergedRefs——让多个 ref 指向同一个节点

最后一个是另一种风味的 ref 问题:不是陈旧,而是*组合*。一个 DOM 节点只能交给一个 `ref` prop,但你经常有好几个消费者各自都需要它——你自己的测量 ref、来自父组件的转发 ref、还有某个库的 ref(拖拽手柄、焦点陷阱、交叉观察器)。[`useMergedRefs`](https://reactuse.com/state/usemergedrefs/) 把它们合并成一个 ref 回调,把节点分发给所有人:

```tsx
import { forwardRef, useRef } from "react";
import { useMergedRefs } from "@reactuses/core";

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(props, forwardedRef) {
  const localRef = useRef<HTMLInputElement>(null); // 我们想自己测量/聚焦它
  const mergedRef = useMergedRefs(localRef, forwardedRef);

  // localRef.current 和父组件的 ref 都指向同一个 input。
  return <input ref={mergedRef} {...props} />;
});
```

它同时处理两种形态的 ref——对象 ref(`{ current }`)和回调 ref(`(node) => …`)——并把节点赋给每一个。这消除了 React 组件库作者生活里最繁琐的样板:每个设计系统都重新发明、且通常没正确处理回调 ref 的那个手写 `setRef` 辅助函数。

## 拼到一起

开头那个 `Inbox` bug,用工具箱而不是绕着它写:

```tsx
import { useLatest, useMountedState, useEvent } from "@reactuses/core";

function Inbox({ userId, onOpen }: { userId: string; onOpen: (id: string) => void }) {
  const [count, setCount] = useState(0);
  const countRef = useLatest(count);
  const isMounted = useMountedState();

  useEffect(() => {
    const id = setInterval(() => {
      fetchUnread(userId).then((n) => {
        if (isMounted()) setCount(countRef.current + n); // 新鲜的 count,没有迟到更新
      });
    }, 5000);
    return () => clearInterval(id);
  }, [userId]); // 稳定定时器——count 变化时不重建

  // 给被 memo 的行用的稳定处理函数,总是读到最新的 count。
  const handleOpen = useEvent(() => {
    track("inbox_open", { unread: countRef.current });
    onOpen(userId);
  });

  return <InboxButton onClick={handleOpen} badge={count} />;
}
```

三个 hook,关掉三类闭包 bug:一个能读新鲜 state 的稳定定时器(`useLatest`)、没有卸载后 setState(`useMountedState`)、以及一个不破坏被 memo 子组件的稳定处理函数(`useEvent`)。没有依赖数组体操,没有 `setRef` 辅助函数,没有 `useReducer` 强制更新的小把戏。

## 上手试试

每个 hook 在它的文档页都有可运行的 demo——打开一个,改改输入,看看什么保持稳定、什么保持新鲜:

- [`useLatest`](https://reactuse.com/state/uselatest/)
- [`useEvent`](https://reactuse.com/effect/useevent/)
- [`useMountedState`](https://reactuse.com/state/usemountedstate/)
- [`usePrevious`](https://reactuse.com/state/useprevious/)
- [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/)
- [`useUpdate`](https://reactuse.com/effect/useupdate/)
- [`useMergedRefs`](https://reactuse.com/state/usemergedrefs/)

用 `npm install @reactuses/core`(或 `pnpm add @reactuses/core`)安装后直接 import。没有 provider,除了 React 16.8+ 之外没有 peer 依赖。完整 hook 列表和上面所有内容的源码都在 [reactuse.com](https://reactuse.com)。

心智模型就是全部:每次渲染都是一张快照,闭包捕获这张快照,而 `useRef` 是出去的那扇门。这七个 hook 就是这扇门,而且铰链已经上好了油。
