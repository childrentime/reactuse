---
title: "馴服 React 裡的 DOM 事件:useEventListener、useEventEmitter、useKeyModifier、useTextSelection、useDebounceFn、useThrottleFn"
description: "DOM 事件看上去簡單,真上線就麻煩不斷。監聽器跨 remount 洩漏、回呼拿到過期的 state、debounce 計時器在卸載後還在跑、修飾鍵在 alt-tab 後卡住、selectionchange 一秒觸發六十次。本文梳理 ReactUse 中六個讓事件接線變回「無聊」的 hook——useEventListener、useEventEmitter、useKeyModifier、useTextSelection、useDebounceFn、useThrottleFn,以及它們各自消除的 bug。"
slug: react-event-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-26
tags: [react, hooks, events, tutorial]
keywords: [react 事件監聽 hook, react useEventListener, react addEventListener 清理, react 事件發射 hook, react useEventEmitter, react 發布訂閱, react 修飾鍵 hook, react useKeyModifier, react Shift 鍵狀態, react 文字選區 hook, react useTextSelection, react selectionchange, react 防抖 hook, react useDebounceFn, react 節流 hook, react useThrottleFn, react 監聽器閉包陷阱, react 鍵盤快捷鍵 hook]
image: /img/og.png
---

# 馴服 React 裡的 DOM 事件:useEventListener、useEventEmitter、useKeyModifier、useTextSelection、useDebounceFn、useThrottleFn

DOM 事件模型和 React 的渲染模型本來就不太處得來。`addEventListener` 想要一個穩定的函式參考,但 React 每次渲染都給你一個新的閉包。`setTimeout` 撐起來的 debounce 想活到下一幀,而 React 在計時器還沒跑完的時候就把元件卸了。鍵盤告訴你某個鍵按下、再告訴你它鬆開,可如果使用者中間 alt-tab 切走了,鬆開事件就不會再來,你那個「Shift 還按著」的旗標就永遠是 `true`。Selection API 更絕——`selectionchange` 在同一個 `Selection` 物件上反覆觸發,它原地改這個物件,然後指望你自己察覺。

<!-- truncate -->

每個程式碼倉庫最後都會把這些坑各打一遍補丁。一個加監聽器又取消的 `useEffect`,一個放在 ref 裡的 lodash debounce,一個帶 alt-tab 兜底邏輯的 `keydown`/`keyup` reducer,而那段兜底邏輯現在沒人記得是誰寫的。補丁是能跑的。但它把五行的業務意圖埋在了二十行的清理邏輯下面,而 bug 偏偏就藏在清理邏輯裡。

