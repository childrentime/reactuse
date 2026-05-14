---
title: "React 实时同步：跨浏览器标签页的状态管理"
description: "学习如何使用 BroadcastChannel、localStorage 事件和 ReactUse 的 Hooks 在 React 中实现跨标签页的状态同步。"
slug: react-cross-tab-state
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, state-management, broadcast-channel, tutorial]
keywords: [react sync tabs, BroadcastChannel react, cross tab state, react localStorage sync, react multi tab, useBroadcastChannel]
image: /img/og.png
---

# React 实时同步：跨浏览器标签页的状态管理

你的用户在一个标签页中退出了登录，但在另一个标签页中，他们仍然可以浏览需要认证的内容。他们将主题切换为深色模式，但其他三个标签页依然是浅色。他们在购物车中添加了商品，切换到另一个标签页，却发现购物车数量显示为零。这些并不是边缘场景——这是多标签页浏览的日常现实，而大多数 React 应用对此处理得很差，甚至完全没有处理。

<!-- truncate -->

浏览器默认不会在标签页之间共享 React 状态。每个标签页都运行自己的 JavaScript 上下文，拥有自己的组件树、自己的状态和自己的内存。然而用户期望的是无缝体验——当一个标签页中发生变化时，他们期望所有标签页都能立即反映这个变化。

