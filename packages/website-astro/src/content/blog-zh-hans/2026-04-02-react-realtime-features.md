---
title: "不用 WebSocket 库，在 React 中构建实时功能"
description: "学习如何使用 Server-Sent Events、BroadcastChannel API 和 ReactUse 的 Hooks 在 React 中构建实时仪表盘、实时推送和网络感知 UI -- 无需任何 WebSocket 库。"
slug: react-realtime-features
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, realtime, tutorial, useEventSource]
keywords: [react realtime, useEventSource, useFetchEventSource, useNetwork, useOnline, server-sent events react, react online status]
image: /img/og.png
---

# 不用 WebSocket 库，在 React 中构建实时功能

一提到"实时"，开发者就会想到 WebSocket 库。Socket.IO、Pusher、Ably -- 生态中有太多选择了。但很多实时功能根本不需要双向通信。股票行情、通知推送、部署日志、实时比分 -- 这些都是服务器到客户端的单向数据流。对于这类场景，浏览器有一个更简单、更轻量、还能自动重连的内置协议：**Server-Sent Events（SSE）**。

<!-- truncate -->

将 SSE 与用于连接感知的 Network Information API 和用于跨标签页协调的 BroadcastChannel API 结合起来，你就拥有了一套完整的实时工具包 -- 不需要任何 WebSocket 库。本文将先从零开始手动构建每个部分，看看手动实现在哪里会遇到瓶颈，然后用 [ReactUse](https://reactuse.com) 的 Hooks 替换，只需几行代码就能处理所有边缘情况。

## 1. 使用 useEventSource 接入 Server-Sent Events

### 什么是 Server-Sent Events？

Server-Sent Events（SSE）是一个标准协议，允许服务器通过普通 HTTP 连接向浏览器推送更新。与 WebSocket 不同，SSE 是单向的 -- 服务器发送，客户端接收。浏览器原生的 `EventSource` API 开箱即用，自动处理连接管理、自动重连和事件解析。

```tsx
// 一个基本的 SSE 端点（服务端，仅供参考）
// GET /api/notifications
// Content-Type: text/event-stream
//
// data: {"message": "新的部署已启动"}
// id: 1
//
// data: {"message": "部署完成"}
// id: 2
```

### 手动实现

让我们在不使用任何库的情况下，在 React 中连接 SSE 端点。

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

        // 手动重连逻辑
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

大约 45 行代码，而且已经存在不少问题：

- **不支持命名事件。** SSE 支持自定义事件类型（如 `event: deploy-status`），但 `onmessage` 只能捕获未命名的消息。要支持命名事件，需要对每种事件类型调用 `addEventListener`，并在卸载时逐一清理。
- **重连策略过于简陋。** 代码最多重试 5 次，使用线性退避，但无法配置重试次数、延迟时间或失败回调。
- **无法手动关闭/重新打开。** 如果用户导航离开又返回，或者你想在标签页隐藏时暂停数据流，还需要更多的状态跟踪。
- **SSR 会崩溃。** `EventSource` 在服务端不存在。

### 使用 useEventSource

ReactUse 的 [`useEventSource`](https://reactuse.com/browser/useEventSource/) Hook 把这些问题全部解决了。

```tsx
import { useEventSource } from "@reactuses/core";

function DeploymentLog() {
  const { data, status, error, event, lastEventId, close, open } =
    useEventSource("/api/deployments/stream", ["deploy-start", "deploy-end"], {
      autoReconnect: {
        retries: 5,
        delay: 2000,
        onFailed: () => console.error("SSE 连接彻底失败"),
      },
    });

  return (
    <div>
      <div>
        状态：{status}
        {status === "DISCONNECTED" && (
          <button onClick={open}>重新连接</button>
        )}
        {status === "CONNECTED" && (
          <button onClick={close}>断开连接</button>
        )}
      </div>

      {error && <div className="error">连接发生错误</div>}

      <div className="log-entry">
        <span className="event-type">{event}</span>
        <span className="event-id">#{lastEventId}</span>
        <pre>{data}</pre>
      </div>
    </div>
  );
}
```

看看你免费获得了什么：

- **命名事件支持。** 第二个参数传入事件名数组，Hook 会监听每一个。`event` 返回值告诉你触发的是哪种事件类型。
- **可配置的自动重连。** 设置重试次数、重试间隔，以及所有重试耗尽时的回调。
- **手动关闭和重新打开。** 调用 `close()` 断开连接，`open()` 重新连接 -- 非常适合在后台标签页中暂停数据流。
- **SSR 安全。** Hook 会防范服务端 `EventSource` 未定义的情况。
- **Last Event ID 追踪。** `lastEventId` 让你可以从上次断开的位置继续接收（如果服务器支持的话）。

### 实际示例：实时通知流

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
        retries: -1, // 无限重试
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
        // 数据格式错误，忽略
      }
    }
  }, [data, event]);

  return (
    <div>
      <h2>
        实时通知
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

Hook 管理 SSE 的整个生命周期，你的组件只需要关心数据解析和 UI 渲染。

## 2. 使用 useFetchEventSource 接入需要认证的 SSE 流

### 原生 EventSource 的局限

原生 `EventSource` API 有一个重大限制：无法设置自定义请求头。这意味着不能发送 `Authorization: Bearer <token>`，不能添加自定义 `X-Request-ID`，也不能发起带 body 的 `POST` 请求。如果你的 SSE 端点需要认证，`EventSource` 就不够用了。

常见的变通方案是把 token 放到查询参数中（`/api/stream?token=abc`），但这会将凭证泄露到服务器日志、浏览器历史记录和 referrer 头中。这是一种安全反模式。

### 手动实现

要在 SSE 风格的连接中发送自定义请求头，你需要使用 `fetch` 配合可读流 -- 然后自己处理分块解析、重连和 abort 信号。

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
          // 重连逻辑写在这里...
        }
      }
    };

    connect();
    return () => controller.abort();
  }, [url, token]);

  return { data, status };
}
```

已经超过 55 行了，而且还不完整。它不处理命名事件、事件 ID、带退避的重连，也不支持 POST 请求。手动解析 SSE 文本协议容易出错。

### 使用 useFetchEventSource

ReactUse 的 [`useFetchEventSource`](https://reactuse.com/browser/useFetchEventSource/) Hook 封装了 [@microsoft/fetch-event-source](https://github.com/Azure/fetch-event-source) 库，提供了 React 友好的 API。它支持自定义请求头、POST 请求体，以及你需要的所有重连逻辑。

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
          // Token 可能已过期 -- 重定向到登录页
          window.location.href = "/login";
        },
      },
      onOpen: () => console.log("数据流已连接"),
      onError: (err) => {
        console.error("数据流错误：", err);
        return 5000; // 5 秒后重试
      },
    }
  );

  return (
    <div>
      <div>连接状态：{status}</div>
      {error && <div className="error">{error.message}</div>}
      <pre>{data}</pre>
    </div>
  );
}
```

