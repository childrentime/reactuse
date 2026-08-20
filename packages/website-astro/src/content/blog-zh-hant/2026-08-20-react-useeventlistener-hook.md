---
title: "React useEventListener Hook：型別安全的 DOM 事件監聽 (2026)"
description: "useEventListener 實用指南：為什麼手寫的 useEffect + addEventListener 要嘛每次渲染都重新訂閱、要嘛讀到過期的 state，useEventListener 如何做到每個目標只掛載一次，四種指定目標的寫法（window、document、ref、任意 EventTarget），每種寫法下 TypeScript 到底推斷出什麼，passive 監聽與不會觸發重掛的 options，以及 ref 重新掛載和 SSR 兩個坑。TypeScript 優先，SSR 安全。"
slug: react-useeventlistener-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-20
tags: [react, hooks, dom, typescript, tutorial]
keywords: [react useeventlistener, useeventlistener, useeventlistener react, useEventListener hook, react addeventlistener hook, react useeffect addeventlistener, react 事件監聽 清理, react 監聽 keydown, react 監聽 window resize, react addeventlistener typescript, react 卸載時移除事件監聽, react passive 事件監聽, useeventlistener typescript, react document 事件監聽 hook, react esc 關閉彈窗 hook]
image: /img/og.png
---

# React useEventListener Hook：型別安全的 DOM 事件監聽 (2026)

這是一個「按 Esc 關閉彈窗」，它悄悄地做錯了事：

```tsx
function Modal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return <div role="dialog">…</div>;
}
```

如果父元件傳的是內聯的 `onClose={() => setOpen(false)}`——而它幾乎總是——那麼 `onClose` 每次渲染都是一個新函式，於是這個 effect 會在父元件*每一次渲染*時都把監聽拆掉再重新掛上。把 `onClose` 從依賴裡刪掉來止住這種抖動，你就換來了另一個 bug：監聽器從此永遠持有第一次渲染的 `onClose`，關閉彈窗呼叫的是一個過期閉包。

