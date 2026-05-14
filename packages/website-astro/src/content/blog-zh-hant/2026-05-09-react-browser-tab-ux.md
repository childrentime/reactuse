---
title: "React 瀏覽器標籤頁 UX：用標題、Favicon 和通知把用戶拉回來"
description: "用 ReactUse 中的 useTitle、useFavicon、useDocumentVisibility、useWindowFocus、usePageLeave、usePermission 和 useWebNotification 構建注意力感知的 React UI——動態標籤標題、狀態化 favicon、頁面隱藏時暫停、聚焦時刷新、原生系統通知。"
slug: react-browser-tab-ux
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-09
tags: [react, hooks, browser, ux, tutorial]
keywords: [react browser tab ux, useTitle, useFavicon, useDocumentVisibility, useWindowFocus, usePageLeave, useWebNotification, usePermission, react document title, react tab notifications, react attention ux]
image: /img/og.png
---

# React 瀏覽器標籤頁 UX：用標題、Favicon 和通知把用戶拉回來

普通用戶筆記本上隨時開著三十個標籤頁，你的應用只是其中一個。用戶打開它，切去看 Slack，十五分鐘後回來，已經分不清哪一個標籤頁是你的。如果你的標籤標題還停在"My App"，favicon 還是上線那天的灰色方塊，那十五分鐘就白白浪費了——其間來過新消息、構建完成、上傳成功，用戶卻完全不知道。

<!-- truncate -->

瀏覽器其實給了你一塊雖小但很有威力的"注意力表面"：標籤標題、favicon、可見狀態、聚焦事件，以及系統級通知。把它們接對了，一個非活動標籤可以在標籤欄裡顯示"(3) New messages — Acme Chat"，favicon 上閃一個紅點，隱藏時停掉昂貴的輪詢，回到前臺時立刻刷新，緊急情況還能彈一條原生 OS 通知。接錯了，這堆代碼會洩漏事件監聽器、跟 React 的渲染週期打架、首次 SSR 就拋 hydration 不一致。

