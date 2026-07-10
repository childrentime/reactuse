---
title: "React useObjectUrl Hook：預覽檔案與 Blob，不留記憶體洩漏（2026）"
description: "一篇實用的 useObjectUrl 上手指南：把任意 File、Blob 或 MediaSource 轉成 URL.createObjectURL() 字串，並在每次來源變化和元件卸載時自動回收，預覽 URL 不再在記憶體裡堆積。SSR 安全，TypeScript 優先。"
slug: react-useobjecturl-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-10
tags: [react, hooks, browser-api, typescript, tutorial]
keywords: [react useObjectUrl, useObjectUrl hook, useobjecturl react, react blob url, react 檔案預覽 hook, URL.createObjectURL react, react 檔案上傳 記憶體洩漏, react 圖片預覽 hook, revokeObjectURL react, react MediaSource hook, react 影片預覽, useObjectUrl typescript]
image: /img/og.png
---

# React useObjectUrl Hook：預覽檔案與 Blob，不留記憶體洩漏（2026）

使用者往圖片編輯器裡上傳了十幾張圖片，每一張都透過 `URL.createObjectURL()` 產生即時預覽。工作階段持續了二十分鐘，預覽隨著檔案的增減不斷切換，分頁的記憶體佔用則一路攀升——因為每一次 `createObjectURL()` 呼叫都必須配對一次 `revokeObjectURL()` 呼叫，而這個配對關係要在重新渲染、props 變化、元件卸載之間始終成立。大多數元件都沒做對，而這個 bug 要等到有人把分頁開得夠久、注意到風扇轉起來了才會被發現。

