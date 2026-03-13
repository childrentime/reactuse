---
title: "每個 React 開發者都需要的 10 個瀏覽器 API Hooks"
description: "學習如何在 React 中使用瀏覽器 API，包括地理定位、剪貼簿、全螢幕、媒體查詢等，透過 ReactUse 提供的乾淨、可重複使用的 hooks。"
slug: react-browser-api-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, browser-api, tutorial]
keywords: [react browser api hooks, react geolocation hook, react clipboard hook, react fullscreen hook, react media query hook, useMediaQuery react, useClipboard react, useGeolocation react]
image: /img/og.png
date: 2026-03-13
---

# 每個 React 開發者都需要的 10 個瀏覽器 API Hooks

現代瀏覽器提供了強大的 API，用於地理定位、剪貼簿存取、全螢幕模式、網路狀態等。但直接在 React 中使用它們比預期的更困難。你需要防護伺服器端渲染、新增和移除事件監聽器、處理權限，以及在卸載時清理。將這些乘以你的應用程式觸及的每個瀏覽器 API，你就會有大量重複且容易出錯的程式碼。

<!-- truncate -->

ReactUse 透過一個擁有 100+ 個 hooks 的函式庫來解決這個問題，將瀏覽器 API 包裝成乾淨、SSR 安全、TypeScript 友好的介面。以下列出的每個 hook 都會在存取任何 API 之前檢查瀏覽器可用性，因此可以直接與 Next.js、Remix 和任何其他 SSR 框架搭配使用。安裝一次，匯入你需要的：

```bash
npm i @reactuses/core
```

## 1. useMediaQuery -- 響應式設計

在 JavaScript 中回應 CSS 媒體查詢。hook 回傳一個布林值，在視窗變更時即時更新。

```tsx
import { useMediaQuery } from "@reactuses/core";

function App() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return <div>{isMobile ? <MobileNav /> : <DesktopNav />}</div>;
}
```

用它來條件渲染佈局、載入不同資源，或根據螢幕大小切換功能，不僅僅依賴 CSS。

## 2. useClipboard -- 複製到剪貼簿

使用現代 Clipboard API 讀寫系統剪貼簿。hook 處理權限、HTTPS 需求和焦點狀態邊界情況。

```tsx
import { useClipboard } from "@reactuses/core";

function CopyButton({ text }: { text: string }) {
  const [clipboardText, copy] = useClipboard();

  return (
    <button onClick={() => copy(text)}>
      {clipboardText === text ? "Copied!" : "Copy"}
    </button>
  );
}
```

回傳的 `copy` 函式是非同步的並回傳一個 Promise，所以你可以輕鬆新增成功和錯誤回饋。

## 3. useGeolocation -- 使用者位置

追蹤使用者的地理座標，並在卸載時自動清理 `watchPosition` 監聽器。

```tsx
import { useGeolocation } from "@reactuses/core";

function LocationDisplay() {
  const { coordinates, error, isSupported } = useGeolocation();

  if (!isSupported) return <p>Geolocation is not supported.</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <p>
      Lat: {coordinates.latitude}, Lng: {coordinates.longitude}
    </p>
  );
}
```

hook 回傳 `coordinates`、`locatedAt`（時間戳）、`error` 和 `isSupported`，讓你可以在 UI 中處理每種狀態。

## 4. useFullscreen -- 全螢幕模式

在任何元素上切換全螢幕。hook 包裝了 Fullscreen API 並回傳當前狀態及控制函式。

```tsx
import { useRef } from "react";
import { useFullscreen } from "@reactuses/core";

function VideoPlayer() {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, { enterFullscreen, exitFullscreen, toggleFullscreen }] =
    useFullscreen(ref);

  return (
    <div ref={ref}>
      <video src="/demo.mp4" />
      <button onClick={toggleFullscreen}>
        {isFullscreen ? "Exit" : "Fullscreen"}
      </button>
    </div>
  );
}
```

它還暴露了 `isEnabled`，讓你可以在不支援此 API 的瀏覽器上隱藏按鈕。

## 5. useNetwork -- 線上/離線狀態

監控使用者的網路連線。hook 追蹤線上/離線狀態，以及在可用時提供連線詳情如 `effectiveType` 和 `downlink`。

```tsx
import { useNetwork } from "@reactuses/core";

function NetworkBanner() {
  const { online, effectiveType } = useNetwork();

  if (!online) return <div className="banner">You are offline</div>;

  return <div>Connection: {effectiveType}</div>;
}
```

用它來顯示離線橫幅、排隊請求，或在慢速連線上優雅降級。

## 6. useIdle -- 閒置偵測

偵測使用者何時停止與頁面互動。hook 監聽滑鼠、鍵盤、觸控和可見性事件，並在指定的逾時後回傳 `true`。

