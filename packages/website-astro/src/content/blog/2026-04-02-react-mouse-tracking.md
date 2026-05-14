---
title: "React Mouse Tracking and Interactive Effects"
description: "Learn how to build cursor-following effects, press interactions, element-relative positioning, scratch pads, and color pickers in React using hooks from ReactUse."
slug: react-mouse-tracking
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, mouse, interactive, tutorial]
keywords: [react mouse tracking, useMouse, useMousePressed, react cursor effects, useElementBounding, useScratch, useEyeDropper, react interactive effects]
image: /img/og.png
---

# React Mouse Tracking and Interactive Effects

The mouse is the primary input device on desktop, and building delightful interactions around it -- custom cursors that follow the pointer, buttons that react to presses, scratch-to-reveal cards, color pickers that sample any pixel on screen -- is what separates a polished app from a plain one. Yet every one of these effects requires a different browser API, a different set of event listeners, and a different cleanup strategy. Most developers either reach for a large interaction library or write fragile imperative code that leaks listeners and forgets about touch devices.

<!-- truncate -->

This post takes a hands-on approach. We will build five mouse-driven interactions, starting each time with the manual implementation so you understand the plumbing, then replacing it with a purpose-built hook from [ReactUse](https://reactuse.com). By the end you will have a toolkit of composable hooks that cover mouse tracking, press detection, element bounding, scratch surfaces, and color picking -- all SSR-safe and ready for production.

## 1. Tracking Mouse Position with useMouse

### The Manual Way

Tracking the cursor seems simple -- listen to `mousemove` and read `clientX`/`clientY`. But real-world use cases need more: page-relative coordinates, element-relative coordinates, and throttling to avoid layout thrashing.

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
        Page: ({pos.pageX}, {pos.pageY})
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
          Element: ({Math.round(pos.elementX)}, {Math.round(pos.elementY)})
        </p>
      </div>
    </div>
  );
}
```

This works for a basic demo, but it fires on every pixel of movement without throttling, it does not use `requestAnimationFrame` to batch updates, and it does not report screen-relative or element-dimension values. Adding all that means more state, more refs, and more cleanup.

### With useMouse

[`useMouse`](https://reactuse.com/browser/usemouse/) returns a comprehensive state object with `screenX`, `screenY`, `clientX`, `clientY`, `pageX`, `pageY`, plus element-relative `elementX`, `elementY`, `elementW`, `elementH`, `elementPosX`, and `elementPosY`. Updates are batched through `requestAnimationFrame` automatically.

```tsx
import { useMouse } from "@reactuses/core";
import { useRef } from "react";

function MouseTracker() {
  const boxRef = useRef<HTMLDivElement>(null);
  const mouse = useMouse(boxRef);

  return (
    <div style={{ padding: 24 }}>
      <p>
        Page: ({mouse.pageX}, {mouse.pageY})
      </p>
      <p>
        Client: ({mouse.clientX}, {mouse.clientY})
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
        {/* Cursor dot that follows the mouse within the element */}
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
          Element: ({Math.round(mouse.elementX)},{" "}
          {Math.round(mouse.elementY)})
        </p>
        <p style={{ padding: "0 16px", margin: 0 }}>
          Element size: {mouse.elementW} x {mouse.elementH}
        </p>
      </div>
    </div>
  );
}
```

One hook call gives you every coordinate system you might need. The `requestAnimationFrame` batching is built in, so you never see torn frames. Passing a ref makes the hook compute element-relative values automatically; omit the ref and you still get all the global coordinates.

### Practical example: spotlight hover effect

A common design pattern is a card that "lights up" around the cursor on hover. With `useMouse`, this becomes trivial:

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
      {/* Radial spotlight */}
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
      <h3 style={{ position: "relative" }}>Premium Plan</h3>
      <p style={{ position: "relative", opacity: 0.7 }}>
        Hover anywhere on this card to see the spotlight follow your cursor.
      </p>
    </div>
  );
}
```

## 2. Detecting Mouse Press State with useMousePressed

### The Manual Way

Detecting whether the mouse button is currently held down requires listening to `mousedown` and `mouseup` at minimum. If you also want touch support, you need `touchstart`, `touchend`, and `touchcancel`. And if drag events are involved, add `dragstart`, `drop`, and `dragend`:

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
      {pressed ? `Pressed! (${source})` : "Click or touch and hold anywhere"}
    </div>
  );
}
```

Five event listeners, five cleanup calls, and this still does not handle drag events or scoped targets. If you want the press detection to apply only within a specific element, you need to restructure the entire approach.

### With useMousePressed

[`useMousePressed`](https://reactuse.com/browser/usemousepressed/) wraps all of this into a single call. It returns a `[pressed, sourceType]` tuple, supports mouse, touch, and drag events out of the box, and can be scoped to a specific element via a ref.

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
        ? `Pressed via ${sourceType}!`
        : "Click or touch and hold this area"}
    </div>
  );
}
```

