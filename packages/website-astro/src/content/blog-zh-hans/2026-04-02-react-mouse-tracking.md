---
title: "React 鼠标追踪与交互效果实战"
description: "学习如何用 ReactUse 的 Hook 实现光标跟随、按压检测、元素定位、涂抹画板和屏幕取色器，告别手写事件监听的繁琐代码。"
slug: react-mouse-tracking
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, mouse, interactive, tutorial]
keywords: [react mouse tracking, useMouse, useMousePressed, react cursor effects, useElementBounding, useScratch, useEyeDropper, react interactive effects]
image: /img/og.png
---

# React 鼠标追踪与交互效果实战

鼠标是桌面端最核心的输入设备，围绕它构建精致的交互效果 -- 跟随指针的自定义光标、对按压做出响应的按钮、刮刮卡揭示动画、从屏幕任意位置吸取颜色的取色器 -- 是让应用从"能用"走向"好用"的关键。然而每种效果都依赖不同的浏览器 API、不同的事件监听器，以及各不相同的清理策略。大多数开发者要么引入一个庞大的交互库，要么手写大量命令式代码，最终留下泄漏监听器和遗忘触摸设备的隐患。

<!-- truncate -->

本文采用动手实践的方式。我们将构建五种鼠标驱动的交互效果，每次先展示手动实现让你了解底层机制，然后用 [ReactUse](https://reactuse.com) 中对应的 Hook 替换。读完之后，你将拥有一组可组合的 Hook 工具箱，涵盖鼠标追踪、按压检测、元素边界追踪、涂抹画板和颜色拾取 -- 全部 SSR 安全，可直接用于生产环境。

## 1. 用 useMouse 追踪鼠标位置

### 手动实现

追踪光标看起来很简单 -- 监听 `mousemove`，读取 `clientX`/`clientY`。但实际场景往往需要页面相对坐标、元素相对坐标，还得节流以避免布局抖动。

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
        页面坐标: ({pos.pageX}, {pos.pageY})
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
          元素坐标: ({Math.round(pos.elementX)}, {Math.round(pos.elementY)})
        </p>
      </div>
    </div>
  );
}
```

这在简单演示中可以工作，但每次鼠标移动都触发 `setState` 而没有经过 `requestAnimationFrame` 节流，也不会报告屏幕坐标或元素尺寸。如果全部补上，代码量会迅速膨胀。

### 用 useMouse

[`useMouse`](https://reactuse.com/browser/usemouse/) 返回一个包含 `screenX`、`screenY`、`clientX`、`clientY`、`pageX`、`pageY` 以及元素相关的 `elementX`、`elementY`、`elementW`、`elementH`、`elementPosX`、`elementPosY` 的状态对象，所有更新通过 `requestAnimationFrame` 自动批处理。

```tsx
import { useMouse } from "@reactuses/core";
import { useRef } from "react";

function MouseTracker() {
  const boxRef = useRef<HTMLDivElement>(null);
  const mouse = useMouse(boxRef);

  return (
    <div style={{ padding: 24 }}>
      <p>
        页面坐标: ({mouse.pageX}, {mouse.pageY})
      </p>
      <p>
        视口坐标: ({mouse.clientX}, {mouse.clientY})
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
          元素坐标: ({Math.round(mouse.elementX)},{" "}
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

一行 Hook 就能拿到所有坐标系的数据。`requestAnimationFrame` 批处理是内置的，不会出现撕裂帧。传入 ref 就自动计算元素相对值；不传 ref 照样能获取全局坐标。

### 实战：聚光灯悬停效果

一种常见的设计模式是卡片在鼠标悬停时周围"发光"。用 `useMouse` 实现起来非常轻松：

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
      <h3 style={{ position: "relative" }}>高级版方案</h3>
      <p style={{ position: "relative", opacity: 0.7 }}>
        在卡片上任意移动鼠标，观察聚光灯跟随效果。
      </p>
    </div>
  );
}
```

## 2. 用 useMousePressed 检测鼠标按压状态

### 手动实现

检测鼠标按钮是否处于按下状态，至少需要监听 `mousedown` 和 `mouseup`。如果还要支持触摸，就得加上 `touchstart`、`touchend` 和 `touchcancel`。再算上拖拽事件，监听器数量很快就失控了：

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
      {pressed ? `已按下！(${source})` : "在任意位置点击或触摸并按住"}
    </div>
  );
}
```

五个事件监听、五个清理调用，而且还没处理拖拽事件，也不支持将检测范围限定到特定元素。

### 用 useMousePressed

[`useMousePressed`](https://reactuse.com/browser/usemousepressed/) 把所有这些封装成一行调用。返回 `[pressed, sourceType]` 元组，开箱即用支持鼠标、触摸和拖拽事件，可通过 ref 将检测范围限定到特定元素。

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
        ? `已通过 ${sourceType} 按下！`
        : "在此区域点击或触摸并按住"}
    </div>
  );
}
```

`touch` 和 `drag` 选项默认为 `true`，触摸和拖拽按压会自动检测。设为 `false` 可限制为仅检测鼠标点击。

### 实战：长按确认按钮

长按确认按钮可以防止误操作。这里用 `useMousePressed` 实现一个：

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
          ? "已确认！"
          : pressed
            ? `按住中... ${progress}%`
            : "长按以删除"}
      </span>
    </button>
  );
}
```

