---
title: "Building Real-Time Features in React Without WebSocket Libraries"
description: "Learn how to build real-time dashboards, live feeds, and network-aware UIs in React using Server-Sent Events, the BroadcastChannel API, and hooks from ReactUse -- no WebSocket libraries required."
slug: react-realtime-features
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-02
tags: [react, hooks, realtime, tutorial, useEventSource]
keywords: [react realtime, useEventSource, useFetchEventSource, useNetwork, useOnline, server-sent events react, react online status]
image: /img/og.png
---

# Building Real-Time Features in React Without WebSocket Libraries

When developers hear "real-time," they reach for WebSocket libraries. Socket.IO, Pusher, Ably -- the ecosystem is full of them. But many real-time features do not need bidirectional communication. A stock ticker, a notification feed, a deployment log, a live sports score -- all of these are one-directional streams from server to client. For these use cases, the browser already has a built-in protocol that is simpler, lighter, and automatically reconnects: **Server-Sent Events (SSE)**.

<!-- truncate -->

Combine SSE with the Network Information API for connection awareness, and the BroadcastChannel API for cross-tab coordination, and you have a complete real-time toolkit -- zero WebSocket libraries required. In this article, we will build each piece from scratch first, see where the manual approach breaks down, then replace it with hooks from [ReactUse](https://reactuse.com) that handle all the edge cases in a few lines.

## 1. Server-Sent Events with useEventSource

### What Are Server-Sent Events?

Server-Sent Events (SSE) is a standard that lets a server push updates to the browser over a plain HTTP connection. Unlike WebSockets, SSE is unidirectional -- the server sends, the client receives. The browser's native `EventSource` API handles connection management, automatic reconnection, and event parsing out of the box.

```tsx
// A basic SSE endpoint (server side, for reference)
// GET /api/notifications
// Content-Type: text/event-stream
//
// data: {"message": "New deployment started"}
// id: 1
//
// data: {"message": "Deployment complete"}
// id: 2
```

### The Manual Way

Let us connect to an SSE endpoint in React without any libraries.

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

        // Manual reconnection logic
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

That is about 45 lines, and it already has problems:

- **Named events are not handled.** SSE supports custom event types (e.g., `event: deploy-status`), but `onmessage` only catches unnamed messages. Supporting named events requires calling `addEventListener` for each event type and cleaning up each listener on unmount.
- **Reconnection is naive.** The code retries up to 5 times with linear backoff, but there is no way to configure the limit, the delay, or a failure callback.
- **No explicit close/reopen.** If the user navigates away and comes back, or if you want to pause the stream while the tab is hidden, you need more state tracking.
- **SSR will crash.** `EventSource` does not exist on the server.

### With useEventSource

The [`useEventSource`](https://reactuse.com/browser/useeventsource/) hook from ReactUse handles all of this.

```tsx
import { useEventSource } from "@reactuses/core";

function DeploymentLog() {
  const { data, status, error, event, lastEventId, close, open } =
    useEventSource("/api/deployments/stream", ["deploy-start", "deploy-end"], {
      autoReconnect: {
        retries: 5,
        delay: 2000,
        onFailed: () => console.error("SSE connection permanently failed"),
      },
    });

  return (
    <div>
      <div>
        Status: {status}
        {status === "DISCONNECTED" && (
          <button onClick={open}>Reconnect</button>
        )}
        {status === "CONNECTED" && (
          <button onClick={close}>Disconnect</button>
        )}
      </div>

      {error && <div className="error">Connection error occurred</div>}

      <div className="log-entry">
        <span className="event-type">{event}</span>
        <span className="event-id">#{lastEventId}</span>
        <pre>{data}</pre>
      </div>
    </div>
  );
}
```

Look at what you get for free:

- **Named event support.** Pass an array of event names as the second argument, and the hook listens to each one. The `event` return value tells you which event type fired.
- **Configurable auto-reconnect.** Set the number of retries, the delay between attempts, and a callback when all retries are exhausted.
- **Explicit close and reopen.** Call `close()` to disconnect, `open()` to reconnect -- useful for pausing streams in background tabs.
- **SSR safe.** The hook guards against `EventSource` being undefined on the server.
- **Last event ID tracking.** The `lastEventId` value lets you resume from where you left off if the server supports it.

### A Practical Example: Live Notification Feed

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
        retries: -1, // retry forever
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
        // malformed data, ignore
      }
    }
  }, [data, event]);

  return (
    <div>
      <h2>
        Live Notifications
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

The hook handles the SSE lifecycle. Your component only deals with parsing data and rendering UI.

## 2. Authenticated SSE Streams with useFetchEventSource

### The Problem with Native EventSource

The native `EventSource` API has a major limitation: you cannot set custom headers. That means no `Authorization: Bearer <token>`, no custom `X-Request-ID`, and no `POST` requests with a body. If your SSE endpoint requires authentication, `EventSource` is not enough.

The common workaround is to pass the token as a query parameter (`/api/stream?token=abc`), but that leaks credentials into server logs, browser history, and referrer headers. It is a security anti-pattern.

### The Manual Way

To send headers with an SSE-like connection, you need to use `fetch` with a readable stream -- and handle chunked parsing, reconnection, and abort signals yourself.

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
          // reconnection logic here...
        }
      }
    };

    connect();
    return () => controller.abort();
  }, [url, token]);

  return { data, status };
}
```

This is already 55+ lines, and it is incomplete. It does not handle named events, event IDs, reconnection with backoff, or POST requests. Parsing the SSE text protocol by hand is error-prone.

### With useFetchEventSource

The [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) hook wraps the [@microsoft/fetch-event-source](https://github.com/Azure/fetch-event-source) library in a React-friendly API. It supports custom headers, POST requests with bodies, and all the reconnection logic you need.

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
          // Token might be expired -- redirect to login
          window.location.href = "/login";
        },
      },
      onOpen: () => console.log("Stream connected"),
      onError: (err) => {
        console.error("Stream error:", err);
        return 5000; // retry after 5 seconds
      },
    }
  );

  return (
    <div>
      <div>Connection: {status}</div>
      {error && <div className="error">{error.message}</div>}
      <pre>{data}</pre>
    </div>
  );
}
```

