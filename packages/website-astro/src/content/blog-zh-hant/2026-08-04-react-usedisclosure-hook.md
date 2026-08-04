---
title: "React useDisclosure Hook：管理模態框和抽屜的開關狀態 (2026)"
description: "useDisclosure 實用指南：用一個 Hook 管理模態框、抽屜、彈出框的開啟/關閉狀態，支援受控和非受控模式、生命週期回呼、ref 穩定化的處理函式——無需引入 UI 框架。TypeScript 優先。"
slug: react-usedisclosure-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-04
tags: [react, hooks, state, typescript, tutorial]
keywords: [react useDisclosure, usedisclosure, useDisclosure hook, react 模態框狀態, react 抽屜元件, react 彈出框, react 受控模態框, usedisclosure react, react 開關狀態管理]
image: /img/og.png
---

# React useDisclosure Hook：管理模態框和抽屜的開關狀態 (2026)

每個 React 應用都會逐漸累積各種可切換的 UI——確認對話框、行動端導航抽屜、設定彈出框、通知面板。它們背後的狀態始終相同：一個布林值、一個開啟方法、一個關閉方法，可能再加一個狀態變化時觸發埋點或焦點管理的回呼。於是你寫了 `useState(false)` 加三個內聯處理函式，複製貼上到下一個模態框，到第五個可切換元件的時候，你發現同樣的五行模式散落在十幾個檔案裡，沒有複用，也沒有生命週期鉤子。

