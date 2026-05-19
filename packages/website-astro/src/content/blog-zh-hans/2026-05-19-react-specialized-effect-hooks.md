---
title: "useEffect 之外:专门处理异步、深比较和 SSR 的 Effect Hook"
description: "React 只内置了一个 effect hook,这意味着你要在每个项目里重复造同一批 wrapper。这篇文章梳理 ReactUse 里的九个专门 effect hook——useAsyncEffect、useUpdateEffect、useDeepCompareEffect、useCustomCompareEffect、useOnceEffect、useIsomorphicLayoutEffect、useUpdateLayoutEffect、useMount、useUnmount——以及它们各自消除的摩擦。"
slug: react-specialized-effect-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-19
tags: [react, hooks, performance, tutorial, ssr]
keywords: [react useEffect 替代, react useAsyncEffect, react useUpdateEffect, react useDeepCompareEffect, react useCustomCompareEffect, react useIsomorphicLayoutEffect, react useMount, react useUnmount, react useEffect 异步, react useEffect 深比较, react useEffect 跳过 mount, react useLayoutEffect SSR]
image: /img/og.png
---

# useEffect 之外:专门处理异步、深比较和 SSR 的 Effect Hook

React 只给了你一个 effect hook:`useEffect`。其他所有 effect 模式——挂载后只跑一次、跳过首次渲染、比较对象依赖、不带竞态地处理异步、不在服务端报警告地跑 layout effect——都得你自己拼。大多数团队最后都会在 `utils/hooks.ts` 里塞五六个 wrapper hook。不同团队写的是同一个东西的不同变体,其中有些版本是错的。

<!-- truncate -->