[ReactUse](https://reactuse.com) 提供六個小而專的事件 hook,把清理收進 hook 自己。本文逐個拆解:樸素版本裡的 bug、hook 是怎麼改的、以及一個你真的會寫出來的元件示例。如果你看過[關於 ref 逃生艙的那篇](/blog/react-ref-escape-hatch/),會眼熟一個模式——這裡每個 hook 內部都用 [`useLatest`](https://reactuse.com/state/uselatest/) 閉住回呼,這樣即使函式參考每次變,監聽器本身依然是穩定的。

## 一段 useEffect 裡的 bug

一個會隨輸入觸發搜尋的搜尋框:

```tsx
function SearchBox({ onResults }: { onResults: (rows: Row[]) => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const id = setTimeout(async () => {
      const rows = await search(query);
      onResults(rows);
    }, 300);
    return () => clearTimeout(id);
  }, [query, onResults]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

三處坑,你應該都見過。第一,`onResults` 在依賴陣列裡,父元件每次傳一個新的箭頭函式過來,timeout 就被重建一次——debounce 視窗在每個按鍵時都被重置,根本永遠不會觸發,而開發環境往往因為父元件湊巧 memo 了所以沒人發現。第二,如果元件在 timeout 還沒跑完時被卸載,`clearTimeout` 是觸發了,但已經在飛的 `search()` 還在跑,等它結束就會回呼 `onResults`,對一個已經卸載的元件外兩層的某處 `setState` 觸發 warning。第三,清理函式每次依賴變化都跑,而不是只在卸載時跑,所以從 `"reactus"` 打到 `"reactuse"` 你發出去了兩個請求,誰先回來完全不保證。

這三處每處一行就能修。[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 把這三行都收進 hook 裡,元件就長成你在白板上畫出來的那個樣子。

## 1. useEventListener — 不會洩漏的 addEventListener

[`useEventListener`](https://reactuse.com/effect/useeventlistener/) 是本文最小的 hook,也是你最常會用到的。它在目標——`window`、`document`、一個 ref、一個回傳元素的函式——上掛監聽器,元件卸載或目標變化時自動移除。

```tsx
import { useRef } from 'react';
import { useEventListener } from '@reactuses/core';

function GlobalShortcuts({ onCmdK }: { onCmdK: () => void }) {
  useEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onCmdK();
    }
  });
  return null;
}
```

不傳 `element` 參數就預設掛到 `window` 上——正是全域快捷鍵想要的。處理函式在內部被 [`useLatest`](https://reactuse.com/state/uselatest/) 包了一層,所以 `onCmdK` 每次事件觸發時都拿最新的,而 DOM 監聽器本身不會重新繫結。每次渲染你都傳一個全新的箭頭函式過去,真正掛上去的那個監聽器還是只掛一次、在 mount 時。

掛到 ref 上的寫法長得一樣:

```tsx
function VideoControls({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const [time, setTime] = useState(0);

  useEventListener('timeupdate', () => {
    if (videoRef.current) setTime(videoRef.current.currentTime);
  }, videoRef);

  return <div>{time.toFixed(1)}s</div>;
}
```

兩個實作細節值得知道。Hook 接受目標的形式可以是 ref、節點、或回傳節點的函式——也就是 ReactUse 大部分元素 hook 共享的 [`BasicTarget`](https://reactuse.com/state/uselatest/) 協議——這意味著你可以把監聽器掛到一個還不屬於你的元素上,比如子元件透過 `forwardRef` 渲染出去的那個。另外,`options` 參數(第三個位置參數)是深比較的,不是參考比較,所以你寫在呼叫現場的 `{ passive: true }` 字面值不會像裸的 `addEventListener` 那樣每次渲染都重新繫結。

Hook 唯一不做的事是包裝合成事件。它就是 `addEventListener` 的薄包裝,給你原生 DOM 事件,不是 React 的 `SyntheticEvent`。這是故意的——這個 hook 的大多數用法都在 window 或 document 上,而 React 合成事件系統本來就構不到那裡。

## 2. useEventEmitter — 不走 context 的元件間發布訂閱

大多數跨元件通訊問題靠 React context 或全域 store 就能解決。兩個都是對的,但都不太適合那種「臨時通知」的場景——「使用者剛儲存了表單,在某個角落彈一個 toast」——你不想讓 toast 元件因為表單狀態變了就跟著重新渲染。

[`useEventEmitter`](https://reactuse.com/effect/useeventemitter/) 給你一個作用域繫在建立它的元件上的、帶型別的發布訂閱原語:

```tsx
import { useEventEmitter } from '@reactuses/core';

type ToastEvent = { kind: 'success' | 'error'; message: string };

function App() {
  const [event, fire] = useEventEmitter<ToastEvent>();

  return (
    <ToastContext.Provider value={{ event, fire }}>
      <Form />
      <ToastViewport />
    </ToastContext.Provider>
  );
}
```

```tsx
function Form() {
  const { fire } = useContext(ToastContext);
  return (
    <button onClick={() => fire({ kind: 'success', message: '已儲存' })}>
      儲存
    </button>
  );
}

function ToastViewport() {
  const { event } = useContext(ToastContext);
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    const sub = event((toast) => {
      setToasts((ts) => [...ts, toast]);
      setTimeout(() => setToasts((ts) => ts.slice(1)), 3000);
    });
    return () => sub.dispose();
  }, [event]);

  return <div className="toasts">{toasts.map((t, i) => <Toast key={i} {...t} />)}</div>;
}
```

三點要注意。Hook 回傳一個元組——`[event, fire, dispose]`——`event` 是訂閱函式,不是資料欄位。呼叫 `event(listener)` 會回傳一個 `{ dispose }` 控制代碼,形狀和 `vscode.Disposable` 一致。`fire` 函式最多接收兩個位置參數,同步廣播給所有監聽器;廣播是「先複製一份再迭代」,所以監聽器在回呼裡取消訂閱自己也不會跳過相鄰的監聽器。`dispose()` 一次性把所有監聽器都清掉——當 emitter 所在的 context 也快卸載時挺有用。

這個模式比「context 帶 state」更適合的場景是:接收方除非有事件來,否則不該重新渲染。一個純粹的 `useEffect(() => event(listener), [event])` 訂閱意味著 toast 視口只在 toast 來了時渲染,而不是每次表單裡按鍵都跟著渲染。如果你曾經在火焰圖裡看到頂層 context provider 把整棵樹都重新渲染一遍,這就是你要替換它的那個 hook,至少在「發完就忘的通知」這類場景下是。

有一個細節:emitter 是用 `useRef` 建立的,所以它在擁有它的元件的多次渲染之間是*穩定的*——可以放心放進依賴陣列。但它*不會*在兄弟元件間自動共享,除非你把它放到 context 上或者作為 prop 傳下去。整個應用共享就是在根部 `useEventEmitter` 一次加一個 context provider;子樹共享就是你自己挑的作用域。

## 3. useKeyModifier — 不會卡住的修飾鍵狀態

樸素版本:追蹤 Shift 當前是不是按著。

```tsx
const [shift, setShift] = useState(false);
useEffect(() => {
  const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(true); };
  const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(false); };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}, []);
