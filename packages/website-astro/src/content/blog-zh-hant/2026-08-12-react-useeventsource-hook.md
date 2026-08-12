---
title: "React useEventSource Hook：自帶斷線重連的 Server-Sent Events (2026)"
description: "React 裡用 useEventSource 玩轉 Server-Sent Events 的實用指南：純 HTTP 上的即時資料流，自動重連、命名事件、連線狀態一應俱全，不需要 WebSocket 函式庫。涵蓋 SSE 協定格式、手寫 EventSource 的坑，以及 useFetchEventSource——解決原生 EventSource 做不到的兩件事：自訂請求標頭和 POST 請求主體（每個 AI 串流介面都是這個形狀）。TypeScript 優先，SSR 安全。"
slug: react-useeventsource-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-12
tags: [react, hooks, browser, typescript, tutorial]
keywords: [react useeventsource, useeventsource, useEventSource hook, server sent events react, sse react, react sse hook, eventsource react, react 伺服器推送, fetch-event-source react, usefetcheventsource, sse 自動重連, text/event-stream react, react ai 串流回應, react 串流 hook, sse 和 websocket 差異]
image: /img/og.png
---

# React useEventSource Hook：自帶斷線重連的 Server-Sent Events (2026)

即時通知、部署日誌、股票行情、一個 token 一個 token 蹦出來的 AI 回答——這些都不需要 WebSocket。它們全是單向的：伺服器說，用戶端聽。瀏覽器早在 2011 年就內建了專門做這件事的協定——**Server-Sent Events (SSE)**——跑在普通 HTTP 上，穿透代理和負載平衡毫無壓力，斷線還會自動重連。

SSE 缺的是一個好用的 React 封裝。原生 `EventSource` API 是命令式的：你要 new 出來、掛監聽器、還得在恰當的時機拆乾淨——經典的 effect 生命週期雷區。[`@reactuses/core`](https://reactuse.com) 的 [`useEventSource`](https://reactuse.com/browser/useeventsource/) 把這一切變成宣告式狀態：`data`、`status`、`error`，元件直接渲染就行。這篇文章涵蓋 hook 的完整 API、原生 `EventSource` 那套微妙出錯的重連行為，以及 [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/)——一旦你的串流需要 `Authorization` 標頭或 POST 請求主體就必須換上的 fetch 版變體，而 2026 年的今天，所有 AI 補全介面都是這個形狀。

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
      <span>{status === "CONNECTED" ? "🟢 即時" : "🟡 連線中…"}</span>
      <pre>{data}</pre>
    </div>
  );
}
```

這就是一個完整的即時更新元件。hook 在掛載時打開連線，每條訊息到達就更新 `data`，把連線生命週期暴露成 `status`（`"CONNECTING" | "CONNECTED" | "DISCONNECTED"`），元件卸載時自動關閉串流。沒有 ref，沒有監聽器，沒有會忘寫的清理函式。

## SSE 到底是什麼（60 秒版）

Server-Sent Events 本質上就是一個永遠不結束的 HTTP 回應。伺服器回傳 `Content-Type: text/event-stream`，用純文字寫訊息，空行分隔：

```text
data: {"price": 101.42}
id: 7

event: trade
data: {"symbol": "ACME", "qty": 200}
id: 8
```

三種欄位值得記住：

- `data:` —— 訊息載荷（永遠是字串；結構化資料自己 JSON 編碼）。
- `event:` —— 可選的事件*名*，一條串流可以承載多個頻道。
- `id:` —— 可選的事件 ID。瀏覽器會記住最後一個，重連時透過 `Last-Event-ID` 請求標頭帶回去，寫得好的伺服器端可以從斷點續傳。

因為是純 HTTP，SSE 穿企業代理、CDN、HTTP/2 多工都不會遇到 WebSocket 偶爾碰上的升級交握鬧劇。代價是：只能伺服器 → 用戶端單向，而且原生瀏覽器 API 只能發不帶自訂請求標頭的 GET。記住這個限制——本文第二個 hook 就是為它而生的。

## 手寫的方式——以及它咬人的地方

手動接 `EventSource` 看起來不難：

```tsx
// ⚠️ 手寫版——三個 bug 蓄勢待發
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

問題都在正式環境暴露，demo 裡看不見：

