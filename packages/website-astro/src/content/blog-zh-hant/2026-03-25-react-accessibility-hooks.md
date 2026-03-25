---
title: "使用 Hooks 建構無障礙 React 元件"
description: "學習如何在 React 中使用 ReactUse 的無障礙 hooks 來尊重使用者的減少動畫、顏色對比度和色彩配置偏好。"
slug: react-accessibility-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, accessibility, a11y, tutorial]
keywords: [react accessibility, useReducedMotion, prefers-reduced-motion, react a11y hooks, accessible react components, prefers-color-scheme, prefers-contrast]
image: /img/og.png
---

# 使用 Hooks 建構無障礙 React 元件

無障礙不是上線前才需要檢查的清單，而是從第一行程式碼開始就需要貫徹的設計約束。談到 React 中的無障礙，大多數開發者會想到 ARIA 屬性、語義化 HTML 和螢幕閱讀器支援。這些確實重要。但還有一個完整的無障礙類別很少受到關注：**尊重使用者在作業系統層級已經設定好的偏好。**

<!-- truncate -->

每個主流作業系統都允許使用者設定減少動畫、高對比度、深色模式和文字方向等偏好。這些不是裝飾性的選擇。啟用「減少動畫」的使用者可能患有前庭功能障礙，動畫過渡會讓他們感到身體不適。啟用高對比度的使用者可能視力不佳。當你的 React 應用程式忽略這些訊號時，這不僅僅是功能缺失——而是一道屏障。

本文將向你展示如何使用 [ReactUse](https://reactuse.com) 的 hooks 在 React 中偵測和回應這些作業系統層級的偏好。我們將涵蓋減少動畫、對比度偏好、色彩配置偵測、焦點管理和文字方向——然後將所有內容整合到一個實際的元件中。

## 手動監聽媒體查詢的問題

瀏覽器透過 CSS 媒體查詢（如 `prefers-reduced-motion`、`prefers-contrast` 和 `prefers-color-scheme`）暴露作業系統層級的偏好。你可以在 JavaScript 中使用 `window.matchMedia` 來讀取這些值。手動實作的方式如下：

```tsx
import { useState, useEffect } from "react";

function useManualReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
```

這段程式碼能運作，但存在問題。你需要處理 SSR（`window` 不存在的情況）、管理事件監聽器的清理，並且需要為每個想要追蹤的媒體查詢重複這個模式。將這個模式乘以減少動畫、對比度、色彩配置和其他查詢，你最終會得到大量容易出錯的樣板程式碼。

ReactUse 提供的 hooks 封裝了這個模式，包含正確的 SSR 處理、適當的清理邏輯，以及當使用者更改系統偏好時的即時更新。

## useReducedMotion：尊重動畫偏好

[`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) hook 偵測使用者是否在裝置上啟用了「減少動畫」設定。這是你能使用的最具影響力的無障礙 hooks 之一，因為動畫可能會給前庭功能障礙的使用者帶來實際的身體不適。

```tsx
import { useReducedMotion } from "@reactuses/core";

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      style={{
        transition: prefersReducedMotion
          ? "none"
          : "transform 0.3s ease, opacity 0.3s ease",
        animation: prefersReducedMotion ? "none" : "fadeIn 0.5s ease-in",
      }}
    >
      {children}
    </div>
  );
}
```

這裡的關鍵不是簡單地停用動畫——而是在沒有動畫的情況下提供等價的體驗。對於大多數使用者需要 500ms 淡入的卡片，對於偏好減少動畫的使用者應該立即顯示。內容相同，只是呈現方式不同。

你還可以使用這個 hook 在不同的動畫策略之間切換：

```tsx
import { useReducedMotion } from "@reactuses/core";

function PageTransition({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // 即時過渡——沒有動畫，但仍然有視覺變化
    return <div style={{ opacity: 1 }}>{children}</div>;
  }

  // 為未選擇減少動畫的使用者提供完整的滑入動畫
  return (
    <div
      style={{
        animation: "slideInFromRight 0.4s ease-out",
      }}
    >
      {children}
    </div>
  );
}
```

## usePreferredContrast：適應對比度需求

[`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) hook 讀取 `prefers-contrast` 媒體查詢，告訴你使用者想要更多對比度、更少對比度，還是沒有偏好。這對視力不佳的使用者至關重要。