`useObjectUrl` 就是那個一行程式碼的修復：把 `File`、`Blob` 或 `MediaSource` 丟給它，拿回一個 URL 字串，再也不用自己呼叫 `revokeObjectURL`。以下都是 [`@reactuses/core`](https://reactuse.com) 的真實 API，TypeScript 優先。

<!-- truncate -->

## 手寫版本，以及它在哪裡洩漏

`URL.createObjectURL()` 是瀏覽器裡支撐一切客戶端檔案預覽的 API：傳給它一個 `Blob`（`File` 就是其中一種），它會回傳一個 `blob:` URL，可以直接塞進 `<img src>` 或 `<video src>`。問題出在另一端——它鑄造出的每一個 URL 都會持續存活、持有底層資料的參照，直到你明確呼叫 `URL.revokeObjectURL()`。忘記呼叫，或者在錯誤的時機呼叫，這個 URL——以及它背後的記憶體——就永遠不會被釋放。

在 React 元件裡，「錯誤的時機」很容易撞上：

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

這一版其實是對的——清理函式閉包捕捉的是 `next`，而不是 state，所以它總能精確回收自己建立的那個 URL。但它「對」的方式，正是手寫 effect 常見的那種脆弱：只要一次不小心的重構就會出問題。把 `URL.createObjectURL` 呼叫搬到 effect 外面、錯誤地做了 memo、或者從 state 裡讀 `url` 而不是本地變數 `next`，配對關係就會悄無聲息地斷裂。把這套模式複製到每一個需要預覽檔案的元件裡——大頭貼上傳、聊天附件、圖庫縮圖——你就是在五個不同的地方維護著同一套脆弱的生命週期邏輯。

## useObjectUrl —— 建立與回收，都替你處理好

```tsx
import { useObjectUrl } from '@reactuses/core';

function FilePreview({ file }: { file?: File }) {
  const url = useObjectUrl(file);
  return url ? <img src={url} /> : null;
}
```

整個 hook 就這麼多。簽名是：

```ts
function useObjectUrl(object: Blob | MediaSource): string | undefined;
```

傳入一個 `Blob`（或者它的子型別 `File`）或 [`MediaSource`](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource)，拿回對應的 object URL——在來源存在之前則是 `undefined`。它內部就是一個 `useEffect`：來源存在時呼叫 `URL.createObjectURL()`，並回傳一個呼叫 `URL.revokeObjectURL()` 的清理函式。它和手寫版本的差別不在行為，而在於這套配對關係只存在於一個經過稽核的地方，而不是每個元件各自重新推導一遍。

## 來源變化時，以及元件卸載時

回收會在兩個真正重要的時機觸發：

- **來源變化。** 把 `file` prop 換成另一個 `File`，hook 會在鑄造新 URL 之前先回收舊的——使用者逐一點開附件清單時不會產生堆積。
- **元件卸載。** 關閉預覽視窗、跳轉到別的頁面、從清單裡移除某一項——清理函式都會執行，URL 會被釋放。不會留下什麼等著一個根本不知道要去回收它的垃圾回收器。

第二種情況恰恰是手寫程式碼最常漏掉的一種，因為它只會在真實使用中表現為緩慢的記憶體爬升，快速的手動測試根本發現不了。

## 真實使用情境

- **檔案輸入預覽。** 在使用者提交上傳之前，把剛選中的圖片、影片或 PDF 展示出來——這是最典型的情境，也是下面示範裡用到的那種。
- **Blob API 回應。** 一個回傳 `Blob` 的介面（產生的匯出檔案、帶簽章的資源、`fetch().blob()` 的結果）可以直接變成可下載的 `<a href>`，或者內嵌的 `<img>`/`<video>`，不需要先寫到磁碟上。
- **Canvas 匯出。** `canvas.toBlob()` 會產出一個 `Blob`；把它直接餵給 `useObjectUrl`，就能預覽或提供下載使用者剛畫好、裁切好的內容。
- **`MediaSource` 用於自訂影片播放器。** `MediaSource` 是 [Media Source Extensions](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) 背後的物件，支撐著自適應串流和自訂緩衝的影片——你以程式化方式建構這個串流，仍然需要一個 URL 交給 `<video src>`。`useObjectUrl` 可以直接接受它，和接受 `Blob` 一樣。

## 天生 SSR 安全

`URL.createObjectURL` 在伺服器端根本不存在——沒有 DOM，也就沒有 Blob URL 可鑄造。`useObjectUrl` 在伺服器端渲染期間完全不會碰 `URL` API；它會一直回傳 `undefined`，直到 effect 在客戶端執行為止，所以不需要記得寫 `typeof window` 判斷，也不會有伺服器端崩潰需要排查。如果你在排查其他手寫瀏覽器 API 程式碼裡的類似缺口，[SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) 講了這個通用模式。

## 檔案處理三件套

`useObjectUrl` 是一小組 hook 裡的一環，這組 hook 涵蓋了檔案從選取、拖放到預覽的完整生命週期：

| Hook | 角色 |
| --- | --- |
| [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) | 開啟原生檔案選擇器，回傳選中的 `FileList` |
| [`useDropZone`](https://reactuse.com/element/usedropzone/) | 把任意元素變成檔案的拖放目標 |
| [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/) | 把得到的 `File`/`Blob` 轉成安全、自動回收的預覽 URL |

把 `useFileDialog` 或 `useDropZone` 的結果直接接入 `useObjectUrl`，預覽這一步就完全不需要寫清理程式碼。包含多檔案圖庫範例（把三個 hook 組合在一起）的完整說明在 [React File Handling](https://reactuse.com/blog/react-file-handling/) 裡。

## 重點整理

- **核心問題是一個配對 bug。** 每一次 `URL.createObjectURL()` 都需要一次相符的 `URL.revokeObjectURL()`，而在每一個展示檔案預覽的元件裡重新推導這個配對關係，正是記憶體洩漏悄悄出現的地方。
- **`useObjectUrl(object)`** 接受一個 `Blob`（或 `File`）或 `MediaSource`，回傳 URL 字串，在來源存在之前則是 `undefined`。
- **回收是自動的**，在兩個真正重要的時機都會觸發：來源變化，以及元件卸載。
- 涵蓋的不只是圖片預覽：Blob API 回應、`canvas.toBlob()` 匯出，以及用於自訂影片播放器的 `MediaSource`。
- **SSR 安全**——在伺服器端回傳 `undefined`，不存取 `URL` API，不需要寫任何守衛程式碼。
- 搭配 [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) 和 [`useDropZone`](https://reactuse.com/element/usedropzone/)，選取、拖放、預覽三步都不需要手動管理生命週期。

從 [`@reactuses/core`](https://reactuse.com/browser/useobjecturl/) 裡拿走它，別再為漏掉的 `revokeObjectURL` 呼叫排查元件了。