```

這個在 demo 裡能跑,但三個地方會壞。使用者按住 Shift,alt-tab 切到另一個視窗,在頁面外鬆開 Shift——keyup 永遠不會到,你的旗標就永遠是 `true`。使用者按住 Shift 然後點了一下——點選處理器跑的時候,Shift 狀態是過期的,因為 keydown 觸發的 setState 是非同步的。在 macOS 上,系統有時會在 Cmd+Shift+某鍵的快捷鍵之後把 keyup 吃掉,導致 Cmd 和 Shift 都被記成「按著」,直到下一次按鍵。

[`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/) 用一招繞過這三個問題:從使用者每一個事件——mousedown、mouseup、keydown、keyup——裡讀 `KeyboardEvent.getModifierState()`,而不是自己維護一套帳本。

```tsx
import { useKeyModifier } from '@reactuses/core';

function FileList({ files }: { files: File[] }) {
  const shift = useKeyModifier('Shift');
  const meta = useKeyModifier('Meta');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setSelected((prev) => {
      const next = meta ? new Set(prev) : new Set();
      if (shift) /* 相對錨點做範圍選取 */;
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <ul>
      {files.map((f) => (
        <li
          key={f.name}
          className={selected.has(f.name) ? 'selected' : ''}
          onClick={() => toggle(f.name)}
        >
          {f.name}
        </li>
      ))}
    </ul>
  );
}
```

Hook 接受 12 個標準 `KeyboardEvent.getModifierState` 鍵的任意一個——`Alt`、`AltGraph`、`CapsLock`、`Control`、`Fn`、`FnLock`、`Meta`、`NumLock`、`ScrollLock`、`Shift`、`Symbol`、`SymbolLock`。狀態在使用者已經在產生的事件上更新,所以緊跟著 keydown 的點選處理器看到的修飾鍵值就是最新的。而因為資訊源是 `getModifierState()` 而不是你自己維護的 keydown/keyup 對,alt-tab 問題就消失了:使用者下一次產生事件時會重新讀真正的 OS 狀態,系統就自動收斂。

