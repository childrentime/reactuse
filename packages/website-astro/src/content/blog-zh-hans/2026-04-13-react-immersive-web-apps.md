---
title: "在 React 中构建沉浸式 Web 应用：全屏、屏幕常亮与系统通知"
description: "学习如何用 ReactUse 中的全屏、屏幕常亮、Web 通知、安全区域以及动态标题与图标 Hook，在 React 中构建沉浸式体验。"
slug: react-immersive-web-apps
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, fullscreen, pwa, tutorial]
keywords: [react fullscreen, useFullscreen, useWakeLock, useWebNotification, useScreenSafeArea, useFavicon, useTitle, react pwa, react immersive, react notification]
image: /img/og.png
---

# 在 React 中构建沉浸式 Web 应用：全屏、屏幕常亮与系统通知

Web 已经悄悄地长成了一个真正的应用平台。一个阅读应用应该能让浏览器框架隐去、铺满整个屏幕。一个视频播放器应该在播放时阻止屏幕熄灭。一个计时器应该即使在标签页处于后台时也能提醒用户。一个食谱应用应该尊重 iPhone 顶部的刘海和底部的 Home 指示器。这些早已不是稀奇功能——它们是基础期待——可在 React 里把它们一一接上，每一个都是一场各种厂商前缀、权限流程、生命周期陷阱和 SSR 雷区的小冒险。

<!-- truncate -->

本文将带你走过六种把 React 应用从"浏览器里的页面"变成"像装上的应用"的浏览器能力：进入和退出全屏、在长任务中保持屏幕常亮、发送操作系统级通知、尊重带刘海的设备的安全区域，以及更新标题和图标以反映应用状态。和往常一样，我们会先用手动实现来开局，让你看清正在发生什么，然后再换成 [ReactUse](https://reactuse.com) 里专门的 Hook。最后，我们会把六个 Hook 组合成一个专注模式阅读视图：进入全屏，锁定屏幕常亮，在用户阅读太久时弹出通知，并尊重设备的安全区域。

## 1. 没有厂商前缀的全屏

### 手动实现

Fullscreen API 是"为什么特性检测很难"的最古老的例子之一。不同浏览器分别暴露了 `requestFullscreen`、`webkitRequestFullscreen`、`mozRequestFullScreen`、`msRequestFullscreen`，以及一组对应的 `fullscreenchange`、`webkitfullscreenchange`、`mozfullscreenchange`、`MSFullscreenChange` 事件。即使到了 2026 年，这些前缀也没有完全消失：

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
        {isFullscreen ? "退出全屏" : "进入全屏"}
      </button>
    </div>
  );
}
```

它能跑。但这里也有四十行的类型断言、可选链和前缀杂技，对你真正想要的功能没有任何贡献。而且它默默地不完整——它没有检测出浏览器根本无法进入全屏的情况（被锁定的 kiosk 模式、未声明 `allow="fullscreen"` 的嵌入 iframe 等），所以你的按钮看上去毫无反应。

### ReactUse 的方式：useFullscreen

`useFullscreen` 在底层包装了 [screenfull](https://github.com/sindresorhus/screenfull) 库，给你一个简洁的元组：

```tsx
import { useRef } from "react";
import { useFullscreen } from "@reactuses/core";

function FullscreenViewer() {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, { toggleFullscreen, isEnabled }] = useFullscreen(ref, {
    onEnter: () => console.log("进入全屏"),
    onExit: () => console.log("退出全屏"),
  });

  if (!isEnabled) {
    return <p>当前环境不支持全屏。</p>;
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
      <h2>{isFullscreen ? "专注模式" : "点击进入专注模式"}</h2>
      <button onClick={toggleFullscreen}>
        {isFullscreen ? "退出" : "进入"}全屏
      </button>
    </div>
  );
}
```

几个值得指出的细节：

1. **`isEnabled`** 告诉你当前环境是否支持全屏。如果你在一个没有权限的 iframe 里，你可以渲染降级版本而不是一个骗人的按钮。
2. **`onEnter`/`onExit` 回调**让你能播放声音、调暗其他 UI 或上报埋点，而无需自己管理监听器。
3. **`toggleFullscreen`** 在多次渲染中保持稳定（Hook 内部使用了 `useEvent`），所以你可以放心地把它传给 memo 子组件而不会触发失效。

同样的模式适用于任何元素：视频、文章、编辑器面板。把 ref 传进去，你就免费获得了完整的生命周期。

## 2. 让屏幕保持常亮

### 手动实现

Screen Wake Lock API 是任何用户在看、在听、在阅读或在不触碰屏幕一段时间的流程的正确工具。没有它，移动设备会在 OS 设定的超时后变暗并锁屏。有了它，你可以请求一个 sentinel 来在持有期间保持屏幕亮着。

陷阱是：wake lock 可能在任何时候被系统释放，并且当页面再次可见时必须重新请求——如果用户把你的标签页放到后台再回来，你必须再请求一次 lock，否则屏幕又会开始变暗。

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
        console.error("Wake lock 失败：", e);
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

  return <span>屏幕锁定：{active ? "开" : "关"}</span>;
}
```

