---
title: "React useEventSource Hook: Server-Sent Events with Auto-Reconnect (2026)"
description: "A practical guide to Server-Sent Events in React with useEventSource: live data streams over plain HTTP with automatic reconnection, typed named events, and connection status — no WebSocket library. Covers the wire format, the hand-rolled EventSource pitfalls, and useFetchEventSource for the two things native EventSource can't do: auth headers and POST bodies (the shape every AI streaming API uses). TypeScript-first, SSR-safe."
slug: react-useeventsource-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-12
tags: [react, hooks, browser, typescript, tutorial]
keywords: [react useeventsource, useeventsource, useEventSource hook, server sent events react, sse react, react sse hook, eventsource react, react eventsource hook, fetch-event-source react, usefetcheventsource, sse auto reconnect, text/event-stream react, stream ai response react, react streaming hook, sse vs websocket]
image: /img/og.png
---

# React useEventSource Hook: Server-Sent Events with Auto-Reconnect (2026)

Live notifications, deployment logs, stock tickers, AI responses streaming in token by token — none of these need a WebSocket. They're all one-directional: the server talks, the client listens. The browser has had a native protocol for exactly this since 2011 — **Server-Sent Events (SSE)** — and it runs over plain HTTP, passes through proxies and load balancers untouched, and reconnects automatically when the connection drops.

What SSE *doesn't* have is a good React story. The native `EventSource` API is imperative: you construct it, attach listeners, and must tear it down at exactly the right moment — the classic effect-lifecycle minefield. [`useEventSource`](https://reactuse.com/browser/useeventsource/) from [`@reactuses/core`](https://reactuse.com) turns the whole thing into declarative state: `data`, `status`, and `error` your component just renders. This post covers the hook's full API, the reconnect behavior that native `EventSource` gets subtly wrong, and [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) — the fetch-based variant you'll need the moment your stream requires an `Authorization` header or a POST body, which in 2026 means every AI-completions endpoint.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useEventSource } from "@reactuses/core";

function DeploymentLog() {
  const { data, status } = useEventSource("/api/deploy/stream");

  return (
    <div>
      <span>{status === "CONNECTED" ? "🟢 live" : "🟡 connecting…"}</span>
      <pre>{data}</pre>
    </div>
  );
}
```

That's a complete live-updating component. The hook opens the connection on mount, updates `data` on every message, exposes the connection lifecycle as `status` (`"CONNECTING" | "CONNECTED" | "DISCONNECTED"`), and closes the stream when the component unmounts. No refs, no listeners, no cleanup function to forget.

## What SSE Actually Is (60 Seconds)

Server-Sent Events is just an HTTP response that never finishes. The server replies with `Content-Type: text/event-stream` and writes messages as plain text, separated by blank lines:

```text
data: {"price": 101.42}
id: 7

event: trade
data: {"symbol": "ACME", "qty": 200}
id: 8
```

Three field types matter:

- `data:` — the payload (always a string; JSON-encode structured data yourself).
- `event:` — an optional event *name*, so one stream can carry multiple channels.
- `id:` — an optional event ID. The browser remembers the last one and sends it back as a `Last-Event-ID` header when it reconnects, so a well-built server can resume where the client left off.

Because it's plain HTTP, SSE works through corporate proxies, CDNs, and HTTP/2 multiplexing without the upgrade-handshake drama WebSockets sometimes hit. The trade-off: it's server → client only, and the native browser API can only send GET requests with no custom headers. Keep that limitation in mind — it's the reason the second hook in this post exists.

## The Manual Way — and Where It Bites

Wiring `EventSource` by hand looks manageable:

```tsx
// ⚠️ hand-rolled — three bugs waiting to happen
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

The problems show up in production, not in the demo:

