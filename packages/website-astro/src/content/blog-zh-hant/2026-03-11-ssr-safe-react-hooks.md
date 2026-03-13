---
title: "SSR 安全的 React Hooks：在 Next.js 中避免 Hydration 錯誤"
description: "學習如何編寫 SSR 安全的 React hooks，避免 Next.js 和其他伺服器端渲染框架中的 hydration 不匹配。涵蓋 useIsomorphicLayoutEffect、安全的瀏覽器 API 存取，以及來自 ReactUse 的實際模式。"
slug: ssr-safe-react-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, ssr, nextjs, hydration]
keywords: [react ssr hooks, nextjs hydration error, server side rendering hooks, useIsomorphicLayoutEffect, ssr safe hooks, react hydration mismatch]
image: /img/og.png
---

# SSR 安全的 React Hooks：在 Next.js 中避免 Hydration 錯誤

如果你曾經看到過可怕的「Text content does not match server-rendered HTML」或「Hydration failed because the initial UI does not match what was rendered on the server」，你就知道 SSR hydration 錯誤有多令人沮喪。根本原因幾乎總是相同的：一個 hook 嘗試在伺服器渲染期間存取瀏覽器 API。

<!-- truncate -->

## Hydration 問題

React 伺服器端渲染分兩個階段工作。首先，伺服器將你的元件樹渲染為 HTML。然後，客戶端透過附加事件監聽器並將伺服器輸出與客戶端渲染進行調和來「hydrate」該 HTML。如果兩次渲染產生不同的輸出，React 會拋出 hydration 不匹配錯誤。

存取 `window`、`document`、`localStorage`、`navigator` 或任何其他僅限瀏覽器 API 的 hooks 會在伺服器端回傳不同的值（或完全崩潰）。當伺服器渲染預設的備援值但客戶端渲染真實值時，HTML 不會匹配。

## 常見錯誤

### 在模組層級存取瀏覽器 API

```tsx
// This runs on the server and will crash
const width = window.innerWidth;

function MyComponent() {
  return <div>Width: {width}</div>;
}
```

### 在初始渲染時讀取瀏覽器狀態

```tsx
function useScreenWidth() {
  // This causes a hydration mismatch: server returns 0, client returns 1920
  const [width, setWidth] = useState(window.innerWidth);
  return width;
}
```

### 基於瀏覽器 API 的條件渲染

```tsx
function Feature() {
  // Server: false, Client: true → hydration mismatch
  const isMobile = window.innerWidth < 768;
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

## 為什麼 `typeof window !== 'undefined'` 還不夠

許多開發者使用這個防護：

```tsx
const isBrowser = typeof window !== "undefined";

