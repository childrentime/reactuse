---
title: "React 閒置偵測與工作階段管理實戰"
description: "學習如何在 React 中偵測使用者閒置狀態、管理工作階段逾時、處理分頁可見性，使用 ReactUse 提供的 Hook 輕鬆實現。"
slug: react-idle-detection-session
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, idle-detection, session-management, tutorial]
keywords: [react idle detection, useIdle, session timeout react, react tab visibility, useWakeLock, useDocumentVisibility, react session management]
image: /img/og.png
---

# React 閒置偵測與工作階段管理實戰

凡是涉及敏感資料的應用程式——銀行後台、醫療資訊系統、營運管理面板——都繞不開一個看似簡單的問題：*使用者還在嗎？* 如果他離開電腦去泡了杯茶，螢幕上還掛著一份病歷，你應該鎖定工作階段。如果他在等待資料匯出時切到了別的分頁，你可以暫停輪詢來節省頻寬。如果他正在看教育訓練影片，螢幕不應該自動關閉。這些場景本質上是同一個問題：感知使用者是否在場，並做出相應處理。

<!-- truncate -->

本文將從零開始建構四個實用模式，先展示手動實作的痛點，再用 [ReactUse](https://reactuse.com) 的 Hook 一一替換。讀完之後，你將掌握工作階段逾時提醒、背景分頁暫停、螢幕常亮控制，以及使用者回歸通知這四種正式環境級方案。

## 1. 工作階段逾時警告：閒置偵測

### 手動實作

偵測閒置意味著你要監聽所有能表明使用者活躍的訊號——滑鼠移動、鍵盤輸入、觸控事件、捲動——然後在任一事件觸發時重設計時器。一個簡單的實作大概長這樣：

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
    resetTimer(); // 啟動計時器

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return idle;
}
```

這段程式碼在 demo 裡能跑，但放到正式環境就會出問題：你漏掉了 `mousedown`、`pointerdown`、`wheel` 和 `visibilitychange`；每次滑鼠移動都會呼叫 `setIdle(false)`，即使當前已經不是閒置狀態，白白觸發重新渲染；想區分「閒置 5 分鐘」和「閒置 30 秒」就得再加一組計時器；逾時時長也沒辦法在執行時動態修改。

### Hook 方案：`useIdle`

[`useIdle`](https://reactuse.com/browser/useIdle/) 一行搞定：

```tsx
import { useIdle } from "@reactuses/core";

function SessionManager() {
  const idle = useIdle(5 * 60 * 1000); // 5 分鐘

  return idle ? <SessionWarningDialog /> : null;
}
```

它在內部監聽了完整的 DOM 事件集合，自帶防抖，回傳一個穩定的布林值。不用自己維護定時器，不用擔心遺漏事件類型。

### 完整的工作階段逾時對話框

把 `useIdle` 和倒數計時結合起來，建構一個實際可用的工作階段逾時警告：

```tsx
import { useCallback, useEffect, useState } from "react";
import { useIdle } from "@reactuses/core";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 分鐘
const WARNING_DURATION = 60; // 60 秒倒數

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
        <h2>還在嗎？</h2>
        <p>
          由於長時間未操作，您的工作階段將在 <strong>{countdown}</strong> 秒後過期。
        </p>
        <p>移動滑鼠或按任意鍵即可保持登入狀態。</p>
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

因為 `useIdle` 在使用者動滑鼠的瞬間就會回傳 `false`，對話框會自動消失——甚至不需要「保持登入」按鈕（當然你也可以加一個）。使用者重新活躍時，倒數也會乾淨地重設。

## 2. 分頁切換時暫停背景工作

### 手動實作

很多應用程式會定時輪詢 API。當使用者切到別的分頁時，這些請求純屬浪費。手動偵測分頁可見性需要用到 Page Visibility API：

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

程式碼不長，但你得記得處理 SSR 的情況，而且一旦需要把可見性和視窗焦點等其他訊號組合起來用，條件判斷就會散落在元件各處。

### Hook 方案：`useDocumentVisibility`

