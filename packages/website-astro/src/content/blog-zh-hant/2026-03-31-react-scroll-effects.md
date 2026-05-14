---
title: "React 捲動效果：不靠第三方套件也能搞定"
description: "學習如何用 ReactUse 的 Hook 實現捲動動畫、捲動鎖定、平滑捲動和黏性標頭，無需任何外部捲動套件。"
slug: react-scroll-effects
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-31
tags: [react, hooks, scroll, tutorial, useScroll]
keywords: [react scroll effects, useScroll, useScrollLock, scroll hooks, react sticky header, scroll-linked animations, useScrollIntoView]
image: /img/og.png
---

# React 捲動效果：不靠第三方套件也能搞定

捲動是 Web 上最基礎的使用者互動。隨閱讀進度填滿的進度條、滑動後縮小並吸頂的導覽列、開啟彈窗時鎖定背後頁面的捲動、點擊按鈕平滑跳轉到指定區域——這些效果幾乎出現在每個現代網站上。然而在 React 中正確實現它們，意味著你得同時處理 `addEventListener`、`IntersectionObserver`、`overflow` 樣式以及一大堆意想不到的邊界情況。大多數開發者要嘛引入一個沉重的動畫套件，要嘛花幾小時寫出脆弱的命令式程式碼。

<!-- truncate -->

本文選擇另一條路。我們將逐一攻克六個常見的捲動場景，每個場景先展示手動實作，讓你理解底層原理，再用 [ReactUse](https://reactuse.com) 中對應的 Hook 取代。讀完之後，你將擁有一組可組合、SSR 安全的 Hook 工具箱，涵蓋捲動追蹤、捲動鎖定、平滑捲動、吸頂偵測、可見性偵測和交叉觀察——全程不需要任何外部動畫或捲動套件。

## 1. 追蹤捲動位置

### 手動實作

追蹤使用者的捲動距離看起來很簡單，但一旦要考慮節流、方向偵測以及判斷使用者是否捲到了邊緣，複雜度就上來了。

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
        {/* 長內容 */}
      </div>
    </div>
  );
}
```

做一個簡單的進度條夠用了，但它沒辦法告訴你使用者是否已捲到底部，不支援橫向捲動追蹤，方向偵測也很粗糙——慣性捲動中一個像素的反彈就會翻轉方向。如果還要加上「到達邊緣」的閾值判斷，狀態管理和計算量會更多。

### 用 useScroll

[`useScroll`](https://reactuse.com/browser/usescroll/) 回傳當前的 `x` 和 `y` 偏移量、雙軸捲動方向，以及 `isScrolling` 和 `arrivedState` 布林值，後者會告訴你使用者是否到達了上、下、左、右邊緣。

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
      {/* 進度條 */}
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

      {/* 捲動資訊浮層 */}
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
        <div>方向: {direction.y ?? "無"}</div>
        <div>
          {arrivedState.bottom
            ? "已到達底部！"
            : isScrolling
              ? "捲動中..."
              : "閒置"}
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

一次 Hook 呼叫就取代了所有手動事件綁定、方向追蹤和邊緣偵測。內建的 `throttle` 選項確保即使在高頻 scroll 事件下也能保持流暢。

## 2. 彈窗捲動鎖定

### 手動實作

開啟彈窗時，你需要阻止彈窗背後的頁面繼續捲動。經典做法是給 body 加上 `overflow: hidden`：

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
      <button onClick={() => setIsOpen(true)}>開啟彈窗</button>
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
            <h2>彈窗標題</h2>
            <p>背後的頁面無法捲動。</p>
            <button onClick={() => setIsOpen(false)}>關閉</button>
          </div>
        </div>
      )}
    </>
  );
}
```

桌面瀏覽器上沒問題，但 `position: fixed` 這個技巧在 iOS Safari 上會導致頁面跳動——除非你小心保存和恢復捲動位置。它也沒有處理多層彈窗疊加（比如彈窗裡再開啟確認對話框）的情況。

### 用 useScrollLock

