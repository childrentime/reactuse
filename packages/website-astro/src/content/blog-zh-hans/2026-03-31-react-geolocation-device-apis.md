---
title: "React 地理定位与设备 API Hooks"
description: "学习如何在 React 中通过 ReactUse 的 hooks 获取地理定位、网络状态、设备权限和平台检测等设备信息。"
slug: react-geolocation-device-apis
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, geolocation, device-apis, tutorial]
keywords: [react geolocation, useGeolocation, useNetwork, usePermission, react device apis, useOnline, usePlatform]
image: /img/og.png
---

# React 地理定位与设备 API Hooks

现代 Web 应用越来越依赖设备的能力——需要知道用户在哪里、是否在线、用的什么网络、运行在什么平台上。浏览器通过一系列 API（Geolocation、Network Information、Permissions、Navigator）暴露了这些信息，但要在 React 组件中正确使用它们并不简单。你需要管理监听器、处理权限状态、清理订阅、兼容 SSR——同时还要保持代码的可读性。

<!-- truncate -->

本文介绍 [ReactUse](https://reactuse.com) 中五个封装了设备 API 的 hooks：[`useGeolocation`](https://reactuse.com/browser/usegeolocation/)、[`usePermission`](https://reactuse.com/browser/usepermission/)、[`useNetwork`](https://reactuse.com/browser/usenetwork/)、[`useOnline`](https://reactuse.com/browser/useonline/) 和 [`usePlatform`](https://reactuse.com/browser/useplatform/)。对于每个 hook，我们先看看手动实现有多麻烦，再看 hook 如何简化代码。最后，我们会用这些 hook 搭建三个实战案例。

## 1. 地理定位：获取用户位置

### 手动实现

Geolocation API 是基于回调的，需要仔细处理清理逻辑：

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

这段代码只覆盖了基础功能——没有暴露精度、海拔、航向和速度信息，也没有追踪加载状态。而且每个需要定位的组件都得重复写一遍。

### Hook 方案：useGeolocation

[`useGeolocation`](https://reactuse.com/browser/usegeolocation/) 把整个 Geolocation API 封装成了一个响应式对象：

```tsx
import { useGeolocation } from "@reactuses/core";

function LocationDisplay() {
  const { coordinates, error, loading } = useGeolocation();

  if (loading) return <p>正在获取位置...</p>;
  if (error) return <p>定位失败：{error.message}</p>;

  return (
    <div>
      <p>纬度：{coordinates?.latitude}</p>
      <p>经度：{coordinates?.longitude}</p>
      <p>精度：{coordinates?.accuracy}m</p>
      <p>海拔：{coordinates?.altitude ?? "不可用"}</p>
      <p>速度：{coordinates?.speed ?? "不可用"}</p>
    </div>
  );
}
```

这个 hook 在内部调用 `watchPosition`，在等待首次定位时提供 `loading` 标志，暴露完整的 `GeolocationCoordinates` 对象（纬度、经度、精度、海拔、航向、速度），并在组件卸载时自动清理监听器。

## 2. 权限检测：检查浏览器授权状态

### 手动实现

Permissions API 本身很简单，但它是异步的，而且权限状态可能随时变化：

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

这里有一个不易察觉的 bug：清理函数中创建了新的匿名函数引用，所以事件监听器实际上不会被正确移除。这是一个很常见的错误。

### Hook 方案：usePermission

[`usePermission`](https://reactuse.com/browser/usepermission/) 正确处理了所有这些细节：

```tsx
import { usePermission } from "@reactuses/core";

function CameraAccess() {
  const cameraPermission = usePermission("camera");

  return (
    <div>
      <p>相机权限：{cameraPermission}</p>
      {cameraPermission === "denied" && (
        <p>相机访问已被拒绝，请在浏览器设置中开启。</p>
      )}
      {cameraPermission === "prompt" && (
        <p>点击下方按钮请求相机访问权限。</p>
      )}
      {cameraPermission === "granted" && (
        <p>相机已就绪，可以使用。</p>
      )}
    </div>
  );
}
```

这个 hook 返回一个响应式的 `PermissionState` 值（`"granted"`、`"denied"` 或 `"prompt"`），当用户在浏览器设置中修改权限时会自动更新。

## 3. 网络信息：连接类型与质量

### 手动实现

Network Information API（`navigator.connection`）提供了有效连接类型和下行速度等详细信息，但并非所有浏览器都支持，而且需要监听事件：

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

为了读取一些简单的网络信息，这也太多样板代码了。

### Hook 方案：useNetwork

[`useNetwork`](https://reactuse.com/browser/usenetwork/) 提供完整的网络状态视图：

```tsx
import { useNetwork } from "@reactuses/core";

function NetworkInfo() {
  const network = useNetwork();

  return (
    <div>
      <p>在线状态：{network.online ? "在线" : "离线"}</p>
      <p>连接类型：{network.type ?? "未知"}</p>
      <p>等效类型：{network.effectiveType ?? "未知"}</p>
      <p>下行带宽：{network.downlink ? `${network.downlink} Mbps` : "未知"}</p>
      <p>省流模式：{network.saveData ? "已开启" : "已关闭"}</p>
    </div>
  );
}
```

这个 hook 同时订阅了 online/offline 事件和 Network Information API 的 `change` 事件，提供一个始终反映当前连接状态的响应式对象。

## 4. 在线状态：简单的联网检测

有时候你不需要完整的网络信息——只需要知道用户是否在线。

### 手动实现

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

[`useOnline`](https://reactuse.com/browser/useonline/) 把这一切简化为一个布尔值：

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
      {online ? "在线" : "离线"}
    </span>
  );
}
```

## 5. 平台检测：识别运行环境

### 手动实现

检测用户平台需要解析 User Agent 字符串，这件事出了名的不可靠，代码也很冗长：

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

[`usePlatform`](https://reactuse.com/browser/useplatform/) 提供结构化的平台信息：

```tsx
import { usePlatform } from "@reactuses/core";

function PlatformBanner() {
  const platform = usePlatform();

  return (
    <div>
      <p>当前平台：{platform}</p>
    </div>
  );
}
```

这在展示平台相关的操作指引（比如 Cmd 和 Ctrl 的区别）、键盘快捷键提示或下载链接时非常有用。

---

## 实战案例 1：附近门店查找器

我们来构建一个门店定位器，根据用户的 GPS 位置显示最近的门店。这里结合使用 [`useGeolocation`](https://reactuse.com/browser/usegeolocation/) 和 [`usePermission`](https://reactuse.com/browser/usepermission/)，实现流畅的权限交互。

```tsx
import { useGeolocation, usePermission } from "@reactuses/core";

interface Store {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

const STORES: Store[] = [
  { name: "南京东路店", lat: 31.2362, lng: 121.4737, address: "南京东路 123 号" },
  { name: "徐家汇店", lat: 31.1955, lng: 121.4365, address: "肇嘉浜路 456 号" },
  { name: "浦东陆家嘴店", lat: 31.2363, lng: 121.5056, address: "世纪大道 789 号" },
];

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // 地球半径，单位：公里
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
        <h3>需要位置权限</h3>
        <p>
          要查找附近门店，请在浏览器设置中开启位置权限，然后刷新页面。
        </p>
      </div>
    );
  }

  if (loading) {
    return <p>正在定位中...</p>;
  }

  if (error) {
    return <p>无法获取位置信息：{error.message}</p>;
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
      <h2>附近门店</h2>
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

这里的关键在于权限检查。通过读取 `usePermission("geolocation")` 的返回值，我们可以在用户与定位弹窗交互之前就显示有用的提示信息。如果权限是 `"denied"`，直接展示引导说明，而不是一个报错的 UI。如果权限是 `"prompt"`，浏览器会在 `useGeolocation` 尝试获取位置时自动弹出授权请求。

## 实战案例 2：离线感知的数据同步

这个组件根据网络状况自适应调整行为。离线时，将修改缓存到本地；网络恢复后，自动同步。它使用 [`useOnline`](https://reactuse.com/browser/useonline/) 做简单的联网检测，配合 [`useNetwork`](https://reactuse.com/browser/usenetwork/) 根据连接质量决定同步策略。

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
      // 网速正常：立即同步
      setSyncStatus("syncing");
      fetch("/api/save", {
        method: "POST",
        body: JSON.stringify(change),
      })
        .then(() => setSyncStatus("idle"))
        .catch(() => {
          // 同步失败——加入队列
          setPendingChanges((prev) => [...(prev ?? []), change]);
          setSyncStatus("error");
        });
    } else {
      // 离线或慢速连接：先保存到本地
      setPendingChanges((prev) => [...(prev ?? []), change]);
    }
  }, [content, online, isSlowConnection, setPendingChanges]);

  // 恢复在线后自动同步
  useEffect(() => {
    if (!online || !pendingChanges?.length) return;
    if (isSlowConnection) return; // 等待网络好转再同步

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
      {/* 状态栏 */}
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
        <span>{online ? "在线" : "离线——修改将保存到本地"}</span>
        {isSlowConnection && online && (
          <span style={{ color: "#92400e" }}>检测到慢速网络</span>
        )}
        {(pendingChanges?.length ?? 0) > 0 && (
          <span>
            {pendingChanges!.length} 条待同步
          </span>
        )}
      </div>

      {/* 编辑区 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="在这里输入内容..."
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
            ? "保存"
            : "保存到本地"}
      </button>
    </div>
  );
}
```

`useOnline` 和 `useNetwork` 的组合让这个组件具备了两层智能判断：它知道能否连通服务器，也知道连接是否快到可以发起同步。在 2G 网络下，先缓存到本地、等网络好转后再同步，比发起一个可能超时的慢请求要明智得多。

## 实战案例 3：基于权限的功能门控

这个组件在显示通知设置面板之前先检查用户是否已授予通知权限。如果权限被拒绝，会给出修复方法的说明。这个模式适用于任何需要权限的功能——摄像头、麦克风、地理定位或通知。

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

  // 根据平台展示不同的设置指引
  const getSettingsInstructions = () => {
    const p = platform?.toLowerCase() ?? "";
    if (p.includes("mac")) {
      return "前往系统设置 > 通知 > 你的浏览器，开启通知权限。";
    }
    if (p.includes("win")) {
      return "前往设置 > 系统 > 通知，为浏览器开启通知权限。";
    }
    return "请检查系统通知设置，为浏览器开启通知权限。";
  };

  if (notifPermission === "denied") {
    return (
      <div style={{ padding: 24, backgroundColor: "#fef2f2", borderRadius: 8 }}>
        <h3>通知已被拒绝</h3>
        <p>
          你已拒绝了本站的通知权限。要重新开启：
        </p>
        <ol>
          <li>点击浏览器地址栏的锁形图标</li>
          <li>找到"通知"选项，将其改为"允许"</li>
          <li>刷新页面</li>
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
        <h3>开启通知</h3>
        <p>开启通知，及时接收重要更新和提醒。</p>
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
          开启通知
        </button>
      </div>
    );
  }

  // 已授权——展示完整的设置面板
  return (
    <div style={{ padding: 24, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
      <h3>通知设置</h3>
      <p style={{ color: "#166534" }}>通知已开启。</p>

      <label style={{ display: "block", marginTop: 16 }}>
        <strong>推送频率：</strong>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{ marginLeft: 8, padding: 4 }}
        >
          <option value="realtime">实时推送</option>
          <option value="daily">每日汇总</option>
          <option value="weekly">每周摘要</option>
        </select>
      </label>
    </div>
  );
}
```

注意 [`usePlatform`](https://reactuse.com/browser/useplatform/) 在通知被拒绝时用来展示对应平台的操作指引。这种上下文相关的帮助信息能显著减少因为"权限被拒绝"而直接放弃的用户。

## useOnline 和 useNetwork 的选择

两个 hook 都跟网络连接相关，但应用场景不同：

| 特性 | `useOnline` | `useNetwork` |
|------|-------------|--------------|
| 返回值 | `boolean` | 包含 `online`、`type`、`effectiveType`、`downlink`、`saveData` 的对象 |
| 适用场景 | 简单的在线/离线开关 | 根据连接质量做自适应处理 |
| 浏览器兼容性 | 所有浏览器 | 基于 Chromium 的浏览器（Network Information API） |
| 性能开销 | 极小 | 极小 |

只需要知道用户是否联网时用 [`useOnline`](https://reactuse.com/browser/useonline/)。需要根据网络质量做差异化处理时用 [`useNetwork`](https://reactuse.com/browser/usenetwork/)——比如在弱网环境下加载低分辨率图片，或者推迟非关键的网络请求。

## 错误处理与 SSR 兼容

这五个 hook 都是 SSR 安全的。它们在服务端返回合理的默认值，只在客户端组件挂载后才启动浏览器 API 的订阅：

- `useGeolocation` 在首次定位完成前返回 `loading: true`
- `usePermission` 默认返回 `"prompt"`
- `useNetwork` 在服务端返回 `{ online: true }`
- `useOnline` 在服务端返回 `true`
- `usePlatform` 在服务端返回空字符串

这意味着你可以在 Next.js、Remix 或任何 SSR 框架中直接使用，无需条件导入或动态加载。

## 安装

```bash
npm install @reactuses/core
```

然后按需导入：

```tsx
import {
  useGeolocation,
  usePermission,
  useNetwork,
  useOnline,
  usePlatform,
} from "@reactuses/core";
```

## 相关 Hooks

- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) —— 订阅任意 DOM 事件，自动清理
- [`useSupported`](https://reactuse.com/state/usesupported/) —— 在使用前检测浏览器 API 是否可用
- [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) —— 将状态持久化到 localStorage，支持 SSR

ReactUse 提供了 100 多个 React hooks。[查看全部 →](https://reactuse.com)
