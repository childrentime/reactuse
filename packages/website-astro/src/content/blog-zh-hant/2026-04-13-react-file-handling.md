---
title: "React 檔案處理：上傳、拖放區與物件 URL"
description: "用 ReactUse 中可組合的 Hook 在 React 中構建檔案選擇器、拖放上傳區、圖片預覽和動態指令稿載入器。"
slug: react-file-handling
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, files, upload, tutorial]
keywords: [react file upload, useFileDialog, useDropZone, useObjectUrl, react drag and drop upload, useScriptTag, react file preview, react upload hook]
image: /img/og.png
---

# React 檔案處理：上傳、拖放區與物件 URL

任何稍有規模的應用最終都要處理檔案。個人資料編輯頁要傳頭像。筆記應用要附加圖片。CSV 匯入器要拖放區。相簿要在客戶端產生縮圖。而每一個這樣的功能都要從零開始重做一遍——因為 React 裡的檔案處理同時涉及三套瀏覽器 API（`<input type="file">`、Drag and Drop API、`URL.createObjectURL`），再加上 React 本身的 ref 和 effect 機制——大多數開發者每次都從頭把它們拼一遍。

<!-- truncate -->

本文將帶你過一遍每個 React 應用遲早都會遇到的四個檔案處理基本能力：一個不需要在 DOM 裡渲染隱藏 `<input>` 的檔案選擇器、一個能接收拖入檔案的拖放區、一個不會洩漏記憶體的物件 URL 助手，以及一個按需載入第三方函式庫的指令稿標籤載入器。每一個我們都會先寫出手動實作,讓你看清底層在做什麼,然後再換成 [ReactUse](https://reactuse.com) 裡專門的 Hook。最後我們會把四個 Hook 組合成一個完整的照片上傳元件,集挑選、拖放、預覽和按需載入圖片函式庫於一身。

## 1. 不用隱藏 input 也能選檔案

### 手動實作

React 中傳統的檔案選擇寫法看起來人畜無害,但暗藏不少坑:

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
        選擇圖片
      </button>
      {files && <p>已選 {files.length} 個檔案</p>}
    </div>
  );
}
```

它能跑,但只要你想用第二次,縫合的痕跡就藏不住了。隱藏的 `<input>` 仍然在你的渲染樹裡,你的樣式重置必須考慮它的存在。重置選中狀態需要寫 `inputRef.current.value = ""`——這種命令式的副作用,React 的 lint 規則會跳出來警告你。要是你想在非同步處理邏輯裡 `await` 使用者的選擇(比如想在一個處理檔案的 async handler 裡),你還得自己造一個一次性的 promise。

而且你沒法在同一個頁面上重複使用同一個元件兩次而不讓 ref 互相打架。如果使用者連續選擇同一個檔案,第二次 `change` 事件根本不會觸發——這是歷代 React 開發者都踩過的著名陷阱。

### ReactUse 的方式:useFileDialog

`useFileDialog` 把整個 input 元素從渲染樹裡抬出去,交給你一個 `[files, open, reset]` 的元組:

```tsx
import { useFileDialog } from "@reactuses/core";

