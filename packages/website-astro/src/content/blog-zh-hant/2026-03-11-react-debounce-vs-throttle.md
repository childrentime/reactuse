---
title: "React 中的防抖與節流：何時使用哪一個"
description: "了解 React 中防抖和節流的區別，何時使用各自的方法，以及如何使用 ReactUse 的 useDebounce 和 useThrottleFn hooks 來實作。"
slug: react-debounce-vs-throttle
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, performance, useDebounce, useThrottle]
keywords: [react debounce, react throttle, debounce vs throttle, useDebounce, useThrottle, react performance]
image: /img/og.png
---

# React 中的防抖與節流：何時使用哪一個

防抖和節流是每個 React 開發者工具箱中必備的兩種限流技術。兩者都能防止函式過於頻繁地觸發，但它們的工作方式從根本上不同。選擇錯誤的方式會讓你的 UI 感覺遲鈍或浪費資源。本指南解析何時使用哪一個，以及如何以最少的工作量來實作。

<!-- truncate -->

## 什麼是防抖？

防抖會延遲執行，直到一連串活動停止為止。把它想像成電梯門：每次有新的人走進來，它就會重設關門計時器。門只有在所有人停止進入幾秒後才會關閉。

用程式碼來說，一個被防抖的函式會在最後一次呼叫後等待一個靜默期（例如 300 毫秒）才實際執行。如果持續有新的呼叫到來，計時器就會不斷重啟。

**範例：** 使用者在搜尋框中輸入「react hooks」。沒有防抖的話，你會在每次按鍵時發送一個 API 請求（11 個請求）。有了 300 毫秒的防抖，你只會在使用者暫停輸入後發送一個請求。

## 什麼是節流？

節流保證一個函式在每個時間間隔內最多執行一次，不管它被觸發多少次。把它想像成一個節拍器：不管你多快地敲桌子，它都以固定的速率滴答作響。

一個被節流的函式會在第一次呼叫時立即執行，然後忽略後續的呼叫，直到間隔時間過去。

**範例：** 當使用者捲動頁面時，scroll 事件每秒可以觸發數百次。100 毫秒的節流確保你的捲動處理函式每秒最多執行 10 次，保持動畫流暢而不會壓垮瀏覽器。

## 關鍵差異一覽

| | **防抖** | **節流** |
|---|---|---|
| **觸發時機** | 活動停止 *N* 毫秒後 | 每 *N* 毫秒最多一次 |
| **首次呼叫** | 延遲 | 立即 |
| **保證執行** | 僅在靜默期後 | 以規律間隔 |
| **最適合** | 最終值場景 | 持續回饋場景 |
| **類比** | 等待關閉的電梯門 | 穩定滴答的節拍器 |

## 何時使用防抖

當你只關心一連串事件後的**最終結果**時，防抖是正確的選擇：

- **搜尋輸入** -- 等到使用者停止輸入後再查詢 API。
- **表單欄位的 API 呼叫** -- 避免在每個字元變更時發送請求。
- **表單驗證** -- 在使用者完成編輯欄位後驗證，而非在按鍵中途。
- **視窗調整大小計算** -- 在使用者完成調整大小後重新計算佈局。

## 何時使用節流

當你需要在持續事件期間進行**穩定、週期性的更新**時，節流是正確的選擇：

- **捲動位置追蹤** -- 更新進度條或觸發無限捲動載入。
- **視窗調整大小** -- 在使用者仍在拖曳時即時調整佈局。
- **滑鼠/觸控移動** -- 追蹤指標座標，用於拖放或繪圖。
- **限速 API 呼叫** -- 確保你永遠不超過每秒請求限制。

## 使用 ReactUse 實作

### 使用 `useDebounce` 防抖一個值

`useDebounce` 接受一個值並回傳其防抖版本。回傳的值只在指定的等待期間無活動後才更新。

```tsx
import { useDebounce } from "@reactuses/core";
import { useEffect, useState } from "react";

function SearchBox() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // Only fires 300ms after the user stops typing
      fetchSearchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### 使用 `useThrottleFn` 節流一個函式

`useThrottleFn` 包裝一個函式並回傳一個節流版本，具有 `run`、`cancel` 和 `flush` 控制方法。

```tsx
import { useThrottleFn } from "@reactuses/core";
import { useEffect, useState } from "react";

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  const { run: handleScroll } = useThrottleFn(
    () => {
      setScrollY(window.scrollY);
    },
    100
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return <div>Scroll position: {scrollY}px</div>;
}
```

## 常見錯誤

1. **對捲動事件使用防抖。** 回呼只在捲動停止後才觸發，所以你的 UI 在整個捲動過程中感覺像是凍結的。使用者期望在捲動時有持續的視覺回饋，所以節流才是正確的選擇。

2. **對搜尋輸入使用節流。** 節流會在使用者仍在輸入時週期性觸發，這會發送不必要的中間 API 請求，帶有不完整的查詢。防抖等待使用者暫停，確保你只發送最終預期的查詢。

3. **在每次渲染時建立新的防抖/節流函式。** 這是一個微妙但常見的錯誤。一個新的函式意味著一個新的內部計時器，這實際上在每次渲染時重設了延遲，使其失去了意義。ReactUse hooks 透過使用 refs 和 `useMemo` 在內部記憶化節流或防抖函式來為你處理這個問題。

4. **忘記清理。** 防抖或節流的呼叫可能在元件卸載後觸發，導致可怕的「在已卸載元件上更新狀態」警告。ReactUse 的 `useDebounce` 和 `useThrottleFn` 都會在元件卸載時自動取消任何待處理的呼叫，所以你不必擔心過期的回呼。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hooks

- [useDebounce 文件](https://reactuse.com/hooks/useDebounce/) -- 防抖一個響應式值
- [useDebounceFn 文件](https://reactuse.com/hooks/useDebounceFn/) -- 防抖一個函式
- [useThrottle 文件](https://reactuse.com/hooks/useThrottle/) -- 節流一個響應式值
- [useThrottleFn 文件](https://reactuse.com/hooks/useThrottleFn/) -- 節流一個函式

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
