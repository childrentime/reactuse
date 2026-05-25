---
title: "React 指標 Hook:Hover、長按、雙擊、刮擦和點選外部,告別那些經典 bug"
description: "指標事件是一片沼澤——滑鼠對觸控、單擊對雙擊、子元素讓 hover 閃爍、長按觸發 iOS 幽靈點選、portal 讓點選外部失效。本文梳理 ReactUse 中六個用於指標與手勢處理的 hook:useHover、useMousePressed、useLongPress、useDoubleClick、useClickOutside、useScratch,以及它們各自消除的 bug。"
slug: react-pointer-gesture-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-25
tags: [react, hooks, ui, tutorial]
keywords: [react hover hook, react useHover, react 長按 hook, react useLongPress, react 雙擊 hook, react useDoubleClick, react 點選外部, react useClickOutside, react useClickAway, react 滑鼠按下, react useMousePressed, react 拖拽手勢, react useScratch, react 觸控事件, react ios 幽靈點選, react 手勢 hook]
image: /img/og.png
---

# React 指標 Hook:Hover、長按、雙擊、刮擦和點選外部,告別那些經典 bug

指標事件是 React 中最少被認真討論的部分,因為大家預設它"早就被解決了"。它沒有。標準答案——`onMouseEnter`、`onClick`、給雙擊加一個 `setTimeout`、用 window 監聽器實現點選外部——在 demo 裡都能跑,到了生產環境就全壞。游標越過子元素時它會閃爍。觸控結束 300ms 後它會觸發一個 iOS 幽靈點選。它看不到 portal 渲染出去的元素。它把一次雙擊當成兩次單擊,因為第二次點選的處理器在第一次還沒被取消之前就先跑了。

<!-- truncate -->

DOM 事件模型就這樣。瀏覽器在移動端和桌面端用了不同的手勢管線,`dblclick` 規範比 React 還老,而 `composedPath()` 是穿過 shadow 邊界與 portal 唯一可靠的方法。這些都不會變。能變的是:你的應用裡每個元件是不是都要從頭重寫一遍這些 workaround。

