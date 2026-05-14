---
title: "React 文件处理：上传、拖放区与对象 URL"
description: "用 ReactUse 中可组合的 Hook 在 React 中构建文件选择器、拖放上传区、图片预览和动态脚本加载器。"
slug: react-file-handling
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, files, upload, tutorial]
keywords: [react file upload, useFileDialog, useDropZone, useObjectUrl, react drag and drop upload, useScriptTag, react file preview, react upload hook]
image: /img/og.png
---

# React 文件处理：上传、拖放区与对象 URL

任何稍有规模的应用最终都要处理文件。个人资料编辑页要传头像。笔记应用要附加图片。CSV 导入器要拖放区。相册要在客户端生成缩略图。而每一个这样的功能都要从零开始重做一遍——因为 React 里的文件处理同时涉及三套浏览器 API（`<input type="file">`、Drag and Drop API、`URL.createObjectURL`），再加上 React 本身的 ref 和 effect 机制——大多数开发者每次都从头把它们拼一遍。

<!-- truncate -->

本文将带你过一遍每个 React 应用迟早都会遇到的四个文件处理基本能力：一个不需要在 DOM 里渲染隐藏 `<input>` 的文件选择器、一个能接收拖入文件的拖放区、一个不会泄漏内存的对象 URL 助手，以及一个按需加载第三方库的脚本标签加载器。每一个我们都会先写出手动实现，让你看清底层在做什么，然后再换成 [ReactUse](https://reactuse.com) 里专门的 Hook。最后我们会把四个 Hook 组合成一个完整的照片上传组件，集挑选、拖放、预览和按需加载图片库于一身。

## 1. 不用隐藏 input 也能选文件

### 手动实现

React 中传统的文件选择写法看起来人畜无害，但暗藏不少坑：

```tsx
import { useRef, useState } from "react";

function ManualFilePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => setFiles(e.target.files)}
      />
      <button onClick={() => inputRef.current?.click()}>
        选择图片
      </button>
      {files && <p>已选 {files.length} 个文件</p>}
    </div>
  );
}
```

它能跑，但只要你想用第二次，缝合的痕迹就藏不住了。隐藏的 `<input>` 仍然在你的渲染树里，你的样式重置必须考虑它的存在。重置选中状态需要写 `inputRef.current.value = ""`——这种命令式的副作用，React 的 lint 规则会跳出来警告你。要是你想在异步处理逻辑里 `await` 用户的选择（比如想在一个处理文件的 async handler 里），你还得自己造一个一次性的 promise。

而且你没法在同一个页面上重复使用同一个组件两次而不让 ref 互相打架。如果用户连续选择同一个文件，第二次 `change` 事件根本不会触发——这是历代 React 开发者都踩过的著名陷阱。

### ReactUse 的方式：useFileDialog

`useFileDialog` 把整个 input 元素从渲染树里抬出去，交给你一个 `[files, open, reset]` 的元组：

```tsx
import { useFileDialog } from "@reactuses/core";

function ImagePicker() {
  const [files, open, reset] = useFileDialog({
    multiple: true,
    accept: "image/*",
  });

  return (
    <div>
      <button onClick={() => open()}>选择图片</button>
      <button onClick={reset} disabled={!files}>
        重置
      </button>
      {files && (
        <ul>
          {Array.from(files).map((file) => (
            <li key={file.name}>
              {file.name} —— {(file.size / 1024).toFixed(1)} KB
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

手动版本忽略的三件小事，但都很重要：

1. **没有隐藏 DOM**。input 在内存里创建，不在你的渲染树里。组件输出就是按钮本身。
2. **每次调用都能传参**。在 `open()` 上直接传选项，可以覆盖 Hook 级别的默认值。想让同一个选择器既能选文档又能选图片？调用时再传 `accept` 就行。
3. **真正的重置**。`reset()` 同时清空 React state 和底层 input，所以同一个文件可以再选一次。

`open()` 函数还会返回一个 promise，resolve 时给你已选的文件。这让异步流程清爽得多：

```tsx
const handleUpload = async () => {
  const picked = await open();
  if (!picked) return;
  await uploadAll(Array.from(picked));
};
```

你不再需要把逻辑切分到 `onChange` 和按钮的点击处理函数之间。选择器就是一个可以 `await` 的函数。

## 2. 拖放文件区

### 手动实现

拖放是那种"教程里看着简单，生产环境里裂得稀碎"的 API。最直白的版本：

```tsx
function ManualDropZone({ onFiles }: { onFiles: (f: File[]) => void }) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      style={{
        border: over ? "2px solid blue" : "2px dashed gray",
        padding: 40,
      }}
    >
      把文件拖到这里
    </div>
  );
}
```

这个版本看似没问题，直到用户拖到子元素上时一切都崩了。光标一踏进子元素，浏览器就在父元素上触发 `dragleave`，尽管从逻辑上看文件还在区域内。你的边框开始闪烁，`over` state 变成谎言。要正确修复它，你得用计数器跟踪 `dragenter` 和 `dragleave`，每次离开就减一，只有当计数器归零时才认定文件"离开"了。还得记得在 `dragover` 上调 `preventDefault`——否则 drop 根本不会触发——并且记住 `dataTransfer.files` 是 `FileList` 而不是数组。

大多数生产环境里的拖放区都做错了。闪烁就是破绽。

### ReactUse 的方式：useDropZone

`useDropZone` 替你跳完了这套计数器舞蹈：

```tsx
import { useRef } from "react";
import { useDropZone } from "@reactuses/core";

