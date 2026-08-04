---
title: "React useDisclosure Hook：管理模态框和抽屉的打开关闭状态 (2026)"
description: "useDisclosure 实用指南：用一个 Hook 管理模态框、抽屉、弹出框的打开/关闭状态，支持受控和非受控模式、生命周期回调、ref 稳定化的处理函数——无需引入 UI 框架。TypeScript 优先。"
slug: react-usedisclosure-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-04
tags: [react, hooks, state, typescript, tutorial]
keywords: [react useDisclosure, usedisclosure, useDisclosure hook, react 模态框状态, react 抽屉组件, react 弹出框, react 受控模态框, usedisclosure react, react 打开关闭状态管理]
image: /img/og.png
---

# React useDisclosure Hook：管理模态框和抽屉的打开关闭状态 (2026)

每个 React 应用都会逐渐积累各种可切换的 UI——确认对话框、移动端导航抽屉、设置弹出框、通知面板。它们背后的状态始终相同：一个布尔值、一个打开方法、一个关闭方法，可能再加一个状态变化时触发埋点或焦点管理的回调。于是你写了 `useState(false)` 加三个内联处理函数，复制粘贴到下一个模态框，到第五个可切换组件的时候，你发现同样的五行模式散落在十几个文件里，没有复用，也没有生命周期钩子。

