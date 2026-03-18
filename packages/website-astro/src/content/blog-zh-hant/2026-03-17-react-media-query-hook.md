---
title: "useMediaQuery：React 響應式設計完整指南"
description: "學習如何使用 ReactUse 的 useMediaQuery Hook 建構自適應 React 元件，適配螢幕尺寸、深色模式偏好等。"
slug: react-media-query-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-17
tags: [react, hooks, tutorial, responsive-design, useMediaQuery]
keywords: [react media query, useMediaQuery, responsive react, react responsive design, media query hook]
image: /img/og.png
---

# useMediaQuery：React 響應式設計完整指南

CSS 媒體查詢能處理大部分響應式佈局工作，但有時你需要在 JavaScript 層面讓 React 元件感知當前的視窗、使用者偏好或裝置能力。無論是條件渲染行動裝置導覽、偵測深色模式，還是尊重減少動態效果偏好，`useMediaQuery` 都能給你一個與任意 CSS 媒體查詢字串保持同步的響應式布林值。

<!-- truncate -->

## 什麼是 useMediaQuery？

`useMediaQuery` 是 [ReactUse](https://reactuse.com) 提供的一個 Hook，它封裝了瀏覽器的 `window.matchMedia` API。傳入一個媒體查詢字串，回傳一個布林值表示該查詢當前是否匹配。它在底層訂閱了 `change` 事件，因此當使用者調整視窗大小、切換系統深色模式或變更查詢描述的任何條件時，回傳值會自動更新。

```tsx
import { useMediaQuery } from "@reactuses/core";

function Example() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return <p>{isMobile ? "行動裝置檢視" : "桌面檢視"}</p>;
}
```

函式簽章非常簡潔：

```ts
useMediaQuery(query: string, defaultState?: boolean) => boolean
```

- **query** -- 任意有效的 CSS 媒體查詢字串。
- **defaultState** -- 選用的布林值，用於伺服器端渲染時 `window` 不可用的情況。

## 基本用法

最常見的場景是偵測螢幕寬度斷點：

```tsx
import { useMediaQuery } from "@reactuses/core";

function Navigation() {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return (
      <button aria-label="開啟選單">
        <HamburgerIcon />
      </button>
    );
  }

  return (
    <nav>
      <a href="/">首頁</a>
      <a href="/about">關於</a>
      <a href="/contact">聯絡</a>
    </nav>
  );
}
```

元件僅在布林值變化時重新渲染——而非視窗每移動一個像素都觸發。

## 常用斷點模式

對於使用多個斷點的專案，在一處定義並在各元件間重複使用：

```tsx
import { useMediaQuery } from "@reactuses/core";

function useBreakpoint() {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return { isMobile, isTablet, isDesktop };
}

function Dashboard() {
  const { isMobile, isTablet } = useBreakpoint();

  const columns = isMobile ? 1 : isTablet ? 2 : 4;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
      <Card title="營收" />
      <Card title="使用者" />
      <Card title="訂單" />
      <Card title="成長" />
    </div>
  );
}
```

## 響應式佈局

以下是一個實際範例，在桌面端顯示側邊欄佈局，在行動裝置端顯示堆疊佈局：

```tsx
import { useMediaQuery } from "@reactuses/core";

function AppLayout({ children }: { children: React.ReactNode }) {
  const isWide = useMediaQuery("(min-width: 1024px)");

  if (isWide) {
    return (
      <div style={{ display: "flex" }}>
        <aside style={{ width: 260, flexShrink: 0 }}>
          <SidebarMenu />
        </aside>
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    );
  }

  return (
    <div>
      <TopNavBar />
      <main>{children}</main>
    </div>
  );
}
```

## 偵測使用者偏好

媒體查詢不限於螢幕尺寸。你還可以偵測系統層級的使用者偏好：

### 深色模式

```tsx
import { useMediaQuery } from "@reactuses/core";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <div style={{
      background: prefersDark ? "#1a1a2e" : "#ffffff",
      color: prefersDark ? "#e0e0e0" : "#1a1a1a",
      minHeight: "100vh",
    }}>
      {children}
    </div>
  );
}
```

### 減少動態效果

尊重 `prefers-reduced-motion` 對無障礙性至關重要。有暈動症或前庭功能障礙的使用者會在作業系統層面設定此偏好：

```tsx
import { useMediaQuery } from "@reactuses/core";

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <div style={{
      transition: prefersReducedMotion ? "none" : "transform 0.3s ease",
    }}>
      {children}
    </div>
  );
}
```

### 高對比度及其他查詢

```tsx
const prefersHighContrast = useMediaQuery("(prefers-contrast: high)");
const isPortrait = useMediaQuery("(orientation: portrait)");
const hasHover = useMediaQuery("(hover: hover)");
```

## SSR 與 Hydration 安全

在伺服器端渲染時，`window.matchMedia` 不存在。如果不提供 `defaultState`，Hook 在伺服器端回傳 `false`，在客戶端回傳真實值，這可能導致 React hydration 不匹配的警告。

為避免此問題，傳入一個與大多數使用者預期相符的 `defaultState`：

```tsx
// 伺服器端渲染為 false，客戶端更新為真實值
const isMobile = useMediaQuery("(max-width: 768px)", false);

// 伺服器端渲染為 true，適用於大部分流量來自行動裝置的場景
const isMobile = useMediaQuery("(max-width: 768px)", true);
```

在開發模式下，如果你在伺服器端渲染時未提供 `defaultState`，Hook 會在主控台輸出警告，提醒你明確處理這種情況。

## 與其他 Hooks 組合

`useMediaQuery` 與其他 ReactUse Hook 搭配使用效果很好：

```tsx
import { useMediaQuery, useLocalStorage } from "@reactuses/core";

function ThemeSwitcher() {
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [userTheme, setUserTheme] = useLocalStorage<"light" | "dark" | "system">("theme", "system");

  const isDark = userTheme === "system" ? systemPrefersDark : userTheme === "dark";

  return (
    <div>
      <p>目前主題：{isDark ? "深色" : "淺色"}</p>
      <select value={userTheme} onChange={(e) => setUserTheme(e.target.value as "light" | "dark" | "system")}>
        <option value="system">跟隨系統</option>
        <option value="light">淺色</option>
        <option value="dark">深色</option>
      </select>
    </div>
  );
}
```

## 常見錯誤

**在渲染中直接使用 window.matchMedia。** 在渲染期間呼叫 `window.matchMedia` 而不訂閱變化，只能得到一個過時的快照。`useMediaQuery` 訂閱了 `change` 事件，保證值始終是最新的。

**SSR 時忘記 defaultState。** 如果你使用 Next.js、Remix 或 Astro，務必傳入 `defaultState` 以避免 hydration 警告。

**建立過多監聽器。** 每次呼叫 `useMediaQuery` 會建立一個 `matchMedia` 監聽器。雖然這很輕量，但如果你需要數十個查詢，考慮將相關斷點歸入一個自訂 Hook（如上面的 `useBreakpoint`）。

## 安裝

```bash
npm i @reactuses/core
```

或使用其他套件管理器：

```bash
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

## 相關 Hooks

- [useMediaQuery 文件](https://reactuse.com/browser/useMediaQuery/) -- 完整 API 參考和互動式範例
- [useWindowSize](https://reactuse.com/browser/useWindowSize/) -- 取得視窗的實際像素尺寸
- [useBreakpoints](https://reactuse.com/browser/useBreakpoints/) -- 命名斷點輔助工具（sm、md、lg、xl）
- [useDarkMode](https://reactuse.com/browser/useDarkMode/) -- 完整的深色模式管理與持久化

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
