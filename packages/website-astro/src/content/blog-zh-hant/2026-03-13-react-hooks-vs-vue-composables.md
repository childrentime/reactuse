---
title: "React Hooks vs Vue Composables：2026 年完整比較"
description: "React Hooks 和 Vue Composables 的詳細並排比較，探索模式、效能，以及 ReactUse 如何將 VueUse 的最佳理念帶到 React。"
slug: react-hooks-vs-vue-composables
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, vue, hooks, composables, comparison]
keywords: [react hooks vs vue composables, reactuse vs vueuse, vue composables in react, react equivalent of vueuse, react composition api]
image: /img/og.png
date: 2026-03-13
---

# React Hooks vs Vue Composables：2026 年完整比較

**React Hooks** 是以 `use` 為前綴的函式，讓 React 元件無需類別即可管理狀態、副作用和生命週期行為。**Vue Composables** 是利用 Vue 的 Composition API 來封裝和重複使用跨元件響應式邏輯的函式。兩者解決的是相同的根本問題 -- 共享有狀態的邏輯 -- 但它們使用不同的響應式模型、執行語義和生態系統慣例來實現。

<!-- truncate -->

## 為什麼這個比較很重要

在 React 和 Vue 之間切換的開發者經常搜尋等價的模式。Vue 的生態系統有 [VueUse](https://vueuse.org/)，一個擁有 200+ 個 composables 的合集，已成為可重複使用邏輯的黃金標準。尋找相同廣度工具 hooks 的 React 開發者現在有了 [ReactUse](https://reactuse.com)，一個直接受 VueUse 設計理念啟發的 100+ 個 hooks 函式庫。

了解這兩種方法之間的差異有助於你在任一框架中寫出更好的程式碼，也讓從一個框架移植模式到另一個變得更容易。

## 並排比較

| 面向 | React Hooks | Vue Composables |
|---|---|---|
| **響應式模型** | 狀態變更時重新渲染整個元件 | 透過代理 refs 的細粒度響應式 |
| **執行方式** | 每次渲染時執行 | 在 `setup()` 期間執行一次 |
| **狀態原語** | `useState` 回傳值 + setter | `ref()` / `reactive()` 回傳一個代理 |
| **副作用** | 帶有依賴陣列的 `useEffect` | 帶有自動追蹤的 `watchEffect` |
| **生命週期** | `useEffect` 清理模式 | `onMounted`、`onUnmounted` 等 |
| **規則** | 必須遵守 Hooks 規則（不能在條件中使用） | 沒有順序限制 |
| **SSR** | 需要手動的 `typeof window` 防護 | 內建 `onServerPrefetch` |
| **記憶化** | 顯式（`useMemo`、`useCallback`） | 透過 `computed()` 自動 |
| **主要工具函式庫** | ReactUse（100+ hooks） | VueUse（200+ composables） |

## 響應式在底層有何不同

React hooks 在每次渲染時重新執行。當你呼叫 `useState` 時，React 將值儲存在內部 fiber 中，並在每次元件函式執行時重新回傳。衍生值需要帶有明確依賴陣列的 `useMemo`，漏掉依賴是常見的錯誤來源。

Vue composables 在 `setup()` 中執行一次。Refs 和 reactive 物件是 JavaScript 代理，會追蹤哪些 effects 依賴它們。當 ref 變更時，只有讀取它的特定 effects 被重新觸發 -- 而非整個元件。`computed()` 自動追蹤其依賴，不需要手動陣列。

這個區別對效能很重要。React 開發者必須仔細考慮記憶化以避免不必要的重新渲染。Vue 開發者預設獲得細粒度更新，但必須理解代理解包和 ref 存取（`.value`）作為代價。

## 程式碼比較：useLocalStorage

將狀態持久化到 localStorage 是兩個生態系統中的常見需求。以下是同一功能在各自中的寫法。

**React 搭配 ReactUse：**

```tsx
import { useLocalStorage } from "@reactuses/core";

function Settings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Current: {theme}
    </button>
  );
}
```

**Vue 搭配 VueUse：**

```vue
<script setup>
import { useLocalStorage } from "@vueuse/core";

const theme = useLocalStorage("theme", "light");

function toggle() {
  theme.value = theme.value === "light" ? "dark" : "light";
}
</script>

<template>
  <button @click="toggle">Current: {{ theme }}</button>
</template>
```

API 表面幾乎相同。ReactUse 回傳一個類似 `useState` 的 `[value, setter]` 元組。VueUse 回傳一個你直接修改的響應式 ref。兩者都處理序列化、SSR 安全性和跨分頁同步。

## 程式碼比較：useWindowSize

**React 搭配 ReactUse：**

```tsx
import { useWindowSize } from "@reactuses/core";

function Layout() {
  const { width, height } = useWindowSize();
  return <p>Window: {width} x {height}</p>;
}
```

**Vue 搭配 VueUse：**

```vue
<script setup>
import { useWindowSize } from "@vueuse/core";

const { width, height } = useWindowSize();
</script>

<template>
  <p>Window: {{ width }} x {{ height }}</p>
</template>
```

兩個函式庫都對 resize 事件進行節流，優雅地處理 SSR，並回傳響應式尺寸。使用的程式碼幾乎可以互換。

## 程式碼比較：useDark

**React 搭配 ReactUse：**

```tsx
import { useDarkMode } from "@reactuses/core";

function ThemeToggle() {
  const [isDark, toggle] = useDarkMode({ classNameDark: "dark", classNameLight: "light" });
  return <button onClick={toggle}>{isDark ? "Light" : "Dark"}</button>;
}
```

**Vue 搭配 VueUse：**

```vue
<script setup>
import { useDark, useToggle } from "@vueuse/core";

const isDark = useDark();
const toggle = useToggle(isDark);
</script>

<template>
  <button @click="toggle">{{ isDark ? 'Light' : 'Dark' }}</button>
</template>
```

ReactUse 將切換功能打包在 hook 的回傳值中。VueUse 將 `useDark` 與通用的 `useToggle` composable 組合。兩者都持久化偏好設定、尊重系統配色方案，並在 document 上套用 CSS 類別。

## 主要差異

**執行模型。** React hooks 在每次渲染時執行，這意味著 hook 內部的每個變數每次元件更新時都會被重新建立。Vue composables 執行一次，響應式透過代理處理。這是最大的架構差異，影響你如何思考效能、閉包和記憶化。

**依賴追蹤。** React 要求你在陣列中明確宣告依賴（`useEffect`、`useMemo`、`useCallback`）。Vue 在執行時自動追蹤依賴。手動依賴陣列是 React 中常見的錯誤來源 -- 過期閉包和遺漏依賴是 React ESLint 外掛報告的最常見問題之一。

**SSR 方式。** 兩個框架都支援伺服器端渲染，但防護模式不同。React hooks 通常在存取瀏覽器 API 之前檢查 `typeof window !== "undefined"`。Vue 提供像 `onServerPrefetch` 這樣的生命週期 hooks 和 SSR 專用的上下文。ReactUse 和 VueUse 都在內部處理這些防護，所以終端使用者很少需要考慮它們。

**生態系統成熟度。** VueUse 自 2020 年以來一直是 Vue 生態系統中的主導工具函式庫，提供超過 200 個 composables。ReactUse 較新但成長迅速，擁有 100+ 個 hooks，涵蓋相同的類別：瀏覽器 API、感測器、狀態管理、動畫和元素觀察。

## ReactUse vs VueUse：React 的等價方案

ReactUse 明確地被建構為 VueUse 的 React 等價方案。兩個函式庫共享命名慣例、類別組織和 API 設計原則。如果你了解 VueUse，你可以毫不費力地上手 ReactUse。

| 功能 | ReactUse | VueUse |
|---|---|---|
| **Hook/composable 數量** | 100+ | 200+ |
| **TypeScript** | 一級支援 | 一級支援 |
| **Tree-shakable** | 是 | 是 |
| **SSR 安全** | 是 | 是 |
| **互動式文件** | 是 | 是 |
| **分類** | Browser、State、Sensor、Element、Effect | Browser、State、Sensor、Element、Component、Utilities |

對於欣賞 VueUse 的廣度和人體工學的 React 開發者來說，ReactUse 是目前最接近的等價方案。

## 常見問題

### React Hooks 和 Vue Composables 一樣嗎？

它們的目的相同 -- 封裝可重複使用的有狀態邏輯 -- 但運作方式不同。React hooks 在每次渲染時重新執行，需要明確的依賴陣列。Vue composables 執行一次，依賴基於代理的細粒度響應式來自動追蹤依賴。

### 我可以在 React 中使用 VueUse 嗎？

不行。VueUse 依賴 Vue 的響應式系統（`ref`、`reactive`、`watchEffect`），無法在 Vue 應用程式之外執行。然而，[ReactUse](https://reactuse.com) 為 React 提供了等價的 hooks，遵循相同的命名慣例並涵蓋相同的使用情境。

### VueUse 的 React 等價方案是什麼？

[ReactUse](https://reactuse.com)（`@reactuses/core`）是最直接的等價方案。它提供 100+ 個受 VueUse 啟發的 hooks，按相同的類別組織，具有 TypeScript 優先的 API 和 SSR 相容性。使用 `npm i @reactuses/core` 安裝。

### Vue 的 Composition API 比 React Hooks 好嗎？

兩者都不是客觀上更好的 -- 它們反映了不同的設計理念。Vue 的自動依賴追蹤減少了樣板程式碼並消除了過期閉包的錯誤。React 的明確依賴陣列給開發者更多控制權，使得在複雜元件中更容易追蹤資料流。最佳選擇取決於你的團隊經驗和專案需求。

## 結論

React Hooks 和 Vue Composables 是對同一問題的兩種回答：如何在元件之間共享有狀態的邏輯？Vue 傾向於細粒度響應式和自動追蹤。React 傾向於重新執行和明確依賴。兩種方法在生產環境中都運作良好，兩者都有成熟的工具函式庫 -- Vue 有 VueUse，React 有 ReactUse -- 消除了處理瀏覽器 API、狀態持久化和 DOM 觀察的樣板程式碼。

如果你是一位尋找 VueUse 為 Vue 帶來的廣度和精緻度的 React 開發者，ReactUse 就是為你而建的。

```bash
npm i @reactuses/core
```

[探索 ReactUse →](https://reactuse.com)
