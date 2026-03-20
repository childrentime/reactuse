---
title: "如何在 React 中取得視窗大小（正確的方式）"
description: "學習在 React 中偵測視窗和螢幕大小的正確方式。比較手動 resize 監聽器與 useWindowSize hook，打造乾淨、SSR 安全的響應式元件。"
slug: react-window-size-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, responsive, useWindowSize]
keywords: [react window size, useWindowSize, react screen size, react responsive hook, react resize]
image: /img/og.png
---

# 如何在 React 中取得視窗大小（正確的方式）

響應式設計不只限於 CSS。遲早你會需要在 React 元件中取得實際的視窗寬度或高度 — 用於條件渲染側邊欄、在手機和桌面版本之間切換圖表庫，或計算動態佈局。正確地取得這個值，尤其是在伺服器端渲染的情況下，比看起來更棘手。

<!-- truncate -->

## 為什麼你需要在 JavaScript 中取得視窗大小

CSS 媒體查詢涵蓋了許多響應式場景，但有些事情需要 JavaScript：

- **條件渲染元件** — 在手機上顯示漢堡選單，同時在桌面上渲染完整的導覽列。
- **Canvas 和圖表尺寸** — D3、Chart.js 和 Three.js 等函式庫需要明確的像素尺寸。
- **虛擬列表** — react-window 和 react-virtualized 需要容器高度來計算要渲染多少行。
- **動態計算** — 定位工具提示、調整拖曳把手大小或計算寬高比。

在所有這些情況下，你需要一個即時的、響應式的 `window.innerWidth` 和 `window.innerHeight` 值。

## 使用 Resize 監聽器的手動方式

最常見的 DIY 解決方案看起來像這樣：

```tsx
import { useEffect, useState } from "react";

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}
```

這對於簡單的純客戶端應用程式可以運作，但當你的專案成長時會出現真正的問題。

## SSR 陷阱：window is not defined

如果你使用 Next.js、Remix、Astro 或任何在伺服器端渲染的框架，上面的程式碼會崩潰：

> **ReferenceError: window is not defined**

伺服器沒有瀏覽器視窗，所以在渲染期間直接存取 `window` 就是一個錯誤。常見的因應方式包括將所有東西包裝在 `typeof window !== "undefined"` 檢查中，或將狀態初始化為 `0`。但接下來你會面對 **hydration 不匹配**：伺服器以寬度 `0` 渲染，客戶端以寬度 `1440` 渲染，React 警告 HTML 不匹配。

正確處理這個問題需要仔細地協調伺服器快照和客戶端快照 — 這正是 React 的 `useSyncExternalStore` 設計來解決的問題。

## 乾淨的解決方案：ReactUse 的 useWindowSize

[ReactUse](https://reactuse.com) 提供了一個 `useWindowSize` hook，為你處理所有這些細節。它在底層使用 `useSyncExternalStore`，這意味著它**支援並行模式**且**開箱即用地相容 SSR**。

```tsx
import { useWindowSize } from "@reactuses/core";

function Dashboard() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>Window: {width} x {height}</p>
      {width < 768 ? <MobileNav /> : <DesktopNav />}
    </div>
  );
}
```

這個 hook 回傳一個帶有 `width` 和 `height` 屬性的響應式物件。它訂閱瀏覽器的 `resize` 事件，在卸載時清理，並透過參考相等性檢查避免不必要的重新渲染。在伺服器端它回傳安全的初始值，消除 hydration 警告。

### 依賴追蹤

ReactUse 實作的一個微妙特點是**依賴追蹤**。如果你的元件只讀取 `width`，hook 會追蹤這一點並在只有 `height` 變更時跳過重新渲染 — 反之亦然。這為你提供了細粒度的效能，無需任何額外設定。

## 建構響應式元件

以下是一個實際的範例：一個根據視窗寬度切換欄數的響應式網格。

```tsx
import { useWindowSize } from "@reactuses/core";

function ResponsiveGrid({ items }: { items: string[] }) {
  const { width } = useWindowSize();

  const columns = width >= 1200 ? 4 : width >= 768 ? 2 : 1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
      {items.map((item) => (
        <div key={item} style={{ padding: 16, background: "#f0f0f0" }}>
          {item}
        </div>
      ))}
    </div>
  );
}
```

因為 `useWindowSize` 只在你讀取的值實際變更時才觸發重新渲染，即使在快速調整大小時，這個模式仍然保持高效能。

## 搭配 useMediaQuery 使用

對於你關心斷點而非確切像素值的場景，將 `useWindowSize` 與 `useMediaQuery` 結合：

```tsx
import { useMediaQuery } from "@reactuses/core";

function AdaptiveLayout() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  if (isMobile) return <MobileLayout />;
  if (isTablet) return <TabletLayout />;
  return <DesktopLayout />;
}
```

當你只需要布林斷點旗標時使用 `useMediaQuery`。當你需要實際的數值尺寸來進行計算時使用 `useWindowSize`。兩者結合幾乎涵蓋了 React 中所有的響應式使用情境。

## 安裝

```bash
npm i @reactuses/core
```

或使用你偏好的套件管理器：

```bash
pnpm add @reactuses/core
# or
yarn add @reactuses/core
```

## 相關 Hooks

- [useWindowSize 文件](https://reactuse.com/element/useWindowSize/) — 完整 API 參考和互動式範例
- [useMediaQuery](https://reactuse.com/browser/useMediaQuery/) — 響應式 CSS 媒體查詢匹配
- [useElementSize](https://reactuse.com/element/useElementSize/) — 追蹤特定 DOM 元素的大小

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
