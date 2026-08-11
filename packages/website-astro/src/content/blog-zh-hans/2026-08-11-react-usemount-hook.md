---
title: "React useMount Hook：只在挂载时执行一次的正确姿势 (2026)"
description: "useMount 实用指南：在组件出现时精确执行一次代码，不再手写空依赖数组。涵盖 useMount 的真实实现、StrictMode 双重执行陷阱与 useOnceEffect 的解法、useUnmount 的过期闭包坑、挂载时的异步操作，以及什么时候还是该用普通 useEffect。TypeScript 优先，SSR 安全。"
slug: react-usemount-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-11
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react usemount, usemount, useMount hook, usemount react, componentDidMount hook, useEffect 只执行一次, useEffect 空依赖数组, react 挂载时执行, useEffect 执行两次, react strict mode 双重渲染, useUnmount, react 挂载 hook, react 生命周期 hooks]
image: /img/og.png
---

# React useMount Hook：只在挂载时执行一次的正确姿势 (2026)

"组件出现时，把这段代码跑一次。"这是 React 里最常见的 effect 需求——聚焦输入框、上报埋点、建立连接、读取浏览器 API。所有人的第一反应都是空依赖数组的 `useEffect`：

```tsx
useEffect(() => {
  trackPageView("/checkout");
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

能用，但代价不小：一个必须记得写的空数组（忘了写，effect 就*每次*渲染都跑）；只要 effect 里碰了任何外部值，就得加一行 lint 抑制注释；最糟的是——**意图完全没有表达出来**。`useEffect(fn, [])` 只说了*怎么做*，从没说*为什么*。半年后，同事为了"修掉 lint 警告"往数组里加了个依赖，你的"只跑一次"就悄悄变成了"每次变化都跑"。

[`@reactuses/core`](https://reactuse.com) 里的 [`useMount`](https://reactuse.com/effect/usemount/) 就是给这个惯用法起了名字：`useMount(fn)` 在每次挂载时精确执行一次 `fn`，而这个名字本身就是文档。本文会讲清楚它编译后到底是什么、React 18+ StrictMode 让所有人第一次都懵掉的双重执行、手写卸载清理里大多数人没意识到的过期闭包 bug（以及 [`useUnmount`](https://reactuse.com/effect/useunmount/) 怎么绕开它）、挂载时的异步操作，以及同样重要的——哪些场景*不该*用它。

<!-- truncate -->

## 快速开始

```bash
npm install @reactuses/core
```

```tsx
import { useMount, useUnmount } from "@reactuses/core";
import { useRef } from "react";