两个 Hook 的核心区别：

| 特性 | useEventSource | useFetchEventSource |
|---|---|---|
| 自定义请求头 | 不支持 | 支持 |
| POST 请求 | 不支持 | 支持 |
| 请求体 | 不支持 | 支持 |
| 底层技术 | 原生 `EventSource` | `fetch` API |
| 自动重连 | 支持 | 支持 |
| 命名事件 | 支持（通过数组） | 支持（通过 `event` 字段） |

当端点是公开的或使用 cookie 认证时，用 `useEventSource`。当你需要 token 认证、自定义请求头或 POST 请求时，用 `useFetchEventSource`。

### 实际示例：AI 聊天流式响应

SSE 是流式 AI 响应的标准协议（OpenAI、Anthropic 等都在使用）。以下是如何用认证构建流式聊天 UI。

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
      immediate: false, // 不在挂载时连接
      onOpen: () => setStreamedResponse(""),
    }
  );

  // 累积流式传输的 token
  useEffect(() => {
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          setStreamedResponse((prev) => prev + token);
        }
      } catch {
        // 忽略 [DONE] 或格式错误的数据块
      }
    }
  }, [data]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    open(); // 启动 SSE 数据流
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
          placeholder="输入消息..."
        />
        <button onClick={sendMessage} disabled={status === "CONNECTING"}>
          发送
        </button>
      </div>
    </div>
  );
}
```

这里 `immediate: false` 选项至关重要 -- 我们不希望在组件挂载时就打开连接，而是在用户发送消息时显式调用 `open()`。

## 3. 使用 useNetwork 和 useOnline 检测网络状态

如果用户离线了，实时功能就毫无用处。更糟糕的是，它们会静默失败 -- SSE 连接断开，fetch 请求挂起，UI 显示过时数据，却没有任何提示。好的实时 UI 应该具备网络感知能力。

### 手动实现

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

    // Network Information API（并非所有浏览器都支持）
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

大约 35 行代码只获取了两条信息，而且不追踪下行速度、往返时间、数据节省模式或上次状态变化的时间戳。Network Information API 还使用了带厂商前缀的属性（`mozConnection`、`webkitConnection`），这段代码也没有处理。

### 使用 useNetwork

[`useNetwork`](https://reactuse.com/browser/useNetwork/) Hook 返回完整的网络信息。

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
        状态：{online ? "在线" : "离线"}
        {previous !== undefined && previous !== online && (
          <span>
            {" "}
            （之前{previous ? "在线" : "离线"}，变化于{" "}
            {since?.toLocaleTimeString()}）
          </span>
        )}
      </div>
      <div>连接类型：{type ?? "未知"}</div>
      <div>有效类型：{effectiveType ?? "未知"}</div>
      <div>下行速度：{downlink ? `${downlink} Mbps` : "未知"}</div>
      <div>往返时间：{rtt ? `${rtt}ms` : "未知"}</div>
      <div>数据节省：{saveData ? "已启用" : "已关闭"}</div>
    </div>
  );
}
```