这是对的，但你已经在里面藏了三件细微的事情：对 `'wakeLock' in navigator` 的特性检测、带 try/catch 的请求流程，以及 visibility 变化时的重新请求。漏掉任何一件，lock 在野外就会悄悄失效。

### ReactUse 的方式：useWakeLock

`useWakeLock` 返回一个有五个成员的小对象，并替你处理 visibility 那套舞蹈：

```tsx
import { useEffect } from "react";
import { useWakeLock } from "@reactuses/core";

function VideoPlayer({ playing }: { playing: boolean }) {
  const { isSupported, isActive, request, release } = useWakeLock({
    onRequest: () => console.log("已获取 wake lock"),
    onRelease: () => console.log("已释放 wake lock"),
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
        ? `Wake lock ${isActive ? "已激活" : "未激活"}`
        : "当前浏览器不支持 wake lock"}
    </p>
  );
}
```

你不用写就能拿到的好处：

- **可见性重新请求**。如果用户在视频播放时把你的标签页放到后台再回来，lock 会自动重新获取。
- **延迟请求**。如果你在页面隐藏时调用 `request()`，Hook 会记住，等页面变可见时立即获取——没有报错，没有漏掉的 lock。
- **稳定回调**。`onRequest`/`onRelease`/`onError` 传一次就行，每次底层生命周期事件发生时它们都会运行，即使组件重渲。
- **强制请求**。`forceRequest()` 也暴露了出来，用于你想跳过可见性检查的情况（少见，但 kiosk 类应用会用到）。

## 3. 操作系统级通知

### 手动实现

Web Notifications 在原理上很简单（`new Notification("title")`），实践上很啰嗦。你必须先请求权限、必须处理用户永久拒绝的情况、必须特性检测，并且必须记得在组件卸载时关闭打开过的通知——否则即使用户已经关闭页面，OS 上也会留下你的过期吐司。

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

这大致是最小可用的实现。但如果用户在中途切到后台，它仍然会泄漏。

### ReactUse 的方式：useWebNotification

`useWebNotification` 把权限流程、打开/关闭生命周期和 SSR 安全打包进了一个 Hook：

```tsx
import { useWebNotification } from "@reactuses/core";

function PomodoroTimer() {
  const { isSupported, show, close, ensurePermissions } =
    useWebNotification(true); // 挂载时请求权限

  const onSessionEnd = async () => {
    const granted = await ensurePermissions();
    if (!granted) {
      alert("番茄会话完成！"); // 优雅降级
      return;
    }
    show("时间到！", {
      body: "休息 5 分钟。",
      icon: "/icons/tomato.png",
      tag: "pomodoro-session",
    });
  };

  return (
    <div>
      <button onClick={onSessionEnd} disabled={!isSupported}>
        结束会话
      </button>
      <button onClick={close}>关闭</button>
    </div>
  );
}
```

第一个参数控制 Hook 是否在挂载时立即请求权限，还是等到显式调用 `ensurePermissions()` 时再请求。大多数应用想要懒版本——在用户点击之后才请求权限——因为否则你会在组件出现的瞬间就触发浏览器的权限对话框，用户会觉得很反感。

Hook 还会在卸载时自动关闭最近一条通知，所以离开计时器页面会清理掉它产生过的吐司。

## 4. 尊重刘海和 Home 指示器

### 手动实现

带刘海的 iPhone 和带打孔屏的 Android 设备都有安全区域内边距。CSS 通过 `env(safe-area-inset-top)` 等暴露它们，但前提是你在 meta 标签里设置了 `viewport-fit=cover`。从 JavaScript 读这些值很麻烦：

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

为了拿到概念上只是四个数字的东西，要写一堆管道代码。

### ReactUse 的方式：useScreenSafeArea

`useScreenSafeArea` 直接返回那四个内边距，对 resize 进行了防抖且保持响应：

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

