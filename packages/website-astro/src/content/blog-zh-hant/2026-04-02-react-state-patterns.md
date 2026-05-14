---
title: "超越 useState：掌握 React 進階狀態模式"
description: "學習 ReactUse 中的進階狀態 Hook -- 受控元件、防抖狀態、節流狀態、前值追蹤、選項循環、計數器和類別元件風格的 setState。"
slug: react-state-patterns
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, state, tutorial, useState]
keywords: [react state patterns, useControlled, usePrevious, useDebounce, useThrottle, useCycleList, useCounter, react state management]
image: /img/og.png
---

# 超越 useState：掌握 React 進階狀態模式

`useState` 是 React 狀態管理的主力。處理簡單場景綽綽有餘——一個控制彈窗的布林值、一個輸入框的字串、一個計數器的數字。但需求稍微複雜一點——你需要上一次渲染的值、想對搜尋詞做防抖、要寫一個既能受控又能非受控的元件——你就會發現自己反反覆覆寫著同樣的範本程式碼。用 ref 存舊值、清理 `setTimeout` 的 ID、受控和非受控的協調邏輯很快就變成一堆糾纏不清的 `useEffect`。

<!-- truncate -->

本文將帶你走過七種超越基礎 `useState` 的狀態模式。每種模式我們先展示手動實作，讓你看清其中的門道，然後用 [ReactUse](https://reactuse.com) 中專門的 Hook 替換。最後，我們會把七個 Hook 組合進一個互動式設定面板，展示它們如何無縫協作。

## 1. 受控 vs 非受控元件：useControlled

### 痛點

可複用的 UI 元件通常需要支援兩種模式：**受控**（父元件持有狀態，傳入 `value` + `onChange`）和**非受控**（元件自行管理內部狀態，可選接受 `defaultValue`）。同時支援兩種模式是 MUI、Radix 等成熟元件庫的標配——但實作起來出乎意料地繁瑣。

### 手動實作

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

  // 用 ref 始終持有最新的受控值
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

對於一個簡單輸入框來說夠用了。但當受控值從外部變更時（需要同步）、當你要提醒開發者不要在受控和非受控之間切換時、當值是複雜物件而非基本型別時，這套邏輯就越來越複雜。每個需要雙模式的元件都在重複同一段程式碼。

### 用 useControlled

[`useControlled`](https://reactuse.com/state/usecontrolled/) 封裝了整套受控/非受控協調邏輯，回傳一個 `[value, setValue]` 元組，無論使用者選擇哪種模式都能正常運作。

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

// 非受控用法——元件自行管理狀態
function UncontrolledDemo() {
  return <CustomInput defaultValue="hello" />;
}

// 受控用法——父元件持有狀態
function ControlledDemo() {
  const [text, setText] = useState("");
  return <CustomInput value={text} onChange={setText} />;
}
```

一次 Hook 呼叫就替代了 ref、`isControlled` 判斷和雙路徑更新邏輯。元件在兩種模式下行為完全一致，即使開發者意外地在受控和非受控之間切換，Hook 也能從容應對。

## 2. 追蹤前一個值：usePrevious

### 痛點

你經常需要上一次渲染的值——用來比較 prop 是否變化、在新舊值之間做過渡動畫、或者顯示「從 X 變成了 Y」的 UI 回饋。React 沒有內建這個能力。

### 手動實作

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

ref 加 effect 的技巧能用，但容易出錯。如果把 effect 放在渲染邏輯之前（或者不該用 `useLayoutEffect` 的地方用了），「前值」可能會變成過期或當前的值。而且每個需要變更偵測的元件都要複製這段範本程式碼。

### 用 usePrevious

[`usePrevious`](https://reactuse.com/state/useprevious/) 回傳上一次渲染的值，時機精確——在當前渲染期間你始終看到的是舊值。

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
          漲價
        </button>
        <button onClick={() => setPrice((p) => p - Math.random() * 5)}>
          跌價
        </button>
      </div>
    </div>
  );
}
```

不需要 ref，不需要 effect。一行程式碼就能拿到前值，並且與 React 的渲染週期精確同步。

## 3. 防抖狀態：useDebounce

### 痛點

搜尋輸入框、篩選欄位、即時預覽編輯器都面臨同一個問題：每次按鍵都更新狀態會觸發昂貴的操作（API 請求、重新渲染、複雜篩選），頻率遠超必要。防抖——等使用者停止輸入指定時間後再觸發——是標準解決方案。

### 手動實作

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

  // 卸載時清理
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
        placeholder="搜尋..."
        style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          width: 300,
          fontSize: 16,
        }}
      />
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        防抖後的值: <strong>{debouncedQuery}</strong>
      </p>
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        (這個值會觸發 API 請求)
      </p>
    </div>
  );
}
```

兩個狀態變數、一個存計時器的 ref、一個排程防抖的 effect、另一個處理卸載清理的 effect。能用，但對於一個幾十個元件都需要的功能來說，儀式感太重了。

### 用 useDebounce

[`useDebounce`](https://reactuse.com/state/usedebounce/) 回傳任意值的防抖版本。你正常更新來源狀態，Hook 會產出一個滯後的副本，只在指定的靜默期之後才更新。

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
        placeholder="搜尋..."
        style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          width: 300,
          fontSize: 16,
        }}
      />
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        防抖後的值: <strong>{debouncedQuery}</strong>
      </p>
      {query !== debouncedQuery && (
        <p style={{ color: "#f59e0b", fontSize: 14 }}>
          等待輸入停止...
        </p>
      )}
    </div>
  );
}
```