function useScreenWidth() {
  const [width, setWidth] = useState(isBrowser ? window.innerWidth : 0);
  return width;
}
```

這防止了崩潰，但它**並沒有防止 hydration 不匹配**。伺服器回傳 `0`，而客戶端在第一次渲染時回傳 `1920`。React 看到不同的輸出並拋出錯誤。

`typeof window` 檢查對於保護副作用和事件監聽器很有用，但它絕不能被用來在伺服器和客戶端之間產生不同的**初始渲染輸出**。初始狀態在兩邊必須相同；真正的瀏覽器值只應在 hydration 之後，在 `useEffect` 中出現。

## 正確的模式

### 1. 將瀏覽器讀取延遲到 useEffect

`useEffect` 只在客戶端執行，在 hydration 之後。透過使用安全的預設值初始化狀態並在 `useEffect` 中更新它，伺服器和客戶端的首次渲染將始終匹配：

```tsx
function useScreenWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}
```

### 2. useIsomorphicLayoutEffect

React 的 `useLayoutEffect` 在 DOM 變更後同步觸發，這對於測量佈局很有用。但在伺服器端它會產生警告，因為沒有 DOM。解決方案是 `useIsomorphicLayoutEffect`，它在客戶端使用 `useLayoutEffect`，在伺服器端使用 `useEffect`：

```tsx
import { useIsomorphicLayoutEffect } from "@reactuses/core";
```

ReactUse 的實作如下：

```tsx
const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;
```

當你需要同步的 DOM 測量而不會出現 SSR 警告時使用它。

### 3. 使用 useSyncExternalStore 進行無撕裂讀取

React 18 的 `useSyncExternalStore` 接受一個 `getServerSnapshot` 參數，專門用於 SSR。它保證伺服器渲染使用穩定的備援值，而客戶端訂閱即時更新：

```tsx
const size = useSyncExternalStore(
  subscribeToResize,
  () => ({ width: window.innerWidth, height: window.innerHeight }),
  () => ({ width: 0, height: 0 }) // server snapshot
);
```

## ReactUse 如何處理 SSR

[ReactUse](https://reactuse.com) 中的每個 hook 都設計為開箱即用地相容 SSR。以下是該函式庫使用的核心策略：

- **`isBrowser` 防護** — 一個簡單的 `typeof window !== 'undefined'` 檢查，用於保護副作用註冊，永遠不用於分支初始渲染輸出。
- **`useIsomorphicLayoutEffect`** — 在整個函式庫中取代 `useLayoutEffect`，以避免 SSR 警告。
- **`useSupported`** — 一個工具 hook，安全地檢查瀏覽器 API 是否存在，在伺服器端始終回傳 `false`，並將真正的檢查延遲到 effect 中。
- **帶有伺服器快照的 `useSyncExternalStore`** — 像 `useWindowSize` 這樣的 hooks 使用 React 18 的外部儲存 API，帶有明確的伺服器快照來保證 hydration 安全性。
- **安全的初始狀態** — 像 `useMediaQuery` 這樣的 hooks 接受 `defaultState` 參數，讓你可以控制伺服器渲染的值並防止不匹配。

## 實際的 Next.js 範例

### useLocalStorage

```tsx
import { useLocalStorage } from "@reactuses/core";

export default function Settings() {
  // Returns defaultValue on the server, reads localStorage after hydration
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Current: {theme}
    </button>
  );
}
```

### useMediaQuery

```tsx
import { useMediaQuery } from "@reactuses/core";

export default function Layout({ children }) {
  // Pass a defaultState to prevent hydration mismatch
  const isMobile = useMediaQuery("(max-width: 768px)", false);

  return (
    <div>
      {isMobile ? <MobileNav /> : <DesktopNav />}
      {children}
    </div>
  );
}
```

### useWindowSize

```tsx
import { useWindowSize } from "@reactuses/core";

export default function Dashboard() {
  // Returns { width: 0, height: 0 } on the server via getServerSnapshot
  const { width, height } = useWindowSize();

  return (
    <p>
      Viewport: {width} x {height}
    </p>
  );
}
```

以上三個範例都可以在 Next.js App Router 和 Pages Router 中使用，無需任何額外設定。

## SSR 安全 Hooks 檢查清單

在為 SSR 環境編寫或審查自訂 hooks 時，使用此檢查清單：

- [ ] **模組層級不存取瀏覽器 API** — 將所有 `window`/`document` 用法包裝在 effects 或防護中。
- [ ] **伺服器和客戶端的初始渲染相同** — 永遠不要基於瀏覽器檢查分支初始狀態。
- [ ] **使用 `useEffect` 進行瀏覽器讀取** — 將 `window`、`document` 和 `navigator` 的存取延遲到 effects 中。
- [ ] **用 `useIsomorphicLayoutEffect` 取代 `useLayoutEffect`** — 避免 SSR 警告。
- [ ] **使用 `useSyncExternalStore` 時提供 `getServerSnapshot`**。
- [ ] **接受 `defaultState` 或 `initialValue` 參數** — 讓使用者控制伺服器渲染的值。
- [ ] **使用 SSR 進行測試** — 用 `renderToString` 渲染你的元件並驗證沒有錯誤或不匹配。

## 安裝

```bash
npm i @reactuses/core
```

或使用其他套件管理器：

```bash
pnpm add @reactuses/core
yarn add @reactuses/core
```

ReactUse 中的每個 hook 都遵循上述模式。你可以將它們放入任何 Next.js、Remix 或 Gatsby 專案中，無需擔心 hydration 錯誤。

---

ReactUse 提供超過 100 個 SSR 相容的 hooks。[探索所有 hooks →](https://reactuse.com)
