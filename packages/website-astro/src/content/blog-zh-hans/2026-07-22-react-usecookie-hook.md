---
title: "React useCookie Hook：把 Cookie 变成响应式状态（2026）"
description: "一篇实用的 useCookie 上手指南：像组件状态一样读、写、删 cookie——js-cookie 选项（expires、path、sameSite）、同标签页自动同步、服务端写入后的 refresh 逃生口，以及 SSR 下 defaultValue 规则详解。TypeScript 优先。"
slug: react-usecookie-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-22
tags: [react, hooks, state, typescript, tutorial]
keywords: [react useCookie, useCookie hook, usecookie react, react cookie hook, react cookie 状态, js-cookie react, react 读取 cookie, react 设置 cookie hook, react 删除 cookie, cookie 状态管理 react, useCookie typescript, react cookie ssr, useLocalStorage vs useCookie]
image: /img/og.png
---

# React useCookie Hook：把 Cookie 变成响应式状态（2026）

一个主题切换按钮把用户的选择存进 cookie，好让服务器在下一次请求时直接渲染出正确的主题——不闪一下错误的模式。组件写下 `document.cookie = 'theme=dark'`，然后……什么都没有重新渲染。`document.cookie` 不是 React 状态：写入不会通知任何人，读取意味着解析一串分号分隔的字符串，而且它变化时没有任何事件可以订阅。每个关心这个 cookie 的组件，都在安静地读着一份过期的副本。

[`@reactuses/core`](https://reactuse.com) 的 `useCookie` 把 cookie 变成普通的组件状态：像状态一样读、像状态一样写，同一标签页里监听同一个 key 的所有实例一起更新。它构建在 [`js-cookie`](https://github.com/js-cookie/js-cookie) 之上，属性处理（过期时间、路径、`SameSite`）是久经考验的那种。以下都是真实 API，TypeScript 优先。

<!-- truncate -->

## 手写版本，以及它在哪里散架

Cookie 比你用过的每一个框架都古老，它的 API 也毫不掩饰这一点。手写的 React 版本长这样：

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('theme='))
      ?.split('=')[1] ?? 'light'
  );

  const update = (next: string) => {
    document.cookie = `theme=${next}; path=/; max-age=31536000`;
    setTheme(next);
  };
  // ...
}
```

它散架的几个常见位置：

- **字符串解析是你的问题。** 按 `'; '` 切分、前缀匹配 key、解码值——这是一个你现在要在每个组件里维护的 cookie 解析器。
- **别的地方不会更新。** 两个显示同一个 cookie 的组件各自握着自己的 `useState` 副本。一个写入了；另一个继续渲染旧值，直到某个无关的更新碰巧让它重渲染。
- **属性全靠字符串拼接。** `path`、`expires`、`secure`、`SameSite` 都是手工拼接的片段——拼错了不会报错，只会悄悄产出一个作用域错误的 cookie。
- **在服务端直接崩溃。** SSR 期间不存在 `document`，就算加了守卫，服务端渲染和客户端首次渲染也可能不一致——hydration 不匹配。

## useCookie——Cookie 即状态

```tsx
import { useCookie } from '@reactuses/core';

function ThemeToggle() {
  const [theme, setTheme] = useCookie('theme', { expires: 365, path: '/' }, 'light');

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      当前主题：{theme}
    </button>
  );
}
```

签名：

```ts
function useCookie(
  key: string,
  options?: Cookies.CookieAttributes,
  defaultValue?: string
): readonly [
  string | undefined,                                    // 当前值
  (value: string | undefined | ((prev) => string | undefined)) => void, // 更新
  () => void                                             // 刷新
];
```

三点值得注意：

- **值是字符串。** Cookie 本质是字符串传输——这个 hook 不替你猜序列化方式。要存对象？自己 `JSON.stringify`，或者先想想它是否真的该放在 cookie 里（每个 cookie 约 4KB 预算，而且每个字节都会跟着每次 HTTP 请求上路）。
- **设为 `undefined` 就是删除。** `setTheme(undefined)` 直接移除 cookie——不需要额外导入一个 `remove` 函数。函数式更新也支持：`setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))`。
- **挂载时 cookie 不存在，默认值会被写入。** 传 `'light'` 作为默认值，首次渲染时 cookie 就会以 `theme=light` 的形式落地——这意味着*服务器*在下一次请求就能看到它。对主题 cookie 来说，这正是目的所在。

## Cookie 属性——有类型，不拼接

`options` 参数原样透传给 `js-cookie`，所以就是完整的 `Cookies.CookieAttributes`：

| 属性 | 作用 |
| --- | --- |
| `expires` | 从现在起的天数（`365`），或一个精确时刻的 `Date`。省略则是随浏览器关闭消失的会话 cookie |
| `path` | 哪些路径能看到这个 cookie——几乎总是想要 `'/'` |
| `domain` | 跨子域共享（`'.example.com'`） |
| `secure` | 仅 HTTPS |
| `sameSite` | `'strict'`、`'lax'` 或 `'none'`——跨站发送策略 |

options 对象按值比较，不按引用——每次渲染都内联传 `{ expires: 365, path: '/' }` 完全没问题，不会引起任何抖动。

一个值得知道的锋利边缘：属性是*写入时*的配置。浏览器不允许 JavaScript 读回一个 cookie 的 path 或过期时间——所以删除走的是你写入时用的同一组 `path`/`domain`。同一个 key 的 options 保持一致，这一点就永远咬不到你。

## 同步模型：同标签页、其他标签页、以及服务器

这是 cookie 与 Web Storage 真正不同的地方，这个 hook 对此很诚实。

**同标签页：自动。** 标签页里每一个 `useCookie('theme', …)` 实例都会在任何一个写入时一起更新。Cookie 没有原生的变化事件，所以 hook 在写入时派发一个内部 window 事件——兄弟组件保持同步，你什么都不用接。

**其他标签页：不自动。** `localStorage` 有跨标签页的 `storage` 事件；cookie 什么都没有。别的标签页写了 cookie，这个标签页自己不会知道。跨标签页的偏好同步是 [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) 的领域——完整工具箱见[《React 跨标签页状态》](https://reactuse.com/blog/react-cross-tab-state/)。

**服务器（或任何外部写入）：`refreshCookie`。** Cookie 的超能力是*服务器*也能写它——比如 fetch 响应里的 `Set-Cookie` 头。这种写入同样不触发任何客户端事件，所以元组的第三个元素用来按需重读：

```tsx
const [session, , refreshSession] = useCookie('session_hint', {}, '');