```tsx
import { usePreferredContrast } from "@reactuses/core";

function ThemedButton({ children, onClick }: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const contrast = usePreferredContrast();

  const getButtonStyles = () => {
    switch (contrast) {
      case "more":
        return {
          backgroundColor: "#000000",
          color: "#FFFFFF",
          border: "3px solid #FFFFFF",
          fontWeight: 700 as const,
        };
      case "less":
        return {
          backgroundColor: "#E8E8E8",
          color: "#333333",
          border: "1px solid #CCCCCC",
          fontWeight: 400 as const,
        };
      default:
        return {
          backgroundColor: "#3B82F6",
          color: "#FFFFFF",
          border: "2px solid transparent",
          fontWeight: 500 as const,
        };
    }
  };

  return (
    <button onClick={onClick} style={getButtonStyles()}>
      {children}
    </button>
  );
}
```

當使用者要求更高對比度時，你應該增大前景和背景顏色之間的差異、使用更粗的字型粗細、讓邊框更明顯。當他們要求更低對比度時，柔化視覺強度。預設分支處理未設定偏好的使用者。

## usePreferredColorScheme：系統主題偵測

[`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) hook 告訴你使用者的作業系統是設定為淺色模式、深色模式，還是沒有偏好。這是建構主題感知元件的基礎。

```tsx
import { usePreferredColorScheme } from "@reactuses/core";

function AdaptiveCard({ title, body }: { title: string; body: string }) {
  const colorScheme = usePreferredColorScheme();

  const isDark = colorScheme === "dark";

  return (
    <div
      style={{
        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        color: isDark ? "#E2E8F0" : "#1E293B",
        border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
        borderRadius: "8px",
        padding: "24px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
```

如果你只需要一個簡單的布林值判斷，ReactUse 還提供了 [`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/)，當使用者偏好深色配置時回傳 `true`。如果你需要一個完整的深色模式切換並持久化使用者的選擇，[`useDarkMode`](https://reactuse.com/browser/useDarkMode/) 可以開箱即用。

對於更細粒度的媒體查詢控制，[`useMediaQuery`](https://reactuse.com/browser/useMediaQuery/) 讓你訂閱任何 CSS 媒體查詢字串並獲得即時更新。

## useFocus：鍵盤導覽和焦點管理

鍵盤導覽是核心無障礙要求。無法使用滑鼠的使用者依賴 Tab 鍵在互動元素之間移動。[`useFocus`](https://reactuse.com/element/useFocus/) hook 提供了對焦點的程式化控制，這對於模態對話框、下拉式選單和動態內容至關重要。

```tsx
import { useRef } from "react";
import { useFocus } from "@reactuses/core";

function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useFocus(inputRef);

  return (
    <div>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search..."
        style={{
          outline: focused ? "2px solid #3B82F6" : "1px solid #D1D5DB",
          padding: "8px 12px",
          borderRadius: "6px",
          width: "100%",
        }}
      />
      <button onClick={() => setFocused(true)}>
        Focus Search (Ctrl+K)
      </button>
    </div>
  );
}
```

這個 hook 同時回傳當前焦點狀態和一個設定函式。你可以使用焦點狀態來套用視覺指示器（超出瀏覽器預設樣式），並使用設定函式來程式化地移動焦點——例如，當模態框開啟時或當觸發鍵盤快捷鍵時。

將此與 [`useActiveElement`](https://reactuse.com/element/useActiveElement/) 配合使用，可以追蹤整個應用程式中當前擁有焦點的元素，這對於建構焦點陷阱和跳過導覽連結非常有用。

## useTextDirection：RTL 和 LTR 支援

國際化和無障礙有很大的重疊。[`useTextDirection`](https://reactuse.com/browser/useTextDirection/) hook 偵測和管理文件的文字方向，支援從左到右（LTR）和從右到左（RTL）佈局。

```tsx
import { useTextDirection } from "@reactuses/core";

function NavigationMenu() {
  const [dir, setDir] = useTextDirection();

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: dir === "rtl" ? "row-reverse" : "row",
        gap: "16px",
        padding: "12px 24px",
      }}
    >
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
      <button onClick={() => setDir(dir === "rtl" ? "ltr" : "rtl")}>
        Toggle Direction
      </button>
    </nav>
  );
}
```

RTL 支援影響的不僅僅是文字對齊。導覽順序、圖示位置和 margin/padding 方向都需要翻轉。透過使用 `useTextDirection` 作為唯一資料來源，你可以建構自動適應的佈局邏輯。

## 綜合範例：無障礙通知元件

下面是一個將多個無障礙 hooks 整合到單一元件中的實際範例——一個尊重動畫偏好、適應對比度設定、跟隨系統色彩配置並正確管理焦點的通知提示：

```tsx
import { useRef, useEffect } from "react";
import {
  useReducedMotion,
  usePreferredContrast,
  usePreferredColorScheme,
  useFocus,
} from "@reactuses/core";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
  onDismiss: () => void;
}

function AccessibleNotification({
  message,
  type,
  visible,
  onDismiss,
}: NotificationProps) {
  const prefersReducedMotion = useReducedMotion();
  const contrast = usePreferredContrast();
  const colorScheme = usePreferredColorScheme();
  const dismissRef = useRef<HTMLButtonElement>(null);
  const [, setFocused] = useFocus(dismissRef);

  const isDark = colorScheme === "dark";
  const isHighContrast = contrast === "more";

  // 通知出現時將焦點移至關閉按鈕
  useEffect(() => {
    if (visible) {
      setFocused(true);
    }
  }, [visible, setFocused]);

  if (!visible) return null;

  const colors = {
    success: {
      bg: isDark ? "#064E3B" : "#ECFDF5",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#10B981" : "#6EE7B7",
      text: isDark ? "#A7F3D0" : "#065F46",
    },
    error: {
      bg: isDark ? "#7F1D1D" : "#FEF2F2",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#EF4444" : "#FCA5A5",
      text: isDark ? "#FECACA" : "#991B1B",
    },
    info: {
      bg: isDark ? "#1E3A5F" : "#EFF6FF",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#3B82F6" : "#93C5FD",
      text: isDark ? "#BFDBFE" : "#1E40AF",
    },
  };

  const scheme = colors[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        backgroundColor: scheme.bg,
        color: scheme.text,
        border: `${isHighContrast ? "3px" : "1px"} solid ${scheme.border}`,
        borderRadius: "8px",
        padding: "16px 20px",
        maxWidth: "400px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontWeight: isHighContrast ? 700 : 400,
        // 尊重動畫偏好
        animation: prefersReducedMotion ? "none" : "slideIn 0.3s ease-out",
        transition: prefersReducedMotion ? "none" : "opacity 0.2s ease",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        ref={dismissRef}
        onClick={onDismiss}
        aria-label="關閉通知"
        style={{
          background: "none",
          border: `1px solid ${scheme.text}`,
          color: scheme.text,
          cursor: "pointer",
          borderRadius: "4px",
          padding: "4px 8px",
          fontWeight: isHighContrast ? 700 : 500,
        }}
      >
        關閉
      </button>
    </div>
  );
}
```

這個元件展示了幾個無障礙原則的協同運作：

1. **`role="alert"` 和 `aria-live="assertive"`** 確保螢幕閱讀器立即播報通知。
2. **`useReducedMotion`** 為偏好減少動畫的使用者停用滑入動畫。
3. **`usePreferredContrast`** 為需要更高對比度的使用者增加邊框寬度和字型粗細。
4. **`usePreferredColorScheme`** 根據使用者的淺色或深色主題適配所有顏色。
5. **`useFocus`** 將鍵盤焦點移至關閉按鈕，使使用者無需使用滑鼠就能操作通知。

## 為什麼 Hooks 是無障礙的正確抽象

Hooks 具有可組合性。每個無障礙關注點都封裝在自己的 hook 中，你可以按需組合它們。一個簡單的按鈕可能只使用 `usePreferredContrast`。一個複雜的模態框可能使用我們介紹的全部五個 hooks。這些 hooks 互相獨立，這意味著你可以逐步採用它們，無需重構現有程式碼。

Hooks 還能即時回應變化。如果使用者在你的應用程式開啟時從淺色切換到深色模式，hooks 會更新，你的元件會使用新的偏好重新渲染。這是僅使用 CSS 的方案（依賴靜態類別名稱）難以實現的。

## 安裝

透過套件管理器安裝 ReactUse：

```bash
npm install @reactuses/core
```

然後匯入你需要的 hooks：

```tsx
import {
  useReducedMotion,
  usePreferredContrast,
  usePreferredColorScheme,
  useFocus,
  useTextDirection,
} from "@reactuses/core";
```

## 相關 Hooks

- [`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) — 偵測 `prefers-reduced-motion` 偏好
- [`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) — 偵測 `prefers-contrast` 偏好
- [`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) — 偵測 `prefers-color-scheme`（淺色、深色或無偏好）
- [`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/) — 深色模式偵測的布林值簡寫
- [`useDarkMode`](https://reactuse.com/browser/useDarkMode/) — 帶持久化的完整深色模式切換
- [`useMediaQuery`](https://reactuse.com/browser/useMediaQuery/) — 訂閱任何 CSS 媒體查詢
- [`useFocus`](https://reactuse.com/element/useFocus/) — 程式化焦點管理
- [`useActiveElement`](https://reactuse.com/element/useActiveElement/) — 追蹤當前擁有焦點的元素
- [`useTextDirection`](https://reactuse.com/browser/useTextDirection/) — 偵測和控制 LTR/RTL 文字方向

ReactUse 提供了 100 多個 React hooks。[探索全部 &rarr;](https://reactuse.com)
