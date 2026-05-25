---
title: "React 指针 Hook:Hover、长按、双击、刮擦和点击外部,告别那些经典 bug"
description: "指针事件是一片沼泽——鼠标对触摸、单击对双击、子元素让 hover 闪烁、长按触发 iOS 幽灵点击、portal 让点击外部失效。本文梳理 ReactUse 中六个用于指针与手势处理的 hook:useHover、useMousePressed、useLongPress、useDoubleClick、useClickOutside、useScratch,以及它们各自消除的 bug。"
slug: react-pointer-gesture-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-25
tags: [react, hooks, ui, tutorial]
keywords: [react hover hook, react useHover, react 长按 hook, react useLongPress, react 双击 hook, react useDoubleClick, react 点击外部, react useClickOutside, react useClickAway, react 鼠标按下, react useMousePressed, react 拖拽手势, react useScratch, react 触摸事件, react ios 幽灵点击, react 手势 hook]
image: /img/og.png
---

# React 指针 Hook:Hover、长按、双击、刮擦和点击外部,告别那些经典 bug

指针事件是 React 中最少被认真讨论的部分,因为大家默认它"早就被解决了"。它没有。标准答案——`onMouseEnter`、`onClick`、给双击加一个 `setTimeout`、用 window 监听器实现点击外部——在 demo 里都能跑,到了生产环境就全坏。光标越过子元素时它会闪烁。触摸结束 300ms 后它会触发一个 iOS 幽灵点击。它看不到 portal 渲染出去的元素。它把一次双击当成两次单击,因为第二次点击的处理器在第一次还没被取消之前就先跑了。

<!-- truncate -->

DOM 事件模型就这样。浏览器在移动端和桌面端用了不同的手势管线,`dblclick` 规范比 React 还老,而 `composedPath()` 是穿过 shadow 边界与 portal 唯一可靠的方法。这些都不会变。能变的是:你的应用里每个组件是不是都要从头重写一遍这些 workaround。

