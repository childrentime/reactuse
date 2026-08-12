---
title: "React useEventSource Hook：自带断线重连的 Server-Sent Events (2026)"
description: "React 里用 useEventSource 玩转 Server-Sent Events 的实用指南：纯 HTTP 上的实时数据流，自动重连、命名事件、连接状态一应俱全，不需要 WebSocket 库。涵盖 SSE 协议格式、手写 EventSource 的坑，以及 useFetchEventSource——解决原生 EventSource 做不到的两件事：自定义请求头和 POST 请求体（每个 AI 流式接口都是这个形状）。TypeScript 优先，SSR 安全。"
slug: react-useeventsource-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-12
tags: [react, hooks, browser, typescript, tutorial]
keywords: [react useeventsource, useeventsource, useEventSource hook, server sent events react, sse react, react sse hook, eventsource react, react 服务器推送, fetch-event-source react, usefetcheventsource, sse 自动重连, text/event-stream react, react ai 流式响应, react 流式 hook, sse 和 websocket 区别]
image: /img/og.png
---

# React useEventSource Hook：自带断线重连的 Server-Sent Events (2026)

实时通知、部署日志、股票行情、一个 token 一个 token 蹦出来的 AI 回答——这些都不需要 WebSocket。它们全是单向的：服务器说，客户端听。浏览器早在 2011 年就内置了专门干这事的协议——**Server-Sent Events (SSE)**——跑在普通 HTTP 上，穿透代理和负载均衡毫无压力，断线还会自动重连。

SSE 缺的是一个好用的 React 封装。原生 `EventSource` API 是命令式的：你要 new 出来、挂监听器、还得在恰当的时机拆干净——经典的 effect 生命周期雷区。[`@reactuses/core`](https://reactuse.com) 的 [`useEventSource`](https://reactuse.com/browser/useeventsource/) 把这一切变成声明式状态：`data`、`status`、`error`，组件直接渲染就行。这篇文章覆盖 hook 的完整 API、原生 `EventSource` 那套微妙出错的重连行为，以及 [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/)——一旦你的流需要 `Authorization` 头或 POST 请求体就必须换上的 fetch 版变体，而 2026 年的今天，所有 AI 补全接口都是这个形状。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useEventSource } from "@reactuses/core";

function DeploymentLog() {
  const { data, status } = useEventSource("/api/deploy/stream");

  return (
    <div>
      <span>{status === "CONNECTED" ? "🟢 实时" : "🟡 连接中…"}</span>
      <pre>{data}</pre>
    </div>
  );
}
```

这就是一个完整的实时更新组件。hook 在挂载时打开连接，每条消息到达就更新 `data`，把连接生命周期暴露成 `status`（`"CONNECTING" | "CONNECTED" | "DISCONNECTED"`），组件卸载时自动关闭流。没有 ref，没有监听器，没有会忘写的清理函数。

## SSE 到底是什么（60 秒版）

Server-Sent Events 本质上就是一个永远不结束的 HTTP 响应。服务器返回 `Content-Type: text/event-stream`，用纯文本写消息，空行分隔：

```text
data: {"price": 101.42}
id: 7

event: trade
data: {"symbol": "ACME", "qty": 200}
id: 8
```

三种字段值得记住：

- `data:` —— 消息载荷（永远是字符串；结构化数据自己 JSON 编码）。
- `event:` —— 可选的事件*名*，一条流可以承载多个频道。
- `id:` —— 可选的事件 ID。浏览器会记住最后一个，重连时通过 `Last-Event-ID` 请求头带回去，写得好的服务端可以从断点续传。

因为是纯 HTTP，SSE 穿企业代理、CDN、HTTP/2 多路复用都不会遇到 WebSocket 偶尔碰上的升级握手闹剧。代价是：只能服务器 → 客户端单向，而且原生浏览器 API 只能发不带自定义请求头的 GET。记住这个限制——本文第二个 hook 就是为它而生的。

## 手写的方式——以及它咬人的地方

手动接 `EventSource` 看起来不难：

```tsx
// ⚠️ 手写版——三个 bug 蓄势待发
function Ticker() {
  const [price, setPrice] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/prices");
    es.onmessage = e => setPrice(e.data);
    return () => es.close();
  }, []);

  return <span>{price}</span>;
}
```

问题都在生产环境暴露，demo 里看不见：

1. **重连是无限且不可见的。** 服务器断开连接后，`EventSource` 会永远静默重试。如果你的 API 挂了，每个打开的标签页都会每隔几秒锤它一次，直到宇宙热寂——而且你没有任何状态告诉 UI"我们掉线了"，没法弹横幅、也没法认输。
2. **错误是不透明的。** `onerror` 只给你一个裸 `Event`——没有状态码，没有原因。不自己维护连接状态的话，UI 会把过期数据当实时数据继续开心地展示。
3. **命名事件要手动记账。** 每一条 `event: trade` 都需要自己的 `addEventListener("trade", …)` *和*清理时配对的 `removeEventListener`。漏一个，在 React 18 StrictMode 的挂载-卸载-挂载循环里就是监听器泄漏。

这些都不算难，只是很容易做到 90% 对——而那是最糟糕的一种错。

## useEventSource 的 API

手写版做不好的一切，都变成返回的状态：

```tsx
const { data, event, status, error, lastEventId, open, close, eventSourceRef } =
  useEventSource(url, events?, options?);