[`useDisclosure`](https://reactuse.com/state/usedisclosure/)（來自 [`@reactuses/core`](https://reactuse.com)）將這一模式提取為一次性解決方案：預設非受控，需要時可切換為受控模式，提供 `onOpen` / `onClose` / `onChange` 回呼在恰當的時機觸發。回傳的處理函式透過 ref 實現參考穩定，不會導致子元件不必要的重新渲染。本文介紹 API、內部實作、受控與非受控的契約，以及模態框、抽屜和組合式多重 disclosure UI 的實際模式。TypeScript 優先。

<!-- truncate -->

## 最簡單的用法：模態框切換

```tsx
import { useDisclosure } from '@reactuses/core';

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button onClick={onOpen}>開啟設定</button>
      {isOpen && (
        <dialog open>
          <h2>設定</h2>
          <p>這裡是設定面板內容。</p>
          <button onClick={onClose}>關閉</button>
        </dialog>
      )}
    </>
  );
}
```

不需要 `useState`，不需要寫內聯的 `() => setOpen(true)` / `() => setOpen(false)`，不需要糾結命名。Hook 回傳語義明確的具名函式——觸發器上用 `onOpen`，關閉按鈕上用 `onClose`。每次渲染回傳相同的函式參考（ref 穩定化），所以把 `onClose` 傳給 `React.memo` 包裹的子元件也不會破壞最佳化。

## 完整 API

```ts
const {
  isOpen,       // boolean — 目前狀態
  onOpen,       // () => void — 設為 true
  onClose,      // () => void — 設為 false
  onOpenChange, // () => void — 切換：關閉時呼叫 onOpen，開啟時呼叫 onClose
  isControlled, // boolean — 如果傳了 isOpen prop 則為 true
} = useDisclosure({
  defaultOpen,  // boolean — 初始狀態（僅非受控模式）
  isOpen,       // boolean — 傳入以進入受控模式
  onOpen,       // () => void — 開啟後觸發
  onClose,      // () => void — 關閉後觸發
  onChange,     // (isOpen: boolean | undefined) => void — 任何變化時觸發
});
```

所有欄位都是可選的。不傳任何參數呼叫 `useDisclosure()` 就能得到一個初始關閉的非受控切換，涵蓋大多數模態框和抽屜的需求。選項是為「僅僅一個布林值不夠用」的場景準備的。

## 生命週期回呼：當開啟和關閉有副作用時

布林切換不夠用的時刻，就是你的模態框不只是顯示和隱藏的時刻。真實的 disclosure 元件需要副作用：使用者開啟定價彈窗時發送埋點事件，抽屜開啟時捕獲焦點，關閉時恢復焦點，通知面板切換時啟動或停止後台輪詢。內聯處理函式會把這些邏輯分散到 JSX 各處：

```tsx
// 沒有 useDisclosure 時——副作用與 JSX 糾纏在一起
<button onClick={() => {
  setIsOpen(true);
  analytics.track('pricing_modal_opened');
  focusTrap.activate();
}}>
  查看定價
</button>
```

使用 `useDisclosure`，副作用集中在 Hook 呼叫處：

```tsx
const { isOpen, onOpen, onClose } = useDisclosure({
  onOpen() {
    analytics.track('pricing_modal_opened');
    focusTrap.activate();
  },
  onClose() {
    analytics.track('pricing_modal_closed');
    focusTrap.deactivate();
  },
});

// JSX 變得簡潔
<button onClick={onOpen}>查看定價</button>
```

回呼在狀態更新*之後*觸發——`onOpen` 在 `isOpen` 變為 `true` 時執行，`onClose` 在變為 `false` 時執行。`onChange` 在每次狀態轉換時觸發並傳入新值，適用於需要一個處理函式涵蓋兩個方向的場景（如同步到 URL 參數或外部 store）。

回呼 props 內部透過 [`useLatest`](https://reactuse.com/state/uselatest/) 包裝——你可以傳入內聯箭頭函式而不會導致回傳的 `onOpen` / `onClose` 獲得新的參考。處理函式即使回呼變化也保持參考穩定。

## 受控模式：由父元件掌控狀態

有時開啟狀態屬於父元件或狀態管理器，disclosure 元件只負責渲染。傳入 `isOpen` prop，Hook 就會切換到受控模式：

```tsx
function ControlledDrawer({ isOpen, onToggle }: Props) {
  const disclosure = useDisclosure({
    isOpen,
    onOpen: onToggle,
    onClose: onToggle,
  });

  // disclosure.isControlled === true
  // disclosure.isOpen 反映 prop 的值
  // disclosure.onOpen / onClose 觸發父元件的 onToggle

  return (
    <aside className={disclosure.isOpen ? 'open' : ''}>
      <button onClick={disclosure.onClose}>×</button>
      {/* 抽屜內容 */}
    </aside>
  );
}
```

受控模式下，`onOpen` 和 `onClose` *不會*更新內部狀態——Hook 尊重 prop 作為資料來源。它們只觸發回呼，讓父元件決定接下來做什麼。`isControlled` 標誌暴露出來以便你在需要時進行分支判斷，不過實務中很少需要檢查它。

兩種模式的邊界很清晰：如果 `isOpen` 是 `undefined`（或未傳），Hook 是非受控的。如果是布林值——即使是 `false`——Hook 就是受控的。不存在「半受控」的灰色地帶。

## onOpenChange：切換簡寫

很多 UI 框架暴露單一的 `onOpenChange` 回呼而非分開的 open/close 處理函式。`useDisclosure` 回傳的 `onOpenChange` 函式就是一個切換器：disclosure 關閉時呼叫 `onOpen`，開啟時呼叫 `onClose`。它可以直接映射到暴露單一回呼的元件：

```tsx
const { isOpen, onOpenChange } = useDisclosure();

// 適配 Radix 風格的 API
<Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
  <Dialog.Trigger>開啟</Dialog.Trigger>
  <Dialog.Content>...</Dialog.Content>
</Dialog.Root>

// 也可用作切換按鈕的處理函式
<button onClick={onOpenChange}>
  {isOpen ? '隱藏' : '顯示'}篩選器
</button>
```

切換不是第三條狀態路徑——它委託給同一套觸發回呼的 `onOpen` / `onClose`。一次轉換，一個回呼，一條程式碼路徑。

## 內部實作

完整實作很簡短：

```ts
import { useCallback } from 'react';
import { useControlled } from '../useControlled';
import { useLatest } from '../useLatest';

export function useDisclosure(props = {}) {
  const {
    defaultOpen,
    isOpen: isOpenProp,
    onClose: onCloseProp,
    onOpen: onOpenProp,
    onChange = () => {},
  } = props;

  const onOpenPropRef = useLatest(onOpenProp);
  const onClosePropRef = useLatest(onCloseProp);
  const [isOpen, setIsOpen] = useControlled(
    isOpenProp,
    defaultOpen || false,
    onChange,
  );

  const isControlled = isOpenProp !== undefined;

  const onClose = useCallback(() => {
    if (!isControlled) setIsOpen(false);
    onClosePropRef.current?.();
  }, [isControlled, onClosePropRef, setIsOpen]);

  const onOpen = useCallback(() => {
    if (!isControlled) setIsOpen(true);
    onOpenPropRef.current?.();
  }, [isControlled, onOpenPropRef, setIsOpen]);

  const onOpenChange = useCallback(() => {
    (isOpen ? onClose : onOpen)();
  }, [isOpen, onOpen, onClose]);

  return { isOpen: !!isOpen, onOpen, onClose, onOpenChange, isControlled };
}
```

三個建構模組：

1. **[`useControlled`](https://reactuse.com/state/usecontrolled/)** — 在內部 `useState` 和外部 prop 之間切換的 Hook。
2. **[`useLatest`](https://reactuse.com/state/uselatest/)** — 把回呼 props 包裝在 ref 中，使回傳的處理函式參考穩定。
3. **受控守衛** — `if (!isControlled) setIsOpen(...)` 確保 Hook 不會與父元件的狀態衝突。

沒有 effect，沒有訂閱，沒有瀏覽器 API。Hook 天然 SSR 安全——純 React 狀態。

## useDisclosure vs useBoolean vs useToggle

`@reactuses/core` 有三個管理布林值的 Hook，適用場景如下：

| | [`useDisclosure`](https://reactuse.com/state/usedisclosure/) | [`useBoolean`](https://reactuse.com/state/useboolean/) | [`useToggle`](https://reactuse.com/state/usetoggle/) |
|---|---|---|---|
| **回傳值** | `{ isOpen, onOpen, onClose, onOpenChange, isControlled }` | `[value, { toggle, setTrue, setFalse }]` | `[value, toggle, setValue]` |
| **受控模式** | 支援（`isOpen` prop） | 不支援 | 不支援 |
| **生命週期回呼** | `onOpen`、`onClose`、`onChange` | 無 | 無 |
| **處理函式穩定性** | 透過 `useLatest` ref 穩定化 | 標準 `useCallback` | 標準 `useCallback` |
| **最適合** | 模態框、抽屜、彈出框——有開啟/關閉語義和副作用的場景 | 簡單的顯示/隱藏標誌，不需要回呼 | 極簡布林切換；非布林交替（`'asc'` / `'desc'`） |

如果不需要回呼或受控模式，`useBoolean` 或 `useToggle` 更輕量。`useDisclosure` 在開啟和關閉本身攜帶超越布林值的含義時才真正發揮作用。

## 實際模式

### 確認對話框：支援 Escape 和遮罩層關閉

```tsx
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button onClick={onOpen}>刪除</button>
      {isOpen && (
        <div className="overlay" onClick={onClose}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <p>確定要刪除嗎？</p>
            <button onClick={() => { onConfirm(); onClose(); }}>
              是的，刪除
            </button>
            <button onClick={onClose}>取消</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### 多個 Disclosure 互斥

```tsx
function SettingsPanel() {
  const general = useDisclosure({ defaultOpen: true });
  const security = useDisclosure();
  const notifications = useDisclosure();

  const closeAll = () => {
    general.onClose();
    security.onClose();
    notifications.onClose();
  };

  const openExclusive = (target: ReturnType<typeof useDisclosure>) => {
    closeAll();
    target.onOpen();
  };

  return (
    <div>
      <button onClick={() => openExclusive(general)}>一般</button>
      <button onClick={() => openExclusive(security)}>安全性</button>
      <button onClick={() => openExclusive(notifications)}>通知</button>

      {general.isOpen && <GeneralSettings />}
      {security.isOpen && <SecuritySettings />}
      {notifications.isOpen && <NotificationSettings />}
    </div>
  );
}
```

每個區段有自己的 `useDisclosure`。`openExclusive` 輔助函式先關閉所有，再開啟一個——不需要手風琴函式庫就能實現手風琴行為。

## 從 Chakra UI 遷移

如果你用過 Chakra UI 的 `useDisclosure`，API 幾乎一樣。主要差異：

- **沒有 `getButtonProps` / `getDisclosureProps`** — 這個 Hook 管理狀態，不管理 DOM 屬性。直接使用 `isOpen` 和 `onOpen` / `onClose`。
- **`onOpenChange` 而非 `onToggle`** — 行為相同（切換），名稱不同，與 Radix、Headless UI、Ariakit 的命名慣例一致。
- **`onChange` 回呼** — Chakra 不暴露這個；`@reactuses/core` 提供，用於同步布林值到外部 store。
- **不依賴 UI 框架** — 安裝 `@reactuses/core`，搭配任何元件庫使用，或者不搭配。

遷移就是一次重新命名。

## 重點總結

- **[`useDisclosure`](https://reactuse.com/state/usedisclosure/) 替代了 `useState(false)` + 三個內聯處理函式的模式**——你的每個模態框、抽屜、彈出框裡都有的那個。
- **生命週期回呼（`onOpen`、`onClose`、`onChange`）集中管理副作用**——埋點、焦點管理、動畫觸發——遠離 JSX。
- **受控模式可選**：傳入 `isOpen`，Hook 聽從你的狀態；不傳，Hook 自己管理。
- **處理函式參考穩定**——`onOpen`、`onClose`、`onOpenChange` 跨渲染保持同一參考，可安全傳給 memo 化的子元件。
- **`onOpenChange` 是切換函式**，委託給 `onOpen` / `onClose`，直接映射到 Radix、Headless UI、Ariakit 的單回呼 API。
- **天然 SSR 安全**——沒有瀏覽器 API，沒有 effect，純 React 狀態。

從 [`@reactuses/core`](https://reactuse.com/state/usedisclosure/) 取得，不要再複製貼上模態框狀態了。
