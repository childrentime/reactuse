---
title: "React 拖拽：无需第三方库的完整方案"
description: "学习如何使用原生浏览器 API 和 useDraggable、useDropZone Hook 在 React 中构建拖拽界面。无需沉重的依赖。"
slug: react-drag-and-drop
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, drag-and-drop, tutorial, useDraggable]
keywords: [react drag and drop, useDraggable, useDropZone, react dnd, drag drop hooks, react drag and drop without library]
image: /img/og.png
---

# React 拖拽：无需第三方库的完整方案

拖拽是用户期望"理所当然能用"的交互之一。无论是对任务看板重新排序、通过拖动文件上传，还是让用户在仪表盘中重新排列小组件，抓取并移动的操作都让人感觉自然流畅。然而大多数 React 教程一上来就引入像 `react-dnd` 或 `dnd-kit` 这样的重量级库——它们功能强大，但对许多常见场景来说增加了过多的包体积和概念负担。

<!-- truncate -->

如果只需一次 Hook 调用就能获得流畅、可用于生产的拖拽行为呢？本文将从原生浏览器 API 出发，分析它们为何难用，然后用 [ReactUse](https://reactuse.com) 中的两个轻量 Hook：[`useDraggable`](https://reactuse.com/element/useDraggable/) 和 [`useDropZone`](https://reactuse.com/element/useDropZone/) 来解决同样的问题。

## 手动实现：自行处理指针事件

让元素可拖拽的最基本方式是手动监听 `pointerdown`、`pointermove` 和 `pointerup` 事件。通常的写法如下：

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
      拖动我
    </div>
  );
}
```

能跑起来——但看看你需要管理多少状态。而这还只是*最简单*的版本。实际需求会迅速叠加更多复杂性。

## 为什么手动实现拖拽很难

上面的代码片段有几个不足之处，一旦超出 Demo 级别就会立刻暴露出来：

1. **容器边界。** 如果你想让元素保持在父容器内部，就需要在每次移动时读取容器尺寸并限制位置。这意味着每帧都要在两个元素上调用 `getBoundingClientRect`。

2. **指针类型。** 上面的代码处理了鼠标事件，但触控和手写笔呢？`PointerEvent` API 统一了它们，但按指针类型过滤（例如禁止手写笔拖动）需要额外的条件判断。

3. **拖拽手柄。** 有时可拖拽的触发区域只是卡片内部的一个标题栏。你需要将"触发"元素和"移动"元素分离，并相应地连接事件。

4. **事件清理。** 忘记移除监听器——或者在 `useEffect` 中使用了错误的依赖——会导致诸如松开鼠标后元素仍在移动之类的隐蔽 Bug。

5. **放置区域。** HTML5 拖放 API 引入了 `dragenter`、`dragover`、`dragleave` 和 `drop` 事件。协调这些事件——尤其是子元素上臭名昭著的 `dragenter`/`dragleave` 闪烁问题——非常容易出错。

这些正是 `useDraggable` 和 `useDropZone` 开箱即用要解决的问题。

## useDraggable：一个 Hook，完全掌控

[`useDraggable`](https://reactuse.com/element/useDraggable/) 接受一个目标元素的 ref 和一个可选的配置对象。它返回当前的 `x` 和 `y` 位置、一个表示元素是否正在被拖拽的布尔值，以及一个 setter（用于程序化地移动元素）。

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
      随意拖动我
    </div>
  );
}
```

这就是整个组件。无需手动事件监听器。无需清理逻辑。触控、鼠标和手写笔默认都能工作。

### 限制在容器内

传入一个 `containerElement` ref，Hook 会自动夹紧位置，使元素不会离开容器：

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

无需手动的夹紧计算。Hook 会读取容器的滚动和客户端尺寸，自动限制元素位置。

### 使用拖拽手柄