在本文中，我们将探索使跨标签页通信成为可能的浏览器 API，了解手动实现的方式及其问题，然后看看 [ReactUse](https://reactuse.com) 的 Hooks 如何将所有这些复杂性简化为几行代码。

## 两种用于跨标签页通信的浏览器 API

在使用任何库之前，先了解浏览器原生提供了什么是有帮助的。

### BroadcastChannel API

[BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) 允许你在浏览上下文（标签页、窗口、iframe）之间发送消息，前提是它们属于同一个源（origin）。你通过名称创建一个频道，任何打开同名频道的上下文都可以发送和接收消息。

```tsx
// 标签页 A
const channel = new BroadcastChannel("my-app");
channel.postMessage({ type: "LOGOUT" });

// 标签页 B
const channel = new BroadcastChannel("my-app");
channel.onmessage = (event) => {
  if (event.data.type === "LOGOUT") {
    // 重定向到登录页
  }
};
```

BroadcastChannel 速度快，支持结构化克隆（因此你可以发送对象、数组甚至 `ArrayBuffer`），而且不涉及持久化存储，纯粹是上下文之间的内存消息传递。缺点是消息是即发即弃的——如果发送消息时某个标签页没有打开，它永远不会收到这条消息。

### Storage 事件

当一个标签页写入 `localStorage` 时，同一源上的所有*其他*标签页都会收到一个 `storage` 事件。这让你免费获得了跨标签页的响应式——但仅限于可序列化为字符串的数据，而且只能通过 `localStorage`（不是 `sessionStorage`，后者作用域限于单个标签页）。

```tsx
// 标签页 A 写入
localStorage.setItem("theme", "dark");

// 标签页 B 监听
window.addEventListener("storage", (event) => {
  if (event.key === "theme") {
    console.log("主题已变更为：", event.newValue); // "dark"
  }
});
```

Storage 事件有一个重要优势：数据是持久的。如果用户在更改之后才打开新标签页，新标签页在挂载时会从 `localStorage` 读取当前值。你同时获得了响应式和持久化。

## 手动实现——以及为什么它会变得混乱

让我们尝试从零开始构建跨标签页主题同步。我们需要：

1. 从 `localStorage` 读取初始值。
2. 解析它（`localStorage` 中的所有内容都是字符串）。
3. 设置 `storage` 事件监听器以检测来自其他标签页的变化。
4. 当本地标签页更改值时，序列化并写回。
5. 在卸载时清理监听器。

```tsx
import { useState, useEffect, useCallback } from "react";

function useCrossTabTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem("app-theme");
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  // 监听来自其他标签页的变化
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === "app-theme" && event.newValue) {
        setThemeState(event.newValue as "light" | "dark");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // 当本地状态变化时写入 localStorage
  const setTheme = useCallback((value: "light" | "dark") => {
    setThemeState(value);
    try {
      localStorage.setItem("app-theme", value);
    } catch {
      // 存储已满或不可用
    }
  }, []);

  return [theme, setTheme] as const;
}
```

对于一个简单的字符串值，就需要大约 30 行代码。现在想象一下对认证令牌、用户偏好、购物车状态和通知数量都这样做。每一个都需要自己的序列化逻辑、错误处理和清理。而且我们还没有涉及 BroadcastChannel——如果我们想发送结构化消息（不仅仅是键值字符串），我们需要第二个通信层，带有自己的设置和拆除逻辑。

这就是设计良好的 Hooks 在不隐藏底层概念的情况下消除样板代码的地方。

## useBroadcastChannel：标签页之间的类型安全消息传递

ReactUse 的 [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) Hook 将 BroadcastChannel API 封装在一个简洁的声明式接口中。它处理频道创建、消息监听、卸载时的清理，甚至 SSR 安全——所有这些都在一次调用中完成。

```tsx
import { useBroadcastChannel } from "@reactuses/core";

function NotificationSync() {
  const { data, post, error } = useBroadcastChannel<{
    type: string;
    payload?: unknown;
  }>("my-app-notifications");

  // 向所有其他标签页发送消息
  const broadcastLogout = () => {
    post({ type: "LOGOUT" });
  };

  // 响应来自其他标签页的消息
  useEffect(() => {
    if (data?.type === "LOGOUT") {
      // 清除本地认证状态并重定向
      authStore.clear();
      window.location.href = "/login";
    }
  }, [data]);

  return <button onClick={broadcastLogout}>全部退出登录</button>;
}
```

泛型类型参数为消息形状提供了完整的 TypeScript 安全性。无需手动序列化——BroadcastChannel 原生使用结构化克隆。无需清理代码——Hook 在组件卸载时关闭频道。`error` 值让你可以处理 BroadcastChannel 不受支持的罕见情况。

## useLocalStorage：自动跨标签页同步

对于需要持久化*并且*跨标签页同步的状态，[`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) 是正确的工具。它的工作方式类似于 `useState`，但值由 `localStorage` 支持，并通过 storage 事件自动在所有标签页之间保持同步。

```tsx
import { useLocalStorage } from "@reactuses/core";

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">(
    "app-theme",
    "light"
  );

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      当前：{theme}
    </button>
  );
}
```

当在一个标签页中调用 `setTheme` 时，所有使用相同键（`"app-theme"`）运行此 Hook 的其他标签页会自动更新。Hook 内部处理 JSON 序列化、初始值回退、SSR 保护和 storage 事件订阅。你只需写一行 Hook 调用；Hook 为你编写三十行浏览器 API 代码。

与 [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) 对比，后者提供相同的 API 但将值限定在当前标签页。Session storage 不会触发跨标签页事件，标签页关闭后也不会持久化。当你需要跨标签页同步时选择 `useLocalStorage`；当你需要标签页隔离的持久化时选择 `useSessionStorage`。

## 实用模式

### 模式一：同步认证状态（全端退出登录）

最关键的跨标签页场景之一是认证。当用户在一个标签页中退出登录时，所有其他标签页必须立即响应——否则它们可能继续发送认证请求，导致静默失败或暴露过期数据。

```tsx
import { useBroadcastChannel, useLocalStorage } from "@reactuses/core";

function useAuth() {
  const [token, setToken] = useLocalStorage<string | null>("auth-token", null);
  const { data, post } = useBroadcastChannel<{ type: "LOGOUT" | "LOGIN" }>(
    "auth-channel"
  );

  // 处理来自其他标签页的消息
  useEffect(() => {
    if (data?.type === "LOGOUT") {
      setToken(null);
      window.location.href = "/login";
    }
  }, [data, setToken]);

  const login = (newToken: string) => {
    setToken(newToken);
    post({ type: "LOGIN" });
  };

  const logout = () => {
    setToken(null);
    post({ type: "LOGOUT" });
    window.location.href = "/login";
  };

  return { token, login, logout, isAuthenticated: token !== null };
}
```

这里同时使用了两个 Hook：`useLocalStorage` 持久化令牌并在标签页之间同步，而 `useBroadcastChannel` 发送即时的命令式信号来触发重定向。通过 localStorage 进行的令牌同步确保在退出登录*之后*打开的任何标签页读取到 `null`。广播确保在退出登录*期间*打开的标签页立即响应。

### 模式二：跨标签页同步主题

```tsx
import { useLocalStorage } from "@reactuses/core";
import { useEffect } from "react";

