---
title: "React 即時同步：跨瀏覽器分頁的狀態管理"
description: "學習如何使用 BroadcastChannel、localStorage 事件和 ReactUse 的 hooks 在 React 中實現跨分頁的狀態同步。"
slug: react-cross-tab-state
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, state-management, broadcast-channel, tutorial]
keywords: [react sync tabs, BroadcastChannel react, cross tab state, react localStorage sync, react multi tab, useBroadcastChannel]
image: /img/og.png
---

# React 即時同步：跨瀏覽器分頁的狀態管理

你的使用者在一個分頁中登出了，但在另一個分頁中，他們仍然可以瀏覽需要認證的內容。他們將主題切換為深色模式，但其他三個分頁依然是淺色。他們在購物車中加入了商品，切換到另一個分頁，卻發現購物車數量顯示為零。這些並不是邊緣情境——這是多分頁瀏覽的日常現實，而大多數 React 應用對此處理得很差，甚至完全沒有處理。

<!-- truncate -->

瀏覽器預設不會在分頁之間共享 React 狀態。每個分頁都執行自己的 JavaScript 環境，擁有自己的元件樹、自己的狀態和自己的記憶體。然而使用者期望的是無縫體驗——當一個分頁中發生變化時，他們期望所有分頁都能立即反映這個變化。

