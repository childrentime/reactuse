---
title: "React useFocus Hook：追踪并控制元素焦点状态 (2026)"
description: "React 里处理元素焦点的实用指南：useFocus 给你一个实时的 isFocused 布尔值，外加一个能随时聚焦或失焦元素的 setter——不用手写 focus/blur 监听器，也不用去读那个毫无响应性的 document.activeElement。涵盖浮动标签、失焦校验、按 / 聚焦搜索框、挂载即自动聚焦，以及什么时候该用 CSS :focus-visible、useActiveElement 或 useWindowFocus。TypeScript 优先，SSR 安全。"
slug: react-usefocus-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-14
tags: [react, hooks, element, typescript, tutorial]
keywords: [usefocus, react usefocus, useFocus hook, react 焦点状态, react 输入框焦点, react 聚焦 hook, react 自动聚焦, react focus blur, document.activeElement react, 焦点管理 react, react 浮动标签, 失焦校验 react]
image: /img/og.png
---

# React useFocus Hook：追踪并控制元素焦点状态 (2026)

焦点是交互真正发生的地方——正在接收键盘输入的输入框、键盘用户刚 Tab 到的按钮。但 React 没有为它提供任何 state。`document.activeElement` 知道答案却从不通知你它变了，`autoFocus` 属性只在挂载时触发一次且无法重新触发，而要把焦点用于*渲染*——编辑时显示提示、浮动标签、离开后再校验——就得给每个需要的字段手写 `focus`/`blur` 监听器。