本文走過六個在 React 中構建注意力感知 UI 的原語，每一個都用 [ReactUse](https://reactuse.com) 中專門的 Hook 實現。我們先看手動寫法、踩到的坑，再看 Hook 是怎麼把它們藏起來的。最後把六個 Hook 合在一起，做出一個像原生 App 一樣會"叫人"的聊天標籤頁。

## 1. 把標籤標題當作通知通道

`<title>` 元素是 Web 上被低估得最嚴重的通知表面。Gmail、GitHub、Linear、Discord 都在用：開頭的 `(N)` 計數或一個 `•` 圓點告訴你"出事了"，而你不必切回標籤頁確認。實現是一行——`document.title = "..."`——但放進 React 組件裡寫法不對，標題就會一直停在最後一次渲染設置的值上，連組件卸載之後都不會復原。

### 手動實現

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

肉眼不太容易抓到的 bug 在這裡：`previous` 捕獲的是 effect 運行那一刻的標題，意味著如果父組件在兩次渲染之間也改了標題，cleanup 會把一個過時的值再寫回去。修法要麼是給標題選一個唯一的真值來源，要麼乾脆別 cleanup，讓下一次渲染覆蓋。多數應用走第二條路，然後忘了寫 cleanup，半年之後接進 React StrictMode、effect 跑兩次，標題就卡死在某個舊值上。

### ReactUse 寫法：useTitle

[`useTitle`](https://reactuse.com/browser/usetitle/) 接受一個字符串，每當字符串變化就同步到 `document.title`：

```tsx
import { useTitle } from "@reactuses/core";

function UnreadTitle({ count }: { count: number }) {
  useTitle(count > 0 ? `(${count}) Acme Chat` : "Acme Chat");
  return null;
}
```

整個組件就這麼多。Hook 訂閱的是它自己的輸入，而不是上一次的 DOM 值，所以不可能出現"清理寫回舊值"的 bug。把它丟在樹裡任何位置——通常是頁面根部，或者持有未讀數的那個組件——標題就會隨著數據變。

一個常見的搭配是把它和聊天 store 中派生出的未讀數組合起來：

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

這個組件不渲染任何視覺元素，存在的唯一理由就是把 store 同步到標題上。在應用頂部掛一次就好。

## 2. 狀態化的 Favicon

Favicon 比標題佔的位置還要小——十六像素見方——但它是標題被截斷時用戶在標籤欄裡唯一能看到的東西。根據狀態切換 favicon（idle 灰、attention 紅、error 橙、success 綠）是瀏覽器裡最廉價的 UX 之一。

### 手動實現

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

正常路徑下能跑，壞在三種情況下：根本沒有 `<link rel="icon">`（有些打包器會把它去掉）、有多個不同尺寸的 icon link（Apple touch icon、manifest icon）、SSR 渲染的 icon 和客戶端要的不一樣。最後會寫成一堆分支。

### ReactUse 寫法：useFavicon

[`useFavicon`](https://reactuse.com/browser/usefavicon/) 把這三種情況都照顧了。它會更新所有匹配 `link[rel*="icon"]` 的標籤，找不到就自己創建一個，同時支持 base URL 前綴（用於 CDN 資源）。

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

一個有意思的玩法是把它和未讀數結合，做出"帶角標的 favicon"。預先生成幾張 PNG（`favicon-1.png` 到 `favicon-9.png`，再加 `favicon-9plus.png`），按數量挑一張：

```tsx
import { useFavicon } from "@reactuses/core";

function BadgedFavicon({ count }: { count: number }) {
  const variant =
    count === 0 ? "" : count > 9 ? "-9plus" : `-${count}`;
  useFavicon(`/favicon${variant}.png`);
  return null;
}
```

這樣即使標題被截斷，標籤欄裡也能看到帶數字的 favicon。

## 3. 標籤隱藏時暫停昂貴的工作

每個應用至少有一個不該在用戶看不到時還在跑的輪詢、動畫或視頻。瀏覽器會節流後臺標籤，但節流不等於停止——一個原本 1 秒的輪詢變成 60 秒，仍然在打服務器、解析 JSON、改 state、觸發一次沒人看到的渲染。Page Visibility API 讓你能幹淨地暫停。

### 手動實現

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

兩個問題。一是服務器端 `document` 是 undefined，初始 state 直接把 SSR 弄崩。二是 `visibilitychange` 在首次繪製時不會觸發——如果用戶進站時你的頁面就是後臺標籤，初次的 `document.hidden` 是對的，但等到聚焦回來你就不會再讀它一次。

### ReactUse 寫法：useDocumentVisibility

[`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) 用一個 `defaultValue` 參數處理 SSR，並在掛載之後再同步一次。

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

Tab 可見時掛 interval、隱藏時卸載、回來再重新掛。沒有"被節流但還在跑"的輪詢，沒有浪費的帶寬，用戶切回來那一刻就能看到最新價格。

Hook 返回的是真正的 `DocumentVisibilityState`（`'visible'` | `'hidden'`），而不是布爾值，跟規範保持一致，將來規範擴出 `'prerender'` 這種狀態也能直接接入。

## 4. 聚焦時刷新

`visibilitychange` 在標籤從隱藏變成可見時觸發，但"可見"不等於"被聚焦"——畫中畫、左右分屏、或者你的標籤是後臺窗口裡的前景標籤都屬於這種情況。如果你想要的是"用戶剛剛切回我"，那應該用 window focus，而不是 visibility。

### 手動實現

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

跟前面一樣的故事——三個事件監聽器、一次初始讀取、一個 SSR 的坑。

### ReactUse 寫法：useWindowsFocus

[`useWindowFocus`](https://reactuse.com/element/usewindowfocus/)（導出名是 `useWindowsFocus`，遺留命名保留了下來）返回一個布爾值，並在掛載時再同步一次。

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

每次用戶切回這個窗口，feed 就重新拉取一次。和 `useDocumentVisibility` 配合：隱藏時停掉輪詢，重新聚焦時拉一次新數據，"長時間離開"和"快速一瞥"這兩種情況都被覆蓋。

## 5. 在用戶離開之前抓住他

`usePageLeave` 在鼠標移出視口時觸發——通常是朝著標籤欄或地址欄移動，往往是用戶準備切走的先兆。這是"離開意圖"浮層的基礎。這種模式被廣告彈窗用濫了名聲不太好，但用在"你有未保存的改動"提示或"走之前看看你錯過了什麼"上是有用的。

```tsx
import { usePageLeave } from "@reactuses/core";

function UnsavedHint({ dirty }: { dirty: boolean }) {
  const isLeaving = usePageLeave();
  if (!dirty || !isLeaving) return null;
  return (
    <div className="toast">
      你有未保存的改動。按 ⌘S 保存。
    </div>
  );
}
```

Hook 監聽 `mouseout`、`mouseleave`、`mouseenter`，光標越過視口邊緣時翻轉布爾值。用得節制一點——每一個在你出門時塞過"等等，再看一眼！"模態框的網站，都是在提醒：這個模式從有用變到討厭只需要一步。

更剋制的版本：和"表單是否髒"配合，只有真正有東西要丟失時才提示。

## 6. 原生通知——先看權限

Notification API 是這一切表面裡唯一徹底逃出瀏覽器的：原生 OS 通知即使你的標籤被埋在最深處、窗口被最小化、用戶在另一個 App 裡，都能彈出。它也是唯一一個明確需要用戶授權的，把授權 UX 做錯就是把"deny"刻在瀏覽器設置裡最快的捷徑。

這裡成對使用的兩個 Hook 是 `usePermission` 和 `useWebNotification`。

### 在請求之前先看狀態

[`usePermission`](https://reactuse.com/browser/usepermission/) 包裝了 Permissions API，針對任意權限名返回當前狀態——`'granted'`、`'denied'`、`'prompt'`，或者 API 不支持時返回空。用它來決定是渲染"開啟通知"按鈕（狀態是 `'prompt'`）、"已開啟"指示（`'granted'`），還是"通知被禁用——去瀏覽器設置修復"鏈接（`'denied'`）。

```tsx
import { usePermission } from "@reactuses/core";

function NotificationStatus() {
  const state = usePermission("notifications");
  if (state === "granted") return <span>通知：已開啟</span>;
  if (state === "denied") return <a href="#help">通知被禁用——前往修復</a>;
  return null;
}
```

### 僅在用戶主動操作時再請求

[`useWebNotification`](https://reactuse.com/browser/usewebnotification/) 返回 `isSupported`、`show`、`close` 和 `ensurePermissions`。Notification API 的鐵律：**不要**在頁面加載時就調 `Notification.requestPermission()`。瀏覽器把權限提示作為標籤級 chrome 彈窗顯示，在用戶跟你的頁面發生交互之前就彈出來，是教科書級的"反射性拒絕"UX。

放到一個按鈕點擊裡再觸發：

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
          show("已開啟", {
            body: "我們會在這裡通知你新消息。",
            icon: "/favicon.ico",
          });
        }
      }}
    >
      開啟桌面通知
    </button>
  );
}
```

一旦用戶授權，從應用的任何地方調用 `show(title, options)` 就能彈原生通知。Hook 在卸載時會關掉當前通知，所以觸發後立刻卸載的組件不會留下永久掛著的通知。

## 全部組合：一個注意力感知的聊天標籤頁

把六個原語都接上之後，一個聊天標籤頁大致是這樣的：未讀數同時更新標題和 favicon；輪詢在隱藏時暫停、在重新聚焦時刷新；草稿未保存時觸發離開提示；後臺來新消息時彈原生通知。

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

  // 1 + 2: 標題和 favicon 反映未讀數
  useTitle(unread > 0 ? `(${unread}) ${channel} — Acme` : `${channel} — Acme`);
  const variant = unread === 0 ? "" : unread > 9 ? "-9plus" : `-${unread}`;
  useFavicon(`/favicon${variant}.png`);

  // 3: 隱藏時暫停輪詢
  const visibility = useDocumentVisibility("visible");
  useEffect(() => {
    if (visibility === "hidden") return;
    const id = setInterval(fetchFeed, 5000);
    return () => clearInterval(id);
  }, [visibility, fetchFeed]);

  // 4: 聚焦時全量刷新
  const focused = useWindowsFocus();
  useEffect(() => {
    if (focused) fetchFeed();
  }, [focused, fetchFeed]);

  // 5: 有未保存草稿時給離開提示
  const isLeaving = usePageLeave();

  // 6: 後臺收到新消息時彈原生通知
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
        <Toast>你有一條未保存的草稿。</Toast>
      )}
      {!isSupported || (
        <button onClick={ensurePermissions}>開啟桌面通知</button>
      )}
    </>
  );
}
```

六個 Hook，一個組件，沒有手寫的事件監聽器，沒有 SSR 崩潰，沒有洩漏的 timer。每一行注意力管理邏輯都和它服務的聊天功能貼在一起，下一個讀這個文件的人一眼就知道去哪兒改。

## 小結

| Hook | 用途 | 何時需要 |
| --- | --- | --- |
| [`useTitle`](https://reactuse.com/browser/usetitle/) | 把字符串同步到 `document.title` | 未讀數、構建狀態、文檔名 |
| [`useFavicon`](https://reactuse.com/browser/usefavicon/) | 響應式切換 favicon `href` | 狀態徽標、提醒紅點、品牌化狀態 |
| [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) | 跟蹤標籤隱藏/可見 | 暫停輪詢、動畫、視頻 |
| [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) | 跟蹤窗口焦點 | 回來時刷新、失焦時暫停 |
| [`usePageLeave`](https://reactuse.com/browser/usepageleave/) | 檢測光標離開視口 | 離開意圖提示、未保存草稿警告 |
| [`usePermission`](https://reactuse.com/browser/usepermission/) | 讀取 Permissions API 狀態 | 通知/定位等條件化 CTA |
| [`useWebNotification`](https://reactuse.com/browser/usewebnotification/) | 顯示原生 OS 通知 | 後臺消息提醒、構建完成提示 |

瀏覽器標籤頁 UX 是那種"好應用"和"出色應用"之間差距很小、感受差距很大的領域。六個 Hook、二十行膠水代碼，你的應用就開始有了那些跟它爭奪注意力的原生應用的"行為感"。在 [reactuse.com](https://reactuse.com) 瀏覽完整目錄——明天上線了哪一個，給我們扔張截圖。
