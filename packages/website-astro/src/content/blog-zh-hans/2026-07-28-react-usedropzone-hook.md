---
title: "React useDropZone Hook：搭建一个文件拖放区（2026）"
description: "一篇实用的 useDropZone 上手指南：dragenter/dragleave 在嵌套元素上的闪烁 bug，以及 hook 内部用计数器修复它的原理、drop 回调的数据形状、搭配 useFileDialog 提供键盘可访问的兜底方案，以及 SSR 安全规则。TypeScript 优先。"
slug: react-usedropzone-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-28
tags: [react, hooks, element, typescript, tutorial]
keywords: [react useDropZone, useDropZone hook, usedropzone react, react 拖放区 hook, react 拖拽上传文件, react 文件拖放, drag and drop react hook, useDropZone typescript, react dragenter dragleave, react 文件上传拖放区]
image: /img/og.png
---

# React useDropZone Hook：搭建一个文件拖放区（2026）

在一个内部有子元素（一个图标、一段文字、一张预览缩略图）的拖放区上拖动文件，手写的 `isOver` 布尔值会开始闪烁：`true`、`false`、`true`、`false`，因为光标从容器边界穿到子元素上又穿回来。文件悬停在拖放区上的整段时间里，高亮边框都在闪。这不是事件处理逻辑写错了，问题出在 `dragenter` 和 `dragleave` 到底是在什么元素上触发的。