在本文中，我們將探索使跨分頁通訊成為可能的瀏覽器 API，了解手動實作的方式及其問題，然後看看 [ReactUse](https://reactuse.com) 的 hooks 如何將所有這些複雜性簡化為幾行程式碼。

## 兩種用於跨分頁通訊的瀏覽器 API

在使用任何函式庫之前，先了解瀏覽器原生提供了什麼是有幫助的。

### BroadcastChannel API

[BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) 允許你在瀏覽環境（分頁、視窗、iframe）之間傳送訊息，前提是它們屬於同一個來源（origin）。你透過名稱建立一個頻道，任何開啟同名頻道的環境都可以傳送和接收訊息。

```tsx
// 分頁 A
const channel = new BroadcastChannel("my-app");
channel.postMessage({ type: "LOGOUT" });

// 分頁 B
const channel = new BroadcastChannel("my-app");
channel.onmessage = (event) => {
  if (event.data.type === "LOGOUT") {
    // 重新導向到登入頁
  }
};
```

BroadcastChannel 速度快，支援結構化複製（因此你可以傳送物件、陣列甚至 `ArrayBuffer`），而且不涉及持久化儲存，純粹是環境之間的記憶體訊息傳遞。缺點是訊息是即發即棄的——如果傳送訊息時某個分頁沒有開啟，它永遠不會收到這則訊息。

### Storage 事件

當一個分頁寫入 `localStorage` 時，同一來源上的所有*其他*分頁都會收到一個 `storage` 事件。這讓你免費獲得了跨分頁的響應式——但僅限於可序列化為字串的資料，而且只能透過 `localStorage`（不是 `sessionStorage`，後者作用域限於單一分頁）。

```tsx
// 分頁 A 寫入
localStorage.setItem("theme", "dark");

// 分頁 B 監聽
window.addEventListener("storage", (event) => {
  if (event.key === "theme") {
    console.log("主題已變更為：", event.newValue); // "dark"
  }
});
```

Storage 事件有一個重要優勢：資料是持久的。如果使用者在變更之後才開啟新分頁，新分頁在掛載時會從 `localStorage` 讀取目前的值。你同時獲得了響應式和持久化。

## 手動實作——以及為什麼它會變得混亂

讓我們嘗試從零開始建構跨分頁主題同步。我們需要：

1. 從 `localStorage` 讀取初始值。
2. 解析它（`localStorage` 中的所有內容都是字串）。
3. 設定 `storage` 事件監聽器以偵測來自其他分頁的變化。
4. 當本地分頁變更值時，序列化並寫回。
5. 在卸載時清理監聽器。

```tsx
import { useState, useEffect, useCallback } from "react";

function useCrossTabTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem("app-theme");
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  // 監聽來自其他分頁的變化
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === "app-theme" && event.newValue) {
        setThemeState(event.newValue as "light" | "dark");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // 當本地狀態變化時寫入 localStorage
  const setTheme = useCallback((value: "light" | "dark") => {
    setThemeState(value);
    try {
      localStorage.setItem("app-theme", value);
    } catch {
      // 儲存空間已滿或不可用
    }
  }, []);

  return [theme, setTheme] as const;
}
```

對於一個簡單的字串值，就需要大約 30 行程式碼。現在想像一下對認證權杖、使用者偏好、購物車狀態和通知數量都這樣做。每一個都需要自己的序列化邏輯、錯誤處理和清理。而且我們還沒有涉及 BroadcastChannel——如果我們想傳送結構化訊息（不僅僅是鍵值字串），我們需要第二個通訊層，帶有自己的設定和拆除邏輯。

這就是設計良好的 hooks 在不隱藏底層概念的情況下消除樣板程式碼的地方。

## useBroadcastChannel：分頁之間的型別安全訊息傳遞

ReactUse 的 [`useBroadcastChannel`](https://reactuse.com/browser/useBroadcastChannel/) hook 將 BroadcastChannel API 封裝在一個簡潔的宣告式介面中。它處理頻道建立、訊息監聽、卸載時的清理，甚至 SSR 安全——所有這些都在一次呼叫中完成。

```tsx
import { useBroadcastChannel } from "@reactuses/core";

function NotificationSync() {
  const { data, post, error } = useBroadcastChannel<{
    type: string;
    payload?: unknown;
  }>("my-app-notifications");

  // 向所有其他分頁傳送訊息
  const broadcastLogout = () => {
    post({ type: "LOGOUT" });
  };

  // 回應來自其他分頁的訊息
  useEffect(() => {
    if (data?.type === "LOGOUT") {
      // 清除本地認證狀態並重新導向
      authStore.clear();
      window.location.href = "/login";
    }
  }, [data]);

  return <button onClick={broadcastLogout}>全部登出</button>;
}
```

泛型型別參數為訊息形狀提供了完整的 TypeScript 安全性。無需手動序列化——BroadcastChannel 原生使用結構化複製。無需清理程式碼——hook 在元件卸載時關閉頻道。`error` 值讓你可以處理 BroadcastChannel 不受支援的罕見情況。

## useLocalStorage：自動跨分頁同步

對於需要持久化*並且*跨分頁同步的狀態，[`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) 是正確的工具。它的運作方式類似於 `useState`，但值由 `localStorage` 支援，並透過 storage 事件自動在所有分頁之間保持同步。

```tsx
import { useLocalStorage } from "@reactuses/core";

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">(
    "app-theme",
    "light"
  );

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      目前：{theme}
    </button>
  );
}
```

當在一個分頁中呼叫 `setTheme` 時，所有使用相同鍵（`"app-theme"`）執行此 hook 的其他分頁會自動更新。Hook 內部處理 JSON 序列化、初始值回退、SSR 防護和 storage 事件訂閱。你只需寫一行 hook 呼叫；hook 為你撰寫三十行瀏覽器 API 程式碼。

與 [`useSessionStorage`](https://reactuse.com/state/useSessionStorage/) 對比，後者提供相同的 API 但將值限定在目前的分頁。Session storage 不會觸發跨分頁事件，分頁關閉後也不會持久化。當你需要跨分頁同步時選擇 `useLocalStorage`；當你需要分頁隔離的持久化時選擇 `useSessionStorage`。

## 實用模式

### 模式一：同步認證狀態（全端登出）

最關鍵的跨分頁情境之一是認證。當使用者在一個分頁中登出時，所有其他分頁必須立即回應——否則它們可能繼續傳送認證請求，導致靜默失敗或暴露過期資料。

```tsx
import { useBroadcastChannel, useLocalStorage } from "@reactuses/core";

function useAuth() {
  const [token, setToken] = useLocalStorage<string | null>("auth-token", null);
  const { data, post } = useBroadcastChannel<{ type: "LOGOUT" | "LOGIN" }>(
    "auth-channel"
  );

  // 處理來自其他分頁的訊息
  useEffect(() => {
    if (data?.type === "LOGOUT") {
      setToken(null);
      window.location.href = "/login";
    }
  }, [data, setToken]);

  const login = (newToken: string) => {
    setToken(newToken);
    post({ type: "LOGIN" });
  };

  const logout = () => {
    setToken(null);
    post({ type: "LOGOUT" });
    window.location.href = "/login";
  };

  return { token, login, logout, isAuthenticated: token !== null };
}
```

這裡同時使用了兩個 hooks：`useLocalStorage` 持久化權杖並在分頁之間同步，而 `useBroadcastChannel` 傳送即時的命令式訊號來觸發重新導向。透過 localStorage 進行的權杖同步確保在登出*之後*開啟的任何分頁讀取到 `null`。廣播確保在登出*期間*開啟的分頁立即回應。

### 模式二：跨分頁同步主題

```tsx
import { useLocalStorage } from "@reactuses/core";
import { useEffect } from "react";

