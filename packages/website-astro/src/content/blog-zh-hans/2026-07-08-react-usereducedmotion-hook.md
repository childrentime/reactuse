---
title: "React useReducedMotion Hook：尊重 prefers-reduced-motion（2026）"
description: "一篇实用的 useReducedMotion 上手指南：读取操作系统级的 prefers-reduced-motion 设置，为前庭功能障碍用户禁用或简化动画，并搞清楚 WCAG 真正要求你去掉的是哪些动效。只是 useMediaQuery 上的一行封装，SSR 安全，且能响应系统设置的实时变化。"
slug: react-usereducedmotion-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-08
tags: [react, hooks, accessibility, typescript, tutorial]
keywords: [react useReducedMotion, useReducedMotion hook, prefers-reduced-motion react, react 减少动效, 禁用动画 react, react 无障碍 hook, react 前庭功能障碍, react 晕动症, framer motion 减少动效, react useMediaQuery, ssr 安全 减少动效, react WCAG 动画]
image: /img/og.png
---

# React useReducedMotion Hook：尊重 prefers-reduced-motion（2026）

一个铺满整屏的视差首图。一个自动滚动的轮播图。一个又转又弹又跳的加载动画。对大多数用户来说这只是「够现代」。但对有前庭功能障碍、先兆偏头痛或梅尼埃病的用户来说，这可能会引发真实的恶心、眩晕，或者严重到直接关掉页面的头痛——这不是「不爽」，而是实实在在的生理症状。这正是为什么每个主流操作系统都自带「减弱动态效果」开关（iOS 从 2013 年起、macOS、Windows、Android、GNOME），也是为什么 CSS 把它暴露给了 Web，也就是 [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) 媒体特性。