一個 Hook，一行程式碼。計時器管理、清理和同步全部在內部處理。比較 `query !== debouncedQuery` 還能免費實現「輸入中」指示。

## 4. 節流狀態：useThrottle

### 痛點

節流是防抖的近親。不同於等待靜默，它確保更新在每個時間間隔內最多觸發一次——適用於連續觸發的事件，比如捲動位置、滑鼠移動或即時資料流，你想要的是穩定的更新頻率而非末尾的一次性爆發。

### 手動實作

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
        <p>節流值: {throttledValue}</p>
      </div>
    </div>
  );
}
```

節流邏輯很容易寫錯。你需要追蹤上次執行時間、處理末尾呼叫（保證最終值不遺失）、清理計時器。而且這只是針對單一值——每個需要節流的狀態都得重複全部邏輯。

### 用 useThrottle

[`useThrottle`](https://reactuse.com/state/usethrottle/) 回傳值的節流版本，在每個間隔內最多更新一次，同時確保最終值始終被捕獲。

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
        <p>節流值: {throttledValue}</p>
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

進度條以 200ms 的間隔平滑更新，而不是在滑桿每移動一個像素時都抖動。一行程式碼搞定所有時序邏輯。

## 5. 循環選項：useCycleList

### 痛點

很多 UI 控制項需要在一組固定選項中循環：主題切換（亮色 / 暗色 / 跟隨系統）、排序方式（升序 / 降序 / 無序）、檢視模式（網格 / 列表 / 緊湊）。常規做法是用一個狀態變數加一個手動計算下一個值的函式。

### 手動實作

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

單個切換夠簡單了，但取餘運算和獨立的索引追蹤是每個需要循環行為的地方都會出現的範本程式碼。它也不支援直接跳轉到某個值或回應清單變化。

### 用 useCycleList

[`useCycleList`](https://reactuse.com/state/usecyclelist/) 管理陣列值的循環，提供 `next`、`prev` 以及直接跳轉的 `go` 函式，連同當前值和索引。

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

不用管索引，不用做取餘運算。Hook 直接給你當前值和導覽函式。用來做主題切換——點擊在亮色、暗色、跟隨系統之間循環——特別順手。

## 6. 數值狀態：useCounter

### 痛點

計數器無所不在——電商的數量選擇器、分頁控制項、步驟指示器、縮放等級。每個都需要遞增、遞減、重設，通常還需要最小/最大值夾持。每次從頭寫這些很乏味。

### 手動實作

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
          重設
        </button>
      </div>
    </div>
  );
}
```

夾持邏輯、停用狀態、記憶化回呼——全是標準範本程式碼，應用程式裡每個計數器都在重複。

### 用 useCounter

[`useCounter`](https://reactuse.com/state/usecounter/) 開箱即用地提供 `count`、`inc`、`dec`、`set` 和 `reset`，並支援可選的最小/最大值邊界。

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
          重設
        </button>
      </div>
    </div>
  );
}
```

Hook 在內部處理夾持。你只需傳一次 `min` 和 `max`，遞增遞減時永遠不用擔心越界。

## 7. 類別元件風格 setState：useSetState

### 痛點

React 類別元件的 `setState` 有一個很方便的特性：接受一個部分物件，然後合併到已有狀態中。但 hooks 裡的 `useState` 是整體替換。如果你的狀態是一個多欄位物件，每次更新都得展開：`setState(prev => ({ ...prev, name: 'new' }))`。對於欄位很多的複雜表單或設定物件，這種寫法既冗長又容易出錯（忘了展開會無聲地遺失欄位）。

### 手動實作

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

  // 每次更新都必須展開上一個狀態
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
        placeholder="電子郵件"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <select
        value={state.role}
        onChange={(e) => setState({ role: e.target.value })}
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      >
        <option value="viewer">檢視者</option>
        <option value="editor">編輯者</option>
        <option value="admin">管理員</option>
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={state.notifications}
          onChange={(e) => setState({ notifications: e.target.checked })}
        />
        電子郵件通知
      </label>
      <pre style={{ background: "#f8fafc", padding: 12, borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </form>
  );
}
```

你得自己建立合併用的 `setState` 包裝器。如果團隊裡其他開發者忘了用這個包裝器，直接拿部分物件呼叫 `setFullState`，欄位就會無聲消失。

### 用 useSetState