这种重复性的基础设施不应该出现在你的代码库里。[ReactUse](https://reactuse.com) 已经把这些专门 effect hook 给你做好了——围绕 `useEffect` 和 `useLayoutEffect` 的一组小而专的封装,把最常见的缺口都补齐了。这篇文章过一遍其中九个:`useEffect` 在哪里别扭、专门 hook 做了什么不同的事、以及一个能用上的具体例子。

如果你已经在用 ReactUse 的计时器([上周写过](/blog/react-timer-hooks/))、observer 或者浏览器 API,可能已经无意识地导入过其中几个了。专门走一遍的意义是:在你下次再写那个 wrapper 之前,先知道工具箱里有什么。

## 为什么单个 useEffect 不够用

来看一个真实组件里的一行:

```tsx
useEffect(() => {
  fetch(`/api/user/${id}`).then((r) => r.json()).then(setUser);
}, [id]);
```

这一段第一天就有四个问题,过一个月还会有第五个:

1. **没有 abort。** 如果 `id` 在请求飞行中变了,旧请求会在新请求之后才返回,把新数据覆盖掉——经典的竞态。
2. **没法用 async/await。** 你不能把 effect 回调标成 `async`,因为 React 要的是 `undefined` 或者一个清理函数,不是 Promise。所以每个异步 effect 不是用 `.then` 链就是包一个 IIFE。
3. **没法跳过 mount。** 有时候你只想在 `id` 变化时响应,而不是在组件首次渲染时跑(初始数据是父组件给的)。普通 `useEffect` 至少要跑一次。
4. **依赖不会做深比较。** 如果 `id` 是 `{ workspace: "a", user: "b" }`,父组件每次重渲染都会产生新的对象引用,effect 每次都会跑,即使内容没变。
5. **SSR + `useLayoutEffect`。** 一个月后有人把组件改成用 `useLayoutEffect` 做 DOM 测量,SSR 每次渲染都会打警告。

每个问题都能修,但修起来 5 到 30 行代码,而且很容易错得很隐蔽。下面这些 hook 直接把每个缺口堵上。

## 1. useAsyncEffect — 不需要 IIFE 的 async/await

第一次写都会写出来的模式:

```tsx
useEffect(() => {
  let cancelled = false;
  (async () => {
    const r = await fetch(`/api/user/${id}`);
    const data = await r.json();
    if (!cancelled) setUser(data);
  })();
  return () => { cancelled = true; };
}, [id]);
```

这是对的。这也是 6 行样板代码,本来如果 React 允许的话,一句 `async () => { setUser(await fetch(...).then((r) => r.json())); }` 就能搞定。[`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/) 就是把这个缺口补上:

```tsx
import { useAsyncEffect } from "@reactuses/core";

useAsyncEffect(async () => {
  const r = await fetch(`/api/user/${id}`);
  setUser(await r.json());
}, [id]);
```

这个 hook 直接接受 `async` 回调,并忽略掉返回的 Promise(不会产生 cleanup 警告)。它**不会**帮你处理取消——那是下一个 hook 的事,或者你手动用 `AbortController`。当异步体很短、不需要中途退出时,用 `useAsyncEffect`。需要取消时,接一个 `AbortController`:

```tsx
useAsyncEffect(async (signal) => {
  const r = await fetch(`/api/user/${id}`, { signal });
  setUser(await r.json());
}, [id]);
```

hook 把一个 `AbortSignal` 作为第一个参数传进来,清理时会 abort 它,所以飞行中的请求被取消,而不是回到一个过期的 state setter 上。

这一个 hook 大约能消除典型代码库里 80% 的「我本该写个 wrapper」时刻。大部分数据请求 effect 都是短的、异步的、希望在变化时被取消。`useAsyncEffect` 就是这个形状。

## 2. useUpdateEffect — 跳过 mount

`useEffect` 总是在第一次渲染后就跑一次。有时候这是错的:如果一个组件已经从 props 拿到初始值,在 mount 时跑 effect 要么重复了工作,要么在还没真正变化时就触发了「值变了」的通知。

普通 React 的绕过办法是一个 ref:

```tsx
const isFirst = useRef(true);
useEffect(() => {
  if (isFirst.current) { isFirst.current = false; return; }
  onChange(value);
}, [value]);
```

这是对的,但每个团队的代码库里都至少有三个这样的版本。[`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 跟 `useEffect` 一样,只是少了第一次:

```tsx
import { useUpdateEffect } from "@reactuses/core";

useUpdateEffect(() => {
  onChange(value);
}, [value]);
```

最常见的用法是**受控组件的变更通知**。你希望在内部 value 变化时调用 `onChange`,而不是在父组件第一次用初始值挂载组件时。普通 `useEffect` 版本会在 mount 时触发,父组件在用户什么都还没做的时候就收到了一个虚假的 `onChange(initialValue)`。

第二个用法是**埋点**:「filter 变化时发 `viewed_filter` 事件。」mount 不是变化,它是起始状态。

## 3. useMount — 「挂载时跑一次」的惯用法

`useEffect(() => { /* ... */ }, [])` 在技术上确实是「mount 时跑一次」的正确写法。它也视觉上吵闹,而且经常被 lint 规则误伤(eslint 的 `exhaustive-deps` 会在回调闭包到任何变量时抱怨,即使你确实想要「mount 时的快照」)。

[`useMount`](https://reactuse.com/effect/usemount/) 是一个单用途的别名,文档化了意图:

```tsx
import { useMount } from "@reactuses/core";

useMount(() => {
  trackPageView();
  initialiseSentry();
});
```

功能上等同于 `useEffect(fn, [])`,但名字就是文档。看到 `useMount`,你不用看依赖就知道回调正好跑一次。看到 `useEffect(fn, [])`,你得扫一遍 body 才能确认没有闭包到本该出现在依赖里的响应式变量。

## 4. useUnmount — 不需要空 effect 的清理

`useMount` 的镜像。普通 React 写「卸载时做 X」是这样:

```tsx
useEffect(() => () => doCleanup(), []);
```

这解析为「effect 回调返回一个清理函数」。是对的,但内层的双箭头属于没人会读第二遍的东西。[`useUnmount`](https://reactuse.com/effect/useunmount/) 是显式版本:

```tsx
import { useUnmount } from "@reactuses/core";

useUnmount(() => {
  socket.close();
  flushAnalytics();
});
```

这个 hook 内部用 ref 捕获最新的回调,所以你在卸载时拿到的是最新的值,而不是 mount 时的值。这修了普通 React 版本里一个隐蔽的 bug:如果你写 `useEffect(() => () => doCleanup(value), [])`,`value` 是 mount 时被捕获的,清理跑的是过期数据。`useUnmount` 没这个 bug。

## 5. useDeepCompareEffect — 当你的依赖是对象

React 用 `Object.is` 比较 effect 依赖。如果依赖是对象或数组,父组件每次重渲染都产生新引用,即使内容相同 effect 也会跑。大部分团队会去 `JSON.stringify` 依赖,这对浅数据有效,对带函数、Date 或不可序列化值的就崩了。

[`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 把 `Object.is` 换成结构化的深度相等检查:

```tsx
import { useDeepCompareEffect } from "@reactuses/core";

useDeepCompareEffect(() => {
  fetcher.run(query);
}, [query]); // query 是 { workspace: "a", filters: { ... } }
```

当父组件重渲染,生成一个内容相同的新 `query` 对象时,effect 不会重跑。当内容真的变了,它才跑。代价是深度相等检查是 O(n) 的——不是免费的。当你有个小对象依赖、又无法在源头 memo 它时,选这个。如果能 `useMemo`,优先 `useMemo`。

有一个坑:不要把 `useDeepCompareEffect` 用在只有原始值的依赖上。如果你传 `[someString, someNumber]`,hook 会抛错——对那种情况 `useEffect` 才是对的工具,而 hook 会大声失败,免得你悄悄拖慢一个本来不需要的 effect。

## 6. useCustomCompareEffect — 深比较,但按你的规则

有时候你想要的相等性既不是浅的也不是完全结构化的。两种情况经常出现:

- 按单个字段比较(比如 `prev.id === next.id`)。
- 用你已经依赖的库比较(比如 `lodash.isEqual`、`dequal`)。

[`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/) 接受第三个参数:一个比较器,决定新依赖是否应该触发 effect。

```tsx
import { useCustomCompareEffect } from "@reactuses/core";
import { dequal } from "dequal";

useCustomCompareEffect(
  () => loadDashboard(filters),
  [filters],
  (prev, next) => dequal(prev, next),
);
```

相比 `useDeepCompareEffect` 的好处是**你控制成本**。对 200 个字段的配置对象做深比较很慢;`(prev, next) => prev.version === next.version` 只比较一次。有 version 字段就用它。

这也是**模糊**相等的正确 hook——比如「两个滚动位置只要相差 5 像素以内就认为相等」。普通 `useEffect` 版本需要一个 wrapper ref 加一段 effect 内部的手写比较;custom-compare 版本把相等性逻辑跟依赖放在一起。

## 7. useOnceEffect — 跑且只跑一次,但依赖是响应式的

`useEffect(fn, [])` 在 mount 时跑一次,但回调闭包到的是那一刻依赖的值——通常是 `undefined` 或初始值。如果你真正想要的是**`user` 第一次非 loading 的值**触发 effect,那么 `useEffect(fn, [user])`(每次 `user` 变都跑)和 `useEffect(fn, [])`(mount 时跑而 `user` 还是 `null`)都不对。

[`useOnceEffect`](https://reactuse.com/effect/useonceeffect/) 在任一依赖第一次从初始值变化时跑 effect,然后再也不跑:

```tsx
import { useOnceEffect } from "@reactuses/core";

function PersonalisedGreeting() {
  const { user } = useAuth(); // user 在加载完成前是 null

  useOnceEffect(() => {
    track("personalised_greeting_seen", { userId: user.id });
  }, [user]);

  return user ? <h1>Hi, {user.name}!</h1> : null;
}
```

effect 触发一次——`user` 第一次变成非 null 时——之后即使 `user` 再变也不会再触发。这是首屏埋点、一次性 onboarding 触发、以及「等前置条件就绪后做这件事」模式的正确形状。普通 React 版本是 ref 加 flag 的舞蹈,谁都写过,谁也不想再读一遍。

`useOnceEffect` 也有 layout-effect 的兄弟,[`useOnceLayoutEffect`](https://reactuse.com/effect/useoncelayouteffect/),用于同样的模式但需要在 paint 前做 DOM 测量。

## 8. useIsomorphicLayoutEffect — 让 SSR 警告消失

`useLayoutEffect` 在 DOM 变更后、paint 前同步运行。它是读取布局(测元素尺寸)和在同一个 tick 内写 DOM(把 tooltip 定位到触发器旁边)的正确 hook。它也是会在 SSR 时打这条警告的 hook:

> useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format.

标准修法是在 `typeof window === "undefined"` 时把 `useLayoutEffect` 换成 `useEffect`。这就是 [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) 做的事:

```tsx
import { useIsomorphicLayoutEffect } from "@reactuses/core";

useIsomorphicLayoutEffect(() => {
  const { width } = ref.current!.getBoundingClientRect();
  setWidth(width);
}, []);
```

在服务端,这是 `useEffect`(SSR 期间是 no-op——没问题,因为根本没有可测的布局)。在客户端,这是 `useLayoutEffect`(同步触发,这正是你做布局读取时想要的)。一个 import,没警告,没特殊处理。

这是 React 生态里被复制最多的一段代码。如果你在 SSR 代码库(Next.js、Remix、Astro 带岛屿)里任何地方用了 `useLayoutEffect`,这个 hook 就该是默认选择。

## 9. useUpdateLayoutEffect — useUpdateEffect 的 layout 版本

`useUpdateEffect` 的 layout-effect 兄弟。同样的模式:跳过首次渲染,在之后每次依赖变化时跑,但在 layout-effect 时刻跑,所以 DOM 变更发生在 paint 之前。

[`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) 在 layout 驱动的动画里特别有用:

```tsx
import { useUpdateLayoutEffect } from "@reactuses/core";

useUpdateLayoutEffect(() => {
  const el = listRef.current;
  if (!el) return;
  el.style.transform = `translateY(${activeIndex * itemHeight}px)`;
}, [activeIndex]);
```

为什么不用 `useUpdateEffect`?因为 `useEffect` 在 paint 之后触发,滑动动画会肉眼可见地从旧位置出发然后才闪到新位置。`useLayoutEffect` 在 paint 之前跑,新 transform 在同一帧应用。为什么不用普通 `useLayoutEffect`?因为首次渲染时 `activeIndex` 是初始值,没有动画要开始。

「跳过 mount 的 layout effect」组合,正好是「动画一个变化,但不是初始值」的形状。也是「受控焦点」的形状:在 `activeTab` 变化时把焦点移到新 tab 内容上,但不要在组件第一次以 `activeTab="home"` 挂载时这样做。

## 何时用哪个:决策表

完整一组,集中放在一处:

| 情景                                                | 选用                          |
|-----------------------------------------------------|-------------------------------|
| 异步 effect 体,需要可取消                          | `useAsyncEffect`              |
| 跳过第一次,响应之后的每次变化                      | `useUpdateEffect`             |
| 同上,但用 layout effect                            | `useUpdateLayoutEffect`       |
| 挂载时跑一次(意图更清晰)                          | `useMount`                    |
| 卸载时跑一次(不会捕获过期值)                      | `useUnmount`                  |
| effect 依赖是对象,想要结构化相等                   | `useDeepCompareEffect`        |
| effect 依赖需要自定义相等检查                       | `useCustomCompareEffect`      |
| 只跑一次,但要等某个依赖「就绪」                    | `useOnceEffect`               |
| 同上,layout effect 版本                            | `useOnceLayoutEffect`         |
| SSR 时不会警告的 layout effect                      | `useIsomorphicLayoutEffect`   |

记住三条:

1. **默认还是 `useEffect`。** 专门 hook 是给上面这些情况用的;不要预防性地用。
2. **layout 配 layout,异步配异步。** 如果你在做 DOM 测量,选 layout-effect 家族。如果在做数据请求,选 `useAsyncEffect`。混着用会有闪烁或竞态。
3. **`useUpdateEffect` 不是「useEffect 的性能优化」。** 它改变行为,不是性能。第一次渲染仍然发生,你只是不在它上面跑 effect。如果你的目标是性能,看依赖数组,不是看 hook。

## 一个真实的组合

一个常见的 React 模式:一个「搜索结果」面板,在 query 变化时请求,在 mount 时跳过请求(父组件传了初始结果),并向屏幕阅读器宣布「搜索已更新」——但不在 mount 时宣布,因为标题已经传达了相同的信息。

```tsx
import {
  useAsyncEffect,
  useUpdateEffect,
  useIsomorphicLayoutEffect,
} from "@reactuses/core";

function SearchResults({ query, initialResults }: {
  query: string;
  initialResults: Result[];
}) {
  const [results, setResults] = useState(initialResults);
  const announceRef = useRef<HTMLDivElement>(null);

  // 跳过 mount;之后每次 query 变化都请求。
  useUpdateEffect(() => {
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setResults(data); });
    return () => { cancelled = true; };
  }, [query]);

  // Layout effect:读取结果数并在 paint 前更新 aria-live。
  // 跳过 mount,因为初始标题已经说过了。
  useIsomorphicLayoutEffect(() => {
    if (!announceRef.current) return;
    announceRef.current.textContent = `${results.length} 条 ${query} 的结果`;
  }, [results, query]);

  return (
    <>
      <div ref={announceRef} role="status" aria-live="polite" className="sr-only" />
      <ul>{results.map((r) => <li key={r.id}>{r.title}</li>)}</ul>
    </>
  );
}
```

三种行为,三个 hook,没有 ref 加 flag。如果第一个 `useUpdateEffect` 的 body 变复杂到想用 async/await,把它换成 `useAsyncEffect`;其余照旧。

## 上手试试

上面每个 hook 都有可运行的文档示例。读 demo,改依赖,看哪些会触发:

- [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/)
- [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)
- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/)
- [`useMount`](https://reactuse.com/effect/usemount/)
- [`useUnmount`](https://reactuse.com/effect/useunmount/)
- [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/)
- [`useCustomCompareEffect`](https://reactuse.com/effect/usecustomcompareeffect/)
- [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/)
- [`useOnceLayoutEffect`](https://reactuse.com/effect/useoncelayouteffect/)
- [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/)

用 `npm install @reactuses/core`(或 `pnpm add @reactuses/core`)安装,直接 import。没有 provider,除了 React 16.8+ 之外没有 peer dependency。完整的 hook 列表和源代码在 [reactuse.com](https://reactuse.com)。

`useEffect` 是个原语。这些 hook 是你在它之上一次性建好、不再每个项目重新发明的那一层语言。
