---
title: "React 表單處理：防抖校驗、自動儲存草稿與受控輸入"
description: "用 ReactUse 中的 useDebounce、useControlled、useLocalStorage 與 useClickOutside 在 React 中構建異步校驗欄位、自動儲存的草稿、受控開關，以及點擊外部關閉的浮層。"
slug: react-form-handling-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-08
tags: [react, hooks, forms, validation, tutorial]
keywords: [react form hooks, useDebounce, useControlled, useLocalStorage, useClickOutside, react form validation, react auto save form, react controlled component, react form draft, react debounce input]
image: /img/og.png
---

# React 表單處理：防抖校驗、自動儲存草稿與受控輸入

表單是每個 React 應用裡被重寫次數最多的部分。第一天看上去再簡單不過——丟一個 `<input>`，把 `onChange` 接到 `useState`，發版。到了第三個月，同一個表單上多了異步使用者名稱校驗、一份自動儲存的草稿、一個自定義日期浮層，以及一個必須與設計系統配合好的「受控/非受控」開關。每一項都拖進了自己的臨時狀態機、自己的 effect 清理邏輯，以及自己那一堆邊界情況。表單檔案成了倉庫裡最長的那一個，團隊裡沒人願意碰它。

<!-- truncate -->

本文將走過四個非平凡表單遲早都會用到的原語：用一個防抖值來限流異步校驗、用一個「受控或非受控」包裝讓元件兩種用法都接受、用 localStorage 撐起一份能在重新整理中存活的草稿，以及一個不會洩漏監聽器的「點擊外部關閉」浮層方案。每一個原語，我們都會先寫手動版本，把代價擺出來，再換成 [ReactUse](https://reactuse.com) 中專門的 Hook。最後我們把四個 Hook 組合成一個完整的「帳號設定」表單：邊輸入邊校驗、自動儲存草稿、還包含一個國家選擇浮層。

## 1. 防抖的異步校驗

### 手動實作

異步校驗最經典的錯誤，是每敲一個鍵就發一次請求。經典的修法是 `setTimeout`，經典的 bug 是忘了清理上一次的計時器：

```tsx
import { useEffect, useState } from "react";

function ManualUsernameField() {
  const [username, setUsername] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(username), 400);
    return () => clearTimeout(id);
  }, [username]);

  useEffect(() => {
    if (!debounced) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("checking");
    fetch(`/api/username?u=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data.available ? "ok" : "taken");
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <label>
      使用者名稱
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <span>{status}</span>
    </label>
  );
}
```

這裡有兩個 effect，做著兩件不同的事，還必須保持同步。第一個是防抖器：把 `username` 的密集變化壓成一個延遲後的 `debounced` 值。第二個是請求執行器：當 `debounced` 變化時發請求，並忽略掉過期回應。兩個 effect 都需要自己的清理邏輯。忘了 `clearTimeout`，請求會重複；忘了 `cancelled` 旗標，競態會讓舊回應覆蓋新回應。

真正的代價不是行數——而是這段防抖邏輯被焊死在了這個具體欄位上。要在 email 欄位重用同樣的能力，就得複製貼上這五行。

### ReactUse 的寫法：useDebounce

`useDebounce` 回傳一個比輸入值落後固定延遲的值：

```tsx
import { useEffect, useState } from "react";
import { useDebounce } from "@reactuses/core";

