---
title: "React useFocus Hook：追蹤並控制元素焦點狀態 (2026)"
description: "React 處理元素焦點的實用指南：useFocus 給你一個即時的 isFocused 布林值，外加一個能隨時聚焦或失焦元素的 setter——不用手寫 focus/blur 監聽器，也不用去讀那個毫無響應性的 document.activeElement。涵蓋浮動標籤、失焦驗證、按 / 聚焦搜尋框、掛載即自動聚焦，以及什麼時候該用 CSS :focus-visible、useActiveElement 或 useWindowFocus。TypeScript 優先，SSR 安全。"
slug: react-usefocus-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-14
tags: [react, hooks, element, typescript, tutorial]
keywords: [usefocus, react usefocus, useFocus hook, react 焦點狀態, react 輸入框焦點, react 聚焦 hook, react 自動聚焦, react focus blur, document.activeElement react, 焦點管理 react, react 浮動標籤, 失焦驗證 react]
image: /img/og.png
---

# React useFocus Hook：追蹤並控制元素焦點狀態 (2026)

焦點是互動真正發生的地方——正在接收鍵盤輸入的輸入框、鍵盤使用者剛 Tab 到的按鈕。但 React 沒有為它提供任何 state。`document.activeElement` 知道答案卻從不通知你它變了，`autoFocus` 屬性只在掛載時觸發一次且無法重新觸發，而要把焦點用於*渲染*——編輯時顯示提示、浮動標籤、離開後再驗證——就得替每個需要的欄位手寫 `focus`/`blur` 監聽器。