[`@reactuses/core`](https://reactuse.com) 的 [`useFocus`](https://reactuse.com/element/usefocus/) 把这一切压缩成一行：一个组件直接渲染的实时 `isFocused` 布尔值，外加一个随时能按你的逻辑聚焦或失焦元素的 setter。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useRef } from "react";
import { useFocus } from "@reactuses/core";

function SearchField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setFocused] = useFocus(ref);

  return (
    <div className={isFocused ? "field field--active" : "field"}>
      <input ref={ref} placeholder="搜索 hooks…" />
      {isFocused && <kbd className="hint">esc 清空</kbd>}
      <button onClick={() => setFocused(true)}>跳到搜索</button>
    </div>
  );
}
```

集成到此为止。hook 订阅元素的 `focus` 和 `blur` 事件并把它们镜像成 state；`setFocused(true)` 调用 `element.focus()`，`setFocused(false)` 调用 `element.blur()`。一个元组，双向打通——既能观察焦点，也能指挥焦点。

## 为什么不用 autoFocus、activeElement 或纯 CSS？

内置的每个选项都只覆盖问题的一角：

- **CSS `:focus` / `:focus-within`** 在响应是*纯样式*时就是正确工具——边框变色、外发光。用它，零 JavaScript、零重渲染。hook 的用武之地在于焦点要驱动**逻辑或 JSX**：渲染提示面板、决定*何时*校验、用户打字时暂停轮播。
- **`document.activeElement`** 是快照，不是订阅。在 render 里读它，下一次 Tab 它就过期了；焦点移动时没有任何东西会让你的组件重渲染。
- **`autoFocus`** 只在挂载时触发一次，这就是它的全部 API。它不能按需聚焦（"按 `/` 搜索"）、不能失焦，也不告诉你当前状态。
- **在各个 handler 里散落 `ref.current.focus()`** 能用——直到你还需要*知道*元素是否聚焦，于是监听器还是得自己维护。

## 手写版——以及坑在哪

手写版看起来人畜无害：

```tsx
// ⚠️ 手写版——demo 里能跑，应用里漏 bug
function SearchField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    return () => {
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
    };
  }, []);
  // …
}
```

十五行里藏着三个问题：

1. **晚挂载的目标永远接不上线。** `if (!el) return` 只跑一次。如果输入框是条件渲染的——在弹窗里、在某个 tab 后面、在 loading 态之后——effect 早已 return，监听器永远挂不上。空依赖数组表达不了"元素出现时重新运行"。
2. **漏掉初始状态。** 如果在你的 effect 运行之前就有东西聚焦了这个元素（`autoFocus` 属性、路由的焦点恢复），你的 state 是 `false`，而元素正带着焦点坐在那。除了监听器，你还得在挂载时补一次 `document.activeElement` 检查。
3. **每个字段都要复制一遍。** 把这十五行乘以表单里的每个输入框，整个文件大半是管道代码。

`useFocus` 把三个坑全部吸收：target 可以是惰性 getter（`() => document.querySelector(".modal input")`），随 DOM 变化重新解析；挂载时的状态帮你对齐；每个字段就一行。

## useFocus API

```tsx
const [isFocused, setFocused] = useFocus(target, initialValue?);
```

**`target`** 很灵活——手头有什么传什么：

```tsx
useFocus(ref);                                     // ref 对象
useFocus(document.getElementById("search"));       // 元素本身
useFocus(() => document.querySelector(".otp input")); // 惰性 getter
```

SVG 元素也支持——target 类型是 `HTMLElement | SVGElement`，图表里一个可聚焦的 `<circle tabindex="0">` 同样适用。

**`initialValue`**（默认 `false`）是声明式的自动聚焦：传 `true`，hook 会在挂载时聚焦元素。和 `autoFocus` 属性不同，它走的是与 `setFocused` 相同的代码路径，支持 getter 目标，之后你手里还握着实时状态。

**`setFocused`** 是自带兜底的命令式控制：`true` → `element.focus()`，`false` → `element.blur()`。目标还不存在时，调用是安全的 no-op 而不是崩溃。

## 真实场景

### 浮动标签——标签自己知道何时上浮

Material 风格输入框：标签待在字段里，字段活跃*或*有内容时上浮。

```tsx
function FloatingLabelInput({ label }: { label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused] = useFocus(ref);
  const [value, setValue] = useState("");

  const floated = isFocused || value.length > 0;

  return (
    <label className="float-field">
      <span className={floated ? "float-label up" : "float-label"}>
        {label}
      </span>
      <input ref={ref} value={value} onChange={e => setValue(e.target.value)} />
    </label>
  );
}
```

纯 CSS 用 `:focus-within` + `:placeholder-shown` 能逼近，但上浮条件一旦涉及应用状态——受控 value、校验标记——你就需要*作为 state 的焦点*，这就是它。

### 失焦时校验，而不是每次击键

对一个刚敲了三个字符的用户吼"邮箱格式错误"是经典的表单 UX 翻车。解法是 *touched* 语义——用户离开字段后才校验：

```tsx
function EmailField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused] = useFocus(ref);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isFocused) return;      // 还在编辑——保持安静
    if (value) setTouched(true); // 带着内容离开了字段 → 开始评判
  }, [isFocused, value]);

  const error = touched && !isFocused && !value.includes("@");

  return (
    <div>
      <input ref={ref} value={value} onChange={e => setValue(e.target.value)} />
      {error && <p className="error">这看起来不像一个邮箱地址。</p>}
    </div>
  );
}
```

`isFocused` 的翻转*就是* touched 信号——不用层层透传 `onBlur`，而且用户回来修正的那一刻错误自动消失。

### 按 `/` 聚焦搜索

每个文档站都有这个功能，`setFocused` 加 [`useEventListener`](https://reactuse.com/effect/useeventlistener/) 就是完整实现：

```tsx
function DocSearch() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setFocused] = useFocus(ref);

  useEventListener("keydown", (e) => {
    if (e.key === "/" && !isFocused) {
      e.preventDefault();     // 别把斜杠打进去
      setFocused(true);
    }
    if (e.key === "Escape") setFocused(false);
  });

  return <input ref={ref} placeholder="按 / 搜索" />;
}
```

注意元组的两半各司其职：`isFocused` 防止劫持用户正*往输入框里*敲的 `/`，`setFocused` 负责跳转。

### 条件渲染也不怕的自动聚焦

聚焦弹窗表单的第一个字段，而这个输入框在 [`useDisclosure`](https://reactuse.com/state/usedisclosure/) 点头之前根本不存在：

```tsx
function RenameDialog({ open }: { open: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useFocus(ref, true); // 挂载即聚焦——也就是弹窗打开的那一刻

  if (!open) return null;
  return (
    <dialog open>
      <input ref={ref} defaultValue="untitled.md" />
    </dialog>
  );
}
```

因为组件（连同 hook）在弹窗打开时才挂载，`initialValue: true` 恰好在正确的时机触发——不需要 `setTimeout(…, 0)` 之类的咒语。

## useFocus 与它的兄弟们

`@reactuses/core` 提供三个焦点 hook，对应三个缩放级别——按你要问的问题选：

| Hook | 回答的问题 | 什么时候用 |
| --- | --- | --- |
| [`useFocus`](https://reactuse.com/element/usefocus/) | "**这个元素**聚焦了吗？"+ 控制 | 字段级 UI：标签、提示、校验时机、快捷键 |
| [`useActiveElement`](https://reactuse.com/element/useactiveelement/) | "全文档范围内**哪个元素**持有焦点？" | 表单级逻辑、焦点调试、roving-focus 组件 |
| [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) | "**标签页/窗口**本身有焦点吗？" | 用户切走时暂停轮询或动画 |
| CSS `:focus` / `:focus-visible` | 仅样式 | 任何纯 CSS 能解决的响应——永远先试它 |

经验法则：单个元素 → `useFocus`；整个文档 → [`useActiveElement`](https://reactuse.com/element/useactiveelement/)；浏览器窗口本身 → [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/)。

## 生产环境注意事项

- **SSR 已处理。** 服务端没有 DOM；hook 渲染你给的 `initialValue`，水合后再挂监听器——你的代码里不需要 `typeof window` 守卫。
- **`element.focus()` 会滚动页面。** 浏览器会把新聚焦的元素滚进视口。页面加载时自动聚焦一个首屏以下的元素会猛拽视口——`initialValue: true` 留给用户视线所在的元素（弹窗、行内编辑器）。
- **别偷焦点。** 移动焦点是无障碍动作，不是视觉动作：屏幕阅读器会朗读新聚焦的元素，键盘用户会丢失位置。只在*用户意图*下聚焦（快捷键、打开弹窗），永远不要在定时器或数据刷新里聚焦。
- **失焦会把焦点丢给 `<body>`。** `setFocused(false)` 不会把焦点还回原处——关闭弹窗后，请显式把焦点交还给触发按钮。
- **样式交给 `:focus-visible`，逻辑交给 `isFocused`。** 键盘专属的焦点环是 CSS 已解决的问题；把环留在 CSS 里，把 hook 的 state 花在逻辑上。相关的关注点也按同样方式组合——点击字段外部是 [`useClickOutside`](https://reactuse.com/element/useclickoutside/) 的事，不该用 blur hack。

## 要点回顾

- React 没有焦点 state，原生原语也拼不出一个：`document.activeElement` 没有响应性，`autoFocus` 只触发一次，手写监听器会漏掉晚挂载的元素和挂载前已聚焦的情况。[`useFocus`](https://reactuse.com/element/usefocus/) 就是那个缺失的 `[isFocused, setFocused]` 元组。
- setter 是双向控制——`true` 聚焦，`false` 失焦，元素还不存在时安全跳过；`initialValue: true` 是声明式自动聚焦，精确落在挂载那一刻。
- 杀手级场景都是时机场景：编辑时浮动标签、离开后才校验、按 `/` 跳搜索、弹窗第一个字段一出现就聚焦。
- 纯样式归 CSS 的 `:focus` 和 `:focus-visible`——把 hook 花在逻辑和 JSX 上。选对缩放级别：元素 → `useFocus`，文档 → [`useActiveElement`](https://reactuse.com/element/useactiveelement/)，窗口 → [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/)。
- 焦点是无障碍界面：跟随用户意图移动它，永远不偷它，用完把它还回原处。

`useFocus` 和其他 110+ 个 SSR 安全、TypeScript 优先的 hooks 都在 [`@reactuses/core`](https://reactuse.com)——一次安装，可摇树优化，没有需要看护的依赖。

```bash
npm install @reactuses/core
```