這一局靠依賴陣列是贏不了的，因為你想要的兩件事直接衝突：**只訂閱一次**，但**永遠執行最新的處理器**。解法是把兩者拆開——用一個穩定的身分去註冊監聽，再透過一個始終保持最新的 ref 去呼叫。[`useEventListener`](https://reactuse.com/effect/useeventlistener/)（來自 [`@reactuses/core`](https://reactuse.com)）就是把這個拆分封裝好了。這篇文章講它底層到底做了什麼、指定目標的四種寫法、每種寫法下 TypeScript 究竟推斷出什麼（這部分會讓不少人意外）、哪些 options 不會觸發重掛，以及上線前值得知道的兩個坑。

<!-- truncate -->

## 快速上手

```bash
npm install @reactuses/core
```

```tsx
import { useEventListener } from "@reactuses/core";

function Modal({ onClose }: { onClose: () => void }) {
  useEventListener("keydown", (e) => {
    if (e.key === "Escape") onClose();
  });

  return <div role="dialog">…</div>;
}
```

修復就這些。沒有依賴陣列，父元件不用 `useCallback`，也沒有需要你記著寫的清理。監聽在元件掛載時被加到 `window` 上一次，卸載時移除；你傳進去的箭頭函式每次渲染都會重新建立，但這無所謂，因為監聽器從不重新註冊——它呼叫的永遠是最新那個。`e` 是 `KeyboardEvent`，推斷出來的，不用手寫註解。

簽名是四個參數，其中三個可選：

```tsx
useEventListener(eventName, handler, target?, options?);
```

`target` 預設是 `window`。`options` 就是你平時傳給 `addEventListener` 的那個 `boolean | AddEventListenerOptions`。

## 它到底做了什麼

實作短到可以整段讀完，而且值得讀，因為每一行都在回答上面的某個問題：

```tsx
function useEventListener(eventName, handler, element, options = {}) {
  const savedHandler = useLatest(handler);
  const { key: elementKey, ref: elementRef } = useStableTarget(element, defaultWindow);

  useDeepCompareEffect(() => {
    const targetElement = getTargetElement(elementRef.current, defaultWindow);
    if (!(targetElement && targetElement.addEventListener)) return;

    const eventListener = (event) => savedHandler.current(event);
    on(targetElement, eventName, eventListener, options);

    return () => off(targetElement, eventName, eventListener);
  }, [eventName, elementKey, options]);
}
```

這裡塞進了四個決策：

**處理器放在 ref 裡，不放在依賴裡。** [`useLatest`](https://reactuse.com/state/uselatest/) 讓 `savedHandler.current` 在每次提交渲染後都指向最新的處理器，而真正註冊到 DOM 上的是一個轉發給它的薄包裝。所以你傳的處理器每次渲染都可以是全新的閉包——內聯箭頭函式不只是被允許，它就是預期的用法——而 `addEventListener` 只會被呼叫一次。這就是「訂閱一次、執行最新」的拆分，也是 `handler` 被刻意排除在依賴列表之外的原因。

**依賴列表是深比較的。** 這個 effect 是 [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 而不是 `useEffect`，所以每次渲染新建但內容相同的 `options` 物件不算變化。直接內聯寫 `useEventListener("scroll", onScroll, ref, { passive: true })` 完全沒問題：渲染三次，`addEventListener` 只呼叫一次。把內容改成 `{ passive: false }` 它才會重新註冊，這正是你想要的。

**目標是在 effect 內部、也就是 commit 階段解析的。** `getTargetElement` 在 effect 主體裡執行而不是在渲染期間，所以 ref 型態的目標此時已經被 React 填好了——渲染期間 `ref.current` 還是 `null`，只有到 commit 階段才是真實節點。這就是「監聽掛上了」和「悄無聲息什麼都沒發生」之間的差別。

**在伺服器端它是空函式。** 匯出的是 `isBrowser ? implementation : noop`，所以 SSR 期間不會碰 `window`，你也不用自己寫 `typeof window === "undefined"` 的守衛。監聽會在 hydration 之後、在 effect 裡掛上，和其他瀏覽器訂閱一樣。

## 指定目標的四種寫法

`target` 接受四種形態，選對它基本就是這個 API 的全部：

```tsx
// 1. 省略 → window
useEventListener("resize", () => setWidth(window.innerWidth));

// 2. 回傳元素的函式 → document，或任何需要延遲查找的東西
useEventListener("visibilitychange", () => setActive(!document.hidden), () => document);

// 3. 一個 ref
const boxRef = useRef<HTMLDivElement>(null);
useEventListener("wheel", (e: WheelEvent) => e.preventDefault(), boxRef, { passive: false });

// 4. 任何你手上已有的 EventTarget
useEventListener("message", (e: MessageEvent) => handle(e.data), worker);
```

第 2 種存在的理由是：伺服器端在模組求值階段拿不到 `document`；而且直接把臨時查到的元素傳進去，會帶來「每次渲染身分都變」的問題。包裝函式在 commit 階段被解析，effect 依賴的是它的*回傳結果*，所以 `() => document` 在關鍵意義上是穩定的。

第 4 種是大家最容易忘的：`EventTarget` 不只是 DOM 元素。`Worker`、`WebSocket`、`EventSource`、`MediaQueryList`、`window.visualViewport`、`BroadcastChannel`、一個 `<audio>` 元素、`navigator.serviceWorker`，甚至 `AbortSignal`——全都是事件目標，全都能用這個 hook，並且自動清理。（常見的那幾個，函式庫裡已經有專門的 hook：[`useEventSource`](https://reactuse.com/browser/useeventsource/)、[`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/)、[`useMediaQuery`](https://reactuse.com/browser/usemediaquery/)、[`useNetwork`](https://reactuse.com/browser/usenetwork/)。）

## TypeScript 到底推斷出什麼

這部分值得說精確，因為這個 hook 帶了六個多載，而它們給你的東西並不一樣。以下結論是對著當前型別定義驗證過的：

| 目標寫法 | `e` 被推斷為 |
| --- | --- |
| 省略（`window`） | 精確的 `WindowEventMap` 型別——`"keydown"` → `KeyboardEvent` ✅ |
| 裸 `HTMLElement` / `Element` / `Document` | 精確的事件型別——`"click"` → `MouseEvent` ✅ |
| **ref 物件** | `any` ⚠️ |
| **函式**目標（`() => document`） | `any` ⚠️ |

後兩種會落到通用多載上，那個多載把處理器標成 `(...p: any) => void`。不會報錯——但你恰好在 ref 最常用的地方丟掉了自動補全和型別檢查。修法是加一個註解，沒有任何代價：

```tsx
// ⚠️ e 是 any
useEventListener("click", (e) => console.log(e.clientX), buttonRef);

// ✅ e 是 MouseEvent，有型別檢查
useEventListener("click", (e: MouseEvent) => console.log(e.clientX), buttonRef);
```

同一片區域還有兩個相關的銳利邊緣。第一，`e` 是**原生** DOM 事件，不是 React 的 `SyntheticEvent`——`e.target` 沒有型別，`e.currentTarget` 是 `EventTarget | null`，也不存在事件池的問題。第二，只有當目標命中那幾個有型別的多載時，事件*名稱*才受約束；用 ref 或函式目標時名稱就是普通 `string`，所以像 `"keydwon"` 這樣的拼字錯誤能順利編譯，然後掛上一個永遠不會觸發的監聽。如果某個監聽看起來是死的，先查拼字，再查別的。

## 幾種模式

### 鍵盤快捷鍵

`window` 監聽的典型場景。一個快捷鍵一個 hook，或者一個處理器裡 switch，都行——因為它們都不會重新註冊：

```tsx
function useShortcut(combo: (e: KeyboardEvent) => boolean, run: () => void) {
  useEventListener("keydown", (e) => {
    if (combo(e)) {
      e.preventDefault();
      run();
    }
  });
}

function CommandBar() {
  const [open, setOpen] = useState(false);
  useShortcut((e) => (e.metaKey || e.ctrlKey) && e.key === "k", () => setOpen(true));
  useShortcut((e) => e.key === "Escape", () => setOpen(false));
  // …
}
```

注意這裡的組合方式：`useEventListener` 很適合作為你*自己*的 hook 的基礎原語；而且因為處理器是用 ref 持有的，`run` 和 `combo` 可以是閉包在最新 state 上的內聯函式，不需要任何 memo 化的儀式。如果你只需要修飾鍵本身，[`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/) 已經在追蹤它們了。

### 非 passive 的 wheel 與 touch 監聽

這是 JSX 屬性真的做不到的場景。React 把 `onWheel`、`onTouchStart` 作為 passive 監聽掛在根節點上，所以在裡面呼叫 `e.preventDefault()` 會印出一條 console 警告，然後什麼也不做。要真正擋住捲動或縮放，你需要在元素上註冊一個 `{ passive: false }` 的真實監聽：

```tsx
function ZoomCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEventListener(
    "wheel",
    (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault(); // 有效——這個監聽是真正的非 passive
      setZoom((z) => clamp(z * (1 - e.deltaY / 500), 0.5, 4));
    },
    canvasRef,
    { passive: false },
  );

  return <div ref={canvasRef} style={{ transform: `scale(${zoom})` }} />;
}
```

反過來同樣有用：給高頻的 `scroll` 或 `touchmove` 監聽標上 `{ passive: true }`，讓瀏覽器知道它捲動前不必等你的處理器。

### React 沒有提供 props 的 window / document 事件

`resize`、`online`/`offline`、`visibilitychange`、`beforeunload`、`hashchange`、`storage`、document 層級的 `paste`——這些都沒有 JSX 對應物，而且每個都只要一行：

```tsx
function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEventListener("online", () => setOnline(true));
  useEventListener("offline", () => setOnline(false));
  return online;
}
```

在動手寫之前，先看看函式庫裡是不是已經有了——[`useWindowSize`](https://reactuse.com/element/usewindowsize/)、[`useOnline`](https://reactuse.com/browser/useonline/)、[`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/)、[`usePageLeave`](https://reactuse.com/browser/usepageleave/)、[`useTextSelection`](https://reactuse.com/state/usetextselection/) 全都是這個 hook 的薄封裝，只是狀態管理已經替你做好了。

### 給高頻事件限流

`scroll`、`mousemove`、`resize`、`pointermove` 的觸發頻率遠高於你想重新渲染的頻率。要包的是處理器，不是監聽：

```tsx
function ScrollSpy() {
  const [y, setY] = useState(0);
  const onScroll = useThrottleFn(() => setY(window.scrollY), 100);
  useEventListener("scroll", onScroll);
  return <progress value={y} max={document.body.scrollHeight} />;
}
```

「最多每 N 毫秒一次」用 [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/)，「等使用者停下來再執行」用 [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)。兩者身分都穩定，所以監聽依然只註冊一次。如果你要的就是捲動位置，[`useScroll`](https://reactuse.com/browser/usescroll/) 和 [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/) 已經把這件事做對了。

## 值得知道的坑

- **ref 目標依賴的是 ref 本身，不是 `ref.current`。** effect 的依賴項是那個 ref *物件*，它在元件生命週期內是穩定的。所以當 ref 背後的 DOM 節點被換掉時——某個條件分支掛載了一個真正不同的元素、`key` 變了、清單重排——監聽會留在那個已經脫離文件的舊節點上，不會跟過去。元素型態和位置匹配時 React 通常會重用同一個 DOM 節點，所以這個坑很少踩到，但一旦踩到就很難想明白。修法是把*節點*本身變成依賴：用 callback ref 把它存進 state。

  ```tsx
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEventListener("click", (e: MouseEvent) => handle(e), node);
  return show ? <button ref={setNode}>A</button> : <span ref={setNode}>B</span>;
  ```

  這樣節點變化時目標身分也跟著變，監聽就會重新註冊到新元素上。

- **監聽是在繪製之後掛上的，不是在渲染期間。** 它是個 effect，所以從首次繪製到 effect 執行之間有一個窗口——通常是一幀——監聽還不存在。對使用者驅動的事件無所謂（沒人按鍵有那麼快），但這意味著你沒法用它去捕捉掛載期間就觸發的事件。如果某個元素從第一幀起就必須帶上監聽，那是 layout effect 和 JSX 屬性該管的事。

- **直接傳 `document` 或元素沒問題——除非它是條件性的。** `useEventListener("click", h, someState ? elA : elB)` 會在元素變化時重新註冊，這是對的。但 `useEventListener("click", h, document.getElementById("x"))` 會在每次渲染時做一次 DOM 查詢，並且在伺服器端回傳 `null`；這種情況用函式形式 `() => document.getElementById("x")`。

- **它不回傳 `off()` 控制代碼。** 和 VueUse 的版本不同，這裡沒有手動停止函式——生命週期就是元件的生命週期。如果你需要按需啟停監聽，在處理器內部用一個 ref 或一段 state 來做閘門（`if (!enabledRef.current) return`），這比反覆重新註冊還便宜。

- **一個 hook 只管一個事件。** 沒有陣列形式。寫成 `useEventListener("mousedown", h)` 和 `useEventListener("touchstart", h)` 兩次呼叫就是慣用法——hook 很便宜，而且這讓依賴比較保持簡單。

- **它天生 SSR 安全，所以別再加守衛。** 不需要 `typeof window` 判斷，不需要包一層 `useEffect`，不需要動態 import。在伺服器端它什麼都不做。

## 什麼時候別用它

`useEventListener` 是個原語。如果已經有為某件事專門寫的 hook，它會替你處理狀態、邊界情況和清理，而這些你自己重寫一遍多半會漏：

- **判斷點擊落在元素外部** → [`useClickOutside`](https://reactuse.com/element/useclickoutside/) 或 [`useClickAway`](https://reactuse.com/element/useclickaway/)（它們處理了「mousedown 在內部、mouseup 在外部」這種你自己寫容易搞錯的情況）。
- **懸停、長按、雙擊、拖曳** → [`useHover`](https://reactuse.com/state/usehover/)、[`useLongPress`](https://reactuse.com/browser/uselongpress/)、[`useDoubleClick`](https://reactuse.com/element/usedoubleclick/)、[`useDraggable`](https://reactuse.com/element/usedraggable/)。
- **元素尺寸或可見性** → [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/)、[`useElementSize`](https://reactuse.com/element/useelementsize/)、[`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/)。這些是觀察器，不是事件；掛在 `window` 上的 `resize` 監聽沒法告訴你某個元素的尺寸變了。
- **事件本身有 JSX 屬性，而且目標就是你自己的元素** → 直接用 `onClick`。React 的委派處理器更便宜，也更就近。只有當你需要 `window`/`document`、需要非 passive 監聽、或者 React 沒暴露這個事件時，才動用真實監聽。
- **你其實只是想要一個穩定的函式身分** → 那是 [`useEvent`](https://reactuse.com/effect/useevent/)，跟監聽沒關係。

## 要點回顧

- `useEffect` + `addEventListener` 這對組合逼你做一個假選擇：把處理器放進依賴、每次渲染都重新訂閱，或者不放進去、然後呼叫過期閉包。
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) 的解法是註冊一個穩定的包裝函式，再轉發給一個 [`useLatest`](https://reactuse.com/state/uselatest/) ref，於是內聯箭頭處理器是免費的，`addEventListener` 每個目標只呼叫一次。
- options 是深比較的，所以內聯的 `{ passive: true }` 不會觸發重掛；目標在 commit 階段解析，所以 ref 能正常運作；整個 hook 在 SSR 期間是空操作。
- `window` 和裸元素目標下 TypeScript 能推斷出精確的事件型別，ref 和函式目標會退化成 `any`——那兩種情況給處理器參數加個註解，並且當心事件名拼字錯誤，那些多載不會幫你抓。
- 把它當作建構你自己 hook 的原語。如果你要監聽的東西已經有專門的 hook，就用那個。

`useEventListener`、`useLatest`、`useClickOutside`，以及另外 110+ 個 SSR 安全、TypeScript 優先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 裡——裝一次，可 tree-shake，沒有需要照看的依賴。

```bash
npm install @reactuses/core
```