## 3. 用 useElementBounding 追踪元素位置

### 手动实现

精确获取元素在页面上的位置和尺寸对 tooltip、弹出层和拖放命中区域至关重要。手动方式需要用 `getBoundingClientRect` 加上滚动和窗口大小变化的监听：

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

三个事件源（滚动、窗口大小、ResizeObserver）、三条清理路径，而且还没处理 CSS transform 或兄弟元素导致的布局偏移。

### 用 useElementBounding

[`useElementBounding`](https://reactuse.com/element/useelementbounding/) 返回一个实时更新的边界矩形，当滚动、窗口大小变化或元素尺寸改变时自动刷新。返回 `{ x, y, width, height, top, right, bottom, left, update }`。

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

所有监听 -- 滚动、窗口大小、ResizeObserver -- 都在内部处理。你也可以通过 `windowScroll: false` 或 `windowResize: false` 等选项禁用不需要的更新触发器。

### 实战：动态 Tooltip 定位

Tooltip 需要随时知道触发元素的位置。下面是一个即使在页面滚动时也能准确定位的 tooltip：

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
          悬停我（可尝试滚动）
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
          即使滚动也能跟随按钮！
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

因为 `useElementBounding` 在滚动时自动更新，tooltip 位置始终准确 -- 你不需要额外添加任何事件监听器。

## 4. 用 useScratch 构建涂抹画板

### 手动实现

涂抹交互 -- 用户在一个区域拖动，你追踪起始点、当前位置和偏移量 -- 需要同时处理鼠标和触摸事件，计算元素相对坐标，还要记录时间戳：

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
          {state.isScratching ? "绘制中..." : "在这里画画"}
        </p>
      </div>
    </div>
  );
}
```

代码已经相当冗长了，而且只处理了鼠标事件 -- 没有触摸支持。加上触摸意味着为 `touchstart`、`touchmove`、`touchend` 复制每一个处理函数。它也没有使用 `requestAnimationFrame`，快速移动可能让 React 的渲染应接不暇。

### 用 useScratch

[`useScratch`](https://reactuse.com/browser/usescratch/) 同时处理鼠标和触摸事件，计算元素相对坐标，追踪时间戳，并通过 `requestAnimationFrame` 批量更新状态。返回包含 `isScratching`、`x`、`y`、`dx`、`dy`、`elW`、`elH` 和时间戳的状态对象。

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
              绘制中 ({Math.round(state.x ?? 0)},{" "}
              {Math.round(state.y ?? 0)}) -- 偏移: (
              {Math.round(state.dx ?? 0)}, {Math.round(state.dy ?? 0)})
            </span>
          ) : (
            "在这里画画（鼠标或触摸）"
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

触摸支持、`requestAnimationFrame` 批处理、元素相对坐标计算全由 Hook 搞定。你还可以通过 `onScratchStart`、`onScratch` 和 `onScratchEnd` 选项使用回调模式，如果你更喜欢事件驱动而非响应式状态。

### 实战：刮刮卡揭示效果

经典的刮刮卡效果，用户刮掉覆盖层后展示隐藏内容：

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

      // 检查已刮开的面积
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
      ctx.fillText("刮开这里！", el.width / 2, el.height / 2);
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
        恭喜你中奖了！
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

## 5. 用 useEyeDropper 从屏幕取色

### 手动实现

EyeDropper API 比较新，目前仅在 Chromium 系浏览器中可用。直接使用需要检测支持性、处理异步逻辑和中止信号：

```tsx
import { useState, useCallback } from "react";