1. **重連是無限且不可見的。** 伺服器斷開連線後，`EventSource` 會永遠靜默重試。如果你的 API 掛了，每個打開的分頁都會每隔幾秒錘它一次，直到宇宙熱寂——而且你沒有任何狀態告訴 UI「我們斷線了」，沒法跳橫幅、也沒法認輸。
2. **錯誤是不透明的。** `onerror` 只給你一個裸 `Event`——沒有狀態碼，沒有原因。不自己維護連線狀態的話，UI 會把過期資料當即時資料繼續開心地展示。
3. **命名事件要手動記帳。** 每一條 `event: trade` 都需要自己的 `addEventListener("trade", …)` *和*清理時配對的 `removeEventListener`。漏一個，在 React 18 StrictMode 的掛載-卸載-掛載循環裡就是監聽器洩漏。

這些都不算難，只是很容易做到 90% 對——而那是最糟糕的一種錯。

## useEventSource 的 API

手寫版做不好的一切，都變成回傳的狀態：

```tsx
const { data, event, status, error, lastEventId, open, close, eventSourceRef } =
  useEventSource(url, events?, options?);
```

- **`data: string | null`** —— 最新一條訊息的載荷。
- **`event: string | null`** —— 最後收到的*命名*事件的名字（見下文）。
- **`status`** —— `"CONNECTING" | "CONNECTED" | "DISCONNECTED"`。直接渲染，這就是你的即時指示燈。
- **`error: Event | null`** —— 最近的連線錯誤，重連成功後清空。
- **`lastEventId: string | null`** —— 最後一條訊息的 `id:` 欄位，也就是你的續傳游標。
- **`open()` / `close()`** —— 手動控制。`close()` 是*顯式的*：它同時停用自動重連，所以「使用者點了暫停」就真的保持暫停。`open()` 重新連線並重設重試計數。
- **`eventSourceRef`** —— 需要摸原生 `EventSource` 實例時的逃生艙。

### 宣告式的命名事件

把關心的事件名作為第二個參數傳入，hook 替你註冊——並清理——所有監聽器：

```tsx
const { data, event } = useEventSource("/api/stream", ["trade", "quote"]);

// event === "trade" | "quote" | null —— data 來自哪個頻道
useEffect(() => {
  if (event === "trade") appendTrade(JSON.parse(data!));
}, [data, event]);
```

### 有預算的自動重連

`autoReconnect` 選項把 `EventSource` 的靜默無限重試換成你自己選的策略：

```tsx
const { status } = useEventSource("/api/notifications", [], {
  autoReconnect: {
    retries: 5,        // 重試 5 次就放棄（也可以傳 () => boolean）
    delay: 2000,       // 每次間隔 2 秒
    onFailed: () => toast.error("即時更新不可用——重新整理再試"),
  },
});
```

`retries` 預設 `-1`（永遠重試，和原生行為一致），但現在它是一個*決策*而不是一個驚喜，`onFailed` 給了你告知使用者的時機。搭配 `status === "DISCONNECTED"` 渲染降級 UI，而不是靜默展示過期數字。

### 懶連線

預設掛載即連線。傳 `immediate: false` 等使用者主動觸發：

```tsx
const { status, open, close } = useEventSource("/api/live-scores", [], {
  immediate: false,
});

<button onClick={status === "CONNECTED" ? close : open}>
  {status === "CONNECTED" ? "暫停即時比分" : "開始直播"}
</button>
```

## 每篇 SSE 教學都會撞的牆：鑑權請求標頭

原生 API 的髒祕密來了：`new EventSource(url)` **不能發自訂請求標頭**。沒有 `Authorization: Bearer …`，沒有 `X-Api-Key`，什麼都沒有。原生 API 下你只有兩條路：cookie（`withCredentials: true`）或把 token 塞進查詢字串——前者在現代 cookie 政策下跨域基本沒戲，後者會讓你的 token 出現在瀏覽器到伺服器之間的每一份存取日誌裡。

它也不能 POST。這很要命，因為 2026 年最大的 SSE 消費方——OpenAI 風格的 AI 補全介面——全是 `POST /v1/chat/completions` 加 JSON 請求主體加 bearer token，再以 `text/event-stream` 串流回傳。原生 `EventSource` API 根本呼叫不了它們。

[`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) 用 `fetch` 來說 SSE（基於微軟久經沙場的 [`fetch-event-source`](https://github.com/Azure/fetch-event-source) 解析器），整個請求都由你塑形：

```tsx
import { useFetchEventSource } from "@reactuses/core";

const { data, status, error } = useFetchEventSource("/api/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ model: "gpt-5", messages, stream: true }),
  autoReconnect: { retries: 3, delay: 1000 },
});
```

回傳形狀和 `useEventSource` 完全一致——`data`、`event`、`status`、`error`、`lastEventId`、`open`、`close`——兩者切換是改一行的事，不是重寫。

### 一個 token 一個 token 地串流渲染 AI 回答

`onMessage` 回呼是累積串流補全的天然位置：

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
      if (isRateLimit(err)) return 5000; // 回傳數字 = N 毫秒後重試
    },
  });

  return <Markdown>{text}{status === "CONNECTED" && "▌"}</Markdown>;
}
```

