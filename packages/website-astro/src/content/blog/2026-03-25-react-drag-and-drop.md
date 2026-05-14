---
title: "React Drag and Drop Without External Libraries"
description: "Learn how to build drag-and-drop interfaces in React using native browser APIs and the useDraggable and useDropZone hooks. No heavy dependencies required."
slug: react-drag-and-drop
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, drag-and-drop, tutorial, useDraggable]
keywords: [react drag and drop, useDraggable, useDropZone, react dnd, drag drop hooks, react drag and drop without library]
image: /img/og.png
---

# React Drag and Drop Without External Libraries

Drag-and-drop is one of those interactions users expect to "just work." Whether it is reordering a task board, uploading files by dragging them onto a page, or letting users rearrange widgets on a dashboard, the ability to grab something and move it feels natural. Yet most React tutorials immediately reach for heavyweight libraries like `react-dnd` or `dnd-kit` -- packages that are powerful but add significant bundle size and conceptual overhead for many common use cases.

<!-- truncate -->

What if you could get smooth, production-ready drag-and-drop behavior with a single hook call? In this post we will start from raw browser APIs, see why they are painful, and then solve the same problems with two lightweight hooks from [ReactUse](https://reactuse.com): [`useDraggable`](https://reactuse.com/element/usedraggable/) and [`useDropZone`](https://reactuse.com/element/usedropzone/).

## The Manual Approach: Pointer Events by Hand

The most basic way to make an element draggable is to listen for `pointerdown`, `pointermove`, and `pointerup` yourself. Here is what that typically looks like:

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
      Drag me
    </div>
  );
}
```

It works -- but look at the amount of state you have to manage. And this is the *simple* version. Real-world requirements quickly pile on more complexity.

## Why Manual Drag-and-Drop is Hard

The snippet above has several shortcomings that surface the moment you move beyond a demo:

1. **Container bounds.** If you want the element to stay inside a parent container, you need to read the container dimensions on every move and clamp the position. That means calling `getBoundingClientRect` on two elements each frame.

2. **Pointer types.** The code above handles mouse events, but what about touch or pen? The `PointerEvent` API unifies them, yet filtering by pointer type (e.g., disabling drag for pen) requires extra conditionals.

3. **Drag handles.** Sometimes the draggable surface is only a small title bar inside a card. You need to split the "trigger" element from the "moving" element and wire the events accordingly.

4. **Event cleanup.** Forgetting to remove listeners -- or adding them with the wrong dependencies in `useEffect` -- causes subtle bugs like elements that keep moving after you release the mouse.

5. **Drop zones.** The HTML5 Drag and Drop API introduces `dragenter`, `dragover`, `dragleave`, and `drop`. Coordinating these events -- especially the notorious `dragenter`/`dragleave` flickering on child elements -- is error-prone.

These are exactly the problems that `useDraggable` and `useDropZone` solve out of the box.

## useDraggable: One Hook, Full Control

[`useDraggable`](https://reactuse.com/element/usedraggable/) takes a ref to your target element and an optional configuration object. It returns the current `x` and `y` position, a boolean indicating whether the element is being dragged, and a setter in case you need to move the element programmatically.

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
      Drag me anywhere
    </div>
  );
}
```

That is the entire component. No manual event listeners. No cleanup logic. Touch, mouse, and pen input work by default.

### Constraining to a Container

Pass a `containerElement` ref and the hook automatically clamps the position so the element cannot leave the container:

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

No manual clamping math. The hook reads the container's scroll and client dimensions and restricts the element automatically.

### Using a Drag Handle