The `touch` and `drag` options default to `true`, so touch and drag presses are detected automatically. Set either to `false` if you want to limit detection to mouse clicks only.

### Practical example: hold-to-confirm button

Hold-to-confirm buttons prevent accidental actions. Here is one built with `useMousePressed`:

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
          ? "Confirmed!"
          : pressed
            ? `Hold... ${progress}%`
            : "Hold to Delete"}
      </span>
    </button>
  );
}
```

## 3. Element Position Tracking with useElementBounding

### The Manual Way

Knowing the exact position and size of an element on the page is essential for tooltips, popovers, drag-and-drop hit zones, and more. The manual approach uses `getBoundingClientRect` plus listeners for scroll and resize:

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

    // ResizeObserver for element-level resizing
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

Three separate event sources (scroll, resize, ResizeObserver), three cleanup paths, and this still does not handle cases like CSS transforms or layout shifts caused by sibling elements.

### With useElementBounding

[`useElementBounding`](https://reactuse.com/element/useelementbounding/) returns a live bounding rectangle that automatically updates on scroll, resize, and element dimension changes via `ResizeObserver`. It returns `{ x, y, width, height, top, right, bottom, left, update }`.

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

All the wiring -- scroll listener, resize listener, ResizeObserver -- is handled internally. You can also pass options like `windowScroll: false` or `windowResize: false` to disable specific update triggers if they are not needed for your use case.

### Practical example: dynamic tooltip positioning

Tooltips need to know where their trigger element is at all times. Here is a tooltip that stays pinned to an element as the page scrolls:

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
          Hover me (scroll to test)
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
          I follow the button even on scroll!
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

Because `useElementBounding` updates on scroll, the tooltip position stays correct even as the user scrolls the page -- without any extra event listeners on your part.

## 4. Building a Scratch Pad with useScratch

### The Manual Way

A scratch interaction -- where the user drags across a surface and you track the starting point, current position, and deltas -- requires handling both mouse and touch events, computing element-relative coordinates, and tracking timing:

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
          {state.isScratching ? "Drawing..." : "Draw here"}
        </p>
      </div>
    </div>
  );
}
```

This is already quite verbose, and it only handles mouse events -- no touch support. Adding touch means duplicating every handler for `touchstart`, `touchmove`, and `touchend`. It also does not use `requestAnimationFrame`, so rapid movements can overwhelm React's rendering.

### With useScratch

[`useScratch`](https://reactuse.com/browser/usescratch/) handles both mouse and touch events, computes element-relative coordinates, tracks timing, and batches state updates via `requestAnimationFrame`. It returns a state object with `isScratching`, `x`, `y`, `dx`, `dy`, `elW`, `elH`, and timestamps.

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
    if (!state.isScratching) {
      // Optionally clear on release
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
              Drawing at ({Math.round(state.x ?? 0)},{" "}
              {Math.round(state.y ?? 0)}) -- delta: (
              {Math.round(state.dx ?? 0)}, {Math.round(state.dy ?? 0)})
            </span>
          ) : (
            "Draw here (mouse or touch)"
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
        Clear
      </button>
    </div>
  );
}
```

Touch support, `requestAnimationFrame` batching, and element-relative coordinate computation are all handled by the hook. You also get callbacks via the `onScratchStart`, `onScratch`, and `onScratchEnd` options if you prefer event-driven patterns over reactive state.

### Practical example: scratch-to-reveal card

A classic scratch-to-reveal effect where the user scratches off a covering layer:

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

      // Check how much has been scratched
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
      ctx.fillText("Scratch here!", el.width / 2, el.height / 2);
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
      {/* Hidden content */}
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
        You won a prize!
      </div>

      {/* Scratch layer */}
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

## 5. Picking Colors from the Screen with useEyeDropper

### The Manual Way

The EyeDropper API is relatively new and only available in Chromium-based browsers. Using it directly means checking for support, handling the async nature of the picker, and dealing with the abort signal:

```tsx
import { useState, useCallback } from "react";