const login = async (creds: Credentials) => {
  await fetch('/api/login', { method: 'POST', body: JSON.stringify(creds) });
  refreshSession(); // 拿到响应刚刚设置的 cookie
};
```

心智模型一行一个：同标签页写入自我传播；跨标签页交给 `localStorage`；外部写入需要 `refreshCookie()`。

## useCookie vs useLocalStorage vs useSessionStorage

三者都让持久化的值变成响应式；区别在于*谁能看到这个值、能看多久*：

| | [`useCookie`](https://reactuse.com/state/usecookie/) | [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) | [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) |
| --- | --- | --- | --- |
| 服务器能看到 | ✅ 每次请求都带上 | ❌ | ❌ |
| 生命周期 | 你来定（`expires`） | 永久直到清除 | 标签页关闭 |
| 跨标签页同步 | ❌（无原生事件） | ✅ | ❌ |
| 容量预算 | 约 4KB，每次请求都发送 | 约 5MB，留在本地 | 约 5MB，留在本地 |
| 值类型 | `string` | 任意（类型化序列化器） | 任意（类型化序列化器） |

决策规则一句话：**服务器需要这个值才能正确渲染吗？** 主题、语言、同意状态、A/B 分桶——答案是"是"的，就放 cookie，因为服务器在发出第一个字节的 HTML 之前就能从请求头里读到它。如果值只属于客户端——表单草稿、面板位置、服务器从不渲染的缓存偏好——Web Storage 更宽敞，还能跨标签页同步。存储那一侧的完整指南见[《React 里的 useLocalStorage》](https://reactuse.com/blog/react-uselocalstorage-hook/)。

（把房间里的大象说明白：真正的鉴权 token 属于 `HttpOnly` cookie，JavaScript——包括这个 hook——*根本读不到它*。这是特性，不是缺陷。`useCookie` 面向的是可读层：偏好、提示、开关。）

## 真实使用场景

- **不闪烁的主题切换。** 主题 cookie 随请求上行，服务器直接渲染 `<html class="dark">`，客户端不需要任何修正。这个场景用 `localStorage` *不可能*实现——服务器永远看不到 storage。
- **语言选择。** 同样的形状：用户选了语言，cookie 持久化，服务端渲染读到它，从第一个字节开始就用正确的语言响应。
- **Cookie 同意横幅。** 用长 `expires` 写下同意决定；客户端代码和服务端中间件都能在加载分析脚本前检查它。
- **A/B 实验分桶。** 用函数式更新只分配一次（`setBucket((prev) => prev ?? assignBucket())`），分桶结果对服务端渲染、边缘中间件和客户端同时可见。
- **登录后的 UI 提示。** 一个非敏感的 `logged_in=1` 提示 cookie（由服务器随真正的 `HttpOnly` 会话一起设置），让客户端立刻渲染账户相关的界面——登录调用之后 `refreshCookie()` 把它捡起来。

## SSR：defaultValue 规则

服务端渲染期间没有 `document.cookie`，hook 什么都读不到。规则就一句话：**做 SSR 时，永远传 `defaultValue`。** 服务器渲染默认值，客户端首次渲染产出相同的标记（hydration 要求的正是这个——React 会比对两者），真正的 cookie 值紧接着在 effect 里落地。SSR 应用里省略默认值，hook 会在开发环境警告你，因为服务器（渲染空）和客户端（渲染 cookie）会不一致——hydration 不匹配。

如果你的框架能在服务端读 cookie（Next.js 的 `cookies()`、Remix 的 loader），还可以更进一步：把*真实的*请求 cookie 作为 `defaultValue` 传进来，首屏直接正确，不需要任何 hydration 后的修正。更宏观的模式——为什么所有浏览器 API 都需要这种纪律——见[《SSR 安全的 React Hooks》](https://reactuse.com/blog/ssr-safe-react-hooks/)。

## 要点回顾

- **`document.cookie` 不是状态**——没有响应性、要解析字符串、属性靠手拼。[`useCookie`](https://reactuse.com/state/usecookie/) 把它变成 `js-cookie` 加持的 `[value, set, refresh]` 元组。
- **设 `undefined` 即删除；支持函数式更新；** cookie 缺失时会用你的 `defaultValue` 初始化，服务器下一次请求就能看到。
- **记住同步模型：** 同标签页实例自动同步；跨标签页不行（那是 [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) 的事）；服务器写入的 cookie 需要显式 `refreshCookie()`。
- **按受众选择：** 服务器渲染需要的值——主题、语言、同意、A/B——放 cookie。纯客户端数据放 Web Storage。
- **SSR 规则：** 服务端渲染时永远传 `defaultValue`——更好的做法是把真实的请求 cookie 作为默认值传入。

从 [`@reactuses/core`](https://reactuse.com/state/usecookie/) 拿来用，让你的 cookie 变成它一直想成为的那种状态。
