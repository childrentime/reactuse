---
title: "React 浏览器标签页 UX：用标题、Favicon 和通知把用户拉回来"
description: "用 ReactUse 中的 useTitle、useFavicon、useDocumentVisibility、useWindowFocus、usePageLeave、usePermission 和 useWebNotification 构建注意力感知的 React UI——动态标签标题、状态化 favicon、页面隐藏时暂停、聚焦时刷新、原生系统通知。"
slug: react-browser-tab-ux
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-09
tags: [react, hooks, browser, ux, tutorial]
keywords: [react browser tab ux, useTitle, useFavicon, useDocumentVisibility, useWindowFocus, usePageLeave, useWebNotification, usePermission, react document title, react tab notifications, react attention ux]
image: /img/og.png
---

# React 浏览器标签页 UX：用标题、Favicon 和通知把用户拉回来

普通用户笔记本上随时开着三十个标签页，你的应用只是其中一个。用户打开它，切去看 Slack，十五分钟后回来，已经分不清哪一个标签页是你的。如果你的标签标题还停在"My App"，favicon 还是上线那天的灰色方块，那十五分钟就白白浪费了——其间来过新消息、构建完成、上传成功，用户却完全不知道。

<!-- truncate -->

浏览器其实给了你一块虽小但很有威力的"注意力表面"：标签标题、favicon、可见状态、聚焦事件，以及系统级通知。把它们接对了，一个非活动标签可以在标签栏里显示"(3) New messages — Acme Chat"，favicon 上闪一个红点，隐藏时停掉昂贵的轮询，回到前台时立刻刷新，紧急情况还能弹一条原生 OS 通知。接错了，这堆代码会泄漏事件监听器、跟 React 的渲染周期打架、首次 SSR 就抛 hydration 不一致。