Key differences from `useEventSource`:

| Feature | useEventSource | useFetchEventSource |
|---|---|---|
| Custom headers | No | Yes |
| POST requests | No | Yes |
| Request body | No | Yes |
| Based on | Native `EventSource` | `fetch` API |
| Auto-reconnect | Yes | Yes |
| Named events | Yes (via array) | Yes (via `event` field) |

Use `useEventSource` when your endpoint is public or uses cookie-based auth. Use `useFetchEventSource` when you need token-based auth, custom headers, or POST requests.

### A Practical Example: AI Chat Streaming

SSE is the standard protocol for streaming AI responses (OpenAI, Anthropic, and others all use it). Here is how to build a streaming chat UI with authentication.

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
      immediate: false, // don't connect on mount
      onOpen: () => setStreamedResponse(""),
    }
  );

  // Accumulate streamed tokens
  useEffect(() => {
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          setStreamedResponse((prev) => prev + token);
        }
      } catch {
        // ignore [DONE] or malformed chunks
      }
    }
  }, [data]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    open(); // start the SSE stream
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
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} disabled={status === "CONNECTING"}>
          Send
        </button>
      </div>
    </div>
  );
}
```

The `immediate: false` option is critical here -- we do not want the connection to open on mount. We call `open()` explicitly when the user sends a message.

## 3. Network Status Detection with useNetwork and useOnline

Real-time features are useless if the user is offline. Worse, they fail silently -- the SSE connection drops, fetch requests hang, and the UI shows stale data without any indication that something is wrong. Good real-time UIs are network-aware.

### The Manual Way

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

    // Network Information API (not available in all browsers)
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

That is around 35 lines for just two pieces of information, and it does not track downlink speed, round-trip time, data saver mode, or the timestamp of the last status change. The Network Information API also uses vendor-prefixed properties (`mozConnection`, `webkitConnection`) that this code does not handle.

### With useNetwork

The [`useNetwork`](https://reactuse.com/browser/usenetwork/) hook returns the full picture.

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
        Status: {online ? "Online" : "Offline"}
        {previous !== undefined && previous !== online && (
          <span>
            {" "}
            (was {previous ? "online" : "offline"}, changed{" "}
            {since?.toLocaleTimeString()})
          </span>
        )}
      </div>
      <div>Connection: {type ?? "unknown"}</div>
      <div>Effective type: {effectiveType ?? "unknown"}</div>
      <div>Downlink: {downlink ? `${downlink} Mbps` : "unknown"}</div>
      <div>RTT: {rtt ? `${rtt}ms` : "unknown"}</div>
      <div>Data saver: {saveData ? "enabled" : "disabled"}</div>
    </div>
  );
}
```

The hook handles all the vendor prefixes, event listeners, and SSR safety. The `previous` and `since` fields are especially useful -- they let you show "You went offline 30 seconds ago" instead of just "Offline."

### With useOnline

