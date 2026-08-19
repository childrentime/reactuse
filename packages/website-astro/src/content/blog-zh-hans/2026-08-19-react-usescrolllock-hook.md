---
title: "React useScrollLock Hook：为弹窗锁住页面滚动 (2026)"
description: "useScrollLock 实用指南：为什么给 body 加 `overflow: hidden` 拦不住 iOS Safari 的橡皮筋滚动，hook 的 touchmove 守卫如何在锁住页面的同时让弹窗内部继续滚动，useScrollLock vs position:fixed vs body:has(dialog[open]) 三种方案对比，如何锁住滚动容器而不是文档，以及真正会踩的坑——卸载时谁来释放锁、两个持有者争抢同一元素、initialState 跳过 iOS 守卫、滚动条消失导致的布局抖动。TypeScript 优先，SSR 安全。"
slug: react-usescrolllock-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-19
tags: [react, hooks, browser, typescript, tutorial]
keywords: [react usescrolllock, usescrolllock, useScrollLock hook, react 锁定 body 滚动, react 弹窗禁止背景滚动, react 禁用背景滚动, body scroll lock react, react 弹窗滚动锁定, ios safari 滚动锁定 react, body overflow hidden react, react 防止弹窗背后滚动, overscroll-behavior contain react, react 抽屉滚动锁定, scrollbar-gutter stable, react 滚动锁定 hook]
image: /img/og.png
---

# React useScrollLock Hook：为弹窗锁住页面滚动 (2026)

弹窗打开了，居中、漂亮、无可挑剔。然后有人在遮罩上一划，背后的整页内容就从弹窗底下滚走了。所有人第一次的修法都是同样三行：

```tsx
useEffect(() => {
  document.body.style.overflow = open ? "hidden" : "";
}, [open]);
```

在你自己的笔记本上完全正常。然后 bug 报告来了：

1. **iPhone 上页面照样能动。** 即使 `<body>` 上有 `overflow: hidden`，iOS Safari 的触摸拖动依然会橡皮筋滚动整个文档。
2. **顺手抹掉了别的东西。** `""` 不一定是原本的值——你刚刚擦掉了设计系统或 CSS-in-JS 写在行内的那个 `overflow`。
3. **两个浮层，一个冻住的页面。** 抽屉和图片灯箱都在改 `body.style.overflow`；关闭顺序一颠倒，页面就再也滚不动了。
4. **桌面端滚动条一消失，整页布局就抖一下。**