function ImagePicker() {
  const [files, open, reset] = useFileDialog({
    multiple: true,
    accept: "image/*",
  });

  return (
    <div>
      <button onClick={() => open()}>選擇圖片</button>
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

手動版本忽略的三件小事,但都很重要:

1. **沒有隱藏 DOM**。input 在記憶體裡建立,不在你的渲染樹裡。元件輸出就是按鈕本身。
2. **每次呼叫都能傳參**。在 `open()` 上直接傳選項,可以覆蓋 Hook 級別的預設值。想讓同一個選擇器既能選文件又能選圖片?呼叫時再傳 `accept` 就行。
3. **真正的重置**。`reset()` 同時清空 React state 和底層 input,所以同一個檔案可以再選一次。

`open()` 函式還會回傳一個 promise,resolve 時給你已選的檔案。這讓非同步流程清爽得多:

```tsx
const handleUpload = async () => {
  const picked = await open();
  if (!picked) return;
  await uploadAll(Array.from(picked));
};
```

你不再需要把邏輯切分到 `onChange` 和按鈕的點擊處理函式之間。選擇器就是一個可以 `await` 的函式。

## 2. 拖放檔案區

### 手動實作

拖放是那種「教學裡看著簡單,生產環境裡裂得稀碎」的 API。最直白的版本:

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
      把檔案拖到這裡
    </div>
  );
}
```

這個版本看似沒問題,直到使用者拖到子元素上時一切都崩了。游標一踏進子元素,瀏覽器就在父元素上觸發 `dragleave`,儘管從邏輯上看檔案還在區域內。你的邊框開始閃爍,`over` state 變成謊言。要正確修復它,你得用計數器追蹤 `dragenter` 和 `dragleave`,每次離開就減一,只有當計數器歸零時才認定檔案「離開」了。還得記得在 `dragover` 上呼叫 `preventDefault`——否則 drop 根本不會觸發——並且記住 `dataTransfer.files` 是 `FileList` 而不是陣列。

大多數生產環境裡的拖放區都做錯了。閃爍就是破綻。

### ReactUse 的方式:useDropZone

`useDropZone` 替你跳完了這套計數器舞蹈:

```tsx
import { useRef } from "react";
import { useDropZone } from "@reactuses/core";