If you only need the boolean, [`useOnline`](https://reactuse.com/browser/useonline/) is even simpler. It is a thin wrapper around `useNetwork` that returns just the `online` value.

```tsx
import { useOnline } from "@reactuses/core";

function OfflineBanner() {
  const isOnline = useOnline();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      You are offline. Real-time updates are paused.
    </div>
  );
}
```

### A Practical Example: Adaptive Quality Streaming

The network information from `useNetwork` lets you adapt your application's behavior to the user's connection quality.

```tsx
import { useNetwork } from "@reactuses/core";
import { useMemo } from "react";

function useAdaptivePolling(baseInterval: number) {
  const { online, effectiveType, saveData } = useNetwork();

  const interval = useMemo(() => {
    if (!online) return null; // stop polling when offline
    if (saveData) return baseInterval * 4; // respect data saver
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
        <div className="banner">Offline -- showing cached scores</div>
      )}
      {effectiveType === "slow-2g" && (
        <div className="banner">Slow connection -- updates reduced</div>
      )}
      {/* Scoreboard content using pollingInterval */}
    </div>
  );
}
```

On a fast 4G connection, the scoreboard updates every 5 seconds. On a slow 2G connection, it updates every 15 seconds. Offline, it stops entirely and shows cached data. The user gets the best experience their connection can support.

## 4. Cross-Tab Communication with useBroadcastChannel

Real-time data often needs to be shared across browser tabs. If a user has your dashboard open in three tabs and a new notification arrives via SSE, all three tabs should show it -- but only one tab should maintain the SSE connection. The BroadcastChannel API makes this possible.

### The Manual Way

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
      console.error("BroadcastChannel error:", event);
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

This works for simple cases, but it does not track whether BroadcastChannel is supported, whether the channel is closed, error state, or timestamps for deduplication.

### With useBroadcastChannel

The [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) hook provides a complete, type-safe wrapper.

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
      // Update local state with data from another tab
      console.log("Received data from tab:", data.sourceTab, data.payload);
    }
  }, [data]);

  if (!isSupported) {
    return <div>Cross-tab sync not available in this browser.</div>;
  }

  return (
    <div>
      <button onClick={() => broadcast("NEW_DATA", { count: 42 })}>
        Share data with other tabs
      </button>
      {error && <div className="error">Sync error</div>}
      {isClosed && <div className="warning">Channel closed</div>}
    </div>
  );
}
```

The hook gives you:

- **`isSupported`** -- check if BroadcastChannel is available before rendering sync-dependent UI.
- **`isClosed`** -- know when the channel has been closed (by you or by the browser).
- **`error`** -- handle message serialization errors.
- **`timeStamp`** -- deduplicate messages when the same data is received multiple times.
- **Type safety** -- generic parameters `<D, P>` for received data type and posted data type.

## 5. Putting It All Together: A Real-Time Dashboard

Let us combine all five hooks into a production-style real-time dashboard. This dashboard:

- Receives live metrics via SSE (with authentication)
- Detects network status and adapts accordingly
- Shares data across tabs so only one tab maintains the SSE connection
- Shows connection health to the user

```tsx
import {
  useFetchEventSource,
  useNetwork,
  useOnline,
  useBroadcastChannel,
  useEventSource,
} from "@reactuses/core";
import { useState, useEffect, useCallback, useRef } from "react";

// --- Types ---

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

// --- Leader Election Hook ---

function useTabLeader(channelName: string) {
  const tabId = useRef(crypto.randomUUID()).current;
  const [isLeader, setIsLeader] = useState(false);
  const { data, post } = useBroadcastChannel<TabMessage, TabMessage>({
    name: channelName,
  });

  useEffect(() => {
    // On mount, claim leadership after a short delay
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
      // Another tab released -- try to claim
      setTimeout(() => {
        post({ type: "CLAIM_LEADER", tabId });
        setIsLeader(true);
      }, Math.random() * 100);
    }
  }, [data, tabId, post]);

  return { isLeader, tabId };
}

// --- Network-Aware SSE Hook ---

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
        onFailed: () => console.error("Metrics stream failed permanently"),
      },
    }
  );

  // Connect/disconnect based on enabled flag and online status
  useEffect(() => {
    if (enabled && online) {
      open();
    } else {
      close();
    }
  }, [enabled, online, open, close]);

  return { data, status, error };
}

// --- Main Dashboard Component ---