function ManualColorPicker() {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" && "EyeDropper" in window;

  const pickColor = useCallback(async () => {
    if (!isSupported) {
      setError("EyeDropper API is not supported in this browser");
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
        Pick a Color
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

The boilerplate around feature detection, async handling, and error management is not terrible, but it adds up when you use it in multiple places.

### With useEyeDropper

[`useEyeDropper`](https://reactuse.com/browser/useeyedropper/) abstracts the EyeDropper API into a simple `[isSupported, open]` tuple. The `open` function returns a promise that resolves to `{ sRGBHex: string }`. If the API is not supported, `isSupported` is `false` and `open` resolves with an empty string.

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
          EyeDropper API is not supported in your browser.
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
        Pick Color from Screen
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

Clean, declarative, and the support check is always available so you can show a fallback UI in unsupported browsers.

### Practical example: color palette builder

Build a palette by picking colors from anywhere on screen:

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
      <h3>Color Palette Builder</h3>
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
        + Pick Color
      </button>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {palette.map((hex) => (
          <div
            key={hex}
            onClick={() => removeColor(hex)}
            title="Click to remove"
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
          Pick colors from anywhere on your screen to build a palette.
        </p>
      )}
    </div>
  );
}
```

## 6. Putting It All Together: An Interactive Canvas Tool

These hooks compose naturally. Here is an interactive drawing tool that combines mouse tracking, press detection, element bounding, scratch interaction, and a color picker:

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

  // Track mouse for the cursor preview
  const mouse = useMouse(canvasRef);

  // Detect press state for visual feedback
  const [pressed] = useMousePressed(canvasRef);

  // Track canvas position for absolute positioning of overlays
  const canvasBounds = useElementBounding(canvasRef);

  // Scratch state for drawing
  const scratch = useScratch(canvasRef);

  // Color picker
  const [isEyeDropperSupported, openEyeDropper] = useEyeDropper();

  // Drawing state
  const [brushColor, setBrushColor] = useState("#4f46e5");
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState<
    Array<{ points: Array<{ x: number; y: number }>; color: string; size: number }>
  >([]);
  const [currentStroke, setCurrentStroke] = useState<
    Array<{ x: number; y: number }>
  >([]);

  // Accumulate points during a scratch
  useEffect(() => {
    if (scratch.isScratching && scratch.x !== undefined && scratch.y !== undefined) {
      setCurrentStroke((prev) => [...prev, { x: scratch.x!, y: scratch.y! }]);
    }
  }, [scratch.isScratching, scratch.x, scratch.y]);

  // Save stroke when scratching ends
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
      <h2>Interactive Canvas Tool</h2>

      {/* Toolbar */}
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
          Color:
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
            Pick from Screen
          </button>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Size:
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
          Clear
        </button>
      </div>

      {/* Canvas */}
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
        {/* SVG drawing surface */}
        <svg
          style={{ position: "absolute", inset: 0 }}
          width="100%"
          height="100%"
        >
          {/* Completed strokes */}
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

          {/* Current stroke being drawn */}
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

        {/* Cursor preview */}
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

      {/* Status bar */}
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
          Cursor: ({Math.round(mouse.elementX)},{" "}
          {Math.round(mouse.elementY)})
        </span>
        <span>
          Canvas: {Math.round(canvasBounds.width)} x{" "}
          {Math.round(canvasBounds.height)}
        </span>
        <span>
          State: {scratch.isScratching ? "Drawing" : pressed ? "Pressed" : "Idle"}
        </span>
        <span>Strokes: {strokes.length}</span>
      </div>
    </div>
  );
}
```

Five hooks, each handling one responsibility:

- **`useMouse`** provides the cursor position for the brush preview circle
- **`useMousePressed`** drives visual feedback and the status indicator
- **`useElementBounding`** keeps track of the canvas dimensions for boundary checks
- **`useScratch`** handles the actual drawing interaction with both mouse and touch
- **`useEyeDropper`** lets the user sample colors from anywhere on screen

They share refs naturally, do not conflict, and all clean up on unmount.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [`useMouse`](https://reactuse.com/browser/usemouse/) -- Track mouse position across multiple coordinate systems
- [`useMousePressed`](https://reactuse.com/browser/usemousepressed/) -- Detect mouse/touch/drag press state
- [`useElementBounding`](https://reactuse.com/element/useelementbounding/) -- Get live bounding rectangle of an element
- [`useScratch`](https://reactuse.com/browser/usescratch/) -- Track scratch/drag gestures on an element
- [`useEyeDropper`](https://reactuse.com/browser/useeyedropper/) -- Pick colors from anywhere on screen
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) -- Attach event listeners declaratively
- [`useRafState`](https://reactuse.com/state/userafstate/) -- State updates batched with requestAnimationFrame
- [`useElementSize`](https://reactuse.com/element/useelementsize/) -- Track element dimensions reactively
- [`useSupported`](https://reactuse.com/browser/usesupported/) -- Check browser API support reactively

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
