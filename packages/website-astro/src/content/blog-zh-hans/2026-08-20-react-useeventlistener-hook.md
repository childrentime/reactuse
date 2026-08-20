---
title: "React useEventListener Hook：类型安全的 DOM 事件监听 (2026)"
description: "useEventListener 实用指南：为什么手写的 useEffect + addEventListener 要么每次渲染都重新订阅、要么读到过期的 state，useEventListener 如何做到每个目标只挂载一次，四种指定目标的写法（window、document、ref、任意 EventTarget），每种写法下 TypeScript 到底推断出什么，passive 监听与不会触发重挂的 options，以及 ref 重新挂载和 SSR 两个坑。TypeScript 优先，SSR 安全。"
slug: react-useeventlistener-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-20
tags: [react, hooks, dom, typescript, tutorial]
keywords: [react useeventlistener, useeventlistener, useeventlistener react, useEventListener hook, react addeventlistener hook, react useeffect addeventlistener, react 事件监听 清理, react 监听 keydown, react 监听 window resize, react addeventlistener typescript, react 卸载时移除事件监听, react passive 事件监听, useeventlistener typescript, react document 事件监听 hook, react esc 关闭弹窗 hook]
image: /img/og.png
---

# React useEventListener Hook：类型安全的 DOM 事件监听 (2026)

这是一个「按 Esc 关闭弹窗」，它悄悄地做错了事：

```tsx
function Modal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return <div role="dialog">…</div>;
}
```

如果父组件传的是内联的 `onClose={() => setOpen(false)}`——而它几乎总是——那么 `onClose` 每次渲染都是一个新函数，于是这个 effect 会在父组件*每一次渲染*时都把监听拆掉再重新挂上。把 `onClose` 从依赖里删掉来止住这种抖动，你就换来了另一个 bug：监听器从此永远持有第一次渲染的 `onClose`，关闭弹窗调用的是一个过期闭包。