[ReactUse](https://reactuse.com) 提供六个小而专的指针 hook,正好补上这些缺口。本文逐个拆解:朴素版本里的 bug、hook 是怎么改的、以及一个你真的会写出来的组件示例。如果你看过[关于 ref 逃生舱的那篇](/blog/react-ref-escape-hatch/),有个细节会眼熟——这些 hook 内部大多用了 [`useLatest`](https://reactuse.com/state/uselatest/),让监听器在回调身份变动时依然稳定。

## 为什么指针事件是沼泽

举个两行例子。一个点击外部就关闭的下拉菜单:

```tsx
function Dropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return <div ref={ref}>{open && <Menu />}</div>;
}
```

四个问题。第一,没有 `touchstart` 监听,移动端关不掉。第二,`contains` 不跨 portal——如果 `<Menu />` 渲染到了 `document.body`,点菜单项反而会把菜单关掉。第三,handler 用的是 `Element.contains` 而不是 `composedPath()`,所以 shadow root 里的任何东西都被当作"外部"。第四,handler 闭包了初次的 `setOpen`;父组件传新的 `onClose` 进来,监听器还是在调老的那个,因为 effect 只在挂载时绑定了一次。

每个问题都是一行就能修。每个一行的修复加起来,就是 hook 为什么写出来是 25 行而不是 5 行。这就是整个论点。

## 1. useHover —— 不会闪烁的悬停状态

[`useHover`](https://reactuse.com/state/usehover/) 返回一个布尔值,代表光标当前是否在目标元素内。签名就是你自己会写的样子:

```tsx
import { useRef } from 'react';
import { useHover } from '@reactuses/core';

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const hovered = useHover(ref);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      {hovered && <div className="tooltip">{label}</div>}
    </div>
  );
}
```

两个细节。hook 监听的是 `mouseenter` 和 `mouseleave`,不是 `mouseover` 和 `mouseout`。`mouseover` 会冒泡,光标跨进任何子元素都会再触发一次,结果你大部分时间都在 `true` 和 `false` 之间闪。`mouseenter` 不冒泡——光标进入外层元素时触发一次,离开时触发一次,不管底下嵌了几层子节点。这也是 CSS `:hover` 在嵌套元素上不会闪的原因:浏览器其实造好了正确的原语,只是把它藏在一个不那么显眼的事件名后面。

另一个细节:`useHover` 接收的是 target ref,而不是 callback ref。hook 通过 ReactUse 的 [`BasicTarget`](https://reactuse.com/state/uselatest/) 辅助类型解析目标,所以你可以传 ref、DOM 节点,或者返回这两者之一的函数——当目标元素来自另一个 hook(比如 [`useDraggable`](https://reactuse.com/element/usedraggable/))时很有用。

## 2. useMousePressed —— 按下状态,还告诉你按的来源

`hovered` 告诉你指针是不是在元素上方。[`useMousePressed`](https://reactuse.com/browser/usemousepressed/) 告诉你指针有没有*按在*元素上——并把鼠标、触摸、拖拽区分成不同的来源,让你可以对每种做不同的反应。

```tsx
import { useRef } from 'react';
import { useMousePressed } from '@reactuses/core';

function PressyButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pressed, source] = useMousePressed(ref, { touch: true, drag: false });

  return (
    <button
      ref={ref}
      className={pressed ? 'pressed' : ''}
      data-source={source} // 'mouse' | 'touch' | null
    >
      {children}
    </button>
  );
}
```

返回元组里有两个值:布尔值,以及一个 `sourceType`,值为 `'mouse' | 'touch' | null`。来源比看上去重要得多。触摸按压不应该走 hover 风格的过渡动画,因为用户的手指正好挡住了元素。拖拽开始时的按压不应该触发按钮的 onClick——你可以用 source 决定要不要忽略这次释放。hook 自己处理监听器清理,包括容易忘掉的 `dragend` 与 `touchcancel`;如果你曾上线过一个"用户拖出去之后还卡在按下态"的按钮,这就是这个 hook 关掉的 bug。

监听目标的选择也有讲究。`mousedown` 绑在元素上,但 `mouseup` 和 `mouseleave` 绑在 *window* 上。这是故意的:如果用户按在按钮上、却在外面松开,你也要能看到这次释放。把 `mouseup` 绑在元素自己上就会错过这种情况——按钮会一直保持"按下"态,直到用户回来再点一次。

## 3. useLongPress —— 长按不带 iOS 幽灵点击

长按就是按住一段可配置的时间后再触发。朴素写法是 `mousedown` 起一个 `setTimeout`,`mouseup` 时清掉:

```tsx
function LongPressable({ onLongPress }: { onLongPress: () => void }) {
  const timer = useRef<number>();
  return (
    <div
      onMouseDown={() => { timer.current = window.setTimeout(onLongPress, 500); }}
      onMouseUp={() => clearTimeout(timer.current)}
    />
  );
}
```

桌面没问题。在 iOS Safari 上,用户从长按上抬起手指后,系统会在 300ms 后再触发一个合成的 `click` 事件——"幽灵点击"——它会触发用户手指落到的下一个元素上的某个无关 handler。修复办法是给被按住的元素挂一个一次性的 `touchend` 监听器并 `preventDefault`,而 [`useLongPress`](https://reactuse.com/browser/uselongpress/) 已经替你做完了这些簿记:

```tsx
import { useLongPress } from '@reactuses/core';

function MessageBubble({ message }: { message: Message }) {
  const [showActions, setShowActions] = useState(false);

  const longPress = useLongPress(
    () => setShowActions(true),
    { delay: 500, isPreventDefault: true },
  );

  return (
    <div className="bubble" {...longPress}>
      {message.text}
      {showActions && <ActionSheet onClose={() => setShowActions(false)} />}
    </div>
  );
}
```

hook 返回一组事件处理器对象——`onMouseDown`、`onMouseUp`、`onMouseLeave`、`onTouchStart`、`onTouchEnd`——你把它展开到元素上,监听器布线就走在 React 的合成事件系统里,而不是裸 `addEventListener`。这点很重要:合成事件能和 React 的状态更新正确批处理;长按打开一个弹窗,不会像手写 `addEventListener` 那样多出两次渲染。

`isPreventDefault` 默认 `true`,除了滚动场景外几乎都该开着。需要关掉它的一种典型场景是:长按的目标同时可能是用户想滚动经过的东西,比如长按某个列表项打开上下文菜单,但垂直滑动应该继续滚动列表。

## 4. useDoubleClick —— 单击 vs 双击,不竞态

浏览器有 `dblclick` 事件,但它是*在两次 click 之外*再触发一次,不是替代。如果你同时挂 `onClick` 与 `onDoubleClick`,每次双击都会顺带触发两次单击 handler。标准修法是开一个去抖窗口——数 click 数,等过了间隔,再按数量分发是单击还是双击:

```tsx
import { useRef } from 'react';
import { useDoubleClick } from '@reactuses/core';

function FileRow({ file }: { file: File }) {
  const ref = useRef<HTMLDivElement>(null);

  useDoubleClick({
    target: ref,
    latency: 250,
    onSingleClick: () => selectFile(file),
    onDoubleClick: () => openFile(file),
  });

  return <div ref={ref} className="row">{file.name}</div>;
}
```

[`useDoubleClick`](https://reactuse.com/element/usedoubleclick/) 接收一个 target、两个回调和一个 `latency`。点一下,等 `latency` 毫秒;期间没别的就是单击。`latency` 内点两下,就是双击,单击回调不会再触发。默认 300ms 和大多数桌面文件管理器对齐;UI 要更利索可以压到 200ms,面向年长用户或触摸优先的界面可以拉到 500ms。

hook 也会对 `touchend` 调用 `preventDefault`,把 iOS 的"双击缩放"行为提前拦下来,否则用户双击一条列表项的时候,页面会被缩放。这种默认行为你不会注意到,直到它缺席,然后内测同学开始报 bug。

## 5. useClickOutside —— 点击外部就关闭,穿透 portal

[`useClickOutside`](https://reactuse.com/element/useclickoutside/)(也以 [`useClickAway`](https://reactuse.com/element/useclickaway/) 的别名导出,兼容旧 API 命名)就是"用户点到别处就关掉"的那个 hook。朴素的 `contains` 在 portal 和 shadow DOM 上会失效;hook 用的是 `composedPath()`,它会走完事件经过的完整路径,包括穿过 shadow 边界和 portal 回到它的逻辑父节点。

```tsx
import { useRef, useState } from 'react';
import { useClickOutside } from '@reactuses/core';

function Popover({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="popover-root">
      <button onClick={() => setOpen((o) => !o)}>{trigger}</button>
      {open && <div className="popover-content">{children}</div>}
    </div>
  );
}
```

hook 同时监听 `mousedown` 和 `touchstart`,不是 `click`。`mousedown` 在 `mouseup` 和 `click` 之前触发,意思是按压一发生下拉就关——比 click 事件触发到目标元素上的任何 handler 都还早。手感是对的。如果你听的是 `click`,目标元素上的 click handler 会先跑、然后下拉才关;要是这个 handler 还顺手打开了一个 modal,你就会看到 modal 闪一下、然后下拉的关闭再涌过来。

第三个参数是 `enabled` 布尔。菜单隐藏时传 `false`,完全不跑监听器——小事,但页面上要是有五十个下拉,你就有五十个全局 `mousedown` 监听器,代价会累积。

要注意的一点:hook 通过 [`useLatest`](https://reactuse.com/state/uselatest/) 闭包 `handler`,所以即便你每次渲染都传一个新函数,监听器也保持稳定。也就是说你可以放心写 `useClickOutside(ref, () => setOpen(false))` 这种内联写法,不用担心监听器重绑——和 [ref 逃生舱](/blog/react-ref-escape-hatch/) 那篇详细讲过的是同一个套路。

## 6. useScratch —— 拖拽过程中元素内相对坐标

[`useScratch`](https://reactuse.com/browser/usescratch/) 是任何"需要知道拖拽时指针在元素*哪里*"的 UI 的主力——颜色选择器、签名板、框选、需要像素级精确跟踪的滑块滑块。hook 返回一个 `state` 对象,包含按压起点位置、当前位置、与上一帧的增量、是否正在 scratching。

```tsx
import { useRef } from 'react';
import { useScratch } from '@reactuses/core';

function ColorPicker() {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y, isScratching } = useScratch(ref);

  const hue = x != null ? (x / 240) * 360 : 0;

  return (
    <div
      ref={ref}
      style={{
        width: 240,
        height: 24,
        background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
        position: 'relative',
        cursor: 'crosshair',
      }}
    >
      {x != null && (
        <div
          style={{
            position: 'absolute',
            left: x - 2,
            top: 0,
            width: 4,
            height: 24,
            background: isScratching ? '#000' : '#444',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
```

两个实现细节值得知道。第一,位置更新走的是 [`useRafState`](https://reactuse.com/state/uselatest/),React 最多每帧重渲染一次——手指 120Hz 划过元素,组件还是按 60Hz 渲染。没有 rAF 批处理的话,一次快速拖动会按每个 `mousemove` 来一次渲染,高 DPI 触屏上一秒就是上百次。

第二,hook 把 `mousemove` 和 `mouseup` 监听器挂在 *document* 上,只有 `mousedown` 挂在元素上。这也是 `useMousePressed` 监听 window 的原因——按压一旦开始,拖拽就可能离开原来的包围盒,你仍然要跟踪。监听器要是挂在元素上,用户往外拖几个像素手势就断了。

回调——`onScratch`、`onScratchStart`、`onScratchEnd`——通过 `useLatest` ref 读取,所以你可以传捕获组件 state 的闭包而不打破 memoization。签名板模式很典型,`onScratch` 需要用最新的 `strokeColor` 往 canvas 上画。

## 组装起来:一个上下文菜单

一个把这些 hook 里的四个组合在一起的小例子。长按打开上下文菜单,菜单点击外部关闭,触发器在按压期间显示按下态,菜单项支持双击执行"默认动作":

```tsx
import { useRef, useState } from 'react';
import {
  useLongPress,
  useMousePressed,
  useClickOutside,
  useDoubleClick,
} from '@reactuses/core';

function ContextMenuItem({ label, onSelect }: { label: string; onSelect: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  useDoubleClick({
    target: ref,
    latency: 200,
    onSingleClick: () => {/* 与 hover 等价:不做事 */},
    onDoubleClick: onSelect,
  });
  return <li ref={ref}>{label}</li>;
}

function ContextTarget({ items }: { items: Array<{ label: string; onSelect: () => void }> }) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);

  const [pressed] = useMousePressed(triggerRef, { drag: false });
  const longPress = useLongPress(() => setOpen(true), { delay: 400 });

  useClickOutside(menuRef, () => setOpen(false), open);

  return (
    <>
      <div
        ref={triggerRef}
        className={`target ${pressed ? 'pressed' : ''}`}
        {...longPress}
      >
        按住我
      </div>
      {open && (
        <ul ref={menuRef} className="menu">
          {items.map((item) => (
            <ContextMenuItem key={item.label} {...item} />
          ))}
        </ul>
      )}
    </>
  );
}
```

四个 hook,调用方各十行代码。不用它们的等价组件,在你处理完 iOS 幽灵点击、portal 友好的点击外部、rAF 批处理的按下态、单击双击分发之后,大概要 120 行。十行意图 vs 一百行管线——这个比例就是把库装上、而不是把同一份 workaround 粘到十个组件里的理由。

## 什么时候用哪个

| 你想响应的是                                  | 用                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| 光标进入 / 离开某个元素                       | [`useHover`](https://reactuse.com/state/usehover/)                        |
| 指针当前是否按在某个元素上                    | [`useMousePressed`](https://reactuse.com/browser/usemousepressed/)        |
| 长按 `N` 毫秒(尤其是移动端)                | [`useLongPress`](https://reactuse.com/browser/uselongpress/)              |
| 单击 vs 双击,不会被双触发                    | [`useDoubleClick`](https://reactuse.com/element/usedoubleclick/)          |
| 元素之外任何地方的点击(下拉、modal、弹层)  | [`useClickOutside`](https://reactuse.com/element/useclickoutside/)        |
| 拖拽时指针在元素内的位置                      | [`useScratch`](https://reactuse.com/browser/usescratch/)                  |

两条非规则。如果你想要一个能跟着指针移动的可拖元素(浮层面板、便签),用 [`useDraggable`](https://reactuse.com/element/usedraggable/) ——`useScratch` 给你坐标但不会动元素。如果你想要的是焦点而不是按压,用 [`useFocus`](https://reactuse.com/element/usefocus/) 或 [`useActiveElement`](https://reactuse.com/element/useactiveelement/);"按下的按钮"和"获得焦点的按钮"是两回事,而且通常你两者都要。

## 安装

```bash
npm install @reactuses/core
# 或
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

六个 hook 都能单独 tree-shake——`import useHover` 不会把 `useScratch` 一起拖进来。每个都带 TypeScript 类型,客户端渲染应用与 SSR 框架(Next.js、Remix、Astro)都能用;需要 DOM 的监听器在服务端会 no-op,hook 在 hydration 之前返回安全默认值。

## 相关 Hook

如果指针交互是你的瓶颈,有两篇相邻的 ReactUse 文章值得一读。[Observer hook 那篇](/blog/react-observer-hooks/) 讲了 `useIntersectionObserver`、`useResizeObserver`、`useMutationObserver`——当"用户做了 X"应该变成"元素进入了 Y 状态"时,它们就是正确的原语。[ref 逃生舱](/blog/react-ref-escape-hatch/) 那篇讲了 `useLatest` 与 `useEvent`,本文里每个 hook 内部都用它们来保持闭包安全;理解它们之后,这些手势 hook 的源码会好读得多。

在 [reactuse.com](https://reactuse.com) 浏览全套,或者直接打开上面任一 hook 的源码——大多数都不到 40 行,你大概会发现一两个自己在自家代码库里重写了多年的。
