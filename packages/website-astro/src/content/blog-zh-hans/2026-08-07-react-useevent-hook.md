---
title: "React useEvent Hook：告别过期闭包的稳定回调 (2026)"
description: "useEvent 实用指南：一个引用永不变化、但总能读到最新 state 和 props 的回调 Hook。涵盖过期闭包问题、useEvent 与 useCallback 及 React 19.2 useEffectEvent 的区别、内部的 layout effect 技巧，以及什么时候不该用它。TypeScript 优先，SSR 安全。"
slug: react-useevent-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-07
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useEvent, useevent, useEvent hook, useEffectEvent, useCallback 过期闭包, react 稳定回调, react 函数引用稳定, react 事件处理 hook, useevent react, useCallback 替代方案, react memo 回调 prop, react 闭包陷阱]
image: /img/og.png
---

# React useEvent Hook：告别过期闭包的稳定回调 (2026)

每个 React 开发者迟早都会走到同一个岔路口。你写了一个读取 state 的事件处理函数，把它传给子组件或 effect，然后必须二选一：要么保持内联函数原样，看着每次渲染都产生一个新引用——`React.memo` 失效、effect 反复执行、监听器反复重新订阅；要么用 `useCallback` 包起来，开始玩依赖数组打地鼠——漏掉一个依赖，处理函数看到的就是三次渲染之前的 state。