function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  useMount(() => {
    inputRef.current?.focus();
  });

  useUnmount(() => {
    console.log("搜索框已移除");
  });

  return <input ref={inputRef} placeholder="搜索…" />;
}
```

没有依赖数组，没有 lint 注释，读代码的人不用看函数体就知道意图：挂载时执行，仅此而已。

## useMount 到底是什么

没有任何魔法——刨去一段仅开发环境的类型检查，这就是完整实现：

```tsx
export const useMount = (fn: () => void) => {
  useEffect(() => {
    fn?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
```

就这样：一个空依赖数组的 `useEffect`，封装一次，*你*从此不用再写数组和抑制注释。从这五行定义能推出三件事：

1. **时机就是 `useEffect` 的时机。** 回调在组件提交到 DOM 之后触发——首帧绘制之后，浏览器 API 已就绪。它不是 `useLayoutEffect`；如果你需要在绘制前测量并修改，请用 layout effect。
2. **天生 SSR 安全。** effect 在服务端根本不会执行，所以 `useMount` 是 SSR 应用里访问 `window`/`document` 的天然归宿——和手写 `useEffect(fn, [])` 同样的保证，但意图写在了名字里。
3. **返回值会被忽略。** `useMount` 调用 `fn?.()` 后丢弃结果——它**不会**把返回的函数转交给 React 作为清理函数。清理属于 `useUnmount`（见下文）。这个设计还有个副产品：传 `async` 函数是安全的，这一点裸的 `useEffect` 可做不到（稍后细说）。

有一个推论需要刻进脑子里：因为依赖数组是空的，回调闭包捕获的是**首次渲染的值**。在 `useMount` 里读到的 props 和 state 被冻结在初始值。对挂载 effect 来说这几乎总是你想要的——但如果你发现自己想在里面读到最新值，那就是信号：你真正需要的是带依赖的 `useEffect`，或者一个 [`useLatest`](https://reactuse.com/state/uselatest/) ref。

## StrictMode 陷阱："为什么我的挂载 effect 跑了两次？"

搜"useEffect 执行两次"，你会看到十年的困惑。短版本是：从 React 18 起，**开发环境**下的 `<StrictMode>` 会故意把每个组件挂载、卸载、再挂载一遍。任何挂载 effect——`useEffect(fn, [])` 也好、`useMount` 也好——在开发环境都会跑两次。生产环境只跑一次。

React 是故意的，为的是暴露那些不会自我清理的 effect。官方建议是：别对抗双重执行，把 effect 写成**幂等**的——跑两次应该无害，因为清理函数会撤销第一次的效果：

```tsx
useMount(() => {
  const controller = new AbortController();
  fetch("/api/config", { signal: controller.signal }).then(applyConfig);
  // 配合 useUnmount(() => controller.abort())
});
```

但有些 effect *确实*只该发生一次，跑两次是真 bug 而不是卫生警告：埋点上报发了两次、欢迎 toast 弹了两次、支付意向在开发环境创建了两次然后 QA 提了工单。针对这些场景，`@reactuses/core` 提供了 [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/)：

```tsx
import { useOnceEffect } from "@reactuses/core";

useOnceEffect(() => {
  trackPageView("/checkout"); // 只触发一次，StrictMode 下也是
});
```

内部的技巧很精巧：`useOnceEffect` 在执行前把每个 effect 函数记录进一个 `WeakSet`。StrictMode 的重挂载复用的是*同一次渲染*产生的*同一个* effect 函数实例，第二次调用发现已被记录，直接跳过。而真正的重新挂载（组件真的离开又回来）会产生新的函数，照常执行——恰好就是"每次挂载一次、无视 StrictMode 彩排"的语义。

经验法则：**默认 `useMount` + 幂等；当双重触发会被用户或后端观察到时，用 `useOnceEffect`。**

## useUnmount——以及它避开的过期闭包坑

最直觉的手写卸载清理，藏着一个大多数人上线了都没发现的 bug：

```tsx
// ⚠️ 手写版本
useEffect(() => {
  return () => {
    saveDraft(draft); // 第一次渲染的 draft——永远是空字符串！
  };
}, []); // 空依赖 ⇒ 清理闭包创建于第 1 次渲染
```

清理函数在首次渲染时创建，捕获的是首次渲染的 `draft`。三分钟、四十次按键之后组件卸载，它保存的是一个空字符串。把 `draft` 加进依赖数组的"修法"更糟——清理函数变成每次按键都执行，而不是卸载时执行。

[`useUnmount`](https://reactuse.com/effect/useunmount/) 正确地解决了这个问题。它内部把你的回调存进一个每次渲染都更新的 [`useLatest`](https://reactuse.com/state/uselatest/) ref，卸载清理时通过 ref 调用：

```tsx
import { useUnmount } from "@reactuses/core";

function Composer() {
  const [draft, setDraft] = useState("");

  useUnmount(() => {
    saveDraft(draft); // ✅ 最后一次渲染时的 draft
  });

  return <textarea value={draft} onChange={e => setDraft(e.target.value)} />;
}
```

你的回调精确执行一次、在卸载时执行、并且看到最新的 state。这就是清理逻辑读取 state 或 props 时应该用 `useUnmount` 而不是 `return () => {}` 惯用法的具体理由——它不是语法糖，是 bug 修复。

## 挂载时的异步操作

裸 `useEffect` 出了名地拒绝异步函数——`useEffect(async () => {...}, [])` 递给 React 的是一个 Promise，而 React 期望的是清理函数，结果是一条警告加一个被跳过的清理。而 `useMount` 会丢弃回调的返回值，所以异步回调完全没问题：

```tsx
useMount(async () => {
  const user = await fetchCurrentUser();
  setUser(user);
});
```

它不提供的是对"组件在 `await` 中途卸载"的保护——卸载后调用 `setUser` 在 React 18+ 里无害，但往往仍不是你想要的（你可能正在写入一个会被重新挂载的实例覆盖的状态）。库里有两个答案：

- [`useMountedState`](https://reactuse.com/state/usemountedstate/) 返回一个由 ref 支撑的 `isMounted()` 函数——每个 `await` 之后检查一下：

  ```tsx
  const isMounted = useMountedState();

  useMount(async () => {
    const user = await fetchCurrentUser();
    if (isMounted()) setUser(user);
  });
  ```

- [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/) 把这个模式泛化到带依赖的 effect，给你的异步函数体一个存活检查，并支持清理。

真正的数据请求——带缓存、去重、重试——这两个都会不够用，那是 React Query / SWR 或框架 loader 的领域。`useMount` 负责的是边缘处那些一次性的命令式操作。

## 镜像需求：跳过挂载

有时你要的恰恰相反——响应*变化*，但不响应首次挂载。把筛选条件同步到 URL，但首次加载不要改写 URL；设置变更时提示"已保存"，但刚进页面时不要提示。这就是 [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)，以及它的底层兄弟 [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/)——后者只做一件事：告诉你当前是不是首次渲染：

```tsx
import { useUpdateEffect } from "@reactuses/core";

useUpdateEffect(() => {
  syncFilterToUrl(filter); // filter 变化时执行，跳过挂载
}, [filter]);
```

这四个 hook 合起来，覆盖了 class 时代用 `componentDidMount` / `componentDidUpdate` / `componentWillUnmount` 拼出来的整套生命周期词汇：

| 你想让代码执行的时机… | 用哪个 |
| --- | --- |
| 一次，组件出现之后 | [`useMount`](https://reactuse.com/effect/usemount/) |
| 一次，StrictMode 开发环境双重执行下也只一次 | [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/) |
| 组件被移除时，且能读到最新 state | [`useUnmount`](https://reactuse.com/effect/useunmount/) |
| 仅在更新时，跳过首次渲染 | [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) |
| 按"是否首次渲染"做条件分支 | [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) |

## 什么时候*不该*用 useMount

诚实环节。`useMount` 是给一个真实 React 原语起名字的糖，而有些时候原语本身才是对的：

- **effect 读取的 prop 或 state 会变化。** 如果 `roomId` 变了需要重连，那就是 `useEffect(connect, [roomId])`——在这里用挂载 hook 是一个披着便利 API 外衣的同步 bug。这种情况下空数组不是繁文缛节，是错的。
- **你在为渲染取服务端数据。** 框架 loader、React Query、SWR——任何带缓存、去重、重新验证的方案都胜过挂载 effect 里的一次 fetch。React 官方文档自己都不再把"在 useEffect 里 fetch"当主推模式了。
- **你需要绘制前测量。** `useMount` 在绘制之后。先测量再修改的工作属于 layout effect。
- **"挂载事件"其实是用户事件。** 如果代码可以放在导致组件出现的那次点击的处理函数里，就放在那里——effect 是用来和外部系统同步的，不是杂物抽屉。

检验只需一个问题：*组件存活期间，这段代码有没有可能需要重新执行？*只要答案是任何形式的"是，当 X 变化时"，你要的就是 `useEffect` 加依赖数组。如果是干脆的"否"，`useMount` 会把这件事说出来，而 `[]` 永远不会。

## 要点回顾

- `useMount(fn)` 就是把意图写进名字的 `useEffect(fn, [])`——没有会忘写的数组、没有 lint 抑制注释；首次渲染闭包语义应该拥抱，而不是对抗。
- React 18+ 开发环境 StrictMode 下所有挂载 effect 都跑两次。默认把 effect 写成幂等；当双重触发对用户或后端可见时，用 [`useOnceEffect`](https://reactuse.com/effect/useonceeffect/)。
- 空依赖 + 手写 `return () => {}` 清理会捕获首次渲染的 state——是真实存在、正在线上跑的 bug。[`useUnmount`](https://reactuse.com/effect/useunmount/) 通过 latest-ref 读取，看到的是最终 state。
- `useMount` 接受 `async` 回调（返回值被丢弃）；`await` 之后的状态写入用 [`useMountedState`](https://reactuse.com/state/usemountedstate/) 守卫，或改用 [`useAsyncEffect`](https://reactuse.com/effect/useasynceffect/)。
- 只响应变化的 effect，用镜像 hook [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/)。

`useMount`、`useUnmount`、`useOnceEffect` 以及另外 110+ 个 SSR 安全、TypeScript 优先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 里——一次安装，可 tree-shake，零依赖负担。

```bash
npm install @reactuses/core
```
