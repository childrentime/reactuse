---
title: "每个 React 开发者都需要的 10 个浏览器 API Hooks"
description: "学习如何在 React 中使用 Geolocation、Clipboard、Fullscreen、Media Queries 等浏览器 API，借助 ReactUse 提供的简洁、可复用的 Hooks。"
slug: react-browser-api-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, browser-api, tutorial]
keywords: [react browser api hooks, react geolocation hook, react clipboard hook, react fullscreen hook, react media query hook, useMediaQuery react, useClipboard react, useGeolocation react]
image: /img/og.png
date: 2026-03-13
---

# 每个 React 开发者都需要的 10 个浏览器 API Hooks

现代浏览器提供了强大的 API，包括地理定位、剪贴板访问、全屏模式、网络状态等等。在 React 中直接使用它们比应有的难度更大。你需要防范服务端渲染、添加和移除事件监听器、处理权限，以及在卸载时清理。将这些工作乘以你的应用涉及的每个浏览器 API，你就有了大量重复且容易出错的代码。

<!-- truncate -->

ReactUse 通过一个包含 100 多个 Hooks 的库来解决这个问题，将浏览器 API 封装为简洁的、SSR 安全的、TypeScript 友好的接口。下面列出的每个 Hook 都会在访问任何 API 之前检查浏览器可用性，因此可以直接在 Next.js、Remix 和任何其他 SSR 框架中使用。只需安装一次，按需导入：

```bash
npm i @reactuses/core
```

## 1. useMediaQuery -- 响应式设计

在 JavaScript 中响应 CSS 媒体查询。该 Hook 返回一个布尔值，在视口变化时实时更新。

```tsx
import { useMediaQuery } from "@reactuses/core";

function App() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return <div>{isMobile ? <MobileNav /> : <DesktopNav />}</div>;
}
```

用它来条件渲染布局、加载不同资源，或根据屏幕尺寸切换功能，不再仅仅依赖 CSS。

## 2. useClipboard -- 复制到剪贴板

使用现代 Clipboard API 读写系统剪贴板。该 Hook 处理权限、HTTPS 要求和焦点状态边界情况。

```tsx
import { useClipboard } from "@reactuses/core";

function CopyButton({ text }: { text: string }) {
  const [clipboardText, copy] = useClipboard();

  return (
    <button onClick={() => copy(text)}>
      {clipboardText === text ? "Copied!" : "Copy"}
    </button>
  );
}
```

返回的 `copy` 函数是异步的并返回一个 Promise，因此你可以轻松添加成功和失败的反馈。

## 3. useGeolocation -- 用户位置

追踪用户的地理坐标，在卸载时自动清理 `watchPosition` 监听器。

```tsx
import { useGeolocation } from "@reactuses/core";

function LocationDisplay() {
  const { coordinates, error, isSupported } = useGeolocation();

  if (!isSupported) return <p>Geolocation is not supported.</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <p>
      Lat: {coordinates.latitude}, Lng: {coordinates.longitude}
    </p>
  );
}
```

该 Hook 返回 `coordinates`、`locatedAt`（时间戳）、`error` 和 `isSupported`，让你可以处理 UI 中的每种状态。

## 4. useFullscreen -- 全屏模式

对任意元素切换全屏。该 Hook 封装了 Fullscreen API，返回当前状态和控制函数。

```tsx
import { useRef } from "react";
import { useFullscreen } from "@reactuses/core";

function VideoPlayer() {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, { enterFullscreen, exitFullscreen, toggleFullscreen }] =
    useFullscreen(ref);

  return (
    <div ref={ref}>
      <video src="/demo.mp4" />
      <button onClick={toggleFullscreen}>
        {isFullscreen ? "Exit" : "Fullscreen"}
      </button>
    </div>
  );
}
```

它还暴露了 `isEnabled`，让你可以在不支持该 API 的浏览器上隐藏按钮。

## 5. useNetwork -- 在线/离线状态

监控用户的网络连接。该 Hook 追踪在线/离线状态，在可用时还提供 `effectiveType` 和 `downlink` 等连接详情。

```tsx
import { useNetwork } from "@reactuses/core";

function NetworkBanner() {
  const { online, effectiveType } = useNetwork();

  if (!online) return <div className="banner">You are offline</div>;

  return <div>Connection: {effectiveType}</div>;
}
```

用它来显示离线横幅、队列请求，或在慢速连接上优雅降级。

## 6. useIdle -- 空闲检测

检测用户何时停止与页面交互。该 Hook 监听鼠标、键盘、触摸和可见性事件，在指定超时后返回 `true`。

```tsx
import { useIdle } from "@reactuses/core";

function IdleWarning() {
  const isIdle = useIdle(300_000); // 5 minutes

  return isIdle ? <div>Are you still there?</div> : null;
}
```