function UsernameField() {
  const [username, setUsername] = useState("");
  const debounced = useDebounce(username, 400);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  useEffect(() => {
    if (!debounced) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("checking");
    fetch(`/api/username?u=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data.available ? "ok" : "taken");
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <label>
      使用者名稱
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <span>{status}</span>
    </label>
  );
}
```

第一個 effect——專管防抖的那個——消失了。`useDebounce` 自己接管了計時器與清理。剩下的程式碼才是真正屬於你這個表單的部分：當防抖值變化時跑一次校驗請求，並丟棄過期回應。

這個 Hook 還與函式版的 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 天然搭配——當你想要的是一個事件處理器（例如「失焦儲存」）而不是一個值時，就用它。

## 2. 受控還是非受控——選一種，兩種都支援

### 手動實作

函式庫元件常面對一個老問題：消費者應該傳 `value` 與 `onChange`，還是讓元件內部用 `defaultValue` 自己管狀態？老實說答案是「看誰用」。多數團隊都得在每個欄位上重新發明一遍這個模式：

```tsx
function ManualToggle({
  value,
  defaultValue = false,
  onChange,
}: {
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = isControlled ? value : internal;

  const handleClick = () => {
    const next = !current;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <button role="switch" aria-checked={current} onClick={handleClick}>
      {current ? "開" : "關"}
    </button>
  );
}
```

模式本身不複雜，但它是一塊吸 bug 的磁鐵。如果消費者中途把 `value` 切回 `undefined`，模式就在受控與非受控間跳了一次。如果他們傳了 `value` 卻沒傳 `onChange` 呢？React 自己的表單輸入會對這兩種情況都給出警告，但自定義元件幾乎從不寫這些校驗——而當設計系統不斷擴張，每一個 input、switch、slider、date picker 都會複製一遍這堆樣板。

### ReactUse 的寫法：useControlled

`useControlled` 把整個模式塌縮成一個 Hook 呼叫：

```tsx
import { useControlled } from "@reactuses/core";

function Toggle({
  value,
  defaultValue = false,
  onChange,
}: {
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const [current, setCurrent] = useControlled({
    value,
    defaultValue,
    onChange,
  });

  return (
    <button
      role="switch"
      aria-checked={current}
      onClick={() => setCurrent(!current)}
    >
      {current ? "開" : "關"}
    </button>
  );
}
```

這個 Hook 替你做了三件你本來要自己寫的事：

1. **首次渲染時定型**——決定是受控還是非受控，如果之後模式翻轉就給出警告，與 React 內建 input 的診斷口徑一致。
2. **回傳一個穩定的 setter**，內部根據模式分支：非受控時更新內部狀態；受控時只呼叫 `onChange`，讓父元件去重新渲染。
3. **始終反映最新的事實**。元組的第一個元素在受控時是 `value`、非受控時是內部狀態，消費者永遠不會看到不一致。

把它丟進設計系統裡任何 input 形狀的元件，從此不再為這個模式分心。

## 3. 自動儲存表單草稿

### 手動實作

長表單——引導流、設定頁、內容編輯器——絕不該讓使用者的工作毀於一次重新整理。標準做法是把表單狀態鏡射到 `localStorage`；標準的失誤是每敲一下鍵就寫一次：

```tsx
function ManualDraftForm() {
  const [draft, setDraft] = useState(() => {
    if (typeof window === "undefined") return { title: "", body: "" };
    const raw = localStorage.getItem("post-draft");
    return raw ? JSON.parse(raw) : { title: "", body: "" };
  });

  useEffect(() => {
    localStorage.setItem("post-draft", JSON.stringify(draft));
  }, [draft]);

  return (
    <form>
      <input
        value={draft.title}
        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
      />
      <textarea
        value={draft.body}
        onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
      />
    </form>
  );
}
```

這十五行裡藏著三個問題。第一，惰性初始化會在掛載時讀一次 `localStorage`，但不會在另一個分頁更新它時再讀——多分頁編輯會安靜地翻車。第二，`JSON.parse` 遇到損壞資料會拋錯，元件就在掛載時崩了。第三，`localStorage.setItem` 是同步的，每次渲染都跑一次，對一個手快的使用者而言會頂住主執行緒。

最上面那行 SSR 檢查就是個訊號：這是一段會被倉庫裡其它元件複製過去、並大概率寫錯的「配方」。

### ReactUse 的寫法：useLocalStorage

`useLocalStorage` 長得像 `useState`、用起來也像 `useState`，但值住在儲存裡：

```tsx
import { useLocalStorage } from "@reactuses/core";

function DraftForm() {
  const [draft, setDraft] = useLocalStorage("post-draft", {
    title: "",
    body: "",
  });

  return (
    <form>
      <input
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
      />
      <textarea
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
      />
    </form>
  );
}
```

手動版本搞錯或漏掉的四件事，這個 Hook 都幫你做好了：

1. **SSR 安全初始化**。在伺服器端回傳預設值；客戶端首次渲染時無失配地完成水合。
2. **跨分頁同步**。監聽 `storage` 事件，當另一個分頁寫入同一個鍵時同步狀態。
3. **JSON 容錯**。捕獲解析錯誤並退回預設值，不再讓元件崩潰。
4. **穩定的 setter**。回傳的 setter 引用穩定，可以安全地放進 `useEffect` 依賴或 memo 化的子元件裡。

對真的很長的表單，常常想要「自動儲存 + 防抖」。把第一節的 `useDebounce` 搭進來——先防抖表單狀態，再把防抖後的值寫進儲存——你就得到一個能在重新整理中存活、又不會捶硬碟的編輯器。

## 4. 用「點擊外部」關閉浮層

### 手動實作

國家選擇器、日期選擇器、自動補全選單，以及一切浮在頁面上的東西，都得在使用者點別的地方時關掉自己。教科書式的實作是在 `document` 上監聽：

```tsx
function ManualPopover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)}>切換</button>
      {open && <div className="popover">{children}</div>}
    </div>
  );
}
```

簡單場景這能跑——直到你的浮層被 portal 渲染到別處。`ref.current.contains(...)` 假設浮層是觸發器的 DOM 後代，但真實的設計系統裡幾乎從來不是：浮層會被掛到 body 根節點，繞開父容器的 `overflow`。你還得在 `mousedown` 與 `click` 之間做選擇（多數情況下答案是 `mousedown`，這樣浮層會在某個下游 click 處理器觸發之前就關掉），而且記得在關閉時跳過監聽，免得每次頁面 click 都白跑一遍。

### ReactUse 的寫法：useClickOutside

`useClickOutside` 接收一個 ref（或一組 ref）與一個處理器：

```tsx
import { useRef, useState } from "react";
import { useClickOutside } from "@reactuses/core";

function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useClickOutside([triggerRef, popoverRef], () => setOpen(false));

  return (
    <>
      <div ref={triggerRef}>
        <button onClick={() => setOpen((v) => !v)}>切換</button>
      </div>
      {open && (
        <div ref={popoverRef} className="popover">
          {children}
        </div>
      )}
    </>
  );
}
```

支援 ref 陣列的形式，正是它能搞定 portal 浮層的關鍵：把觸發器與浮動面板都標成「內部」，點其它地方就觸發處理器。Hook 也替你處理 `mousedown` 的選擇，監聽器只在 document 層掛一次（不會在每個元件裡來回掛卸），並在卸載時清理乾淨。

它還有一個相近的兄弟 [`useClickAway`](https://reactuse.com/element/useclickaway/)——API 略有不同，適合只有單個 ref 的場景，按你元件裡讀起來更順的那個挑就行。

## 組合在一起：帳號設定表單

下面是一個完整的帳號設定表單，把四個 Hook 都用上了。使用者名稱邊輸入邊校驗。整個表單自動儲存到 `localStorage`。通知開關是受控/非受控兩可的元件。國家選擇器是個對 portal 友善、點擊外部就關的浮層。

```tsx
import { useEffect, useRef, useState } from "react";
import {
  useDebounce,
  useControlled,
  useLocalStorage,
  useClickOutside,
} from "@reactuses/core";

interface Settings {
  username: string;
  country: string;
  notifications: boolean;
}

const COUNTRIES = ["臺灣", "日本", "德國", "巴西", "印度"];

function NotificationSwitch({
  value,
  defaultValue = true,
  onChange,
}: {
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const [on, setOn] = useControlled({ value, defaultValue, onChange });
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      style={{
        width: 48,
        height: 24,
        borderRadius: 999,
        border: "none",
        background: on ? "#3b82f6" : "#cbd5e1",
        position: "relative",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 26 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          transition: "left 120ms ease",
        }}
      />
    </button>
  );
}

function CountryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useClickOutside([triggerRef, menuRef], () => setOpen(false));

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #cbd5e1",
          background: "white",
          cursor: "pointer",
        }}
      >
        {value || "選擇國家"} ▾
      </button>
      {open && (
        <ul
          ref={menuRef}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            margin: 0,
            padding: 4,
            listStyle: "none",
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            minWidth: 180,
          }}
        >
          {COUNTRIES.map((c) => (
            <li
              key={c}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                cursor: "pointer",
                background: c === value ? "#eff6ff" : "transparent",
              }}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SettingsForm() {
  const [settings, setSettings] = useLocalStorage<Settings>("account-settings", {
    username: "",
    country: "",
    notifications: true,
  });

  const debouncedUsername = useDebounce(settings.username, 400);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  useEffect(() => {
    if (!debouncedUsername) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("checking");
    fetch(`/api/username?u=${encodeURIComponent(debouncedUsername)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data.available ? "ok" : "taken");
      })
      .catch(() => {
        if (!cancelled) setStatus("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedUsername]);

  return (
    <form
      style={{
        maxWidth: 480,
        display: "grid",
        gap: 16,
        fontFamily: "system-ui, sans-serif",
      }}
      onSubmit={(e) => e.preventDefault()}
    >
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 14, color: "#475569" }}>使用者名稱</span>
        <input
          value={settings.username}
          onChange={(e) =>
            setSettings({ ...settings, username: e.target.value })
          }
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
          }}
        />
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {status === "checking" && "校驗中..."}
          {status === "ok" && "✓ 可用"}
          {status === "taken" && "✗ 已被佔用"}
        </span>
      </label>

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 14, color: "#475569" }}>國家</span>
        <CountryPicker
          value={settings.country}
          onChange={(country) => setSettings({ ...settings, country })}
        />
      </label>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 14, color: "#475569" }}>郵件通知</span>
        <NotificationSwitch
          value={settings.notifications}
          onChange={(notifications) =>
            setSettings({ ...settings, notifications })
          }
        />
      </label>
    </form>
  );
}
```

四個 Hook，四種職責，零重疊：

- **`useDebounce`** 把密集敲擊壓成一次延遲值，讓異步校驗只在使用者停頓後才發請求
- **`useControlled`** 讓開關元件同時接受 `value` 與 `defaultValue` 兩種用法，不必複製分支邏輯
- **`useLocalStorage`** 把整個設定物件在重新整理中持久化，附帶 SSR 安全初始化與跨分頁同步
- **`useClickOutside`** 在使用者點擊觸發器與選單之外的任何地方時關閉國家選單——portal 渲染同樣可用

整個表單檔案最後大約 200 行，絕大部分是 JSX 與樣式。那些容易寫錯的瀏覽器細枝末節——計時器清理、SSR 儲存存取、受控/非受控判別、document 級監聽——都被收進了那些已經被各種翻車場景打磨過的函式庫 Hook 裡。

## 安裝

```bash
npm i @reactuses/core
```

## 相關 Hook

- [`useDebounce`](https://reactuse.com/state/usedebounce/) — 讓一個值按固定延遲落後於其輸入
- [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) — 防抖一個回呼而非一個值
- [`useControlled`](https://reactuse.com/state/usecontrolled/) — 構建同時接受受控/非受控用法的元件
- [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) — 持久化到 localStorage 的 `useState`，自帶 SSR 安全與跨分頁同步
- [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) — 與 `useLocalStorage` 同形，但作用域為 session
- [`useClickOutside`](https://reactuse.com/element/useclickoutside/) — 偵測一個或多個元素之外的點擊
- [`useClickAway`](https://reactuse.com/element/useclickaway/) — 單 ref 版本的點擊外部偵測
- [`useToggle`](https://reactuse.com/state/usetoggle/) — 帶顯式 toggle setter 的布林狀態
- [`usePrevious`](https://reactuse.com/state/useprevious/) — 讀取上一次的狀態值，用於表單中的變更偵測

---

ReactUse 提供 100+ 個 React Hook。[全部探索 →](https://reactuse.com)
