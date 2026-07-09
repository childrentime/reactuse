---
title: "React useLocalStorage Hook：SSR 安全的持久化状态（2026）"
description: "一篇实用的 useLocalStorage 上手指南：一个长得像 useState 的 API，但状态能跨刷新存活，自动序列化对象、Map、Set 和 Date，跨标签页、跨组件保持同步，并且在服务端渲染下安全无虞。手写版本的每一种翻车方式，它都处理好了。"
slug: react-uselocalstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-09
tags: [react, hooks, state-management, typescript, tutorial]
keywords: [react useLocalStorage, useLocalStorage hook, uselocalstorage react, react localstorage hook, react 持久化状态, react localstorage typescript, ssr 安全 localstorage, react localstorage 跨标签页同步, react 刷新保存状态, localstorage react 水合, useLocalStorage next.js, react 持久化 hook, useSessionStorage, localstorage json react]
image: /img/og.png
---

# React useLocalStorage Hook：SSR 安全的持久化状态（2026）

用户花两分钟在你的仪表盘上配置好筛选条件，按了下刷新，一切归零。`useState` 天生就是短命的——每次刷新都从头再来。所有人都知道的解法是 `localStorage`；而所有人手写的接线方式——用 `useState` 的初始化函数读存储，再用一个 `useEffect` 写回去——至少带着四个 bug：SSR 下会崩溃或水合不匹配、遇到损坏数据会抛异常、多个浏览器标签页之间会失去同步、两个组件用同一个 key 会各说各话。