来自 [`@reactuses/core`](https://reactuse.com) 的 [`useScrollLock`](https://reactuse.com/browser/usescrolllock/) 就是这三行，但把难的部分都处理掉了：它会还原自己替换掉的那个行内 `overflow`，在 iOS 上加一层 `touchmove` 守卫、同时仍然让弹窗自己的内容能滚，把锁定状态作为 React state 暴露出来供你渲染，并且可以作用在任意元素上——不只是 `<body>`。本文逐行讲清它到底做了什么、为什么在 iOS 上 `overflow: hidden` 不够、它和 `position: fixed`、`body:has(dialog[open])` 两种方案怎么比，以及真实项目里会踩的六个坑。

<!-- truncate -->

## 快速开始

```bash
npm install @reactuses/core
```

```tsx
import { useScrollLock } from "@reactuses/core";
import { useEffect } from "react";

function Modal({ open, onClose, children }: ModalProps) {
  // 传 getter，不要直接传 document.body —— 见下面的 SSR 那条坑
  const [, setLocked] = useScrollLock(() => document.body);

  useEffect(() => {
    setLocked(open);
    return () => setLocked(false); // 即使在打开状态下卸载也会释放
  }, [open, setLocked]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
```

签名：

```ts
const [locked, setLocked] = useScrollLock(target, initialState?)
```

- **`target`** —— 要锁住滚动的那个元素。接受元素本身、`RefObject`，或者 getter `() => element`。每次调用都是惰性解析的。
- **`initialState`** —— 初始就锁住。默认 `false`，而且你应该保持默认（见坑 3）。
- **返回** `[locked, setLocked]`。`locked` 是真正的 state；`setLocked` 引用稳定，放依赖数组或当 prop 传都安全。

## useScrollLock 到底做了什么

从源码浓缩出来的核心：

```tsx
const [locked, setLocked] = useState(initialState);
const initialOverflowRef = useRef<CSSStyleDeclaration["overflow"]>("scroll");

useEffect(() => {
  const element = getTargetElement(target);
  if (element) {
    initialOverflowRef.current = element.style.overflow; // 记住我们要替换掉的值
    if (locked) element.style.overflow = "hidden";
  }
}, [locked, target]);

const lock = useEvent(() => {
  const element = getTargetElement(target);
  if (!element || locked) return;
  if (isIOS) element.addEventListener("touchmove", preventDefault, { passive: false });
  setLocked(true);
});

const unlock = useEvent(() => {
  const element = getTargetElement(target);
  if (!element || !locked) return;
  if (isIOS) element.removeEventListener("touchmove", preventDefault);
  element.style.overflow = initialOverflowRef.current; // 还原，而不是覆盖成空
  setLocked(false);
});
```

里面有四个决策值得点名，因为手写版本恰恰就是在这几处不一样：

- **锁定是 state，不是「发出去就不管」的副作用。** `locked` 是真正的 `useState` 值，所以驱动样式的那个布尔值同时也能驱动你的 `aria-hidden`、className、Esc 处理逻辑。
- **它还原自己替换掉的行内值**，而不是 `""`。如果原本行内是 `overflow: overlay`，还原回来的就是它。
- **target 是惰性解析的**，走 `getTargetElement`，没有 `window` 时返回 `undefined`。服务端不会碰 DOM。
- **只有 iOS 会加 `touchmove` 守卫。** 而这正是真正有意思的部分。

## 为什么在 iOS 上 `overflow: hidden` 不够

给滚动元素加 `overflow: hidden` 是规范认可的、正确的停止滚动方式——但 iOS Safari 从来没有在 `<body>` 上完全遵守它，触摸拖动依然能橡皮筋滚动文档。唯一可靠的办法是取消手势本身：

```tsx
element.addEventListener("touchmove", preventDefault, { passive: false });
```

这里的 `passive: false` 是必需的，不是装饰。浏览器默认把文档级目标上的 touch 监听注册为 passive，而 passive 监听里的 `preventDefault()` 会被忽略并在控制台给一条警告——你的锁会静默失效。

但在 `touchmove` 上无脑 `preventDefault` 会毁掉你真正想要的东西：弹窗**内部**的滚动。所以处理函数在取消之前先问一个问题：

```tsx
function checkOverflowScroll(ele: Element): boolean {
  const style = window.getComputedStyle(ele);
  if (
    style.overflowX === "scroll" || style.overflowY === "scroll"
    || (style.overflowX === "auto" && ele.clientWidth < ele.scrollWidth)
    || (style.overflowY === "auto" && ele.clientHeight < ele.scrollHeight)
  ) return true;

  const parent = ele.parentNode as Element;
  if (!parent || parent.tagName === "BODY") return false;
  return checkOverflowScroll(parent);
}
```

从 `event.target` 往上走，只要有任一祖先是真的可滚动的——`overflow: scroll`，或者 `overflow: auto` **且此刻内容真的溢出**——就放这个手势过去，一点都不拦。由此自然带来两个很舒服的性质：

- 一个 `overflow: auto` 容器如果当前内容装得下，它就不是可滚动的，于是会被锁住——这是对的。内容变多了它自己就又能滚了，不需要改代码。
- 多指触摸被排除在外（`if (e.touches.length > 1) return true`，在任何 `preventDefault` 之前），所以双指缩放照样能用。在弹窗里禁掉缩放是无障碍上的退步，这里绕开了它。

## useScrollLock 与另外四种方案对比

| 方案 | 拦住 iOS 橡皮筋 | 保留内部滚动 | 保留滚动位置 | 代价 |
| --- | --- | --- | --- | --- |
| 手写 `body.style.overflow = "hidden"` | ❌ | ✅ | ✅ | 覆盖行内样式，且从不还原 |
| `body:has(dialog[open]) { overflow: hidden }` | ❌ | ✅ | ✅ | 零 JS —— 但 iOS 的洞一模一样 |
| `body { position: fixed; top: -scrollY }` | ✅ | ✅ | 只有你自己保存并还原才行 | 把 `<body>` 拽出正常流：`position: fixed` 的子元素重新定位，滚动锚定和 `scroll-behavior: smooth` 都会变怪 |
| dialog **和** `::backdrop` 上写 `overscroll-behavior: contain` | ✅（Chrome 144+） | ✅ | ✅ | 支持的地方最干净 —— 但只适用于 `<dialog>` |
| `useScrollLock` | ✅ | ✅ | ✅ | 一次 hook 调用背后约 40 行 JS |

有一点很容易让人误会：`<dialog>.showModal()` 会把文档其余部分变成 **inert**——点击和 Tab 都进不去——但它**不能**可靠地阻止滚动，在移动端触摸下尤其如此。惰性（inert）和滚动锁定是两个不同的问题，浏览器只帮你解决了第一个。

还有一个是互补而非替代：给你**内部**滚动容器加 `overscroll-behavior: contain` 能阻止滚动**链式传递**——内层列表滚到底之后把手势交给页面。不管你用哪种锁法，这个都值得加上；但它单独并不能拦住从遮罩上开始的那一划。

## 实战模式

### 1. 声明锁定，而不是手动开关

快速开始里的写法就是值得记住的模式。不要在打开的 handler 里写 `setLocked(true)`、在关闭的 handler 里写 `setLocked(false)`——那是两个会忘的地方，中间还有各种提前 return 的分支——而是把锁绑到本来就描述弹窗的那个 state 上：

```tsx
useEffect(() => {
  setLocked(open);
  return () => setLocked(false);
}, [open, setLocked]);
```

这样锁定就不可能和 UI 脱节，而 cleanup 还覆盖了命令式写法总会漏掉的那个 case：弹窗还开着的时候路由跳走、组件被卸载。

配合 [`useDisclosure`](https://reactuse.com/state/usedisclosure/) 来管开关状态本身：

```tsx
import { useDisclosure, useScrollLock } from "@reactuses/core";
import { useEffect } from "react";

function Drawer({ children }: { children: React.ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [locked, setLocked] = useScrollLock(() => document.body);

  useEffect(() => {
    setLocked(isOpen);
    return () => setLocked(false);
  }, [isOpen, setLocked]);

  return (
    <>
      <button onClick={onOpen}>菜单</button>
      <main aria-hidden={locked}>{/* 页面内容 */}</main>
      {isOpen && (
        <aside className="drawer">
          {children}
          <button onClick={onClose}>关闭</button>
        </aside>
      )}
    </>
  );
}
```

注意元组里 `locked` 这一半是怎么发挥作用的：一个布尔值同时驱动样式和无障碍状态，所以它们不可能对不上。（在 React 19 上同一个值还能直接给 `inert`。）

### 2. 锁住滚动容器，而不是文档

很多应用根本不滚动文档——外壳是 `height: 100vh; overflow: auto`，一切都在一个 div 里滚。这种情况下给 `<body>` 加 `overflow: hidden` 完全没有作用，不知道这点的话能耗掉你一下午。把 hook 指向真正的滚动容器：

```tsx
function Shell({ children }: { children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [, setLocked] = useScrollLock(scroller);

  return (
    <div ref={scroller} style={{ height: "100vh", overflow: "auto" }}>
      {children}
    </div>
  );
}
```

同一个 hook，同一个元组。这也是为什么 `target` 是必填而不是默认 `document.body`：库无法知道哪个元素才是你的滚动根。

### 3. 拖拽期间锁定

触摸拖动滑块、可排序列表或自定义轮播时，页面会跟着滚，除非有东西拦住它——而 `touchmove` 守卫恰好就是对的工具：

```tsx
const [, setLocked] = useScrollLock(() => document.body);

<div
  onPointerDown={() => setLocked(true)}
  onPointerUp={() => setLocked(false)}
  onPointerCancel={() => setLocked(false)}
/>
```

`onPointerCancel` 很关键：浏览器可能在手势中途抢走指针，没有它你就会把页面锁死。如果你是在自己实现拖拽而不只是接一个现成的，[`useDraggable`](https://reactuse.com/element/usedraggable/) 已经把指针那套账都记好了。

## 值得知道的坑

### 1. 锁定是一个样式，不是一段生命周期

锁是写在一个 hook 并不拥有的元素上的行内 `overflow: hidden`，总得有人把它放回去。从 `@reactuses/core` v6.5.3 起，持有锁的组件卸载时 hook 会自己做这件事：还原它替换掉的那个行内值，并摘掉 iOS 的 `touchmove` 守卫——所以"弹窗还开着就跳路由"不会再把页面冻住。v6.5.2 及更早版本不会还原，如果你锁在旧版本上就得留意：在 iOS 上残留的那个 `passive: false` 监听会把整个会话剩下的触摸滚动全部干掉，不只是样式的问题。

不过卸载只是一半。另一半——组件还挂着、只是弹窗关了——无论哪个版本都得你自己管，这也正是上面那个模式把 `setLocked` 绑到 `open` 上并带 cleanup、而不是在两个 handler 里分别开关的原因：

```tsx
useEffect(() => {
  setLocked(open);
  return () => setLocked(false);
}, [open, setLocked]);
```

把 setter 当成你借来的一个样式。每一次借都要还。

### 2. 一个元素只能有一个持有者

两个 hook 实例锁同一个元素是最微妙的失效方式，因为每个实例都记着**自己那份**原始 `overflow`：

```text
A.lock()    → overflow: hidden    （A 记住的是 "auto"）
B.lock()    → overflow: hidden    （B 记住的是 "hidden" 😬）
A.unlock()  → overflow: auto      （页面能滚了，尽管 B 还认为自己锁着）
B.unlock()  → overflow: hidden    （现在页面卡死了，而且什么都没打开）
```

这里没有什么能救你——这是「保存旧值、再放回去」这个思路本身固有的问题，所有手写方案和大多数库都一样。答案在架构层面：**每个元素只有一个锁的持有者。** 把 `useScrollLock(() => document.body)` 放在布局、Provider 或者 store 里，让各个弹窗去请求它加锁，而不是各自带一个。

### 3. `initialState: true` 会跳过 iOS 守卫

`useScrollLock(target, true)` 会从第一次提交起就加上 `overflow: hidden`——但 `touchmove` 监听只在 `lock()` 里挂，而 `lock()` 从没跑过。所以一个初始就锁定的页面在 iOS 上依然能橡皮筋滚。从 `false` 开始，然后翻过去：

```tsx
const [, setLocked] = useScrollLock(() => document.body);
useEffect(() => { setLocked(true); }, [setLocked]); // 挂载即锁定，守卫也带上了
```

### 4. 桌面端布局抖动

滚动条一藏，就腾出约 15px，整页横向抖一下。这不是 hook 该管的事，一行 CSS 就够：

```css
html { scrollbar-gutter: stable; }
```

### 5. SSR 下要传 getter，不要传 `document.body`

`useScrollLock(document.body)` 会在**渲染期间**求值 `document.body`，在服务端还没轮到 hook 小心行事就已经抛错了。`() => document.body`（或一个 ref）只在 effect 和 handler 里被读到，而那里 `getTargetElement` 早已在没有 `window` 时直接返回：

```tsx
const [, setLocked] = useScrollLock(() => document.body); // ✅ SSR 安全
const [, setLocked] = useScrollLock(document.body);       // ❌ 服务端崩
```

库里所有接受元素 target 的 hook 都是同一条规则，这也是 Next.js / Remix 项目里最常见的 SSR 失误。

### 6. `hidden` 拦手势，不拦程序化滚动

一个 `overflow: hidden` 的盒子依然可以通过 `scrollTop`、`scrollTo`、`scrollIntoView` 滚动——更关键的是，浏览器会为了把新获得焦点的元素带进视口而滚动它。如果焦点跑到了弹窗背后的某个链接上，你「锁住」的页面会滚过去。滚动锁定和焦点陷阱是同一个功能的两半，两个都要做。

## 什么时候不该用 useScrollLock

- **你只想阻止内层滚动容器把滚动传递给页面** → CSS 的 `overscroll-behavior: contain`，一行 JS 都不用。
- **你在用 `<dialog>` 且可以要求 Chrome 144+** → 在 dialog 和它的 `::backdrop` 上写 `overscroll-behavior: contain`，比任何 hook 代码都少。
- **你想滚动到某个东西** → [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/)，或者原生那一行——[昨天讲 scrollIntoView + useRef 的那篇](https://reactuse.com/blog/react-scrollintoview-useref/)把两种都覆盖了。
- **你想读取或响应滚动位置** → [`useScroll`](https://reactuse.com/browser/usescroll/) 或 [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/)。
- **你想要的是真正沉浸、无浏览器外框的视图** → 用 [`useFullscreen`](https://reactuse.com/browser/usefullscreen/)，而不是锁一个滚动容器。
- **你在随着滚动加载更多数据** → [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/)；那里最不需要的就是一把锁。

## 要点回顾

- `overflow: hidden` 在桌面端是正确的机制，在 iOS Safari 上则是不完整的——只有取消 `touchmove`（并且 `passive: false`）才真的能让文档停止橡皮筋。
- [`useScrollLock`](https://reactuse.com/browser/usescrolllock/) 把这层守卫和一个「祖先是否真的可滚动」的判断配在一起，于是页面动不了、而弹窗自己的内容照样能滚——多指缩放也活着。
- 它还原自己替换掉的那个行内 `overflow`，把锁定作为可渲染的 state 暴露出来，并且能作用在任意元素上——当你的应用滚在一个 div 而不是文档里时，这正是你需要的。
- 把锁绑到描述 UI 的那个 state 上（`setLocked(open)` 加一个 cleanup），**每个元素只留一个持有者**，`initialState` 保持 `false`，SSR 下传 getter，再用 `scrollbar-gutter: stable` 处理桌面端抖动。
- 滚动锁定只是弹窗的一半。焦点也要陷住，否则一旦浮层背后的东西拿到焦点，`hidden` 的页面照样会滚。

`useScrollLock`、`useDisclosure`、`useScrollIntoView` 以及另外 110+ 个 SSR 安全、TypeScript 优先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 里——一次安装，支持 tree-shaking，没有需要你操心的依赖。

```bash
npm install @reactuses/core
```
