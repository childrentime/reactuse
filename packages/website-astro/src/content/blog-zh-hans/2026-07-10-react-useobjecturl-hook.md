---
title: "React useObjectUrl Hook：预览文件与 Blob，不留内存泄漏（2026）"
description: "一篇实用的 useObjectUrl 上手指南：把任意 File、Blob 或 MediaSource 转成 URL.createObjectURL() 字符串，并在每次来源变化和组件卸载时自动回收，预览 URL 不再在内存里堆积。SSR 安全，TypeScript 优先。"
slug: react-useobjecturl-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-10
tags: [react, hooks, browser-api, typescript, tutorial]
keywords: [react useObjectUrl, useObjectUrl hook, useobjecturl react, react blob url, react 文件预览 hook, URL.createObjectURL react, react 文件上传 内存泄漏, react 图片预览 hook, revokeObjectURL react, react MediaSource hook, react 视频预览, useObjectUrl typescript]
image: /img/og.png
---

# React useObjectUrl Hook：预览文件与 Blob，不留内存泄漏（2026）

用户往图片编辑器里上传了十几张图片，每一张都通过 `URL.createObjectURL()` 生成实时预览。会话持续了二十分钟，预览随着文件的增删不断切换，标签页的内存占用则一路攀升——因为每一次 `createObjectURL()` 调用都必须配对一次 `revokeObjectURL()` 调用，而这个配对关系要在重渲染、props 变化、组件卸载之间始终成立。大多数组件都没做对，而这个 bug 要等到有人把标签页开得够久、注意到风扇转起来了才会被发现。

