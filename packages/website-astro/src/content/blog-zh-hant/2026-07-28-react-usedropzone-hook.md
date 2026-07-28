---
title: "React useDropZone Hook：打造一個檔案拖放區（2026）"
description: "一篇實用的 useDropZone 上手指南：dragenter/dragleave 在巢狀元素上的閃爍 bug，以及 hook 內部用計數器修復它的原理、drop 回呼的資料形狀、搭配 useFileDialog 提供鍵盤可存取的備援方案，以及 SSR 安全規則。TypeScript 優先。"
slug: react-usedropzone-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-28
tags: [react, hooks, element, typescript, tutorial]
keywords: [react useDropZone, useDropZone hook, usedropzone react, react 拖放區 hook, react 拖放上傳檔案, react 檔案拖放, drag and drop react hook, useDropZone typescript, react dragenter dragleave, react 檔案上傳拖放區]
image: /img/og.png
---

# React useDropZone Hook：打造一個檔案拖放區（2026）

在一個內部有子元素（一個圖示、一段文字、一張預覽縮圖）的拖放區上拖曳檔案，手寫的 `isOver` 布林值會開始閃爍：`true`、`false`、`true`、`false`，因為游標從容器邊界跨到子元素上又跨回來。檔案懸停在拖放區上的整段時間裡，高亮邊框都在閃。這不是事件處理邏輯寫錯了，問題出在 `dragenter` 和 `dragleave` 到底是在哪個元素上觸發的。

[`@reactuses/core`](https://reactuse.com) 的 `useDropZone` 把一個 DOM 元素變成檔案拖放目標，且完全沒有這種閃爍，還附帶一個直接把拖入的 `File[]` 交給你的回呼。它的內部實作短到可以一口氣讀完，所以這篇文章會走一遍它修復的真實 bug 和真實 API，TypeScript 優先。

<!-- truncate -->

## 手寫版本，以及它在哪裡散架

最直覺的第一次嘗試是把 `dragenter`/`dragleave` 配上一個布林值：

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
      <span>把檔案拖到這裡</span>
    </div>
  );
}
```

看起來沒問題，但只要拖放區裡有一個子節點，它就立刻散架了。這裡有個不那麼直觀的關鍵點：`dragenter` 和 `dragleave` 是在指標當前所在的那個元素上觸發的，而且會**冒泡**。把檔案拖過上面那個 div 裡的 `<span>`，瀏覽器會依序觸發：div 上的 `dragenter`，span 上的 `dragenter`（冒泡到 div，對這個處理函式是空操作），指標跨到 span 上時 div 的 `dragleave`，然後指標再次進入時 span 的 `dragenter`。中間那個 `dragleave` 觸發了你的 `setIsOver(false)`，儘管游標根本沒有離開拖放區——它只是跨過了一個子元素的邊界。只要檔案懸停在任何巢狀內容上方，邊框就會一直閃。

新手還容易搞錯另外兩件事：

- **在 `dragover` 上漏呼叫 `preventDefault()`，`drop` 事件就永遠不會觸發。** 瀏覽器對 `dragover` 的預設動作是「拒絕這次放置」——不呼叫 `preventDefault`，就沒有 `drop` 事件，沒有例外。
- **放下的內容不是一個普通陣列。** `event.dataTransfer.files` 是 `FileList`，不是 `File[]`——轉換之前不能 `.map`、不能 `.filter`。

## useDropZone——用一個計數器修好閃爍

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
      <span>把檔案拖到這裡</span>
    </div>
  );
}
```

簽名：

```ts
function useDropZone(
  target: BasicTarget<EventTarget>,
  onDrop?: (files: File[] | null) => void
): boolean;
```

