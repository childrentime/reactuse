---
title: "如何使用 localStorage Hook 在 React 中持久化状态"
description: "学习如何使用 useLocalStorage Hook 将 React 状态持久化到 localStorage。涵盖自动序列化、SSR 安全性、跨标签页同步和自定义序列化器。"
slug: react-localstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, useLocalStorage, state-management]
keywords: [react localstorage hook, useLocalStorage react, persist state react, react localstorage]
image: /img/og.png
---

# 如何使用 localStorage Hook 在 React 中持久化状态

React localStorage Hook 是一个自定义 Hook，它将 React 组件状态与浏览器的 `localStorage` API 同步，使数据能够在页面刷新和浏览器会话之间持久保存。它提供了类似 `useState` 的接口，自动处理序列化、错误恢复和 SSR 安全性，无需手动读取、写入和解析存储的值。

<!-- truncate -->

## 问题所在

React 状态是短暂的。当用户刷新页面或关闭浏览器标签页时，存储在 `useState` 中的任何状态都会丢失。对于用户偏好、表单草稿、购物车项目或认证令牌等数据，这是一种糟糕的体验。

浏览器的 `localStorage` API 提供了一个简单的持久化层，但将它与 React 集成会带来几个挑战：

1. 值必须被序列化和反序列化（localStorage 只存储字符串）
2. 在服务端渲染期间读取 localStorage 会导致错误
3. 保持 React 状态和 localStorage 同步需要小心管理副作用
4. 多个标签页可能修改同一个键，导致状态过期

## 手动方式

以下是开发者通常手动接入 localStorage 持久化的方式：

```tsx
import { useEffect, useState } from "react";

function useManualLocalStorage(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return defaultValue;
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

这涵盖了基础功能，但仍有不足。它不处理序列化错误，不监听通过 `storage` 事件的跨标签页变化，不支持复杂数据类型的自定义序列化器，而且每次需要持久化时都要重复这些逻辑。

## 更好的方式：useLocalStorage

[ReactUse](https://reactuse.com) 提供了 `useLocalStorage` Hook，一次导入就能处理上述所有问题：

```tsx
import { useLocalStorage } from "@reactuses/core";

function ThemeSettings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>Dark Mode</button>
      <button onClick={() => setTheme("light")}>Light Mode</button>
    </div>
  );
}
```

该 Hook 返回一个与 `useState` 相同的元组——当前值和一个设置函数。底层它在挂载时从 localStorage 读取，在每次更新时写入，并在 SSR 或 localStorage 不可用时优雅地回退到默认值。

它支持字符串、数字、布尔值和对象。类型推断是自动的：

```tsx
import { useLocalStorage } from "@reactuses/core";

// Type is inferred as number | null
const [count, setCount] = useLocalStorage("visit-count", 0);

// Type is inferred as boolean | null
const [accepted, setAccepted] = useLocalStorage("cookie-consent", false);

// Type is inferred as { name: string; role: string } | null
const [user, setUser] = useLocalStorage("user", { name: "", role: "viewer" });
```

## 高级用法

### 自定义序列化器

默认情况下，`useLocalStorage` 使用 `JSON.parse` 和 `JSON.stringify`。如果你需要以不同格式存储数据——例如日期或自定义类——你可以提供自定义序列化器：

```tsx
import { useLocalStorage } from "@reactuses/core";

const [lastVisit, setLastVisit] = useLocalStorage("last-visit", new Date(), {
  serializer: {
    read: (raw: string) => new Date(raw),
    write: (value: Date) => value.toISOString(),
  },
});
```

### 跨标签页同步

该 Hook 默认监听浏览器的 `storage` 事件，因此如果用户在一个标签页中更新了值，所有其他打开的标签页会立即反映变化。如果需要，你可以禁用此功能：

```tsx
const [token, setToken] = useLocalStorage("auth-token", "", {
  listenToStorageChanges: false,
});
```

### SSR 安全性

因为 `useLocalStorage` 在访问 `localStorage` 之前会检查浏览器可用性，所以它可以直接在 Next.js、Remix 和任何其他 SSR 框架中使用。在服务端渲染期间，Hook 返回默认值而不会抛出错误。

### 错误处理

如果 localStorage 已满、被浏览器策略阻止或包含损坏的数据，Hook 会优雅地捕获错误。你可以提供自定义的错误处理器：

```tsx
const [data, setData] = useLocalStorage("app-data", null, {
  onError: (error) => {
    console.warn("Storage error:", error);
    // Send to your error tracking service
  },
});
```

## 常见使用场景

- **主题和外观偏好** -- 跨会话持久化深色/浅色模式
- **表单草稿** -- 保存进行中的表单数据，以免用户在刷新时丢失工作
- **认证令牌** -- 在页面加载之间存储 JWT 或会话令牌
- **功能标志和引导状态** -- 记住用户已关闭的提示
- **购物车内容** -- 无需后端即可保持购物车项目完好
- **语言和区域设置** -- 记住用户偏好的语言

## 安装

```bash
npm i @reactuses/core
```

然后导入 Hook：

```tsx
import { useLocalStorage } from "@reactuses/core";
```

## 相关 Hooks

- [useLocalStorage 文档](https://reactuse.com/state/useLocalStorage/) -- 完整 API 参考和在线演示
- [useSessionStorage](https://reactuse.com/state/useSessionStorage/) -- 相同的 API，但数据在标签页关闭时清除
- [useStorage](https://reactuse.com/state/useStorage/) -- 一个通用 Hook，适用于任何兼容 Storage 的后端

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
