---
title: "React Geolocation and Device API Hooks"
description: "Learn how to access geolocation, network status, device permissions, and platform detection in React using hooks from ReactUse."
slug: react-geolocation-device-apis
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, geolocation, device-apis, tutorial]
keywords: [react geolocation, useGeolocation, useNetwork, usePermission, react device apis, useOnline, usePlatform]
image: /img/og.png
---

# React Geolocation and Device API Hooks

Modern web applications increasingly depend on device capabilities -- knowing where a user is, whether they are online, what kind of network they are on, and what platform they are running. The browser exposes these through a collection of APIs (Geolocation, Network Information, Permissions, Navigator), but wiring them into React components correctly is harder than it looks. You need to manage watchers, handle permission states, clean up subscriptions, and deal with SSR -- all while keeping your component code readable.

<!-- truncate -->

This article covers five hooks from [ReactUse](https://reactuse.com) that wrap these device APIs into clean, reactive interfaces: [`useGeolocation`](https://reactuse.com/browser/useGeolocation/), [`usePermission`](https://reactuse.com/browser/usePermission/), [`useNetwork`](https://reactuse.com/browser/useNetwork/), [`useOnline`](https://reactuse.com/browser/useOnline/), and [`usePlatform`](https://reactuse.com/browser/usePlatform/). For each hook, we will look at what the manual approach looks like, then see how the hook simplifies it. We will then build three practical examples that combine these hooks together.

## 1. Geolocation: Tracking the User's Position

### The Manual Approach

The Geolocation API is callback-based and requires careful cleanup:

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

This handles the basics, but it does not expose accuracy, altitude, heading, or speed. It does not track the loading state. And you end up duplicating this in every component that needs location data.

### The Hook Solution: useGeolocation

[`useGeolocation`](https://reactuse.com/browser/useGeolocation/) wraps the entire Geolocation API into a single reactive object:

```tsx
import { useGeolocation } from "@reactuses/core";

function LocationDisplay() {
  const { coordinates, error, loading } = useGeolocation();

  if (loading) return <p>Acquiring location...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <p>Latitude: {coordinates?.latitude}</p>
      <p>Longitude: {coordinates?.longitude}</p>
      <p>Accuracy: {coordinates?.accuracy}m</p>
      <p>Altitude: {coordinates?.altitude ?? "N/A"}</p>
      <p>Speed: {coordinates?.speed ?? "N/A"}</p>
    </div>
  );
}
```

The hook sets up `watchPosition` internally, provides a `loading` flag while waiting for the first fix, exposes the full `GeolocationCoordinates` object (latitude, longitude, accuracy, altitude, heading, speed), and cleans up the watcher on unmount.

## 2. Permissions: Checking What the Browser Allows

### The Manual Approach

The Permissions API is straightforward but async, and permissions can change at any time:

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

There is a subtle bug here: the cleanup function creates a new anonymous function reference, so the event listener is never actually removed. This is a common mistake.

### The Hook Solution: usePermission

[`usePermission`](https://reactuse.com/browser/usePermission/) handles all of this correctly:

```tsx
import { usePermission } from "@reactuses/core";

function CameraAccess() {
  const cameraPermission = usePermission("camera");

  return (
    <div>
      <p>Camera permission: {cameraPermission}</p>
      {cameraPermission === "denied" && (
        <p>Camera access has been blocked. Please enable it in browser settings.</p>
      )}
      {cameraPermission === "prompt" && (
        <p>Click the button below to request camera access.</p>
      )}
      {cameraPermission === "granted" && (
        <p>Camera is ready to use.</p>
      )}
    </div>
  );
}
```

The hook returns a reactive `PermissionState` value (`"granted"`, `"denied"`, or `"prompt"`) that updates automatically when the user changes the permission in browser settings.

## 3. Network Information: Connection Type and Quality

### The Manual Approach

The Network Information API (`navigator.connection`) provides details like effective connection type and downlink speed, but it is not available in all browsers and requires event listeners:

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

This is a lot of boilerplate for something that should be a simple read.

### The Hook Solution: useNetwork

[`useNetwork`](https://reactuse.com/browser/useNetwork/) provides the full network picture:

```tsx
import { useNetwork } from "@reactuses/core";

function NetworkInfo() {
  const network = useNetwork();

  return (
    <div>
      <p>Online: {network.online ? "Yes" : "No"}</p>
      <p>Connection type: {network.type ?? "Unknown"}</p>
      <p>Effective type: {network.effectiveType ?? "Unknown"}</p>
      <p>Downlink: {network.downlink ? `${network.downlink} Mbps` : "Unknown"}</p>
      <p>Data saver: {network.saveData ? "On" : "Off"}</p>
    </div>
  );
}
```

The hook subscribes to both online/offline events and the Network Information API's `change` event, providing a single reactive object that always reflects the current connection state.

## 4. Online Status: Simple Connectivity Detection

Sometimes you do not need the full network picture -- you just need to know if the user is online or offline.

### The Manual Approach

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

### The Hook Solution: useOnline

[`useOnline`](https://reactuse.com/browser/useOnline/) reduces this to a single boolean:

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
      {online ? "Online" : "Offline"}
    </span>
  );
}
```

## 5. Platform Detection: Knowing the Environment

### The Manual Approach

Detecting the user's platform involves parsing the user agent string, which is notoriously unreliable and verbose:

```tsx
import { useState, useEffect } from "react";

function useManualPlatform() {
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    // navigator.platform is deprecated but still widely used
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

### The Hook Solution: usePlatform

[`usePlatform`](https://reactuse.com/browser/usePlatform/) provides structured platform information:

```tsx
import { usePlatform } from "@reactuses/core";

function PlatformBanner() {
  const platform = usePlatform();

  return (
    <div>
      <p>Platform: {platform}</p>
    </div>
  );
}
```

This is useful for showing platform-specific instructions, keyboard shortcuts (Cmd vs Ctrl), or download links.

---

## Practical Example 1: Store Locator with Distance Calculator

Let's build a store locator that shows the nearest store based on the user's GPS position. This combines [`useGeolocation`](https://reactuse.com/browser/useGeolocation/) with [`usePermission`](https://reactuse.com/browser/usePermission/) for a smooth permission flow.

```tsx
import { useGeolocation, usePermission } from "@reactuses/core";

interface Store {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

const STORES: Store[] = [
  { name: "Downtown Store", lat: 40.7128, lng: -74.006, address: "123 Main St, New York" },
  { name: "Uptown Store", lat: 40.7831, lng: -73.9712, address: "456 Park Ave, New York" },
  { name: "Brooklyn Store", lat: 40.6782, lng: -73.9442, address: "789 Atlantic Ave, Brooklyn" },
];

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
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
        <h3>Location Access Required</h3>
        <p>
          To find stores near you, please enable location access in your browser
          settings and reload the page.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p>Detecting your location...</p>;
  }

  if (error) {
    return <p>Could not determine your location: {error.message}</p>;
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
      <h2>Nearest Stores</h2>
      <p style={{ color: "#6b7280", fontSize: 14 }}>
        Your location: {userLat.toFixed(4)}, {userLng.toFixed(4)}
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
              {store.distance.toFixed(1)} km away
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

The key detail here is the permission check. By reading `usePermission("geolocation")` we can show an informative message before the user even interacts with the geolocation prompt. If permission is `"denied"`, we show instructions instead of a broken UI. If it is `"prompt"`, the browser will ask when `useGeolocation` tries to access the position.

## Practical Example 2: Offline-Aware Data Sync

This component adapts its behavior based on connectivity. When offline, it queues changes locally. When the connection returns, it syncs automatically. It uses [`useOnline`](https://reactuse.com/browser/useOnline/) for simple connectivity detection and [`useNetwork`](https://reactuse.com/browser/useNetwork/) to decide sync strategy based on connection quality.

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
      // Fast connection: sync immediately
      setSyncStatus("syncing");
      fetch("/api/save", {
        method: "POST",
        body: JSON.stringify(change),
      })
        .then(() => setSyncStatus("idle"))
        .catch(() => {
          // Failed to sync -- queue it
          setPendingChanges((prev) => [...(prev ?? []), change]);
          setSyncStatus("error");
        });
    } else {
      // Offline or slow connection: queue locally
      setPendingChanges((prev) => [...(prev ?? []), change]);
    }
  }, [content, online, isSlowConnection, setPendingChanges]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!online || !pendingChanges?.length) return;
    if (isSlowConnection) return; // Wait for a better connection

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
      {/* Status bar */}
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
        <span>{online ? "Online" : "Offline -- changes will be saved locally"}</span>
        {isSlowConnection && online && (
          <span style={{ color: "#92400e" }}>Slow connection detected</span>
        )}
        {(pendingChanges?.length ?? 0) > 0 && (
          <span>
            {pendingChanges!.length} pending change{pendingChanges!.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your content here..."
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
          ? "Syncing..."
          : online
            ? "Save"
            : "Save Locally"}
      </button>
    </div>
  );
}
```

The combination of `useOnline` and `useNetwork` gives this component two levels of intelligence: it knows whether it can reach the server at all, and it knows whether the connection is fast enough to attempt a sync. On a 2G connection, it is smarter to queue changes and sync later than to attempt a slow request that might time out.

## Practical Example 3: Permission-Gated Feature

This component checks whether the user has granted notification permission before showing a notification settings panel. If permission is denied, it explains how to fix it. This pattern works for any permission-gated feature -- camera, microphone, geolocation, or notifications.

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

  // Show platform-specific instructions for enabling permissions
  const getSettingsInstructions = () => {
    const p = platform?.toLowerCase() ?? "";
    if (p.includes("mac")) {
      return "Go to System Settings > Notifications > your browser, and enable notifications.";
    }
    if (p.includes("win")) {
      return "Go to Settings > System > Notifications, and enable notifications for your browser.";
    }
    return "Check your system notification settings and enable notifications for your browser.";
  };

  if (notifPermission === "denied") {
    return (
      <div style={{ padding: 24, backgroundColor: "#fef2f2", borderRadius: 8 }}>
        <h3>Notifications Blocked</h3>
        <p>
          You have blocked notifications for this site. To enable them:
        </p>
        <ol>
          <li>Click the lock icon in your browser's address bar</li>
          <li>Find "Notifications" and change it to "Allow"</li>
          <li>Reload the page</li>
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
        <h3>Enable Notifications</h3>
        <p>Get notified about important updates and reminders.</p>
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
          Enable Notifications
        </button>
      </div>
    );
  }

  // Permission granted -- show the full settings panel
  return (
    <div style={{ padding: 24, backgroundColor: "#f0fdf4", borderRadius: 8 }}>
      <h3>Notification Settings</h3>
      <p style={{ color: "#166534" }}>Notifications are enabled.</p>

      <label style={{ display: "block", marginTop: 16 }}>
        <strong>Frequency:</strong>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{ marginLeft: 8, padding: 4 }}
        >
          <option value="realtime">Real-time</option>
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly summary</option>
        </select>
      </label>
    </div>
  );
}
```

Notice how [`usePlatform`](https://reactuse.com/browser/usePlatform/) is used to show platform-specific instructions when notifications are blocked. This kind of contextual help dramatically reduces the number of users who give up when they see a "permission denied" state.

## When to Use useOnline vs useNetwork

Both hooks deal with connectivity, but they serve different purposes:

| Feature | `useOnline` | `useNetwork` |
|---------|-------------|--------------|
| Return value | `boolean` | Object with `online`, `type`, `effectiveType`, `downlink`, `saveData` |
| Use case | Simple on/off toggle | Adaptive behavior based on connection quality |
| Browser support | All browsers | Chromium-based browsers (Network Information API) |
| Overhead | Minimal | Minimal |

Use [`useOnline`](https://reactuse.com/browser/useOnline/) when you only need to know if the user is connected. Use [`useNetwork`](https://reactuse.com/browser/useNetwork/) when you need to adapt behavior based on connection quality -- for example, loading lower-resolution images on slow connections, or deferring non-critical network requests.

## Error Handling and SSR

All five hooks are SSR-safe. They return sensible defaults on the server and only activate their browser API subscriptions after the component mounts on the client:

- `useGeolocation` returns `loading: true` until the first position is received
- `usePermission` returns `"prompt"` as the default state
- `useNetwork` returns `{ online: true }` on the server
- `useOnline` returns `true` on the server
- `usePlatform` returns an empty string on the server

This means you can use them in Next.js, Remix, or any SSR framework without conditional imports or dynamic loading.

## Installation

```bash
npm install @reactuses/core
```

Then import the hooks you need:

```tsx
import {
  useGeolocation,
  usePermission,
  useNetwork,
  useOnline,
  usePlatform,
} from "@reactuses/core";
```

## Related Hooks

- [`useEventListener`](https://reactuse.com/effect/useEventListener/) -- subscribe to any DOM event with automatic cleanup
- [`useSupported`](https://reactuse.com/state/useSupported/) -- check if a browser API is supported before using it
- [`useLocalStorage`](https://reactuse.com/state/useLocalStorage/) -- persist state to localStorage with SSR safety

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
