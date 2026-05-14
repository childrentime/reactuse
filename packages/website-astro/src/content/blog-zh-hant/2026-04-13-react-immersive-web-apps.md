---
title: "在 React 中構建沉浸式 Web 應用：全螢幕、螢幕常亮與系統通知"
description: "學習如何用 ReactUse 中的全螢幕、螢幕常亮、Web 通知、安全區域以及動態標題與圖示 Hook,在 React 中構建沉浸式體驗。"
slug: react-immersive-web-apps
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, fullscreen, pwa, tutorial]
keywords: [react fullscreen, useFullscreen, useWakeLock, useWebNotification, useScreenSafeArea, useFavicon, useTitle, react pwa, react immersive, react notification]
image: /img/og.png
---

# 在 React 中構建沉浸式 Web 應用:全螢幕、螢幕常亮與系統通知

Web 已經悄悄地長成了一個真正的應用平臺。一個閱讀應用應該能讓瀏覽器框架隱去、鋪滿整個螢幕。一個影片播放器應該在播放時阻止螢幕熄滅。一個計時器應該即使在分頁處於背景時也能提醒使用者。一個食譜應用應該尊重 iPhone 頂部的瀏海和底部的 Home 指示器。這些早已不是稀奇功能——它們是基礎期待——可在 React 裡把它們一一接上,每一個都是一場各種廠商前綴、權限流程、生命週期陷阱和 SSR 雷區的小冒險。

<!-- truncate -->