function CsvDropZone() {
  const dropRef = useRef<HTMLDivElement>(null);
  const isOver = useDropZone(dropRef, (files) => {
    if (!files) return;
    const csvs = files.filter((f) => f.name.endsWith(".csv"));
    console.log("拖入的 CSV：", csvs);
  });

  return (
    <div
      ref={dropRef}
      style={{
        border: isOver ? "2px solid #3b82f6" : "2px dashed #cbd5e1",
        background: isOver ? "#eff6ff" : "transparent",
        padding: 60,
        borderRadius: 12,
        textAlign: "center",
        transition: "all 120ms ease",
      }}
    >
      <p style={{ margin: 0 }}>
        {isOver ? "松开以上传" : "把 CSV 文件拖到这里"}
      </p>
    </div>
  );
}
```

注意 API 本质上就是 `(target, onDrop) => isOver`。就这么简单。Hook 内部处理 `dragenter`/`dragover`/`dragleave`/`drop`，维护进入/离开计数器，让子元素不会破坏高亮，阻止浏览器默认的"在新标签页打开"行为，最后把一个 boolean 还给你来驱动样式。

回调收到的是 `File[] | null`——`null` 代表一次空拖放（没错，某些浏览器在用户拖入非文件内容时确实会触发）。你的处理函数可以一次判断后就干净地退出。

## 3. 用对象 URL 预览文件

### 手动实现

拿到 `File` 之后，你通常想把它展示给用户看。浏览器给了你 `URL.createObjectURL(blob)`，可以把任何 blob 变成一个临时 URL，扔进 `<img>` 或 `<video>` 就能用。代价是：你创建的每一个 URL 都会占内存，必须记得用完调 `URL.revokeObjectURL`——否则就泄漏了。在 React 里，"用完"通常意味着"组件卸载或文件变化时"，这正是 effect 存在的意义，也正是开发者最容易忘记的事情：

```tsx
function ManualImagePreview({ file }: { file: File | null }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!file) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  if (!url) return null;
  return <img src={url} alt={file?.name} />;
}
```

这是对的，但是那种"再不小心改一笔就漏的对"。清理函数和 `createObjectURL` 调用要永远成对存在。多加一个条件 return 或者忘了一个依赖，就会出现一个只有在长会话里才暴露的 bug。

### ReactUse 的方式：useObjectUrl

`useObjectUrl` 是那段 effect 的单行版：

```tsx
import { useObjectUrl } from "@reactuses/core";

function ImagePreview({ file }: { file: File }) {
  const url = useObjectUrl(file);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={file.name}
      style={{ maxWidth: 200, borderRadius: 8 }}
    />
  );
}
```

Hook 接管了生命周期。当 `file` prop 变化时，它会回收旧 URL 并创建新 URL。组件卸载时，它会回收最后一个。你不可能忘记清理，因为你压根就没写过它。

## 4. 按需加载第三方脚本

### 手动实现

有时候你想处理的文件，对应的库太大或太冷门，不值得放进主包。图片裁剪库、PDF 解析器、OCR 引擎、视频转码器——它们都是几十 MB 的体积，对那些从不上传文件的用户来说一文不值。你只想在第一个文件到来之后才付出这个代价。

在 React 里手动加载脚本标签本身就是一道菜谱：

```tsx
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`加载失败 ${src}`));
    document.head.appendChild(el);
  });
}

function ManualImageProcessor() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadScript("https://cdn.example.com/heavy-image-lib.js")
      .then(() => setReady(true))
      .catch(console.error);
    // 没有清理 —— 一旦加载就保留
  }, []);

  return ready ? <Editor /> : <p>正在加载编辑器...</p>;
}
```

这覆盖了正常路径，但忽略了乱七八糟的情况：如果两个组件同时请求同一个脚本（竞态条件）怎么办？如果脚本加载失败你想重试怎么办？如果你想在组件消失时主动卸载它怎么办？

### ReactUse 的方式：useScriptTag

`useScriptTag` 给你的就是你本来要写的那些原语，但边界情况都已经处理好：

```tsx
import { useScriptTag } from "@reactuses/core";