[`@reactuses/core`](https://reactuse.com) 的 [`useFocus`](https://reactuse.com/element/usefocus/) 把這一切壓縮成一行：一個元件直接渲染的即時 `isFocused` 布林值，外加一個隨時能按你的邏輯聚焦或失焦元素的 setter。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useRef } from "react";
import { useFocus } from "@reactuses/core";

function SearchField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setFocused] = useFocus(ref);

  return (
    <div className={isFocused ? "field field--active" : "field"}>
      <input ref={ref} placeholder="搜尋 hooks…" />
      {isFocused && <kbd className="hint">esc 清空</kbd>}
      <button onClick={() => setFocused(true)}>跳到搜尋</button>
    </div>
  );
}
```

整合到此為止。hook 訂閱元素的 `focus` 和 `blur` 事件並把它們鏡像成 state；`setFocused(true)` 呼叫 `element.focus()`，`setFocused(false)` 呼叫 `element.blur()`。一個元組，雙向打通——既能觀察焦點，也能指揮焦點。

## 為什麼不用 autoFocus、activeElement 或純 CSS？

內建的每個選項都只覆蓋問題的一角：

- **CSS `:focus` / `:focus-within`** 在回應是*純樣式*時就是正確工具——邊框變色、外發光。用它，零 JavaScript、零重渲染。hook 的用武之地在於焦點要驅動**邏輯或 JSX**：渲染提示面板、決定*何時*驗證、使用者打字時暫停輪播。
- **`document.activeElement`** 是快照，不是訂閱。在 render 裡讀它，下一次 Tab 它就過期了；焦點移動時沒有任何東西會讓你的元件重渲染。
- **`autoFocus`** 只在掛載時觸發一次，這就是它的全部 API。它不能按需聚焦（「按 `/` 搜尋」）、不能失焦，也不告訴你當前狀態。
- **在各個 handler 裡散落 `ref.current.focus()`** 能用——直到你還需要*知道*元素是否聚焦，於是監聽器還是得自己維護。

## 手寫版——以及坑在哪

手寫版看起來人畜無害：

```tsx
// ⚠️ 手寫版——demo 裡能跑，應用裡漏 bug
function SearchField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    return () => {
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
    };
  }, []);
  // …
}
```

十五行裡藏著三個問題：

1. **晚掛載的目標永遠接不上線。** `if (!el) return` 只跑一次。如果輸入框是條件渲染的——在彈窗裡、在某個 tab 後面、在 loading 態之後——effect 早已 return，監聽器永遠掛不上。空依賴陣列表達不了「元素出現時重新執行」。
2. **漏掉初始狀態。** 如果在你的 effect 執行之前就有東西聚焦了這個元素（`autoFocus` 屬性、路由的焦點恢復），你的 state 是 `false`，而元素正帶著焦點坐在那。除了監聽器，你還得在掛載時補一次 `document.activeElement` 檢查。
3. **每個欄位都要複製一遍。** 把這十五行乘以表單裡的每個輸入框，整個檔案大半是管線程式碼。

`useFocus` 把三個坑全部吸收：target 可以是惰性 getter（`() => document.querySelector(".modal input")`），隨 DOM 變化重新解析；掛載時的狀態幫你對齊；每個欄位就一行。

## useFocus API

```tsx
const [isFocused, setFocused] = useFocus(target, initialValue?);
```

**`target`** 很靈活——手頭有什麼傳什麼：

```tsx
useFocus(ref);                                     // ref 物件
useFocus(document.getElementById("search"));       // 元素本身
useFocus(() => document.querySelector(".otp input")); // 惰性 getter
```

SVG 元素也支援——target 型別是 `HTMLElement | SVGElement`，圖表裡一個可聚焦的 `<circle tabindex="0">` 同樣適用。

**`initialValue`**（預設 `false`）是宣告式的自動聚焦：傳 `true`，hook 會在掛載時聚焦元素。和 `autoFocus` 屬性不同，它走的是與 `setFocused` 相同的程式碼路徑，支援 getter 目標，之後你手裡還握著即時狀態。

**`setFocused`** 是自帶兜底的命令式控制：`true` → `element.focus()`，`false` → `element.blur()`。目標還不存在時，呼叫是安全的 no-op 而不是崩潰。

## 真實場景

### 浮動標籤——標籤自己知道何時上浮

Material 風格輸入框：標籤待在欄位裡，欄位活躍*或*有內容時上浮。

```tsx
function FloatingLabelInput({ label }: { label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused] = useFocus(ref);
  const [value, setValue] = useState("");

  const floated = isFocused || value.length > 0;

  return (
    <label className="float-field">
      <span className={floated ? "float-label up" : "float-label"}>
        {label}
      </span>
      <input ref={ref} value={value} onChange={e => setValue(e.target.value)} />
    </label>
  );
}
```

純 CSS 用 `:focus-within` + `:placeholder-shown` 能逼近，但上浮條件一旦涉及應用狀態——受控 value、驗證旗標——你就需要*作為 state 的焦點*，這就是它。

### 失焦時驗證，而不是每次擊鍵

對一個剛敲了三個字元的使用者吼「信箱格式錯誤」是經典的表單 UX 翻車。解法是 *touched* 語義——使用者離開欄位後才驗證：

```tsx
function EmailField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused] = useFocus(ref);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isFocused) return;      // 還在編輯——保持安靜
    if (value) setTouched(true); // 帶著內容離開了欄位 → 開始評判
  }, [isFocused, value]);

  const error = touched && !isFocused && !value.includes("@");

  return (
    <div>
      <input ref={ref} value={value} onChange={e => setValue(e.target.value)} />
      {error && <p className="error">這看起來不像一個信箱地址。</p>}
    </div>
  );
}
```

`isFocused` 的翻轉*就是* touched 訊號——不用層層透傳 `onBlur`，而且使用者回來修正的那一刻錯誤自動消失。

### 按 `/` 聚焦搜尋

每個文件站都有這個功能，`setFocused` 加 [`useEventListener`](https://reactuse.com/effect/useeventlistener/) 就是完整實作：

```tsx
function DocSearch() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setFocused] = useFocus(ref);

  useEventListener("keydown", (e) => {
    if (e.key === "/" && !isFocused) {
      e.preventDefault();     // 別把斜線打進去
      setFocused(true);
    }
    if (e.key === "Escape") setFocused(false);
  });

  return <input ref={ref} placeholder="按 / 搜尋" />;
}
```

注意元組的兩半各司其職：`isFocused` 防止劫持使用者正*往輸入框裡*敲的 `/`，`setFocused` 負責跳轉。

### 條件渲染也不怕的自動聚焦

聚焦彈窗表單的第一個欄位，而這個輸入框在 [`useDisclosure`](https://reactuse.com/state/usedisclosure/) 點頭之前根本不存在：

```tsx
function RenameDialog({ open }: { open: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useFocus(ref, true); // 掛載即聚焦——也就是彈窗打開的那一刻

  if (!open) return null;
  return (
    <dialog open>
      <input ref={ref} defaultValue="untitled.md" />
    </dialog>
  );
}
```

因為元件（連同 hook）在彈窗打開時才掛載，`initialValue: true` 恰好在正確的時機觸發——不需要 `setTimeout(…, 0)` 之類的咒語。

## useFocus 與它的兄弟們

`@reactuses/core` 提供三個焦點 hook，對應三個縮放級別——按你要問的問題選：

| Hook | 回答的問題 | 什麼時候用 |
| --- | --- | --- |
| [`useFocus`](https://reactuse.com/element/usefocus/) | 「**這個元素**聚焦了嗎？」+ 控制 | 欄位級 UI：標籤、提示、驗證時機、快捷鍵 |
| [`useActiveElement`](https://reactuse.com/element/useactiveelement/) | 「全文件範圍內**哪個元素**持有焦點？」 | 表單級邏輯、焦點除錯、roving-focus 元件 |
| [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) | 「**分頁/視窗**本身有焦點嗎？」 | 使用者切走時暫停輪詢或動畫 |
| CSS `:focus` / `:focus-visible` | 僅樣式 | 任何純 CSS 能解決的回應——永遠先試它 |

經驗法則：單個元素 → `useFocus`；整個文件 → [`useActiveElement`](https://reactuse.com/element/useactiveelement/)；瀏覽器視窗本身 → [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/)。

## 生產環境注意事項

- **SSR 已處理。** 伺服器端沒有 DOM；hook 渲染你給的 `initialValue`，水合後再掛監聽器——你的程式碼裡不需要 `typeof window` 守衛。
- **`element.focus()` 會捲動頁面。** 瀏覽器會把新聚焦的元素捲進視口。頁面載入時自動聚焦一個首屏以下的元素會猛拽視口——`initialValue: true` 留給使用者視線所在的元素（彈窗、行內編輯器）。
- **別偷焦點。** 移動焦點是無障礙動作，不是視覺動作：螢幕閱讀器會朗讀新聚焦的元素，鍵盤使用者會丟失位置。只在*使用者意圖*下聚焦（快捷鍵、打開彈窗），永遠不要在計時器或資料重新整理裡聚焦。
- **失焦會把焦點丟給 `<body>`。** `setFocused(false)` 不會把焦點還回原處——關閉彈窗後，請顯式把焦點交還給觸發按鈕。
- **樣式交給 `:focus-visible`，邏輯交給 `isFocused`。** 鍵盤專屬的焦點環是 CSS 已解決的問題；把環留在 CSS 裡，把 hook 的 state 花在邏輯上。相關的關注點也按同樣方式組合——點擊欄位外部是 [`useClickOutside`](https://reactuse.com/element/useclickoutside/) 的事，不該用 blur hack。

## 要點回顧

- React 沒有焦點 state，原生原語也拼不出一個：`document.activeElement` 沒有響應性，`autoFocus` 只觸發一次，手寫監聽器會漏掉晚掛載的元素和掛載前已聚焦的情況。[`useFocus`](https://reactuse.com/element/usefocus/) 就是那個缺失的 `[isFocused, setFocused]` 元組。
- setter 是雙向控制——`true` 聚焦，`false` 失焦，元素還不存在時安全跳過；`initialValue: true` 是宣告式自動聚焦，精確落在掛載那一刻。
- 殺手級場景都是時機場景：編輯時浮動標籤、離開後才驗證、按 `/` 跳搜尋、彈窗第一個欄位一出現就聚焦。
- 純樣式歸 CSS 的 `:focus` 和 `:focus-visible`——把 hook 花在邏輯和 JSX 上。選對縮放級別：元素 → `useFocus`，文件 → [`useActiveElement`](https://reactuse.com/element/useactiveelement/)，視窗 → [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/)。
- 焦點是無障礙介面：跟隨使用者意圖移動它，永遠不偷它，用完把它還回原處。

`useFocus` 和其他 110+ 個 SSR 安全、TypeScript 優先的 hooks 都在 [`@reactuses/core`](https://reactuse.com)——一次安裝，可搖樹最佳化，沒有需要看護的依賴。

```bash
npm install @reactuses/core
```