[`useDisclosure`](https://reactuse.com/state/usedisclosure/)（来自 [`@reactuses/core`](https://reactuse.com)）将这一模式提取为一次性解决方案：默认非受控，需要时可切换为受控模式，提供 `onOpen` / `onClose` / `onChange` 回调在恰当的时机触发。返回的处理函数通过 ref 实现引用稳定，不会导致子组件不必要的重渲染。本文介绍 API、内部实现、受控与非受控的契约，以及模态框、抽屉和组合式多重 disclosure UI 的实际模式。TypeScript 优先。

<!-- truncate -->

## 最简单的用法：模态框切换

```tsx
import { useDisclosure } from '@reactuses/core';

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button onClick={onOpen}>打开设置</button>
      {isOpen && (
        <dialog open>
          <h2>设置</h2>
          <p>这里是设置面板内容。</p>
          <button onClick={onClose}>关闭</button>
        </dialog>
      )}
    </>
  );
}
```

不需要 `useState`，不需要写内联的 `() => setOpen(true)` / `() => setOpen(false)`，不需要纠结命名。Hook 返回语义明确的具名函数——触发器上用 `onOpen`，关闭按钮上用 `onClose`。每次渲染返回相同的函数引用（ref 稳定化），所以把 `onClose` 传给 `React.memo` 包裹的子组件也不会破坏优化。

## 完整 API

```ts
const {
  isOpen,       // boolean — 当前状态
  onOpen,       // () => void — 设为 true
  onClose,      // () => void — 设为 false
  onOpenChange, // () => void — 切换：关闭时调用 onOpen，打开时调用 onClose
  isControlled, // boolean — 如果传了 isOpen prop 则为 true
} = useDisclosure({
  defaultOpen,  // boolean — 初始状态（仅非受控模式）
  isOpen,       // boolean — 传入以进入受控模式
  onOpen,       // () => void — 打开后触发
  onClose,      // () => void — 关闭后触发
  onChange,     // (isOpen: boolean | undefined) => void — 任何变化时触发
});
```

所有字段都是可选的。不传任何参数调用 `useDisclosure()` 就能得到一个初始关闭的非受控切换，覆盖大多数模态框和抽屉的需求。选项是为"仅仅一个布尔值不够用"的场景准备的。

## 生命周期回调：当打开和关闭有副作用时

布尔切换不够用的时刻，就是你的模态框不只是显示和隐藏的时刻。真实的 disclosure 组件需要副作用：用户打开定价弹窗时发送埋点事件，抽屉打开时捕获焦点，关闭时恢复焦点，通知面板切换时启动或停止后台轮询。内联处理函数会把这些逻辑分散到 JSX 各处：

```tsx
// 没有 useDisclosure 时——副作用与 JSX 缠在一起
<button onClick={() => {
  setIsOpen(true);
  analytics.track('pricing_modal_opened');
  focusTrap.activate();
}}>
  查看定价
</button>
```

使用 `useDisclosure`，副作用集中在 Hook 调用处：

```tsx
const { isOpen, onOpen, onClose } = useDisclosure({
  onOpen() {
    analytics.track('pricing_modal_opened');
    focusTrap.activate();
  },
  onClose() {
    analytics.track('pricing_modal_closed');
    focusTrap.deactivate();
  },
});

// JSX 变得简洁
<button onClick={onOpen}>查看定价</button>
```

回调在状态更新*之后*触发——`onOpen` 在 `isOpen` 变为 `true` 时执行，`onClose` 在变为 `false` 时执行。`onChange` 在每次状态转换时触发并传入新值，适用于需要一个处理函数覆盖两个方向的场景（如同步到 URL 参数或外部 store）。

回调 props 内部通过 [`useLatest`](https://reactuse.com/state/uselatest/) 包装——你可以传入内联箭头函数而不会导致返回的 `onOpen` / `onClose` 获得新的引用。处理函数即使回调变化也保持引用稳定。

## 受控模式：由父组件掌控状态

有时打开状态属于父组件或状态管理器，disclosure 组件只负责渲染。传入 `isOpen` prop，Hook 就会切换到受控模式：

```tsx
function ControlledDrawer({ isOpen, onToggle }: Props) {
  const disclosure = useDisclosure({
    isOpen,
    onOpen: onToggle,
    onClose: onToggle,
  });

  // disclosure.isControlled === true
  // disclosure.isOpen 反映 prop 的值
  // disclosure.onOpen / onClose 触发父组件的 onToggle

  return (
    <aside className={disclosure.isOpen ? 'open' : ''}>
      <button onClick={disclosure.onClose}>×</button>
      {/* 抽屉内容 */}
    </aside>
  );
}
```

受控模式下，`onOpen` 和 `onClose` *不会*更新内部状态——Hook 尊重 prop 作为数据源。它们只触发回调，让父组件决定接下来做什么。`isControlled` 标志暴露出来以便你在需要时进行分支判断，不过实践中很少需要检查它。

两种模式的边界很清晰：如果 `isOpen` 是 `undefined`（或未传），Hook 是非受控的。如果是布尔值——即使是 `false`——Hook 就是受控的。不存在"半受控"的灰色地带。

## onOpenChange：切换简写

很多 UI 框架暴露单一的 `onOpenChange` 回调而非分开的 open/close 处理函数。`useDisclosure` 返回的 `onOpenChange` 函数就是一个切换器：disclosure 关闭时调用 `onOpen`，打开时调用 `onClose`。它可以直接映射到暴露单一回调的组件：

```tsx
const { isOpen, onOpenChange } = useDisclosure();

// 适配 Radix 风格的 API
<Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
  <Dialog.Trigger>打开</Dialog.Trigger>
  <Dialog.Content>...</Dialog.Content>
</Dialog.Root>

// 也可用作切换按钮的处理函数
<button onClick={onOpenChange}>
  {isOpen ? '隐藏' : '显示'}筛选器
</button>
```

切换不是第三条状态路径——它委托给同一套触发回调的 `onOpen` / `onClose`。一次转换，一个回调，一条代码路径。

## 内部实现

完整实现很简短：

```ts
import { useCallback } from 'react';
import { useControlled } from '../useControlled';
import { useLatest } from '../useLatest';

export function useDisclosure(props = {}) {
  const {
    defaultOpen,
    isOpen: isOpenProp,
    onClose: onCloseProp,
    onOpen: onOpenProp,
    onChange = () => {},
  } = props;

  const onOpenPropRef = useLatest(onOpenProp);
  const onClosePropRef = useLatest(onCloseProp);
  const [isOpen, setIsOpen] = useControlled(
    isOpenProp,
    defaultOpen || false,
    onChange,
  );

  const isControlled = isOpenProp !== undefined;

  const onClose = useCallback(() => {
    if (!isControlled) setIsOpen(false);
    onClosePropRef.current?.();
  }, [isControlled, onClosePropRef, setIsOpen]);

  const onOpen = useCallback(() => {
    if (!isControlled) setIsOpen(true);
    onOpenPropRef.current?.();
  }, [isControlled, onOpenPropRef, setIsOpen]);

  const onOpenChange = useCallback(() => {
    (isOpen ? onClose : onOpen)();
  }, [isOpen, onOpen, onClose]);

  return { isOpen: !!isOpen, onOpen, onClose, onOpenChange, isControlled };
}
```

三个构建模块：

1. **[`useControlled`](https://reactuse.com/state/usecontrolled/)** — 在内部 `useState` 和外部 prop 之间切换的 Hook。
2. **[`useLatest`](https://reactuse.com/state/uselatest/)** — 把回调 props 包装在 ref 中，使返回的处理函数引用稳定。
3. **受控守卫** — `if (!isControlled) setIsOpen(...)` 确保 Hook 不会与父组件的状态冲突。

没有 effect，没有订阅，没有浏览器 API。Hook 天然 SSR 安全——纯 React 状态。

## useDisclosure vs useBoolean vs useToggle

`@reactuses/core` 有三个管理布尔值的 Hook，适用场景如下：

| | [`useDisclosure`](https://reactuse.com/state/usedisclosure/) | [`useBoolean`](https://reactuse.com/state/useboolean/) | [`useToggle`](https://reactuse.com/state/usetoggle/) |
|---|---|---|---|
| **返回值** | `{ isOpen, onOpen, onClose, onOpenChange, isControlled }` | `[value, { toggle, setTrue, setFalse }]` | `[value, toggle, setValue]` |
| **受控模式** | 支持（`isOpen` prop） | 不支持 | 不支持 |
| **生命周期回调** | `onOpen`、`onClose`、`onChange` | 无 | 无 |
| **处理函数稳定性** | 通过 `useLatest` ref 稳定化 | 标准 `useCallback` | 标准 `useCallback` |
| **最适合** | 模态框、抽屉、弹出框——有打开/关闭语义和副作用的场景 | 简单的显示/隐藏标志，不需要回调 | 极简布尔切换；非布尔交替（`'asc'` / `'desc'`） |

如果不需要回调或受控模式，`useBoolean` 或 `useToggle` 更轻量。`useDisclosure` 在打开和关闭本身携带超越布尔值的含义时才真正发挥作用。

## 实际模式

### 确认对话框：支持 Escape 和遮罩层关闭

```tsx
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button onClick={onOpen}>删除</button>
      {isOpen && (
        <div className="overlay" onClick={onClose}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <p>确定要删除吗？</p>
            <button onClick={() => { onConfirm(); onClose(); }}>
              是的，删除
            </button>
            <button onClick={onClose}>取消</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### 多个 Disclosure 互斥

```tsx
function SettingsPanel() {
  const general = useDisclosure({ defaultOpen: true });
  const security = useDisclosure();
  const notifications = useDisclosure();

  const closeAll = () => {
    general.onClose();
    security.onClose();
    notifications.onClose();
  };

  const openExclusive = (target: ReturnType<typeof useDisclosure>) => {
    closeAll();
    target.onOpen();
  };

  return (
    <div>
      <button onClick={() => openExclusive(general)}>常规</button>
      <button onClick={() => openExclusive(security)}>安全</button>
      <button onClick={() => openExclusive(notifications)}>通知</button>

      {general.isOpen && <GeneralSettings />}
      {security.isOpen && <SecuritySettings />}
      {notifications.isOpen && <NotificationSettings />}
    </div>
  );
}
```

每个区段有自己的 `useDisclosure`。`openExclusive` 辅助函数先关闭所有，再打开一个——不需要手风琴库就能实现手风琴行为。

## 从 Chakra UI 迁移

如果你用过 Chakra UI 的 `useDisclosure`，API 几乎一样。主要区别：

- **没有 `getButtonProps` / `getDisclosureProps`** — 这个 Hook 管理状态，不管理 DOM 属性。直接使用 `isOpen` 和 `onOpen` / `onClose`。
- **`onOpenChange` 而非 `onToggle`** — 行为相同（切换），名称不同，与 Radix、Headless UI、Ariakit 的命名惯例一致。
- **`onChange` 回调** — Chakra 不暴露这个；`@reactuses/core` 提供，用于同步布尔值到外部 store。
- **不依赖 UI 框架** — 安装 `@reactuses/core`，搭配任何组件库使用，或者不搭配。

迁移就是一次重命名。

## 要点总结

- **[`useDisclosure`](https://reactuse.com/state/usedisclosure/) 替代了 `useState(false)` + 三个内联处理函数的模式**——你的每个模态框、抽屉、弹出框里都有的那个。
- **生命周期回调（`onOpen`、`onClose`、`onChange`）集中管理副作用**——埋点、焦点管理、动画触发——远离 JSX。
- **受控模式可选**：传入 `isOpen`，Hook 听从你的状态；不传，Hook 自己管理。
- **处理函数引用稳定**——`onOpen`、`onClose`、`onOpenChange` 跨渲染保持同一引用，可安全传给 memo 化的子组件。
- **`onOpenChange` 是切换函数**，委托给 `onOpen` / `onClose`，直接映射到 Radix、Headless UI、Ariakit 的单回调 API。
- **天然 SSR 安全**——没有浏览器 API，没有 effect，纯 React 状态。

从 [`@reactuses/core`](https://reactuse.com/state/usedisclosure/) 获取，不要再复制粘贴模态框状态了。