Often you want only a specific part of an element -- like a header bar -- to trigger dragging. Pass a `handle` ref:

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
        Drag from here
      </div>
      <div style={{ padding: 12 }}>
        <p>This content area does not trigger a drag.</p>
      </div>
    </div>
  );
}
```

The body of the panel remains interactive -- you can select text, click buttons, or scroll -- while the header is the only drag trigger.

## useDropZone: File Drops Made Easy

[`useDropZone`](https://reactuse.com/element/usedropzone/) tackles the other half of the drag-and-drop story: receiving drops. It handles all four drag events (`dragenter`, `dragover`, `dragleave`, `drop`), suppresses the browser's default file-opening behavior, and solves the flickering `dragleave` problem using an internal counter.

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
        <p>Release to upload</p>
      ) : (
        <p>Drag files here to upload</p>
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

The `isOver` boolean lets you restyle the zone the instant a file enters, giving users clear visual feedback. No `e.preventDefault()` boilerplate, no fighting with flickering `dragleave` events.

## Building a Kanban-Style Card Mover

Let's combine both hooks in a more realistic example -- a draggable card that snaps back when released and a drop zone that accepts it. We will also use [`useElementBounding`](https://reactuse.com/element/useelementbounding/) to read zone positions for visual feedback.

```tsx
import { useDraggable, useDropZone, useElementBounding } from "@reactuses/core";
import { useRef, useState } from "react";

interface Task {
  id: string;
  title: string;
}

function KanbanBoard() {
  const [todo, setTodo] = useState<Task[]>([
    { id: "1", title: "Design mockups" },
    { id: "2", title: "Write API spec" },
  ]);
  const [done, setDone] = useState<Task[]>([
    { id: "3", title: "Set up CI pipeline" },
  ]);

  const doneZoneRef = useRef<HTMLDivElement>(null);
  const todoZoneRef = useRef<HTMLDivElement>(null);

  const isOverDone = useDropZone(doneZoneRef, (files) => {
    // File drops are ignored in this example
  });

  const isOverTodo = useDropZone(todoZoneRef, (files) => {
    // File drops are ignored in this example
  });

  const doneBounds = useElementBounding(doneZoneRef);

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <div>
        <h3>To Do</h3>
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
        <h3>Done</h3>
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
      // Check if the card was released over the "Done" column
      if (
        targetBounds &&
        pos.x >= targetBounds.left &&
        pos.x <= targetBounds.right &&
        pos.y >= targetBounds.top &&
        pos.y <= targetBounds.bottom
      ) {
        onDrop();
      }
      // Snap back to original position
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

Key details worth noting:

- **`useElementBounding`** gives us live `left`, `right`, `top`, and `bottom` values for the "Done" column so we can hit-test when the drag ends.
- The `onEnd` callback snaps the card back to `{ x: 0, y: 0 }` if it was not dropped on the target. This creates a satisfying rubber-band effect with the CSS `transition`.
- No external state library is needed. React's `useState` is sufficient for this level of complexity.

## Enhancing the Experience with Companion Hooks

ReactUse's hooks compose naturally. Here are a few ways to extend the examples above:

- **[`useMouse`](https://reactuse.com/browser/usemouse/)** -- Track the cursor globally to show a custom drag cursor or a floating tooltip that follows the pointer during a drag operation.
- **[`useEventListener`](https://reactuse.com/effect/useeventlistener/)** -- Attach a one-off `keydown` listener to cancel a drag when the user presses Escape.
- **[`useElementSize`](https://reactuse.com/element/useelementsize/)** -- Dynamically read the width and height of a container to calculate snap-to-grid positions (e.g., round `x` to the nearest multiple of the cell width).

For example, adding Escape-to-cancel is just a few lines with `useEventListener`:

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
      Drag me (press Esc to reset)
    </div>
  );
}
```

## When to Still Use a Full Library

`useDraggable` and `useDropZone` cover the vast majority of drag-and-drop use cases with minimal code. However, if your requirements include complex reorderable lists with animated transitions, multi-container sorting with keyboard accessibility, or virtualized lists with thousands of items, a dedicated library like `dnd-kit` remains the better choice. The key insight is that you don't need one for every situation -- and for many projects, a pair of hooks is all it takes.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [`useDraggable`](https://reactuse.com/element/usedraggable/) -- Make any element draggable with pointer events
- [`useDropZone`](https://reactuse.com/element/usedropzone/) -- Create drop zones for file uploads and drag operations
- [`useElementBounding`](https://reactuse.com/element/useelementbounding/) -- Get live bounding rectangle of an element
- [`useMouse`](https://reactuse.com/browser/usemouse/) -- Track mouse position globally
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) -- Attach event listeners declaratively
- [`useElementSize`](https://reactuse.com/element/useelementsize/) -- Track element dimensions reactively

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
