---
title: "React 复制到剪贴板：完整指南"
description: "学习如何在 React 中使用现代 Clipboard API 和 useClipboard Hook 将文本复制到剪贴板。涵盖权限、HTTPS 要求、降级方案和常见使用场景。"
slug: react-copy-to-clipboard
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, clipboard, useClipboard]
keywords: [react copy to clipboard, useClipboard, react clipboard api, copy text react, react copy button]
image: /img/og.png
---

# React 复制到剪贴板：完整指南

将文本复制到剪贴板听起来很简单，但在 React 中要正确实现它，涉及到浏览器权限、HTTPS 要求和优雅的降级处理。本指南带你回顾 Web 剪贴板访问的演变历程，并展示当前最简洁的处理方式。

<!-- truncate -->

## 旧方法：document.execCommand

在 Clipboard API 出现之前，复制文本意味着创建一个隐藏的 textarea，选中其内容，然后调用 `document.execCommand("copy")`：

```tsx
function copyToClipboard(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
```

这种方式有严重的问题。它是同步的，会阻塞主线程。需要创建和移除 DOM 元素。已在所有主流浏览器中被弃用，而且在不同设备上行为不一致，尤其是在 iOS 上。

## 现代 Clipboard API

浏览器现在提供了 `navigator.clipboard`，一个基于 Promise 的 API，更简洁、更可靠：

```tsx
await navigator.clipboard.writeText("Hello, world!");
const text = await navigator.clipboard.readText();
```

这是正确的基础方案，但在 React 组件中直接使用它会引入一些挑战。

## 为什么它很棘手

### 权限

Clipboard API 需要用户明确授权。浏览器可能会在允许读取访问前提示用户，有些浏览器如果调用不是来自用户手势（如点击），会静默拒绝访问。

### 仅限 HTTPS

`navigator.clipboard` 仅在安全上下文中可用。如果你的应用在开发时运行在 `http://localhost` 上是没问题的，但任何部署的站点都必须使用 HTTPS。

### SSR 和 Server Components

`navigator.clipboard` 在服务端不存在。如果你使用 Next.js、Remix 或任何 SSR 框架，在模块层级引用它会抛出 `ReferenceError`。

### 降级和错误处理

你需要处理 API 不可用、用户拒绝权限或文档未获得焦点的情况。每次需要复制按钮时都要写大量的防御性代码。

## useClipboard 来拯救

ReactUse 的 [useClipboard](https://reactuse.com/browser/useClipboard/) Hook 将所有这些复杂性封装在一个简单的二元组中：

```tsx
import { useClipboard } from "@reactuses/core";

function App() {
  const [clipboardText, copy] = useClipboard();

  return (
    <div>
      <p>Current clipboard: {clipboardText}</p>
      <button onClick={() => copy("Copied with useClipboard!")}>
        Copy Text
      </button>
    </div>
  );
}
```

该 Hook 返回：

- **`clipboardText`** — 剪贴板的当前内容，在复制、剪切和焦点事件时自动更新。
- **`copy(text)`** — 一个将文本写入剪贴板的异步函数。

在底层，`useClipboard` 监听 `copy`、`cut` 和 `focus` 事件，使显示的剪贴板值保持同步。它还会在文档未获得焦点时阻止读取剪贴板，否则在大多数浏览器中会抛出错误。

## 构建带反馈的复制按钮

用户需要视觉确认复制操作是否成功。这里有一个可复用的组件，会短暂显示"已复制！"消息：

```tsx
import { useState } from "react";
import { useClipboard } from "@reactuses/core";

function CopyButton({ text }: { text: string }) {
  const [, copy] = useClipboard();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copy(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  return (
    <button onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
```

因为 `copy` 返回一个 Promise，你可以捕获错误并为成功和失败状态提供反馈。

## 常见使用场景

### 代码块

为语法高亮的代码块添加复制按钮，让读者无需手动选择文本即可获取代码片段：

```tsx
<div style={{ position: "relative" }}>
  <pre><code>{codeSnippet}</code></pre>
  <CopyButton text={codeSnippet} />
</div>
```

### 分享链接

让用户一键复制可分享的 URL，而不必依赖浏览器的地址栏：

```tsx
<CopyButton text={`https://myapp.com/post/${postId}`} />
```

### 表单值

直接从表单字段复制生成的值，如 API 密钥、邀请码或配置字符串：

```tsx
function ApiKeyField({ apiKey }: { apiKey: string }) {
  const [, copy] = useClipboard();

  return (
    <div>
      <input readOnly value={apiKey} />
      <button onClick={() => copy(apiKey)}>Copy Key</button>
    </div>
  );
}
```

## 安装

```bash
npm i @reactuses/core
```

然后导入 Hook：

```tsx
import { useClipboard } from "@reactuses/core";
```

## 相关 Hooks

- [useClipboard 文档](https://reactuse.com/browser/useClipboard/) — 完整 API 参考和在线演示
- [usePermission](https://reactuse.com/browser/usePermission/) — 检查剪贴板读取权限是否已被授予
- [useEventListener](https://reactuse.com/effect/useEventListener/) — useClipboard 内部使用的底层 Hook
- [useSupported](https://reactuse.com/browser/useSupported/) — 检测当前环境中 Clipboard API 是否可用

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