本文走过六个在 React 中构建注意力感知 UI 的原语，每一个都用 [ReactUse](https://reactuse.com) 中专门的 Hook 实现。我们先看手动写法、踩到的坑，再看 Hook 是怎么把它们藏起来的。最后把六个 Hook 合在一起，做出一个像原生 App 一样会"叫人"的聊天标签页。

## 1. 把标签标题当作通知通道

`<title>` 元素是 Web 上被低估得最严重的通知表面。Gmail、GitHub、Linear、Discord 都在用：开头的 `(N)` 计数或一个 `•` 圆点告诉你"出事了"，而你不必切回标签页确认。实现是一行——`document.title = "..."`——但放进 React 组件里写法不对，标题就会一直停在最后一次渲染设置的值上，连组件卸载之后都不会复原。

### 手动实现

```tsx
import { useEffect, useState } from "react";

function ManualUnreadTitle({ count }: { count: number }) {
  useEffect(() => {
    const previous = document.title;
    document.title = count > 0 ? `(${count}) Acme Chat` : "Acme Chat";
    return () => {
      document.title = previous;
    };
  }, [count]);

  return null;
}
```

肉眼不太容易抓到的 bug 在这里：`previous` 捕获的是 effect 运行那一刻的标题，意味着如果父组件在两次渲染之间也改了标题，cleanup 会把一个过时的值再写回去。修法要么是给标题选一个唯一的真值来源，要么干脆别 cleanup，让下一次渲染覆盖。多数应用走第二条路，然后忘了写 cleanup，半年之后接进 React StrictMode、effect 跑两次，标题就卡死在某个旧值上。

### ReactUse 写法：useTitle

[`useTitle`](https://reactuse.com/browser/useTitle/) 接受一个字符串，每当字符串变化就同步到 `document.title`：

```tsx
import { useTitle } from "@reactuses/core";

function UnreadTitle({ count }: { count: number }) {
  useTitle(count > 0 ? `(${count}) Acme Chat` : "Acme Chat");
  return null;
}
```

整个组件就这么多。Hook 订阅的是它自己的输入，而不是上一次的 DOM 值，所以不可能出现"清理写回旧值"的 bug。把它丢在树里任何位置——通常是页面根部，或者持有未读数的那个组件——标题就会随着数据变。

一个常见的搭配是把它和聊天 store 中派生出的未读数组合起来：

```tsx
import { useTitle } from "@reactuses/core";
import { useChatStore } from "./store";

function ChatTitle() {
  const unread = useChatStore((s) => s.unreadCount);
  const channel = useChatStore((s) => s.activeChannel?.name ?? "Chat");
  useTitle(unread > 0 ? `(${unread}) ${channel} — Acme` : `${channel} — Acme`);
  return null;
}
```

这个组件不渲染任何视觉元素，存在的唯一理由就是把 store 同步到标题上。在应用顶部挂一次就好。

## 2. 状态化的 Favicon

Favicon 比标题占的位置还要小——十六像素见方——但它是标题被截断时用户在标签栏里唯一能看到的东西。根据状态切换 favicon（idle 灰、attention 红、error 橙、success 绿）是浏览器里最廉价的 UX 之一。

### 手动实现

```tsx
import { useEffect } from "react";

function ManualFavicon({ status }: { status: "idle" | "alert" | "error" }) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) return;
    link.href =
      status === "idle"
        ? "/favicon.ico"
        : status === "alert"
        ? "/favicon-alert.ico"
        : "/favicon-error.ico";
  }, [status]);

  return null;
}
```

正常路径下能跑，坏在三种情况下：根本没有 `<link rel="icon">`（有些打包器会把它去掉）、有多个不同尺寸的 icon link（Apple touch icon、manifest icon）、SSR 渲染的 icon 和客户端要的不一样。最后会写成一堆分支。

### ReactUse 写法：useFavicon

[`useFavicon`](https://reactuse.com/browser/useFavicon/) 把这三种情况都照顾了。它会更新所有匹配 `link[rel*="icon"]` 的标签，找不到就自己创建一个，同时支持 base URL 前缀（用于 CDN 资源）。

```tsx
import { useFavicon } from "@reactuses/core";

function StatusFavicon({ status }: { status: "idle" | "alert" | "error" }) {
  const href =
    status === "idle"
      ? "/favicon.ico"
      : status === "alert"
      ? "/favicon-alert.ico"
      : "/favicon-error.ico";
  useFavicon(href);
  return null;
}
```

一个有意思的玩法是把它和未读数结合，做出"带角标的 favicon"。预先生成几张 PNG（`favicon-1.png` 到 `favicon-9.png`，再加 `favicon-9plus.png`），按数量挑一张：

```tsx
import { useFavicon } from "@reactuses/core";

function BadgedFavicon({ count }: { count: number }) {
  const variant =
    count === 0 ? "" : count > 9 ? "-9plus" : `-${count}`;
  useFavicon(`/favicon${variant}.png`);
  return null;
}
```

这样即使标题被截断，标签栏里也能看到带数字的 favicon。

## 3. 标签隐藏时暂停昂贵的工作

每个应用至少有一个不该在用户看不到时还在跑的轮询、动画或视频。浏览器会节流后台标签，但节流不等于停止——一个原本 1 秒的轮询变成 60 秒，仍然在打服务器、解析 JSON、改 state、触发一次没人看到的渲染。Page Visibility API 让你能干净地暂停。

### 手动实现

```tsx
import { useEffect, useState } from "react";

function ManualVisibility() {
  const [hidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return hidden ? "hidden" : "visible";
}
```

两个问题。一是服务器端 `document` 是 undefined，初始 state 直接把 SSR 弄崩。二是 `visibilitychange` 在首次绘制时不会触发——如果用户进站时你的页面就是后台标签，初次的 `document.hidden` 是对的，但等到聚焦回来你就不会再读它一次。

### ReactUse 写法：useDocumentVisibility

[`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) 用一个 `defaultValue` 参数处理 SSR，并在挂载之后再同步一次。

```tsx
import { useEffect } from "react";
import { useDocumentVisibility } from "@reactuses/core";

function PriceTicker() {
  const visibility = useDocumentVisibility("visible");
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    if (visibility === "hidden") return;
    const id = setInterval(async () => {
      const r = await fetch("/api/price");
      setPrice((await r.json()).price);
    }, 1000);
    return () => clearInterval(id);
  }, [visibility]);

  return <span>${price ?? "—"}</span>;
}
```

Tab 可见时挂 interval、隐藏时卸载、回来再重新挂。没有"被节流但还在跑"的轮询，没有浪费的带宽，用户切回来那一刻就能看到最新价格。

Hook 返回的是真正的 `DocumentVisibilityState`（`'visible'` | `'hidden'`），而不是布尔值，跟规范保持一致，将来规范扩出 `'prerender'` 这种状态也能直接接入。

## 4. 聚焦时刷新

`visibilitychange` 在标签从隐藏变成可见时触发，但"可见"不等于"被聚焦"——画中画、左右分屏、或者你的标签是后台窗口里的前景标签都属于这种情况。如果你想要的是"用户刚刚切回我"，那应该用 window focus，而不是 visibility。

### 手动实现

```tsx
import { useEffect, useState } from "react";

function ManualFocus() {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setFocused(document.hasFocus());
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return focused ? "focused" : "blurred";
}
```

跟前面一样的故事——三个事件监听器、一次初始读取、一个 SSR 的坑。

### ReactUse 写法：useWindowsFocus

[`useWindowFocus`](https://reactuse.com/element/useWindowFocus/)（导出名是 `useWindowsFocus`，遗留命名保留了下来）返回一个布尔值，并在挂载时再同步一次。

```tsx
import { useEffect } from "react";
import { useWindowsFocus } from "@reactuses/core";

function FreshFeed() {
  const focused = useWindowsFocus();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!focused) return;
    fetch("/api/feed").then((r) => r.json()).then(setItems);
  }, [focused]);

  return <Feed items={items} />;
}
```

每次用户切回这个窗口，feed 就重新拉取一次。和 `useDocumentVisibility` 配合：隐藏时停掉轮询，重新聚焦时拉一次新数据，"长时间离开"和"快速一瞥"这两种情况都被覆盖。

## 5. 在用户离开之前抓住他

`usePageLeave` 在鼠标移出视口时触发——通常是朝着标签栏或地址栏移动，往往是用户准备切走的先兆。这是"离开意图"浮层的基础。这种模式被广告弹窗用滥了名声不太好，但用在"你有未保存的改动"提示或"走之前看看你错过了什么"上是有用的。

```tsx
import { usePageLeave } from "@reactuses/core";