[ReactUse](https://reactuse.com) 提供六個小而專的指標 hook,正好補上這些缺口。本文逐個拆解:樸素版本里的 bug、hook 是怎麼改的、以及一個你真的會寫出來的元件示例。如果你看過[關於 ref 逃生艙的那篇](/blog/react-ref-escape-hatch/),有個細節會眼熟——這些 hook 內部大多用了 [`useLatest`](https://reactuse.com/state/uselatest/),讓監聽器在回撥身份變動時依然穩定。

## 為什麼指標事件是沼澤

舉個兩行例子。一個點選外部就關閉的下拉選單:

```tsx
function Dropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return <div ref={ref}>{open && <Menu />}</div>;
}
```

四個問題。第一,沒有 `touchstart` 監聽,移動端關不掉。第二,`contains` 不跨 portal——如果 `<Menu />` 渲染到了 `document.body`,點選單項反而會把選單關掉。第三,handler 用的是 `Element.contains` 而不是 `composedPath()`,所以 shadow root 裡的任何東西都被當作"外部"。第四,handler 閉包了初次的 `setOpen`;父元件傳新的 `onClose` 進來,監聽器還是在調老的那個,因為 effect 只在掛載時綁定了一次。

每個問題都是一行就能修。每個一行的修復加起來,就是 hook 為什麼寫出來是 25 行而不是 5 行。這就是整個論點。

## 1. useHover —— 不會閃爍的懸停狀態

[`useHover`](https://reactuse.com/state/usehover/) 返回一個布林值,代表游標當前是否在目標元素內。簽名就是你自己會寫的樣子:

```tsx
import { useRef } from 'react';
import { useHover } from '@reactuses/core';

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const hovered = useHover(ref);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      {hovered && <div className="tooltip">{label}</div>}
    </div>
  );
}
```

兩個細節。hook 監聽的是 `mouseenter` 和 `mouseleave`,不是 `mouseover` 和 `mouseout`。`mouseover` 會冒泡,游標跨進任何子元素都會再觸發一次,結果你大部分時間都在 `true` 和 `false` 之間閃。`mouseenter` 不冒泡——游標進入外層元素時觸發一次,離開時觸發一次,不管底下嵌了幾層子節點。這也是 CSS `:hover` 在巢狀元素上不會閃的原因:瀏覽器其實造好了正確的原語,只是把它藏在一個不那麼顯眼的事件名後面。

另一個細節:`useHover` 接收的是 target ref,而不是 callback ref。hook 通過 ReactUse 的 [`BasicTarget`](https://reactuse.com/state/uselatest/) 輔助型別解析目標,所以你可以傳 ref、DOM 節點,或者返回這兩者之一的函式——當目標元素來自另一個 hook(比如 [`useDraggable`](https://reactuse.com/element/usedraggable/))時很有用。

## 2. useMousePressed —— 按下狀態,還告訴你按的來源

`hovered` 告訴你指標是不是在元素上方。[`useMousePressed`](https://reactuse.com/browser/usemousepressed/) 告訴你指標有沒有*按在*元素上——並把滑鼠、觸控、拖拽區分成不同的來源,讓你可以對每種做不同的反應。

```tsx
import { useRef } from 'react';
import { useMousePressed } from '@reactuses/core';

function PressyButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pressed, source] = useMousePressed(ref, { touch: true, drag: false });

  return (
    <button
      ref={ref}
      className={pressed ? 'pressed' : ''}
      data-source={source} // 'mouse' | 'touch' | null
    >
      {children}
    </button>
  );
}
```

返回元組裡有兩個值:布林值,以及一個 `sourceType`,值為 `'mouse' | 'touch' | null`。來源比看上去重要得多。觸控按壓不應該走 hover 風格的過渡動畫,因為使用者的手指正好擋住了元素。拖拽開始時的按壓不應該觸發按鈕的 onClick——你可以用 source 決定要不要忽略這次釋放。hook 自己處理監聽器清理,包括容易忘掉的 `dragend` 與 `touchcancel`;如果你曾上線過一個"使用者拖出去之後還卡在按下態"的按鈕,這就是這個 hook 關掉的 bug。

監聽目標的選擇也有講究。`mousedown` 綁在元素上,但 `mouseup` 和 `mouseleave` 綁在 *window* 上。這是故意的:如果使用者按在按鈕上、卻在外面鬆開,你也要能看到這次釋放。把 `mouseup` 綁在元素自己上就會錯過這種情況——按鈕會一直保持"按下"態,直到使用者回來再點一次。

## 3. useLongPress —— 長按不帶 iOS 幽靈點選

長按就是按住一段可配置的時間後再觸發。樸素寫法是 `mousedown` 起一個 `setTimeout`,`mouseup` 時清掉:

```tsx
function LongPressable({ onLongPress }: { onLongPress: () => void }) {
  const timer = useRef<number>();
  return (
    <div
      onMouseDown={() => { timer.current = window.setTimeout(onLongPress, 500); }}
      onMouseUp={() => clearTimeout(timer.current)}
    />
  );
}
```

桌面沒問題。在 iOS Safari 上,使用者從長按上抬起手指後,系統會在 300ms 後再觸發一個合成的 `click` 事件——"幽靈點選"——它會觸發使用者手指落到的下一個元素上的某個無關 handler。修復辦法是給被按住的元素掛一個一次性的 `touchend` 監聽器並 `preventDefault`,而 [`useLongPress`](https://reactuse.com/browser/uselongpress/) 已經替你做完了這些簿記:

```tsx
import { useLongPress } from '@reactuses/core';

function MessageBubble({ message }: { message: Message }) {
  const [showActions, setShowActions] = useState(false);

  const longPress = useLongPress(
    () => setShowActions(true),
    { delay: 500, isPreventDefault: true },
  );

  return (
    <div className="bubble" {...longPress}>
      {message.text}
      {showActions && <ActionSheet onClose={() => setShowActions(false)} />}
    </div>
  );
}
```

hook 返回一組事件處理器物件——`onMouseDown`、`onMouseUp`、`onMouseLeave`、`onTouchStart`、`onTouchEnd`——你把它展開到元素上,監聽器佈線就走在 React 的合成事件系統裡,而不是裸 `addEventListener`。這點很重要:合成事件能和 React 的狀態更新正確批處理;長按開啟一個彈窗,不會像手寫 `addEventListener` 那樣多出兩次渲染。

`isPreventDefault` 預設 `true`,除了滾動場景外幾乎都該開著。需要關掉它的一種典型場景是:長按的目標同時可能是使用者想滾動經過的東西,比如長按某個列表項開啟上下文選單,但垂直滑動應該繼續滾動列表。

## 4. useDoubleClick —— 單擊 vs 雙擊,不競態

瀏覽器有 `dblclick` 事件,但它是*在兩次 click 之外*再觸發一次,不是替代。如果你同時掛 `onClick` 與 `onDoubleClick`,每次雙擊都會順帶觸發兩次單擊 handler。標準修法是開一個去抖視窗——數 click 數,等過了間隔,再按數量分發是單擊還是雙擊:

```tsx
import { useRef } from 'react';
import { useDoubleClick } from '@reactuses/core';

function FileRow({ file }: { file: File }) {
  const ref = useRef<HTMLDivElement>(null);

  useDoubleClick({
    target: ref,
    latency: 250,
    onSingleClick: () => selectFile(file),
    onDoubleClick: () => openFile(file),
  });

  return <div ref={ref} className="row">{file.name}</div>;
}
```

[`useDoubleClick`](https://reactuse.com/element/usedoubleclick/) 接收一個 target、兩個回撥和一個 `latency`。點一下,等 `latency` 毫秒;期間沒別的就是單擊。`latency` 內點兩下,就是雙擊,單擊回撥不會再觸發。預設 300ms 和大多數桌面檔案管理器對齊;UI 要更利索可以壓到 200ms,面向年長使用者或觸控優先的介面可以拉到 500ms。

hook 也會對 `touchend` 呼叫 `preventDefault`,把 iOS 的"雙擊縮放"行為提前攔下來,否則使用者雙擊一條列表項的時候,頁面會被縮放。這種預設行為你不會注意到,直到它缺席,然後內測同學開始報 bug。

## 5. useClickOutside —— 點選外部就關閉,穿透 portal

[`useClickOutside`](https://reactuse.com/element/useclickoutside/)(也以 [`useClickAway`](https://reactuse.com/element/useclickaway/) 的別名匯出,相容舊 API 命名)就是"使用者點到別處就關掉"的那個 hook。樸素的 `contains` 在 portal 和 shadow DOM 上會失效;hook 用的是 `composedPath()`,它會走完事件經過的完整路徑,包括穿過 shadow 邊界和 portal 回到它的邏輯父節點。

```tsx
import { useRef, useState } from 'react';
import { useClickOutside } from '@reactuses/core';

function Popover({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="popover-root">
      <button onClick={() => setOpen((o) => !o)}>{trigger}</button>
      {open && <div className="popover-content">{children}</div>}
    </div>
  );
}
```

hook 同時監聽 `mousedown` 和 `touchstart`,不是 `click`。`mousedown` 在 `mouseup` 和 `click` 之前觸發,意思是按壓一發生下拉就關——比 click 事件觸發到目標元素上的任何 handler 都還早。手感是對的。如果你聽的是 `click`,目標元素上的 click handler 會先跑、然後下拉才關;要是這個 handler 還順手打開了一個 modal,你就會看到 modal 閃一下、然後下拉的關閉再湧過來。

第三個引數是 `enabled` 布林。選單隱藏時傳 `false`,完全不跑監聽器——小事,但頁面上要是有五十個下拉,你就有五十個全域性 `mousedown` 監聽器,代價會累積。

要注意的一點:hook 通過 [`useLatest`](https://reactuse.com/state/uselatest/) 閉包 `handler`,所以即便你每次渲染都傳一個新函式,監聽器也保持穩定。也就是說你可以放心寫 `useClickOutside(ref, () => setOpen(false))` 這種內聯寫法,不用擔心監聽器重綁——和 [ref 逃生艙](/blog/react-ref-escape-hatch/) 那篇詳細講過的是同一個套路。

## 6. useScratch —— 拖拽過程中元素內相對座標

[`useScratch`](https://reactuse.com/browser/usescratch/) 是任何"需要知道拖拽時指標在元素*哪裡*"的 UI 的主力——顏色選擇器、簽名板、框選、需要畫素級精確跟蹤的滑塊滑塊。hook 返回一個 `state` 物件,包含按壓起點位置、當前位置、與上一幀的增量、是否正在 scratching。

```tsx
import { useRef } from 'react';
import { useScratch } from '@reactuses/core';

function ColorPicker() {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y, isScratching } = useScratch(ref);

  const hue = x != null ? (x / 240) * 360 : 0;

  return (
    <div
      ref={ref}
      style={{
        width: 240,
        height: 24,
        background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
        position: 'relative',
        cursor: 'crosshair',
      }}
    >
      {x != null && (
        <div
          style={{
            position: 'absolute',
            left: x - 2,
            top: 0,
            width: 4,
            height: 24,
            background: isScratching ? '#000' : '#444',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
```

兩個實現細節值得知道。第一,位置更新走的是 [`useRafState`](https://reactuse.com/state/uselatest/),React 最多每幀重渲染一次——手指 120Hz 劃過元素,元件還是按 60Hz 渲染。沒有 rAF 批處理的話,一次快速拖動會按每個 `mousemove` 來一次渲染,高 DPI 觸屏上一秒就是上百次。

第二,hook 把 `mousemove` 和 `mouseup` 監聽器掛在 *document* 上,只有 `mousedown` 掛在元素上。這也是 `useMousePressed` 監聽 window 的原因——按壓一旦開始,拖拽就可能離開原來的包圍盒,你仍然要跟蹤。監聽器要是掛在元素上,使用者往外拖幾個畫素手勢就斷了。

回撥——`onScratch`、`onScratchStart`、`onScratchEnd`——通過 `useLatest` ref 讀取,所以你可以傳捕獲元件 state 的閉包而不打破 memoization。簽名板模式很典型,`onScratch` 需要用最新的 `strokeColor` 往 canvas 上畫。

## 組裝起來:一個上下文選單

一個把這些 hook 裡的四個組合在一起的小例子。長按開啟上下文選單,選單點選外部關閉,觸發器在按壓期間顯示按下態,選單項支援雙擊執行"預設動作":

```tsx
import { useRef, useState } from 'react';
import {
  useLongPress,
  useMousePressed,
  useClickOutside,
  useDoubleClick,
} from '@reactuses/core';

function ContextMenuItem({ label, onSelect }: { label: string; onSelect: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  useDoubleClick({
    target: ref,
    latency: 200,
    onSingleClick: () => {/* 與 hover 等價:不做事 */},
    onDoubleClick: onSelect,
  });
  return <li ref={ref}>{label}</li>;
}

function ContextTarget({ items }: { items: Array<{ label: string; onSelect: () => void }> }) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);

  const [pressed] = useMousePressed(triggerRef, { drag: false });
  const longPress = useLongPress(() => setOpen(true), { delay: 400 });

  useClickOutside(menuRef, () => setOpen(false), open);

  return (
    <>
      <div
        ref={triggerRef}
        className={`target ${pressed ? 'pressed' : ''}`}
        {...longPress}
      >
        按住我
      </div>
      {open && (
        <ul ref={menuRef} className="menu">
          {items.map((item) => (
            <ContextMenuItem key={item.label} {...item} />
          ))}
        </ul>
      )}
    </>
  );
}
```

四個 hook,呼叫方各十行程式碼。不用它們的等價元件,在你處理完 iOS 幽靈點選、portal 友好的點選外部、rAF 批處理的按下態、單擊雙擊分發之後,大概要 120 行。十行意圖 vs 一百行管線——這個比例就是把庫裝上、而不是把同一份 workaround 粘到十個元件裡的理由。

## 什麼時候用哪個

| 你想響應的是                                  | 用                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| 游標進入 / 離開某個元素                       | [`useHover`](https://reactuse.com/state/usehover/)                        |
| 指標當前是否按在某個元素上                    | [`useMousePressed`](https://reactuse.com/browser/usemousepressed/)        |
| 長按 `N` 毫秒(尤其是移動端)                | [`useLongPress`](https://reactuse.com/browser/uselongpress/)              |
| 單擊 vs 雙擊,不會被雙觸發                    | [`useDoubleClick`](https://reactuse.com/element/usedoubleclick/)          |
| 元素之外任何地方的點選(下拉、modal、彈層)  | [`useClickOutside`](https://reactuse.com/element/useclickoutside/)        |
| 拖拽時指標在元素內的位置                      | [`useScratch`](https://reactuse.com/browser/usescratch/)                  |

兩條非規則。如果你想要一個能跟著指標移動的可拖元素(浮層面板、便籤),用 [`useDraggable`](https://reactuse.com/element/usedraggable/) ——`useScratch` 給你座標但不會動元素。如果你想要的是焦點而不是按壓,用 [`useFocus`](https://reactuse.com/element/usefocus/) 或 [`useActiveElement`](https://reactuse.com/element/useactiveelement/);"按下的按鈕"和"獲得焦點的按鈕"是兩回事,而且通常你兩者都要。

## 安裝

```bash
npm install @reactuses/core
# 或
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

六個 hook 都能單獨 tree-shake——`import useHover` 不會把 `useScratch` 一起拖進來。每個都帶 TypeScript 型別,客戶端渲染應用與 SSR 框架(Next.js、Remix、Astro)都能用;需要 DOM 的監聽器在服務端會 no-op,hook 在 hydration 之前返回安全預設值。

## 相關 Hook

如果指標互動是你的瓶頸,有兩篇相鄰的 ReactUse 文章值得一讀。[Observer hook 那篇](/blog/react-observer-hooks/) 講了 `useIntersectionObserver`、`useResizeObserver`、`useMutationObserver`——當"使用者做了 X"應該變成"元素進入了 Y 狀態"時,它們就是正確的原語。[ref 逃生艙](/blog/react-ref-escape-hatch/) 那篇講了 `useLatest` 與 `useEvent`,本文裡每個 hook 內部都用它們來保持閉包安全;理解它們之後,這些手勢 hook 的原始碼會好讀得多。

在 [reactuse.com](https://reactuse.com) 瀏覽全套,或者直接開啟上面任一 hook 的原始碼——大多數都不到 40 行,你大概會發現一兩個自己在自家程式碼庫裡重寫了多年的。
