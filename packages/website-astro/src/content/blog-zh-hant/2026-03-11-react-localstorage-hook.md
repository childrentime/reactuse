---
title: "如何在 React 中使用 localStorage Hook 持久化狀態"
description: "學習如何使用 useLocalStorage hook 將 React 狀態持久化到 localStorage。涵蓋自動序列化、SSR 安全性、跨分頁同步和自訂序列化器。"
slug: react-localstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, useLocalStorage, state-management]
keywords: [react localstorage hook, useLocalStorage react, persist state react, react localstorage]
image: /img/og.png
---

# 如何在 React 中使用 localStorage Hook 持久化狀態

React localStorage hook 是一個自訂 hook，它將 React 元件狀態與瀏覽器的 `localStorage` API 同步，允許資料在頁面重新載入和瀏覽器工作階段之間持久化。它不需要手動讀取、寫入和解析儲存的值，而是提供類似 `useState` 的介面，自動處理序列化、錯誤恢復和 SSR 安全性。

<!-- truncate -->

## 問題所在

React 狀態是短暫的。當使用者重新整理頁面或關閉瀏覽器分頁時，任何儲存在 `useState` 中的狀態都會遺失。對於使用者偏好設定、表單草稿、購物車項目或驗證令牌等內容來說，這是糟糕的體驗。

瀏覽器的 `localStorage` API 提供了一個簡單的持久化層，但將它與 React 整合會帶來幾個挑戰：

1. 值必須被序列化和反序列化（localStorage 只儲存字串）
2. 在伺服器端渲染期間從 localStorage 讀取會導致錯誤
3. 保持 React 狀態和 localStorage 同步需要仔細的 effect 管理
4. 多個分頁可以修改同一個鍵，導致過期的狀態

## 手動方式

以下是開發者通常手動連接 localStorage 持久化的方式：

```tsx
import { useEffect, useState } from "react";

function useManualLocalStorage(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return defaultValue;
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

這涵蓋了基本情況，但仍有缺口。它不處理序列化錯誤，不監聽透過 `storage` 事件的跨分頁變更，不支援複雜資料類型的自訂序列化器，並且你需要在每個需要持久化的地方複製這段邏輯。

## 更好的方式：useLocalStorage

[ReactUse](https://reactuse.com) 提供了一個 `useLocalStorage` hook，在單一匯入中處理以上所有問題：

```tsx
import { useLocalStorage } from "@reactuses/core";

function ThemeSettings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>Dark Mode</button>
      <button onClick={() => setTheme("light")}>Light Mode</button>
    </div>
  );
}
```

這個 hook 回傳一個與 `useState` 相同的元組 -- 一個當前值和一個設定函式。在底層，它在掛載時從 localStorage 讀取，在每次更新時寫入，並在 SSR 期間或 localStorage 不可用時優雅地回退到預設值。

它適用於字串、數字、布林值和物件。類型推斷是自動的：

```tsx
import { useLocalStorage } from "@reactuses/core";

// Type is inferred as number | null
const [count, setCount] = useLocalStorage("visit-count", 0);

// Type is inferred as boolean | null
const [accepted, setAccepted] = useLocalStorage("cookie-consent", false);

// Type is inferred as { name: string; role: string } | null
const [user, setUser] = useLocalStorage("user", { name: "", role: "viewer" });
```

## 進階用法

### 自訂序列化器

預設情況下，`useLocalStorage` 使用 `JSON.parse` 和 `JSON.stringify`。如果你需要以不同格式儲存資料 -- 例如日期或自訂類別 -- 你可以提供自訂序列化器：

```tsx
import { useLocalStorage } from "@reactuses/core";

const [lastVisit, setLastVisit] = useLocalStorage("last-visit", new Date(), {
  serializer: {
    read: (raw: string) => new Date(raw),
    write: (value: Date) => value.toISOString(),
  },
});
```

### 跨分頁同步

hook 預設會監聽瀏覽器的 `storage` 事件，所以如果使用者在一個分頁中更新了值，所有其他開啟的分頁會立即反映變更。你可以在需要時停用此功能：

```tsx
const [token, setToken] = useLocalStorage("auth-token", "", {
  listenToStorageChanges: false,
});
```

### SSR 安全性

因為 `useLocalStorage` 在存取 `localStorage` 之前會檢查瀏覽器可用性，它可以直接與 Next.js、Remix 和任何其他 SSR 框架搭配使用。在伺服器渲染期間，hook 會回傳預設值而不會拋出錯誤。

### 錯誤處理

如果 localStorage 已滿、被瀏覽器策略封鎖或包含損壞的資料，hook 會優雅地捕獲錯誤。你可以提供自訂的錯誤處理函式：

```tsx
const [data, setData] = useLocalStorage("app-data", null, {
  onError: (error) => {
    console.warn("Storage error:", error);
    // Send to your error tracking service
  },
});
```

## 常見使用情境

- **主題和外觀偏好** -- 跨工作階段持久化深色/淺色模式
- **表單草稿** -- 儲存進行中的表單資料，讓使用者在重新整理時不會遺失工作
- **驗證令牌** -- 在頁面載入之間儲存 JWT 或工作階段令牌
- **功能旗標和引導狀態** -- 記住使用者已關閉的工具提示
- **購物車內容** -- 不需要後端就能保持購物車項目完整
- **語言和地區設定** -- 記住使用者偏好的語言

## 安裝

```bash
npm i @reactuses/core
```

然後匯入 hook：

```tsx
import { useLocalStorage } from "@reactuses/core";
```

## 相關 Hooks

- [useLocalStorage 文件](https://reactuse.com/state/uselocalstorage/) -- 完整 API 參考和即時範例
- [useSessionStorage](https://reactuse.com/state/usesessionstorage/) -- 相同的 API，但資料在分頁關閉時清除

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