Hook 处理了所有的厂商前缀、事件监听器和 SSR 安全问题。`previous` 和 `since` 字段特别有用 -- 它们让你可以显示"你在 30 秒前离线了"，而不仅仅是"离线"。

### 使用 useOnline

如果你只需要布尔值，[`useOnline`](https://reactuse.com/browser/useOnline/) 更加简洁。它是 `useNetwork` 的轻量封装，只返回 `online` 值。

```tsx
import { useOnline } from "@reactuses/core";

function OfflineBanner() {
  const isOnline = useOnline();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      你当前处于离线状态，实时更新已暂停。
    </div>
  );
}
```

### 实际示例：自适应质量推送

`useNetwork` 返回的网络信息让你可以根据用户的连接质量调整应用行为。

```tsx
import { useNetwork } from "@reactuses/core";
import { useMemo } from "react";

function useAdaptivePolling(baseInterval: number) {
  const { online, effectiveType, saveData } = useNetwork();

  const interval = useMemo(() => {
    if (!online) return null; // 离线时停止轮询
    if (saveData) return baseInterval * 4; // 尊重数据节省设置
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
        <div className="banner">离线中 -- 显示缓存的比分</div>
      )}
      {effectiveType === "slow-2g" && (
        <div className="banner">慢速连接 -- 更新频率已降低</div>
      )}
      {/* 使用 pollingInterval 的记分牌内容 */}
    </div>
  );
}
```

在快速 4G 连接上，记分牌每 5 秒更新一次。在慢速 2G 连接上，每 15 秒更新一次。离线时完全停止，显示缓存数据。用户获得的是其连接条件所能支持的最佳体验。

## 4. 使用 useBroadcastChannel 实现跨标签页通信

实时数据通常需要在浏览器标签页之间共享。如果用户在三个标签页中打开了你的仪表盘，当一条新通知通过 SSE 到达时，三个标签页都应该显示它 -- 但只有一个标签页应该维护 SSE 连接。BroadcastChannel API 让这成为可能。

### 手动实现

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
      console.error("BroadcastChannel 错误：", event);
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

这对简单场景够用了，但它不追踪 BroadcastChannel 是否被支持、频道是否已关闭、错误状态或用于去重的时间戳。

### 使用 useBroadcastChannel

[`useBroadcastChannel`](https://reactuse.com/browser/useBroadcastChannel/) Hook 提供了完整的、类型安全的封装。

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
      // 用来自另一个标签页的数据更新本地状态
      console.log("收到来自标签页的数据：", data.sourceTab, data.payload);
    }
  }, [data]);

  if (!isSupported) {
    return <div>当前浏览器不支持跨标签页同步。</div>;
  }

  return (
    <div>
      <button onClick={() => broadcast("NEW_DATA", { count: 42 })}>
        与其他标签页共享数据
      </button>
      {error && <div className="error">同步出错</div>}
      {isClosed && <div className="warning">频道已关闭</div>}
    </div>
  );
}
```

这个 Hook 提供了：

- **`isSupported`** -- 在渲染依赖同步的 UI 前检查 BroadcastChannel 是否可用。
- **`isClosed`** -- 知道频道何时被关闭（由你或浏览器关闭）。
- **`error`** -- 处理消息序列化错误。
- **`timeStamp`** -- 当相同数据被多次接收时进行去重。
- **类型安全** -- 泛型参数 `<D, P>` 分别对应接收数据类型和发送数据类型。

## 5. 综合实战：实时监控仪表盘

让我们将这五个 Hook 组合成一个生产级别的实时仪表盘。这个仪表盘：

- 通过 SSE 接收实时指标（带认证）
- 检测网络状态并相应调整行为
- 在标签页之间共享数据，只让一个标签页维护 SSE 连接
- 向用户展示连接健康状况

```tsx
import {
  useFetchEventSource,
  useNetwork,
  useOnline,
  useBroadcastChannel,
  useEventSource,
} from "@reactuses/core";
import { useState, useEffect, useCallback, useRef } from "react";