[`@reactuses/core`](https://reactuse.com) 的 `useDropZone` 把一个 DOM 元素变成文件拖放目标，且完全没有这种闪烁，还附带一个直接把拖入的 `File[]` 交给你的回调。它的内部实现短到可以一口气读完，所以这篇文章会走一遍它修复的真实 bug 和真实 API，TypeScript 优先。

<!-- truncate -->

## 手写版本，以及它在哪里散架

最直觉的第一次尝试是把 `dragenter`/`dragleave` 配上一个布尔值：

```tsx
function DropZone() {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragEnter={() => setIsOver(true)}
      onDragLeave={() => setIsOver(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        console.log(e.dataTransfer.files);
      }}
      style={{ border: isOver ? "2px solid blue" : "2px dashed gray" }}
    >
      <span>把文件拖到这里</span>
    </div>
  );
}
```

看起来没问题，但只要拖放区里有一个子节点，它就立刻散架了。这里有个不那么直观的关键点：`dragenter` 和 `dragleave` 是在指针当前所在的那个元素上触发的，而且会**冒泡**。把文件拖过上面那个 div 里的 `<span>`，浏览器会依次触发：div 上的 `dragenter`，span 上的 `dragenter`（冒泡到 div，对这个处理函数是空操作），指针跨到 span 上时 div 的 `dragleave`，然后指针再次进入时 span 的 `dragenter`。中间那个 `dragleave` 触发了你的 `setIsOver(false)`，尽管光标根本没有离开拖放区——它只是跨过了一个子元素的边界。只要文件悬停在任何嵌套内容上方，边框就会一直闪。

新手还容易搞错另外两件事：

- **在 `dragover` 上漏调用 `preventDefault()`，`drop` 事件就永远不会触发。** 浏览器对 `dragover` 的默认动作是"拒绝这次放置"——不调用 `preventDefault`，就没有 `drop` 事件，没有例外。
- **放下的内容不是一个普通数组。** `event.dataTransfer.files` 是 `FileList`，不是 `File[]`——转换之前不能 `.map`、不能 `.filter`。

## useDropZone——用一个计数器修好闪烁

```tsx
import { useRef } from 'react';
import { useDropZone } from '@reactuses/core';

function DropZone() {
  const ref = useRef<HTMLDivElement>(null);
  const isOver = useDropZone(ref, (files) => {
    console.log(files); // File[] | null
  });

  return (
    <div ref={ref} style={{ border: isOver ? "2px solid blue" : "2px dashed gray" }}>
      <span>把文件拖到这里</span>
    </div>
  );
}
```

签名：

```ts
function useDropZone(
  target: BasicTarget<EventTarget>,
  onDrop?: (files: File[] | null) => void
): boolean;
```

嵌套 bug 的修复方式是一个普通整数，不是防抖，也不是检查 `relatedTarget`——[真实实现](https://github.com/childrentime/reactuse)短到可以完整贴出来：

```ts
const counter = useRef(0);

useEventListener('dragenter', (e) => {
  e.preventDefault();
  counter.current += 1;
  setOver(true);
}, target);

useEventListener('dragleave', (e) => {
  e.preventDefault();
  counter.current -= 1;
  if (counter.current === 0) setOver(false);
}, target);

useEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  counter.current = 0;
  setOver(false);
  const files = Array.from(e.dataTransfer?.files ?? []);
  onDrop?.(files.length === 0 ? null : files);
}, target);
```

每一次 `dragenter`——不管是容器还是子元素——都让计数器加一；每一次 `dragleave` 都让它减一。`isOver` 只有在计数器归零时才会变回 `false`，而这恰好发生在指针真正离开了整棵子树（包括容器本身）的那一刻。进入一个子元素会先减一再立刻加一（净值为正），所以悬停期间计数永远不会跌到零。这和解决 `mouseenter`/`mouseleave` 链式冒泡问题用的是同一种技巧，只是套用在拖拽事件上。四个事件的 `preventDefault()` 都已经替你调用好了，所以 `drop` 能可靠触发，浏览器也不会尝试跳转去打开被拖入的文件。

## onDrop 到底给了你什么

- **`target` 接受任意 `EventTarget`**，不只是 `HTMLElement`——它是一个 ref，通过库里其他 DOM hook 共用的同一个 `useEventListener` 接线，监听器随组件生命周期自动挂载和卸载。
- **回调收到的是已经转换好的 `File[]`**，从原始 `FileList` 转来——调用处不需要再写一次 `Array.from`。
- **拖入的不是文件——比如一个链接、一段选中文字——回调会传入 `null`**，而不是空数组。用之前先判断 `null`，不要想当然地假设 `files[0]` 存在。
- **一次 drop 会无条件把计数器重置为 `0`。** 即便浏览器的 `dragenter`/`dragleave` 记账因为某种原因漂移了，每次完成的 drop 都会让下一轮悬停从干净状态开始。

## 搭配 useFileDialog：补上可访问性缺口

拖放有一个真实的缺口：它只支持鼠标和触屏。"从桌面拖一个文件"没有键盘等价物，所以一个*只有*拖放功能的区域，对键盘用户和屏幕阅读器用户来说是不可用的。修法是加一个可见的"或浏览文件"兜底，[`useFileDialog`](https://reactuse.com/browser/usefiledialog/) 正是为这种搭配而生——它不需要隐藏的 `<input>` 就能打开原生文件选择器：

```tsx
import { useRef } from 'react';
import { useDropZone, useFileDialog } from '@reactuses/core';

function Uploader({ onFiles }: { onFiles: (files: File[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isOver = useDropZone(ref, (files) => files && onFiles(files));
  const [dialogFiles, open] = useFileDialog({ accept: 'image/*' });

  return (
    <div ref={ref} style={{ border: isOver ? "2px solid blue" : "2px dashed gray" }}>
      <p>把文件拖到这里，或者</p>
      <button onClick={() => open()}>浏览文件</button>
    </div>
  );
}
```

同一个视觉拖放目标，再加一个键盘用户能 tab 到并激活的真正 `<button>`——两条路径通向同一个上传流程。

## 真实使用场景

- **自定义样式的上传组件。** 默认的 `<input type="file">` 在大多数浏览器里几乎没法重新设计样式；`useDropZone` + `useFileDialog` 的组合能让拖放目标的外观完全可控，同时保留拖拽和点击两条路径。
- **图片画廊和媒体管理器。** 把一批图片拖到画廊网格上，把每个 `File` 喂给 [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/)，在任何上传请求完成之前就拿到即时的 `blob:` 预览地址。
- **CMS 和表单构建器的拖放目标。** 接受拖入资源的编辑器（一个主图字段、一个文档附件槽位）正好需要这种不闪烁的 `isOver` 状态，才能渲染出让人信服的"拖到这里"高亮。
- **多拖放区上传器。** 因为 `target` 只是一个 ref，同一个 hook 分别绑定不同的 ref，就能让每个拖放区（比如一个表单里的"封面图"和"画廊图片"）拥有各自独立、正确隔离的悬停状态。

## SSR 安全性

`useDropZone` 在顶层从不触碰 `document` 或 `window`——四个监听器全部通过 `useEventListener` 挂载，而它只在组件已经在客户端挂载之后的 effect 里运行。在服务端，`isOver` 就渲染成它的初始值 `false`，此时也还没有 DOM 可以挂载监听器，所以完全没有需要防范的 hydration 不匹配——不像那些读取"服务端和客户端可能不一致的值"（比如 cookie、`localStorage`）的 hook。这里不需要额外配置任何东西。

## 要点回顾

- **嵌套闪烁是一个冒泡问题，不是逻辑 bug**——朴素的布尔值切换，只要拖放区里有任何子元素就会立刻出问题。[`useDropZone`](https://reactuse.com/element/usedropzone/) 用一个 enter/leave 计数器修复它，只有指针真正离开整棵子树时才会归零。
- **`dragover` 上的 `preventDefault()` 没有商量余地**——漏调用，`drop` 就永远不会触发。hook 已经替你在全部四个事件上调用好了。
- **`onDrop` 给你的是真正的 `File[]`（或 `null`）**——已经从原始 `FileList` 转换好，`null` 用来区分"没有拖入任何文件"和"拖入了零个文件"这两种情况。
- **单靠拖放会把键盘用户挡在门外**——搭配 [`useFileDialog`](https://reactuse.com/browser/usefiledialog/)，让同一个上传流程始终有一条可点击、可 tab 到的路径。
- **不需要任何 SSR 仪式**——这个 hook 在客户端挂载之前什么都不会附加，所以完全不用为服务端/客户端不一致而设计。

从 [`@reactuses/core`](https://reactuse.com/element/usedropzone/) 拿来用，别再手动调试拖拽事件的冒泡问题了。
