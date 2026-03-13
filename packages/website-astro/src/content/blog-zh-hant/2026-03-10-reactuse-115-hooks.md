---
title: "ReactUse：你需要知道的 100+ 個生產就緒 React Hooks"
description: "介紹 ReactUse，一個涵蓋瀏覽器 API、狀態管理、感測器、動畫等功能的 100+ 個 React Hooks 綜合合集。TypeScript 優先、支援 tree-shaking、相容 SSR。"
slug: reactuse-100-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, typescript, announcement]
keywords: [react hooks, custom hooks, react hook library, reactuse, typescript hooks, SSR hooks, browser hooks]
image: /img/og.png
---

# ReactUse：100+ 個生產就緒的 React Hooks

建構現代 React 應用程式需要處理無數的瀏覽器 API、狀態管理模式和 DOM 互動。**ReactUse** 提供 100+ 個精心打造的 hooks，消除樣板程式碼，讓你專注於功能開發。

<!-- truncate -->

## 為什麼選擇 ReactUse？

如果你在 Vue 生態系統中使用過 [VueUse](https://vueuse.org/)，ReactUse 將同樣的理念帶到了 React：一個全面的、類型完善的、支援 tree-shaking 的工具 hooks 合集。

### ReactUse 有什麼不同？

- **100+ 個 hooks** — 目前最全面的 React hooks 合集
- **TypeScript 優先** — 每個 hook 都有完整的類型定義
- **支援 Tree-shaking** — 只匯入你需要的，零套件膨脹
- **SSR 相容** — 無縫支援 Next.js、Remix 和其他框架
- **互動式文件** — 每個 hook 在 [reactuse.com](https://reactuse.com) 上都有可編輯的即時範例
- **MCP 支援** — AI 驅動的 hook 探索，適用於現代開發工作流程

### Hook 分類

**瀏覽器 Hooks（48 個）：** 從剪貼簿存取到地理定位，從媒體查詢到網頁通知，應有盡有。

```tsx
import { useClipboard, useDarkMode, useGeolocation } from "@reactuses/core";
```

**狀態 Hooks（24 個）：** LocalStorage 持久化、防抖、節流、切換等。

```tsx
import { useLocalStorage, useDebounce, useToggle } from "@reactuses/core";
```

**元素 Hooks（19 個）：** 尺寸量測、交叉觀察、拖放、捲動追蹤。

```tsx
import { useElementSize, useIntersectionObserver, useDraggable } from "@reactuses/core";
```

**Effect Hooks（20 個）：** 事件監聽器、計時器、生命週期 hooks 和非同步 effects。

```tsx
import { useEventListener, useInterval, useAsyncEffect } from "@reactuses/core";
```

## 快速開始

使用你喜歡的套件管理器安裝：

```bash
npm i @reactuses/core
```

立即使用任何 hook：

```tsx
import { useToggle } from "@reactuses/core";

function App() {
  const [on, toggle] = useToggle(true);
  return (
    <button onClick={toggle}>
      {on ? "ON" : "OFF"}
    </button>
  );
}
```

## 用於生產環境

ReactUse 受到包括 **Shopee**、**PDD（拼多多）**、**攜程** 和 **Bambu Lab** 在內的大型企業信賴。

## 立即開始

- 📖 [文件](https://reactuse.com)
- 💻 [GitHub](https://github.com/childrentime/reactuse)
- 💬 [Discord 社群](https://discord.gg/VEMFdByJ)

我們期待你的回饋 — 在 GitHub 上給我們一顆星並加入社群！