在底层，Hook 在 `document.documentElement` 上安装了 CSS 变量，所以同样的值也对你样式表里的任何普通 CSS 可用——你可以在和 React 完全无关的样式表里使用 `var(--reactuse-safe-area-top)`。JS 值用来做条件 padding，CSS 变量则让你的设计系统保持声明式。

## 5. 把标题和 favicon 当作状态

### 手动实现

更新 document title 和 favicon 在 DOM 世界里是命令式的副作用，但在 React 世界里概念上是纯粹的派生 state。最朴素的做法是每次变化一个 effect：

```tsx
function ManualTitle({ unread }: { unread: number }) {
  useEffect(() => {
    const original = document.title;
    document.title = unread > 0 ? `(${unread}) 收件箱` : "收件箱";
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

两个 effect、两个清理函数，两个忘记清理然后发布过期标题的机会。

### ReactUse 的方式：useTitle 和 useFavicon

```tsx
import { useTitle, useFavicon } from "@reactuses/core";

function InboxStatus({ unread }: { unread: number }) {
  useTitle(unread > 0 ? `(${unread}) 收件箱` : "收件箱");
  useFavicon(unread > 0 ? "/icons/inbox-unread.svg" : "/icons/inbox.svg");
  return null;
}
```

整个组件就这些。两个 Hook 都把标题/favicon 当成派生 state 处理，所以输入变化时它们会自动更新，并自动清理。`useFavicon` 还能处理 head 中存在多个 `<link rel="icon">` 标签的情况（现代应用通常一个 `image/svg+xml`、一个 `image/png`），它会把所有标签都更新。

## 全部组合：专注模式阅读视图

现在我们把六个 Hook 组合成一个专注模式阅读视图。用户打开一篇文章，点击"专注"，应用就会：

1. 进入全屏
2. 锁定屏幕常亮，避免设备在阅读中变暗
3. 在标题里显示已经读了多久
4. 把 favicon 换成"勿扰"图标
5. 尊重设备的安全区域
6. 在 25 分钟后发出通知建议休息

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
      notif.show("该休息了", {
        body: "你已经读了 25 分钟。伸展一下，眨眨眼，深呼吸。",
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
          <button onClick={exitFocus}>退出专注（{timer}）</button>
        ) : (
          <button onClick={enterFocus}>专注模式</button>
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
          屏幕锁定：{wakeLock.isActive ? "开" : "关"}
        </p>
      )}
    </div>
  );
}
```

六个 Hook，每一个只做一件事：

- **`useFullscreen`** 按需把容器变成真正的全屏元素
- **`useWakeLock`** 在用户阅读时让屏幕保持唤醒
- **`useWebNotification`** 在专注 25 分钟后提醒他们
- **`useScreenSafeArea`** 让内容避开刘海
- **`useTitle`** 把文档标题变成实时计时器
- **`useFavicon`** 在专注模式开启时切换到"勿扰"图标

Hook 之间互不知晓，但它们组合得非常干净，因为每一个都只拥有一个浏览器关注点。明天你可以加入第七项能力（比如网络感知或设备方向）而不需要动现有的接线。

## 关于权限的一点说明

这些 API 中的三个（通知、wake lock、全屏）需要用户手势或显式权限授予。Hook 暴露 `isSupported` 标志，让你能渲染降级版本而不是坏掉的按钮，并接受回调让你可以优雅地从拒绝中恢复。模式始终如一：先特性检测，只在用户表达意图后再请求，被拒绝时退回到非 API 的替代方案。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hook

- [`useFullscreen`](https://reactuse.com/browser/usefullscreen/) —— 在任何元素上进入、退出和切换全屏
- [`useWakeLock`](https://reactuse.com/browser/usewakelock/) —— 保持屏幕常亮，并在可见性变化时自动重新请求
- [`useWebNotification`](https://reactuse.com/browser/usewebnotification/) —— 发送系统级通知，权限流程已处理
- [`useScreenSafeArea`](https://reactuse.com/browser/usescreensafearea/) —— 响应式地读取安全区域内边距
- [`useTitle`](https://reactuse.com/browser/usetitle/) —— 声明式地设置文档标题
- [`useFavicon`](https://reactuse.com/browser/usefavicon/) —— 根据应用状态更新 favicon
- [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/) —— 跟踪文档对用户是否可见
- [`usePageLeave`](https://reactuse.com/browser/usepageleave/) —— 检测光标何时离开页面区域
- [`useSupported`](https://reactuse.com/state/usesupported/) —— 响应式地检查浏览器 API 是否可用

---

ReactUse 提供了 100+ 个 React Hook。[全部探索 →](https://reactuse.com)