function useThemeSync() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">(
    "app-theme",
    "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme ?? "light");
  }, [theme]);

  return { theme: theme ?? "light", setTheme };
}
```

因为 `useLocalStorage` 已经处理了跨标签页同步，`useEffect` 会在主题变化时在每个标签页中触发——保持 DOM 属性在各处同步。

### 模式三：电商中的购物车状态

购物车数据是跨标签页同步的经典候选。用户经常在多个标签页中浏览商品，并期望购物车保持一致。

```tsx
import { useLocalStorage } from "@reactuses/core";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

function useCart() {
  const [items, setItems] = useLocalStorage<CartItem[]>("cart-items", []);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const current = prev ?? [];
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        return current.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
  };

  const totalItems = (items ?? []).reduce((sum, i) => sum + i.quantity, 0);

  return { items: items ?? [], addItem, removeItem, totalItems };
}
```

在标签页 A 中添加商品，标签页 B 中的购物车徽标立即更新。无需 WebSocket，无需轮询，无需服务端往返。

### 模式四：领导者选举

有时你只想让一个标签页执行任务——轮询 API、维护 WebSocket 连接或运行后台同步。[`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) Hook 为简单的领导者选举协议提供了消息传递层。

```tsx
import { useBroadcastChannel } from "@reactuses/core";
import { useState, useEffect, useRef } from "react";

function useLeaderElection(channelName: string) {
  const [isLeader, setIsLeader] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));
  const { data, post } = useBroadcastChannel<{
    type: "CLAIM" | "HEARTBEAT" | "RELEASE";
    id: string;
  }>(channelName);

  useEffect(() => {
    // 挂载时尝试获取领导权
    post({ type: "CLAIM", id: idRef.current });
    const timer = setTimeout(() => setIsLeader(true), 200);

    return () => {
      clearTimeout(timer);
      post({ type: "RELEASE", id: idRef.current });
    };
  }, [post]);

  useEffect(() => {
    if (data?.type === "CLAIM" && data.id !== idRef.current) {
      // 另一个标签页正在争夺——比较 ID 来解决冲突
      if (data.id > idRef.current) {
        setIsLeader(false);
      }
    }
  }, [data]);

  return isLeader;
}
```

只有领导者标签页运行昂贵的操作。当它关闭时，会广播 `RELEASE` 消息，另一个标签页接管领导权。

## 优化后台标签页

跨标签页同步只是全局的一部分。当标签页在后台时，你通常希望暂停昂贵的工作——轮询 API、运行动画或处理数据。ReactUse 的两个 Hook 使这变得简单直接。

### useDocumentVisibility

[`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) 返回文档的当前可见性状态——`"visible"` 或 `"hidden"`。用它在标签页不可见时暂停工作。

```tsx
import { useDocumentVisibility } from "@reactuses/core";
import { useEffect, useState } from "react";

function usePolling(url: string, intervalMs: number) {
  const visibility = useDocumentVisibility();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (visibility === "hidden") return; // 在后台停止轮询

    const fetchData = async () => {
      const res = await fetch(url);
      setData(await res.json());
    };

    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [url, intervalMs, visibility]);

  return data;
}
```

当用户切换离开标签页时，定时器被清除。当他们切换回来时，新的定时器开始。标签页隐藏时不会浪费网络请求。

### useWindowFocus

[`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) 跟踪浏览器窗口本身是否获得了焦点。这比可见性更细微——一个标签页可以是可见的但未获得焦点（例如，当用户正在与 DevTools 或覆盖浏览器的另一个窗口交互时）。

```tsx
import { useWindowFocus } from "@reactuses/core";

function FocusIndicator() {
  const focused = useWindowFocus();

  return (
    <div>
      {focused
        ? "你正在查看此标签页"
        : "欢迎回来！"}
    </div>
  );
}
```

结合 `useDocumentVisibility` 和 `useWindowFocus` 可以进行精细控制：当标签页隐藏时暂停非关键工作，当标签页可见但未获得焦点时节流次要工作。

## 组合 Hooks：跨标签页通知系统

让我们将所有内容整合在一起。这是一个通知系统，它在标签页之间广播提醒，在 localStorage 中持久化未读计数，并在标签页隐藏时暂停更新。

