---
title: "React 地理定位與裝置 API Hooks"
description: "學習如何在 React 中透過 ReactUse 的 hooks 取得地理定位、網路狀態、裝置權限和平台偵測等裝置資訊。"
slug: react-geolocation-device-apis
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, geolocation, device-apis, tutorial]
keywords: [react geolocation, useGeolocation, useNetwork, usePermission, react device apis, useOnline, usePlatform]
image: /img/og.png
---

# React 地理定位與裝置 API Hooks

現代 Web 應用程式越來越依賴裝置的能力——需要知道使用者在哪裡、是否在線、用的是什麼網路、執行在什麼平台上。瀏覽器透過一系列 API（Geolocation、Network Information、Permissions、Navigator）暴露了這些資訊，但要在 React 元件中正確使用它們並不簡單。你需要管理監聽器、處理權限狀態、清理訂閱、相容 SSR——同時還要保持程式碼的可讀性。

<!-- truncate -->

本文介紹 [ReactUse](https://reactuse.com) 中五個封裝了裝置 API 的 hooks：[`useGeolocation`](https://reactuse.com/browser/usegeolocation/)、[`usePermission`](https://reactuse.com/browser/usepermission/)、[`useNetwork`](https://reactuse.com/browser/usenetwork/)、[`useOnline`](https://reactuse.com/browser/useonline/) 和 [`usePlatform`](https://reactuse.com/browser/useplatform/)。對於每個 hook，我們先看看手動實作有多麻煩，再看 hook 如何簡化程式碼。最後，我們會用這些 hook 搭建三個實戰案例。

## 1. 地理定位：取得使用者位置

### 手動實作

Geolocation API 是基於回呼的，需要仔細處理清理邏輯：

```tsx
import { useState, useEffect } from "react";

function useManualGeolocation() {
  const [position, setPosition] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        setError(err);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, error };
}
```

這段程式碼只涵蓋了基礎功能——沒有暴露精確度、海拔、航向和速度資訊，也沒有追蹤載入狀態。而且每個需要定位的元件都得重複寫一遍。

### Hook 方案：useGeolocation

[`useGeolocation`](https://reactuse.com/browser/usegeolocation/) 把整個 Geolocation API 封裝成了一個響應式物件：

```tsx
import { useGeolocation } from "@reactuses/core";

function LocationDisplay() {
  const { coordinates, error, loading } = useGeolocation();

  if (loading) return <p>正在取得位置...</p>;
  if (error) return <p>定位失敗：{error.message}</p>;

  return (
    <div>
      <p>緯度：{coordinates?.latitude}</p>
      <p>經度：{coordinates?.longitude}</p>
      <p>精確度：{coordinates?.accuracy}m</p>
      <p>海拔：{coordinates?.altitude ?? "不可用"}</p>
      <p>速度：{coordinates?.speed ?? "不可用"}</p>
    </div>
  );
}
```

這個 hook 在內部呼叫 `watchPosition`，在等待首次定位時提供 `loading` 旗標，暴露完整的 `GeolocationCoordinates` 物件（緯度、經度、精確度、海拔、航向、速度），並在元件卸載時自動清理監聽器。

## 2. 權限偵測：檢查瀏覽器授權狀態

### 手動實作

Permissions API 本身很簡單，但它是非同步的，而且權限狀態可能隨時改變：

```tsx
import { useState, useEffect } from "react";

function useManualPermission(name: PermissionName) {
  const [state, setState] = useState<PermissionState>("prompt");

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions.query({ name }).then((status) => {
      permissionStatus = status;
      setState(status.state);

      status.addEventListener("change", () => {
        setState(status.state);
      });
    });

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener("change", () => {
          setState(permissionStatus!.state);
        });
      }
    };
  }, [name]);

  return state;
}
```

這裡有一個不容易察覺的 bug：清理函式中建立了新的匿名函式參考，所以事件監聽器實際上不會被正確移除。這是一個非常常見的錯誤。

### Hook 方案：usePermission

[`usePermission`](https://reactuse.com/browser/usepermission/) 正確處理了所有這些細節：

```tsx
import { usePermission } from "@reactuses/core";

function CameraAccess() {
  const cameraPermission = usePermission("camera");

  return (
    <div>
      <p>相機權限：{cameraPermission}</p>
      {cameraPermission === "denied" && (
        <p>相機存取已被拒絕，請在瀏覽器設定中開啟。</p>
      )}
      {cameraPermission === "prompt" && (
        <p>點擊下方按鈕請求相機存取權限。</p>
      )}
      {cameraPermission === "granted" && (
        <p>相機已就緒，可以使用。</p>
      )}
    </div>
  );
}
```

這個 hook 回傳一個響應式的 `PermissionState` 值（`"granted"`、`"denied"` 或 `"prompt"`），當使用者在瀏覽器設定中修改權限時會自動更新。

## 3. 網路資訊：連線類型與品質

### 手動實作

Network Information API（`navigator.connection`）提供了有效連線類型和下行速度等詳細資訊，但並非所有瀏覽器都支援，而且需要監聽事件：

```tsx
import { useState, useEffect } from "react";

interface NetworkState {
  online: boolean;
  downlink?: number;
  effectiveType?: string;
  type?: string;
  saveData?: boolean;
}

function useManualNetwork(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
  });

  useEffect(() => {
    const connection = (navigator as any).connection;

    const updateState = () => {
      setState({
        online: navigator.onLine,
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType,
        type: connection?.type,
        saveData: connection?.saveData,
      });
    };

    updateState();

    window.addEventListener("online", updateState);
    window.addEventListener("offline", updateState);
    connection?.addEventListener("change", updateState);

    return () => {
      window.removeEventListener("online", updateState);
      window.removeEventListener("offline", updateState);
      connection?.removeEventListener("change", updateState);
    };
  }, []);

  return state;
}
```

只是讀取一些簡單的網路資訊，卻要寫這麼多樣板程式碼。

### Hook 方案：useNetwork

[`useNetwork`](https://reactuse.com/browser/usenetwork/) 提供完整的網路狀態視圖：

```tsx
import { useNetwork } from "@reactuses/core";

function NetworkInfo() {
  const network = useNetwork();

  return (
    <div>
      <p>在線狀態：{network.online ? "在線" : "離線"}</p>
      <p>連線類型：{network.type ?? "未知"}</p>
      <p>等效類型：{network.effectiveType ?? "未知"}</p>
      <p>下行頻寬：{network.downlink ? `${network.downlink} Mbps` : "未知"}</p>
      <p>省流模式：{network.saveData ? "已開啟" : "已關閉"}</p>
    </div>
  );
}
```

這個 hook 同時訂閱了 online/offline 事件和 Network Information API 的 `change` 事件，提供一個始終反映當前連線狀態的響應式物件。

## 4. 在線狀態：簡單的連線偵測

有時候你不需要完整的網路資訊——只需要知道使用者是否在線。

### 手動實作

```tsx
import { useState, useEffect } from "react";

function useManualOnline() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
```

### Hook 方案：useOnline

[`useOnline`](https://reactuse.com/browser/useonline/) 把這一切簡化為一個布林值：

```tsx
import { useOnline } from "@reactuses/core";

function ConnectionBadge() {
  const online = useOnline();

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 12px",
      borderRadius: 16,
      backgroundColor: online ? "#dcfce7" : "#fee2e2",
      color: online ? "#166534" : "#991b1b",
      fontSize: 14,
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: online ? "#22c55e" : "#ef4444",
      }} />
      {online ? "在線" : "離線"}
    </span>
  );
}
```

## 5. 平台偵測：識別執行環境

### 手動實作

偵測使用者平台需要解析 User Agent 字串，這件事出了名的不可靠，程式碼也很冗長：

```tsx
import { useState, useEffect } from "react";

function useManualPlatform() {
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Win/.test(ua)) setPlatform("Windows");
    else if (/Mac/.test(ua)) setPlatform("macOS");
    else if (/Linux/.test(ua)) setPlatform("Linux");
    else if (/Android/.test(ua)) setPlatform("Android");
    else if (/iPhone|iPad/.test(ua)) setPlatform("iOS");
    else setPlatform("Unknown");
  }, []);

  return platform;
}
```

### Hook 方案：usePlatform

[`usePlatform`](https://reactuse.com/browser/useplatform/) 提供結構化的平台資訊：

```tsx
import { usePlatform } from "@reactuses/core";

function PlatformBanner() {
  const platform = usePlatform();

  return (
    <div>
      <p>目前平台：{platform}</p>
    </div>
  );
}
```

這在展示平台相關的操作指引（例如 Cmd 和 Ctrl 的差異）、鍵盤快捷鍵提示或下載連結時非常實用。

---

## 實戰案例 1：附近門市查找器

我們來建構一個門市定位器，根據使用者的 GPS 位置顯示最近的門市。這裡結合使用 [`useGeolocation`](https://reactuse.com/browser/usegeolocation/) 和 [`usePermission`](https://reactuse.com/browser/usepermission/)，實現流暢的權限互動。

```tsx
import { useGeolocation, usePermission } from "@reactuses/core";

interface Store {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

const STORES: Store[] = [
  { name: "信義旗艦店", lat: 25.0330, lng: 121.5654, address: "信義路五段 123 號" },
  { name: "忠孝復興店", lat: 25.0418, lng: 121.5436, address: "忠孝東路四段 456 號" },
  { name: "西門町店", lat: 25.0422, lng: 121.5081, address: "中華路一段 789 號" },
];

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // 地球半徑，單位：公里
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function StoreLocator() {
  const locationPermission = usePermission("geolocation");
  const { coordinates, error, loading } = useGeolocation();

  if (locationPermission === "denied") {
    return (
      <div style={{ padding: 24, backgroundColor: "#fef2f2", borderRadius: 8 }}>
        <h3>需要位置權限</h3>
        <p>
          要尋找附近門市，請在瀏覽器設定中開啟位置權限，然後重新整理頁面。
        </p>
      </div>
    );
  }

  if (loading) {
    return <p>正在定位中...</p>;
  }

  if (error) {
    return <p>無法取得位置資訊：{error.message}</p>;
  }

  const userLat = coordinates?.latitude ?? 0;
  const userLng = coordinates?.longitude ?? 0;

  const sortedStores = [...STORES]
    .map((store) => ({
      ...store,
      distance: haversineDistance(userLat, userLng, store.lat, store.lng),
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <div>
      <h2>附近門市</h2>
      <p style={{ color: "#6b7280", fontSize: 14 }}>
        你的位置：{userLat.toFixed(4)}, {userLng.toFixed(4)}
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {sortedStores.map((store) => (
          <li
            key={store.name}
            style={{
              padding: 16,
              marginBottom: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <strong>{store.name}</strong>
            <p style={{ margin: "4px 0", color: "#6b7280" }}>{store.address}</p>
            <p style={{ margin: 0, fontWeight: 600 }}>
              距你 {store.distance.toFixed(1)} 公里
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

這裡的關鍵在於權限檢查。透過讀取 `usePermission("geolocation")` 的回傳值，我們可以在使用者與定位彈窗互動之前就顯示有用的提示資訊。如果權限是 `"denied"`，直接展示引導說明，而不是一個報錯的 UI。如果權限是 `"prompt"`，瀏覽器會在 `useGeolocation` 嘗試取得位置時自動彈出授權請求。

## 實戰案例 2：離線感知的資料同步

這個元件根據網路狀況自適應調整行為。離線時，將修改快取到本地；網路恢復後，自動同步。它使用 [`useOnline`](https://reactuse.com/browser/useonline/) 做簡單的連線偵測，搭配 [`useNetwork`](https://reactuse.com/browser/usenetwork/) 根據連線品質決定同步策略。

```tsx
import { useState, useEffect, useCallback } from "react";
import { useOnline, useNetwork, useLocalStorage } from "@reactuses/core";

interface PendingChange {
  id: string;
  data: string;
  timestamp: number;
}

function OfflineAwareEditor() {
  const online = useOnline();
  const network = useNetwork();
  const [pendingChanges, setPendingChanges] = useLocalStorage<PendingChange[]>(
    "pending-changes",
    []
  );
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [content, setContent] = useState("");

  const isSlowConnection =
    network.effectiveType === "slow-2g" || network.effectiveType === "2g";

  const saveChange = useCallback(() => {
    if (!content.trim()) return;

    const change: PendingChange = {
      id: crypto.randomUUID(),
      data: content,
      timestamp: Date.now(),
    };

    if (online && !isSlowConnection) {
      // 網速正常：立即同步
      setSyncStatus("syncing");
      fetch("/api/save", {
        method: "POST",
        body: JSON.stringify(change),
      })
        .then(() => setSyncStatus("idle"))
        .catch(() => {
          // 同步失敗——加入佇列
          setPendingChanges((prev) => [...(prev ?? []), change]);
          setSyncStatus("error");
        });
    } else {
      // 離線或慢速連線：先儲存到本地
      setPendingChanges((prev) => [...(prev ?? []), change]);
    }
  }, [content, online, isSlowConnection, setPendingChanges]);

  // 恢復在線後自動同步
  useEffect(() => {
    if (!online || !pendingChanges?.length) return;
    if (isSlowConnection) return; // 等待網路好轉再同步

    setSyncStatus("syncing");

    Promise.all(
      pendingChanges.map((change) =>
        fetch("/api/save", {
          method: "POST",
          body: JSON.stringify(change),
        })
      )
    )
      .then(() => {
        setPendingChanges([]);
        setSyncStatus("idle");
      })
      .catch(() => {
        setSyncStatus("error");
      });
  }, [online, isSlowConnection]);

  return (
    <div style={{ maxWidth: 600 }}>
      {/* 狀態列 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          marginBottom: 16,
          borderRadius: 8,
          backgroundColor: online ? "#f0fdf4" : "#fef9c3",
          fontSize: 14,
        }}
      >
        <span>{online ? "在線" : "離線——修改將儲存到本地"}</span>
        {isSlowConnection && online && (
          <span style={{ color: "#92400e" }}>偵測到慢速網路</span>
        )}
        {(pendingChanges?.length ?? 0) > 0 && (
          <span>
            {pendingChanges!.length} 筆待同步
          </span>
        )}
      </div>

      {/* 編輯區 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="在這裡輸入內容..."
        style={{
          width: "100%",
          height: 200,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #d1d5db",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />

      <button
        onClick={saveChange}
        disabled={syncStatus === "syncing" || !content.trim()}
        style={{
          marginTop: 12,
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          backgroundColor: "#2563eb",
          color: "#fff",
          cursor: "pointer",
          opacity: syncStatus === "syncing" || !content.trim() ? 0.5 : 1,
        }}
      >
        {syncStatus === "syncing"
          ? "同步中..."
          : online
            ? "儲存"
            : "儲存到本地"}
      </button>
    </div>
  );
}
```

`useOnline` 和 `useNetwork` 的組合讓這個元件具備了兩層智慧判斷：它知道能否連通伺服器，也知道連線是否快到可以發起同步。在 2G 網路下，先快取到本地、等網路好轉後再同步，比發起一個可能逾時的慢請求要明智得多。

## 實戰案例 3：基於權限的功能門控

這個元件在顯示通知設定面板之前先檢查使用者是否已授予通知權限。如果權限被拒絕，會給出修復方法的說明。這個模式適用於任何需要權限的功能——攝影機、麥克風、地理定位或通知。

```tsx
import { usePermission, usePlatform } from "@reactuses/core";
import { useState } from "react";

function NotificationSettings() {
  const notifPermission = usePermission("notifications");
  const platform = usePlatform();
  const [frequency, setFrequency] = useState("daily");

  const requestPermission = async () => {
    if ("Notification" in window) {
      await Notification.requestPermission();
    }
  };

  // 根據平台展示不同的設定指引
  const getSettingsInstructions = () => {
    const p = platform?.toLowerCase() ?? "";
    if (p.includes("mac")) {
      return "前往系統設定 > 通知 > 你的瀏覽器，開啟通知權限。";
    }
    if (p.includes("win")) {
      return "前往設定 > 系統 > 通知，為瀏覽器開啟通知權限。";
    }
    return "請檢查系統通知設定，為瀏覽器開啟通知權限。";
  };

  if (notifPermission === "denied") {
    return (
      <div style={{ padding: 24, backgroundColor: "#fef2f2", borderRadius: 8 }}>
        <h3>通知已被拒絕</h3>
        <p>
          你已拒絕了本站的通知權限。要重新開啟：
        </p>
        <ol>
          <li>點擊瀏覽器網址列的鎖形圖示</li>
          <li>找到「通知」選項，將其改為「允許」</li>
          <li>重新整理頁面</li>
        </ol>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          {getSettingsInstructions()}
        </p>
      </div>
    );
  }

  if (notifPermission === "prompt") {
    return (
      <div style={{ padding: 24, backgroundColor: "#eff6ff", borderRadius: 8 }}>
        <h3>開啟通知</h3>
        <p>開啟通知，及時接收重要更新和提醒。</p>
        <button
          onClick={requestPermission}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          開啟通知
        </button>
      </div>
    );
  }

  // 已授權——展示完整的設定面板
  return (
    <div style={{ padding: 24, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
      <h3>通知設定</h3>
      <p style={{ color: "#166534" }}>通知已開啟。</p>

      <label style={{ display: "block", marginTop: 16 }}>
        <strong>推播頻率：</strong>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{ marginLeft: 8, padding: 4 }}
        >
          <option value="realtime">即時推播</option>
          <option value="daily">每日彙整</option>
          <option value="weekly">每週摘要</option>
        </select>
      </label>
    </div>
  );
}
```

注意 [`usePlatform`](https://reactuse.com/browser/useplatform/) 在通知被拒絕時用來展示對應平台的操作指引。這種情境相關的輔助說明能顯著減少因為「權限被拒絕」而直接放棄的使用者。

## useOnline 和 useNetwork 的選擇

兩個 hook 都跟網路連線相關，但應用場景不同：

| 特性 | `useOnline` | `useNetwork` |
|------|-------------|--------------|
| 回傳值 | `boolean` | 包含 `online`、`type`、`effectiveType`、`downlink`、`saveData` 的物件 |
| 適用場景 | 簡單的在線/離線開關 | 根據連線品質做自適應處理 |
| 瀏覽器相容性 | 所有瀏覽器 | 基於 Chromium 的瀏覽器（Network Information API） |
| 效能開銷 | 極小 | 極小 |

只需要知道使用者是否聯網時用 [`useOnline`](https://reactuse.com/browser/useonline/)。需要根據網路品質做差異化處理時用 [`useNetwork`](https://reactuse.com/browser/usenetwork/)——例如在弱網環境下載入低解析度圖片，或者延後非關鍵的網路請求。

## 錯誤處理與 SSR 相容

這五個 hook 都是 SSR 安全的。它們在伺服器端回傳合理的預設值，只在用戶端元件掛載後才啟動瀏覽器 API 的訂閱：

- `useGeolocation` 在首次定位完成前回傳 `loading: true`
- `usePermission` 預設回傳 `"prompt"`
- `useNetwork` 在伺服器端回傳 `{ online: true }`
- `useOnline` 在伺服器端回傳 `true`
- `usePlatform` 在伺服器端回傳空字串

這意味著你可以在 Next.js、Remix 或任何 SSR 框架中直接使用，無需條件匯入或動態載入。

## 安裝

```bash
npm install @reactuses/core
```

然後按需匯入：

```tsx
import {
  useGeolocation,
  usePermission,
  useNetwork,
  useOnline,
  usePlatform,
} from "@reactuses/core";
```

## 相關 Hooks

- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) —— 訂閱任意 DOM 事件，自動清理
- [`useSupported`](https://reactuse.com/state/usesupported/) —— 在使用前偵測瀏覽器 API 是否可用
- [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) —— 將狀態持久化到 localStorage，支援 SSR

ReactUse 提供了 100 多個 React hooks。[查看全部 →](https://reactuse.com)