function useThemeSync() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">(
    "app-theme",
    "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme ?? "light");
  }, [theme]);

  return { theme: theme ?? "light", setTheme };
}
```

因為 `useLocalStorage` 已經處理了跨分頁同步，`useEffect` 會在主題變化時在每個分頁中觸發——保持 DOM 屬性在各處同步。

### 模式三：電商中的購物車狀態

購物車資料是跨分頁同步的經典候選。使用者經常在多個分頁中瀏覽商品，並期望購物車保持一致。

```tsx
import { useLocalStorage } from "@reactuses/core";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

function useCart() {
  const [items, setItems] = useLocalStorage<CartItem[]>("cart-items", []);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const current = prev ?? [];
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        return current.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
  };

  const totalItems = (items ?? []).reduce((sum, i) => sum + i.quantity, 0);

  return { items: items ?? [], addItem, removeItem, totalItems };
}
```

在分頁 A 中加入商品，分頁 B 中的購物車徽標立即更新。無需 WebSocket，無需輪詢，無需伺服器往返。

### 模式四：領導者選舉

有時你只想讓一個分頁執行任務——輪詢 API、維護 WebSocket 連線或執行後台同步。[`useBroadcastChannel`](https://reactuse.com/browser/useBroadcastChannel/) hook 為簡單的領導者選舉協定提供了訊息傳遞層。

```tsx
import { useBroadcastChannel } from "@reactuses/core";
import { useState, useEffect, useRef } from "react";

function useLeaderElection(channelName: string) {
  const [isLeader, setIsLeader] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));
  const { data, post } = useBroadcastChannel<{
    type: "CLAIM" | "HEARTBEAT" | "RELEASE";
    id: string;
  }>(channelName);

  useEffect(() => {
    // 掛載時嘗試取得領導權
    post({ type: "CLAIM", id: idRef.current });
    const timer = setTimeout(() => setIsLeader(true), 200);

    return () => {
      clearTimeout(timer);
      post({ type: "RELEASE", id: idRef.current });
    };
  }, [post]);

  useEffect(() => {
    if (data?.type === "CLAIM" && data.id !== idRef.current) {
      // 另一個分頁正在爭奪——比較 ID 來解決衝突
      if (data.id > idRef.current) {
        setIsLeader(false);
      }
    }
  }, [data]);

  return isLeader;
}
```

只有領導者分頁執行昂貴的操作。當它關閉時，會廣播 `RELEASE` 訊息，另一個分頁接管領導權。

## 最佳化後台分頁

跨分頁同步只是全貌的一部分。當分頁在後台時，你通常希望暫停昂貴的工作——輪詢 API、執行動畫或處理資料。ReactUse 的兩個 hooks 使這變得簡單直接。

### useDocumentVisibility

[`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) 回傳文件的目前可見性狀態——`"visible"` 或 `"hidden"`。用它在分頁不可見時暫停工作。

```tsx
import { useDocumentVisibility } from "@reactuses/core";
import { useEffect, useState } from "react";

function usePolling(url: string, intervalMs: number) {
  const visibility = useDocumentVisibility();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (visibility === "hidden") return; // 在後台停止輪詢

    const fetchData = async () => {
      const res = await fetch(url);
      setData(await res.json());
    };

    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [url, intervalMs, visibility]);

  return data;
}
```

當使用者切換離開分頁時，計時器被清除。當他們切換回來時，新的計時器開始。分頁隱藏時不會浪費網路請求。

### useWindowFocus

