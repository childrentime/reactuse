---
title: "不用 WebSocket 函式庫，在 React 中打造即時功能"
description: "學習如何使用 Server-Sent Events、BroadcastChannel API 和 ReactUse 的 Hooks 在 React 中建構即時儀表板、即時推播和網路感知 UI -- 完全不需要 WebSocket 函式庫。"
slug: react-realtime-features
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, realtime, tutorial, useEventSource]
keywords: [react realtime, useEventSource, useFetchEventSource, useNetwork, useOnline, server-sent events react, react online status]
image: /img/og.png
---

# 不用 WebSocket 函式庫，在 React 中打造即時功能

一聽到「即時」，開發者就會想到 WebSocket 函式庫。Socket.IO、Pusher、Ably -- 生態系中有太多選擇了。但很多即時功能根本不需要雙向通訊。股票行情、通知推播、部署日誌、即時比分 -- 這些都是從伺服器到客戶端的單向資料流。對於這類情境，瀏覽器有一個更簡單、更輕量、還能自動重連的內建協定：**Server-Sent Events（SSE）**。

<!-- truncate -->

將 SSE 與用於連線感知的 Network Information API 和用於跨分頁協調的 BroadcastChannel API 結合起來，你就擁有了一套完整的即時工具包 -- 不需要任何 WebSocket 函式庫。本文將先從零開始手動建構每個部分，看看手動實作在哪裡會遇到瓶頸，然後用 [ReactUse](https://reactuse.com) 的 Hooks 替換，只需幾行程式碼就能處理所有邊緣情況。

## 1. 使用 useEventSource 接入 Server-Sent Events

### 什麼是 Server-Sent Events？

Server-Sent Events（SSE）是一個標準協定，允許伺服器透過普通 HTTP 連線向瀏覽器推送更新。與 WebSocket 不同，SSE 是單向的 -- 伺服器發送，客戶端接收。瀏覽器原生的 `EventSource` API 開箱即用，自動處理連線管理、自動重連和事件解析。

```tsx
// 一個基本的 SSE 端點（伺服器端，僅供參考）
// GET /api/notifications
// Content-Type: text/event-stream
//
// data: {"message": "新的部署已啟動"}
// id: 1
//
// data: {"message": "部署完成"}
// id: 2
```

### 手動實作

讓我們在不使用任何函式庫的情況下，在 React 中連接 SSE 端點。

```tsx
import { useState, useEffect, useRef } from "react";

function useManualEventSource(url: string) {
  const [data, setData] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "CONNECTING" | "CONNECTED" | "DISCONNECTED"
  >("DISCONNECTED");
  const [error, setError] = useState<Event | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    const connect = () => {
      setStatus("CONNECTING");
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setStatus("CONNECTED");
        setError(null);
        retriesRef.current = 0;
      };

      es.onmessage = (event) => {
        setData(event.data);
      };

      es.onerror = (err) => {
        setError(err);
        setStatus("DISCONNECTED");
        es.close();
        esRef.current = null;

        // 手動重連邏輯
        retriesRef.current += 1;
        if (retriesRef.current < 5) {
          setTimeout(connect, 1000 * retriesRef.current);
        }
      };
    };

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [url]);

  return { data, status, error };
}
```

大約 45 行程式碼，而且已經存在不少問題：

- **不支援具名事件。** SSE 支援自訂事件類型（如 `event: deploy-status`），但 `onmessage` 只能捕捉未命名的訊息。要支援具名事件，需要對每種事件類型呼叫 `addEventListener`，並在卸載時逐一清理。
- **重連策略過於簡陋。** 程式碼最多重試 5 次，使用線性退避，但無法設定重試次數、延遲時間或失敗回呼。
- **無法手動關閉/重新開啟。** 如果使用者導覽離開又返回，或者你想在分頁隱藏時暫停資料流，還需要更多的狀態追蹤。
- **SSR 會崩潰。** `EventSource` 在伺服器端不存在。

### 使用 useEventSource

ReactUse 的 [`useEventSource`](https://reactuse.com/browser/useeventsource/) Hook 把這些問題全部解決了。

```tsx
import { useEventSource } from "@reactuses/core";

function DeploymentLog() {
  const { data, status, error, event, lastEventId, close, open } =
    useEventSource("/api/deployments/stream", ["deploy-start", "deploy-end"], {
      autoReconnect: {
        retries: 5,
        delay: 2000,
        onFailed: () => console.error("SSE 連線徹底失敗"),
      },
    });

  return (
    <div>
      <div>
        狀態：{status}
        {status === "DISCONNECTED" && (
          <button onClick={open}>重新連線</button>
        )}
        {status === "CONNECTED" && (
          <button onClick={close}>中斷連線</button>
        )}
      </div>

      {error && <div className="error">連線發生錯誤</div>}

      <div className="log-entry">
        <span className="event-type">{event}</span>
        <span className="event-id">#{lastEventId}</span>
        <pre>{data}</pre>
      </div>
    </div>
  );
}
```

看看你免費獲得了什麼：

- **具名事件支援。** 第二個參數傳入事件名稱陣列，Hook 會監聽每一個。`event` 回傳值告訴你觸發的是哪種事件類型。
- **可設定的自動重連。** 設定重試次數、重試間隔，以及所有重試耗盡時的回呼。
- **手動關閉和重新開啟。** 呼叫 `close()` 中斷連線，`open()` 重新連線 -- 非常適合在背景分頁中暫停資料流。
- **SSR 安全。** Hook 會防範伺服器端 `EventSource` 未定義的情況。
- **Last Event ID 追蹤。** `lastEventId` 讓你可以從上次中斷的位置繼續接收（如果伺服器支援的話）。

### 實際範例：即時通知流

```tsx
import { useEventSource } from "@reactuses/core";
import { useState, useEffect } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "error";
}

function NotificationFeed() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { data, status, event } = useEventSource(
    "/api/notifications/stream",
    ["info", "warning", "error"],
    {
      autoReconnect: {
        retries: -1, // 無限重試
        delay: 3000,
      },
    }
  );

  useEffect(() => {
    if (data) {
      try {
        const notification: Notification = {
          ...JSON.parse(data),
          severity: event as Notification["severity"],
        };
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
      } catch {
        // 資料格式錯誤，忽略
      }
    }
  }, [data, event]);

  return (
    <div>
      <h2>
        即時通知
        <span className={`status-dot status-${status.toLowerCase()}`} />
      </h2>
      {notifications.map((n) => (
        <div key={n.id} className={`notification notification-${n.severity}`}>
          <strong>{n.title}</strong>
          <p>{n.body}</p>
        </div>
      ))}
    </div>
  );
}
```

Hook 管理 SSE 的整個生命週期，你的元件只需要關心資料解析和 UI 渲染。

## 2. 使用 useFetchEventSource 接入需要驗證的 SSE 串流

### 原生 EventSource 的限制

原生 `EventSource` API 有一個重大限制：無法設定自訂請求標頭。這意味著不能傳送 `Authorization: Bearer <token>`，不能新增自訂 `X-Request-ID`，也不能發起帶 body 的 `POST` 請求。如果你的 SSE 端點需要驗證，`EventSource` 就不夠用了。

常見的變通方案是把 token 放到查詢參數中（`/api/stream?token=abc`），但這會將憑證洩露到伺服器日誌、瀏覽器歷史記錄和 referrer 標頭中。這是一種安全反模式。

### 手動實作

要在 SSE 風格的連線中傳送自訂請求標頭，你需要使用 `fetch` 搭配可讀取串流 -- 然後自己處理分塊解析、重連和 abort 訊號。

```tsx
import { useState, useEffect, useRef } from "react";

function useManualFetchSSE(url: string, token: string) {
  const [data, setData] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("DISCONNECTED");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("CONNECTING");

    const connect = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.body) throw new Error("No response body");

        setStatus("CONNECTED");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const chunk of lines) {
            const dataLine = chunk
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (dataLine) {
              setData(dataLine.slice(6));
            }
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setStatus("DISCONNECTED");
          // 重連邏輯寫在這裡...
        }
      }
    };

    connect();
    return () => controller.abort();
  }, [url, token]);

  return { data, status };
}
```

已經超過 55 行了，而且還不完整。它不處理具名事件、事件 ID、帶退避的重連，也不支援 POST 請求。手動解析 SSE 文字協定容易出錯。

### 使用 useFetchEventSource

ReactUse 的 [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) Hook 封裝了 [@microsoft/fetch-event-source](https://github.com/Azure/fetch-event-source) 函式庫，提供了 React 友善的 API。它支援自訂請求標頭、POST 請求體，以及你需要的所有重連邏輯。

```tsx
import { useFetchEventSource } from "@reactuses/core";

function AuthenticatedStream() {
  const { data, status, event, error, close, open } = useFetchEventSource(
    "/api/private/stream",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "X-Request-ID": crypto.randomUUID(),
      },
      body: JSON.stringify({
        channels: ["deployments", "alerts"],
      }),
      autoReconnect: {
        retries: 10,
        delay: 2000,
        onFailed: () => {
          // Token 可能已過期 -- 重新導向到登入頁
          window.location.href = "/login";
        },
      },
      onOpen: () => console.log("資料流已連線"),
      onError: (err) => {
        console.error("資料流錯誤：", err);
        return 5000; // 5 秒後重試
      },
    }
  );

  return (
    <div>
      <div>連線狀態：{status}</div>
      {error && <div className="error">{error.message}</div>}
      <pre>{data}</pre>
    </div>
  );
}
```

兩個 Hook 的核心差異：

| 特性 | useEventSource | useFetchEventSource |
|---|---|---|
| 自訂請求標頭 | 不支援 | 支援 |
| POST 請求 | 不支援 | 支援 |
| 請求體 | 不支援 | 支援 |
| 底層技術 | 原生 `EventSource` | `fetch` API |
| 自動重連 | 支援 | 支援 |
| 具名事件 | 支援（透過陣列） | 支援（透過 `event` 欄位） |

當端點是公開的或使用 cookie 驗證時，用 `useEventSource`。當你需要 token 驗證、自訂請求標頭或 POST 請求時，用 `useFetchEventSource`。

### 實際範例：AI 聊天串流回應

SSE 是串流 AI 回應的標準協定（OpenAI、Anthropic 等都在使用）。以下是如何用驗證建構串流聊天 UI。

```tsx
import { useFetchEventSource } from "@reactuses/core";
import { useState, useEffect, useCallback } from "react";

function AIChatStream() {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [streamedResponse, setStreamedResponse] = useState("");

  const { data, status, open, close } = useFetchEventSource(
    "/api/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        messages,
        stream: true,
      }),
      immediate: false, // 不在掛載時連線
      onOpen: () => setStreamedResponse(""),
    }
  );

  // 累積串流傳輸的 token
  useEffect(() => {
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          setStreamedResponse((prev) => prev + token);
        }
      } catch {
        // 忽略 [DONE] 或格式錯誤的資料塊
      }
    }
  }, [data]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    open(); // 啟動 SSE 資料流
  }, [input, open]);

  return (
    <div className="chat">
      {messages.map((msg, i) => (
        <div key={i} className={`message message-${msg.role}`}>
          {msg.content}
        </div>
      ))}
      {streamedResponse && (
        <div className="message message-assistant">{streamedResponse}</div>
      )}
      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="輸入訊息..."
        />
        <button onClick={sendMessage} disabled={status === "CONNECTING"}>
          傳送
        </button>
      </div>
    </div>
  );
}
```

這裡 `immediate: false` 選項至關重要 -- 我們不希望在元件掛載時就開啟連線，而是在使用者傳送訊息時明確呼叫 `open()`。

## 3. 使用 useNetwork 和 useOnline 偵測網路狀態

如果使用者離線了，即時功能就毫無用處。更糟糕的是，它們會靜默失敗 -- SSE 連線中斷，fetch 請求懸掛，UI 顯示過時資料，卻沒有任何提示。好的即時 UI 應該具備網路感知能力。

### 手動實作

```tsx
import { useState, useEffect } from "react";

function useManualNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<string | undefined>();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Network Information API（並非所有瀏覽器都支援）
    const conn = (navigator as any).connection;
    if (conn) {
      const handleChange = () => {
        setConnectionType(conn.effectiveType);
      };
      conn.addEventListener("change", handleChange);
      handleChange();

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        conn.removeEventListener("change", handleChange);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}
```

大約 35 行程式碼只取得了兩條資訊，而且不追蹤下行速度、往返時間、數據節省模式或上次狀態變化的時間戳記。Network Information API 還使用了帶廠商前綴的屬性（`mozConnection`、`webkitConnection`），這段程式碼也沒有處理。

### 使用 useNetwork

[`useNetwork`](https://reactuse.com/browser/usenetwork/) Hook 回傳完整的網路資訊。

```tsx
import { useNetwork } from "@reactuses/core";

function NetworkDebugPanel() {
  const {
    online,
    previous,
    since,
    downlink,
    effectiveType,
    rtt,
    saveData,
    type,
  } = useNetwork();

  return (
    <div className="network-panel">
      <div>
        狀態：{online ? "線上" : "離線"}
        {previous !== undefined && previous !== online && (
          <span>
            {" "}
            （先前{previous ? "線上" : "離線"}，變更於{" "}
            {since?.toLocaleTimeString()}）
          </span>
        )}
      </div>
      <div>連線類型：{type ?? "未知"}</div>
      <div>有效類型：{effectiveType ?? "未知"}</div>
      <div>下行速度：{downlink ? `${downlink} Mbps` : "未知"}</div>
      <div>往返時間：{rtt ? `${rtt}ms` : "未知"}</div>
      <div>數據節省：{saveData ? "已啟用" : "已關閉"}</div>
    </div>
  );
}
```

Hook 處理了所有的廠商前綴、事件監聽器和 SSR 安全問題。`previous` 和 `since` 欄位特別有用 -- 它們讓你可以顯示「你在 30 秒前離線了」，而不僅僅是「離線」。

### 使用 useOnline

如果你只需要布林值，[`useOnline`](https://reactuse.com/browser/useonline/) 更加簡潔。它是 `useNetwork` 的輕量封裝，只回傳 `online` 值。

```tsx
import { useOnline } from "@reactuses/core";

function OfflineBanner() {
  const isOnline = useOnline();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      你目前處於離線狀態，即時更新已暫停。
    </div>
  );
}
```

### 實際範例：自適應品質推播

`useNetwork` 回傳的網路資訊讓你可以根據使用者的連線品質調整應用程式行為。

```tsx
import { useNetwork } from "@reactuses/core";
import { useMemo } from "react";

function useAdaptivePolling(baseInterval: number) {
  const { online, effectiveType, saveData } = useNetwork();

  const interval = useMemo(() => {
    if (!online) return null; // 離線時停止輪詢
    if (saveData) return baseInterval * 4; // 尊重數據節省設定
    switch (effectiveType) {
      case "slow-2g":
      case "2g":
        return baseInterval * 3;
      case "3g":
        return baseInterval * 2;
      case "4g":
      default:
        return baseInterval;
    }
  }, [online, effectiveType, saveData, baseInterval]);

  return interval;
}

function LiveScoreboard() {
  const pollingInterval = useAdaptivePolling(5000);
  const { online, effectiveType } = useNetwork();

  return (
    <div>
      {!online && (
        <div className="banner">離線中 -- 顯示快取的比分</div>
      )}
      {effectiveType === "slow-2g" && (
        <div className="banner">慢速連線 -- 更新頻率已降低</div>
      )}
      {/* 使用 pollingInterval 的記分板內容 */}
    </div>
  );
}
```

在快速 4G 連線上，記分板每 5 秒更新一次。在慢速 2G 連線上，每 15 秒更新一次。離線時完全停止，顯示快取資料。使用者獲得的是其連線條件所能支援的最佳體驗。

## 4. 使用 useBroadcastChannel 實現跨分頁通訊

即時資料通常需要在瀏覽器分頁之間共享。如果使用者在三個分頁中開啟了你的儀表板，當一則新通知透過 SSE 到達時，三個分頁都應該顯示它 -- 但只有一個分頁應該維護 SSE 連線。BroadcastChannel API 讓這成為可能。

### 手動實作

```tsx
import { useState, useEffect, useRef, useCallback } from "react";

function useManualBroadcastChannel<T>(channelName: string) {
  const [data, setData] = useState<T | undefined>();
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent<T>) => {
      setData(event.data);
    };

    const handleError = (event: MessageEvent) => {
      console.error("BroadcastChannel 錯誤：", event);
    };

    channel.addEventListener("message", handleMessage);
    channel.addEventListener("messageerror", handleError);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.removeEventListener("messageerror", handleError);
      channel.close();
    };
  }, [channelName]);

  const post = useCallback((message: T) => {
    channelRef.current?.postMessage(message);
  }, []);

  return { data, post };
}
```

這對簡單情境夠用了，但它不追蹤 BroadcastChannel 是否被支援、頻道是否已關閉、錯誤狀態或用於去重的時間戳記。

### 使用 useBroadcastChannel

[`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) Hook 提供了完整的、型別安全的封裝。

```tsx
import { useBroadcastChannel } from "@reactuses/core";

interface DashboardMessage {
  type: "NEW_DATA" | "USER_ACTION" | "TAB_CLOSING";
  payload?: unknown;
  sourceTab: string;
}

function DashboardSync() {
  const { data, post, isSupported, isClosed, error } = useBroadcastChannel<
    DashboardMessage,
    DashboardMessage
  >({ name: "dashboard-sync" });

  const broadcast = (type: DashboardMessage["type"], payload?: unknown) => {
    post({
      type,
      payload,
      sourceTab: sessionStorage.getItem("tab-id") || "unknown",
    });
  };

  useEffect(() => {
    if (data?.type === "NEW_DATA") {
      // 用來自另一個分頁的資料更新本地狀態
      console.log("收到來自分頁的資料：", data.sourceTab, data.payload);
    }
  }, [data]);

  if (!isSupported) {
    return <div>目前瀏覽器不支援跨分頁同步。</div>;
  }

  return (
    <div>
      <button onClick={() => broadcast("NEW_DATA", { count: 42 })}>
        與其他分頁共享資料
      </button>
      {error && <div className="error">同步出錯</div>}
      {isClosed && <div className="warning">頻道已關閉</div>}
    </div>
  );
}
```

這個 Hook 提供了：

- **`isSupported`** -- 在渲染依賴同步的 UI 前檢查 BroadcastChannel 是否可用。
- **`isClosed`** -- 知道頻道何時被關閉（由你或瀏覽器關閉）。
- **`error`** -- 處理訊息序列化錯誤。
- **`timeStamp`** -- 當相同資料被多次接收時進行去重。
- **型別安全** -- 泛型參數 `<D, P>` 分別對應接收資料型別和傳送資料型別。

## 5. 綜合實戰：即時監控儀表板

讓我們將這五個 Hook 組合成一個生產等級的即時儀表板。這個儀表板：

- 透過 SSE 接收即時指標（帶驗證）
- 偵測網路狀態並相應調整行為
- 在分頁之間共享資料，只讓一個分頁維護 SSE 連線
- 向使用者展示連線健康狀況

```tsx
import {
  useFetchEventSource,
  useNetwork,
  useOnline,
  useBroadcastChannel,
  useEventSource,
} from "@reactuses/core";
import { useState, useEffect, useCallback, useRef } from "react";

// --- 型別定義 ---

interface MetricEvent {
  timestamp: number;
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
}

interface TabMessage {
  type: "METRIC_UPDATE" | "CLAIM_LEADER" | "RELEASE_LEADER" | "HEARTBEAT";
  payload?: MetricEvent;
  tabId: string;
}

// --- 領導者選舉 Hook ---

function useTabLeader(channelName: string) {
  const tabId = useRef(crypto.randomUUID()).current;
  const [isLeader, setIsLeader] = useState(false);
  const { data, post } = useBroadcastChannel<TabMessage, TabMessage>({
    name: channelName,
  });

  useEffect(() => {
    // 掛載時，短暫延遲後嘗試取得領導權
    const timer = setTimeout(() => {
      post({ type: "CLAIM_LEADER", tabId });
      setIsLeader(true);
    }, Math.random() * 200);

    return () => {
      clearTimeout(timer);
      post({ type: "RELEASE_LEADER", tabId });
    };
  }, [post, tabId]);

  useEffect(() => {
    if (data?.type === "CLAIM_LEADER" && data.tabId !== tabId) {
      if (data.tabId > tabId) {
        setIsLeader(false);
      }
    }
    if (data?.type === "RELEASE_LEADER") {
      // 另一個分頁釋放了 -- 嘗試取得領導權
      setTimeout(() => {
        post({ type: "CLAIM_LEADER", tabId });
        setIsLeader(true);
      }, Math.random() * 100);
    }
  }, [data, tabId, post]);

  return { isLeader, tabId };
}

// --- 網路感知 SSE Hook ---

function useMetricsStream(enabled: boolean) {
  const { online, effectiveType } = useNetwork();

  const { data, status, error, close, open } = useFetchEventSource(
    "/api/metrics/stream",
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      immediate: false,
      autoReconnect: {
        retries: -1,
        delay: effectiveType === "4g" ? 2000 : 5000,
        onFailed: () => console.error("指標資料流徹底失敗"),
      },
    }
  );

  // 根據 enabled 旗標和線上狀態連線/中斷
  useEffect(() => {
    if (enabled && online) {
      open();
    } else {
      close();
    }
  }, [enabled, online, open, close]);

  return { data, status, error };
}

// --- 主儀表板元件 ---

function RealtimeDashboard() {
  const [metrics, setMetrics] = useState<MetricEvent[]>([]);
  const isOnline = useOnline();
  const { online, effectiveType, rtt } = useNetwork();

  // 領導者選舉 -- 只有領導者分頁開啟 SSE 連線
  const { isLeader, tabId } = useTabLeader("metrics-leader");

  // SSE 資料流 -- 只在目前分頁是領導者時啟動
  const { data: sseData, status: sseStatus } = useMetricsStream(isLeader);

  // 跨分頁資料共享
  const { data: tabData, post: broadcastToTabs } = useBroadcastChannel<
    TabMessage,
    TabMessage
  >({ name: "metrics-data" });

  // 當領導者收到 SSE 資料時，廣播給其他分頁
  useEffect(() => {
    if (isLeader && sseData) {
      try {
        const metric: MetricEvent = JSON.parse(sseData);
        setMetrics((prev) => [...prev, metric].slice(-100));
        broadcastToTabs({
          type: "METRIC_UPDATE",
          payload: metric,
          tabId,
        });
      } catch {
        // 資料格式錯誤
      }
    }
  }, [isLeader, sseData, broadcastToTabs, tabId]);

  // 當非領導者分頁收到廣播資料時，更新本地狀態
  useEffect(() => {
    if (!isLeader && tabData?.type === "METRIC_UPDATE" && tabData.payload) {
      setMetrics((prev) => [...prev, tabData.payload!].slice(-100));
    }
  }, [isLeader, tabData]);

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div className="dashboard">
      {/* 連線狀態列 */}
      <header className="status-bar">
        <div className="status-indicators">
          <span className={`dot ${isOnline ? "green" : "red"}`} />
          <span>
            {isOnline ? "線上" : "離線"}
            {effectiveType && ` (${effectiveType})`}
            {rtt && ` -- ${rtt}ms 往返`}
          </span>
        </div>
        <div className="tab-info">
          {isLeader ? "領導者分頁（SSE 活躍）" : "追隨者分頁（透過廣播）"}
          <span className={`dot ${sseStatus === "CONNECTED" ? "green" : "yellow"}`} />
        </div>
      </header>

      {/* 離線提示 */}
      {!isOnline && (
        <div className="offline-banner">
          你目前處於離線狀態。正在顯示最近 {metrics.length} 筆快取指標。
          連線恢復後資料將自動繼續更新。
        </div>
      )}

      {/* 指標網格 */}
      {latestMetric && (
        <div className="metrics-grid">
          <MetricCard
            label="CPU 使用率"
            value={`${latestMetric.cpu.toFixed(1)}%`}
            status={latestMetric.cpu > 80 ? "danger" : "normal"}
          />
          <MetricCard
            label="記憶體"
            value={`${latestMetric.memory.toFixed(1)}%`}
            status={latestMetric.memory > 90 ? "danger" : "normal"}
          />
          <MetricCard
            label="請求數/秒"
            value={latestMetric.requests.toLocaleString()}
            status="normal"
          />
          <MetricCard
            label="錯誤數/秒"
            value={latestMetric.errors.toLocaleString()}
            status={latestMetric.errors > 10 ? "danger" : "normal"}
          />
        </div>
      )}

      {/* 迷你圖表（最近 100 個資料點） */}
      <div className="chart-section">
        <h3>CPU 變化趨勢</h3>
        <div className="sparkline">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="bar"
              style={{
                height: `${m.cpu}%`,
                backgroundColor: m.cpu > 80 ? "#ef4444" : "#22c55e",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "normal" | "danger";
}) {
  return (
    <div className={`metric-card metric-${status}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
```

每個 Hook 在這個儀表板中的貢獻：

- **`useFetchEventSource`** -- 連接帶驗證的指標 SSE 端點，自動重連。
- **`useEventSource`** -- 如果端點不需要自訂請求標頭，可以替換使用（對元件零 API 變更）。
- **`useNetwork`** -- 為狀態列提供連線品質資料（`effectiveType`、`rtt`），並實現自適應重連延遲。
- **`useOnline`** -- 驅動離線提示，在網路中斷時暫停 SSE 連線。
- **`useBroadcastChannel`** -- 實現領導者選舉和跨分頁資料共享，只讓一個分頁維護 SSE 連線，而所有分頁都顯示即時資料。

最終成果：

1. 所有分頁共享一個 SSE 連線（節省伺服器資源）
2. 根據連線品質自適應退避重連
3. 向使用者展示即時網路狀態
4. 離線時優雅降級
5. 所有開啟的分頁之間即時共享資料

## 選擇哪個 Hook

| 情境 | Hook | 原因 |
|---|---|---|
| 公開 SSE 端點 | `useEventSource` | 簡單，原生 EventSource |
| 帶驗證標頭的 SSE | `useFetchEventSource` | 透過 fetch 支援自訂請求標頭 |
| 帶 POST 請求體的 SSE | `useFetchEventSource` | 支援請求體 |
| 簡單的線上/離線偵測 | `useOnline` | 回傳單一布林值 |
| 詳細的連線資訊 | `useNetwork` | 下行速度、往返時間、有效類型 |
| 跨分頁訊息 | `useBroadcastChannel` | 記憶體通訊，無持久化 |
| 跨分頁 + 持久化 | `useBroadcastChannel` + `useLocalStorage` | 兩全其美 |

## 安裝

```bash
npm install @reactuses/core
```

或使用你偏好的套件管理器：

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

## 相關 Hooks

- [`useEventSource`](https://reactuse.com/browser/useeventsource/) -- 響應式 Server-Sent Events，支援具名事件和自動重連
- [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) -- 基於 fetch 的 SSE，支援自訂請求標頭、POST 請求和驗證
- [`useNetwork`](https://reactuse.com/browser/usenetwork/) -- 詳細的網路狀態，包括連線類型、下行速度和往返時間
- [`useOnline`](https://reactuse.com/browser/useonline/) -- 簡單的線上/離線布林值偵測
- [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) -- 透過 BroadcastChannel API 實現型別安全的跨分頁訊息傳遞
- [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) -- 追蹤目前分頁是否可見
- [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) -- 具有自動跨分頁同步的持久化狀態

ReactUse 提供了 100+ 個 React Hooks。[探索全部 →](https://reactuse.com)