1. **Reconnect is infinite and invisible.** When the server drops the connection, `EventSource` retries forever, silently. If your API is down, every open tab hammers it every few seconds until the heat death of the universe — and you have no state telling the UI "we're offline" so you can show a banner or give up.
2. **Errors are opaque.** `onerror` gives you a bare `Event` — no status code, no reason. If you don't track connection state yourself, your UI happily shows stale data as if it were live.
3. **Named events need manual bookkeeping.** Every `event: trade` line requires its own `addEventListener("trade", …)` *and* a matching `removeEventListener` in cleanup. Miss one and you leak listeners across React 18 StrictMode's mount-unmount-mount cycle.

None of this is hard, exactly. It's just easy to get 90% right — which is the worst kind of wrong.

## The useEventSource API

Everything the manual version does badly, as returned state:

```tsx
const { data, event, status, error, lastEventId, open, close, eventSourceRef } =
  useEventSource(url, events?, options?);
```

- **`data: string | null`** — payload of the most recent message.
- **`event: string | null`** — the name of the last *named* event received (see below).
- **`status`** — `"CONNECTING" | "CONNECTED" | "DISCONNECTED"`. Render it; that's your live-indicator.
- **`error: Event | null`** — the last connection error, cleared on successful reconnect.
- **`lastEventId: string | null`** — the `id:` field of the last message, i.e. your resume cursor.
- **`open()` / `close()`** — manual control. `close()` is *explicit*: it also disables auto-reconnect, so "user clicked pause" stays paused. `open()` reconnects and resets the retry counter.
- **`eventSourceRef`** — escape hatch to the raw `EventSource` instance if you need it.

### Named events, declaratively

Pass the event names you care about as the second argument, and the hook registers — and cleans up — every listener for you:

```tsx
const { data, event } = useEventSource("/api/stream", ["trade", "quote"]);

// event === "trade" | "quote" | null — which channel data came from
useEffect(() => {
  if (event === "trade") appendTrade(JSON.parse(data!));
}, [data, event]);
```

### Auto-reconnect with a budget

The `autoReconnect` option replaces `EventSource`'s silent infinite retry with a policy you choose:

```tsx
const { status } = useEventSource("/api/notifications", [], {
  autoReconnect: {
    retries: 5,        // give up after 5 attempts (or pass a () => boolean)
    delay: 2000,       // wait 2s between attempts
    onFailed: () => toast.error("Live updates unavailable — refresh to retry"),
  },
});
```

`retries` defaults to `-1` (retry forever, matching native behavior), but now it's a *decision* rather than a surprise, and `onFailed` gives you the moment to tell the user. Pair it with `status === "DISCONNECTED"` to render a degraded-mode UI instead of silently stale numbers.

### Connect lazily

By default the hook connects on mount. Pass `immediate: false` to wait for user intent:

```tsx
const { status, open, close } = useEventSource("/api/live-scores", [], {
  immediate: false,
});

<button onClick={status === "CONNECTED" ? close : open}>
  {status === "CONNECTED" ? "Pause live scores" : "Go live"}
</button>
```

## The Wall Every SSE Tutorial Hits: Auth Headers

Here is the native API's dirty secret: `new EventSource(url)` **cannot send custom headers**. No `Authorization: Bearer …`, no `X-Api-Key`, nothing. Your options with the native API are cookies (`withCredentials: true`) or a token in the query string — one of which doesn't work cross-domain with modern cookie policies, and the other of which lands your token in every access log between the browser and your server.

It also can't POST. That matters because the biggest SSE consumers of 2026 — OpenAI-style AI completion endpoints — are all `POST /v1/chat/completions` with a JSON body and a bearer token, streaming back `text/event-stream`. The native `EventSource` API literally cannot call them.

