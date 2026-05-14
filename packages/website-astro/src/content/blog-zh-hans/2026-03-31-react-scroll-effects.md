---
title: "React 滚动效果：告别第三方库"
description: "学习如何用 ReactUse 的 Hook 实现滚动动画、滚动锁定、平滑滚动和吸顶效果，无需任何外部滚动库。"
slug: react-scroll-effects
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, scroll, tutorial, useScroll]
keywords: [react scroll effects, useScroll, useScrollLock, scroll hooks, react sticky header, scroll-linked animations, useScrollIntoView]
image: /img/og.png
---

# React 滚动效果：告别第三方库

滚动是 Web 上最基础的用户交互。随阅读进度填充的进度条、滑动后缩小并吸顶的导航栏、打开弹窗时锁定背后页面的滚动、点击按钮平滑跳转到指定区域——这些效果几乎出现在每个现代网站上。然而在 React 中正确实现它们，意味着你要同时处理 `addEventListener`、`IntersectionObserver`、`overflow` 样式以及一大堆意想不到的边界情况。大多数开发者要么引入一个沉重的动画库，要么花几个小时写出脆弱的命令式代码。

<!-- truncate -->

本文选择另一条路。我们将逐一攻克六个常见的滚动场景，每个场景先展示手动实现，让你理解底层原理，然后用 [ReactUse](https://reactuse.com) 中对应的 Hook 替换。读完之后，你将拥有一组可组合、SSR 安全的 Hook 工具箱，涵盖滚动追踪、滚动锁定、平滑滚动、吸顶检测、可见性检测和交叉观察——全程不需要任何外部动画或滚动库。

## 1. 追踪滚动位置

### 手动实现

追踪用户的滚动距离看起来很简单，但一旦要考虑节流、方向检测以及判断用户是否滚到了边缘，复杂度就上来了。

```tsx
import { useEffect, useRef, useState } from "react";

function ManualScrollTracker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const lastY = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const y = el.scrollTop;
      setDirection(y > lastY.current ? "down" : "up");
      lastY.current = y;
      setScrollY(y);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const progress = containerRef.current
    ? scrollY /
      (containerRef.current.scrollHeight - containerRef.current.clientHeight)
    : 0;

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 4,
          width: `${progress * 100}%`,
          background: "#4f46e5",
          transition: "width 0.1s",
        }}
      />
      <div
        ref={containerRef}
        style={{ height: "100vh", overflow: "auto" }}
      >
        {/* 长内容 */}
      </div>
    </div>
  );
}
```

对于一个简单的进度条来说够用了，但它无法告诉你用户是否已经滚到底部，不支持横向滚动追踪，方向检测也很粗糙——惯性滚动中一个像素的反弹就会翻转方向。如果还要加上"到达边缘"的阈值判断，状态管理和计算量会更多。

### 用 useScroll

[`useScroll`](https://reactuse.com/browser/usescroll/) 返回当前的 `x` 和 `y` 偏移量、双轴滚动方向，以及 `isScrolling` 和 `arrivedState` 布尔值，后者会告诉你用户是否到达了上、下、左、右边缘。

```tsx
import { useScroll } from "@reactuses/core";
import { useRef } from "react";

function ScrollTracker() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [position, direction, arrivedState, isScrolling] = useScroll(
    containerRef,
    { throttle: 50 }
  );

  const el = containerRef.current;
  const progress = el
    ? position.y / (el.scrollHeight - el.clientHeight)
    : 0;

  return (
    <div>
      {/* 进度条 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 4,
          width: `${Math.min(progress * 100, 100)}%`,
          background: "#4f46e5",
          zIndex: 50,
        }}
      />

      {/* 滚动信息浮层 */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          padding: "8px 16px",
          background: "#1e293b",
          color: "#fff",
          borderRadius: 8,
          fontSize: 14,
          zIndex: 50,
        }}
      >
        <div>Y: {Math.round(position.y)}px</div>
        <div>方向: {direction.y ?? "无"}</div>
        <div>
          {arrivedState.bottom
            ? "已到达底部！"
            : isScrolling
              ? "滚动中..."
              : "空闲"}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ height: "100vh", overflow: "auto" }}
      >
        {Array.from({ length: 100 }, (_, i) => (
          <p key={i} style={{ padding: "8px 16px" }}>
            第 {i + 1} 段
          </p>
        ))}
      </div>
    </div>
  );
}
```

一次 Hook 调用就替代了所有手动事件绑定、方向追踪和边缘检测。内置的 `throttle` 选项保证即使在高频 scroll 事件下也能保持流畅。

## 2. 弹窗滚动锁定

### 手动实现

打开弹窗时，你需要阻止弹窗背后的页面继续滚动。经典做法是给 body 加上 `overflow: hidden`：

```tsx
import { useEffect, useState } from "react";

function ManualModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开弹窗</button>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
            }}
          >
            <h2>弹窗标题</h2>
            <p>背后的页面无法滚动。</p>
            <button onClick={() => setIsOpen(false)}>关闭</button>
          </div>
        </div>
      )}
    </>
  );
}
```

桌面浏览器上没问题，但 `position: fixed` 这个技巧在 iOS Safari 上会导致页面跳动——除非你小心保存和恢复滚动位置。它也没有处理多层弹窗叠加（比如弹窗里再打开确认对话框）的情况。

### 用 useScrollLock

[`useScrollLock`](https://reactuse.com/browser/usescrolllock/) 帮你处理了所有这些边界情况。传入要锁定的元素引用（通常是 `document.body`）和一个控制锁定状态的布尔值。

```tsx
import { useScrollLock } from "@reactuses/core";
import { useState } from "react";

function Modal() {
  const [isOpen, setIsOpen] = useState(false);

  useScrollLock(
    typeof document !== "undefined" ? document.body : null,
    isOpen
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开弹窗</button>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
            }}
          >
            <h2>弹窗标题</h2>
            <p>滚动已锁定，试试滑动背后的页面。</p>
            <button onClick={() => setIsOpen(false)}>关闭</button>
          </div>
        </div>
      )}
    </>
  );
}
```

一行代码锁定滚动，组件卸载时自动解锁，SSR 环境下也安全无虞。滚动位置在所有浏览器上都能正确保留。

## 3. 平滑滚动到指定区域

### 手动实现

落地页上常见的"滚动到某区域"按钮，命令式的写法如下：

```tsx
import { useRef } from "react";

function ManualScrollTo() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = () => {
    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div>
      <nav style={{ position: "fixed", top: 0, padding: 16, zIndex: 10 }}>
        <button onClick={scrollToSection}>跳转到功能介绍</button>
      </nav>

      <div style={{ height: "100vh", background: "#f1f5f9" }}>
        <h1 style={{ paddingTop: 80 }}>首屏区域</h1>
      </div>

      <div ref={sectionRef} style={{ padding: 40 }}>
        <h2>功能介绍</h2>
        <p>功能详情…</p>
      </div>
    </div>
  );
}
```

`scrollIntoView` 对基本场景够用，但它无法控制缓动曲线、滚动轴和偏移量（当你有一个固定头部，它会遮挡目标元素时，偏移量就很重要了）。同时也没有办法知道滚动动画何时完成。

### 用 useScrollIntoView

[`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) 提供了对滚动动画的精细控制，包括自定义时长、缓动函数、滚动轴、偏移量和完成回调。

```tsx
import { useScrollIntoView } from "@reactuses/core";
import { useRef } from "react";

function SmoothScrollPage() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollIntoView } = useScrollIntoView(targetRef, {
    duration: 800,
    offset: 80, // 为固定头部留出空间
  });

  return (
    <div>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "#1e293b",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          zIndex: 50,
        }}
      >
        <button
          onClick={() => scrollIntoView({ alignment: "start" })}
          style={{
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          跳转到定价
        </button>
      </nav>

      <div style={{ height: "150vh", paddingTop: 80 }}>
        <h1>首屏</h1>
        <p>向下滚动或点击上方按钮。</p>
      </div>

      <div ref={targetRef} style={{ padding: 40, background: "#eef2ff" }}>
        <h2>定价方案</h2>
        <p>详细的套餐和价格信息…</p>
      </div>

      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

`offset` 选项确保目标区域出现在固定头部下方，而不是被遮挡。平滑滚动动画使用可配置的缓动函数，如果组件在滚动过程中卸载，Hook 也会正确清理。

## 4. 吸顶检测

### 手动实现

一个常见的交互模式是：当 header 吸顶后改变外观，比如加上阴影、缩小高度。手动检测需要借助 `IntersectionObserver` 和一个哨兵元素：

```tsx
import { useEffect, useRef, useState } from "react";

function ManualStickyHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* 哨兵元素：当它离开视口时，header 就处于吸顶状态 */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      <header
        style={{
          position: "sticky",
          top: 0,
          padding: isStuck ? "8px 24px" : "16px 24px",
          background: isStuck ? "rgba(255,255,255,0.95)" : "#fff",
          boxShadow: isStuck ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          transition: "all 0.2s",
          zIndex: 40,
        }}
      >
        <h1 style={{ margin: 0, fontSize: isStuck ? 18 : 24 }}>
          我的应用
        </h1>
      </header>
      <main style={{ padding: 24 }}>
        {Array.from({ length: 80 }, (_, i) => (
          <p key={i}>内容段落 {i + 1}</p>
        ))}
      </main>
    </div>
  );
}
```

哨兵方案能用但很脆弱：你需要精确地放置哨兵元素，管理观察者的生命周期，并在 DOM 结构变化时保持同步。

### 用 useSticky

[`useSticky`](https://reactuse.com/element/usesticky/) 干净利落地解决了吸顶检测问题，返回一个布尔值，当元素进入吸顶状态时翻转为 `true`。

```tsx
import { useSticky } from "@reactuses/core";
import { useRef } from "react";

function StickyHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [isStuck] = useSticky(headerRef);

  return (
    <div>
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          padding: isStuck ? "8px 24px" : "16px 24px",
          background: isStuck
            ? "rgba(255,255,255,0.95)"
            : "#fff",
          boxShadow: isStuck
            ? "0 2px 8px rgba(0,0,0,0.1)"
            : "none",
          transition: "all 0.2s",
          zIndex: 40,
        }}
      >
        <h1 style={{ margin: 0, fontSize: isStuck ? 18 : 24 }}>
          我的应用
        </h1>
      </header>
      <main style={{ padding: 24 }}>
        {Array.from({ length: 80 }, (_, i) => (
          <p key={i}>内容段落 {i + 1}</p>
        ))}
      </main>
    </div>
  );
}
```

不需要哨兵元素，不需要手动设置观察者。Hook 在内部完成检测，给你一个简单的响应式布尔值来驱动样式。

## 5. 滚动进入视口时的渐显效果

### 手动实现

滚动渐显效果随处可见。标准做法是为每个需要动画的元素设置 `IntersectionObserver`：

```tsx
import { useEffect, useRef, useState } from "react";

function ManualReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // 只动画一次
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}
```

每个需要渐显效果的组件都复制粘贴这段观察者逻辑，很快就会让人厌烦。

### 用 useElementVisibility

[`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) 将 `IntersectionObserver` 封装成一个布尔值返回。搭配 `useState` 标记位即可实现单次渐显效果：

```tsx
import { useElementVisibility } from "@reactuses/core";
import { useRef, useState, useEffect } from "react";

function RevealOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible] = useElementVisibility(ref);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (visible && !hasRevealed) {
      setHasRevealed(true);
    }
  }, [visible, hasRevealed]);

  return (
    <div
      ref={ref}
      style={{
        opacity: hasRevealed ? 1 : 0,
        transform: hasRevealed ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}

function FeaturePage() {
  return (
    <div style={{ padding: "100vh 24px 24px" }}>
      <RevealOnScroll>
        <h2>功能一</h2>
        <p>滚动到视口内时淡入显示。</p>
      </RevealOnScroll>
      <div style={{ height: 200 }} />
      <RevealOnScroll>
        <h2>功能二</h2>
        <p>每个区域独立动画。</p>
      </RevealOnScroll>
      <div style={{ height: 200 }} />
      <RevealOnScroll>
        <h2>功能三</h2>
        <p>只动画一次——回滚时不会闪烁。</p>
      </RevealOnScroll>
    </div>
  );
}
```

`useElementVisibility` 提供实时的可见性状态。`hasRevealed` 标记确保动画只触发一次。如果你想要重复触发动画，只需去掉标记位，直接用 `visible` 驱动样式即可。

## 6. 高级交叉观察：滚动进度指示

### 手动实现

更高级的滚动效果——比如一个随着你滚动某个区域而逐渐填充的进度条——需要精细的交叉比率数据：

```tsx
import { useEffect, useRef, useState } from "react";

function ManualSectionProgress() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
    const observer = new IntersectionObserver(
      ([entry]) => setRatio(entry.intersectionRatio),
      { threshold: thresholds }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div style={{ height: "100vh" }} />
      <div ref={sectionRef} style={{ minHeight: "100vh", padding: 40 }}>
        <div
          style={{
            position: "sticky",
            top: 20,
            width: 200,
            height: 8,
            background: "#e2e8f0",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${ratio * 100}%`,
              background: "#4f46e5",
              borderRadius: 4,
              transition: "width 0.1s",
            }}
          />
        </div>
        <h2>长篇区域</h2>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>区域中的第 {i + 1} 段。</p>
        ))}
      </div>
      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

手动构建 101 个阈值点并管理观察者生命周期，代码冗长。如果你需要多个不同 root margin 或目标的观察者，样板代码量会翻倍。

### 用 useIntersectionObserver

[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) 以声明式的方式暴露完整的 `IntersectionObserver` API，让你直接获取 `IntersectionObserverEntry`，包括 `intersectionRatio`、`isIntersecting` 和 `boundingClientRect`。

```tsx
import { useIntersectionObserver } from "@reactuses/core";
import { useRef, useState } from "react";

function SectionProgress() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0);

  useIntersectionObserver(
    sectionRef,
    ([entry]) => {
      setRatio(entry.intersectionRatio);
    },
    {
      threshold: Array.from({ length: 101 }, (_, i) => i / 100),
    }
  );

  return (
    <div>
      <div style={{ height: "100vh" }} />
      <div ref={sectionRef} style={{ minHeight: "100vh", padding: 40 }}>
        <div
          style={{
            position: "sticky",
            top: 20,
            width: 200,
            height: 8,
            background: "#e2e8f0",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${ratio * 100}%`,
              background: "#4f46e5",
              borderRadius: 4,
              transition: "width 0.1s",
            }}
          />
        </div>
        <h2>长篇区域</h2>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>区域中的第 {i + 1} 段。</p>
        ))}
      </div>
      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

Hook 负责管理观察者的生命周期，在选项变化时重新连接，在卸载时自动清理。你只需关注拿到交叉数据后要做什么，而不是怎么把观察者连接起来。

## 融会贯通

这些 Hook 天然可组合。下面是一个综合运用六个 Hook 的落地页骨架：

```tsx
import {
  useScroll,
  useScrollLock,
  useScrollIntoView,
} from "@reactuses/core";
import { useSticky, useElementVisibility } from "@reactuses/core";
import { useRef, useState } from "react";

function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // 追踪滚动进度
  const [position] = useScroll(scrollContainerRef);

  // 吸顶检测
  const [isStuck] = useSticky(headerRef);

  // 平滑滚动到定价区域
  const { scrollIntoView } = useScrollIntoView(pricingRef, {
    offset: 64,
  });

  // 弹窗滚动锁定
  const [modalOpen, setModalOpen] = useState(false);
  useScrollLock(
    typeof document !== "undefined" ? document.body : null,
    modalOpen
  );

  // 定价区域渐显
  const [pricingVisible] = useElementVisibility(pricingRef);

  const el = scrollContainerRef.current;
  const progress = el
    ? position.y / (el.scrollHeight - el.clientHeight)
    : 0;

  return (
    <div ref={scrollContainerRef} style={{ height: "100vh", overflow: "auto" }}>
      {/* 进度条 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 3,
          width: `${Math.min(progress * 100, 100)}%`,
          background: "#4f46e5",
          zIndex: 60,
        }}
      />

      {/* 吸顶导航 */}
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          padding: isStuck ? "8px 24px" : "16px 24px",
          background: "#fff",
          boxShadow: isStuck ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          transition: "all 0.2s",
          zIndex: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 700 }}>我的应用</span>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => scrollIntoView()}>定价</button>
          <button onClick={() => setModalOpen(true)}>联系我们</button>
        </div>
      </header>

      {/* 首屏 */}
      <section style={{ height: "100vh", padding: 40 }}>
        <h1>打造出色的产品</h1>
      </section>

      {/* 带渐显效果的定价区域 */}
      <section
        ref={pricingRef}
        style={{
          padding: 40,
          opacity: pricingVisible ? 1 : 0,
          transform: pricingVisible ? "none" : "translateY(30px)",
          transition: "all 0.6s ease",
        }}
      >
        <h2>定价方案</h2>
        <p>套餐和价格详情。</p>
      </section>

      <div style={{ height: "100vh" }} />

      {/* 弹窗 */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
            }}
          >
            <h2>联系我们</h2>
            <p>弹窗打开时页面滚动已被锁定。</p>
            <button onClick={() => setModalOpen(false)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

每个 Hook 各司其职，通过 ref 自然共享元素，彼此不冲突，卸载时全部自动清理。

## 安装

```bash
npm i @reactuses/core
```

## 相关 Hook

- [`useScroll`](https://reactuse.com/browser/usescroll/) -- 追踪滚动位置、方向和边缘到达状态
- [`useScrollLock`](https://reactuse.com/browser/usescrolllock/) -- 锁定任意元素的滚动
- [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) -- 带偏移量和缓动的平滑滚动
- [`useSticky`](https://reactuse.com/element/usesticky/) -- 检测元素是否进入吸顶状态
- [`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) -- 检测元素是否在视口中可见
- [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) -- 功能完整的交叉观察
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) -- 声明式绑定事件监听器
- [`useElementSize`](https://reactuse.com/element/useelementsize/) -- 响应式追踪元素尺寸
- [`useElementBounding`](https://reactuse.com/element/useelementbounding/) -- 获取元素的实时边界矩形

---

ReactUse 提供了 100 多个 React Hook。[浏览全部 →](https://reactuse.com)
