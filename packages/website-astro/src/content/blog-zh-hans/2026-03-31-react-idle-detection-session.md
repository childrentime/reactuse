---
title: "React 空闲检测与会话管理实战"
description: "学习如何在 React 中检测用户空闲状态、管理会话超时、处理标签页可见性，使用 ReactUse 提供的 Hook 轻松实现。"
slug: react-idle-detection-session
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, idle-detection, session-management, tutorial]
keywords: [react idle detection, useIdle, session timeout react, react tab visibility, useWakeLock, useDocumentVisibility, react session management]
image: /img/og.png
---

# React 空闲检测与会话管理实战

凡是涉及敏感数据的应用——银行后台、医疗信息系统、运维管理面板——都绕不开一个看似简单的问题：*用户还在吗？* 如果他离开电脑去倒了杯咖啡，屏幕上还挂着一份病历，你应该锁定会话。如果他在等待数据导出时切到了别的标签页，你可以暂停轮询来节省带宽。如果他正在看培训视频，屏幕不应该自动息屏。这些场景本质上是同一个问题：感知用户是否在场，并做出相应处理。

<!-- truncate -->

本文将从零开始构建四个实用模式，先展示手动实现的痛点，再用 [ReactUse](https://reactuse.com) 的 Hook 一一替换。读完之后，你将掌握会话超时提醒、后台标签页暂停、屏幕常亮控制，以及用户回归通知这四种生产级方案。

## 1. 会话超时警告：空闲检测

### 手动实现

检测空闲意味着你要监听所有能表明用户活跃的信号——鼠标移动、键盘输入、触摸事件、滚动——然后在任一事件触发时重置计时器。一个朴素的实现大概长这样：

```tsx
import { useCallback, useEffect, useRef, useState } from "react";

function useManualIdle(timeoutMs: number) {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    setIdle(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIdle(true), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer(); // 启动计时器

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return idle;
}
```

这段代码在 demo 里能跑，但放到生产环境就捉襟见肘了：你漏掉了 `mousedown`、`pointerdown`、`wheel` 和 `visibilitychange`；每次鼠标移动都会调用 `setIdle(false)`，即使当前已经不是空闲状态，白白触发重渲染；想区分"空闲 5 分钟"和"空闲 30 秒"就得再加一组计时器；超时时长也没法在运行时动态修改。

### Hook 方案：`useIdle`

[`useIdle`](https://reactuse.com/browser/useIdle/) 一行搞定：

```tsx
import { useIdle } from "@reactuses/core";

function SessionManager() {
  const idle = useIdle(5 * 60 * 1000); // 5 分钟

  return idle ? <SessionWarningDialog /> : null;
}
```

它在内部监听了完整的 DOM 事件集合，自带防抖，返回一个稳定的布尔值。不用自己维护定时器，不用担心遗漏事件类型。

### 完整的会话超时对话框

把 `useIdle` 和倒计时结合起来，构建一个真实可用的会话超时警告：

```tsx
import { useCallback, useEffect, useState } from "react";
import { useIdle } from "@reactuses/core";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 分钟
const WARNING_DURATION = 60; // 60 秒倒计时

function SessionTimeoutGuard({ onLogout }: { onLogout: () => void }) {
  const idle = useIdle(IDLE_TIMEOUT);
  const [countdown, setCountdown] = useState(WARNING_DURATION);

  useEffect(() => {
    if (!idle) {
      setCountdown(WARNING_DURATION);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [idle, onLogout]);

  if (!idle) return null;

  return (
    <div className="session-overlay">
      <div className="session-dialog">
        <h2>还在吗？</h2>
        <p>
          由于长时间未操作，您的会话将在 <strong>{countdown}</strong> 秒后过期。
        </p>
        <p>移动鼠标或按任意键即可保持登录状态。</p>
        <div className="session-progress">
          <div
            className="session-progress-bar"
            style={{ width: `${(countdown / WARNING_DURATION) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

因为 `useIdle` 在用户动鼠标的瞬间就会返回 `false`，对话框会自动消失——甚至不需要"保持登录"按钮（当然你也可以加一个）。用户重新活跃时，倒计时也会干净地重置。

## 2. 标签页切换时暂停后台任务

### 手动实现

很多应用会定时轮询 API。当用户切到别的标签页时，这些请求纯属浪费。手动检测标签页可见性需要用到 Page Visibility API：

```tsx
import { useEffect, useState } from "react";

function useManualDocumentVisibility() {
  const [visibility, setVisibility] = useState<DocumentVisibilityState>(
    typeof document !== "undefined" ? document.visibilityState : "visible"
  );

  useEffect(() => {
    const handler = () => setVisibility(document.visibilityState);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visibility;
}
```

代码不长，但你得记得处理 SSR 的情况，而且一旦需要把可见性和窗口焦点等其他信号组合起来用，条件判断就会散落在组件各处。

### Hook 方案：`useDocumentVisibility`

[`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) 封装了 Page Visibility API，并内置了 SSR 安全检查：

```tsx
import { useDocumentVisibility } from "@reactuses/core";

function PollingDashboard() {
  const visibility = useDocumentVisibility();

  useEffect(() => {
    if (visibility === "hidden") return;

    const interval = setInterval(() => {
      fetch("/api/metrics").then(/* 更新状态 */);
    }, 10_000);

    return () => clearInterval(interval);
  }, [visibility]);

  return <Dashboard />;
}
```

用户切走标签页时 `visibility` 变为 `"hidden"`，effect 清理函数执行，轮询停止。用户切回来时 effect 重新运行，轮询恢复。零浪费请求。

### 更智能的数据暂停模式

更稳健的做法是把可见性和数据新鲜度指标结合起来：

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useDocumentVisibility } from "@reactuses/core";

interface DashboardData {
  metrics: Record<string, number>;
  updatedAt: number;
}

function SmartPollingDashboard() {
  const visibility = useDocumentVisibility();
  const [data, setData] = useState<DashboardData | null>(null);
  const [stale, setStale] = useState(false);
  const lastFetchRef = useRef(0);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setData(json);
    setStale(false);
    lastFetchRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (visibility === "hidden") {
      // 后台停留超过 30 秒则标记数据过期
      const staleTimer = setTimeout(() => setStale(true), 30_000);
      return () => clearTimeout(staleTimer);
    }

    // 标签页可见——如果数据过期则立即刷新
    if (stale || Date.now() - lastFetchRef.current > 30_000) {
      fetchData();
    }

    // 恢复正常轮询
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [visibility, stale, fetchData]);

  return (
    <div>
      {stale && <div className="stale-banner">数据可能已过时</div>}
      {data && <MetricsGrid metrics={data.metrics} />}
    </div>
  );
}
```

这个模式的好处是：后台不做无用请求、用户切回来后立即刷新、长时间离开还会显示过期提示。

## 3. 保持屏幕常亮

### 手动实现

Screen Wake Lock API 可以阻止设备屏幕变暗或锁定。视频播放器、演示文稿、菜谱查看器等场景都离不开它——用户在看屏幕但不触碰设备的时候，你不希望屏幕自己灭掉：

```tsx
import { useCallback, useEffect, useRef, useState } from "react";

function useManualWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setIsActive(true);

      wakeLockRef.current.addEventListener("release", () => {
        setIsActive(false);
      });
    } catch (err) {
      console.error("Wake Lock 请求失败:", err);
    }
  }, []);

  const release = useCallback(async () => {
    await wakeLockRef.current?.release();
    wakeLockRef.current = null;
    setIsActive(false);
  }, []);

  // 标签页重新可见时需要重新获取锁
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isActive) {
        request();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive, request]);

  return { isActive, request, release };
}
```

Wake Lock API 有个坑：浏览器会在标签页隐藏时自动释放锁。你必须在标签页重新可见时重新获取，这恰恰是生产环境中最容易遗漏的边界情况。

### Hook 方案：`useWakeLock`

[`useWakeLock`](https://reactuse.com/browser/useWakeLock/) 自动处理重新获取、错误处理和清理工作：

```tsx
import { useWakeLock } from "@reactuses/core";

function PresentationMode() {
  const { isActive, request, release } = useWakeLock();

  return (
    <button onClick={() => (isActive ? release() : request("screen"))}>
      {isActive ? "屏幕将保持常亮" : "允许屏幕息屏"}
    </button>
  );
}
```

### 视频应用的"保持常亮"开关

下面是一个视频或演示应用的完整组件：

```tsx
import { useWakeLock, useDocumentVisibility } from "@reactuses/core";
import { useEffect } from "react";

function VideoPlayer({ src }: { src: string }) {
  const { isActive, request, release } = useWakeLock();
  const visibility = useDocumentVisibility();

  // 播放时自动请求屏幕常亮
  const handlePlay = () => {
    if (!isActive) request("screen");
  };

  const handlePause = () => {
    if (isActive) release();
  };

  return (
    <div className="video-container">
      <video
        src={src}
        onPlay={handlePlay}
        onPause={handlePause}
        controls
      />
      <div className="video-controls">
        <span className={`wake-indicator ${isActive ? "active" : ""}`}>
          {isActive ? "屏幕已锁定常亮" : "屏幕可能自动息屏"}
        </span>
        {visibility === "hidden" && (
          <span className="background-notice">
            视频正在后台标签页播放
          </span>
        )}
      </div>
    </div>
  );
}
```

用户点击播放时屏幕保持常亮，暂停或切走标签页时锁定释放。Hook 会在标签页回来后自动重新获取锁——手动实现的话，这又是额外十几行代码。

## 4. 用户切回标签页时发送通知

### 手动实现

假设你的应用在用户切到别的标签页后完成了一项耗时任务，你想发一条浏览器通知提醒他回来。手动实现需要把 Notification API 和焦点检测拼在一起：

```tsx
import { useCallback, useEffect, useRef, useState } from "react";

function useManualNotifyOnReturn() {
  const [focused, setFocused] = useState(true);
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const notify = useCallback(
    (title: string, body: string) => {
      if (focused) return; // 用户已经在看了

      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification(title, { body });
          }
        });
      }
    },
    [focused]
  );

  return { focused, notify };
}
```

这段代码遗漏了一些边界情况：用户拒绝了通知权限怎么办？移动端的 `focus`/`blur` 行为不一致怎么处理？用户回来后旧通知要不要自动清除？

### Hook 方案：`useWindowFocus` + `useWebNotification`

[`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) 和 [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) 组合使用，代码清晰且声明式：

```tsx
import { useWindowFocus, useWebNotification } from "@reactuses/core";

function TaskRunner() {
  const focused = useWindowFocus();
  const { isSupported, show, close } = useWebNotification({
    title: "",
    dir: "auto",
    lang: "zh",
    tag: "task-complete",
  });

  const runTask = async () => {
    await performLongRunningTask();

    // 仅在用户不在当前标签页时发送通知
    if (!focused) {
      show({
        title: "任务完成",
        body: "您的数据导出已就绪，可以下载了。",
      });
    }
  };

  return (
    <div>
      <button onClick={runTask}>开始导出</button>
      {!isSupported && (
        <p className="warning">
          当前浏览器不支持通知功能。
        </p>
      )}
    </div>
  );
}
```

### 完整的通知中心

下面构建一个更贴近真实场景的通知中心：用户离开时将事件排队，回来后汇总通知：

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useWindowFocus, useWebNotification } from "@reactuses/core";

interface AppEvent {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

function NotificationCenter() {
  const focused = useWindowFocus();
  const { isSupported, show } = useWebNotification({
    title: "",
    dir: "auto",
    lang: "zh",
    tag: "app-notification",
  });
  const [missedEvents, setMissedEvents] = useState<AppEvent[]>([]);
  const focusedRef = useRef(focused);

  // 保持 ref 同步以便在回调中使用
  useEffect(() => {
    focusedRef.current = focused;
  }, [focused]);

  // 模拟服务端推送事件（替换为你的 WebSocket/SSE 处理逻辑）
  const onServerEvent = useCallback((event: AppEvent) => {
    if (!focusedRef.current) {
      setMissedEvents((prev) => [...prev, event]);
    }
  }, []);

  // 用户回来时，发送一条汇总通知
  useEffect(() => {
    if (focused && missedEvents.length > 0) {
      if (isSupported) {
        show({
          title: `您离开期间有 ${missedEvents.length} 条更新`,
          body: missedEvents.map((e) => e.title).join("、"),
        });
      }
      // 清空队列——用户已经看到了
      setMissedEvents([]);
    }
  }, [focused, missedEvents, isSupported, show]);

  return (
    <div className="notification-center">
      {missedEvents.length > 0 && (
        <div className="missed-badge">{missedEvents.length}</div>
      )}
    </div>
  );
}
```

这个模式对协同应用（比如在线文档、聊天工具）尤其有价值——用户不在的时候总会发生各种事情。

## 组合拳：感知用户状态的应用外壳

真正的威力在于把这些 Hook 组合到一起。下面是一个统一处理会话管理、后台优化和用户通知的应用外壳：

```tsx
import { useEffect, useCallback } from "react";
import {
  useIdle,
  useDocumentVisibility,
  useWindowFocus,
  useWakeLock,
  useWebNotification,
} from "@reactuses/core";

function AppShell({ children }: { children: React.ReactNode }) {
  const idle = useIdle(5 * 60 * 1000);
  const visibility = useDocumentVisibility();
  const focused = useWindowFocus();
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock();
  const { show: showNotification } = useWebNotification({
    title: "",
    dir: "auto",
    lang: "zh",
    tag: "app-shell",
  });

  // 会话超时
  useEffect(() => {
    if (idle) {
      // 开始登出倒计时或锁定屏幕
    }
  }, [idle]);

  // 后台时暂停高开销操作
  useEffect(() => {
    if (visibility === "hidden") {
      // 暂停动画、轮询、降低 WebSocket 心跳频率
    }
  }, [visibility]);

  // 用户回来时刷新数据
  useEffect(() => {
    if (focused) {
      // 检查待处理的通知，刷新过期数据
    }
  }, [focused]);

  const userState = idle
    ? "idle"
    : visibility === "hidden"
      ? "background"
      : "active";

  return (
    <div className="app-shell" data-user-state={userState}>
      {idle && <SessionTimeoutOverlay />}
      {children}
    </div>
  );
}
```

五个 Hook，各司其职，组合在一起就构成了一个感知用户状态的应用。不用手写事件监听器，不用维护定时器，不用操心 SSR 兼容。

## 使用场景速查

| 场景 | Hook | 检测目标 |
|------|------|----------|
| 会话超时 | [`useIdle`](https://reactuse.com/browser/useIdle/) | 用户无操作达 N 毫秒 |
| 暂停后台任务 | [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) | 标签页隐藏/可见 |
| 检测标签页切换 | [`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) | 窗口获得/失去焦点 |
| 保持屏幕常亮 | [`useWakeLock`](https://reactuse.com/browser/useWakeLock/) | Screen Wake Lock API |
| 浏览器通知 | [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) | Notification API |

## 安装

```bash
npm install @reactuses/core
# 或
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

## 相关 Hook

- [`useIdle`](https://reactuse.com/browser/useIdle/) -- 检测用户空闲，超时时长可配置
- [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) -- 响应式 `document.visibilityState`
- [`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) -- 追踪窗口是否拥有焦点
- [`useWakeLock`](https://reactuse.com/browser/useWakeLock/) -- 请求和管理 Screen Wake Lock API
- [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) -- 声明式浏览器通知
- [`useInterval`](https://reactuse.com/effect/useInterval/) -- 声明式 `setInterval`，支持暂停/恢复
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) -- 绑定 DOM 事件监听器，自动清理
- [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) -- 跨页面刷新持久化会话状态

ReactUse 提供了 100+ 个 React Hook。[去看看完整列表 →](https://reactuse.com)