Hook 預設監聽的事件是 `mousedown`、`mouseup`、`keydown`、`keyup`。如果你有專門的訴求可以傳一個更小的集合——比如 `events: ['mousedown', 'mouseup']` 用於只關心點選時修飾鍵狀態的 UI——但預設值在絕大部分場景下都是對的。空跑的監聽器開銷可以忽略。

## 4. useTextSelection — 用迴圈之外的方式觀察選區

Selection API 是 DOM 較老的特性之一,這一點你能感覺得到。`document.getSelection()` 每次呼叫回傳的是*同一個* `Selection` 物件,然後使用者改變選區時它在原地被修改。`selectionchange` 事件在每次修改時都觸發,包括使用者拖曳過程中的中間態——在一台快機器上一秒鐘六十次,每次都回傳同一個物件參考,所以樸素的 `useState(document.getSelection())` 不會觸發重新渲染,因為 React 看到的值沒變。

[`useTextSelection`](https://reactuse.com/state/usetextselection/) 把這兩件事都搞定了:

```tsx
import { useTextSelection } from '@reactuses/core';

function HighlightToolbar() {
  const selection = useTextSelection();
  const text = selection?.toString() ?? '';

  if (!text) return null;

  const range = selection!.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return (
    <div
      className="toolbar"
      style={{
        position: 'fixed',
        top: rect.top - 40,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      }}
    >
      <button onClick={() => navigator.clipboard.writeText(text)}>複製</button>
      <button onClick={() => share(text)}>分享</button>
    </div>
  );
}
```

Hook 做了兩件事讓上面這段能跑。第一,它透過 `useEventListener` 在 document 上監聽 `selectionchange`,所以清理是自動的。第二,它把 `setState` 和 `useUpdate()` 強制渲染配對使用——因為 `document.getSelection()` 每次回傳同一個物件,`useState` 的 setter 會做參考相等檢查並跳過更新,工具列就沒法跟著新的 range 更新。強制渲染是這個比 React 還老的 API 的解藥;hook 把這一步藏起來,你的元件就讀起來像 `Selection` 是個普通的不可變值。

兩點實際注意。Hook 不會給你已渲染的範圍矩形——你得自己呼叫 `selection.getRangeAt(0).getBoundingClientRect()` 拿像素座標,就像上面那個例子那樣。Selection API 在 contenteditable 元素和普通文章上都能用;如果你在做一個長文閱讀器(Medium 式)的高亮器,這就是那個原語。如果你在做一個有結構化 range 的富文字編輯器,你大概會想要 ProseMirror 或 Lexical 這種更高層的函式庫——`useTextSelection` 是看向平台的視窗,不是替代編輯器狀態的方案。

## 5. useDebounceFn — 卸載就清理的函式級 debounce

[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 是 lodash 的 `debounce` 套上一層 React 感知的殼:

```tsx
import { useDebounceFn } from '@reactuses/core';

function SearchBox({ onResults }: { onResults: (rows: Row[]) => void }) {
  const [query, setQuery] = useState('');

  const { run } = useDebounceFn(async (q: string) => {
    const rows = await search(q);
    onResults(rows);
  }, 300);

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        run(e.target.value);
      }}
    />
  );
}
```

對照前面那個壞掉的版本,三點變化。處理函式透過 `useMemo` 建立一次,key 是 `wait` 和 `options`,所以參考在多次渲染之間穩定;`onResults` *不是*依賴,因為 hook 內部透過 `useLatest` 讀它。回傳的 `{ run, cancel, flush }` 物件暴露出和 lodash debounced 函式一樣的介面,你可以在表單提交時 flush 掉等待中的呼叫,或者在路由切換時 cancel 掉,而不用自己去碰計時器。Hook 還註冊了 `useUnmount(() => debounced.cancel())`,所以等待中的 timeout 不會在元件卸載後再觸發——沒有過期 state 警告,也沒有 `setState on unmounted component`。

`options` 參數直通 lodash:`{ leading: true, trailing: false, maxWait: 1000 }` 等等。預設值——`leading: false`、`trailing: true`——正好是你邊輸邊搜場景想要的。如果是「每 N 秒儲存草稿,無論如何」那種模式,`maxWait` 就是你要的選項;只有 trailing 的預設會讓一個一直在打字的使用者無限期延後儲存。

Hook 故意沒解決一件事:正在飛的請求亂序的問題。如果你觸發了兩個 debounce 搜尋,慢的那個晚回來,舊的回應會覆蓋掉新的。那是 `AbortController` 的事,不是 debounce 的事——如果你需要取消底層請求而不僅是底層計時器,把 `useDebounceFn` 搭配 per-call 的 `AbortController` 用。

## 6. useThrottleFn — 至多每 N 毫秒一次

`useDebounceFn` 說的是「等使用者停下來再動」;`useThrottleFn` 說的是「現在就動,但每 N 毫秒最多動一次」。兩者經常被搞混,但解的是不同的問題。

```tsx
import { useThrottleFn } from '@reactuses/core';

function ScrollSpy({ onSection }: { onSection: (id: string) => void }) {
  const { run } = useThrottleFn(() => {
    const current = nearestSection();
    if (current) onSection(current);
  }, 100);

  useEventListener('scroll', run, () => window, { passive: true });
  return null;
}
```

[`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 的形狀和 `useDebounceFn` 完全一樣——`(fn, wait?, options?)` 回傳 `{ run, cancel, flush }`——以及同樣的內部衛生:穩定的參考、最新參考的回呼、卸載時取消。行為上的差異來自 `lodash.throttle`:預設 leading 和 trailing 邊都會觸發,所以第一個 scroll 事件立刻跑(沒有可察覺的延遲),最後一個事件在節流視窗結束時跑(不會丟最終位置)。

節流用於你想週期性取樣的連續事件流——捲動位置、滑鼠座標、觸發昂貴版面讀取的 resize 處理器。防抖用於「告訴我使用者什麼時候停了」——搜尋輸入、自動儲存、校驗。一個常見 bug 是給 scroll 監聽器套了 debounce;使用者一直在捲,trailing 邊永遠不觸發直到他們停下來,你那條 scroll 連動的進度條就一直停在 0。

`useEventListener` 和 `useThrottleFn` 聯用時有一個細節:上面例子裡把 `run` 直接作為事件處理器傳進去,這是對的,因為 `run` 是*節流後的*函式。注意別一不小心把裡面那個原始回呼傳進去——節流只有在你呼叫外層那個 wrapper 時才生效。

## 拼起來:一個鍵盤感知的選區工具列

一個用到這四個 hook 的小元件。使用者選中文字時浮出一個工具列,按住 Shift 點複製就走純文字路徑(跳過剪貼簿的格式協商),位置在捲動時最多每 16ms 更新一次,一個全域 emitter 把複製結果廣播給任何監聽者:

```tsx
import { useState, useContext } from 'react';
import {
  useTextSelection,
  useKeyModifier,
  useEventListener,
  useThrottleFn,
  useEventEmitter,
} from '@reactuses/core';

type CopyEvent = { text: string; plain: boolean };
const CopyContext = React.createContext<ReturnType<typeof useEventEmitter<CopyEvent>> | null>(null);

function SelectionRoot({ children }: { children: React.ReactNode }) {
  const emitter = useEventEmitter<CopyEvent>();
  return <CopyContext.Provider value={emitter}>{children}{<SelectionToolbar />}</CopyContext.Provider>;
}

function SelectionToolbar() {
  const selection = useTextSelection();
  const shift = useKeyModifier('Shift');
  const ctx = useContext(CopyContext);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const { run: updateRect } = useThrottleFn(() => {
    if (selection && selection.toString()) {
      setRect(selection.getRangeAt(0).getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, 16);

  useEventListener('scroll', updateRect, () => window, { passive: true });

  React.useEffect(updateRect, [selection]);

  const text = selection?.toString() ?? '';
  if (!text || !rect || !ctx) return null;
  const [, fire] = ctx;

  return (
    <div
      className="floating-toolbar"
      style={{
        position: 'fixed',
        top: rect.top - 40,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        onClick={async () => {
          if (shift) {
            await navigator.clipboard.writeText(text);
          } else {
            await navigator.clipboard.write([
              new ClipboardItem({ 'text/html': new Blob([text], { type: 'text/html' }) }),
            ]);
          }
          fire({ text, plain: shift });
        }}
      >
        複製 {shift ? '(純文字)' : ''}
      </button>
    </div>
  );
}
```

五個 hook,呼叫方每一行程式碼都對應一個明確的行為。不用它們寫出來的等價元件大概八十行,需要你自己處理 scroll 監聽清理、selectionchange 同物件 workaround、Shift 鍵的 keydown/keyup reducer、節流、以及跨元件通知。二十行的意圖 vs 八十行的接線——這就是為什麼值得引一個函式庫,而不是在每個程式碼倉庫裡把那套 workaround 再貼一遍。

## 該挑哪一個

| 你要做的                                  | 用                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| 掛一個 DOM 監聽器並自動清理               | [`useEventListener`](https://reactuse.com/effect/useeventlistener/)      |
| 在元件之間廣播一個臨時事件                | [`useEventEmitter`](https://reactuse.com/effect/useeventemitter/)        |
| 知道 Shift / Ctrl / Alt / Meta 是否按下   | [`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/)         |
| 觀察使用者當前的文字選區                  | [`useTextSelection`](https://reactuse.com/state/usetextselection/)       |
| 等使用者停下來再跑一個函式                | [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)            |
| 把連續事件取樣到至多每 N 毫秒一次         | [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/)            |

兩條不是規則的規則。如果你想要的是一個會防抖的*值*——比如讓查詢字串比輸入延後 300ms——挑 `useDebounce`(state 版),不是 `useDebounceFn`(函式版)。節流同理。帶 `Fn` 字尾的是給回呼用的;不帶字尾的是給 state 值用的。還有,如果你發現自己想用 `useEventEmitter` 廣播一份本來就是 state 的東西,你大概想要的是 context 加 `useReducer`——emitter 是給臨時訊號用的,不是給狀態同步用的。

## 安裝

```bash
npm install @reactuses/core
# 或
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

六個 hook 都可以單獨 tree-shake——引 `useEventListener` 不會帶進 `useTextSelection`。每個都帶 TypeScript 型別,在客戶端渲染應用和 SSR 框架(Next.js、Remix、Astro)裡都能用;需要 DOM 的監聽器在伺服器端是 no-op,hook 在水合前回傳安全的預設值。

## 相關 Hook

如果事件處理是你當前的瓶頸,有兩篇 ReactUse 鄰近文章值得一讀。[Ref 逃生艙那篇](/blog/react-ref-escape-hatch/)講了 [`useLatest`](https://reactuse.com/state/uselatest/) 和 [`useEvent`](https://reactuse.com/effect/useevent/),也就是本文幾乎每個 hook 內部用來保持閉包安全的原語——理解它們之後再讀原始碼會順很多。[指標與手勢 hook 那篇](/blog/react-pointer-gesture-hooks/)講了 `useHover`、`useLongPress`、`useDoubleClick`、`useClickOutside`,它們內部都共享同樣的「掛 ref、用最新參考回呼」的模式。

完整列表在 [reactuse.com](https://reactuse.com),或者隨便挑一個 hook 翻翻原始碼——大部分都在 50 行以內,你大概會發現其中一兩個是你在自己程式碼倉庫裡反覆重新發明過好幾年的東西。
