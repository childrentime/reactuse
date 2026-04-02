---
title: "超越 useState：掌握 React 进阶状态模式"
description: "学习 ReactUse 中的进阶状态 Hook -- 受控组件、防抖状态、节流状态、前值追踪、选项循环、计数器和类组件风格的 setState。"
slug: react-state-patterns
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, state, tutorial, useState]
keywords: [react state patterns, useControlled, usePrevious, useDebounce, useThrottle, useCycleList, useCounter, react state management]
image: /img/og.png
---

# 超越 useState：掌握 React 进阶状态模式

`useState` 是 React 状态管理的主力。处理简单场景绰绰有余——一个控制弹窗的布尔值、一个输入框的字符串、一个计数器的数字。但需求稍微复杂一点——你需要上一次渲染的值、想对搜索词做防抖、要写一个既能受控又能非受控的组件——你就会发现自己反反复复写着同样的模板代码。用 ref 存旧值、清理 `setTimeout` 的 ID、受控和非受控的协调逻辑很快就变成一堆纠缠不清的 `useEffect`。

<!-- truncate -->

本文将带你走过七种超越基础 `useState` 的状态模式。每种模式我们先展示手动实现，让你看清其中的门道，然后用 [ReactUse](https://reactuse.com) 中专门的 Hook 替换。最后，我们会把七个 Hook 组合进一个交互式设置面板，展示它们如何无缝协作。

## 1. 受控 vs 非受控组件：useControlled

### 痛点

可复用的 UI 组件通常需要支持两种模式：**受控**（父组件持有状态，传入 `value` + `onChange`）和**非受控**（组件自行管理内部状态，可选接受 `defaultValue`）。同时支持两种模式是 MUI、Radix 等成熟组件库的标配——但实现起来出乎意料地繁琐。

### 手动实现

```tsx
import { useCallback, useRef, useState } from "react";

interface CustomInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

function CustomInput({ value, defaultValue = "", onChange }: CustomInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);

  // 用 ref 始终持有最新的受控值
  const valueRef = useRef(value);
  valueRef.current = value;

  const currentValue = isControlled ? value : internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return (
    <input
      value={currentValue}
      onChange={handleChange}
      style={{
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        fontSize: 16,
      }}
    />
  );
}
```

对于一个简单输入框来说够用了。但当受控值从外部变更时（需要同步）、当你要提醒开发者不要在受控和非受控之间切换时、当值是复杂对象而非基本类型时，这套逻辑就越来越复杂。每个需要双模式的组件都在重复同一段代码。

### 用 useControlled

[`useControlled`](https://reactuse.com/state/useControlled/) 封装了整套受控/非受控协调逻辑，返回一个 `[value, setValue]` 元组，无论使用者选择哪种模式都能正常工作。

```tsx
import { useControlled } from "@reactuses/core";

interface CustomInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

function CustomInput({ value, defaultValue = "", onChange }: CustomInputProps) {
  const [currentValue, setCurrentValue] = useControlled({
    value,
    defaultValue,
    onChange,
  });

  return (
    <input
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      style={{
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        fontSize: 16,
      }}
    />
  );
}

// 非受控用法——组件自行管理状态
function UncontrolledDemo() {
  return <CustomInput defaultValue="hello" />;
}

// 受控用法——父组件持有状态
function ControlledDemo() {
  const [text, setText] = useState("");
  return <CustomInput value={text} onChange={setText} />;
}
```

一次 Hook 调用就替代了 ref、`isControlled` 判断和双路径更新逻辑。组件在两种模式下行为完全一致，即使开发者意外地在受控和非受控之间切换，Hook 也能从容应对。

## 2. 追踪前一个值：usePrevious

### 痛点

你经常需要上一次渲染的值——用来比较 prop 是否变化、在新旧值之间做过渡动画、或者显示"从 X 变成了 Y"的 UI 反馈。React 没有内置这个能力。

### 手动实现

```tsx
import { useEffect, useRef, useState } from "react";

function PriceDisplay({ price }: { price: number }) {
  const prevPriceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    prevPriceRef.current = price;
  });

  const prevPrice = prevPriceRef.current;
  const direction =
    prevPrice === undefined
      ? "neutral"
      : price > prevPrice
        ? "up"
        : price < prevPrice
          ? "down"
          : "neutral";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 32, fontWeight: 700 }}>
        ${price.toFixed(2)}
      </span>
      {direction === "up" && (
        <span style={{ color: "#16a34a", fontSize: 20 }}>▲</span>
      )}
      {direction === "down" && (
        <span style={{ color: "#dc2626", fontSize: 20 }}>▼</span>
      )}
      {prevPrice !== undefined && prevPrice !== price && (
        <span style={{ color: "#6b7280", fontSize: 14 }}>
          之前是 ${prevPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}
```

ref 加 effect 的技巧能用，但容易出错。如果把 effect 放在渲染逻辑之前（或者不该用 `useLayoutEffect` 的地方用了），"前值"可能会变成过期或当前的值。而且每个需要变更检测的组件都要复制这段样板代码。

### 用 usePrevious

[`usePrevious`](https://reactuse.com/state/usePrevious/) 返回上一次渲染的值，时机精确——在当前渲染期间你始终看到的是旧值。

```tsx
import { usePrevious } from "@reactuses/core";

function PriceDisplay({ price }: { price: number }) {
  const prevPrice = usePrevious(price);

  const direction =
    prevPrice === undefined
      ? "neutral"
      : price > prevPrice
        ? "up"
        : price < prevPrice
          ? "down"
          : "neutral";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 32, fontWeight: 700 }}>
        ${price.toFixed(2)}
      </span>
      {direction === "up" && (
        <span style={{ color: "#16a34a", fontSize: 20 }}>▲</span>
      )}
      {direction === "down" && (
        <span style={{ color: "#dc2626", fontSize: 20 }}>▼</span>
      )}
      {prevPrice !== undefined && prevPrice !== price && (
        <span style={{ color: "#6b7280", fontSize: 14 }}>
          之前是 ${prevPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}

function StockTicker() {
  const [price, setPrice] = useState(142.5);

  return (
    <div style={{ padding: 24 }}>
      <PriceDisplay price={price} />
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={() => setPrice((p) => p + Math.random() * 5)}>
          涨价
        </button>
        <button onClick={() => setPrice((p) => p - Math.random() * 5)}>
          跌价
        </button>
      </div>
    </div>
  );
}
```

不需要 ref，不需要 effect。一行代码就能拿到前值，并且与 React 的渲染周期精确同步。

## 3. 防抖状态：useDebounce

### 痛点

搜索输入框、过滤字段、实时预览编辑器都面临同一个问题：每次按键都更新状态会触发昂贵的操作（API 请求、重渲染、复杂过滤），频率远超必要。防抖——等用户停止输入指定时间后再触发——是标准解决方案。

### 手动实现

```tsx
import { useEffect, useRef, useState } from "react";

function ManualDebouncedSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  // 卸载时清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索..."
        style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          width: 300,
          fontSize: 16,
        }}
      />
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        防抖后的值: <strong>{debouncedQuery}</strong>
      </p>
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        (这个值会触发 API 请求)
      </p>
    </div>
  );
}
```

两个状态变量、一个存定时器的 ref、一个调度防抖的 effect、另一个处理卸载清理的 effect。能用，但对于一个几十个组件都需要的功能来说，仪式感太重了。

### 用 useDebounce

[`useDebounce`](https://reactuse.com/state/useDebounce/) 返回任意值的防抖版本。你正常更新源状态，Hook 会产出一个滞后的副本，只在指定的静默期之后才更新。

```tsx
import { useDebounce } from "@reactuses/core";
import { useState } from "react";

function DebouncedSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  return (
    <div style={{ padding: 24 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索..."
        style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          width: 300,
          fontSize: 16,
        }}
      />
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        防抖后的值: <strong>{debouncedQuery}</strong>
      </p>
      {query !== debouncedQuery && (
        <p style={{ color: "#f59e0b", fontSize: 14 }}>
          等待输入停止...
        </p>
      )}
    </div>
  );
}
```

一个 Hook，一行代码。定时器管理、清理和同步全部在内部处理。比较 `query !== debouncedQuery` 还能免费实现"输入中"指示。

## 4. 节流状态：useThrottle

### 痛点

节流是防抖的近亲。不同于等待静默，它确保更新在每个时间间隔内最多触发一次——适用于连续触发的事件，比如滚动位置、鼠标移动或实时数据流，你想要的是稳定的更新频率而非末尾的一次性爆发。

### 手动实现

```tsx
import { useEffect, useRef, useState } from "react";

function ManualThrottledSlider() {
  const [value, setValue] = useState(50);
  const [throttledValue, setThrottledValue] = useState(50);
  const lastRun = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRun.current;
    const delay = 200;

    if (elapsed >= delay) {
      setThrottledValue(value);
      lastRun.current = now;
    } else {
      timerRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }, delay - elapsed);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value]);

  return (
    <div style={{ padding: 24 }}>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: 300 }}
      />
      <div style={{ marginTop: 12 }}>
        <p>原始值: {value}</p>
        <p>节流值: {throttledValue}</p>
      </div>
    </div>
  );
}
```

节流逻辑很容易写错。你需要追踪上次执行时间、处理末尾调用（保证最终值不丢失）、清理定时器。而且这只是针对单个值——每个需要节流的状态都得重复全部逻辑。

### 用 useThrottle

[`useThrottle`](https://reactuse.com/state/useThrottle/) 返回值的节流版本，在每个间隔内最多更新一次，同时确保最终值始终被捕获。

```tsx
import { useThrottle } from "@reactuses/core";
import { useState } from "react";

function ThrottledSlider() {
  const [value, setValue] = useState(50);
  const throttledValue = useThrottle(value, 200);

  return (
    <div style={{ padding: 24 }}>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: 300 }}
      />
      <div style={{ marginTop: 12 }}>
        <p>原始值: {value}</p>
        <p>节流值: {throttledValue}</p>
      </div>
      <div
        style={{
          marginTop: 16,
          height: 20,
          width: `${throttledValue}%`,
          background: "#4f46e5",
          borderRadius: 4,
          transition: "width 0.1s",
        }}
      />
    </div>
  );
}
```

进度条以 200ms 的间隔平滑更新，而不是在滑块每移动一个像素时都抖动。一行代码搞定所有时序逻辑。

## 5. 循环选项：useCycleList

### 痛点

很多 UI 控件需要在一组固定选项中循环：主题切换（亮色 / 暗色 / 跟随系统）、排序方式（升序 / 降序 / 无序）、视图模式（网格 / 列表 / 紧凑）。常规做法是用一个状态变量加一个手动计算下一个值的函数。

### 手动实现

```tsx
import { useState } from "react";

type ViewMode = "grid" | "list" | "compact";
const viewModes: ViewMode[] = ["grid", "list", "compact"];

function ManualViewToggle() {
  const [index, setIndex] = useState(0);
  const mode = viewModes[index];

  const next = () => setIndex((i) => (i + 1) % viewModes.length);
  const prev = () =>
    setIndex((i) => (i - 1 + viewModes.length) % viewModes.length);

  const icons: Record<ViewMode, string> = {
    grid: "▦",
    list: "☰",
    compact: "═",
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={prev} style={{ fontSize: 20, cursor: "pointer" }}>
          ←
        </button>
        <div
          style={{
            padding: "8px 16px",
            background: "#f1f5f9",
            borderRadius: 8,
            fontSize: 18,
            minWidth: 120,
            textAlign: "center",
          }}
        >
          {icons[mode]} {mode}
        </div>
        <button onClick={next} style={{ fontSize: 20, cursor: "pointer" }}>
          →
        </button>
      </div>
    </div>
  );
}
```

单个切换够简单了，但取模运算和独立的索引追踪是每个需要循环行为的地方都会出现的样板代码。它也不支持直接跳转到某个值或响应列表变化。

### 用 useCycleList

[`useCycleList`](https://reactuse.com/state/useCycleList/) 管理数组值的循环，提供 `next`、`prev` 以及直接跳转的 `go` 函数，连同当前值和索引。

```tsx
import { useCycleList } from "@reactuses/core";

type ViewMode = "grid" | "list" | "compact";

function ViewToggle() {
  const [mode, { next, prev }] = useCycleList<ViewMode>(
    ["grid", "list", "compact"]
  );

  const icons: Record<ViewMode, string> = {
    grid: "▦",
    list: "☰",
    compact: "═",
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={prev} style={{ fontSize: 20, cursor: "pointer" }}>
          ←
        </button>
        <div
          style={{
            padding: "8px 16px",
            background: "#f1f5f9",
            borderRadius: 8,
            fontSize: 18,
            minWidth: 120,
            textAlign: "center",
          }}
        >
          {icons[mode]} {mode}
        </div>
        <button onClick={next} style={{ fontSize: 20, cursor: "pointer" }}>
          →
        </button>
      </div>
    </div>
  );
}
```

不用管索引，不用做取模运算。Hook 直接给你当前值和导航函数。用来做主题切换——点击在亮色、暗色、跟随系统之间循环——特别顺手。

## 6. 数值状态：useCounter

### 痛点

计数器无处不在——电商的数量选择器、分页控件、步骤指示器、缩放级别。每个都需要递增、递减、重置，通常还需要最小/最大值钳位。每次从头写这些很乏味。

### 手动实现

```tsx
import { useCallback, useState } from "react";

function ManualQuantityPicker() {
  const [count, setCount] = useState(1);
  const min = 1;
  const max = 99;

  const increment = useCallback(
    () => setCount((c) => Math.min(c + 1, max)),
    [max]
  );
  const decrement = useCallback(
    () => setCount((c) => Math.max(c - 1, min)),
    [min]
  );
  const reset = useCallback(() => setCount(1), []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={decrement}
          disabled={count <= min}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            background: count <= min ? "#f3f4f6" : "#fff",
            fontSize: 18,
            cursor: count <= min ? "not-allowed" : "pointer",
          }}
        >
          -
        </button>
        <span style={{ fontSize: 24, fontWeight: 600, minWidth: 40, textAlign: "center" }}>
          {count}
        </span>
        <button
          onClick={increment}
          disabled={count >= max}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            background: count >= max ? "#f3f4f6" : "#fff",
            fontSize: 18,
            cursor: count >= max ? "not-allowed" : "pointer",
          }}
        >
          +
        </button>
        <button onClick={reset} style={{ marginLeft: 12, fontSize: 14, color: "#6b7280" }}>
          重置
        </button>
      </div>
    </div>
  );
}
```

钳位逻辑、禁用状态、记忆化回调——全是标准样板代码，应用里每个计数器都在重复。

### 用 useCounter

[`useCounter`](https://reactuse.com/state/useCounter/) 开箱即用地提供 `count`、`inc`、`dec`、`set` 和 `reset`，并支持可选的最小/最大值边界。

```tsx
import { useCounter } from "@reactuses/core";

function QuantityPicker() {
  const [count, { inc, dec, reset }] = useCounter(1, {
    min: 1,
    max: 99,
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => dec()}
          disabled={count <= 1}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            background: count <= 1 ? "#f3f4f6" : "#fff",
            fontSize: 18,
            cursor: count <= 1 ? "not-allowed" : "pointer",
          }}
        >
          -
        </button>
        <span style={{ fontSize: 24, fontWeight: 600, minWidth: 40, textAlign: "center" }}>
          {count}
        </span>
        <button
          onClick={() => inc()}
          disabled={count >= 99}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #d1d5db",
            background: count >= 99 ? "#f3f4f6" : "#fff",
            fontSize: 18,
            cursor: count >= 99 ? "not-allowed" : "pointer",
          }}
        >
          +
        </button>
        <button onClick={reset} style={{ marginLeft: 12, fontSize: 14, color: "#6b7280" }}>
          重置
        </button>
      </div>
    </div>
  );
}
```

Hook 在内部处理钳位。你只需传一次 `min` 和 `max`，递增递减时永远不用担心越界。

## 7. 类组件风格 setState：useSetState

### 痛点

React 类组件的 `setState` 有一个很方便的特性：接受一个部分对象，然后合并到已有状态中。但 hooks 里的 `useState` 是整体替换。如果你的状态是一个多字段对象，每次更新都得展开：`setState(prev => ({ ...prev, name: 'new' }))`。对于字段很多的复杂表单或设置对象，这种写法既冗长又容易出错（忘了展开会无声地丢失字段）。

### 手动实现

```tsx
import { useCallback, useState } from "react";

interface FormState {
  name: string;
  email: string;
  role: string;
  notifications: boolean;
}

function ManualSettingsForm() {
  const [state, setFullState] = useState<FormState>({
    name: "",
    email: "",
    role: "viewer",
    notifications: true,
  });

  // 每次更新都必须展开上一个状态
  const setState = useCallback(
    (patch: Partial<FormState>) =>
      setFullState((prev) => ({ ...prev, ...patch })),
    []
  );

  return (
    <form style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
      <input
        value={state.name}
        onChange={(e) => setState({ name: e.target.value })}
        placeholder="姓名"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <input
        value={state.email}
        onChange={(e) => setState({ email: e.target.value })}
        placeholder="邮箱"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <select
        value={state.role}
        onChange={(e) => setState({ role: e.target.value })}
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      >
        <option value="viewer">查看者</option>
        <option value="editor">编辑者</option>
        <option value="admin">管理员</option>
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={state.notifications}
          onChange={(e) => setState({ notifications: e.target.checked })}
        />
        邮件通知
      </label>
      <pre style={{ background: "#f8fafc", padding: 12, borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </form>
  );
}
```

你得自己创建合并用的 `setState` 包装器。如果团队里其他开发者忘了用这个包装器，直接拿部分对象调 `setFullState`，字段就会无声消失。

### 用 useSetState

[`useSetState`](https://reactuse.com/state/useSetState/) 的行为和类组件的 `setState` 一样——传入部分对象，自动合并到已有状态中。

```tsx
import { useSetState } from "@reactuses/core";

interface FormState {
  name: string;
  email: string;
  role: string;
  notifications: boolean;
}

function SettingsForm() {
  const [state, setState] = useSetState<FormState>({
    name: "",
    email: "",
    role: "viewer",
    notifications: true,
  });

  return (
    <form style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
      <input
        value={state.name}
        onChange={(e) => setState({ name: e.target.value })}
        placeholder="姓名"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <input
        value={state.email}
        onChange={(e) => setState({ email: e.target.value })}
        placeholder="邮箱"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <select
        value={state.role}
        onChange={(e) => setState({ role: e.target.value })}
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      >
        <option value="viewer">查看者</option>
        <option value="editor">编辑者</option>
        <option value="admin">管理员</option>
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={state.notifications}
          onChange={(e) => setState({ notifications: e.target.checked })}
        />
        邮件通知
      </label>
      <pre style={{ background: "#f8fafc", padding: 12, borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </form>
  );
}
```

Hook 返回的 `setState` 接受部分对象并自动合并。不需要包装函数，不存在意外替换整个状态的风险。

## 融会贯通：一个设置面板

这些 Hook 天然可组合。下面是一个综合运用全部七个 Hook 的设置面板：

```tsx
import {
  useControlled,
  usePrevious,
  useDebounce,
  useThrottle,
  useCycleList,
  useCounter,
  useSetState,
} from "@reactuses/core";
import { useState } from "react";

// 一个受控/非受控搜索输入框
function SearchInput({
  value,
  defaultValue,
  onChange,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
}) {
  const [currentValue, setCurrentValue] = useControlled({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });

  return (
    <input
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      placeholder="搜索设置..."
      style={{
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        width: "100%",
        fontSize: 14,
      }}
    />
  );
}

function SettingsPanel() {
  // 带防抖的搜索
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const prevSearch = usePrevious(debouncedSearch);

  // 主题循环切换
  const [theme, { next: nextTheme }] = useCycleList([
    "light",
    "dark",
    "system",
  ]);

  // 带计数器的字体大小
  const [fontSize, { inc: fontUp, dec: fontDown, reset: fontReset }] =
    useCounter(16, { min: 12, max: 24 });

  // 节流的实时预览
  const throttledFontSize = useThrottle(fontSize, 150);

  // 合并式表单状态
  const [settings, setSettings] = useSetState({
    username: "",
    email: "",
    notifications: true,
    language: "zh",
  });

  const themeColors: Record<string, { bg: string; text: string }> = {
    light: { bg: "#ffffff", text: "#1e293b" },
    dark: { bg: "#1e293b", text: "#f8fafc" },
    system: { bg: "#f1f5f9", text: "#334155" },
  };

  const allSettings = [
    "username",
    "email",
    "notifications",
    "language",
    "theme",
    "font size",
  ];

  const filtered = debouncedSearch
    ? allSettings.filter((s) =>
        s.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : allSettings;

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 500,
        margin: "0 auto",
        background: themeColors[theme].bg,
        color: themeColors[theme].text,
        borderRadius: 12,
        transition: "all 0.3s",
      }}
    >
      <h2 style={{ marginTop: 0 }}>设置</h2>

      {/* 受控搜索输入 */}
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      {prevSearch && prevSearch !== debouncedSearch && (
        <p style={{ fontSize: 12, opacity: 0.6, margin: "4px 0" }}>
          从 "{prevSearch}" 变为 "{debouncedSearch}"
        </p>
      )}

      <p style={{ fontSize: 12, opacity: 0.6 }}>
        显示 {filtered.length} / {allSettings.length} 项设置
      </p>

      {/* 主题切换 */}
      {filtered.includes("theme") && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid rgba(128,128,128,0.2)",
          }}
        >
          <span>主题</span>
          <button
            onClick={nextTheme}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid rgba(128,128,128,0.3)",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {theme}
          </button>
        </div>
      )}

      {/* 字体大小计数器 */}
      {filtered.includes("font size") && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid rgba(128,128,128,0.2)",
          }}
        >
          <span>字体大小</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => fontDown()}>-</button>
            <span style={{ fontWeight: 600 }}>{fontSize}px</span>
            <button onClick={() => fontUp()}>+</button>
            <button
              onClick={fontReset}
              style={{ fontSize: 12, color: "inherit", opacity: 0.6 }}
            >
              重置
            </button>
          </div>
        </div>
      )}

      {/* 带节流字体大小的实时预览 */}
      <p
        style={{
          fontSize: throttledFontSize,
          padding: "12px 0",
          transition: "font-size 0.15s",
          borderBottom: "1px solid rgba(128,128,128,0.2)",
        }}
      >
        以 {throttledFontSize}px 预览文本
      </p>

      {/* 合并状态的表单字段 */}
      {filtered.includes("username") && (
        <div style={{ padding: "12px 0" }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            用户名
          </label>
          <input
            value={settings.username}
            onChange={(e) => setSettings({ username: e.target.value })}
            style={{
              padding: "6px 10px",
              border: "1px solid rgba(128,128,128,0.3)",
              borderRadius: 4,
              width: "100%",
              background: "transparent",
              color: "inherit",
            }}
          />
        </div>
      )}

      {filtered.includes("notifications") && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 0",
          }}
        >
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) =>
              setSettings({ notifications: e.target.checked })
            }
          />
          开启通知
        </label>
      )}
    </div>
  );
}
```

七个 Hook，零冲突。`useControlled` 驱动搜索输入框，使其在别处也能以非受控方式使用。`useDebounce` 避免每次按键都执行过滤。`usePrevious` 展示搜索词的变化历史。`useCycleList` 处理主题切换。`useCounter` 管理带边界的字体大小。`useThrottle` 平滑实时预览的更新。`useSetState` 将表单字段保持在一个合并式状态对象中。每个 Hook 负责一个关注点，组合时不需要任何额外的胶水代码。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hook

- [`useControlled`](https://reactuse.com/state/useControlled/) -- 构建同时支持受控和非受控的组件
- [`usePrevious`](https://reactuse.com/state/usePrevious/) -- 获取上一次渲染的值
- [`useDebounce`](https://reactuse.com/state/useDebounce/) -- 对任意值按指定延迟进行防抖
- [`useThrottle`](https://reactuse.com/state/useThrottle/) -- 对任意值按间隔进行节流
- [`useCycleList`](https://reactuse.com/state/useCycleList/) -- 在数组值之间用 next/prev 循环切换
- [`useCounter`](https://reactuse.com/state/useCounter/) -- 带 inc/dec/reset 和可选 min/max 的数值状态
- [`useSetState`](https://reactuse.com/state/useSetState/) -- 像类组件 setState 一样合并部分对象到状态中
- [`useBoolean`](https://reactuse.com/state/useBoolean/) -- 带 toggle、setTrue、setFalse 的布尔状态
- [`useToggle`](https://reactuse.com/state/useToggle/) -- 在两个值之间切换
- [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) -- 将状态持久化到 localStorage 并自动序列化

---

ReactUse 提供了 100 多个 React Hook。[浏览全部 →](https://reactuse.com)