[`useSetState`](https://reactuse.com/state/usesetstate/) 的行為和類別元件的 `setState` 一樣——傳入部分物件，自動合併到已有狀態中。

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
        placeholder="電子郵件"
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      />
      <select
        value={state.role}
        onChange={(e) => setState({ role: e.target.value })}
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
      >
        <option value="viewer">檢視者</option>
        <option value="editor">編輯者</option>
        <option value="admin">管理員</option>
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={state.notifications}
          onChange={(e) => setState({ notifications: e.target.checked })}
        />
        電子郵件通知
      </label>
      <pre style={{ background: "#f8fafc", padding: 12, borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </form>
  );
}
```

Hook 回傳的 `setState` 接受部分物件並自動合併。不需要包裝函式，不存在意外替換整個狀態的風險。

## 融會貫通：一個設定面板

這些 Hook 天生可組合。以下是一個綜合運用全部七個 Hook 的設定面板：

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

// 一個受控/非受控搜尋輸入框
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
      placeholder="搜尋設定..."
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
  // 帶防抖的搜尋
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const prevSearch = usePrevious(debouncedSearch);

  // 主題循環切換
  const [theme, { next: nextTheme }] = useCycleList([
    "light",
    "dark",
    "system",
  ]);

  // 帶計數器的字型大小
  const [fontSize, { inc: fontUp, dec: fontDown, reset: fontReset }] =
    useCounter(16, { min: 12, max: 24 });

  // 節流的即時預覽
  const throttledFontSize = useThrottle(fontSize, 150);

  // 合併式表單狀態
  const [settings, setSettings] = useSetState({
    username: "",
    email: "",
    notifications: true,
    language: "zh-TW",
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
      <h2 style={{ marginTop: 0 }}>設定</h2>

      {/* 受控搜尋輸入 */}
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      {prevSearch && prevSearch !== debouncedSearch && (
        <p style={{ fontSize: 12, opacity: 0.6, margin: "4px 0" }}>
          從 "{prevSearch}" 變為 "{debouncedSearch}"
        </p>
      )}

      <p style={{ fontSize: 12, opacity: 0.6 }}>
        顯示 {filtered.length} / {allSettings.length} 項設定
      </p>

      {/* 主題切換 */}
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
          <span>主題</span>
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

      {/* 字型大小計數器 */}
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
          <span>字型大小</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => fontDown()}>-</button>
            <span style={{ fontWeight: 600 }}>{fontSize}px</span>
            <button onClick={() => fontUp()}>+</button>
            <button
              onClick={fontReset}
              style={{ fontSize: 12, color: "inherit", opacity: 0.6 }}
            >
              重設
            </button>
          </div>
        </div>
      )}

      {/* 帶節流字型大小的即時預覽 */}
      <p
        style={{
          fontSize: throttledFontSize,
          padding: "12px 0",
          transition: "font-size 0.15s",
          borderBottom: "1px solid rgba(128,128,128,0.2)",
        }}
      >
        以 {throttledFontSize}px 預覽文字
      </p>

      {/* 合併狀態的表單欄位 */}
      {filtered.includes("username") && (
        <div style={{ padding: "12px 0" }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            使用者名稱
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
          開啟通知
        </label>
      )}
    </div>
  );
}
```

七個 Hook，零衝突。`useControlled` 驅動搜尋輸入框，使其在別處也能以非受控方式使用。`useDebounce` 避免每次按鍵都執行篩選。`usePrevious` 展示搜尋詞的變化歷史。`useCycleList` 處理主題切換。`useCounter` 管理帶邊界的字型大小。`useThrottle` 平滑即時預覽的更新。`useSetState` 將表單欄位保持在一個合併式狀態物件中。每個 Hook 負責一個關注點，組合時不需要任何額外的膠水程式碼。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hook

- [`useControlled`](https://reactuse.com/state/usecontrolled/) -- 建構同時支援受控和非受控的元件
- [`usePrevious`](https://reactuse.com/state/useprevious/) -- 取得上一次渲染的值
- [`useDebounce`](https://reactuse.com/state/usedebounce/) -- 對任意值按指定延遲進行防抖
- [`useThrottle`](https://reactuse.com/state/usethrottle/) -- 對任意值按間隔進行節流
- [`useCycleList`](https://reactuse.com/state/usecyclelist/) -- 在陣列值之間用 next/prev 循環切換
- [`useCounter`](https://reactuse.com/state/usecounter/) -- 帶 inc/dec/reset 和可選 min/max 的數值狀態
- [`useSetState`](https://reactuse.com/state/usesetstate/) -- 像類別元件 setState 一樣合併部分物件到狀態中
- [`useBoolean`](https://reactuse.com/state/useboolean/) -- 帶 toggle、setTrue、setFalse 的布林狀態
- [`useToggle`](https://reactuse.com/state/usetoggle/) -- 在兩個值之間切換
- [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) -- 將狀態持久化到 localStorage 並自動序列化

---

ReactUse 提供了 100 多個 React Hook。[瀏覽全部 →](https://reactuse.com)