// --- 类型定义 ---

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

// --- 领导者选举 Hook ---

function useTabLeader(channelName: string) {
  const tabId = useRef(crypto.randomUUID()).current;
  const [isLeader, setIsLeader] = useState(false);
  const { data, post } = useBroadcastChannel<TabMessage, TabMessage>({
    name: channelName,
  });

  useEffect(() => {
    // 挂载时，短暂延迟后尝试获取领导权
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
      // 另一个标签页释放了 -- 尝试获取领导权
      setTimeout(() => {
        post({ type: "CLAIM_LEADER", tabId });
        setIsLeader(true);
      }, Math.random() * 100);
    }
  }, [data, tabId, post]);

  return { isLeader, tabId };
}

// --- 网络感知 SSE Hook ---

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
        onFailed: () => console.error("指标数据流彻底失败"),
      },
    }
  );

  // 根据 enabled 标志和在线状态连接/断开
  useEffect(() => {
    if (enabled && online) {
      open();
    } else {
      close();
    }
  }, [enabled, online, open, close]);

  return { data, status, error };
}

// --- 主仪表盘组件 ---

function RealtimeDashboard() {
  const [metrics, setMetrics] = useState<MetricEvent[]>([]);
  const isOnline = useOnline();
  const { online, effectiveType, rtt } = useNetwork();

  // 领导者选举 -- 只有领导者标签页打开 SSE 连接
  const { isLeader, tabId } = useTabLeader("metrics-leader");

  // SSE 数据流 -- 只在当前标签页是领导者时激活
  const { data: sseData, status: sseStatus } = useMetricsStream(isLeader);

  // 跨标签页数据共享
  const { data: tabData, post: broadcastToTabs } = useBroadcastChannel<
    TabMessage,
    TabMessage
  >({ name: "metrics-data" });

  // 当领导者收到 SSE 数据时，广播给其他标签页
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
        // 数据格式错误
      }
    }
  }, [isLeader, sseData, broadcastToTabs, tabId]);

  // 当非领导者标签页收到广播数据时，更新本地状态
  useEffect(() => {
    if (!isLeader && tabData?.type === "METRIC_UPDATE" && tabData.payload) {
      setMetrics((prev) => [...prev, tabData.payload!].slice(-100));
    }
  }, [isLeader, tabData]);

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div className="dashboard">
      {/* 连接状态栏 */}
      <header className="status-bar">
        <div className="status-indicators">
          <span className={`dot ${isOnline ? "green" : "red"}`} />
          <span>
            {isOnline ? "在线" : "离线"}
            {effectiveType && ` (${effectiveType})`}
            {rtt && ` -- ${rtt}ms 往返`}
          </span>
        </div>
        <div className="tab-info">
          {isLeader ? "领导者标签页（SSE 活跃）" : "跟随者标签页（通过广播）"}
          <span className={`dot ${sseStatus === "CONNECTED" ? "green" : "yellow"}`} />
        </div>
      </header>

      {/* 离线提示 */}
      {!isOnline && (
        <div className="offline-banner">
          你当前处于离线状态。正在显示最近 {metrics.length} 条缓存指标。
          连接恢复后数据将自动继续更新。
        </div>
      )}

      {/* 指标网格 */}
      {latestMetric && (
        <div className="metrics-grid">
          <MetricCard
            label="CPU 使用率"
            value={`${latestMetric.cpu.toFixed(1)}%`}
            status={latestMetric.cpu > 80 ? "danger" : "normal"}
          />
          <MetricCard
            label="内存"
            value={`${latestMetric.memory.toFixed(1)}%`}
            status={latestMetric.memory > 90 ? "danger" : "normal"}
          />
          <MetricCard
            label="请求数/秒"
            value={latestMetric.requests.toLocaleString()}
            status="normal"
          />
          <MetricCard
            label="错误数/秒"
            value={latestMetric.errors.toLocaleString()}
            status={latestMetric.errors > 10 ? "danger" : "normal"}
          />
        </div>
      )}

      {/* 迷你图表（最近 100 个数据点） */}
      <div className="chart-section">
        <h3>CPU 变化趋势</h3>
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