[`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) 封裝了 Page Visibility API，並內建了 SSR 安全檢查：

```tsx
import { useDocumentVisibility } from "@reactuses/core";

function PollingDashboard() {
  const visibility = useDocumentVisibility();

  useEffect(() => {
    if (visibility === "hidden") return;

    const interval = setInterval(() => {
      fetch("/api/metrics").then(/* 更新狀態 */);
    }, 10_000);

    return () => clearInterval(interval);
  }, [visibility]);

  return <Dashboard />;
}
```

使用者切走分頁時 `visibility` 變為 `"hidden"`，effect 清理函式執行，輪詢停止。使用者切回來時 effect 重新執行，輪詢恢復。零浪費請求。

### 更智慧的資料暫停模式

更穩健的做法是把可見性和資料新鮮度指標結合起來：

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
      // 背景停留超過 30 秒則標記資料過期
      const staleTimer = setTimeout(() => setStale(true), 30_000);
      return () => clearTimeout(staleTimer);
    }

    // 分頁可見——如果資料過期則立即重新整理
    if (stale || Date.now() - lastFetchRef.current > 30_000) {
      fetchData();
    }

    // 恢復正常輪詢
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [visibility, stale, fetchData]);

  return (
    <div>
      {stale && <div className="stale-banner">資料可能已過時</div>}
      {data && <MetricsGrid metrics={data.metrics} />}
    </div>
  );
}
```

這個模式的好處是：背景不做無用請求、使用者切回來後立即重新整理、長時間離開還會顯示過期提示。

## 3. 保持螢幕常亮

### 手動實作

Screen Wake Lock API 可以阻止裝置螢幕變暗或鎖定。影片播放器、簡報軟體、食譜檢視器等場景都離不開它——使用者在看螢幕但不觸碰裝置的時候，你不希望螢幕自己關掉：

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
      console.error("Wake Lock 請求失敗:", err);
    }
  }, []);

  const release = useCallback(async () => {
    await wakeLockRef.current?.release();
    wakeLockRef.current = null;
    setIsActive(false);
  }, []);

  // 分頁重新可見時需要重新取得鎖
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

Wake Lock API 有個坑：瀏覽器會在分頁隱藏時自動釋放鎖。你必須在分頁重新可見時重新取得，這正是正式環境中最容易遺漏的邊界情況。

### Hook 方案：`useWakeLock`