`useReducedMotion` 就是把这个设置读进 React state 的 hook——响应式的，用户一切换系统开关就立刻更新；也是安全的，不会在 SSR 期间碰 `window`。本文讲清楚真实的 [`@reactuses/core`](https://reactuse.com) API、`prefers-reduced-motion` 到底要求你去掉什么动效（它比「完全不能动」要窄得多），以及你会真正用到的三种整合模式。

<!-- truncate -->

## 最朴素的写法

最直觉的做法是在 effect 里手写 `window.matchMedia`：

```tsx
function Hero() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mql.matches);
    // 🐛 忘了这行，值就再也不会更新了
    const onChange = () => setReduce(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return <div className={reduce ? 'hero' : 'hero hero--parallax'} />;
}
```

实践中这会以三种方式出问题。第一，`window` 在服务端不存在，所以这整块一旦跑在 Next.js、Remix 或 Astro 上就需要守卫——而人们很容易图省事，在渲染逻辑里到处撒 `typeof window !== 'undefined'`，而不是把它收敛进一个 effect。第二，很多人只用 `mql.matches` 初始化一次 state，然后干脆省掉 `change` 监听——这在大多数情况下没问题，直到用户在标签页开着的时候*真的*切换了这个设置（笔记本从电池切到插电，在某些系统上就会触发它，而这一点 QA 几乎从不测）。第三，每个关心动效偏好的组件都在重写同一套 `matchMedia` + 监听器 + 清理的舞步。

## API

[`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) 只是一次调用：

```ts
const prefersReducedMotion = useReducedMotion(defaultState?: boolean): boolean;
```

- **`defaultState`** —— 可选，默认 `false`。这是 SSR 期间以及客户端首次渲染时（媒体查询还没来得及求值之前）返回的值。
- **返回值** —— 一个从 `defaultState` 开始的布尔值，会在用户改变操作系统级动效偏好时实时更新。不用手写监听器，也没有清理逻辑要忘。

在底层，实现真就这么简单——整个实现就是对 [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) 的一行调用：

```ts
export function useReducedMotion(defaultState?: boolean) {
  return useMediaQuery('(prefers-reduced-motion: reduce)', defaultState);
}
```

真正干活的是 `useMediaQuery`——它在 effect 内部构造 `MediaQueryList`（所以渲染期间和服务端都不会碰 `matchMedia`），并替你订阅它的 `change` 事件。`useReducedMotion` 只是把查询字符串钉死了。这就是它的全部价值：你每次都能拿到正确、拼写正确、接线正确的那个查询。

## 模式一：关掉单个动画

最小的用法——用这个标志控制单个 CSS transition 或类名：

```tsx
import { useReducedMotion } from '@reactuses/core';

function Hero() {
  const reduce = useReducedMotion();

  return (
    <div className={reduce ? 'hero' : 'hero hero--parallax'}>
      <h1>Welcome</h1>
    </div>
  );
}
```

`.hero--parallax` 带着那个滚动联动的 `transform: translateY(...)` 动画；基础的 `.hero` 类没有。当 `reduce` 为 `true` 时，根本没有任何 JS 动画逻辑在跑——你不只是跳过了*视觉上*的动效，也跳过了驱动它的那个滚动监听器或 `requestAnimationFrame` 循环，这在低端设备上同样是实打实的性能收益。

## 模式二：接入 Framer Motion / GSAP

如果你在用动画库，hook 的值可以直接接进它的 duration/transition 配置，而不是切换类名：

```tsx
import { motion } from 'framer-motion';
import { useReducedMotion } from '@reactuses/core';

function Card({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4 }}
    >
      {children}
    </motion.div>
  );
}
```

注意这里并没有去掉淡入——`opacity` 不属于 `prefers-reduced-motion` 想管的那类动效（见下一节）。它去掉的是*位移*：`reduce` 为真时 `y` 永远不动，过渡也是瞬时的，所以卡片只是「出现」而已。Framer Motion 自己也带了一个 [`useReducedMotion`](https://www.framer.com/motion/use-reduced-motion/) hook，做的是同样的 `matchMedia` 读取——如果你已经在用 `@reactuses/core` 处理别的一切，用这个 hook 能让你保持一个真相来源，而不是两个库各自独立读同一个媒体查询。

## 模式三：一个全局开关，而不是 N 处判断

一旦设计系统里有几十个带动画的组件，逐个用 `reduce ? ... : ...` 判断的写法会很难扩展。真正能扩展的模式是：在靠近应用根部的地方读一次这个 hook，用它驱动一个 `data-` 属性，让全局样式表来响应。

```tsx
function App({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div data-motion={reduce ? 'reduce' : 'no-preference'}>
      {children}
    </div>
  );
}
```

```css
[data-motion="reduce"] *,
[data-motion="reduce"] *::before,
[data-motion="reduce"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

这和那个经典的、[直接建在媒体查询上的 CSS 通配符规则](https://web.dev/prefers-reduced-motion/)是同一个形状——区别是这里的 `data-motion` 属性由 React state 驱动，所以同一个标志既能给你的 JS 动画逻辑用（模式二），也能给这里的 CSS 用，而不用把媒体查询读两遍、也不用担心两边会不同步。

## 「减弱」不等于什么

`prefers-reduced-motion: reduce` 不是「禁用一切动效」。[WCAG 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) 和各平台厂商真正针对的是**大范围、非必要的动效**：视差滚动、自动播放的背景视频、缩放/平移式的首图动画、自动轮播、装饰性的弹跳/旋转加载动画。而那些承载信息或确认交互的动效——复选框的打勾动画、按钮短暂的按压状态、指示「仍在加载」的加载指示器、拖放反馈——一般可以保留，理想情况下只是更短、更平静一些。把*每一个*像素的移动都去掉，包括一个 `:hover` 的颜色过渡，并不是这个设置想要的，反而可能让界面显得像是坏了，而不是变得无障碍。拿不准的时候可以这样判断：「这个动效是不是铺满了屏幕的大部分区域，或者在没有用户操作的情况下持续运行？」——这才是该去掉的那类动效。

还有一点值得知道：如果你只需要在 CSS 里用它，从来不需要在 JS 逻辑里用，Tailwind 的 [`motion-reduce:`](https://tailwindcss.com/docs/animation#accounting-for-reduced-motion-preferences) 变体（或者一段普通的 `@media (prefers-reduced-motion: reduce)` 规则）就能零 JavaScript 搞定。真正需要用到这个 hook 的场景，是这个判断需要深入到渲染或 effect 逻辑里的时候——比如在自动播放的 `<video>` 和静态海报图之间做选择，彻底跳过某个滚动驱动动画库的初始化，或者上面那个 data 属性模式。

## SSR 安全

`useReducedMotion` 在服务端渲染时是安全的。`useMediaQuery` 只在 effect 内部调用 `window.matchMedia`——而 React 在 SSR 期间从不执行 effect——所以服务端和客户端首次渲染都会使用 `defaultState`（除非你另外传值，否则是 `false`）。没有 `typeof window` 守卫要写，也没有 hydration mismatch：React 在两次渲染中调和的是同一个值，真实的偏好会在挂载后立即在客户端读取并生效。（关于这个模式背后的一般原理，可以看 [SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/)。）

## 偏好查询家族

`useReducedMotion` 属于一小组读取操作系统级无障碍与显示偏好的 hook——它们都是建在同一个原语之上的、以用途命名的薄封装：

| Hook | 媒体查询 | 返回值 |
| --- | --- | --- |
| [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) | `prefers-reduced-motion` | `boolean` |
| [`usePreferredColorScheme`](https://reactuse.com/browser/usepreferredcolorscheme/) | `prefers-color-scheme` | `"dark" \| "light" \| "no-preference"` |
| [`usePreferredContrast`](https://reactuse.com/browser/usepreferredcontrast/) | `prefers-contrast` | `"more" \| "less" \| "custom" \| "no-preference"` |
| [`usePreferredDark`](https://reactuse.com/browser/usepreferreddark/) | `prefers-color-scheme: dark` | `boolean` |
| [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) | 你传入的任意查询 | `boolean` |

优先用这些具名的 hook——它们存在的意义就是让那串查询字符串只被正确拼写一次，写在一个地方——遇到更特殊的场景（比如自定义断点）再直接降到 `useMediaQuery`。想看更全的、让 React 应用尊重用户已经在系统层面配好的偏好的 hook 集合，见 [React 与用户偏好](https://reactuse.com/blog/react-user-preferences/)；想看更广的无障碍工具箱，见 [用 Hooks 构建无障碍的 React 组件](https://reactuse.com/blog/react-accessibility-hooks/)。

## 要点回顾

- `prefers-reduced-motion` 不是个可有可无的加分项——对有前庭功能障碍或偏头痛诱因的用户来说，无视它可能让页面在生理层面变得无法使用。
- **`useReducedMotion(defaultState?)`** 响应式地读取它：只是对 `useMediaQuery('(prefers-reduced-motion: reduce)', defaultState)` 的一行封装，所以 SSR 安全和实时更新都是白拿的。
- 对零散场景，逐个控制单个过渡效果（模式一）；把它接进 Framer Motion/GSAP 的 transition 配置（模式二）；或者在应用根部驱动一个全局 `data-motion` 属性，让 CSS 和 JS 共用一个真相来源（模式三）。
- 这个设置针对的是大范围或非必要的动效——视差、自动播放、装饰性循环动画——不是每一个 `:hover` 过渡。保留短促而有功能性的动效，去掉其余的。
- 默认 SSR 安全：`defaultState` 覆盖了服务端和首次渲染，不需要 `typeof window` 守卫。

从 [`@reactuses/core`](https://reactuse.com/browser/usereducedmotion/) 取用——它是唯一站在你的动画和一个没法安全看这些动画的用户之间的那个 hook。