```tsx
import {
  useBroadcastChannel,
  useLocalStorage,
  useDocumentVisibility,
  useOnline,
} from "@reactuses/core";
import { useEffect, useCallback } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

function useNotificationSync() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>(
    "app-notifications",
    []
  );
  const [unreadCount, setUnreadCount] = useLocalStorage<number>(
    "unread-count",
    0
  );
  const { data, post } = useBroadcastChannel<{
    type: "NEW_NOTIFICATION" | "MARK_READ" | "CLEAR_ALL";
    notification?: Notification;
  }>("notification-channel");
  const visibility = useDocumentVisibility();
  const isOnline = useOnline();

  // 处理来自其他标签页的消息
  useEffect(() => {
    if (!data) return;

    switch (data.type) {
      case "NEW_NOTIFICATION":
        if (data.notification) {
          setNotifications((prev) => [data.notification!, ...(prev ?? [])]);
          setUnreadCount((prev) => (prev ?? 0) + 1);
        }
        break;
      case "MARK_READ":
        setUnreadCount(0);
        break;
      case "CLEAR_ALL":
        setNotifications([]);
        setUnreadCount(0);
        break;
    }
  }, [data, setNotifications, setUnreadCount]);

  const addNotification = useCallback(
    (title: string, body: string) => {
      const notification: Notification = {
        id: crypto.randomUUID(),
        title,
        body,
        timestamp: Date.now(),
      };
      setNotifications((prev) => [notification, ...(prev ?? [])]);
      setUnreadCount((prev) => (prev ?? 0) + 1);
      post({ type: "NEW_NOTIFICATION", notification });
    },
    [post, setNotifications, setUnreadCount]
  );

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    post({ type: "MARK_READ" });
  }, [post, setUnreadCount]);

  // 当标签页变为可见时自动标记为已读
  useEffect(() => {
    if (visibility === "visible" && (unreadCount ?? 0) > 0) {
      markAllRead();
    }
  }, [visibility, unreadCount, markAllRead]);

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    addNotification,
    markAllRead,
    isOnline,
  };
}
```

这个 Hook 使用了四个 ReactUse Hooks 协同工作：

- **`useBroadcastChannel`** 在通知到达或被阅读时在标签页之间发送实时信号。
- **`useLocalStorage`** 持久化通知列表和未读计数，使新标签页可以获取当前状态。
- **`useDocumentVisibility`** 在用户返回后台标签页时自动将通知标记为已读。
- **`useOnline`**（通过 [`useOnline`](https://reactuse.com/browser/useonline/)）暴露网络状态，使 UI 可以在应用离线且通知可能延迟时显示提示。

每个 Hook 处理一个关注点。组合在一起，它们形成了一个完整的系统——具有持久化、实时同步、可见性感知和网络状态——不到 70 行代码。

## 何时使用哪种方案

| 场景 | 推荐的 Hook | 原因 |
|---|---|---|
| 需要跨标签页同步的持久化状态 | `useLocalStorage` | 数据在刷新后存活；storage 事件提供同步 |
| 不需要同步的标签页作用域状态 | `useSessionStorage` | 每个标签页隔离；无跨标签页事件 |
| 实时命令式消息 | `useBroadcastChannel` | 快速，支持结构化数据，无持久化开销 |
| 同时需要持久化和即时消息 | `useLocalStorage` + `useBroadcastChannel` | 两全其美：为新标签页持久化，为已打开的标签页广播 |
| 暂停后台工作 | `useDocumentVisibility` / `useWindowFocus` | 减少不必要的计算和网络请求 |

## 安装

```bash
npm install @reactuses/core
```

或使用你偏好的包管理器：

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

## 相关 Hooks

- [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) — 通过 BroadcastChannel API 实现类型安全的跨标签页消息传递
- [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) — 具有自动跨标签页同步的持久化状态
- [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) — 标签页作用域的持久化状态
- [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) — 跟踪当前标签页是否可见
- [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) — 跟踪浏览器窗口是否获得焦点
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) — 声明式事件监听器管理，自动清理
- [`useOnline`](https://reactuse.com/browser/useonline/) — 响应式网络连接状态

ReactUse 提供了 100+ 个 React Hooks。[探索全部 →](https://reactuse.com)