巢狀 bug 的修復方式是一個普通整數，不是防抖，也不是檢查 `relatedTarget`——[真實實作](https://github.com/childrentime/reactuse)短到可以完整貼出來：

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

每一次 `dragenter`——不管是容器還是子元素——都讓計數器加一；每一次 `dragleave` 都讓它減一。`isOver` 只有在計數器歸零時才會變回 `false`，而這恰好發生在指標真正離開了整棵子樹（包括容器本身）的那一刻。進入一個子元素會先減一再立刻加一（淨值為正），所以懸停期間計數永遠不會跌到零。這和解決 `mouseenter`/`mouseleave` 連鎖冒泡問題用的是同一種技巧，只是套用在拖曳事件上。四個事件的 `preventDefault()` 都已經替你呼叫好了，所以 `drop` 能可靠觸發，瀏覽器也不會嘗試跳轉去開啟被拖入的檔案。

## onDrop 到底給了你什麼

- **`target` 接受任意 `EventTarget`**，不只是 `HTMLElement`——它是一個 ref，透過函式庫裡其他 DOM hook 共用的同一個 `useEventListener` 接線，監聽器隨元件生命週期自動掛載和卸載。
- **回呼收到的是已經轉換好的 `File[]`**，從原始 `FileList` 轉來——呼叫端不需要再寫一次 `Array.from`。
- **拖入的不是檔案——比如一個連結、一段選取文字——回呼會傳入 `null`**，而不是空陣列。使用前先判斷 `null`，不要想當然地假設 `files[0]` 存在。
- **一次 drop 會無條件把計數器重設為 `0`。** 即便瀏覽器的 `dragenter`/`dragleave` 記帳因為某種原因漂移了，每次完成的 drop 都會讓下一輪懸停從乾淨狀態開始。

## 搭配 useFileDialog：補上可存取性缺口

拖放有一個真實的缺口：它只支援滑鼠和觸控。「從桌面拖一個檔案」沒有鍵盤等價物，所以一個*只有*拖放功能的區域，對鍵盤使用者和螢幕閱讀器使用者來說是不可用的。修法是加一個可見的「或瀏覽檔案」備援，[`useFileDialog`](https://reactuse.com/browser/usefiledialog/) 正是為這種搭配而生——它不需要隱藏的 `<input>` 就能開啟原生檔案選擇器：

```tsx
import { useRef } from 'react';
import { useDropZone, useFileDialog } from '@reactuses/core';

function Uploader({ onFiles }: { onFiles: (files: File[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isOver = useDropZone(ref, (files) => files && onFiles(files));
  const [dialogFiles, open] = useFileDialog({ accept: 'image/*' });

  return (
    <div ref={ref} style={{ border: isOver ? "2px solid blue" : "2px dashed gray" }}>
      <p>把檔案拖到這裡，或者</p>
      <button onClick={() => open()}>瀏覽檔案</button>
    </div>
  );
}
```

同一個視覺拖放目標，再加一個鍵盤使用者能 tab 到並啟用的真正 `<button>`——兩條路徑通向同一個上傳流程。

## 真實使用場景

- **自訂樣式的上傳元件。** 預設的 `<input type="file">` 在大多數瀏覽器裡幾乎沒法重新設計樣式；`useDropZone` + `useFileDialog` 的組合能讓拖放目標的外觀完全可控，同時保留拖曳和點擊兩條路徑。
- **圖片相簿和媒體管理器。** 把一批圖片拖到相簿網格上，把每個 `File` 餵給 [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/)，在任何上傳請求完成之前就拿到即時的 `blob:` 預覽網址。
- **CMS 和表單建構器的拖放目標。** 接受拖入資源的編輯器（一個主圖欄位、一個文件附件槽位）正好需要這種不閃爍的 `isOver` 狀態，才能渲染出讓人信服的「拖到這裡」高亮。
- **多拖放區上傳器。** 因為 `target` 只是一個 ref，同一個 hook 分別綁定不同的 ref，就能讓每個拖放區（比如一個表單裡的「封面圖」和「相簿圖片」）擁有各自獨立、正確隔離的懸停狀態。

## SSR 安全性

`useDropZone` 在頂層從不觸碰 `document` 或 `window`——四個監聽器全部透過 `useEventListener` 掛載，而它只在元件已經在客戶端掛載之後的 effect 裡執行。在伺服器端，`isOver` 就渲染成它的初始值 `false`，此時也還沒有 DOM 可以掛載監聽器，所以完全沒有需要防範的 hydration 不匹配——不像那些讀取「伺服器端和客戶端可能不一致的值」（例如 cookie、`localStorage`）的 hook。這裡不需要額外設定任何東西。

## 要點回顧

- **巢狀閃爍是一個冒泡問題，不是邏輯 bug**——樸素的布林值切換，只要拖放區裡有任何子元素就會立刻出問題。[`useDropZone`](https://reactuse.com/element/usedropzone/) 用一個 enter/leave 計數器修復它，只有指標真正離開整棵子樹時才會歸零。
- **`dragover` 上的 `preventDefault()` 沒有商量餘地**——漏呼叫，`drop` 就永遠不會觸發。hook 已經替你在全部四個事件上呼叫好了。
- **`onDrop` 給你的是真正的 `File[]`（或 `null`）**——已經從原始 `FileList` 轉換好，`null` 用來區分「沒有拖入任何檔案」和「拖入了零個檔案」這兩種情況。
- **單靠拖放會把鍵盤使用者擋在門外**——搭配 [`useFileDialog`](https://reactuse.com/browser/usefiledialog/)，讓同一個上傳流程始終有一條可點擊、可 tab 到的路徑。
- **不需要任何 SSR 儀式**——這個 hook 在客戶端掛載之前什麼都不會附加，所以完全不用為伺服器端/客戶端不一致而設計。

從 [`@reactuses/core`](https://reactuse.com/element/usedropzone/) 拿來用，別再手動除錯拖曳事件的冒泡問題了。