[`useScrollLock`](https://reactuse.com/browser/usescrolllock/) 幫你處理了所有這些邊界情況。傳入要鎖定的元素參考（通常是 `document.body`）和一個控制鎖定狀態的布林值。

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
      <button onClick={() => setIsOpen(true)}>開啟彈窗</button>
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
            <h2>彈窗標題</h2>
            <p>捲動已鎖定，試試滑動背後的頁面。</p>
            <button onClick={() => setIsOpen(false)}>關閉</button>
          </div>
        </div>
      )}
    </>
  );
}
```

一行程式碼鎖定捲動，元件卸載時自動解鎖，SSR 環境下也安全無虞。捲動位置在所有瀏覽器上都能正確保留。

## 3. 平滑捲動到指定區域

### 手動實作

Landing page 上常見的「捲動到某區域」按鈕，命令式的寫法如下：

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
        <button onClick={scrollToSection}>跳轉到功能介紹</button>
      </nav>

      <div style={{ height: "100vh", background: "#f1f5f9" }}>
        <h1 style={{ paddingTop: 80 }}>首屏區域</h1>
      </div>

      <div ref={sectionRef} style={{ padding: 40 }}>
        <h2>功能介紹</h2>
        <p>功能詳情…</p>
      </div>
    </div>
  );
}
```

`scrollIntoView` 對基本場景夠用，但它無法控制緩動曲線、捲動軸和偏移量（當你有一個固定標頭，它會遮擋目標元素時，偏移量就很重要了）。同時也沒有辦法知道捲動動畫何時完成。

### 用 useScrollIntoView

[`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) 提供了對捲動動畫的精細控制，包括自訂持續時間、緩動函式、捲動軸、偏移量和完成回呼。

```tsx
import { useScrollIntoView } from "@reactuses/core";
import { useRef } from "react";

function SmoothScrollPage() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollIntoView } = useScrollIntoView(targetRef, {
    duration: 800,
    offset: 80, // 為固定標頭留出空間
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
          跳轉到定價
        </button>
      </nav>

      <div style={{ height: "150vh", paddingTop: 80 }}>
        <h1>首屏</h1>
        <p>向下捲動或點擊上方按鈕。</p>
      </div>

      <div ref={targetRef} style={{ padding: 40, background: "#eef2ff" }}>
        <h2>定價方案</h2>
        <p>詳細的方案和價格資訊…</p>
      </div>

      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

`offset` 選項確保目標區域出現在固定標頭下方，而不是被遮擋。平滑捲動動畫使用可配置的緩動函式，如果元件在捲動過程中卸載，Hook 也會正確清理。

## 4. 吸頂偵測

### 手動實作

一個常見的互動模式是：當 header 吸頂後改變外觀，比如加上陰影、縮小高度。手動偵測需要借助 `IntersectionObserver` 和一個哨兵元素：

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
      {/* 哨兵元素：當它離開可視區域時，header 就處於吸頂狀態 */}
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
          我的應用
        </h1>
      </header>
      <main style={{ padding: 24 }}>
        {Array.from({ length: 80 }, (_, i) => (
          <p key={i}>內容段落 {i + 1}</p>
        ))}
      </main>
    </div>
  );
}
```

哨兵方案能用但很脆弱：你需要精確地放置哨兵元素，管理觀察者的生命週期，並在 DOM 結構變化時保持同步。

### 用 useSticky

[`useSticky`](https://reactuse.com/element/usesticky/) 乾淨俐落地解決了吸頂偵測問題，回傳一個布林值，當元素進入吸頂狀態時翻轉為 `true`。

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
          我的應用
        </h1>
      </header>
      <main style={{ padding: 24 }}>
        {Array.from({ length: 80 }, (_, i) => (
          <p key={i}>內容段落 {i + 1}</p>
        ))}
      </main>
    </div>
  );
}
```

不需要哨兵元素，不需要手動設定觀察者。Hook 在內部完成偵測，給你一個簡單的響應式布林值來驅動樣式。

## 5. 捲動進入視埠時的漸顯效果

### 手動實作

捲動漸顯效果隨處可見。標準做法是為每個需要動畫的元素設定 `IntersectionObserver`：

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
          observer.unobserve(el); // 只動畫一次
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

每個需要漸顯效果的元件都複製貼上這段觀察者邏輯，很快就讓人厭煩。

### 用 useElementVisibility

[`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) 將 `IntersectionObserver` 封裝成一個布林值回傳。搭配 `useState` 標記位即可實現單次漸顯效果：

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
        <p>捲動到可視區域內時淡入顯示。</p>
      </RevealOnScroll>
      <div style={{ height: 200 }} />
      <RevealOnScroll>
        <h2>功能二</h2>
        <p>每個區域獨立動畫。</p>
      </RevealOnScroll>
      <div style={{ height: 200 }} />
      <RevealOnScroll>
        <h2>功能三</h2>
        <p>只動畫一次——回捲時不會閃爍。</p>
      </RevealOnScroll>
    </div>
  );
}
```

`useElementVisibility` 提供即時的可見性狀態。`hasRevealed` 標記確保動畫只觸發一次。如果你想要重複觸發動畫，只需去掉標記位，直接用 `visible` 驅動樣式即可。

## 6. 進階交叉觀察：捲動進度指示

### 手動實作

更進階的捲動效果——比如一個隨著你捲動某個區域而逐漸填滿的進度條——需要精細的交叉比率資料：

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
        <h2>長篇區域</h2>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>區域中的第 {i + 1} 段。</p>
        ))}
      </div>
      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

