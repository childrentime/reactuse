---
title: "React useScrollLock Hook：為彈窗鎖住頁面滾動 (2026)"
description: "useScrollLock 實用指南：為什麼給 body 加 `overflow: hidden` 攔不住 iOS Safari 的橡皮筋滾動，hook 的 touchmove 守衛如何在鎖住頁面的同時讓彈窗內部繼續滾動，useScrollLock vs position:fixed vs body:has(dialog[open]) 三種方案對比，如何鎖住滾動容器而不是文件，以及真正會踩的坑——卸載時誰來釋放鎖、兩個持有者爭搶同一元素、initialState 跳過 iOS 守衛、捲軸消失導致的佈局抖動。TypeScript 優先，SSR 安全。"
slug: react-usescrolllock-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-19
tags: [react, hooks, browser, typescript, tutorial]
keywords: [react usescrolllock, usescrolllock, useScrollLock hook, react 鎖定 body 滾動, react 彈窗禁止背景滾動, react 停用背景滾動, body scroll lock react, react 彈窗滾動鎖定, ios safari 滾動鎖定 react, body overflow hidden react, react 防止彈窗背後滾動, overscroll-behavior contain react, react 抽屜滾動鎖定, scrollbar-gutter stable, react 滾動鎖定 hook]
image: /img/og.png
---

# React useScrollLock Hook：為彈窗鎖住頁面滾動 (2026)

彈窗打開了，居中、漂亮、無可挑剔。然後有人在遮罩上一劃，背後的整頁內容就從彈窗底下滾走了。所有人第一次的修法都是同樣三行：

```tsx
useEffect(() => {
  document.body.style.overflow = open ? "hidden" : "";
}, [open]);
```

在你自己的筆記本上完全正常。然後 bug 報告來了：

1. **iPhone 上頁面照樣能動。** 即使 `<body>` 上有 `overflow: hidden`，iOS Safari 的觸控拖動依然會橡皮筋滾動整個文件。
2. **順手抹掉了別的東西。** `""` 不一定是原本的值——你剛剛擦掉了設計系統或 CSS-in-JS 寫在行內的那個 `overflow`。
3. **兩個浮層，一個凍住的頁面。** 抽屜和圖片燈箱都在改 `body.style.overflow`；關閉順序一顛倒，頁面就再也滾不動了。
4. **桌面端捲軸一消失，整頁佈局就抖一下。**