常见使用场景包括自动登出、暂停昂贵的动画，以及显示"还在看吗？"的提示。

## 7. useDarkMode -- 深色模式切换

管理深色模式，包含系统偏好检测、localStorage 持久化和根元素自动类名切换。

```tsx
import { useDarkMode } from "@reactuses/core";

function ThemeToggle() {
  const [isDark, toggle] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
  });

  return (
    <button onClick={toggle}>
      {isDark ? "Switch to Light" : "Switch to Dark"}
    </button>
  );
}
```

当没有存储的偏好设置时，Hook 会回退到用户的 `prefers-color-scheme` 系统设置。

## 8. usePermission -- 权限状态

查询浏览器权限的状态（地理定位、摄像头、麦克风、通知等），并实时响应变化。

```tsx
import { usePermission } from "@reactuses/core";

function CameraAccess() {
  const status = usePermission("camera");

  if (status === "denied") return <p>Camera access was denied.</p>;
  if (status === "prompt") return <p>We need camera permission.</p>;

  return <p>Camera access granted.</p>;
}
```

与 `useGeolocation` 等其他 Hooks 配合使用，在请求访问之前显示适当的 UI。

## 9. useLocalStorage -- 持久化状态

`useState` 的替代方案，持久化到 `localStorage`。它处理序列化、SSR 安全性、通过 `storage` 事件的跨标签页同步和错误恢复。

```tsx
import { useLocalStorage } from "@reactuses/core";

function Settings() {
  const [lang, setLang] = useLocalStorage("language", "en");

  return (
    <select value={lang ?? "en"} onChange={(e) => setLang(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
    </select>
  );
}
```

它支持自定义序列化器，如果你需要存储日期、Map 或其他非 JSON 类型。

## 10. useEventListener -- 事件处理

将事件监听器附加到任何目标（window、document 或特定元素），自动清理，并提供 TypeScript 安全的事件类型。

```tsx
import { useEventListener } from "@reactuses/core";

function KeyLogger() {
  useEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
  });

  return <p>Press any key...</p>;
}
```

这是 ReactUse 中许多其他 Hooks 的基础 Hook。它通过始终引用最新的处理函数来避免闭包过期。

## 手动实现 vs. ReactUse

上面的每个 Hook 都替代了大量的样板代码。以下是没有 ReactUse 时你需要自行处理的内容：

| 关注点 | 手动实现 | ReactUse Hook |
| --- | --- | --- |
| SSR 安全检查 | 到处添加 `typeof window !== "undefined"` 防护 | 内置 |
| 事件监听器清理 | 在 `useEffect` 返回中使用 `removeEventListener` | 自动 |
| TypeScript 事件类型 | 每个事件手动设置泛型约束 | 完全类型化 |
| 权限处理 | `navigator.permissions.query` + 状态管理 | 一次调用 |
| localStorage 序列化 | `JSON.parse` / `JSON.stringify` + 错误处理 | 自动 |
| 跨标签页同步 | 手动添加 `storage` 事件监听器 | 内置 |
| 水合不匹配预防 | `defaultState` 模式、两次渲染 | 内部处理 |
| Fullscreen API 差异 | 供应商前缀 API 规范化 | 已抽象封装 |

对于单个 Hook 来说节省量不大。但在整个应用中使用五个或更多浏览器 API 时，ReactUse 消除了数百行防御性代码。

## 常见问题

### 这些 Hooks 是 SSR 安全的吗？

是的。ReactUse 中的每个 Hook 在访问任何 API 之前都会检查浏览器可用性。在服务端渲染期间，Hooks 返回安全的默认值并跳过仅限浏览器的逻辑。这意味着在 Next.js、Remix、Astro 或任何其他 SSR 框架中都不会出现水合不匹配。

### 我可以 Tree-shake 未使用的 Hooks 吗？

可以。从 `@reactuses/core` 导入支持 Tree-shaking。你的打包器只会包含你实际导入的 Hooks，因此安装整个库不会有额外代价。

### 这些 Hooks 支持 React 18 和 19 吗？

ReactUse 支持 React 16.8 及以上版本。所有 Hooks 都兼容 React 18 并发特性和 React 19。

### 如何安装 ReactUse？

```bash
npm i @reactuses/core
```

或使用 pnpm 或 yarn：

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

### 在哪里可以找到完整的 API 文档？

每个 Hook 在 [reactuse.com](https://reactuse.com) 上都有专门的文档页面和在线演示。你也可以在 [GitHub](https://github.com/childrentime/reactuse) 上浏览源代码。

---

ReactUse 提供了 100 多个 React Hooks。[查看全部 →](https://reactuse.com)