```

- **`data: string | null`** —— 最新一条消息的载荷。
- **`event: string | null`** —— 最后收到的*命名*事件的名字（见下文）。
- **`status`** —— `"CONNECTING" | "CONNECTED" | "DISCONNECTED"`。直接渲染，这就是你的实时指示灯。
- **`error: Event | null`** —— 最近的连接错误，重连成功后清空。
- **`lastEventId: string | null`** —— 最后一条消息的 `id:` 字段，也就是你的续传游标。
- **`open()` / `close()`** —— 手动控制。`close()` 是*显式的*：它同时禁用自动重连，所以"用户点了暂停"就真的保持暂停。`open()` 重新连接并重置重试计数。
- **`eventSourceRef`** —— 需要摸原生 `EventSource` 实例时的逃生舱。

### 声明式的命名事件

把关心的事件名作为第二个参数传入，hook 替你注册——并清理——所有监听器：

```tsx
const { data, event } = useEventSource("/api/stream", ["trade", "quote"]);

// event === "trade" | "quote" | null —— data 来自哪个频道
useEffect(() => {
  if (event === "trade") appendTrade(JSON.parse(data!));
}, [data, event]);
```

### 有预算的自动重连

`autoReconnect` 选项把 `EventSource` 的静默无限重试换成你自己选的策略：

```tsx
const { status } = useEventSource("/api/notifications", [], {
  autoReconnect: {
    retries: 5,        // 重试 5 次就放弃（也可以传 () => boolean）
    delay: 2000,       // 每次间隔 2 秒
    onFailed: () => toast.error("实时更新不可用——刷新重试"),
  },
});
```

`retries` 默认 `-1`（永远重试，和原生行为一致），但现在它是一个*决策*而不是一个惊喜，`onFailed` 给了你告知用户的时机。配合 `status === "DISCONNECTED"` 渲染降级 UI，而不是静默展示过期数字。

### 懒连接

默认挂载即连接。传 `immediate: false` 等用户主动触发：

```tsx
const { status, open, close } = useEventSource("/api/live-scores", [], {
  immediate: false,
});

<button onClick={status === "CONNECTED" ? close : open}>
  {status === "CONNECTED" ? "暂停实时比分" : "开始直播"}