來自 [`@reactuses/core`](https://reactuse.com) 的 [`useScrollLock`](https://reactuse.com/browser/usescrolllock/) 就是這三行，但把難的部分都處理掉了：它會還原自己替換掉的那個行內 `overflow`，在 iOS 上加一層 `touchmove` 守衛、同時仍然讓彈窗自己的內容能滾，把鎖定狀態作為 React state 暴露出來供你渲染，並且可以作用在任意元素上——不只是 `<body>`。本文逐行講清它到底做了什麼、為什麼在 iOS 上 `overflow: hidden` 不夠、它和 `position: fixed`、`body:has(dialog[open])` 兩種方案怎麼比，以及真實專案裡會踩的六個坑。

<!-- truncate -->

## 快速開始

```bash
npm install @reactuses/core
```

```tsx
import { useScrollLock } from "@reactuses/core";
import { useEffect } from "react";

function Modal({ open, onClose, children }: ModalProps) {
  // 傳 getter，不要直接傳 document.body —— 見下面的 SSR 那條坑
  const [, setLocked] = useScrollLock(() => document.body);

  useEffect(() => {
    setLocked(open);
    return () => setLocked(false); // 即使在開啟狀態下卸載也會釋放
  }, [open, setLocked]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
```

簽名：

```ts
const [locked, setLocked] = useScrollLock(target, initialState?)
```

- **`target`** —— 要鎖住滾動的那個元素。接受元素本身、`RefObject`，或者 getter `() => element`。每次呼叫都是惰性解析的。
- **`initialState`** —— 初始就鎖住。預設 `false`，而且你應該保持預設（見坑 3）。
- **返回** `[locked, setLocked]`。`locked` 是真正的 state；`setLocked` 引用穩定，放依賴陣列或當 prop 傳都安全。

## useScrollLock 到底做了什麼

從原始碼濃縮出來的核心：

```tsx
const [locked, setLocked] = useState(initialState);
const initialOverflowRef = useRef<CSSStyleDeclaration["overflow"]>("scroll");
const lockedElementRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  const element = getTargetElement(target);
  if (!element) return;
  if (!locked) {
    lockedElementRef.current = null;
    return;
  }
  if (lockedElementRef.current !== element) {
    initialOverflowRef.current = element.style.overflow; // 記住我們要替換掉的值——每次上鎖只記一次
    lockedElementRef.current = element;
  }
  element.style.overflow = "hidden";
}, [locked, target]);

const lock = useEvent(() => {
  const element = getTargetElement(target);
  if (!element || locked) return;
  if (isIOS) element.addEventListener("touchmove", preventDefault, { passive: false });
  setLocked(true);
});

const unlock = useEvent(() => {
  const element = getTargetElement(target);
  if (!element || !locked) return;
  if (isIOS) element.removeEventListener("touchmove", preventDefault);
  element.style.overflow = initialOverflowRef.current; // 還原，而不是覆蓋成空
  setLocked(false);
});
```

裡面有五個決策值得點名，因為手寫版本恰恰就是在這幾處不一樣：

- **鎖定是 state，不是「發出去就不管」的副作用。** `locked` 是真正的 `useState` 值，所以驅動樣式的那個布林值同時也能驅動你的 `aria-hidden`、className、Esc 處理邏輯。
- **它還原自己替換掉的行內值**，而不是 `""`。如果原本行內是 `overflow: overlay`，還原回來的就是它。
- **target 是惰性解析的**，走 `getTargetElement`，沒有 `window` 時返回 `undefined`。服務端不會碰 DOM。
- **快照掛鉤的是元素，不是 effect 的執行。** `target` 在依賴列表裡，而 `() => document.body` 每次渲染都是新函式，所以這個 effect 會反覆重跑；如果每次都重新讀一遍原始 `overflow`，讀到的就是 hook 自己剛寫進去的 `hidden`。（這曾是一個真實的 bug，已在 6.5.4 修復。）
- **只有 iOS 會加 `touchmove` 守衛。** 而這正是真正有意思的部分。

## 為什麼在 iOS 上 `overflow: hidden` 不夠

給滾動元素加 `overflow: hidden` 是規範認可的、正確的停止滾動方式——但 iOS Safari 從來沒有在 `<body>` 上完全遵守它，觸控拖動依然能橡皮筋滾動文件。唯一可靠的辦法是取消手勢本身：

```tsx
element.addEventListener("touchmove", preventDefault, { passive: false });
```

這裡的 `passive: false` 是必需的，不是裝飾。瀏覽器預設把文件級目標上的 touch 監聽註冊為 passive，而 passive 監聽裡的 `preventDefault()` 會被忽略並在控制台給一條警告——你的鎖會靜默失效。

但在 `touchmove` 上無腦 `preventDefault` 會毀掉你真正想要的東西：彈窗**內部**的滾動。所以處理函式在取消之前先問一個問題：

```tsx
function checkOverflowScroll(ele: Element): boolean {
  const style = window.getComputedStyle(ele);
  if (
    style.overflowX === "scroll" || style.overflowY === "scroll"
    || (style.overflowX === "auto" && ele.clientWidth < ele.scrollWidth)
    || (style.overflowY === "auto" && ele.clientHeight < ele.scrollHeight)
  ) return true;

  const parent = ele.parentNode as Element;
  if (!parent || parent.tagName === "BODY") return false;
  return checkOverflowScroll(parent);
}
```

從 `event.target` 往上走，只要有任一祖先是真的可滾動的——`overflow: scroll`，或者 `overflow: auto` **且此刻內容真的溢位**——就放這個手勢過去，一點都不攔。由此自然帶來兩個很舒服的性質：

- 一個 `overflow: auto` 容器如果當前內容裝得下，它就不是可滾動的，於是會被鎖住——這是對的。內容變多了它自己就又能滾了，不需要改程式碼。
- 多指觸控被排除在外（`if (e.touches.length > 1) return true`，在任何 `preventDefault` 之前），所以雙指縮放照樣能用。在彈窗裡禁掉縮放是無障礙上的退步，這裡繞開了它。

## useScrollLock 與另外四種方案對比

| 方案 | 攔住 iOS 橡皮筋 | 保留內部滾動 | 保留滾動位置 | 代價 |
| --- | --- | --- | --- | --- |
| 手寫 `body.style.overflow = "hidden"` | ❌ | ✅ | ✅ | 覆蓋行內樣式，且從不還原 |
| `body:has(dialog[open]) { overflow: hidden }` | ❌ | ✅ | ✅ | 零 JS —— 但 iOS 的洞一模一樣 |
| `body { position: fixed; top: -scrollY }` | ✅ | ✅ | 只有你自己儲存並還原才行 | 把 `<body>` 拽出正常流：`position: fixed` 的子元素重新定位，滾動錨定和 `scroll-behavior: smooth` 都會變怪 |
| dialog **和** `::backdrop` 上寫 `overscroll-behavior: contain` | ✅（Chrome 144+） | ✅ | ✅ | 支援的地方最乾淨 —— 但只適用於 `<dialog>` |
| `useScrollLock` | ✅ | ✅ | ✅ | 一次 hook 呼叫背後約 40 行 JS |

有一點很容易讓人誤會：`<dialog>.showModal()` 會把文件其餘部分變成 **inert**——點選和 Tab 都進不去——但它**不能**可靠地阻止滾動，在移動端觸控下尤其如此。惰性（inert）和滾動鎖定是兩個不同的問題，瀏覽器只幫你解決了第一個。

還有一個是互補而非替代：給你**內部**滾動容器加 `overscroll-behavior: contain` 能阻止滾動**鏈式傳遞**——內層列表滾到底之後把手勢交給頁面。不管你用哪種鎖法，這個都值得加上；但它單獨並不能攔住從遮罩上開始的那一劃。

## 實戰模式

### 1. 宣告鎖定，而不是手動開關

快速開始裡的寫法就是值得記住的模式。不要在開啟的 handler 裡寫 `setLocked(true)`、在關閉的 handler 裡寫 `setLocked(false)`——那是兩個會忘的地方，中間還有各種提前 return 的分支——而是把鎖綁到本來就描述彈窗的那個 state 上：

```tsx
useEffect(() => {
  setLocked(open);
  return () => setLocked(false);
}, [open, setLocked]);
```

這樣鎖定就不可能和 UI 脫節，而 cleanup 還覆蓋了命令式寫法總會漏掉的那個 case：彈窗還開著的時候路由跳走、元件被卸載。

配合 [`useDisclosure`](https://reactuse.com/state/usedisclosure/) 來管開關狀態本身：

```tsx
import { useDisclosure, useScrollLock } from "@reactuses/core";
import { useEffect } from "react";

function Drawer({ children }: { children: React.ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [locked, setLocked] = useScrollLock(() => document.body);

  useEffect(() => {
    setLocked(isOpen);
    return () => setLocked(false);
  }, [isOpen, setLocked]);

  return (
    <>
      <button onClick={onOpen}>選單</button>
      <main aria-hidden={locked}>{/* 頁面內容 */}</main>
      {isOpen && (
        <aside className="drawer">
          {children}
          <button onClick={onClose}>關閉</button>
        </aside>
      )}
    </>
  );
}
```

注意元組裡 `locked` 這一半是怎麼發揮作用的：一個布林值同時驅動樣式和無障礙狀態，所以它們不可能對不上。（在 React 19 上同一個值還能直接給 `inert`。）

### 2. 鎖住滾動容器，而不是文件

很多應用根本不滾動文件——外殼是 `height: 100vh; overflow: auto`，一切都在一個 div 裡滾。這種情況下給 `<body>` 加 `overflow: hidden` 完全沒有作用，不知道這點的話能耗掉你一下午。把 hook 指向真正的滾動容器：

```tsx
function Shell({ children }: { children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [, setLocked] = useScrollLock(scroller);

  return (
    <div ref={scroller} style={{ height: "100vh", overflow: "auto" }}>
      {children}
    </div>
  );
}
```

同一個 hook，同一個元組。這也是為什麼 `target` 是必填而不是預設 `document.body`：庫無法知道哪個元素才是你的滾動根。

### 3. 拖拽期間鎖定

觸控拖動滑塊、可排序列表或自定義輪播時，頁面會跟著滾，除非有東西攔住它——而 `touchmove` 守衛恰好就是對的工具：

```tsx
const [, setLocked] = useScrollLock(() => document.body);

<div
  onPointerDown={() => setLocked(true)}
  onPointerUp={() => setLocked(false)}
  onPointerCancel={() => setLocked(false)}
/>
```

`onPointerCancel` 很關鍵：瀏覽器可能在手勢中途搶走指標，沒有它你就會把頁面鎖死。如果你是在自己實現拖拽而不只是接一個現成的，[`useDraggable`](https://reactuse.com/element/usedraggable/) 已經把指標那套賬都記好了。

## 值得知道的坑

### 1. 鎖定是一個樣式，不是一段生命週期

鎖是寫在一個 hook 並不擁有的元素上的行內 `overflow: hidden`，總得有人把它放回去。從 `@reactuses/core` v6.5.3 起，持有鎖的元件卸載時 hook 會自己做這件事：還原它替換掉的那個行內值，並摘掉 iOS 的 `touchmove` 守衛——所以「彈窗還開著就跳路由」不會再把頁面凍住。v6.5.2 及更早版本不會還原，如果你鎖在舊版本上就得留意：在 iOS 上殘留的那個 `passive: false` 監聽會把整個工作階段剩下的觸控捲動全部幹掉，不只是樣式的問題。

不過卸載只是一半。另一半——元件還掛著、只是彈窗關了——無論哪個版本都得你自己管，這也正是上面那個模式把 `setLocked` 綁到 `open` 上並帶 cleanup、而不是在兩個 handler 裡分別開關的原因：

```tsx
useEffect(() => {
  setLocked(open);
  return () => setLocked(false);
}, [open, setLocked]);
```

把 setter 當成你借來的一個樣式。每一次借都要還。

### 2. 一個元素只能有一個持有者

兩個 hook 例項鎖同一個元素是最微妙的失效方式，因為每個例項都記著**自己那份**原始 `overflow`：

```text
A.lock()    → overflow: hidden    （A 記住的是 "auto"）
B.lock()    → overflow: hidden    （B 記住的是 "hidden" 😬）
A.unlock()  → overflow: auto      （頁面能滾了，儘管 B 還認為自己鎖著）
B.unlock()  → overflow: hidden    （現在頁面卡死了，而且什麼都沒開啟）
```

這裡沒有什麼能救你——這是「儲存舊值、再放回去」這個思路本身固有的問題，所有手寫方案和大多數庫都一樣。答案在架構層面：**每個元素只有一個鎖的持有者。** 把 `useScrollLock(() => document.body)` 放在佈局、Provider 或者 store 裡，讓各個彈窗去請求它加鎖，而不是各自帶一個。

### 3. `initialState: true` 會跳過 iOS 守衛

`useScrollLock(target, true)` 會從第一次提交起就加上 `overflow: hidden`——但 `touchmove` 監聽只在 `lock()` 裡掛，而 `lock()` 從沒跑過。所以一個初始就鎖定的頁面在 iOS 上依然能橡皮筋滾。從 `false` 開始，然後翻過去：

```tsx
const [, setLocked] = useScrollLock(() => document.body);
useEffect(() => { setLocked(true); }, [setLocked]); // 掛載即鎖定，守衛也帶上了
```

### 4. 桌面端佈局抖動

捲軸一藏，就騰出約 15px，整頁橫向抖一下。這不是 hook 該管的事，一行 CSS 就夠：

```css
html { scrollbar-gutter: stable; }
```

### 5. SSR 下要傳 getter，不要傳 `document.body`

`useScrollLock(document.body)` 會在**渲染期間**求值 `document.body`，在服務端還沒輪到 hook 小心行事就已經拋錯了。`() => document.body`（或一個 ref）只在 effect 和 handler 裡被讀到，而那裡 `getTargetElement` 早已在沒有 `window` 時直接返回：

```tsx
const [, setLocked] = useScrollLock(() => document.body); // ✅ SSR 安全
const [, setLocked] = useScrollLock(document.body);       // ❌ 服務端崩
```

庫裡所有接受元素 target 的 hook 都是同一條規則，這也是 Next.js / Remix 專案裡最常見的 SSR 失誤。

### 6. `hidden` 攔手勢，不攔程式化滾動

一個 `overflow: hidden` 的盒子依然可以通過 `scrollTop`、`scrollTo`、`scrollIntoView` 滾動——更關鍵的是，瀏覽器會為了把新獲得焦點的元素帶進視口而滾動它。如果焦點跑到了彈窗背後的某個連結上，你「鎖住」的頁面會滾過去。滾動鎖定和焦點陷阱是同一個功能的兩半，兩個都要做。

## 什麼時候不該用 useScrollLock

- **你只想阻止內層滾動容器把滾動傳遞給頁面** → CSS 的 `overscroll-behavior: contain`，一行 JS 都不用。
- **你在用 `<dialog>` 且可以要求 Chrome 144+** → 在 dialog 和它的 `::backdrop` 上寫 `overscroll-behavior: contain`，比任何 hook 程式碼都少。
- **你想滾動到某個東西** → [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/)，或者原生那一行——[昨天講 scrollIntoView + useRef 的那篇](https://reactuse.com/blog/react-scrollintoview-useref/)把兩種都覆蓋了。
- **你想讀取或響應滾動位置** → [`useScroll`](https://reactuse.com/browser/usescroll/) 或 [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/)。
- **你想要的是真正沉浸、無瀏覽器外框的檢視** → 用 [`useFullscreen`](https://reactuse.com/browser/usefullscreen/)，而不是鎖一個滾動容器。
- **你在隨著滾動載入更多資料** → [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/)；那裡最不需要的就是一把鎖。

## 要點回顧

- `overflow: hidden` 在桌面端是正確的機制，在 iOS Safari 上則是不完整的——只有取消 `touchmove`（並且 `passive: false`）才真的能讓文件停止橡皮筋。
- [`useScrollLock`](https://reactuse.com/browser/usescrolllock/) 把這層守衛和一個「祖先是否真的可滾動」的判斷配在一起，於是頁面動不了、而彈窗自己的內容照樣能滾——多指縮放也活著。
- 它還原自己替換掉的那個行內 `overflow`，把鎖定作為可渲染的 state 暴露出來，並且能作用在任意元素上——當你的應用滾在一個 div 而不是文件裡時，這正是你需要的。
- 把鎖綁到描述 UI 的那個 state 上（`setLocked(open)` 加一個 cleanup），**每個元素只留一個持有者**，`initialState` 保持 `false`，SSR 下傳 getter，再用 `scrollbar-gutter: stable` 處理桌面端抖動。
- 滾動鎖定只是彈窗的一半。焦點也要陷住，否則一旦浮層背後的東西拿到焦點，`hidden` 的頁面照樣會滾。

`useScrollLock`、`useDisclosure`、`useScrollIntoView` 以及另外 110+ 個 SSR 安全、TypeScript 優先的 hook 都在 [`@reactuses/core`](https://reactuse.com) 裡——一次安裝，支援 tree-shaking，沒有需要你操心的依賴。

```bash
npm install @reactuses/core
```
