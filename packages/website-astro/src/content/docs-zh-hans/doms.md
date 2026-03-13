---
title: doms
sidebar_label: doms
description: >-
  @reactuses/core 中的 DOM 类 Hooks 都接收 `target` 参数来指定要处理的 DOM 元素。本文档将说明如何正确使用这些 Hooks。 `target` 参数支持以下三种类型： - `React.MutableRefObject` - `HTMLElement` - `() =>
  HTML
---
# DOM 类 Hooks

@reactuses/core 中的 DOM 类 Hooks 都接收 `target` 参数来指定要处理的 DOM 元素。本文档将说明如何正确使用这些 Hooks。

## target 参数支持的类型

`target` 参数支持以下三种类型：
- `React.MutableRefObject`
- `HTMLElement`
- `() => HTMLElement`

### 1. 使用 React.MutableRefObject（推荐）

```jsx
export default () => {
  const ref = useRef(null);
  const isHovering = useHover(ref);
  return <div ref={ref}>{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

### 2. 使用 HTMLElement

```jsx
// 在组件外部定义元素引用
const element = document.getElementById('test');

export default () => {
  const isHovering = useHover(element);
  return <div id="test">{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

### 3. 使用函数返回（SSR 友好）

```jsx
// 在组件外部定义获取元素的函数
const getElement = () => document.getElementById('test');

export default () => {
  const isHovering = useHover(getElement);
  return <div id="test">{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

## target 支持动态变化

DOM 类 Hooks 的 `target` 参数支持动态变化，例如：

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

## 最佳实践

1. 推荐使用 `useRef`，这是引用 DOM 元素最可靠的方式
2. 当使用 HTMLElement 或获取元素的函数时：
   - 始终将它们定义在组件外部以保持引用的稳定性
   - 注意直接的元素引用在 SSR 环境下无法使用