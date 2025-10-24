---
title: doms
sidebar_label: doms
description: >-
  @reactuses/core 中的 DOM 類 Hooks 都接收 `target` 參數來指定要處理的 DOM 元素。本文檔將說明如何正確使用這些 Hooks。 `target` 參數支持以下三種類型： - `React.MutableRefObject` - `HTMLElement` - `() =>
  HTML
---
# DOM 類 Hooks

@reactuses/core 中的 DOM 類 Hooks 都接收 `target` 參數來指定要處理的 DOM 元素。本文檔將說明如何正確使用這些 Hooks。

## target 參數支持的類型

`target` 參數支持以下三種類型：
- `React.MutableRefObject`
- `HTMLElement`
- `() => HTMLElement`

### 1. 使用 React.MutableRefObject（推薦）

```jsx
export default () => {
  const ref = useRef(null);
  const isHovering = useHover(ref);
  return <div ref={ref}>{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

### 2. 使用 HTMLElement

```jsx
// 在組件外部定義元素引用
const element = document.getElementById('test');

export default () => {
  const isHovering = useHover(element);
  return <div id="test">{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

### 3. 使用函數返回（SSR 友好）

```jsx
// 在組件外部定義獲取元素的函數
const getElement = () => document.getElementById('test');

export default () => {
  const isHovering = useHover(getElement);
  return <div id="test">{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

## target 支持動態變化

DOM 類 Hooks 的 `target` 參數支持動態變化，例如：

```jsx
export default () => {
  const [boolean, { toggle }] = useBoolean();
  const ref = useRef(null);
  const ref2 = useRef(null);
  const isHovering = useHover(boolean ? ref : ref2);
  
  return (
    <>
      <div ref={ref}>{isHovering ? 'hover' : 'leaveHover'}</div>
      <div ref={ref2}>{isHovering ? 'hover' : 'leaveHover'}</div>
    </>
  );
};
```

## 最佳實踐

1. 推薦使用 `useRef`，這是引用 DOM 元素最可靠的方式
2. 當使用 HTMLElement 或獲取元素的函數時：
   - 始終將它們定義在組件外部以保持引用的穩定性
   - 注意直接的元素引用在 SSR 環境下無法使用