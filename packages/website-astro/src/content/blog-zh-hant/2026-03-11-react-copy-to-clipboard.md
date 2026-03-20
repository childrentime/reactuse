---
title: "React 複製到剪貼簿：完整指南"
description: "學習如何使用現代 Clipboard API 和 useClipboard hook 在 React 中將文字複製到剪貼簿。涵蓋權限、HTTPS 需求、備援方案和常見使用情境。"
slug: react-copy-to-clipboard
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, clipboard, useClipboard]
keywords: [react copy to clipboard, useClipboard, react clipboard api, copy text react, react copy button]
image: /img/og.png
---

# React 複製到剪貼簿：完整指南

將文字複製到剪貼簿聽起來很簡單，但要在 React 中正確實作，需要處理瀏覽器權限、HTTPS 需求和優雅的備援方案。本指南帶你了解網頁剪貼簿存取的演進，並展示目前最乾淨的處理方式。

<!-- truncate -->

## 舊方法：document.execCommand

在 Clipboard API 出現之前，複製文字意味著建立一個隱藏的 textarea，選取其內容，然後呼叫 `document.execCommand("copy")`：

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

這種方法有嚴重的問題。它是同步的，會阻塞主執行緒。它需要建立和移除 DOM 元素。它已在所有主要瀏覽器中被棄用，且在不同裝置上行為不一致，尤其是在 iOS 上。

## 現代 Clipboard API

瀏覽器現在提供 `navigator.clipboard`，一個基於 Promise 的 API，更乾淨也更可靠：

```tsx
await navigator.clipboard.writeText("Hello, world!");
const text = await navigator.clipboard.readText();
```

這是正確的基礎，但直接在 React 元件中使用它會帶來幾個挑戰。

## 為什麼這很棘手

### 權限

Clipboard API 需要明確的使用者許可。瀏覽器可能會在允許讀取存取之前提示使用者，有些瀏覽器會在呼叫不是來自使用者手勢（如點擊）時靜默拒絕存取。

### 僅限 HTTPS

`navigator.clipboard` 只在安全上下文中可用。如果你的應用程式在開發期間執行在 `http://localhost` 上，這沒問題，但任何部署的網站都必須使用 HTTPS。

### SSR 和 Server Components

`navigator.clipboard` 不存在於伺服器端。如果你使用 Next.js、Remix 或任何 SSR 框架，在模組層級參照它會拋出 `ReferenceError`。

### 備援方案和錯誤處理

你需要處理 API 不可用、使用者拒絕權限或文件未獲焦點的情況。每次你需要一個複製按鈕時，都要寫大量的防禦性程式碼。

## useClipboard 來救場

ReactUse 的 [useClipboard](https://reactuse.com/browser/useClipboard/) hook 將所有這些複雜性包裝成一個簡單的雙值元組：

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

這個 hook 回傳：

- **`clipboardText`** — 剪貼簿的目前內容，在複製、剪下和焦點事件時自動更新。
- **`copy(text)`** — 一個非同步函式，用於將文字寫入剪貼簿。

在底層，`useClipboard` 監聽 `copy`、`cut` 和 `focus` 事件，使顯示的剪貼簿值保持同步。它還會防止在文件未獲焦點時讀取剪貼簿，否則在大多數瀏覽器中會拋出錯誤。

## 建構帶有回饋的複製按鈕

使用者需要視覺確認複製操作已成功。以下是一個可重複使用的元件，顯示短暫的「已複製！」訊息：

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

因為 `copy` 回傳一個 Promise，你可以捕獲錯誤並為成功和失敗狀態提供回饋。

## 常見使用情境

### 程式碼區塊

在語法高亮的程式碼區塊中新增複製按鈕，讓讀者無需手動選取文字即可抓取程式碼片段：

```tsx
<div style={{ position: "relative" }}>
  <pre><code>{codeSnippet}</code></pre>
  <CopyButton text={codeSnippet} />
</div>
```

### 分享連結

讓使用者一鍵複製可分享的 URL，而不必依賴瀏覽器的網址列：

```tsx
<CopyButton text={`https://myapp.com/post/${postId}`} />
```

### 表單值

直接從表單欄位複製產生的值，如 API 金鑰、邀請碼或設定字串：

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

## 安裝

```bash
npm i @reactuses/core
```

然後匯入 hook：

```tsx
import { useClipboard } from "@reactuses/core";
```

## 相關 Hooks

- [useClipboard 文件](https://reactuse.com/browser/useClipboard/) — 完整 API 參考和即時範例
- [usePermission](https://reactuse.com/browser/usePermission/) — 檢查剪貼簿讀取權限是否已授予
- [useEventListener](https://reactuse.com/effect/useEventListener/) — useClipboard 內部使用的底層 hook
- [useSupported](https://reactuse.com/state/useSupported/) — 偵測 Clipboard API 在目前環境中是否可用

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