兩個值得偷走的細節：在 `onError` 裡回傳數字可以覆蓋這一次的重連延遲（正好用來做 `Retry-After` 式退避）；函式式更新 `setText(prev => …)` 保證 token 順序在 React 批次處理下不亂。

### 原生還是 fetch 版——怎麼選？

| | [`useEventSource`](https://reactuse.com/browser/useeventsource/) | [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) |
| --- | --- | --- |
| 傳輸層 | 原生 `EventSource` | `fetch` + 串流解析器 |
| 自訂請求標頭 / bearer 鑑權 | ❌ | ✅ |
| 帶請求主體的 POST | ❌ | ✅ |
| 自動 `Last-Event-ID` 續傳 | ✅ 內建 | 交給你的伺服器端 |
| 額外套件體積 | 零 | 小型解析器相依 |
| 什麼時候用 | 同源或 cookie 鑑權的串流 | AI 介面、token 鑑權、請求主體 |

簡單法則：先用 `useEventSource`；哪天你敲出 `Authorization` 這個詞，就換。

## 正式環境筆記

- **SSR 已處理好。** 兩個 hook 都只在 effect 裡碰 `EventSource`/`fetch`，伺服器端渲染毫髮無傷——你的程式碼裡不用寫 `typeof window` 守衛。首屏是 `status: "DISCONNECTED"`，然後用戶端接上。
- **背景分頁要暫停。** 一個被丟在背景的儀表板分頁會一直佔著串流（以及你伺服器的連線預算）。搭配 [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/)，隱藏時 `close()`、回來時 `open()`——`Last-Event-ID` 交握讓續傳很便宜。
- **一個分頁拉串流，其餘收聽。** HTTP/1.1 下瀏覽器對每個來源的並發連線有上限（約 6 個），每個開著 SSE 的分頁都燒掉一個。經典解法：一個分頁持有串流，用 [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) 把訊息廣播出去。（或者上 HTTP/2，串流會多工。）
- **別往死網路裡重連。** [`useNetwork`](https://reactuse.com/browser/usenetwork/) 或更小巧的 [`useOnline`](https://reactuse.com/browser/useonline/) 能告訴你瀏覽器已離線——用它閘控你的重試 UI，別在筆電過隧道的時候燒光重試預算。

## SSE 不是正確工具的時候

- **用戶端要在同一條通道上回話** ——你要*發*訊息的聊天、多人游標、協作編輯。那是雙向的，用 WebSocket。
- **更新很稀疏。** 一小時變幾次的值不配一條常駐連線——輪詢它，或者用你的資料請求函式庫在視窗聚焦時重新拉取。
- **只交付一次資料。** 資料到了回應就結束的，那就是 `fetch`。只有當串流比請求活得久，SSE 才配得上它的開銷。
- **二進位資料。** SSE 是 UTF-8 文字。二進位走 WebSocket 或分塊 `fetch`，別 base64 一遍塞進文字串流。

## 重點回顧

- SSE 是最簡單的即時傳輸：一條長命 HTTP 回應、瀏覽器原生支援、`Last-Event-ID` 自動續傳——所有伺服器到用戶端的推送都適合它。
- [`useEventSource`](https://reactuse.com/browser/useeventsource/) 把命令式的 `EventSource` 生命週期變成可渲染的狀態（`data` / `status` / `error`），代管命名事件監聽器的清理，用你設定的重連策略——`retries`、`delay`、`onFailed`——取代不可見的無限重試。
- 原生 `EventSource` 發不了 `Authorization` 標頭，也發不了 POST 請求主體。[`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) 可以——API 形狀不變，傳輸層換 fetch——這就是串流 AI 補全需要的那塊拼圖。
- `close()` 的意思是*保持關閉*（不再自動重連）；`open()` 重設重試預算。把它們接上可見性和網路狀態，你的串流就是個好公民。

`useEventSource`、`useFetchEventSource` 和其餘 110+ 個 SSR 安全、TypeScript 優先的 hooks 都在 [`@reactuses/core`](https://reactuse.com) 裡——一次安裝，可搖樹，沒有需要你伺候的相依。

```bash
npm install @reactuses/core
```