[`useWakeLock`](https://reactuse.com/browser/useWakeLock/) 自動處理重新取得、錯誤處理和清理工作：

```tsx
import { useWakeLock } from "@reactuses/core";

function PresentationMode() {
  const { isActive, request, release } = useWakeLock();

  return (
    <button onClick={() => (isActive ? release() : request("screen"))}>
      {isActive ? "螢幕將保持常亮" : "允許螢幕休眠"}
    </button>
  );
}
```

### 影片應用的「保持常亮」開關

下面是一個影片或簡報應用的完整元件：

```tsx
import { useWakeLock, useDocumentVisibility } from "@reactuses/core";
import { useEffect } from "react";

function VideoPlayer({ src }: { src: string }) {
  const { isActive, request, release } = useWakeLock();
  const visibility = useDocumentVisibility();

  // 播放時自動請求螢幕常亮
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
          {isActive ? "螢幕已鎖定常亮" : "螢幕可能自動休眠"}
        </span>
        {visibility === "hidden" && (
          <span className="background-notice">
            影片正在背景分頁播放
          </span>
        )}
      </div>
    </div>
  );
}
```

使用者點擊播放時螢幕保持常亮，暫停或切走分頁時鎖定釋放。Hook 會在分頁回來後自動重新取得鎖——手動實作的話，這又是額外十幾行程式碼。

## 4. 使用者切回分頁時發送通知

### 手動實作

假設你的應用程式在使用者切到別的分頁後完成了一項耗時任務，你想發一條瀏覽器通知提醒他回來。手動實作需要把 Notification API 和焦點偵測拼在一起：

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
      if (focused) return; // 使用者已經在看了

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

這段程式碼遺漏了一些邊界情況：使用者拒絕了通知權限怎麼辦？行動裝置的 `focus`/`blur` 行為不一致怎麼處理？使用者回來後舊通知要不要自動清除？

### Hook 方案：`useWindowFocus` + `useWebNotification`

[`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) 和 [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) 組合使用，程式碼清晰且宣告式：

```tsx
import { useWindowFocus, useWebNotification } from "@reactuses/core";

function TaskRunner() {
  const focused = useWindowFocus();
  const { isSupported, show, close } = useWebNotification({
    title: "",
    dir: "auto",
    lang: "zh-Hant",
    tag: "task-complete",
  });

  const runTask = async () => {
    await performLongRunningTask();

    // 僅在使用者不在當前分頁時發送通知
    if (!focused) {
      show({
        title: "任務完成",
        body: "您的資料匯出已就緒，可以下載了。",
      });
    }
  };

  return (
    <div>
      <button onClick={runTask}>開始匯出</button>
      {!isSupported && (
        <p className="warning">
          目前瀏覽器不支援通知功能。
        </p>
      )}
    </div>
  );
}
```

### 完整的通知中心

下面建構一個更貼近真實場景的通知中心：使用者離開時將事件排隊，回來後彙總通知：

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
    lang: "zh-Hant",
    tag: "app-notification",
  });
  const [missedEvents, setMissedEvents] = useState<AppEvent[]>([]);
  const focusedRef = useRef(focused);

  // 保持 ref 同步以便在回呼中使用
  useEffect(() => {
    focusedRef.current = focused;
  }, [focused]);

  // 模擬伺服器推送事件（替換為你的 WebSocket/SSE 處理邏輯）
  const onServerEvent = useCallback((event: AppEvent) => {
    if (!focusedRef.current) {
      setMissedEvents((prev) => [...prev, event]);
    }
  }, []);

  // 使用者回來時，發送一條彙總通知
  useEffect(() => {
    if (focused && missedEvents.length > 0) {
      if (isSupported) {
        show({
          title: `您離開期間有 ${missedEvents.length} 則更新`,
          body: missedEvents.map((e) => e.title).join("、"),
        });
      }
      // 清空佇列——使用者已經看到了
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

這個模式對協作應用（比如線上文件、聊天工具）尤其有價值——使用者不在的時候總會發生各種事情。

## 組合技：感知使用者狀態的應用外殼

真正的威力在於把這些 Hook 組合到一起。下面是一個統一處理工作階段管理、背景最佳化和使用者通知的應用外殼：

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
    lang: "zh-Hant",
    tag: "app-shell",
  });

  // 工作階段逾時
  useEffect(() => {
    if (idle) {
      // 開始登出倒數或鎖定畫面
    }
  }, [idle]);

  // 背景時暫停高開銷操作
  useEffect(() => {
    if (visibility === "hidden") {
      // 暫停動畫、輪詢、降低 WebSocket 心跳頻率
    }
  }, [visibility]);

  // 使用者回來時重新整理資料
  useEffect(() => {
    if (focused) {
      // 檢查待處理的通知，重新整理過期資料
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

五個 Hook，各司其職，組合在一起就構成了一個感知使用者狀態的應用程式。不用手寫事件監聽器，不用維護計時器，不用操心 SSR 相容。

## 使用場景速查

| 場景 | Hook | 偵測目標 |
|------|------|----------|
| 工作階段逾時 | [`useIdle`](https://reactuse.com/browser/useIdle/) | 使用者無操作達 N 毫秒 |
| 暫停背景工作 | [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) | 分頁隱藏/可見 |
| 偵測分頁切換 | [`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) | 視窗取得/失去焦點 |
| 保持螢幕常亮 | [`useWakeLock`](https://reactuse.com/browser/useWakeLock/) | Screen Wake Lock API |
| 瀏覽器通知 | [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) | Notification API |

## 安裝

```bash
npm install @reactuses/core
# 或
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

## 相關 Hook

- [`useIdle`](https://reactuse.com/browser/useIdle/) -- 偵測使用者閒置，逾時時長可設定
- [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) -- 響應式 `document.visibilityState`
- [`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) -- 追蹤視窗是否擁有焦點
- [`useWakeLock`](https://reactuse.com/browser/useWakeLock/) -- 請求和管理 Screen Wake Lock API
- [`useWebNotification`](https://reactuse.com/browser/useWebNotification/) -- 宣告式瀏覽器通知
- [`useInterval`](https://reactuse.com/effect/useInterval/) -- 宣告式 `setInterval`，支援暫停/恢復
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) -- 繫結 DOM 事件監聽器，自動清理
- [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) -- 跨頁面重新整理持久化工作階段狀態

ReactUse 提供了 100+ 個 React Hook。[去看看完整列表 →](https://reactuse.com)