function HeavyImageEditor() {
  const [, status, , unload] = useScriptTag(
    "https://cdn.example.com/image-editor.js",
    () => console.log("编辑器库已就绪"),
    { manual: false, async: true },
  );

  if (status === "loading") return <p>正在下载编辑器...</p>;
  if (status === "error") return <p>编辑器加载失败</p>;
  if (status !== "ready") return null;

  return <ImageEditorComponent onClose={unload} />;
}
```

四样白送的好处：

1. **单例行为**。同一个脚本 URL 被请求两次，Hook 会去重——没有竞态，没有重复加载。
2. **状态机**。`idle`/`loading`/`ready`/`error` 让你在每一步都能渲染恰当的内容。
3. **手动控制**。设置 `manual: true`，脚本要等你显式调用返回的 `load()` 才会加载——非常适合"首次交互时再加载"的模式。
4. **卸载**。调用 `unload()` 可以把 script 标签从 document 里移除。如果你想在用户关闭编辑器后把那个庞大的库从内存里清掉，这就派上用场了。

## 全部组合：照片上传组件

现在我们把四个 Hook 组合成一个组件：一个允许用户挑选或拖入图片、即时预览、并在第一次需要时延迟加载一个假想的客户端图片缩放库的照片上传组件。

```tsx
import { useRef, useState } from "react";
import {
  useFileDialog,
  useDropZone,
  useObjectUrl,
  useScriptTag,
} from "@reactuses/core";

interface QueuedImage {
  file: File;
  id: string;
}

function Thumbnail({ image }: { image: QueuedImage }) {
  const url = useObjectUrl(image.file);
  return (
    <figure
      style={{
        margin: 0,
        padding: 8,
        background: "#f8fafc",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      {url && (
        <img
          src={url}
          alt={image.file.name}
          style={{
            width: 120,
            height: 120,
            objectFit: "cover",
            borderRadius: 4,
          }}
        />
      )}
      <figcaption
        style={{
          marginTop: 6,
          fontSize: 12,
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {image.file.name}
      </figcaption>
    </figure>
  );
}

function PhotoUploadWidget() {
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [shouldLoadResizer, setShouldLoadResizer] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const [, openPicker, resetPicker] = useFileDialog({
    multiple: true,
    accept: "image/*",
  });

  const isOver = useDropZone(dropRef, (files) => {
    if (!files) return;
    addFiles(files);
  });

  const [, resizerStatus] = useScriptTag(
    "https://cdn.example.com/image-resize.js",
    () => console.log("缩放器已就绪"),
    { manual: !shouldLoadResizer },
  );

  const addFiles = (files: File[]) => {
    const newImages = files
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        file,
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
      }));
    setQueue((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) setShouldLoadResizer(true);
  };

  const handlePick = async () => {
    const picked = await openPicker();
    if (picked) addFiles(Array.from(picked));
  };

  const clearAll = () => {
    setQueue([]);
    resetPicker();
  };

  return (
    <div style={{ maxWidth: 720, fontFamily: "system-ui, sans-serif" }}>
      <div
        ref={dropRef}
        style={{
          border: isOver ? "2px solid #3b82f6" : "2px dashed #cbd5e1",
          background: isOver ? "#eff6ff" : "#ffffff",
          padding: 48,
          borderRadius: 16,
          textAlign: "center",
          transition: "all 120ms ease",
        }}
      >
        <p style={{ marginTop: 0, fontSize: 18 }}>
          {isOver ? "松开即可上传" : "把照片拖到这里"}
        </p>
        <button
          onClick={handlePick}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #3b82f6",
            background: "#3b82f6",
            color: "white",
            cursor: "pointer",
          }}
        >
          或从设备中选择
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, color: "#64748b" }}>
          已排队 {queue.length} 张图片
          {shouldLoadResizer && ` —— 缩放器：${resizerStatus}`}
        </span>
        {queue.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
            }}
          >
            全部清空
          </button>
        )}
      </div>

      {queue.length > 0 && (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {queue.map((image) => (
            <Thumbnail key={image.id} image={image} />
          ))}
        </div>
      )}
    </div>
  );
}
```

四个 Hook，四个职责，互不重叠：

- **`useFileDialog`** 负责"点击挑选"流程，并提供可 await 的 promise
- **`useDropZone`** 处理拖放，并解决子元素引发的边框闪烁
- **`useObjectUrl`** 为每个缩略图生成并回收预览 URL，绑定到组件生命周期
- **`useScriptTag`** 只在第一张图片到来后延迟加载缩放库，并且整个会话只加载一次

组合很自然，因为每个 Hook 只做一件事。Hook 之间不共享 ref，effect 不会级联。你最终发布的组件大概 100 行，大部分是标签和样式，那些棘手的浏览器底层活计被藏在已经经过测试和 SSR 加固的 Hook 里。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hook

- [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) —— 打开文件选择器，无需在 DOM 中渲染隐藏的 input
- [`useDropZone`](https://reactuse.com/element/usedropzone/) —— 跟踪文件拖入元素的状态，正确处理子元素事件
- [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/) —— 为 File 和 Blob 创建并自动回收 URL
- [`useScriptTag`](https://reactuse.com/browser/usescripttag/) —— 动态加载外部脚本，带状态跟踪和卸载支持
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) —— 声明式地附加事件监听器，可用于自定义上传进度事件
- [`useSupported`](https://reactuse.com/state/usesupported/) —— 响应式地检查浏览器是否支持某个 API

---

ReactUse 提供了 100+ 个 React Hook。[全部探索 →](https://reactuse.com)