每个 Hook 在这个仪表盘中的贡献：

- **`useFetchEventSource`** -- 连接带认证的指标 SSE 端点，自动重连。
- **`useEventSource`** -- 如果端点不需要自定义请求头，可以替换使用（对组件零 API 变更）。
- **`useNetwork`** -- 为状态栏提供连接质量数据（`effectiveType`、`rtt`），并实现自适应重连延迟。
- **`useOnline`** -- 驱动离线提示，在网络断开时暂停 SSE 连接。
- **`useBroadcastChannel`** -- 实现领导者选举和跨标签页数据共享，只让一个标签页维护 SSE 连接，而所有标签页都显示实时数据。

最终效果：

1. 所有标签页共享一个 SSE 连接（节省服务器资源）
2. 根据连接质量自适应退避重连
3. 向用户展示实时网络状态
4. 离线时优雅降级
5. 所有打开的标签页之间即时共享数据

## 选择哪个 Hook

| 场景 | Hook | 原因 |
|---|---|---|
| 公开 SSE 端点 | `useEventSource` | 简单，原生 EventSource |
| 带认证头的 SSE | `useFetchEventSource` | 通过 fetch 支持自定义请求头 |
| 带 POST 请求体的 SSE | `useFetchEventSource` | 支持请求体 |
| 简单的在线/离线检测 | `useOnline` | 返回单个布尔值 |
| 详细的连接信息 | `useNetwork` | 下行速度、往返时间、有效类型 |
| 跨标签页消息 | `useBroadcastChannel` | 内存通信，无持久化 |
| 跨标签页 + 持久化 | `useBroadcastChannel` + `useLocalStorage` | 两全其美 |

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

- [`useEventSource`](https://reactuse.com/browser/useEventSource/) -- 响应式 Server-Sent Events，支持命名事件和自动重连
- [`useFetchEventSource`](https://reactuse.com/browser/useFetchEventSource/) -- 基于 fetch 的 SSE，支持自定义请求头、POST 请求和认证
- [`useNetwork`](https://reactuse.com/browser/useNetwork/) -- 详细的网络状态，包括连接类型、下行速度和往返时间
- [`useOnline`](https://reactuse.com/browser/useOnline/) -- 简单的在线/离线布尔值检测
- [`useBroadcastChannel`](https://reactuse.com/browser/useBroadcastChannel/) -- 通过 BroadcastChannel API 实现类型安全的跨标签页消息传递
- [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) -- 跟踪当前标签页是否可见
- [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) -- 具有自动跨标签页同步的持久化状态

ReactUse 提供了 100+ 个 React Hooks。[探索全部 →](https://reactuse.com)
