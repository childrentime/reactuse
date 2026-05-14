---
title: "React 深色模式切換：完整指南"
description: "學習如何使用 CSS、系統偏好設定和 useDarkMode hook 在 React 中實作深色模式切換。涵蓋持久化、主題模式和生產就緒的解決方案。"
slug: react-dark-mode-toggle
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, dark-mode, useDarkMode]
keywords: [react dark mode, dark mode toggle react, useDarkMode, react theme toggle, dark light mode react]
image: /img/og.png
---

# React 深色模式切換：完整指南

深色模式已成為使用者在現代網頁應用程式中期望的標準功能。深色模式切換讓使用者在淺色和深色配色方案之間切換，在低光環境中減少眼睛疲勞，並在 OLED 螢幕上節省電池。本指南帶你了解在 React 中實作深色模式的方法，從手動 CSS 方式到使用 `useDarkMode` hook 的生產就緒解決方案。

<!-- truncate -->

## 為什麼深色模式很重要

深色模式不再是錦上添花的功能 — 它是使用者的期望。研究顯示超過 80% 的使用者至少在某些情境下偏好深色模式。除了使用者偏好之外，深色模式還提供了實際的好處：

- **在低光條件下減少眼睛疲勞**
- **在 OLED 和 AMOLED 螢幕上降低電池消耗**
- **為對光線敏感的使用者提升無障礙性**
- **更精緻的產品質感**，展現對細節的關注

要做好這件事不僅僅是交換背景顏色。你需要處理系統偏好設定、持久化使用者的選擇，以及避免頁面載入時出現錯誤主題的閃爍。

## 手動 CSS 方式

最簡單的起點是在根元素上使用 CSS 類別：

```css
:root {
  --bg-color: #ffffff;
  --text-color: #1a1a1a;
}

html.dark {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

然後在 React 中切換類別：

```tsx
import { useState } from "react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((prev) => !prev);
  };

  return <button onClick={toggle}>{isDark ? "Light Mode" : "Dark Mode"}</button>;
}
```

這適用於基本情況，但它有問題。偏好設定在頁面重新載入時會重設，它忽略了使用者的系統設定，而且邏輯會在各元件間重複。

## 偵測系統偏好設定

大多數作業系統允許使用者設定全系統的深色模式偏好。你可以使用 `prefers-color-scheme` 媒體查詢來偵測它：

```tsx
import { useEffect, useState } from "react";

function useSystemDarkMode() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDark;
}
```

這會尊重使用者的作業系統設定並即時回應變更。但你仍然需要處理 localStorage 持久化、SSR 安全性、將類別套用到 DOM，以及保持一切同步。對每個專案來說，這是大量的樣板程式碼。

## 簡單的方式：useDarkMode

ReactUse 的 [useDarkMode](https://reactuse.com/browser/usedarkmode/) hook 在一次呼叫中處理所有這些。它偵測系統偏好設定、將使用者的選擇持久化到 localStorage、將 CSS 類別套用到 DOM，且安全地支援 SSR：

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

這個 hook 回傳一個包含三個值的元組：

1. **`isDark`** — 一個布林值，指示深色模式是否啟用
2. **`toggle`** — 一個在深色和淺色模式之間切換的函式
3. **`setDark`** — 一個用於程式化控制的設定函式

## 持久化使用者偏好

預設情況下，`useDarkMode` 將使用者的選擇儲存在 `localStorage` 中，鍵名為 `reactuses-color-scheme`。你可以自訂鍵名和儲存後端：

```tsx
const [isDark, toggle] = useDarkMode({
  classNameDark: "dark",
  classNameLight: "light",
  storageKey: "my-app-theme",
});
```

如果你需要使用 `sessionStorage` 而非 `localStorage`：

```tsx
const [isDark, toggle] = useDarkMode({
  classNameDark: "dark",
  classNameLight: "light",
  storage: () => sessionStorage,
});
```

當沒有已儲存的偏好時，hook 會自動透過 `prefers-color-scheme` 回退到使用者的系統偏好設定。

## 常見模式

### 感知主題的元件

建構根據當前主題調整樣式的元件：

```tsx
import { useDarkMode } from "@reactuses/core";

function Card({ children }: { children: React.ReactNode }) {
  const [isDark] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
  });

  return (
    <div style={{
      background: isDark ? "#2d2d2d" : "#ffffff",
      color: isDark ? "#e0e0e0" : "#1a1a1a",
      padding: "1.5rem",
      borderRadius: "8px",
    }}>
      {children}
    </div>
  );
}
```

### 套用到自訂選擇器

預設情況下，類別會套用到 `<html>` 元素。你可以指定不同的元素：

```tsx
const [isDark, toggle] = useDarkMode({
  selector: "#app-root",
  attribute: "data-theme",
  classNameDark: "dark",
  classNameLight: "light",
});
```

這會將類別新增到匹配 `#app-root` 的元素上，而且你可以使用 data 屬性而非類別，如果你的 CSS 框架需要的話。

## 安裝

```bash
npm i @reactuses/core
```

或使用其他套件管理器：

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

## 相關 Hooks

- [useDarkMode 文件](https://reactuse.com/browser/usedarkmode/) — 完整 API 參考和互動式範例
- [useColorMode](https://reactuse.com/browser/usecolormode/) — 用於超越淺色/深色的多模式主題
- [useMediaQuery](https://reactuse.com/browser/usemediaquery/) — 用於回應任何 CSS 媒體查詢
- [useLocalStorage](https://reactuse.com/state/uselocalstorage/) — 用於通用的持久化狀態

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
