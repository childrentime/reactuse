---
title: "React 拖放：無需第三方函式庫的完整方案"
description: "學習如何使用原生瀏覽器 API 和 useDraggable、useDropZone hook 在 React 中建構拖放介面。無需沉重的依賴。"
slug: react-drag-and-drop
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, drag-and-drop, tutorial, useDraggable]
keywords: [react drag and drop, useDraggable, useDropZone, react dnd, drag drop hooks, react drag and drop without library]
image: /img/og.png
---

# React 拖放：無需第三方函式庫的完整方案

拖放是使用者期望「理所當然能用」的互動之一。無論是對任務看板重新排序、透過拖動檔案上傳，還是讓使用者在儀表板中重新排列小工具，抓取並移動的操作都讓人感覺自然流暢。然而大多數 React 教學一開始就引入像 `react-dnd` 或 `dnd-kit` 這樣的重量級函式庫——它們功能強大，但對許多常見場景來說增加了過多的套件體積和概念負擔。

<!-- truncate -->

如果只需一次 Hook 呼叫就能獲得流暢、可用於生產的拖放行為呢？本文將從原生瀏覽器 API 出發，分析它們為何難用，然後用 [ReactUse](https://reactuse.com) 中的兩個輕量 Hook：[`useDraggable`](https://reactuse.com/element/useDraggable/) 和 [`useDropZone`](https://reactuse.com/element/useDropZone/) 來解決同樣的問題。

## 手動實作：自行處理指標事件

讓元素可拖曳的最基本方式是手動監聽 `pointerdown`、`pointermove` 和 `pointerup` 事件。通常的寫法如下：

```tsx
import { useEffect, useRef, useState } from "react";

function ManualDraggable() {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const delta = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      delta.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setIsDragging(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - delta.current.x,
        y: e.clientY - delta.current.y,
      });
    };

    const onPointerUp = () => setIsDragging(false);

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "grab",
        padding: 16,
        background: "#4f46e5",
        color: "#fff",
        borderRadius: 8,
      }}
    >
      拖動我
    </div>
  );
}
```

能跑起來——但看看你需要管理多少狀態。而這還只是*最簡單*的版本。實際需求會迅速疊加更多複雜性。

## 為什麼手動實作拖放很難

上面的程式碼有幾個不足之處，一旦超出 Demo 等級就會立刻暴露出來：

1. **容器邊界。** 如果你想讓元素保持在父容器內部，就需要在每次移動時讀取容器尺寸並限制位置。這意味著每幀都要在兩個元素上呼叫 `getBoundingClientRect`。

2. **指標類型。** 上面的程式碼處理了滑鼠事件，但觸控和觸控筆呢？`PointerEvent` API 統一了它們，但按指標類型過濾（例如停用觸控筆拖動）需要額外的條件判斷。

3. **拖曳控制把手。** 有時可拖曳的觸發區域只是卡片內部的一個標題列。你需要將「觸發」元素和「移動」元素分離，並相應地連接事件。

4. **事件清理。** 忘記移除監聽器——或者在 `useEffect` 中使用了錯誤的依賴——會導致諸如放開滑鼠後元素仍在移動之類的隱蔽 Bug。

5. **放置區域。** HTML5 拖放 API 引入了 `dragenter`、`dragover`、`dragleave` 和 `drop` 事件。協調這些事件——尤其是子元素上惡名昭彰的 `dragenter`/`dragleave` 閃爍問題——非常容易出錯。

這些正是 `useDraggable` 和 `useDropZone` 開箱即用要解決的問題。

## useDraggable：一個 Hook，完全掌控

[`useDraggable`](https://reactuse.com/element/useDraggable/) 接受一個目標元素的 ref 和一個可選的設定物件。它回傳當前的 `x` 和 `y` 位置、一個表示元素是否正在被拖曳的布林值，以及一個 setter（用於程式化地移動元素）。

```tsx
import { useDraggable } from "@reactuses/core";
import { useRef } from "react";

function DraggableCard() {
  const el = useRef<HTMLDivElement>(null);

  const [x, y, isDragging] = useDraggable(el, {
    initialValue: { x: 100, y: 100 },
  });

  return (
    <div
      ref={el}
      style={{
        position: "fixed",
        left: x,
        top: y,
        cursor: isDragging ? "grabbing" : "grab",
        padding: 16,
        background: isDragging ? "#4338ca" : "#4f46e5",
        color: "#fff",
        borderRadius: 8,
        transition: isDragging ? "none" : "box-shadow 0.2s",
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.2)" : "none",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      隨意拖動我
    </div>
  );
}
```

這就是整個元件。無需手動事件監聽器。無需清理邏輯。觸控、滑鼠和觸控筆預設都能運作。

### 限制在容器內

傳入一個 `containerElement` ref，Hook 會自動夾緊位置，使元素不會離開容器：

```tsx
import { useDraggable } from "@reactuses/core";
import { useRef } from "react";

function BoundedDrag() {
  const container = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLDivElement>(null);

  const [x, y, isDragging] = useDraggable(el, {
    containerElement: container,
    initialValue: { x: 0, y: 0 },
  });

  return (
    <div
      ref={container}
      style={{
        position: "relative",
        width: 400,
        height: 300,
        border: "2px dashed #cbd5e1",
        borderRadius: 8,
      }}
    >
      <div
        ref={el}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 80,
          height: 80,
          background: "#4f46e5",
          borderRadius: 8,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      />
    </div>
  );
}
```

無需手動的夾緊計算。Hook 會讀取容器的捲動和客戶端尺寸，自動限制元素位置。

### 使用拖曳控制把手

通常你只想讓元素的特定部分——比如一個標題列——觸發拖曳。傳入 `handle` ref 即可：

```tsx
import { useDraggable } from "@reactuses/core";
import { useRef } from "react";

function DraggablePanel() {
  const panel = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);

  const [x, y, isDragging] = useDraggable(panel, {
    handle,
    initialValue: { x: 200, y: 150 },
  });

  return (
    <div
      ref={panel}
      style={{
        position: "fixed",
        left: x,
        top: y,
        width: 280,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <div
        ref={handle}
        style={{
          padding: "8px 12px",
          background: "#4f46e5",
          color: "#fff",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        從這裡拖動
      </div>
      <div style={{ padding: 12 }}>
        <p>此內容區域不會觸發拖曳。</p>
      </div>
    </div>
  );
}
```

面板的主體仍然是可互動的——你可以選取文字、點擊按鈕或捲動——而只有標題列是拖曳觸發器。

## useDropZone：輕鬆實現檔案拖放

[`useDropZone`](https://reactuse.com/element/useDropZone/) 解決拖放的另一半：接收放置。它處理全部四個拖曳事件（`dragenter`、`dragover`、`dragleave`、`drop`），阻止瀏覽器預設開啟檔案的行為，並透過內部計數器解決了 `dragleave` 閃爍問題。

```tsx
import { useDropZone } from "@reactuses/core";
import { useRef, useState } from "react";

function FileUploader() {
  const dropRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const isOver = useDropZone(dropRef, (droppedFiles) => {
    if (droppedFiles) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  });

  return (
    <div
      ref={dropRef}
      style={{
        padding: 40,
        border: `2px dashed ${isOver ? "#4f46e5" : "#cbd5e1"}`,
        borderRadius: 8,
        background: isOver ? "#eef2ff" : "#f8fafc",
        textAlign: "center",
        transition: "all 0.15s",
      }}
    >
      {isOver ? (
        <p>放開以上傳</p>
      ) : (
        <p>將檔案拖到這裡上傳</p>
      )}
      {files.length > 0 && (
        <ul style={{ textAlign: "left", marginTop: 16 }}>
          {files.map((f, i) => (
            <li key={i}>
              {f.name} ({(f.size / 1024).toFixed(1)} KB)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

`isOver` 布林值讓你在檔案進入時立即重新設定區域樣式，給使用者清晰的視覺回饋。無需 `e.preventDefault()` 樣板程式碼，不用和閃爍的 `dragleave` 事件搏鬥。

## 建構看板風格的卡片拖動

讓我們在一個更貼近實際的例子中結合兩個 Hook——一個可拖曳的卡片，鬆開時彈回原位，以及一個接受它的放置區域。我們還將使用 [`useElementBounding`](https://reactuse.com/element/useElementBounding/) 來讀取區域位置以做視覺回饋。

```tsx
import { useDraggable, useDropZone, useElementBounding } from "@reactuses/core";
import { useRef, useState } from "react";

interface Task {
  id: string;
  title: string;
}

function KanbanBoard() {
  const [todo, setTodo] = useState<Task[]>([
    { id: "1", title: "設計原型" },
    { id: "2", title: "撰寫 API 規範" },
  ]);
  const [done, setDone] = useState<Task[]>([
    { id: "3", title: "建置 CI 管線" },
  ]);

  const doneZoneRef = useRef<HTMLDivElement>(null);
  const todoZoneRef = useRef<HTMLDivElement>(null);

  const isOverDone = useDropZone(doneZoneRef, (files) => {
    // 此範例忽略檔案拖放
  });

  const isOverTodo = useDropZone(todoZoneRef, (files) => {
    // 此範例忽略檔案拖放
  });

  const doneBounds = useElementBounding(doneZoneRef);

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <div>
        <h3>待辦</h3>
        <div
          ref={todoZoneRef}
          style={{
            minHeight: 200,
            padding: 12,
            background: isOverTodo ? "#fef3c7" : "#f1f5f9",
            borderRadius: 8,
          }}
        >
          {todo.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDrop={() => {
                setTodo((prev) => prev.filter((t) => t.id !== task.id));
                setDone((prev) => [...prev, task]);
              }}
              targetBounds={doneBounds}
            />
          ))}
        </div>
      </div>
      <div>
        <h3>完成</h3>
        <div
          ref={doneZoneRef}
          style={{
            minHeight: 200,
            padding: 12,
            background: isOverDone ? "#d1fae5" : "#f1f5f9",
            borderRadius: 8,
          }}
        >
          {done.map((task) => (
            <div
              key={task.id}
              style={{
                padding: 12,
                marginBottom: 8,
                background: "#fff",
                borderRadius: 6,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {task.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onDrop,
  targetBounds,
}: {
  task: Task;
  onDrop: () => void;
  targetBounds: ReturnType<typeof useElementBounding>;
}) {
  const el = useRef<HTMLDivElement>(null);

  const [x, y, isDragging, setPosition] = useDraggable(el, {
    initialValue: { x: 0, y: 0 },
    onEnd: (pos) => {
      // 檢查卡片是否在「完成」欄上方釋放
      if (
        targetBounds &&
        pos.x >= targetBounds.left &&
        pos.x <= targetBounds.right &&
        pos.y >= targetBounds.top &&
        pos.y <= targetBounds.bottom
      ) {
        onDrop();
      }
      // 彈回原始位置
      setPosition({ x: 0, y: 0 });
    },
  });

  return (
    <div
      ref={el}
      style={{
        position: "relative",
        left: x,
        top: y,
        padding: 12,
        marginBottom: 8,
        background: isDragging ? "#e0e7ff" : "#fff",
        borderRadius: 6,
        boxShadow: isDragging
          ? "0 8px 24px rgba(0,0,0,0.15)"
          : "0 1px 3px rgba(0,0,0,0.1)",
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 50 : 1,
        touchAction: "none",
        userSelect: "none",
        transition: isDragging ? "none" : "all 0.2s ease",
      }}
    >
      {task.title}
    </div>
  );
}
```

幾個值得注意的關鍵點：

- **`useElementBounding`** 為我們提供了「完成」欄的即時 `left`、`right`、`top` 和 `bottom` 值，以便在拖曳結束時進行碰撞偵測。
- `onEnd` 回呼在未落在目標上時將卡片彈回 `{ x: 0, y: 0 }`。搭配 CSS `transition` 產生令人滿意的橡皮筋效果。
- 無需外部狀態函式庫。React 的 `useState` 對於這個複雜度完全足夠。

## 搭配其他 Hook 增強體驗

ReactUse 的 Hook 天然可組合。以下是擴展上述範例的幾種方式：

- **[`useMouse`](https://reactuse.com/browser/useMouse/)** ——全域追蹤游標位置，在拖曳過程中顯示自訂拖曳游標或跟隨指標的浮動提示。
- **[`useEventListener`](https://reactuse.com/effect/useEventListener/)** ——附加一個 `keydown` 監聽器，在使用者按下 Escape 時取消拖曳。
- **[`useElementSize`](https://reactuse.com/element/useElementSize/)** ——動態讀取容器的寬高以計算網格對齊位置（例如將 `x` 捨入到儲存格寬度的最近倍數）。

例如，使用 `useEventListener` 加入 Escape 取消只需幾行程式碼：

```tsx
import { useDraggable, useEventListener } from "@reactuses/core";
import { useRef } from "react";

function CancelableDrag() {
  const el = useRef<HTMLDivElement>(null);
  const [x, y, isDragging, setPosition] = useDraggable(el);

  useEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && isDragging) {
      setPosition({ x: 0, y: 0 });
    }
  });

  return (
    <div
      ref={el}
      style={{
        position: "fixed",
        left: x,
        top: y,
        padding: 16,
        background: "#4f46e5",
        color: "#fff",
        borderRadius: 8,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      拖動我（按 Esc 重置）
    </div>
  );
}
```

## 什麼時候仍然需要完整的函式庫

`useDraggable` 和 `useDropZone` 用最少的程式碼涵蓋了絕大多數拖放場景。然而，如果你的需求包含複雜的可排序清單（帶動畫過場）、具有鍵盤無障礙存取的多容器排序，或包含上千項的虛擬化清單，像 `dnd-kit` 這樣的專用函式庫仍然是更好的選擇。關鍵在於，你並不需要在每種情況下都引入一個——對許多專案來說，一對 Hook 就足夠了。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hook

- [`useDraggable`](https://reactuse.com/element/useDraggable/) ——使用指標事件讓任意元素可拖曳
- [`useDropZone`](https://reactuse.com/element/useDropZone/) ——為檔案上傳和拖放操作建立放置區域
- [`useElementBounding`](https://reactuse.com/element/useElementBounding/) ——取得元素的即時邊界矩形
- [`useMouse`](https://reactuse.com/browser/useMouse/) ——全域追蹤滑鼠位置
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) ——宣告式地附加事件監聽器
- [`useElementSize`](https://reactuse.com/element/useElementSize/) ——響應式追蹤元素尺寸

---

ReactUse 提供了 100+ 個 React Hook。[探索所有 Hook →](https://reactuse.com)