`useObjectUrl` 就是那个一行代码的修复：把 `File`、`Blob` 或 `MediaSource` 丢给它，拿回一个 URL 字符串，再也不用自己调用 `revokeObjectURL`。以下都是 [`@reactuses/core`](https://reactuse.com) 的真实 API，TypeScript 优先。

<!-- truncate -->

## 手写版本，以及它在哪里泄漏

`URL.createObjectURL()` 是浏览器里支撑一切客户端文件预览的 API：传给它一个 `Blob`（`File` 就是其中一种），它会返回一个 `blob:` URL，可以直接塞进 `<img src>` 或 `<video src>`。问题出在另一端——它铸造出的每一个 URL 都会持续存活、持有底层数据的引用，直到你显式调用 `URL.revokeObjectURL()`。忘记调用，或者在错误的时机调用，这个 URL——以及它背后的内存——就永远不会被释放。

在 React 组件里，"错误的时机"很容易撞上：

```tsx
function FilePreview({ file }: { file?: File }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!file) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url ? <img src={url} /> : null;
}
```

这一版其实是对的——清理函数闭包捕获的是 `next`，而不是 state，所以它总能精确回收自己创建的那个 URL。但它"对"的方式,正是手写 effect 常见的那种脆弱：只要一次不小心的重构就会出问题。把 `URL.createObjectURL` 调用挪到 effect 外面、错误地做了 memo、或者从 state 里读 `url` 而不是本地变量 `next`,配对关系就会悄无声息地断裂。把这套模式复制到每一个需要预览文件的组件里——头像上传、聊天附件、图库缩略图——你就是在五个不同的地方维护着同一套脆弱的生命周期逻辑。

## useObjectUrl —— 创建与回收,都替你处理好

```tsx
import { useObjectUrl } from '@reactuses/core';

function FilePreview({ file }: { file?: File }) {
  const url = useObjectUrl(file);
  return url ? <img src={url} /> : null;
}
```

整个 hook 就这么多。签名是:

```ts
function useObjectUrl(object: Blob | MediaSource): string | undefined;
```

传入一个 `Blob`（或者它的子类型 `File`）或 [`MediaSource`](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource)，拿回对应的 object URL——在来源存在之前则是 `undefined`。它内部就是一个 `useEffect`：来源存在时调用 `URL.createObjectURL()`，并返回一个调用 `URL.revokeObjectURL()` 的清理函数。它和手写版本的区别不在行为，而在于这套配对关系只存在于一个经过审查的地方,而不是每个组件各自重新推导一遍。

## 来源变化时,以及组件卸载时

回收会在两个真正重要的时机触发:

- **来源变化。** 把 `file` prop 换成另一个 `File`，hook 会在铸造新 URL 之前先回收旧的——用户逐个点开附件列表时不会产生堆积。
- **组件卸载。** 关闭预览弹窗、跳转到别的页面、从列表里移除某一项——清理函数都会执行，URL 会被释放。不会留下什么等着一个根本不知道要去回收它的垃圾回收器。

第二种情况恰恰是手写代码最常漏掉的一种，因为它只会在真实使用中表现为缓慢的内存爬升,快速的手动测试根本发现不了。

## 真实使用场景

- **文件输入预览。** 在用户提交上传之前，把刚选中的图片、视频或 PDF 展示出来——这是最典型的场景，也是下面演示里用到的那种。
- **Blob API 响应。** 一个返回 `Blob` 的接口（生成的导出文件、带签名的资源、`fetch().blob()` 的结果）可以直接变成可下载的 `<a href>`,或者内联的 `<img>`/`<video>`,不需要先写到磁盘上。
- **Canvas 导出。** `canvas.toBlob()` 会产出一个 `Blob`；把它直接喂给 `useObjectUrl`，就能预览或提供下载用户刚画好、裁剪好的内容。
- **`MediaSource` 用于自定义视频播放器。** `MediaSource` 是 [Media Source Extensions](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) 背后的对象，支撑着自适应流媒体和自定义缓冲的视频——你以编程方式构建这个流，仍然需要一个 URL 交给 `<video src>`。`useObjectUrl` 可以直接接受它，和接受 `Blob` 一样。

## 天生 SSR 安全

`URL.createObjectURL` 在服务端根本不存在——没有 DOM，也就没有 Blob URL 可铸造。`useObjectUrl` 在服务端渲染期间完全不会碰 `URL` API；它会一直返回 `undefined`，直到 effect 在客户端运行为止，所以不需要记得写 `typeof window` 判断，也不会有服务端崩溃需要排查。如果你在排查其他手写浏览器 API 代码里的类似缺口，[SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) 讲了这个通用模式。

## 文件处理三件套

`useObjectUrl` 是一小组 hook 里的一环，这组 hook 覆盖了文件从选取、拖放到预览的完整生命周期:

| Hook | 角色 |
| --- | --- |
| [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) | 打开原生文件选择器，返回选中的 `FileList` |
| [`useDropZone`](https://reactuse.com/element/usedropzone/) | 把任意元素变成文件的拖放目标 |
| [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/) | 把得到的 `File`/`Blob` 转成安全、自动回收的预览 URL |

把 `useFileDialog` 或 `useDropZone` 的结果直接接入 `useObjectUrl`,预览这一步就完全不需要写清理代码。包含多文件图库示例（把三个 hook 组合在一起）的完整讲解在 [React File Handling](https://reactuse.com/blog/react-file-handling/) 里。

## 要点总结

- **核心问题是一个配对 bug。** 每一次 `URL.createObjectURL()` 都需要一次匹配的 `URL.revokeObjectURL()`,而在每一个展示文件预览的组件里重新推导这个配对关系,正是内存泄漏悄悄出现的地方。
- **`useObjectUrl(object)`** 接受一个 `Blob`（或 `File`）或 `MediaSource`，返回 URL 字符串,在来源存在之前则是 `undefined`。
- **回收是自动的**，在两个真正重要的时机都会触发：来源变化,以及组件卸载。
- 覆盖的不只是图片预览：Blob API 响应、`canvas.toBlob()` 导出，以及用于自定义视频播放器的 `MediaSource`。
- **SSR 安全**——在服务端返回 `undefined`，不访问 `URL` API，不需要写任何守卫代码。
- 搭配 [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) 和 [`useDropZone`](https://reactuse.com/element/usedropzone/)，选取、拖放、预览三步都不需要手动管理生命周期。

从 [`@reactuses/core`](https://reactuse.com/browser/useobjecturl/) 里拿走它，别再为漏掉的 `revokeObjectURL` 调用排查组件了。