手動建構 101 個閾值點並管理觀察者生命週期，程式碼冗長。如果你需要多個不同 root margin 或目標的觀察者，樣板程式碼量會翻倍。

### 用 useIntersectionObserver

[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) 以宣告式的方式暴露完整的 `IntersectionObserver` API，讓你直接取得 `IntersectionObserverEntry`，包括 `intersectionRatio`、`isIntersecting` 和 `boundingClientRect`。

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
        <h2>長篇區域</h2>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>區域中的第 {i + 1} 段。</p>
        ))}
      </div>
      <div style={{ height: "100vh" }} />
    </div>
  );
}
```

Hook 負責管理觀察者的生命週期，在選項變化時重新連接，在卸載時自動清理。你只需關注拿到交叉資料後要做什麼，而不是怎麼把觀察者接起來。

## 融會貫通

這些 Hook 天生可組合。以下是一個綜合運用六個 Hook 的 Landing Page 骨架：

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

  // 追蹤捲動進度
  const [position] = useScroll(scrollContainerRef);

  // 吸頂偵測
  const [isStuck] = useSticky(headerRef);

  // 平滑捲動到定價區域
  const { scrollIntoView } = useScrollIntoView(pricingRef, {
    offset: 64,
  });

  // 彈窗捲動鎖定
  const [modalOpen, setModalOpen] = useState(false);
  useScrollLock(
    typeof document !== "undefined" ? document.body : null,
    modalOpen
  );

  // 定價區域漸顯
  const [pricingVisible] = useElementVisibility(pricingRef);

  const el = scrollContainerRef.current;
  const progress = el
    ? position.y / (el.scrollHeight - el.clientHeight)
    : 0;

  return (
    <div ref={scrollContainerRef} style={{ height: "100vh", overflow: "auto" }}>
      {/* 進度條 */}
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

      {/* 吸頂導覽列 */}
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
        <span style={{ fontWeight: 700 }}>我的應用</span>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => scrollIntoView()}>定價</button>
          <button onClick={() => setModalOpen(true)}>聯絡我們</button>
        </div>
      </header>

      {/* 首屏 */}
      <section style={{ height: "100vh", padding: 40 }}>
        <h1>打造出色的產品</h1>
      </section>

      {/* 帶漸顯效果的定價區域 */}
      <section
        ref={pricingRef}
        style={{
          padding: 40,
          opacity: pricingVisible ? 1 : 0,
          transform: pricingVisible ? "none" : "translateY(30px)",
          transition: "all 0.6s ease",
        }}
      >
        <h2>定價方案</h2>
        <p>方案和價格詳情。</p>
      </section>

      <div style={{ height: "100vh" }} />

      {/* 彈窗 */}
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
            <h2>聯絡我們</h2>
            <p>彈窗開啟時頁面捲動已被鎖定。</p>
            <button onClick={() => setModalOpen(false)}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

每個 Hook 各司其職，透過 ref 自然共享元素，彼此不衝突，卸載時全部自動清理。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hook

- [`useScroll`](https://reactuse.com/browser/usescroll/) -- 追蹤捲動位置、方向和邊緣到達狀態
- [`useScrollLock`](https://reactuse.com/browser/usescrolllock/) -- 鎖定任意元素的捲動
- [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) -- 帶偏移量和緩動的平滑捲動
- [`useSticky`](https://reactuse.com/element/usesticky/) -- 偵測元素是否進入吸頂狀態
- [`useElementVisibility`](https://reactuse.com/element/useelementvisibility/) -- 偵測元素是否在可視區域中
- [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/) -- 功能完整的交叉觀察
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) -- 宣告式綁定事件監聽器
- [`useElementSize`](https://reactuse.com/element/useelementsize/) -- 響應式追蹤元素尺寸
- [`useElementBounding`](https://reactuse.com/element/useelementbounding/) -- 取得元素的即時邊界矩形

---

ReactUse 提供了 100 多個 React Hook。[瀏覽全部 →](https://reactuse.com)