</button>
```

## 每篇 SSE 教程都会撞的墙：鉴权请求头

原生 API 的脏秘密来了：`new EventSource(url)` **不能发自定义请求头**。没有 `Authorization: Bearer …`，没有 `X-Api-Key`，什么都没有。原生 API 下你只有两条路：cookie（`withCredentials: true`）或把 token 塞进查询字符串——前者在现代 cookie 策略下跨域基本没戏，后者会让你的 token 出现在浏览器到服务器之间的每一份访问日志里。

它也不能 POST。这很要命，因为 2026 年最大的 SSE 消费方——OpenAI 风格的 AI 补全接口——全是 `POST /v1/chat/completions` 加 JSON 请求体加 bearer token，再以 `text/event-stream` 流式返回。原生 `EventSource` API 根本调不了它们。

[`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) 用 `fetch` 来说 SSE（基于微软久经沙场的 [`fetch-event-source`](https://github.com/Azure/fetch-event-source) 解析器），整个请求都由你塑形：

```tsx
import { useFetchEventSource } from "@reactuses/core";

const { data, status, error } = useFetchEventSource("/api/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ model: "gpt-5", messages, stream: true }),
  autoReconnect: { retries: 3, delay: 1000 },
});
```

返回形状和 `useEventSource` 完全一致——`data`、`event`、`status`、`error`、`lastEventId`、`open`、`close`——两者切换是改一行的事，不是重写。

### 一个 token 一个 token 地流式渲染 AI 回答

`onMessage` 回调是累积流式补全的天然位置：

```tsx
function Answer({ prompt }: { prompt: string }) {
  const [text, setText] = useState("");

  const { status } = useFetchEventSource("/api/ask", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt }),
    onMessage: msg => {
      if (msg.data === "[DONE]") return;
      const delta = JSON.parse(msg.data).choices[0]?.delta?.content ?? "";
      setText(prev => prev + delta);
    },
    onError: err => {
      if (isRateLimit(err)) return 5000; // 返回数字 = N 毫秒后重试
    },
  });

  return <Markdown>{text}{status === "CONNECTED" && "▌"}</Markdown>;
}
```

两个值得偷走的细节：在 `onError` 里返回数字可以覆盖这一次的重连延迟（正好用来做 `Retry-After` 式退避）；函数式更新 `setText(prev => …)` 保证 token 顺序在 React 批处理下不乱。

### 原生还是 fetch 版——怎么选？

| | [`useEventSource`](https://reactuse.com/browser/useeventsource/) | [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) |
| --- | --- | --- |
| 传输层 | 原生 `EventSource` | `fetch` + 流解析器 |
| 自定义请求头 / bearer 鉴权 | ❌ | ✅ |
| 带请求体的 POST | ❌ | ✅ |
| 自动 `Last-Event-ID` 续传 | ✅ 内置 | 交给你的服务端 |
| 额外包体积 | 零 | 小型解析器依赖 |
| 什么时候用 | 同源或 cookie 鉴权的流 | AI 接口、token 鉴权、请求体 |

简单法则：先用 `useEventSource`；哪天你敲出 `Authorization` 这个词，就换。

## 生产环境笔记

- **SSR 已处理好。** 两个 hook 都只在 effect 里碰 `EventSource`/`fetch`，服务端渲染毫发无伤——你的代码里不用写 `typeof window` 守卫。首屏是 `status: "DISCONNECTED"`，然后客户端接上。
- **后台标签页要暂停。** 一个被丢在后台的仪表盘标签页会一直占着流（以及你服务器的连接预算）。配合 [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/)，隐藏时 `close()`、回来时 `open()`——`Last-Event-ID` 握手让续传很便宜。
- **一个标签页拉流，其余收听。** HTTP/1.1 下浏览器对每个源的并发连接有上限（约 6 个），每个开着 SSE 的标签页都烧掉一个。经典解法：一个标签页持有流，用 [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) 把消息广播出去。（或者上 HTTP/2，流会多路复用。）
- **别往死网络里重连。** [`useNetwork`](https://reactuse.com/browser/usenetwork/) 或更小巧的 [`useOnline`](https://reactuse.com/browser/useonline/) 能告诉你浏览器已离线——用它门控你的重试 UI，别在笔记本过隧道的时候烧光重试预算。

## SSE 不是正确工具的时候

- **客户端要在同一条通道上回话** ——你要*发*消息的聊天、多人光标、协同编辑。那是双向的，用 WebSocket。
- **更新很稀疏。** 一小时变几次的值不配一条常驻连接——轮询它，或者用你的数据请求库在窗口聚焦时重新拉取。
- **只交付一次数据。** 数据到了响应就结束的，那就是 `fetch`。只有当流比请求活得久，SSE 才配得上它的开销。
- **二进制数据。** SSE 是 UTF-8 文本。二进制走 WebSocket 或分块 `fetch`，别 base64 一遍塞进文本流。

## 要点回顾

- SSE 是最简单的实时传输：一条长命 HTTP 响应、浏览器原生支持、`Last-Event-ID` 自动续传——所有服务器到客户端的推送都适合它。
- [`useEventSource`](https://reactuse.com/browser/useeventsource/) 把命令式的 `EventSource` 生命周期变成可渲染的状态（`data` / `status` / `error`），代管命名事件监听器的清理，用你设定的重连策略——`retries`、`delay`、`onFailed`——替换不可见的无限重试。
- 原生 `EventSource` 发不了 `Authorization` 头，也发不了 POST 请求体。[`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) 可以——API 形状不变，传输层换 fetch——这就是流式 AI 补全需要的那块拼图。
- `close()` 的意思是*保持关闭*（不再自动重连）；`open()` 重置重试预算。把它们接上可见性和网络状态，你的流就是个好公民。

`useEventSource`、`useFetchEventSource` 和其余 110+ 个 SSR 安全、TypeScript 优先的 hooks 都在 [`@reactuses/core`](https://reactuse.com) 里——一次安装，可摇树，没有需要你伺候的依赖。

```bash
npm install @reactuses/core
```