`useLocalStorage` 就是把这一切都做对的那个 hook。它长得和 `useState` 一模一样，但值能在刷新后存活，不止能存字符串，跨标签页*和*跨组件都保持同步，而且在服务端渲染下也安全。下面写的全是真实的 [`@reactuses/core`](https://reactuse.com) API，TypeScript 优先。

<!-- truncate -->

## 为什么不直接 useState + useEffect？

下面是大多数代码库里最终会出现的版本，它比看上去更容易翻车：

```tsx
function usePersistedState(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key); // 🐛 见下文
    return stored !== null ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

1. **SSR 下直接坏掉。** 服务端没有 `localStorage`，初始化函数直接抛异常。加个 `typeof window` 守卫？那就把崩溃换成了水合不匹配：服务端渲染的是默认值，客户端一上来就渲染存储值，React 发出警告——更糟的情况是悄悄打了错误的 DOM 补丁。
2. **遇到坏数据就抛异常。** 对一个被手动改过、写到一半、或者由旧版应用存下的值跑 `JSON.parse`，整个组件跟着一起挂。
3. **无视其他标签页。** 用户在标签页 A 改了设置，标签页 B 一直显示——而且还在反复保存——那个过期的旧值，直到整页刷新。
4. **无视其他组件。** 两个组件都调用 `usePersistedState('theme', …)`，各自持有一份 `useState`。一个更新了，另一个不重渲染。同一个 key，两个真相。

每个 bug 都能手动修，而修完加起来，恰好就是一个好 hook 本来的样子。

## useLocalStorage——刷新后还活着的 useState

API 刻意做成了 `useState` 的形状：返回值和 setter 组成的元组，默认值是第二个参数。

```tsx
import { useLocalStorage } from '@reactuses/core';

function Settings() {
  const [layout, setLayout] = useLocalStorage('dashboard-layout', 'grid');

  return (
    <select value={layout ?? 'grid'} onChange={(e) => setLayout(e.target.value)}>
      <option value="grid">网格</option>
      <option value="list">列表</option>
    </select>
  );
}
```

签名是 `useLocalStorage(key, defaultValue, options?)`：

```ts
const [value, setValue] = useLocalStorage<T>(key, defaultValue, options);
// value: T | null      setValue: Dispatch<SetStateAction<T | null>>
```

首次访问时 `value` 是默认值；任何一次 `setValue` 之后，值就被写进 `localStorage`，下次刷新原样回来。函数式更新和 `useState` 完全一致：`setValue(prev => …)` 拿到的是当前存储的值。和 `useState` 唯一肉眼可见的区别是类型：`value` 是 `T | null`，因为一个持久化的 key 还可以被*删除*——下文细说。

## 对象、Map、Set、Date——序列化全自动

`localStorage` 只能存字符串；hook 会根据默认值的类型自动挑选正确的序列化器。传对象就自动走 `JSON.stringify`/`JSON.parse` 往返；传数字拿回来的就是数字，而不是 `"42"`：

```tsx
const [filters, setFilters] = useLocalStorage('filters', {
  status: 'open',
  assignee: null as string | null,
});

const [fontSize, setFontSize] = useLocalStorage('font-size', 16);
const [seen, setSeen] = useLocalStorage('seen-ids', new Set<string>());
const [lastVisit, setLastVisit] = useLocalStorage('last-visit', new Date());
```

最后那两个正是手写版本永远不会处理的部分：`Map`、`Set`、`Date` 默认值有各自专属的序列化器（`Set` → JSON 数组、`Date` → ISO 字符串，再原样读回来），所以刷新之后 `seen` 依然是一个带 `.has()` 的真 `Set`——而不是一具字符串化的空壳。

内置序列化器不够用时——比如这个值要和其他系统写下的格式保持兼容——传你自己的：

```tsx
const [config, setConfig] = useLocalStorage('legacy-config', defaultConfig, {
  serializer: {
    read: (raw) => parseLegacyFormat(raw),
    write: (value) => toLegacyFormat(value),
  },
});
```

## 删除 key：setValue(null)

持久化状态有一个 `useState` 没有的操作：*把这个忘了*。把值设成 `null`，key 会从 `localStorage` 里被整个移除：

```tsx
const [token, setToken] = useLocalStorage<string>('auth-token', null);

// 登录
setToken(response.token);
// 登出——key 从 localStorage 删除，值变为 null
setToken(null);
```

这就是值的类型是 `T | null` 的原因。被删除的 key 在本次会话里会一直保持 `null`——**不会**弹回默认值——而这正是你想要的：「已登出」和「从未登录、显示默认值」是两个不同的状态，hook 不会把它们混为一谈。

## SSR 与水合，真正的安全

`useLocalStorage` 构建在 `useSyncExternalStore` 之上——React 官方的外部数据订阅原语——服务端快照返回默认值。这一个设计决定换来三件事：

- **服务端不崩。** hook 在服务端渲染期间绝不触碰 `window` 或 `localStorage`。你的代码里不需要任何 `typeof window` 守卫。
- **没有水合不匹配。** 客户端的首次渲染刻意与服务端 HTML（默认值）保持一致，然后 React 通过 `useSyncExternalStore` 的正规路径重渲染出存储值——没有警告，没有被错误覆盖的 DOM。
- **并发安全的读取。** 因为存储被当作外部 store 对待，React 18+ 的 transition 等特性永远不会读到撕裂的值。

有一件事是任何 localStorage hook 都消除不了的：存储值出现之前，默认值会闪现一瞬——服务端是真的不知道浏览器存储里有什么。对闪现很伤的值（主题色是经典案例），解法在 React 之外，靠一段阻塞的内联脚本；相关取舍见 [SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/)。

而当存储本身不可用时——某些隐私模式，或者访问存储直接抛异常——hook 会退化成一个纯内存的状态容器，并通过 `onError` 上报失败，而不是崩溃：

```tsx
const [draft, setDraft] = useLocalStorage('draft', '', {
  onError: (e) => trackWarning('storage unavailable', e), // 默认：console.error
});
```

同一个 `onError` 还会接住损坏数据（朴素版本里那个 `JSON.parse` bug——hook 会返回默认值而不是抛异常）以及超出配额的写入。

## 跨标签页同步——也跨组件

在一个标签页里改值，其他所有标签页立刻更新，因为 hook 监听了浏览器原生的 `storage` 事件：

```tsx
// 标签页 A 和标签页 B 都渲染这段——在一边切换，两边都更新。
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

跨标签页同步默认开启；如果某个标签页应该保持自己的视图直到刷新，用 `listenToStorageChanges: false` 关掉。

更隐蔽的另一半是**同标签页**的同步。原生 `storage` 事件永远不会在发起修改的那个标签页里触发,所以在手写 hook 里，头部的 `theme` 开关更新了头部——而读同一个 key 的侧边栏还抱着过期的副本。`useLocalStorage` 在内部会把每次写入重新广播一遍，所以同一个 key 上的所有组件永远一起重渲染。两个组件，一个 key，一个真相——朴素版本的漂移 bug 根本不存在。（如果你要跨标签页同步的不止是持久化状态，[React 跨标签页状态](https://reactuse.com/blog/react-cross-tab-state/)有完整的工具箱。）

## 存储家族

`useLocalStorage` 有几个兄弟姐妹；按值应该*活在哪里*、*活多久*来选：

| Hook | 存在… | 存活周期 | 跨标签页 |
| --- | --- | --- | --- |
| [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) | `localStorage` | 跨刷新 + 跨浏览器重启 | ✅ 同步 |
| [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) | `sessionStorage` | 跨刷新，按标签页隔离 | ❌ 设计上就按标签页隔离 |
| [`useCookie`](https://reactuse.com/state/usecookie/) | cookie | 由 cookie 选项决定；会随请求发给服务端 | ✅ |
| [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) | 不存储（纯消息） | — | ✅ 实时消息 |

`useSessionStorage` 的 API 和序列化行为完全一致——换个 import，值就变成按标签页隔离的。当*服务端*在第一个请求里就需要这个值时，该选的是 `useCookie`（这也是主题色闪现问题的真正解法）。`useBroadcastChannel` 根本不是存储，但当标签页之间需要*对话*而不是*持久化*时，它才是对的工具。

## 要点回顾

- 手写的 `useState` + `useEffect` + `localStorage` 组合自带四个 bug：SSR 崩溃或水合不匹配、`JSON.parse` 遇坏数据崩溃、没有跨标签页同步、共享 key 的组件之间漂移。
- **`useLocalStorage(key, defaultValue)`** 是能持久化的 `useState` 平替——同样的元组、同样的函数式更新，类型是 `T | null`。
- 序列化全自动，由默认值的类型驱动——对象、数组、数字、布尔值，甚至 `Map`、`Set`、`Date` 都能正确往返。需要特定格式时传自定义 `serializer`。
- **`setValue(null)` 会删除 key**——「已清除」是一个真实状态，和默认值是两回事。
- 构建在 `useSyncExternalStore` 之上：SSR 安全、无需守卫、没有水合不匹配，存储被禁用时退化为内存状态（配合 `onError`）。
- 同步是全方位的：跨标签页靠原生 `storage` 事件（用 `listenToStorageChanges` 开关），同标签页跨组件靠内部重新广播——始终开启。
- 同一套 API，不同的生命周期：按标签页隔离用 [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/)，服务端也需要时用 [`useCookie`](https://reactuse.com/state/usecookie/)。

从 [`@reactuses/core`](https://reactuse.com/state/uselocalstorage/) 里把它拿走，让「刷新」不再等于「归零」。