通常你只想让元素的特定部分——比如一个标题栏——触发拖拽。传入 `handle` ref 即可：

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
        从这里拖动
      </div>
      <div style={{ padding: 12 }}>
        <p>此内容区域不会触发拖拽。</p>
      </div>
    </div>
  );
}
```

面板的主体仍然是可交互的——你可以选择文本、点击按钮或滚动——而只有标题栏是拖拽触发器。

## useDropZone：轻松实现文件拖放

[`useDropZone`](https://reactuse.com/element/useDropZone/) 解决拖放的另一半：接收放置。它处理全部四个拖拽事件（`dragenter`、`dragover`、`dragleave`、`drop`），阻止浏览器默认打开文件的行为，并通过内部计数器解决了 `dragleave` 闪烁问题。

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
        <p>松开以上传</p>
      ) : (
        <p>将文件拖到这里上传</p>
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

`isOver` 布尔值让你在文件进入时立即重新设置区域样式，给用户清晰的视觉反馈。无需 `e.preventDefault()` 样板代码，不用和闪烁的 `dragleave` 事件斗争。

## 构建看板风格的卡片拖动

让我们在一个更贴近实际的例子中结合两个 Hook——一个可拖拽的卡片，松开时弹回原位，以及一个接受它的放置区域。我们还将使用 [`useElementBounding`](https://reactuse.com/element/useElementBounding/) 来读取区域位置以做视觉反馈。

```tsx
import { useDraggable, useDropZone, useElementBounding } from "@reactuses/core";
import { useRef, useState } from "react";

interface Task {
  id: string;
  title: string;
}

function KanbanBoard() {
  const [todo, setTodo] = useState<Task[]>([
    { id: "1", title: "设计原型" },
    { id: "2", title: "编写 API 规范" },
  ]);
  const [done, setDone] = useState<Task[]>([
    { id: "3", title: "搭建 CI 流水线" },
  ]);

  const doneZoneRef = useRef<HTMLDivElement>(null);
  const todoZoneRef = useRef<HTMLDivElement>(null);

  const isOverDone = useDropZone(doneZoneRef, (files) => {
    // 此示例忽略文件拖放
  });

  const isOverTodo = useDropZone(todoZoneRef, (files) => {
    // 此示例忽略文件拖放
  });

  const doneBounds = useElementBounding(doneZoneRef);

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <div>
        <h3>待办</h3>
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
      // 检查卡片是否在"完成"列上方释放
      if (
        targetBounds &&
        pos.x >= targetBounds.left &&
        pos.x <= targetBounds.right &&
        pos.y >= targetBounds.top &&
        pos.y <= targetBounds.bottom
      ) {
        onDrop();
      }
      // 弹回原始位置
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

几个值得注意的关键点：

- **`useElementBounding`** 为我们提供了"完成"列的实时 `left`、`right`、`top` 和 `bottom` 值，以便在拖拽结束时进行碰撞检测。
- `onEnd` 回调在未落在目标上时将卡片弹回 `{ x: 0, y: 0 }`。配合 CSS `transition` 产生令人满意的橡皮筋效果。
- 无需外部状态库。React 的 `useState` 对于这个复杂度完全够用。

## 配合其他 Hook 增强体验

ReactUse 的 Hook 天然可组合。以下是扩展上述示例的几种方式：

- **[`useMouse`](https://reactuse.com/browser/useMouse/)** ——全局追踪光标位置，在拖拽过程中显示自定义拖拽光标或跟随指针的浮动提示。
- **[`useEventListener`](https://reactuse.com/effect/useEventListener/)** ——附加一个 `keydown` 监听器，在用户按下 Escape 时取消拖拽。
- **[`useElementSize`](https://reactuse.com/element/useElementSize/)** ——动态读取容器的宽高以计算网格对齐位置（例如将 `x` 舍入到单元格宽度的最近倍数）。

例如，使用 `useEventListener` 添加 Escape 取消只需几行代码：

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
      拖动我（按 Esc 重置）
    </div>
  );
}
```

## 什么时候仍然需要完整的库

`useDraggable` 和 `useDropZone` 用最少的代码覆盖了绝大多数拖放场景。然而，如果你的需求包含复杂的可排序列表（带动画过渡）、具有键盘无障碍访问的多容器排序，或包含上千项的虚拟化列表，像 `dnd-kit` 这样的专用库仍然是更好的选择。关键在于，你并不需要在每种情况下都引入一个——对许多项目来说，一对 Hook 就足够了。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hook

- [`useDraggable`](https://reactuse.com/element/useDraggable/) ——使用指针事件让任意元素可拖拽
- [`useDropZone`](https://reactuse.com/element/useDropZone/) ——为文件上传和拖放操作创建放置区域
- [`useElementBounding`](https://reactuse.com/element/useElementBounding/) ——获取元素的实时边界矩形
- [`useMouse`](https://reactuse.com/browser/useMouse/) ——全局追踪鼠标位置
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) ——声明式地附加事件监听器
- [`useElementSize`](https://reactuse.com/element/useElementSize/) ——响应式追踪元素尺寸

---

ReactUse 提供了 100+ 个 React Hook。[探索所有 Hook →](https://reactuse.com)