本文將帶你走過六種把 React 應用從「瀏覽器裡的頁面」變成「像裝上的應用」的瀏覽器能力:進入和退出全螢幕、在長任務中保持螢幕常亮、發送作業系統級通知、尊重帶瀏海的裝置的安全區域,以及更新標題和圖示以反映應用狀態。和往常一樣,我們會先用手動實作來開局,讓你看清正在發生什麼,然後再換成 [ReactUse](https://reactuse.com) 裡專門的 Hook。最後,我們會把六個 Hook 組合成一個專注模式閱讀視圖:進入全螢幕,鎖定螢幕常亮,在使用者閱讀太久時彈出通知,並尊重裝置的安全區域。

## 1. 沒有廠商前綴的全螢幕

### 手動實作

Fullscreen API 是「為什麼特性檢測很難」的最古老的例子之一。不同瀏覽器分別暴露了 `requestFullscreen`、`webkitRequestFullscreen`、`mozRequestFullScreen`、`msRequestFullscreen`,以及一組對應的 `fullscreenchange`、`webkitfullscreenchange`、`mozfullscreenchange`、`MSFullscreenChange` 事件。即使到了 2026 年,這些前綴也沒有完全消失:

```tsx
function ManualFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      setIsFullscreen(Boolean(fsEl));
    };
    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];
    events.forEach((e) => document.addEventListener(e, handleChange));
    return () =>
      events.forEach((e) => document.removeEventListener(e, handleChange));
  }, []);

  const enter = () => {
    const el = elementRef.current as any;
    if (!el) return;
    (
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen
    )?.call(el);
  };

  const exit = () => {
    const doc = document as any;
    (
      doc.exitFullscreen ||
      doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.msExitFullscreen
    )?.call(doc);
  };

  return (
    <div ref={elementRef}>
      <button onClick={isFullscreen ? exit : enter}>
        {isFullscreen ? "退出全螢幕" : "進入全螢幕"}
      </button>
    </div>
  );
}
```

它能跑。但這裡也有四十行的型別斷言、可選鏈和前綴雜技,對你真正想要的功能沒有任何貢獻。而且它默默地不完整——它沒有檢測出瀏覽器根本無法進入全螢幕的情況(被鎖定的 kiosk 模式、未宣告 `allow="fullscreen"` 的嵌入 iframe 等),所以你的按鈕看上去毫無反應。

### ReactUse 的方式:useFullscreen

`useFullscreen` 在底層包裝了 [screenfull](https://github.com/sindresorhus/screenfull) 函式庫,給你一個簡潔的元組:

```tsx
import { useRef } from "react";
import { useFullscreen } from "@reactuses/core";

function FullscreenViewer() {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, { toggleFullscreen, isEnabled }] = useFullscreen(ref, {
    onEnter: () => console.log("進入全螢幕"),
    onExit: () => console.log("退出全螢幕"),
  });

  if (!isEnabled) {
    return <p>當前環境不支援全螢幕。</p>;
  }

  return (
    <div
      ref={ref}
      style={{
        background: isFullscreen ? "#000" : "#f1f5f9",
        color: isFullscreen ? "#fff" : "#0f172a",
        padding: 40,
        minHeight: 200,
      }}
    >
      <h2>{isFullscreen ? "專注模式" : "點擊進入專注模式"}</h2>
      <button onClick={toggleFullscreen}>
        {isFullscreen ? "退出" : "進入"}全螢幕
      </button>
    </div>
  );
}
```

幾個值得指出的細節:

1. **`isEnabled`** 告訴你當前環境是否支援全螢幕。如果你在一個沒有權限的 iframe 裡,你可以渲染降級版本而不是一個騙人的按鈕。
2. **`onEnter`/`onExit` 回呼**讓你能播放聲音、調暗其他 UI 或上報埋點,而無需自己管理監聽器。
3. **`toggleFullscreen`** 在多次渲染中保持穩定(Hook 內部使用了 `useEvent`),所以你可以放心地把它傳給 memo 子元件而不會觸發失效。

同樣的模式適用於任何元素:影片、文章、編輯器面板。把 ref 傳進去,你就免費獲得了完整的生命週期。

## 2. 讓螢幕保持常亮

### 手動實作

Screen Wake Lock API 是任何使用者在看、在聽、在閱讀或在不觸碰螢幕一段時間的流程的正確工具。沒有它,行動裝置會在 OS 設定的逾時後變暗並鎖屏。有了它,你可以請求一個 sentinel 來在持有期間保持螢幕亮著。

陷阱是:wake lock 可能在任何時候被系統釋放,並且當頁面再次可見時必須重新請求——如果使用者把你的分頁放到背景再回來,你必須再請求一次 lock,否則螢幕又會開始變暗。

```tsx
function ManualWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    const request = async () => {
      try {
        sentinelRef.current = await navigator.wakeLock.request("screen");
        setActive(true);
        sentinelRef.current.addEventListener("release", () => setActive(false));
      } catch (e) {
        console.error("Wake lock 失敗:", e);
      }
    };

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        sentinelRef.current === null
      ) {
        request();
      }
    };

    request();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      sentinelRef.current?.release();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <span>螢幕鎖定:{active ? "開" : "關"}</span>;
}
```

這是對的,但你已經在裡面藏了三件細微的事情:對 `'wakeLock' in navigator` 的特性檢測、帶 try/catch 的請求流程,以及 visibility 變化時的重新請求。漏掉任何一件,lock 在野外就會悄悄失效。

### ReactUse 的方式:useWakeLock

`useWakeLock` 回傳一個有五個成員的小物件,並替你處理 visibility 那套舞蹈:

```tsx
import { useEffect } from "react";
import { useWakeLock } from "@reactuses/core";

function VideoPlayer({ playing }: { playing: boolean }) {
  const { isSupported, isActive, request, release } = useWakeLock({
    onRequest: () => console.log("已獲取 wake lock"),
    onRelease: () => console.log("已釋放 wake lock"),
    onError: (e) => console.error(e),
  });

  useEffect(() => {
    if (!isSupported) return;
    if (playing) request();
    else release();
  }, [playing, isSupported, request, release]);

  return (
    <p>
      {isSupported
        ? `Wake lock ${isActive ? "已啟用" : "未啟用"}`
        : "當前瀏覽器不支援 wake lock"}
    </p>
  );
}
```

你不用寫就能拿到的好處:

- **可見性重新請求**。如果使用者在影片播放時把你的分頁放到背景再回來,lock 會自動重新獲取。
- **延遲請求**。如果你在頁面隱藏時呼叫 `request()`,Hook 會記住,等頁面變可見時立即獲取——沒有報錯,沒有漏掉的 lock。
- **穩定回呼**。`onRequest`/`onRelease`/`onError` 傳一次就行,每次底層生命週期事件發生時它們都會執行,即使元件重渲。
- **強制請求**。`forceRequest()` 也暴露了出來,用於你想跳過可見性檢查的情況(少見,但 kiosk 類應用會用到)。

## 3. 作業系統級通知

### 手動實作

Web Notifications 在原理上很簡單(`new Notification("title")`),實踐上很囉嗦。你必須先請求權限、必須處理使用者永久拒絕的情況、必須特性檢測,並且必須記得在元件卸載時關閉打開過的通知——否則即使使用者已經關閉頁面,OS 上也會留下你的過期吐司。

```tsx
function ManualNotification({ message }: { message: string }) {
  const notifRef = useRef<Notification | null>(null);

  const send = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "denied") return;
    if (Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      if (result !== "granted") return;
    }
    notifRef.current?.close();
    notifRef.current = new Notification("提醒", { body: message });
  };

  useEffect(() => {
    return () => notifRef.current?.close();
  }, []);

  return <button onClick={send}>通知我</button>;
}
```

這大致是最小可用的實作。但如果使用者在中途切到背景,它仍然會洩漏。

### ReactUse 的方式:useWebNotification

`useWebNotification` 把權限流程、打開/關閉生命週期和 SSR 安全打包進了一個 Hook:

```tsx
import { useWebNotification } from "@reactuses/core";

function PomodoroTimer() {
  const { isSupported, show, close, ensurePermissions } =
    useWebNotification(true); // 掛載時請求權限

  const onSessionEnd = async () => {
    const granted = await ensurePermissions();
    if (!granted) {
      alert("番茄會話完成!"); // 優雅降級
      return;
    }
    show("時間到!", {
      body: "休息 5 分鐘。",
      icon: "/icons/tomato.png",
      tag: "pomodoro-session",
    });
  };

  return (
    <div>
      <button onClick={onSessionEnd} disabled={!isSupported}>
        結束會話
      </button>
      <button onClick={close}>關閉</button>
    </div>
  );
}
```

第一個參數控制 Hook 是否在掛載時立即請求權限,還是等到顯式呼叫 `ensurePermissions()` 時再請求。大多數應用想要懶版本——在使用者點擊之後才請求權限——因為否則你會在元件出現的瞬間就觸發瀏覽器的權限對話框,使用者會覺得很反感。

Hook 還會在卸載時自動關閉最近一條通知,所以離開計時器頁面會清理掉它產生過的吐司。

## 4. 尊重瀏海和 Home 指示器

### 手動實作

帶瀏海的 iPhone 和帶打孔屏的 Android 裝置都有安全區域內邊距。CSS 透過 `env(safe-area-inset-top)` 等暴露它們,但前提是你在 meta 標籤裡設定了 `viewport-fit=cover`。從 JavaScript 讀這些值很麻煩:

```tsx
function ManualSafeArea() {
  const [insets, setInsets] = useState({
    top: "0px",
    right: "0px",
    bottom: "0px",
    left: "0px",
  });

  useEffect(() => {
    const compute = () => {
      const root = document.documentElement;
      root.style.setProperty("--sa-top", "env(safe-area-inset-top, 0px)");
      root.style.setProperty("--sa-right", "env(safe-area-inset-right, 0px)");
      root.style.setProperty("--sa-bottom", "env(safe-area-inset-bottom, 0px)");
      root.style.setProperty("--sa-left", "env(safe-area-inset-left, 0px)");
      const cs = getComputedStyle(root);
      setInsets({
        top: cs.getPropertyValue("--sa-top"),
        right: cs.getPropertyValue("--sa-right"),
        bottom: cs.getPropertyValue("--sa-bottom"),
        left: cs.getPropertyValue("--sa-left"),
      });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return <div style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} />;
}
```

為了拿到概念上只是四個數字的東西,要寫一堆管道程式碼。

### ReactUse 的方式:useScreenSafeArea

`useScreenSafeArea` 直接回傳那四個內邊距,對 resize 進行了防抖且保持響應:

```tsx
import { useScreenSafeArea } from "@reactuses/core";

function SafeAwareLayout({ children }: { children: React.ReactNode }) {
  const [top, right, bottom, left] = useScreenSafeArea();

  return (
    <div
      style={{
        paddingTop: top || 0,
        paddingRight: right || 0,
        paddingBottom: bottom || 0,
        paddingLeft: left || 0,
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
```

在底層,Hook 在 `document.documentElement` 上安裝了 CSS 變數,所以同樣的值也對你樣式表裡的任何普通 CSS 可用——你可以在和 React 完全無關的樣式表裡使用 `var(--reactuse-safe-area-top)`。JS 值用來做條件 padding,CSS 變數則讓你的設計系統保持宣告式。

## 5. 把標題和 favicon 當作狀態

### 手動實作

更新 document title 和 favicon 在 DOM 世界裡是命令式的副作用,但在 React 世界裡概念上是純粹的衍生 state。最樸素的做法是每次變化一個 effect:

```tsx
function ManualTitle({ unread }: { unread: number }) {
  useEffect(() => {
    const original = document.title;
    document.title = unread > 0 ? `(${unread}) 收件匣` : "收件匣";
    return () => {
      document.title = original;
    };
  }, [unread]);
  return null;
}

function ManualFavicon({ src }: { src: string }) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) return;
    const previous = link.href;
    link.href = src;
    return () => {
      link.href = previous;
    };
  }, [src]);
  return null;
}
```

兩個 effect、兩個清理函式,兩個忘記清理然後發布過期標題的機會。

### ReactUse 的方式:useTitle 和 useFavicon

```tsx
import { useTitle, useFavicon } from "@reactuses/core";

function InboxStatus({ unread }: { unread: number }) {
  useTitle(unread > 0 ? `(${unread}) 收件匣` : "收件匣");
  useFavicon(unread > 0 ? "/icons/inbox-unread.svg" : "/icons/inbox.svg");
  return null;
}
```

整個元件就這些。兩個 Hook 都把標題/favicon 當成衍生 state 處理,所以輸入變化時它們會自動更新,並自動清理。`useFavicon` 還能處理 head 中存在多個 `<link rel="icon">` 標籤的情況(現代應用通常一個 `image/svg+xml`、一個 `image/png`),它會把所有標籤都更新。

## 全部組合:專注模式閱讀視圖

現在我們把六個 Hook 組合成一個專注模式閱讀視圖。使用者開啟一篇文章,點擊「專注」,應用就會:

1. 進入全螢幕
2. 鎖定螢幕常亮,避免裝置在閱讀中變暗
3. 在標題裡顯示已經讀了多久
4. 把 favicon 換成「勿擾」圖示
5. 尊重裝置的安全區域
6. 在 25 分鐘後發出通知建議休息

```tsx
import { useEffect, useRef, useState } from "react";
import {
  useFullscreen,
  useWakeLock,
  useWebNotification,
  useScreenSafeArea,
  useTitle,
  useFavicon,
} from "@reactuses/core";

const FOCUS_BREAK_MS = 25 * 60 * 1000;

function FocusReader({ article }: { article: { title: string; body: string } }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);

  const [isFullscreen, { toggleFullscreen, isEnabled: fsEnabled }] =
    useFullscreen(containerRef, {
      onExit: () => setIsFocus(false),
    });

  const wakeLock = useWakeLock();
  const notif = useWebNotification();
  const [top, right, bottom, left] = useScreenSafeArea();

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const timer = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  useTitle(isFocus ? `${timer} —— ${article.title}` : article.title);
  useFavicon(isFocus ? "/icons/dnd.svg" : "/icons/book.svg");

  useEffect(() => {
    if (!isFocus) return;
    startedAt.current = Date.now();
    const id = setInterval(() => {
      if (startedAt.current) {
        setElapsed(Date.now() - startedAt.current);
      }
    }, 1000);
    return () => {
      clearInterval(id);
      startedAt.current = null;
      setElapsed(0);
    };
  }, [isFocus]);

  useEffect(() => {
    if (!isFocus || elapsed < FOCUS_BREAK_MS) return;
    let cancelled = false;
    (async () => {
      const granted = await notif.ensurePermissions();
      if (cancelled || !granted) return;
      notif.show("該休息了", {
        body: "你已經讀了 25 分鐘。伸展一下,眨眨眼,深呼吸。",
        tag: "focus-break",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocus, elapsed, notif]);

  const enterFocus = async () => {
    if (!fsEnabled) {
      setIsFocus(true);
      await wakeLock.request();
      return;
    }
    setIsFocus(true);
    toggleFullscreen();
    await wakeLock.request();
  };

  const exitFocus = () => {
    if (isFullscreen) toggleFullscreen();
    wakeLock.release();
    setIsFocus(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        background: isFocus ? "#0f172a" : "#ffffff",
        color: isFocus ? "#f1f5f9" : "#0f172a",
        minHeight: "100vh",
        paddingTop: top || 24,
        paddingRight: right || 24,
        paddingBottom: bottom || 24,
        paddingLeft: left || 24,
        transition: "background 200ms ease, color 200ms ease",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>{article.title}</h1>
        {isFocus ? (
          <button onClick={exitFocus}>退出專注({timer})</button>
        ) : (
          <button onClick={enterFocus}>專注模式</button>
        )}
      </header>

      <article style={{ maxWidth: 680, margin: "0 auto", lineHeight: 1.7 }}>
        {article.body}
      </article>

      {isFocus && wakeLock.isSupported && (
        <p
          style={{
            position: "fixed",
            bottom: bottom || 12,
            right: right || 12,
            fontSize: 12,
            opacity: 0.6,
            margin: 0,
          }}
        >
          螢幕鎖定:{wakeLock.isActive ? "開" : "關"}
        </p>
      )}
    </div>
  );
}
```

六個 Hook,每一個只做一件事:

- **`useFullscreen`** 按需把容器變成真正的全螢幕元素
- **`useWakeLock`** 在使用者閱讀時讓螢幕保持喚醒
- **`useWebNotification`** 在專注 25 分鐘後提醒他們
- **`useScreenSafeArea`** 讓內容避開瀏海
- **`useTitle`** 把文件標題變成即時計時器
- **`useFavicon`** 在專注模式開啟時切換到「勿擾」圖示

Hook 之間互不知曉,但它們組合得非常乾淨,因為每一個都只擁有一個瀏覽器關注點。明天你可以加入第七項能力(比如網路感知或裝置方向)而不需要動現有的接線。

## 關於權限的一點說明

這些 API 中的三個(通知、wake lock、全螢幕)需要使用者手勢或顯式權限授予。Hook 暴露 `isSupported` 旗標,讓你能渲染降級版本而不是壞掉的按鈕,並接受回呼讓你可以優雅地從拒絕中恢復。模式始終如一:先特性檢測,只在使用者表達意圖後再請求,被拒絕時退回到非 API 的替代方案。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hook

- [`useFullscreen`](https://reactuse.com/browser/usefullscreen/) —— 在任何元素上進入、退出和切換全螢幕
- [`useWakeLock`](https://reactuse.com/browser/usewakelock/) —— 保持螢幕常亮,並在可見性變化時自動重新請求
- [`useWebNotification`](https://reactuse.com/browser/usewebnotification/) —— 發送系統級通知,權限流程已處理
- [`useScreenSafeArea`](https://reactuse.com/browser/usescreensafearea/) —— 響應式地讀取安全區域內邊距
- [`useTitle`](https://reactuse.com/browser/usetitle/) —— 宣告式地設定文件標題
- [`useFavicon`](https://reactuse.com/browser/usefavicon/) —— 根據應用狀態更新 favicon
- [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) —— 追蹤文件對使用者是否可見
- [`usePageLeave`](https://reactuse.com/browser/usepageleave/) —— 偵測游標何時離開頁面區域
- [`useSupported`](https://reactuse.com/state/usesupported/) —— 響應式地檢查瀏覽器 API 是否可用

---

ReactUse 提供了 100+ 個 React Hook。[全部探索 →](https://reactuse.com)