function UnsavedHint({ dirty }: { dirty: boolean }) {
  const isLeaving = usePageLeave();
  if (!dirty || !isLeaving) return null;
  return (
    <div className="toast">
      你有未保存的改动。按 ⌘S 保存。
    </div>
  );
}
```

Hook 监听 `mouseout`、`mouseleave`、`mouseenter`，光标越过视口边缘时翻转布尔值。用得节制一点——每一个在你出门时塞过"等等，再看一眼！"模态框的网站，都是在提醒：这个模式从有用变到讨厌只需要一步。

更克制的版本：和"表单是否脏"配合，只有真正有东西要丢失时才提示。

## 6. 原生通知——先看权限

Notification API 是这一切表面里唯一彻底逃出浏览器的：原生 OS 通知即使你的标签被埋在最深处、窗口被最小化、用户在另一个 App 里，都能弹出。它也是唯一一个明确需要用户授权的，把授权 UX 做错就是把"deny"刻在浏览器设置里最快的捷径。

这里成对使用的两个 Hook 是 `usePermission` 和 `useWebNotification`。

### 在请求之前先看状态

[`usePermission`](https://reactuse.com/browser/usePermission/) 包装了 Permissions API，针对任意权限名返回当前状态——`'granted'`、`'denied'`、`'prompt'`，或者 API 不支持时返回空。用它来决定是渲染"开启通知"按钮（状态是 `'prompt'`）、"已开启"指示（`'granted'`），还是"通知被禁用——去浏览器设置修复"链接（`'denied'`）。

```tsx
import { usePermission } from "@reactuses/core";

function NotificationStatus() {
  const state = usePermission("notifications");
  if (state === "granted") return <span>通知：已开启</span>;
  if (state === "denied") return <a href="#help">通知被禁用——前往修复</a>;
  return null;
}
```

### 仅在用户主动操作时再请求

[`useWebNotification`](https://reactuse.com/browser/useWebNotification/) 返回 `isSupported`、`show`、`close` 和 `ensurePermissions`。Notification API 的铁律：**不要**在页面加载时就调 `Notification.requestPermission()`。浏览器把权限提示作为标签级 chrome 弹窗显示，在用户跟你的页面发生交互之前就弹出来，是教科书级的"反射性拒绝"UX。

放到一个按钮点击里再触发：

```tsx
import { useWebNotification } from "@reactuses/core";

