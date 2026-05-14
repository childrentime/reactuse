---
title: "如何在 React 中偵測元素外部的點擊"
description: "學習如何使用 useClickOutside hook 在 React 中偵測元素外部的點擊。適用於模態框、下拉選單和彈出式選單。"
slug: detect-click-outside-react
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, useClickOutside]
keywords: [react click outside, detect click outside react, useClickOutside, close modal on outside click, react dropdown close]
image: /img/og.png
---

# 如何在 React 中偵測元素外部的點擊

偵測元素外部的點擊是 React 中最常見的 UI 模式之一。它對於在使用者點擊頁面其他位置時關閉模態框、下拉選單、彈出式選單和工具提示至關重要。

<!-- truncate -->

## 問題所在

在建構下拉選單或模態框等互動式元件時，你需要在使用者點擊外部任何位置時關閉它們。手動實作這個功能需要：

1. 新增一個 document 層級的點擊事件監聽器
2. 檢查點擊目標是在元素內部還是外部
3. 在元件卸載時清除監聽器
4. 處理邊界情況（portals、巢狀元素等）

## 手動實作方式

以下是大多數開發者從零開始實作的方式：

```tsx
import { useEffect, useRef } from "react";

function Dropdown() {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return <div ref={ref}>{/* dropdown content */}</div>;
}
```

這種方式可以運作，但你會在各處重複這個模式。而且它遺漏了觸控事件、iframe 點擊和 Shadow DOM 等邊界情況。

## 更好的方式：useClickOutside

[ReactUse](https://reactuse.com) 提供了 `useClickOutside`，為你處理所有這些問題：

```tsx
import { useClickOutside } from "@reactuses/core";
import { useRef, useState } from "react";

function Dropdown() {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(ref, () => {
    setIsOpen(false);
  });

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Menu</button>
      {isOpen && (
        <div ref={ref}>
          <p>Click outside to close</p>
        </div>
      )}
    </div>
  );
}
```

## 常見使用情境

- **模態對話框** — 點擊背景遮罩時關閉
- **下拉選單** — 點擊選單外部時關閉
- **工具提示/彈出框** — 在外部互動時消除
- **搜尋自動完成** — 關閉建議面板
- **右鍵選單** — 消除自訂的右鍵選單

## 線上體驗

查看我們文件網站上的[互動式範例](https://reactuse.com/element/useclickoutside/)，你可以編輯程式碼並即時查看結果。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hooks

- [useClickOutside 文件](https://reactuse.com/element/useclickoutside/)
- [useEventListener](https://reactuse.com/effect/useeventlistener/) — 用於自訂事件處理
- [useFocus](https://reactuse.com/element/usefocus/) — 用於追蹤焦點狀態

---

ReactUse 提供超過 100 個 React hooks。[探索所有 hooks →](https://reactuse.com)