这一局靠依赖数组是赢不了的，因为你想要的两件事直接冲突：**只订阅一次**，但**永远执行最新的处理器**。解法是把两者拆开——用一个稳定的身份去注册监听，再通过一个始终保持最新的 ref 去调用。[`useEventListener`](https://reactuse.com/effect/useeventlistener/)（来自 [`@reactuses/core`](https://reactuse.com)）就是把这个拆分封装好了。这篇文章讲它底层到底做了什么、指定目标的四种写法、每种写法下 TypeScript 究竟推断出什么（这部分会让不少人意外）、哪些 options 不会触发重挂，以及上线前值得知道的两个坑。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useEventListener } from "@reactuses/core";

function Modal({ onClose }: { onClose: () => void }) {
  useEventListener("keydown", (e) => {
    if (e.key === "Escape") onClose();
  });

  return <div role="dialog">…</div>;
}
```

修复就这些。没有依赖数组，父组件不用 `useCallback`，也没有需要你记着写的清理。监听在组件挂载时被加到 `window` 上一次，卸载时移除；你传进去的箭头函数每次渲染都会重新创建，但这无所谓，因为监听器从不重新注册——它调用的永远是最新那个。`e` 是 `KeyboardEvent`，推断出来的，不用手写注解。

签名是四个参数，其中三个可选：

```tsx
useEventListener(eventName, handler, target?, options?);
```

`target` 默认是 `window`。`options` 就是你平时传给 `addEventListener` 的那个 `boolean | AddEventListenerOptions`。

## 它到底做了什么

实现短到可以整段读完，而且值得读，因为每一行都在回答上面的某个问题：

```tsx
function useEventListener(eventName, handler, element, options = {}) {
  const savedHandler = useLatest(handler);
  const { key: elementKey, ref: elementRef } = useStableTarget(element, defaultWindow);

  useDeepCompareEffect(() => {
    const targetElement = getTargetElement(elementRef.current, defaultWindow);
    if (!(targetElement && targetElement.addEventListener)) return;

    const eventListener = (event) => savedHandler.current(event);
    on(targetElement, eventName, eventListener, options);

    return () => off(targetElement, eventName, eventListener);
  }, [eventName, elementKey, options]);
}
```

这里塞进了四个决策：

**处理器放在 ref 里，不放在依赖里。** [`useLatest`](https://reactuse.com/state/uselatest/) 让 `savedHandler.current` 在每次提交渲染后都指向最新的处理器，而真正注册到 DOM 上的是一个转发给它的薄包装。所以你传的处理器每次渲染都可以是全新的闭包——内联箭头函数不只是被允许，它就是预期的用法——而 `addEventListener` 只会被调用一次。这就是「订阅一次、执行最新」的拆分，也是 `handler` 被刻意排除在依赖列表之外的原因。

**依赖列表是深比较的。** 这个 effect 是 [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 而不是 `useEffect`，所以每次渲染新建但内容相同的 `options` 对象不算变化。直接内联写 `useEventListener("scroll", onScroll, ref, { passive: true })` 完全没问题：渲染三次，`addEventListener` 只调用一次。把内容改成 `{ passive: false }` 它才会重新注册，这正是你想要的。

**目标是在 effect 内部、也就是 commit 阶段解析的。** `getTargetElement` 在 effect 体里执行而不是在渲染期间，所以 ref 类型的目标此时已经被 React 填好了——渲染期间 `ref.current` 还是 `null`，只有到 commit 阶段才是真实节点。这就是「监听挂上了」和「悄无声息什么都没发生」之间的差别。

**在服务端它是空函数。** 导出的是 `isBrowser ? implementation : noop`，所以 SSR 期间不会碰 `window`，你也不用自己写 `typeof window === "undefined"` 的守卫。监听会在 hydration 之后、在 effect 里挂上，和其他浏览器订阅一样。

## 指定目标的四种写法

`target` 接受四种形态，选对它基本就是这个 API 的全部：

```tsx
// 1. 省略 → window
useEventListener("resize", () => setWidth(window.innerWidth));

// 2. 返回元素的函数 → document，或任何需要延迟查找的东西
useEventListener("visibilitychange", () => setActive(!document.hidden), () => document);

// 3. 一个 ref
const boxRef = useRef<HTMLDivElement>(null);
useEventListener("wheel", (e: WheelEvent) => e.preventDefault(), boxRef, { passive: false });

// 4. 任何你手上已有的 EventTarget
useEventListener("message", (e: MessageEvent) => handle(e.data), worker);
```

第 2 种存在的理由是：服务端在模块求值阶段拿不到 `document`；而且直接把临时查到的元素传进去，会带来「每次渲染身份都变」的问题。包装函数在 commit 阶段被解析，effect 依赖的是它的*返回结果*，所以 `() => document` 在关键意义上是稳定的。

第 4 种是大家最容易忘的：`EventTarget` 不只是 DOM 元素。`Worker`、`WebSocket`、`EventSource`、`MediaQueryList`、`window.visualViewport`、`BroadcastChannel`、一个 `<audio>` 元素、`navigator.serviceWorker`，甚至 `AbortSignal`——全都是事件目标，全都能用这个 hook，并且自动清理。（常见的那几个，库里已经有专门的 hook：[`useEventSource`](https://reactuse.com/browser/useeventsource/)、[`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/)、[`useMediaQuery`](https://reactuse.com/browser/usemediaquery/)、[`useNetwork`](https://reactuse.com/browser/usenetwork/)。）

## TypeScript 到底推断出什么

这部分值得说精确，因为这个 hook 带了六个重载，而它们给你的东西并不一样。以下结论是对着当前类型定义验证过的：

| 目标写法 | `e` 被推断为 |
| --- | --- |
| 省略（`window`） | 精确的 `WindowEventMap` 类型——`"keydown"` → `KeyboardEvent` ✅ |
| 裸 `HTMLElement` / `Element` / `Document` | 精确的事件类型——`"click"` → `MouseEvent` ✅ |
| **ref 对象** | `any` ⚠️ |
| **函数**目标（`() => document`） | `any` ⚠️ |

后两种会落到通用重载上，那个重载把处理器标成 `(...p: any) => void`。不会报错——但你恰好在 ref 最常用的地方丢掉了补全和类型检查。修法是加一个注解，没有任何代价：

```tsx
// ⚠️ e 是 any
useEventListener("click", (e) => console.log(e.clientX), buttonRef);

// ✅ e 是 MouseEvent，有类型检查
useEventListener("click", (e: MouseEvent) => console.log(e.clientX), buttonRef);
```

同一片区域还有两个相关的锋利边缘。第一，`e` 是**原生** DOM 事件，不是 React 的 `SyntheticEvent`——`e.target` 没有类型，`e.currentTarget` 是 `EventTarget | null`，也不存在事件池的问题。第二，只有当目标命中那几个有类型的重载时，事件*名称*才受约束；用 ref 或函数目标时名称就是普通 `string`，所以像 `"keydwon"` 这样的拼写错误能顺利编译，然后挂上一个永远不会触发的监听。如果某个监听看起来是死的，先查拼写，再查别的。

## 几种模式

### 键盘快捷键

`window` 监听的典型场景。一个快捷键一个 hook，或者一个处理器里 switch，都行——因为它们都不会重新注册：

```tsx
function useShortcut(combo: (e: KeyboardEvent) => boolean, run: () => void) {
  useEventListener("keydown", (e) => {
    if (combo(e)) {
      e.preventDefault();
      run();
    }
  });
}

function CommandBar() {
  const [open, setOpen] = useState(false);
  useShortcut((e) => (e.metaKey || e.ctrlKey) && e.key === "k", () => setOpen(true));
  useShortcut((e) => e.key === "Escape", () => setOpen(false));
  // …
}
```

注意这里的组合方式：`useEventListener` 很适合作为你*自己*的 hook 的基础原语；而且因为处理器是用 ref 持有的，`run` 和 `combo` 可以是闭包在最新 state 上的内联函数，不需要任何 memo 化的仪式。如果你只需要修饰键本身，[`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/) 已经在跟踪它们了。

### 非 passive 的 wheel 与 touch 监听

这是 JSX 属性真的做不到的场景。React 把 `onWheel`、`onTouchStart` 作为 passive 监听挂在根节点上，所以在里面调用 `e.preventDefault()` 会打出一条 console 警告，然后什么也不做。要真正拦住滚动或缩放，你需要在元素上注册一个 `{ passive: false }` 的真实监听：

```tsx
function ZoomCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEventListener(
    "wheel",
    (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault(); // 有效——这个监听是真正的非 passive
      setZoom((z) => clamp(z * (1 - e.deltaY / 500), 0.5, 4));
    },
    canvasRef,
    { passive: false },
  );

  return <div ref={canvasRef} style={{ transform: `scale(${zoom})` }} />;
}
```

反过来同样有用：给高频的 `scroll` 或 `touchmove` 监听标上 `{ passive: true }`，让浏览器知道它滚动前不必等你的处理器。

### React 没有提供 props 的 window / document 事件

`resize`、`online`/`offline`、`visibilitychange`、`beforeunload`、`hashchange`、`storage`、document 级别的 `paste`——这些都没有 JSX 对应物，而且每个都只要一行：

```tsx
function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEventListener("online", () => setOnline(true));
  useEventListener("offline", () => setOnline(false));
  return online;
}
```

在动手写之前，先看看库里是不是已经有了——[`useWindowSize`](https://reactuse.com/element/usewindowsize/)、[`useOnline`](https://reactuse.com/browser/useonline/)、[`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/)、[`usePageLeave`](https://reactuse.com/browser/usepageleave/)、[`useTextSelection`](https://reactuse.com/state/usetextselection/) 全都是这个 hook 的薄封装，只是状态管理已经替你做好了。

### 给高频事件限流

`scroll`、`mousemove`、`resize`、`pointermove` 的触发频率远高于你想重新渲染的频率。要包的是处理器，不是监听：

```tsx
function ScrollSpy() {
  const [y, setY] = useState(0);
  const onScroll = useThrottleFn(() => setY(window.scrollY), 100);
  useEventListener("scroll", onScroll);
  return <progress value={y} max={document.body.scrollHeight} />;
}
```

「最多每 N 毫秒一次」用 [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/)，「等用户停下来再执行」用 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)。两者身份都稳定，所以监听依然只注册一次。如果你要的就是滚动位置，[`useScroll`](https://reactuse.com/browser/usescroll/) 和 [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/) 已经把这件事做对了。

## 值得知道的坑

- **ref 目标依赖的是 ref 本身，不是 `ref.current`。** effect 的依赖项是那个 ref *对象*，它在组件生命周期内是稳定的。所以当 ref 背后的 DOM 节点被换掉时——某个条件分支挂载了一个真正不同的元素、`key` 变了、列表重排——监听会留在那个已经脱离文档的旧节点上，不会跟过去。元素类型和位置匹配时 React 通常会复用同一个 DOM 节点，所以这个坑很少踩到，但一旦踩到就很难想明白。修法是把*节点*本身变成依赖：用 callback ref 把它存进 state。

  ```tsx
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEventListener("click", (e: MouseEvent) => handle(e), node);
  return show ? <button ref={setNode}>A</button> : <span ref={setNode}>B</span>;
  ```

  这样节点变化时目标身份也跟着变，监听就会重新注册到新元素上。

- **监听是在绘制之后挂上的，不是在渲染期间。** 它是个 effect，所以从首次绘制到 effect 执行之间有一个窗口——通常是一帧——监听还不存在。对用户驱动的事件无所谓（没人按键有那么快），但这意味着你没法用它去捕获挂载期间就触发的事件。如果某个元素从第一帧起就必须带上监听，那是 layout effect 和 JSX 属性该管的事。

- **直接传 `document` 或元素没问题——除非它是条件性的。** `useEventListener("click", h, someState ? elA : elB)` 会在元素变化时重新注册，这是对的。但 `useEventListener("click", h, document.getElementById("x"))` 会在每次渲染时做一次 DOM 查询，并且在服务端返回 `null`；这种情况用函数形式 `() => document.getElementById("x")`。

- **它不返回 `off()` 句柄。** 和 VueUse 的版本不同，这里没有手动停止函数——生命周期就是组件的生命周期。如果你需要按需启停监听，在处理器内部用一个 ref 或一段 state 来做闸门（`if (!enabledRef.current) return`），这比反复重新注册还便宜。

- **一个 hook 只管一个事件。** 没有数组形式。写成 `useEventListener("mousedown", h)` 和 `useEventListener("touchstart", h)` 两次调用就是惯用法——hook 很便宜，而且这让依赖比较保持简单。

- **它天生 SSR 安全，所以别再加守卫。** 不需要 `typeof window` 判断，不需要包一层 `useEffect`，不需要动态 import。在服务端它什么都不做。

## 什么时候别用它

`useEventListener` 是个原语。如果已经有为某件事专门写的 hook，它会替你处理状态、边界情况和清理，而这些你自己重写一遍多半会漏：

- **判断点击落在元素外部** → [`useClickOutside`](https://reactuse.com/element/useclickoutside/) 或 [`useClickAway`](https://reactuse.com/element/useclickaway/)（它们处理了「mousedown 在内部、mouseup 在外部」这种你自己写容易搞错的情况）。
- **悬停、长按、双击、拖拽** → [`useHover`](https://reactuse.com/state/usehover/)、[`useLongPress`](https://reactuse.com/browser/uselongpress/)、[`useDoubleClick`](https://reactuse.com/element/usedoubleclick/)、[`useDraggable`](https://reactuse.com/element/usedraggable/)。
- **元素尺寸或可见性** → [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/)、[`useElementSize`](https://reactuse.com/element/useelementsize/)、[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/)。这些是观察器，不是事件；挂在 `window` 上的 `resize` 监听没法告诉你某个元素的尺寸变了。
- **事件本身有 JSX 属性，而且目标就是你自己的元素** → 直接用 `onClick`。React 的委托处理器更便宜，也更就近。只有当你需要 `window`/`document`、需要非 passive 监听、或者 React 没暴露这个事件时，才动用真实监听。
- **你其实只是想要一个稳定的函数身份** → 那是 [`useEvent`](https://reactuse.com/effect/useevent/)，跟监听没关系。

## 要点回顾

- `useEffect` + `addEventListener` 这对组合逼你做一个假选择：把处理器放进依赖、每次渲染都重新订阅，或者不放进去、然后调用过期闭包。
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) 的解法是注册一个稳定的包装函数，再转发给一个 [`useLatest`](https://reactuse.com/state/uselatest/) ref，于是内联箭头处理器是免费的，`addEventListener` 每个目标只调用一次。
- options 是深比较的，所以内联的 `{ passive: true }` 不会触发重挂；目标在 commit 阶段解析，所以 ref 能正常工作；整个 hook 在 SSR 期间是空操作。
- `window` 和裸元素目标下 TypeScript 能推断出精确的事件类型，ref 和函数目标会退化成 `any`——那两种情况给处理器参数加个注解，并且当心事件名拼写错误，那些重载不会帮你抓。
- 把它当作构建你自己 hook 的原语。如果你要监听的东西已经有专门的 hook，就用那个。

`useEventListener`、`useLatest`、`useClickOutside`，以及另外 110+ 个 SSR 安全、TypeScript 优先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 里——装一次，可 tree-shake，没有需要照看的依赖。

```bash
npm install @reactuses/core
```
