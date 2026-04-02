---
title: "React 滑鼠追蹤與互動效果實戰"
description: "學習如何用 ReactUse 的 Hook 實現游標跟隨、按壓偵測、元素定位、塗抹畫板和螢幕取色器，告別手寫事件監聽的繁瑣程式碼。"
slug: react-mouse-tracking
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, mouse, interactive, tutorial]
keywords: [react mouse tracking, useMouse, useMousePressed, react cursor effects, useElementBounding, useScratch, useEyeDropper, react interactive effects]
image: /img/og.png
---

# React 滑鼠追蹤與互動效果實戰

滑鼠是桌面端最核心的輸入裝置，圍繞它打造精緻的互動效果 -- 跟隨指標的自訂游標、對按壓做出回應的按鈕、刮刮卡揭示動畫、從螢幕任意位置吸取顏色的取色器 -- 是讓應用從「堪用」邁向「好用」的關鍵。然而每種效果都仰賴不同的瀏覽器 API、不同的事件監聽器，以及各不相同的清理策略。大多數開發者要嘛引入龐大的互動套件，要嘛手寫大量命令式程式碼，最終留下洩漏監聽器和遺忘觸控裝置的隱患。

<!-- truncate -->

本文採用動手實作的方式。我們將建構五種滑鼠驅動的互動效果，每次先展示手動實作讓你了解底層機制，再用 [ReactUse](https://reactuse.com) 中對應的 Hook 取代。讀完之後，你將擁有一組可組合的 Hook 工具箱，涵蓋滑鼠追蹤、按壓偵測、元素邊界追蹤、塗抹畫板和顏色拾取 -- 全部 SSR 安全，可直接用於正式環境。

## 1. 用 useMouse 追蹤滑鼠位置

### 手動實作

追蹤游標看起來很簡單 -- 監聽 `mousemove`，讀取 `clientX`/`clientY`。但實際場景往往需要頁面相對座標、元素相對座標，還得節流以避免版面抖動。

```tsx
import { useEffect, useRef, useState } from "react";

interface MousePos {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  elementX: number;
  elementY: number;
}

function ManualMouseTracker() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<MousePos>({
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    elementX: 0,
    elementY: 0,
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const box = boxRef.current;
      let elX = 0;
      let elY = 0;
      if (box) {
        const rect = box.getBoundingClientRect();
        elX = e.pageX - (rect.left + window.scrollX);
        elY = e.pageY - (rect.top + window.scrollY);
      }
      setPos({
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
        elementX: elX,
        elementY: elY,
      });
    };

    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <p>
        頁面座標: ({pos.pageX}, {pos.pageY})
      </p>
      <div
        ref={boxRef}
        style={{
          width: 300,
          height: 200,
          background: "#f1f5f9",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#4f46e5",
            position: "absolute",
            left: pos.elementX - 6,
            top: pos.elementY - 6,
            pointerEvents: "none",
          }}
        />
        <p style={{ padding: 16, margin: 0 }}>
          元素座標: ({Math.round(pos.elementX)}, {Math.round(pos.elementY)})
        </p>
      </div>
    </div>
  );
}
```

這在簡單示範中可以運作，但每次滑鼠移動都觸發 `setState` 而沒有經過 `requestAnimationFrame` 節流，也不會回報螢幕座標或元素尺寸。如果全部補上，程式碼量會迅速膨脹。

### 用 useMouse

[`useMouse`](https://reactuse.com/browser/useMouse/) 回傳一個包含 `screenX`、`screenY`、`clientX`、`clientY`、`pageX`、`pageY` 以及元素相關的 `elementX`、`elementY`、`elementW`、`elementH`、`elementPosX`、`elementPosY` 的狀態物件，所有更新透過 `requestAnimationFrame` 自動批次處理。

```tsx
import { useMouse } from "@reactuses/core";
import { useRef } from "react";

function MouseTracker() {
  const boxRef = useRef<HTMLDivElement>(null);
  const mouse = useMouse(boxRef);

  return (
    <div style={{ padding: 24 }}>
      <p>
        頁面座標: ({mouse.pageX}, {mouse.pageY})
      </p>
      <p>
        視窗座標: ({mouse.clientX}, {mouse.clientY})
      </p>
      <div
        ref={boxRef}
        style={{
          width: 300,
          height: 200,
          background: "#f1f5f9",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#4f46e5",
            position: "absolute",
            left: mouse.elementX - 6,
            top: mouse.elementY - 6,
            pointerEvents: "none",
            transition: "opacity 0.15s",
            opacity: Number.isNaN(mouse.elementX) ? 0 : 1,
          }}
        />
        <p style={{ padding: 16, margin: 0 }}>
          元素座標: ({Math.round(mouse.elementX)},{" "}
          {Math.round(mouse.elementY)})
        </p>
        <p style={{ padding: "0 16px", margin: 0 }}>
          元素尺寸: {mouse.elementW} x {mouse.elementH}
        </p>
      </div>
    </div>
  );
}
```

一行 Hook 就能拿到所有座標系的資料。`requestAnimationFrame` 批次處理是內建的，不會出現撕裂幀。傳入 ref 就自動計算元素相對值；不傳 ref 照樣能取得全域座標。

### 實戰：聚光燈懸停效果

一種常見的設計模式是卡片在滑鼠懸停時周圍「發光」。用 `useMouse` 實作起來非常輕鬆：

```tsx
import { useMouse } from "@reactuses/core";
import { useRef } from "react";

function SpotlightCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const { elementX, elementY, elementW, elementH } = useMouse(cardRef);

  const isInside =
    !Number.isNaN(elementX) &&
    elementX >= 0 &&
    elementX <= elementW &&
    elementY >= 0 &&
    elementY <= elementH;

  return (
    <div
      ref={cardRef}
      style={{
        width: 360,
        height: 240,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        position: "relative",
        overflow: "hidden",
        background: "#0f172a",
        color: "#f8fafc",
        padding: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isInside
            ? `radial-gradient(circle 180px at ${elementX}px ${elementY}px, rgba(99,102,241,0.25), transparent)`
            : "transparent",
          pointerEvents: "none",
          transition: "opacity 0.2s",
        }}
      />
      <h3 style={{ position: "relative" }}>進階方案</h3>
      <p style={{ position: "relative", opacity: 0.7 }}>
        在卡片上任意移動滑鼠，觀察聚光燈跟隨效果。
      </p>
    </div>
  );
}
```

## 2. 用 useMousePressed 偵測滑鼠按壓狀態

### 手動實作

偵測滑鼠按鈕是否處於按下狀態，至少需要監聽 `mousedown` 和 `mouseup`。如果還要支援觸控，就得加上 `touchstart`、`touchend` 和 `touchcancel`。再算上拖曳事件，監聽器數量很快就失控了：

```tsx
import { useEffect, useState } from "react";

function ManualPressDetector() {
  const [pressed, setPressed] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const onMouseDown = () => {
      setPressed(true);
      setSource("mouse");
    };
    const onTouchStart = () => {
      setPressed(true);
      setSource("touch");
    };
    const onUp = () => {
      setPressed(false);
      setSource(null);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);
    };
  }, []);

  return (
    <div
      style={{
        padding: 40,
        background: pressed ? "#4f46e5" : "#f1f5f9",
        color: pressed ? "#fff" : "#0f172a",
        transition: "all 0.15s",
        borderRadius: 12,
        textAlign: "center",
        userSelect: "none",
      }}
    >
      {pressed ? `已按下！(${source})` : "在任意位置點擊或觸控並按住"}
    </div>
  );
}
```

五個事件監聽、五個清理呼叫，而且還沒處理拖曳事件，也不支援將偵測範圍限定到特定元素。

### 用 useMousePressed

[`useMousePressed`](https://reactuse.com/browser/useMousePressed/) 把所有這些封裝成一行呼叫。回傳 `[pressed, sourceType]` 元組，開箱即用支援滑鼠、觸控和拖曳事件，可透過 ref 將偵測範圍限定到特定元素。

```tsx
import { useMousePressed } from "@reactuses/core";
import { useRef } from "react";

function PressDetector() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [pressed, sourceType] = useMousePressed(areaRef);

  return (
    <div
      ref={areaRef}
      style={{
        padding: 40,
        background: pressed ? "#4f46e5" : "#f1f5f9",
        color: pressed ? "#fff" : "#0f172a",
        transition: "all 0.15s",
        borderRadius: 12,
        textAlign: "center",
        userSelect: "none",
        cursor: "pointer",
      }}
    >
      {pressed
        ? `已透過 ${sourceType} 按下！`
        : "在此區域點擊或觸控並按住"}
    </div>
  );
}
```

`touch` 和 `drag` 選項預設為 `true`，觸控和拖曳按壓會自動偵測。設為 `false` 可限制為僅偵測滑鼠點擊。

### 實戰：長按確認按鈕

長按確認按鈕可以防止誤操作。這裡用 `useMousePressed` 實作一個：

```tsx
import { useMousePressed } from "@reactuses/core";
import { useRef, useState, useEffect } from "react";

function HoldToConfirm({ onConfirm }: { onConfirm: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pressed] = useMousePressed(btnRef);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!pressed) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          onConfirm();
          return 100;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [pressed, onConfirm]);

  return (
    <button
      ref={btnRef}
      style={{
        position: "relative",
        padding: "12px 32px",
        border: "none",
        borderRadius: 8,
        background: "#ef4444",
        color: "#fff",
        fontSize: 16,
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.2)",
          width: `${progress}%`,
          transition: pressed ? "none" : "width 0.3s",
        }}
      />
      <span style={{ position: "relative" }}>
        {progress >= 100
          ? "已確認！"
          : pressed
            ? `按住中... ${progress}%`
            : "長按以刪除"}
      </span>
    </button>
  );
}
```

## 3. 用 useElementBounding 追蹤元素位置

### 手動實作

精確取得元素在頁面上的位置和尺寸對 tooltip、彈出層和拖放命中區域至關重要。手動方式需要用 `getBoundingClientRect` 加上捲動和視窗大小變化的監聽：

```tsx
import { useEffect, useRef, useState } from "react";

interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function ManualBounding() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<BoundingRect>({
    x: 0, y: 0, width: 0, height: 0,
    top: 0, right: 0, bottom: 0, left: 0,
  });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({
        x: r.x, y: r.y, width: r.width, height: r.height,
        top: r.top, right: r.right, bottom: r.bottom, left: r.left,
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: 24, minHeight: "200vh" }}>
      <div
        ref={boxRef}
        style={{
          width: 200,
          height: 120,
          background: "#4f46e5",
          borderRadius: 8,
          marginTop: 100,
        }}
      />
      <pre style={{ marginTop: 16 }}>
        {JSON.stringify(rect, null, 2)}
      </pre>
    </div>
  );
}
```

三個事件來源（捲動、視窗大小、ResizeObserver）、三條清理路徑，而且還沒處理 CSS transform 或兄弟元素導致的版面偏移。

### 用 useElementBounding

[`useElementBounding`](https://reactuse.com/element/useElementBounding/) 回傳一個即時更新的邊界矩形，當捲動、視窗大小變化或元素尺寸改變時自動重新整理。回傳 `{ x, y, width, height, top, right, bottom, left, update }`。

```tsx
import { useElementBounding } from "@reactuses/core";
import { useRef } from "react";

function BoundingTracker() {
  const boxRef = useRef<HTMLDivElement>(null);
  const { x, y, width, height, top, right, bottom, left } =
    useElementBounding(boxRef);

  return (
    <div style={{ padding: 24, minHeight: "200vh" }}>
      <div
        ref={boxRef}
        style={{
          width: 200,
          height: 120,
          background: "#4f46e5",
          borderRadius: 8,
          marginTop: 100,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Math.round(width)} x {Math.round(height)}
      </div>
      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "#f8fafc",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 14,
        }}
      >
        <div>x: {Math.round(x)}, y: {Math.round(y)}</div>
        <div>top: {Math.round(top)}, right: {Math.round(right)}</div>
        <div>bottom: {Math.round(bottom)}, left: {Math.round(left)}</div>
      </div>
    </div>
  );
}
```

所有監聽 -- 捲動、視窗大小、ResizeObserver -- 都在內部處理。你也可以透過 `windowScroll: false` 或 `windowResize: false` 等選項停用不需要的更新觸發器。

### 實戰：動態 Tooltip 定位

Tooltip 需要隨時知道觸發元素的位置。下面是一個即使在頁面捲動時也能準確定位的 tooltip：

```tsx
import { useElementBounding } from "@reactuses/core";
import { useRef, useState } from "react";

function TooltipDemo() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const { x, y, width, height } = useElementBounding(btnRef);
  const [show, setShow] = useState(false);

  return (
    <div style={{ padding: 24, minHeight: "200vh" }}>
      <div style={{ marginTop: 300 }}>
        <button
          ref={btnRef}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          style={{
            padding: "8px 16px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          懸停我（可嘗試捲動）
        </button>
      </div>

      {show && (
        <div
          style={{
            position: "fixed",
            left: x + width / 2,
            top: y - 8,
            transform: "translate(-50%, -100%)",
            padding: "6px 12px",
            background: "#1e293b",
            color: "#fff",
            borderRadius: 6,
            fontSize: 13,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          即使捲動也能跟隨按鈕！
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 8,
              height: 8,
              background: "#1e293b",
            }}
          />
        </div>
      )}
    </div>
  );
}
```

因為 `useElementBounding` 在捲動時自動更新，tooltip 位置始終準確 -- 你不需要額外添加任何事件監聽器。

## 4. 用 useScratch 建構塗抹畫板

### 手動實作

塗抹互動 -- 使用者在一個區域拖曳，你追蹤起始點、目前位置和偏移量 -- 需要同時處理滑鼠和觸控事件，計算元素相對座標，還要記錄時間戳：

```tsx
import { useEffect, useRef, useState } from "react";

interface ScratchState {
  isScratching: boolean;
  startX: number;
  startY: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

function ManualScratchPad() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScratchState>({
    isScratching: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
  });
  const [lines, setLines] = useState<Array<{ x: number; y: number }>>([]);
  const scratchingRef = useRef(false);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const getRelativePos = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      const pos = getRelativePos(e.clientX, e.clientY);
      scratchingRef.current = true;
      setState({
        isScratching: true,
        startX: pos.x,
        startY: pos.y,
        x: pos.x,
        y: pos.y,
        dx: 0,
        dy: 0,
      });
      setLines([pos]);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!scratchingRef.current) return;
      const pos = getRelativePos(e.clientX, e.clientY);
      setState((prev) => ({
        ...prev,
        dx: pos.x - prev.x,
        dy: pos.y - prev.y,
        x: pos.x,
        y: pos.y,
      }));
      setLines((prev) => [...prev, pos]);
    };

    const onMouseUp = () => {
      scratchingRef.current = false;
      setState((prev) => ({ ...prev, isScratching: false }));
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div
        ref={canvasRef}
        style={{
          width: 400,
          height: 300,
          background: "#f1f5f9",
          borderRadius: 8,
          cursor: "crosshair",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          style={{ position: "absolute", inset: 0 }}
          width={400}
          height={300}
        >
          {lines.length > 1 && (
            <polyline
              points={lines.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#4f46e5"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        <p style={{ padding: 16, margin: 0, color: "#94a3b8" }}>
          {state.isScratching ? "繪製中..." : "在這裡畫畫"}
        </p>
      </div>
    </div>
  );
}
```

程式碼已經相當冗長了，而且只處理了滑鼠事件 -- 沒有觸控支援。加上觸控意味著為 `touchstart`、`touchmove`、`touchend` 複製每一個處理函式。它也沒有使用 `requestAnimationFrame`，快速移動可能讓 React 的渲染應接不暇。

### 用 useScratch

[`useScratch`](https://reactuse.com/browser/useScratch/) 同時處理滑鼠和觸控事件，計算元素相對座標，追蹤時間戳，並透過 `requestAnimationFrame` 批次更新狀態。回傳包含 `isScratching`、`x`、`y`、`dx`、`dy`、`elW`、`elH` 和時間戳的狀態物件。

```tsx
import { useScratch } from "@reactuses/core";
import { useRef, useState, useEffect } from "react";

function ScratchPad() {
  const padRef = useRef<HTMLDivElement>(null);
  const state = useScratch(padRef);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    if (state.isScratching && state.x !== undefined && state.y !== undefined) {
      setPoints((prev) => [...prev, { x: state.x!, y: state.y! }]);
    }
  }, [state.isScratching, state.x, state.y]);

  return (
    <div style={{ padding: 24 }}>
      <div
        ref={padRef}
        style={{
          width: 400,
          height: 300,
          background: "#f1f5f9",
          borderRadius: 8,
          cursor: "crosshair",
          position: "relative",
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        <svg
          style={{ position: "absolute", inset: 0 }}
          width={400}
          height={300}
        >
          {points.length > 1 && (
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#4f46e5"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        <div style={{ padding: 16, color: "#94a3b8", position: "relative" }}>
          {state.isScratching ? (
            <span>
              繪製中 ({Math.round(state.x ?? 0)},{" "}
              {Math.round(state.y ?? 0)}) -- 偏移: (
              {Math.round(state.dx ?? 0)}, {Math.round(state.dy ?? 0)})
            </span>
          ) : (
            "在這裡畫畫（滑鼠或觸控）"
          )}
        </div>
      </div>
      <button
        onClick={() => setPoints([])}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          background: "#e2e8f0",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        清除
      </button>
    </div>
  );
}
```

觸控支援、`requestAnimationFrame` 批次處理、元素相對座標計算全由 Hook 搞定。你還可以透過 `onScratchStart`、`onScratch` 和 `onScratchEnd` 選項使用回呼模式，如果你更偏好事件驅動而非響應式狀態。

### 實戰：刮刮卡揭示效果

經典的刮刮卡效果，使用者刮掉覆蓋層後展示隱藏內容：

```tsx
import { useScratch } from "@reactuses/core";
import { useRef, useState, useCallback } from "react";

function ScratchToReveal() {
  const coverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);

  const state = useScratch(coverRef, {
    onScratch: (s) => {
      const canvas = canvasRef.current;
      if (!canvas || !s.x || !s.y) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // 檢查已刮開的面積
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparent++;
      }
      const ratio = transparent / (pixels.length / 4);
      if (ratio > 0.5) {
        setRevealed(true);
      }
    },
  });

  const initCanvas = useCallback((el: HTMLCanvasElement | null) => {
    if (!el) return;
    (canvasRef as React.MutableRefObject<HTMLCanvasElement>).current = el;
    const ctx = el.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("刮開這裡！", el.width / 2, el.height / 2);
    }
  }, []);

  return (
    <div
      ref={coverRef}
      style={{
        width: 300,
        height: 150,
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        cursor: "crosshair",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        恭喜你中獎了！
      </div>

      {!revealed && (
        <canvas
          ref={initCanvas}
          width={300}
          height={150}
          style={{ position: "absolute", inset: 0 }}
        />
      )}
    </div>
  );
}
```

## 5. 用 useEyeDropper 從螢幕取色

### 手動實作

EyeDropper API 比較新，目前僅在 Chromium 系瀏覽器中可用。直接使用需要偵測支援性、處理非同步邏輯和中止訊號：

```tsx
import { useState, useCallback } from "react";

function ManualColorPicker() {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" && "EyeDropper" in window;

  const pickColor = useCallback(async () => {
    if (!isSupported) {
      setError("目前瀏覽器不支援 EyeDropper API");
      return;
    }
    try {
      const dropper = new (window as any).EyeDropper();
      const result = await dropper.open();
      setColor(result.sRGBHex);
      setError(null);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message);
      }
    }
  }, [isSupported]);

  return (
    <div style={{ padding: 24 }}>
      <button
        onClick={pickColor}
        disabled={!isSupported}
        style={{
          padding: "8px 16px",
          background: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: isSupported ? "pointer" : "not-allowed",
          opacity: isSupported ? 1 : 0.5,
        }}
      >
        拾取顏色
      </button>
      {color && (
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: color,
              border: "1px solid #e2e8f0",
            }}
          />
          <code>{color}</code>
        </div>
      )}
      {error && <p style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}
```

功能偵測、非同步處理和錯誤管理的樣板程式碼雖然不算誇張，但在多處使用時就會不斷累積。

### 用 useEyeDropper

[`useEyeDropper`](https://reactuse.com/browser/useEyeDropper/) 將 EyeDropper API 封裝為簡潔的 `[isSupported, open]` 元組。`open` 函式回傳一個 Promise，resolve 為 `{ sRGBHex: string }`。如果 API 不支援，`isSupported` 為 `false`，`open` 會 resolve 空字串。

```tsx
import { useEyeDropper } from "@reactuses/core";
import { useState } from "react";

function ColorPicker() {
  const [isSupported, open] = useEyeDropper();
  const [color, setColor] = useState<string | null>(null);

  const pickColor = async () => {
    const { sRGBHex } = await open();
    if (sRGBHex) {
      setColor(sRGBHex);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {!isSupported && (
        <p style={{ color: "#f59e0b" }}>
          你的瀏覽器不支援 EyeDropper API。
        </p>
      )}
      <button
        onClick={pickColor}
        disabled={!isSupported}
        style={{
          padding: "8px 16px",
          background: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: isSupported ? "pointer" : "not-allowed",
          opacity: isSupported ? 1 : 0.5,
        }}
      >
        從螢幕取色
      </button>
      {color && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: color,
              border: "1px solid #e2e8f0",
            }}
          />
          <code style={{ fontSize: 18 }}>{color}</code>
        </div>
      )}
    </div>
  );
}
```

簡潔、宣告式，支援偵測始終可用，方便你在不支援的瀏覽器中展示降級 UI。

### 實戰：調色盤建構器

從螢幕任何位置取色來建構一個調色盤：

```tsx
import { useEyeDropper } from "@reactuses/core";
import { useState } from "react";

function PaletteBuilder() {
  const [isSupported, open] = useEyeDropper();
  const [palette, setPalette] = useState<string[]>([]);

  const addColor = async () => {
    const { sRGBHex } = await open();
    if (sRGBHex) {
      setPalette((prev) =>
        prev.includes(sRGBHex) ? prev : [...prev, sRGBHex]
      );
    }
  };

  const removeColor = (hex: string) => {
    setPalette((prev) => prev.filter((c) => c !== hex));
  };

  return (
    <div style={{ padding: 24 }}>
      <h3>調色盤建構器</h3>
      <button
        onClick={addColor}
        disabled={!isSupported}
        style={{
          padding: "8px 20px",
          background: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        + 取色
      </button>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {palette.map((hex) => (
          <div
            key={hex}
            onClick={() => removeColor(hex)}
            title="點擊移除"
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              background: hex,
              border: "2px solid #e2e8f0",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                background: "rgba(255,255,255,0.8)",
                borderRadius: 3,
                padding: "1px 4px",
              }}
            >
              {hex}
            </span>
          </div>
        ))}
      </div>
      {palette.length === 0 && (
        <p style={{ color: "#94a3b8" }}>
          從螢幕上任意位置取色來建構你的調色盤。
        </p>
      )}
    </div>
  );
}
```

## 6. 綜合實戰：互動式畫布工具

這些 Hook 天然可組合。下面是一個互動式繪圖工具，將滑鼠追蹤、按壓偵測、元素邊界、塗抹互動和取色器融為一體：

```tsx
import {
  useMouse,
  useMousePressed,
  useElementBounding,
  useScratch,
  useEyeDropper,
} from "@reactuses/core";
import { useRef, useState, useEffect } from "react";

function InteractiveCanvasTool() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 追蹤滑鼠以顯示游標預覽
  const mouse = useMouse(canvasRef);

  // 偵測按壓狀態以提供視覺回饋
  const [pressed] = useMousePressed(canvasRef);

  // 追蹤畫布位置以實現疊加層的絕對定位
  const canvasBounds = useElementBounding(canvasRef);

  // 塗抹狀態用於繪圖
  const scratch = useScratch(canvasRef);

  // 顏色拾取器
  const [isEyeDropperSupported, openEyeDropper] = useEyeDropper();

  // 繪圖狀態
  const [brushColor, setBrushColor] = useState("#4f46e5");
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState<
    Array<{ points: Array<{ x: number; y: number }>; color: string; size: number }>
  >([]);
  const [currentStroke, setCurrentStroke] = useState<
    Array<{ x: number; y: number }>
  >([]);

  // 塗抹過程中累積路徑點
  useEffect(() => {
    if (scratch.isScratching && scratch.x !== undefined && scratch.y !== undefined) {
      setCurrentStroke((prev) => [...prev, { x: scratch.x!, y: scratch.y! }]);
    }
  }, [scratch.isScratching, scratch.x, scratch.y]);

  // 塗抹結束時儲存筆畫
  useEffect(() => {
    if (!scratch.isScratching && currentStroke.length > 1) {
      setStrokes((prev) => [
        ...prev,
        { points: currentStroke, color: brushColor, size: brushSize },
      ]);
      setCurrentStroke([]);
    }
  }, [scratch.isScratching, currentStroke, brushColor, brushSize]);

  const pickColor = async () => {
    const { sRGBHex } = await openEyeDropper();
    if (sRGBHex) {
      setBrushColor(sRGBHex);
    }
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const isInsideCanvas =
    !Number.isNaN(mouse.elementX) &&
    mouse.elementX >= 0 &&
    mouse.elementX <= (canvasBounds.width || 0) &&
    mouse.elementY >= 0 &&
    mouse.elementY <= (canvasBounds.height || 0);

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>互動式畫布工具</h2>

      {/* 工具列 */}
      <div
        ref={toolbarRef}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: 8,
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          顏色:
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            style={{
              width: 32,
              height: 32,
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          />
        </label>

        {isEyeDropperSupported && (
          <button
            onClick={pickColor}
            style={{
              padding: "6px 12px",
              background: "#e2e8f0",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            從螢幕取色
          </button>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          大小:
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: 100 }}
          />
          <span style={{ fontSize: 13 }}>{brushSize}px</span>
        </label>

        <button
          onClick={clearCanvas}
          style={{
            padding: "6px 12px",
            background: "#fee2e2",
            color: "#ef4444",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          清除
        </button>
      </div>

      {/* 畫布 */}
      <div
        ref={canvasRef}
        style={{
          width: "100%",
          height: 400,
          background: "#fff",
          border: "2px solid #e2e8f0",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
          cursor: "crosshair",
          touchAction: "none",
        }}
      >
        <svg
          style={{ position: "absolute", inset: 0 }}
          width="100%"
          height="100%"
        >
          {strokes.map((stroke, i) => (
            <polyline
              key={i}
              points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.size}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {currentStroke.length > 1 && (
            <polyline
              points={currentStroke.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={brushColor}
              strokeWidth={brushSize}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {isInsideCanvas && !pressed && (
          <div
            style={{
              position: "absolute",
              left: mouse.elementX - brushSize / 2,
              top: mouse.elementY - brushSize / 2,
              width: brushSize,
              height: brushSize,
              borderRadius: "50%",
              border: `1px solid ${brushColor}`,
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* 狀態列 */}
      <div
        style={{
          marginTop: 12,
          padding: "8px 16px",
          background: "#f8fafc",
          borderRadius: 6,
          fontSize: 13,
          display: "flex",
          gap: 24,
          color: "#64748b",
        }}
      >
        <span>
          游標: ({Math.round(mouse.elementX)},{" "}
          {Math.round(mouse.elementY)})
        </span>
        <span>
          畫布: {Math.round(canvasBounds.width)} x{" "}
          {Math.round(canvasBounds.height)}
        </span>
        <span>
          狀態: {scratch.isScratching ? "繪製中" : pressed ? "已按下" : "閒置"}
        </span>
        <span>筆畫數: {strokes.length}</span>
      </div>
    </div>
  );
}
```

五個 Hook，各司其職：

- **`useMouse`** 提供游標位置，用於畫筆預覽圓圈
- **`useMousePressed`** 驅動視覺回饋和狀態指示器
- **`useElementBounding`** 追蹤畫布尺寸，用於邊界檢查
- **`useScratch`** 處理實際的繪圖互動，同時支援滑鼠和觸控
- **`useEyeDropper`** 讓使用者從螢幕任意位置取樣顏色

它們天然共享 ref，互不衝突，卸載時全部自動清理。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hook

- [`useMouse`](https://reactuse.com/browser/useMouse/) -- 追蹤多種座標系下的滑鼠位置
- [`useMousePressed`](https://reactuse.com/browser/useMousePressed/) -- 偵測滑鼠/觸控/拖曳按壓狀態
- [`useElementBounding`](https://reactuse.com/element/useElementBounding/) -- 取得元素的即時邊界矩形
- [`useScratch`](https://reactuse.com/browser/useScratch/) -- 追蹤元素上的塗抹/拖曳手勢
- [`useEyeDropper`](https://reactuse.com/browser/useEyeDropper/) -- 從螢幕任意位置拾取顏色
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) -- 宣告式地新增事件監聽器
- [`useRafState`](https://reactuse.com/state/useRafState/) -- 透過 requestAnimationFrame 批次更新狀態
- [`useElementSize`](https://reactuse.com/element/useElementSize/) -- 響應式追蹤元素尺寸
- [`useSupported`](https://reactuse.com/browser/useSupported/) -- 響應式偵測瀏覽器 API 支援

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