function RealtimeDashboard() {
  const [metrics, setMetrics] = useState<MetricEvent[]>([]);
  const isOnline = useOnline();
  const { online, effectiveType, rtt } = useNetwork();

  // Leader election -- only the leader tab opens the SSE connection
  const { isLeader, tabId } = useTabLeader("metrics-leader");

  // SSE stream -- only active if this tab is the leader
  const { data: sseData, status: sseStatus } = useMetricsStream(isLeader);

  // Cross-tab data sharing
  const { data: tabData, post: broadcastToTabs } = useBroadcastChannel<
    TabMessage,
    TabMessage
  >({ name: "metrics-data" });

  // When the leader receives SSE data, broadcast it to other tabs
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
        // malformed data
      }
    }
  }, [isLeader, sseData, broadcastToTabs, tabId]);

  // When a non-leader tab receives broadcast data, update local state
  useEffect(() => {
    if (!isLeader && tabData?.type === "METRIC_UPDATE" && tabData.payload) {
      setMetrics((prev) => [...prev, tabData.payload!].slice(-100));
    }
  }, [isLeader, tabData]);

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div className="dashboard">
      {/* Connection Status Bar */}
      <header className="status-bar">
        <div className="status-indicators">
          <span className={`dot ${isOnline ? "green" : "red"}`} />
          <span>
            {isOnline ? "Online" : "Offline"}
            {effectiveType && ` (${effectiveType})`}
            {rtt && ` -- ${rtt}ms RTT`}
          </span>
        </div>
        <div className="tab-info">
          {isLeader ? "Leader tab (SSE active)" : "Follower tab (via broadcast)"}
          <span className={`dot ${sseStatus === "CONNECTED" ? "green" : "yellow"}`} />
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          You are offline. Showing the last {metrics.length} cached metrics.
          Data will resume when your connection is restored.
        </div>
      )}

      {/* Metrics Grid */}
      {latestMetric && (
        <div className="metrics-grid">
          <MetricCard
            label="CPU Usage"
            value={`${latestMetric.cpu.toFixed(1)}%`}
            status={latestMetric.cpu > 80 ? "danger" : "normal"}
          />
          <MetricCard
            label="Memory"
            value={`${latestMetric.memory.toFixed(1)}%`}
            status={latestMetric.memory > 90 ? "danger" : "normal"}
          />
          <MetricCard
            label="Requests/sec"
            value={latestMetric.requests.toLocaleString()}
            status="normal"
          />
          <MetricCard
            label="Errors/sec"
            value={latestMetric.errors.toLocaleString()}
            status={latestMetric.errors > 10 ? "danger" : "normal"}
          />
        </div>
      )}

      {/* Sparkline Chart (last 100 data points) */}
      <div className="chart-section">
        <h3>CPU Over Time</h3>
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

Here is what each hook contributes to this dashboard:

- **`useFetchEventSource`** -- connects to the authenticated metrics SSE endpoint with automatic reconnection.
- **`useEventSource`** -- could be used instead if the endpoint does not require auth headers (swap it in with zero API changes to the component).
- **`useNetwork`** -- provides connection quality data (`effectiveType`, `rtt`) for the status bar and adaptive reconnection delays.
- **`useOnline`** -- drives the offline banner and pauses the SSE connection when the network drops.
- **`useBroadcastChannel`** -- enables leader election and cross-tab data sharing, so only one tab maintains the SSE connection while all tabs show live data.

The result is a dashboard that:

1. Uses a single SSE connection across all tabs (saving server resources)
2. Automatically reconnects with adaptive backoff based on connection quality
3. Shows real-time network status to the user
4. Degrades gracefully when offline
5. Shares data instantly across every open tab

## When to Use Which Hook

| Scenario | Hook | Why |
|---|---|---|
| Public SSE endpoint | `useEventSource` | Simple, native EventSource |
| SSE with auth headers | `useFetchEventSource` | Custom headers via fetch |
| SSE with POST body | `useFetchEventSource` | Supports request bodies |
| Simple online/offline check | `useOnline` | Returns a single boolean |
| Detailed connection info | `useNetwork` | Downlink, RTT, effective type |
| Cross-tab messaging | `useBroadcastChannel` | In-memory, no persistence |
| Cross-tab + persistence | `useBroadcastChannel` + `useLocalStorage` | Best of both |

## Installation

```bash
npm install @reactuses/core
```

Or with your preferred package manager:

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

## Related Hooks

- [`useEventSource`](https://reactuse.com/browser/useeventsource/) -- reactive Server-Sent Events with named event support and auto-reconnect
- [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) -- SSE via fetch, supporting custom headers, POST requests, and authentication
- [`useNetwork`](https://reactuse.com/browser/usenetwork/) -- detailed network status including connection type, downlink speed, and RTT
- [`useOnline`](https://reactuse.com/browser/useonline/) -- simple boolean for online/offline detection
- [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) -- type-safe cross-tab messaging via the BroadcastChannel API
- [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) -- track whether the current tab is visible
- [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) -- persistent state with automatic cross-tab synchronization

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