function EnableButton() {
  const { isSupported, ensurePermissions, show } = useWebNotification();
  if (!isSupported) return null;

  return (
    <button
      onClick={async () => {
        const granted = await ensurePermissions();
        if (granted) {
          show("已开启", {
            body: "我们会在这里通知你新消息。",
            icon: "/favicon.ico",
          });
        }
      }}
    >
      开启桌面通知
    </button>
  );
}
```

一旦用户授权，从应用的任何地方调用 `show(title, options)` 就能弹原生通知。Hook 在卸载时会关掉当前通知，所以触发后立刻卸载的组件不会留下永久挂着的通知。

## 全部组合：一个注意力感知的聊天标签页

把六个原语都接上之后，一个聊天标签页大致是这样的：未读数同时更新标题和 favicon；轮询在隐藏时暂停、在重新聚焦时刷新；草稿未保存时触发离开提示；后台来新消息时弹原生通知。

```tsx
import { useEffect, useRef } from "react";
import {
  useTitle,
  useFavicon,
  useDocumentVisibility,
  useWindowsFocus,
  usePageLeave,
  useWebNotification,
} from "@reactuses/core";
import { useChatStore } from "./store";

export function AttentionAwareChat() {
  const unread = useChatStore((s) => s.unreadCount);
  const channel = useChatStore((s) => s.activeChannel?.name ?? "Chat");
  const draftDirty = useChatStore((s) => s.composer.length > 0);
  const latest = useChatStore((s) => s.latestMessage);
  const fetchFeed = useChatStore((s) => s.fetchFeed);

  // 1 + 2: 标题和 favicon 反映未读数
  useTitle(unread > 0 ? `(${unread}) ${channel} — Acme` : `${channel} — Acme`);
  const variant = unread === 0 ? "" : unread > 9 ? "-9plus" : `-${unread}`;
  useFavicon(`/favicon${variant}.png`);

  // 3: 隐藏时暂停轮询
  const visibility = useDocumentVisibility("visible");
  useEffect(() => {
    if (visibility === "hidden") return;
    const id = setInterval(fetchFeed, 5000);
    return () => clearInterval(id);
  }, [visibility, fetchFeed]);

  // 4: 聚焦时全量刷新
  const focused = useWindowsFocus();
  useEffect(() => {
    if (focused) fetchFeed();
  }, [focused, fetchFeed]);

  // 5: 有未保存草稿时给离开提示
  const isLeaving = usePageLeave();

  // 6: 后台收到新消息时弹原生通知
  const { show, ensurePermissions, isSupported } = useWebNotification();
  const lastNotifiedId = useRef<string | null>(null);
  useEffect(() => {
    if (!isSupported || !latest || visibility === "visible") return;
    if (lastNotifiedId.current === latest.id) return;
    lastNotifiedId.current = latest.id;
    show(`${latest.author} 在 ${channel}`, {
      body: latest.text,
      icon: "/favicon.ico",
      tag: "chat-message",
    });
  }, [latest, visibility, channel, show, isSupported]);

  return (
    <>
      <ChatPane />
      {draftDirty && isLeaving && (
        <Toast>你有一条未保存的草稿。</Toast>
      )}
      {!isSupported || (
        <button onClick={ensurePermissions}>开启桌面通知</button>
      )}
    </>
  );
}
```

六个 Hook，一个组件，没有手写的事件监听器，没有 SSR 崩溃，没有泄漏的 timer。每一行注意力管理逻辑都和它服务的聊天功能贴在一起，下一个读这个文件的人一眼就知道去哪儿改。

## 小结

| Hook | 用途 | 何时需要 |
| --- | --- | --- |
| [`useTitle`](https://reactuse.com/browser/useTitle/) | 把字符串同步到 `document.title` | 未读数、构建状态、文档名 |
| [`useFavicon`](https://reactuse.com/browser/useFavicon/) | 响应式切换 favicon `href` | 状态徽标、提醒红点、品牌化状态 |
| [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) | 跟踪标签隐藏/可见 | 暂停轮询、动画、视频 |
| [`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) | 跟踪窗口焦点 | 回来时刷新、失焦时暂停 |
| [`usePageLeave`](https://reactuse.com/browser/usePageLeave/) | 检测光标离开视口 | 离开意图提示、未保存草稿警告 |
| [`usePermission`](https://reactuse.com/browser/usePermission/) | 读取 Permissions API 状态 | 通知/定位等条件化 CTA |
| [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) | 显示原生 OS 通知 | 后台消息提醒、构建完成提示 |

浏览器标签页 UX 是那种"好应用"和"出色应用"之间差距很小、感受差距很大的领域。六个 Hook、二十行胶水代码，你的应用就开始有了那些跟它争夺注意力的原生应用的"行为感"。在 [reactuse.com](https://reactuse.com) 浏览完整目录——明天上线了哪一个，给我们扔张截图。