```tsx
import { useIdle } from "@reactuses/core";

function IdleWarning() {
  const isIdle = useIdle(300_000); // 5 minutes

  return isIdle ? <div>Are you still there?</div> : null;
}
```

常見使用情境包括自動登出、暫停耗費資源的動畫，以及顯示「還在觀看嗎？」提示。

## 7. useDarkMode -- 深色模式切換

管理深色模式，具備系統偏好偵測、localStorage 持久化，以及在根元素上自動切換 CSS 類別。

```tsx
import { useDarkMode } from "@reactuses/core";

function ThemeToggle() {
  const [isDark, toggle] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
  });

  return (
    <button onClick={toggle}>
      {isDark ? "Switch to Light" : "Switch to Dark"}
    </button>
  );
}
```

當沒有儲存的偏好時，hook 會回退到使用者的 `prefers-color-scheme` 系統設定。

## 8. usePermission -- 權限狀態

查詢瀏覽器權限的狀態（地理定位、相機、麥克風、通知等），並即時回應變更。

```tsx
import { usePermission } from "@reactuses/core";

function CameraAccess() {
  const status = usePermission("camera");

  if (status === "denied") return <p>Camera access was denied.</p>;
  if (status === "prompt") return <p>We need camera permission.</p>;

  return <p>Camera access granted.</p>;
}
```

搭配 `useGeolocation` 等其他 hooks 使用，在請求存取之前顯示適當的 UI。

## 9. useLocalStorage -- 持久化狀態

`useState` 的直接替代品，持久化到 `localStorage`。它處理序列化、SSR 安全性、透過 `storage` 事件的跨分頁同步，以及錯誤恢復。

```tsx
import { useLocalStorage } from "@reactuses/core";

function Settings() {
  const [lang, setLang] = useLocalStorage("language", "en");

  return (
    <select value={lang ?? "en"} onChange={(e) => setLang(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
    </select>
  );
}
```

如果你需要儲存日期、Map 或其他非 JSON 類型，它支援自訂序列化器。

## 10. useEventListener -- 事件處理

將事件監聽器附加到任何目標（window、document 或特定元素），具備自動清理和 TypeScript 安全的事件類型。

```tsx
import { useEventListener } from "@reactuses/core";

function KeyLogger() {
  useEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
  });

  return <p>Press any key...</p>;
}
```

這是 ReactUse 中許多其他 hooks 建構的基礎 hook。它透過始終參照最新的處理函式來避免過期閉包。

## 手動實作 vs. ReactUse

以上每個 hook 都取代了大量的樣板程式碼。以下是沒有 ReactUse 時你需要自己處理的事情：

| 關注點 | 手動實作 | ReactUse Hook |
| --- | --- | --- |
| SSR 安全檢查 | 到處都是 `typeof window !== "undefined"` 防護 | 內建 |
| 事件監聽器清理 | `useEffect` 回傳帶有 `removeEventListener` | 自動 |
| TypeScript 事件類型 | 每個事件的手動泛型約束 | 完整類型 |
| 權限處理 | `navigator.permissions.query` + 狀態管理 | 單一呼叫 |
| localStorage 序列化 | `JSON.parse` / `JSON.stringify` + 錯誤處理 | 自動 |
| 跨分頁同步 | 手動 `storage` 事件監聽器 | 內建 |
| 防止 Hydration 不匹配 | `defaultState` 模式、雙次渲染 | 內部處理 |
| Fullscreen API 差異 | 供應商前綴 API 正規化 | 已抽象化 |

對於單一 hook 來說，節省的程度不大。但在整個應用程式中使用五個或更多的瀏覽器 API 時，ReactUse 消除了數百行防禦性程式碼。

## 常見問題

### 這些 hooks 是否 SSR 安全？

是的。ReactUse 中的每個 hook 都會在存取任何 API 之前檢查瀏覽器可用性。在伺服器端渲染期間，hooks 回傳安全的預設值並跳過僅限瀏覽器的邏輯。這意味著與 Next.js、Remix、Astro 或任何其他 SSR 框架搭配使用時不會有 hydration 不匹配。

### 我可以對未使用的 hooks 進行 tree-shake 嗎？

可以。從 `@reactuses/core` 匯入支援 tree-shaking。你的打包器只會包含你實際匯入的 hooks，所以安裝整個函式庫不會有額外負擔。

### 這些 hooks 是否與 React 18 和 19 相容？

ReactUse 支援 React 16.8 及以上版本。所有 hooks 都與 React 18 的並行功能和 React 19 相容。

### 如何安裝 ReactUse？

```bash
npm i @reactuses/core
```

或使用 pnpm 或 yarn：

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

### 在哪裡可以找到完整的 API 文件？

每個 hook 在 [reactuse.com](https://reactuse.com) 上都有專屬的文件頁面和即時範例。你也可以在 [GitHub](https://github.com/childrentime/reactuse) 上瀏覽原始碼。

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