[`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) solves this by speaking SSE over `fetch` (built on Microsoft's battle-tested [`fetch-event-source`](https://github.com/Azure/fetch-event-source) parser), which means the full request is yours to shape:

```tsx
import { useFetchEventSource } from "@reactuses/core";

const { data, status, error } = useFetchEventSource("/api/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ model: "gpt-5", messages, stream: true }),
  autoReconnect: { retries: 3, delay: 1000 },
});
```

Same return shape as `useEventSource` — `data`, `event`, `status`, `error`, `lastEventId`, `open`, `close` — so switching between the two is a one-line change, not a rewrite.

### Streaming an AI response, token by token

The `onMessage` callback is the natural place to accumulate a streamed completion:

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
      if (isRateLimit(err)) return 5000; // return a number = retry after N ms
    },
  });

  return <Markdown>{text}{status === "CONNECTED" && "▌"}</Markdown>;
}
```

Two details worth stealing: returning a number from `onError` overrides the reconnect delay for that attempt (perfect for `Retry-After`-style backoff), and the functional `setText(prev => …)` update means token order survives React's batching.

### Native or fetch-based — which one?

| | [`useEventSource`](https://reactuse.com/browser/useeventsource/) | [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) |
| --- | --- | --- |
| Transport | native `EventSource` | `fetch` + stream parser |
| Custom headers / bearer auth | ❌ | ✅ |
| POST with body | ❌ | ✅ |
| Auto `Last-Event-ID` resume | ✅ built-in | your server's job |
| Extra bundle weight | zero | small parser dependency |
| Reach for it when… | same-origin or cookie-auth streams | AI APIs, token auth, request bodies |

Simple rule: start with `useEventSource`; the moment you type the word `Authorization`, switch.

## Production Notes

- **SSR is handled.** Both hooks touch `EventSource`/`fetch` only inside effects, so they render harmlessly on the server — no `typeof window` guards in your code. First paint shows `status: "DISCONNECTED"`, then the client connects.
- **Pause hidden tabs.** A dashboard left open in a background tab keeps its stream (and your server's connection budget) alive. Combine with [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) to `close()` when hidden and `open()` on return — the `Last-Event-ID` handshake makes resume cheap.
- **One tab streams, the rest listen.** Browsers cap concurrent connections per origin over HTTP/1.1 (~6), and every open tab with an SSE stream burns one. The classic fix: hold the stream in one tab and fan messages out with [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/). (Or serve over HTTP/2, where streams multiplex.)
- **Don't reconnect into a dead network.** [`useNetwork`](https://reactuse.com/browser/usenetwork/) or the smaller [`useOnline`](https://reactuse.com/browser/useonline/) tells you the browser is offline — gate your retry UI on it instead of burning the retry budget while the laptop is in a tunnel.

## When SSE Is the Wrong Tool

- **The client needs to talk back on the same channel** — chat where you *send* messages, multiplayer cursors, collaborative editing. That's bidirectional; use a WebSocket.
- **Updates are rare.** A value that changes a few times an hour doesn't justify a held-open connection — poll it, or refetch on focus with your data library.
- **You're delivering one payload.** If the response ends when the data arrives, that's just `fetch`. SSE earns its keep only when the stream outlives the request.
- **Binary data.** SSE is UTF-8 text. Ship binary over WebSocket or chunked `fetch` instead of base64-ing it through a text stream.

## Takeaways

- SSE is the simplest real-time transport: one long-lived HTTP response, native browser support, automatic resume via `Last-Event-ID` — right for every server-to-client feed.
- [`useEventSource`](https://reactuse.com/browser/useeventsource/) turns the imperative `EventSource` lifecycle into rendered state (`data` / `status` / `error`), handles named-event listener cleanup, and replaces invisible infinite retry with a reconnect policy you set — `retries`, `delay`, `onFailed`.
- Native `EventSource` can't send an `Authorization` header or a POST body. [`useFetchEventSource`](https://reactuse.com/browser/usefetcheventsource/) can — same API shape, fetch-based transport — and it's the piece you need for streaming AI completions.
- `close()` means *stay closed* (no auto-reconnect); `open()` resets the retry budget. Wire them to visibility and network state for streams that behave like a good citizen.

`useEventSource`, `useFetchEventSource`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