第二种失败模式有个名字——**过期闭包（stale closure）**——它大概是生产代码里最常见的 React bug。解决方案也有个名字：`useEvent`，源自 [2022 年的官方 React RFC](https://github.com/reactjs/rfcs/blob/main/text/0000-useevent.md)，今天可以直接用 [`@reactuses/core`](https://reactuse.com) 里的 [`useEvent`](https://reactuse.com/effect/useevent/)。它给你一个**引用在渲染之间永不变化**、但函数体**总能读到最新 state 和 props** 的函数。岔路口的两边，全都要。

本文涵盖它的 API、让这一切成立的三行实现技巧、与 `useCallback` 及 React 19.2 内置 `useEffectEvent` 的对比、真实使用模式，以及必须遵守的一条规则（不要在渲染期间调用它）。TypeScript 优先。

<!-- truncate -->

## 三十秒看懂问题

这就是 bug 制造机。一个聊天组件定时把当前草稿文本发送心跳：

```tsx
function Composer({ roomId }: { roomId: string }) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      sendHeartbeat(roomId, draft); // ⚠️ 哪个 draft？
    }, 3000);
    return () => clearInterval(id);
  }, [roomId]); // 故意省略 draft——我们不想重置定时器

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

interval 闭包捕获的是 effect 运行时的那个 `draft`——空字符串。此后每次心跳发的都是 `''`。把 `draft` 加进依赖数组，闭包倒是新鲜了，但定时器会在**每次按键**时销毁重建。`useCallback` 帮不上忙：它有一模一样的依赖数组，所以逼你做一模一样的选择——要么值过期，要么引用不停变。

你真正想要的，是一个在组件生命周期内*始终是同一个东西*、但触发时*读到当前值*的函数。这就是 `useEvent`：

```tsx
import { useEvent } from '@reactuses/core';

function Composer({ roomId }: { roomId: string }) {
  const [draft, setDraft] = useState('');

  const beat = useEvent(() => {
    sendHeartbeat(roomId, draft); // ✅ 永远是最新的 draft 和 roomId
  });

  useEffect(() => {
    const id = setInterval(beat, 3000);
    return () => clearInterval(id);
  }, [beat]); // beat 永不变化——effect 只运行一次

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

`beat` 在每次渲染中引用完全相同，所以 effect 只运行一次，定时器在打字过程中稳如泰山。当它触发时，通过最新一次渲染的闭包读取 `draft`。依赖数组甚至是诚实的——`beat` 列在里面，只是它恰好稳定。

## 完整 API

几乎没有学习成本：

```ts
const stableFn = useEvent(fn);
```

- **`fn`** —— 任意函数。参数和返回值原样透传，`this` 也一样。
- **`stableFn`** —— TypeScript 类型与 `fn` 完全相同，但引用在组件生命周期内固定不变。

类型是精确的，不是 `(...args: any[]) => any`：

```tsx
const format = useEvent((n: number, unit: string) => `${n}${unit}`);
format(3, 'px');   // ✅ string
format('3', 'px'); // ❌ 类型错误
```

开发环境下，如果传入的不是函数，会在控制台打印 `useEvent expected parameter is a function, got …`，而不是悄悄失败。

## 内部实现原理

整个实现短到一杯咖啡就能读完，而且每一行都有它的道理：

```ts
export const useEvent = <T extends Fn>(fn: T) => {
  const handlerRef = useRef(fn);

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = fn;
  }, [fn]);

  return useCallback((...args) => {
    const fn = handlerRef.current;
    return fn(...args);
  }, []) as T;
};
```

三个值得注意的细节：

1. **用 ref 携带最新闭包。** 每次渲染都产生一个捕获最新 state 的新 `fn`；effect 把它存进 `handlerRef`。返回的包装函数——用空依赖数组只 memoize 一次——在*调用时*而非渲染时读取 `handlerRef.current`。外壳稳定，内核新鲜。

2. **ref 在 layout effect 里更新，而不是普通 effect。** [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) 在 DOM 变更后同步执行，早于浏览器绘制、也早于被动的 `useEffect` 回调。如果 ref 在普通 `useEffect` 里更新，这个间隙中触发的任何事件——或同一次 commit 中更早运行的其他 effect——调用包装函数时就会命中上一次渲染的闭包。layout 时机堵上了这个窗口。

3. **Isomorphic 意味着 SSR 安全。** 服务端使用 `useLayoutEffect` 会打印 hydration 警告；`useIsomorphicLayoutEffect` 在 SSR 时换成 `useEffect`，浏览器里再换回真家伙。没有警告，你的代码也不用做特殊处理。

如果这个 ref 持有技巧看着眼熟，那是因为它和 [`useLatest`](https://reactuse.com/state/uselatest/) 是同一个思路——`useEvent` 本质上就是 `useLatest` 加一个稳定的可调用外壳。想在某个现有回调里*读取*最新值时用 `useLatest`；当回调本身就是你要到处传递的东西时用 `useEvent`。

## useEvent vs useCallback

它们解决的是不同的问题，对比一下两者都更清楚：

| | `useCallback` | [`useEvent`](https://reactuse.com/effect/useevent/) |
|---|---|---|
| **引用** | 依赖变化就变 | **永不变化** |
| **闭包新鲜度** | 取决于依赖数组写得对不对 | **总是最新**——调用时才读取 |
| **依赖数组** | 必需；bug 的温床 | 无 |
| **渲染期间可调用？** | ✅ 可以 | ❌ 不行——仅限事件/effect 时机 |
| **适合** | *渲染期间*计算的值（memoized selector、render prop） | *事后触发*的处理函数（事件、定时器、订阅） |

「渲染期间」这一行是真正的分界线。`useCallback` 的结果是个普通值——你可以在渲染时调用它来计算 JSX。`useEvent` 的包装函数读取的 ref 只保证在 commit *之后*是最新的，渲染期间调用可能观察到上一次渲染的 state（也违反了 RFC 谨慎设计的并发渲染契约）。经验法则不言自明：**如果函数是响应某件事而触发的——点击、定时、消息——用 `useEvent`；如果它在渲染期间计算东西——用 `useCallback`。**

## useEvent vs React 官方的 useEffectEvent

2022 年的 RFC 最终被取代：React 把这个想法以 [`useEffectEvent`](https://react.dev/reference/react/useEffectEvent) 的形式发布，自 React 19.2 起稳定。如果你在 19.2+ 上，应该了解两者的关系：

- **`useEffectEvent` 刻意收窄了范围。** 返回的函数只能在 *effect 内部*调用（ESLint 规则强制执行），也不能传给其他组件或 Hook。React 团队把它限定在他们认为万无一失的那一种模式：在 effect 里读最新值而不重新触发 effect。
- **`useEvent` 覆盖更宽的场景。** 把稳定的处理函数传给 memoized 子组件、命令式组件、WebSocket 封装或第三方 SDK——这些 `useEffectEvent` 的 linter 全都会拒绝——恰恰是用户态 `useEvent` 的用武之地。代价是更宽的场景包含了上面那个渲染期调用的坑，纪律从 linter 转移到了*你*身上。
- **两者可以共存。** React 19.2+ 上 effect 内部用 `useEffectEvent`，跨组件边界的稳定引用用 `useEvent`；19.2 以下则全部用 `useEvent`——那里根本没有 `useEffectEvent`。

## 使用模式

### 不破坏 React.memo 的处理函数 prop

经典的列表行场景——memoized 的行组件照样重渲染，因为父组件每次渲染都重新创建 `onSelect`：

```tsx
const Row = React.memo(function Row({ item, onSelect }: RowProps) {
  return (
    <li onClick={() => onSelect(item.id)} className="row">
      {item.label}
    </li>
  );
});

function List({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = useEvent((id: string) => {
    // 读到最新的 selected，没有依赖数组要维护
    setSelected(selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id]);
  });

  return (
    <ul>
      {items.map(item => (
        <Row key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </ul>
  );
}
```

`handleSelect` 每次渲染都是同一个引用，`React.memo` 才真正 memo 得起来。换 `useCallback` 的话，你要么把 `selected` 列进依赖（引用变来变去，memo 白费），要么到处用函数式更新（这里还行，一旦处理函数要读两份 state 就没辙了）。

### 永不重新订阅的订阅

WebSocket、`EventSource`、SDK——任何仅仅因为闭包过期就要拆掉连接重建的地方，都很难堪：

```tsx
function usePriceFeed(symbol: string, threshold: number) {
  const [price, setPrice] = useState(0);

  const onMessage = useEvent((e: MessageEvent) => {
    const next = JSON.parse(e.data).price as number;
    setPrice(next);
    if (next > threshold) notify(symbol, next); // 永远是最新的 threshold
  });

  useEffect(() => {
    const ws = new WebSocket(`wss://feed.example.com/${symbol}`);
    ws.addEventListener('message', onMessage);
    return () => ws.close();
  }, [symbol, onMessage]); // 只有 symbol 变化才重连

  return price;
}
```

socket 在 `symbol` 变化时重连——这是正当理由——而 `threshold` 变化时绝不重连。注意：对于普通 DOM 目标，[`useEventListener`](https://reactuse.com/effect/useeventlistener/) 内部已经做了这件事（它用 `useLatest` 包住你的 handler），所以只有当订阅管道由*你自己*掌管时才需要 `useEvent`。

### 定时器——或者直接用库里现成的

上面的心跳例子太常见了，`@reactuses/core` 直接内置了解法：[`useInterval`](https://reactuse.com/effect/useinterval/) 让回调保持新鲜而不重启定时器——它自己的实现就构建在 `useEvent` 和 `useLatest` 之上。[`useTimeout`](https://reactuse.com/effect/usetimeout/)、[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)、[`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 也是同样的故事：过期闭包防护是内置的，所以在自己动手接 `useEvent` 之前，先看看你要造的 Hook 是不是已经存在了。

### 传给命令式组件的稳定回调

图表库、地图 SDK、编辑器通常在构造时接收处理函数：

```tsx
function Editor({ docId }: { docId: string }) {
  const [dirty, setDirty] = useState(false);

  const handleSave = useEvent((content: string) => {
    saveDocument(docId, content); // 最新的 docId
    setDirty(false);
  });

  useEffect(() => {
    const editor = createEditor('#mount', { onSave: handleSave });
    return () => editor.destroy();
  }, [handleSave]); // 稳定 → 编辑器只创建一次

  return <div id="mount" data-dirty={dirty} />;
}
```

仅仅因为 `docId` 在闭包里换了个引用就重建一个重量级编辑器——这正是 `useEvent` 要消灭的浪费。

## 两条规则

只有两条，都是 ref 更新时机的直接推论：

1. **不要在渲染期间调用返回的函数。** 它属于事件处理、effect、定时器、回调——commit 之后才触发的东西。渲染期间，ref 可能还指向上一次的闭包。
2. **不要用它对 effect 撒谎。** 如果一个 effect 确实*应该*在某个值变化时重新运行（比如筛选条件变化时重新请求数据），用 `useEvent` 包住逻辑来让 linter 闭嘴，等于埋掉了一个真实依赖。`useEvent` 是「读最新值、不重新触发」；它不是依赖数组的万能静音键。

## 要点回顾

- **[`useEvent`](https://reactuse.com/effect/useevent/) 返回一个引用永久不变、闭包永远新鲜的函数**——正是 `useCallback` 逼你二选一的那两样东西。
- **技巧是一个在 layout effect 里更新的 ref**，加一个只 memoize 一次、调用时才读 ref 的包装函数。[`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/) 保证 SSR 安全。
- **渲染期间的值用 `useCallback`，事后触发的处理函数用 `useEvent`。** 永远不要在渲染期间调用 `useEvent` 的函数。
- **React 19.2+ 上，`useEffectEvent` 覆盖 effect 内部的场景**且有 linter 保驾；跨组件、跨库边界传递的稳定处理函数则交给 `useEvent`。
- **先查库里有没有现成的**——[`useEventListener`](https://reactuse.com/effect/useeventlistener/)、[`useInterval`](https://reactuse.com/effect/useinterval/)、[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 等等都已内置过期闭包防护。

从 [`@reactuses/core`](https://reactuse.com/effect/useevent/) 获取它，退出依赖数组打地鼠游戏。