function ManualColorPicker() {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" && "EyeDropper" in window;

  const pickColor = useCallback(async () => {
    if (!isSupported) {
      setError("当前浏览器不支持 EyeDropper API");
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
        拾取颜色
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

功能检测、异步处理和错误管理的样板代码虽然不算夸张，但在多处使用时就会不断累积。

### 用 useEyeDropper

[`useEyeDropper`](https://reactuse.com/browser/useeyedropper/) 将 EyeDropper API 封装为简洁的 `[isSupported, open]` 元组。`open` 函数返回一个 Promise，resolve 为 `{ sRGBHex: string }`。如果 API 不支持，`isSupported` 为 `false`，`open` 会 resolve 空字符串。

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
          你的浏览器不支持 EyeDropper API。
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
        从屏幕取色
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

简洁、声明式，支持检测始终可用，方便你在不支持的浏览器中展示降级 UI。

### 实战：调色板构建器

从屏幕任何位置取色来构建一个调色板：

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
      <h3>调色板构建器</h3>
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
            title="点击移除"
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
          从屏幕上任意位置取色来构建你的调色板。
        </p>
      )}
    </div>
  );
}
```

## 6. 综合实战：交互式画布工具

这些 Hook 天然可组合。下面是一个交互式绘图工具，将鼠标追踪、按压检测、元素边界、涂抹交互和取色器融为一体：

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

  // 追踪鼠标以显示光标预览
  const mouse = useMouse(canvasRef);

  // 检测按压状态以提供视觉反馈
  const [pressed] = useMousePressed(canvasRef);

  // 追踪画布位置以实现叠加层的绝对定位
  const canvasBounds = useElementBounding(canvasRef);

  // 涂抹状态用于绘图
  const scratch = useScratch(canvasRef);

  // 颜色拾取器
  const [isEyeDropperSupported, openEyeDropper] = useEyeDropper();

  // 绘图状态
  const [brushColor, setBrushColor] = useState("#4f46e5");
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState<
    Array<{ points: Array<{ x: number; y: number }>; color: string; size: number }>
  >([]);
  const [currentStroke, setCurrentStroke] = useState<
    Array<{ x: number; y: number }>
  >([]);

  // 涂抹过程中累积路径点
  useEffect(() => {
    if (scratch.isScratching && scratch.x !== undefined && scratch.y !== undefined) {
      setCurrentStroke((prev) => [...prev, { x: scratch.x!, y: scratch.y! }]);
    }
  }, [scratch.isScratching, scratch.x, scratch.y]);

  // 涂抹结束时保存笔画
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
      <h2>交互式画布工具</h2>

      {/* 工具栏 */}
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
          颜色:
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
            从屏幕取色
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

      {/* 画布 */}
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

      {/* 状态栏 */}
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
          光标: ({Math.round(mouse.elementX)},{" "}
          {Math.round(mouse.elementY)})
        </span>
        <span>
          画布: {Math.round(canvasBounds.width)} x{" "}
          {Math.round(canvasBounds.height)}
        </span>
        <span>
          状态: {scratch.isScratching ? "绘制中" : pressed ? "已按下" : "空闲"}
        </span>
        <span>笔画数: {strokes.length}</span>
      </div>
    </div>
  );
}
```

五个 Hook，各司其职：

- **`useMouse`** 提供光标位置，用于画笔预览圆圈
- **`useMousePressed`** 驱动视觉反馈和状态指示器
- **`useElementBounding`** 追踪画布尺寸，用于边界检查
- **`useScratch`** 处理实际的绘图交互，同时支持鼠标和触摸
- **`useEyeDropper`** 让用户从屏幕任意位置采样颜色

它们天然共享 ref，互不冲突，卸载时全部自动清理。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hook

- [`useMouse`](https://reactuse.com/browser/usemouse/) -- 追踪多种坐标系下的鼠标位置
- [`useMousePressed`](https://reactuse.com/browser/usemousepressed/) -- 检测鼠标/触摸/拖拽按压状态
- [`useElementBounding`](https://reactuse.com/element/useelementbounding/) -- 获取元素的实时边界矩形
- [`useScratch`](https://reactuse.com/browser/usescratch/) -- 追踪元素上的涂抹/拖拽手势
- [`useEyeDropper`](https://reactuse.com/browser/useeyedropper/) -- 从屏幕任意位置拾取颜色
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) -- 声明式地添加事件监听器
- [`useRafState`](https://reactuse.com/state/userafstate/) -- 通过 requestAnimationFrame 批量更新状态
- [`useElementSize`](https://reactuse.com/element/useelementsize/) -- 响应式追踪元素尺寸
- [`useSupported`](https://reactuse.com/browser/usesupported/) -- 响应式检测浏览器 API 支持

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