function CsvDropZone() {
  const dropRef = useRef<HTMLDivElement>(null);
  const isOver = useDropZone(dropRef, (files) => {
    if (!files) return;
    const csvs = files.filter((f) => f.name.endsWith(".csv"));
    console.log("拖入的 CSV:", csvs);
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
        {isOver ? "鬆開以上傳" : "把 CSV 檔案拖到這裡"}
      </p>
    </div>
  );
}
```

注意 API 本質上就是 `(target, onDrop) => isOver`。就這麼簡單。Hook 內部處理 `dragenter`/`dragover`/`dragleave`/`drop`,維護進入/離開計數器,讓子元素不會破壞高亮,阻止瀏覽器預設的「在新分頁開啟」行為,最後把一個 boolean 還給你來驅動樣式。

回呼收到的是 `File[] | null`——`null` 代表一次空拖放(沒錯,某些瀏覽器在使用者拖入非檔案內容時確實會觸發)。你的處理函式可以一次判斷後就乾淨地退出。

## 3. 用物件 URL 預覽檔案

### 手動實作

拿到 `File` 之後,你通常想把它展示給使用者看。瀏覽器給了你 `URL.createObjectURL(blob)`,可以把任何 blob 變成一個臨時 URL,扔進 `<img>` 或 `<video>` 就能用。代價是:你建立的每一個 URL 都會占記憶體,必須記得用完呼叫 `URL.revokeObjectURL`——否則就洩漏了。在 React 裡,「用完」通常意味著「元件卸載或檔案變化時」,這正是 effect 存在的意義,也正是開發者最容易忘記的事情:

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

這是對的,但是那種「再不小心改一筆就漏的對」。清理函式和 `createObjectURL` 呼叫要永遠成對存在。多加一個條件 return 或者忘了一個依賴,就會出現一個只有在長會話裡才暴露的 bug。

### ReactUse 的方式:useObjectUrl

`useObjectUrl` 是那段 effect 的單行版:

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

Hook 接管了生命週期。當 `file` prop 變化時,它會回收舊 URL 並建立新 URL。元件卸載時,它會回收最後一個。你不可能忘記清理,因為你壓根就沒寫過它。

## 4. 按需載入第三方指令稿

### 手動實作

有時候你想處理的檔案,對應的函式庫太大或太冷門,不值得放進主套件。圖片裁剪函式庫、PDF 解析器、OCR 引擎、影片轉碼器——它們都是幾十 MB 的體積,對那些從不上傳檔案的使用者來說一文不值。你只想在第一個檔案到來之後才付出這個代價。

在 React 裡手動載入指令稿標籤本身就是一道菜譜:

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
    el.onerror = () => reject(new Error(`載入失敗 ${src}`));
    document.head.appendChild(el);
  });
}

function ManualImageProcessor() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadScript("https://cdn.example.com/heavy-image-lib.js")
      .then(() => setReady(true))
      .catch(console.error);
    // 沒有清理 —— 一旦載入就保留
  }, []);

  return ready ? <Editor /> : <p>正在載入編輯器...</p>;
}
```

這覆蓋了正常路徑,但忽略了亂七八糟的情況:如果兩個元件同時請求同一個指令稿(競態條件)怎麼辦?如果指令稿載入失敗你想重試怎麼辦?如果你想在元件消失時主動卸載它怎麼辦?

### ReactUse 的方式:useScriptTag

`useScriptTag` 給你的就是你本來要寫的那些原語,但邊界情況都已經處理好:

```tsx
import { useScriptTag } from "@reactuses/core";

function HeavyImageEditor() {
  const [, status, , unload] = useScriptTag(
    "https://cdn.example.com/image-editor.js",
    () => console.log("編輯器函式庫已就緒"),
    { manual: false, async: true },
  );

  if (status === "loading") return <p>正在下載編輯器...</p>;
  if (status === "error") return <p>編輯器載入失敗</p>;
  if (status !== "ready") return null;

  return <ImageEditorComponent onClose={unload} />;
}
```

四樣白送的好處:

1. **單例行為**。同一個指令稿 URL 被請求兩次,Hook 會去重——沒有競態,沒有重複載入。
2. **狀態機**。`idle`/`loading`/`ready`/`error` 讓你在每一步都能渲染恰當的內容。
3. **手動控制**。設定 `manual: true`,指令稿要等你顯式呼叫返回的 `load()` 才會載入——非常適合「首次互動時再載入」的模式。
4. **卸載**。呼叫 `unload()` 可以把 script 標籤從 document 裡移除。如果你想在使用者關閉編輯器後把那個龐大的函式庫從記憶體裡清掉,這就派上用場了。

## 全部組合:照片上傳元件

現在我們把四個 Hook 組合成一個元件:一個允許使用者挑選或拖入圖片、即時預覽、並在第一次需要時延遲載入一個假想的客戶端圖片縮放函式庫的照片上傳元件。

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
    () => console.log("縮放器已就緒"),
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
          {isOver ? "鬆開即可上傳" : "把照片拖到這裡"}
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
          或從裝置中選擇
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
          已排隊 {queue.length} 張圖片
          {shouldLoadResizer && ` —— 縮放器:${resizerStatus}`}
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

四個 Hook,四個職責,互不重疊:

- **`useFileDialog`** 負責「點擊挑選」流程,並提供可 await 的 promise
- **`useDropZone`** 處理拖放,並解決子元素引發的邊框閃爍
- **`useObjectUrl`** 為每個縮圖產生並回收預覽 URL,綁定到元件生命週期
- **`useScriptTag`** 只在第一張圖片到來後延遲載入縮放函式庫,並且整個會話只載入一次

組合很自然,因為每個 Hook 只做一件事。Hook 之間不共享 ref,effect 不會級聯。你最終發布的元件大概 100 行,大部分是標籤和樣式,那些棘手的瀏覽器底層活計被藏在已經經過測試和 SSR 加固的 Hook 裡。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hook

- [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) —— 開啟檔案選擇器,無需在 DOM 中渲染隱藏的 input
- [`useDropZone`](https://reactuse.com/element/usedropzone/) —— 追蹤檔案拖入元素的狀態,正確處理子元素事件
- [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/) —— 為 File 和 Blob 建立並自動回收 URL
- [`useScriptTag`](https://reactuse.com/browser/usescripttag/) —— 動態載入外部指令稿,帶狀態追蹤和卸載支援
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) —— 宣告式地附加事件監聽器,可用於自訂上傳進度事件
- [`useSupported`](https://reactuse.com/state/usesupported/) —— 響應式地檢查瀏覽器是否支援某個 API

---

ReactUse 提供了 100+ 個 React Hook。[全部探索 →](https://reactuse.com)