[`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) 追蹤瀏覽器視窗本身是否取得了焦點。這比可見性更細微——一個分頁可以是可見的但未取得焦點（例如，當使用者正在與 DevTools 或覆蓋瀏覽器的另一個視窗互動時）。

```tsx
import { useWindowFocus } from "@reactuses/core";

function FocusIndicator() {
  const focused = useWindowFocus();

  return (
    <div>
      {focused
        ? "你正在檢視此分頁"
        : "歡迎回來！"}
    </div>
  );
}
```

結合 `useDocumentVisibility` 和 `useWindowFocus` 可以進行精細控制：當分頁隱藏時暫停非關鍵工作，當分頁可見但未取得焦點時節流次要工作。

## 組合 Hooks：跨分頁通知系統

讓我們將所有內容整合在一起。這是一個通知系統，它在分頁之間廣播提醒，在 localStorage 中持久化未讀計數，並在分頁隱藏時暫停更新。

```tsx
import {
  useBroadcastChannel,
  useLocalStorage,
  useDocumentVisibility,
  useOnline,
} from "@reactuses/core";
import { useEffect, useCallback } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

function useNotificationSync() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>(
    "app-notifications",
    []
  );
  const [unreadCount, setUnreadCount] = useLocalStorage<number>(
    "unread-count",
    0
  );
  const { data, post } = useBroadcastChannel<{
    type: "NEW_NOTIFICATION" | "MARK_READ" | "CLEAR_ALL";
    notification?: Notification;
  }>("notification-channel");
  const visibility = useDocumentVisibility();
  const isOnline = useOnline();

  // 處理來自其他分頁的訊息
  useEffect(() => {
    if (!data) return;

    switch (data.type) {
      case "NEW_NOTIFICATION":
        if (data.notification) {
          setNotifications((prev) => [data.notification!, ...(prev ?? [])]);
          setUnreadCount((prev) => (prev ?? 0) + 1);
        }
        break;
      case "MARK_READ":
        setUnreadCount(0);
        break;
      case "CLEAR_ALL":
        setNotifications([]);
        setUnreadCount(0);
        break;
    }
  }, [data, setNotifications, setUnreadCount]);

  const addNotification = useCallback(
    (title: string, body: string) => {
      const notification: Notification = {
        id: crypto.randomUUID(),
        title,
        body,
        timestamp: Date.now(),
      };
      setNotifications((prev) => [notification, ...(prev ?? [])]);
      setUnreadCount((prev) => (prev ?? 0) + 1);
      post({ type: "NEW_NOTIFICATION", notification });
    },
    [post, setNotifications, setUnreadCount]
  );

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    post({ type: "MARK_READ" });
  }, [post, setUnreadCount]);

  // 當分頁變為可見時自動標記為已讀
  useEffect(() => {
    if (visibility === "visible" && (unreadCount ?? 0) > 0) {
      markAllRead();
    }
  }, [visibility, unreadCount, markAllRead]);

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    addNotification,
    markAllRead,
    isOnline,
  };
}
```

這個 hook 使用了四個 ReactUse hooks 協同運作：

- **`useBroadcastChannel`** 在通知到達或被閱讀時在分頁之間傳送即時訊號。
- **`useLocalStorage`** 持久化通知列表和未讀計數，使新分頁可以取得目前狀態。
- **`useDocumentVisibility`** 在使用者返回後台分頁時自動將通知標記為已讀。
- **`useOnline`**（透過 [`useOnline`](https://reactuse.com/browser/useOnline/)）暴露網路狀態，使 UI 可以在應用離線且通知可能延遲時顯示提示。

每個 hook 處理一個關注點。組合在一起，它們形成了一個完整的系統——具有持久化、即時同步、可見性感知和網路狀態——不到 70 行程式碼。

## 何時使用哪種方案

| 情境 | 推薦的 Hook | 原因 |
|---|---|---|
| 需要跨分頁同步的持久化狀態 | `useLocalStorage` | 資料在重新整理後存活；storage 事件提供同步 |
| 不需要同步的分頁作用域狀態 | `useSessionStorage` | 每個分頁隔離；無跨分頁事件 |
| 即時命令式訊息 | `useBroadcastChannel` | 快速，支援結構化資料，無持久化開銷 |
| 同時需要持久化和即時訊息 | `useLocalStorage` + `useBroadcastChannel` | 兩全其美：為新分頁持久化，為已開啟的分頁廣播 |
| 暫停後台工作 | `useDocumentVisibility` / `useWindowFocus` | 減少不必要的運算和網路請求 |

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

- [`useBroadcastChannel`](https://reactuse.com/browser/useBroadcastChannel/) — 透過 BroadcastChannel API 實現型別安全的跨分頁訊息傳遞
- [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) — 具有自動跨分頁同步的持久化狀態
- [`useSessionStorage`](https://reactuse.com/state/useSessionStorage/) — 分頁作用域的持久化狀態
- [`useDocumentVisibility`](https://reactuse.com/element/useDocumentVisibility/) — 追蹤目前分頁是否可見
- [`useWindowFocus`](https://reactuse.com/element/useWindowFocus/) — 追蹤瀏覽器視窗是否取得焦點
- [`useEventListener`](https://reactuse.com/effect/useEventListener/) — 宣告式事件監聽器管理，自動清理
- [`useOnline`](https://reactuse.com/browser/useOnline/) — 響應式網路連線狀態

ReactUse 提供了 100+ 個 React hooks。[探索全部 →](https://reactuse.com)
