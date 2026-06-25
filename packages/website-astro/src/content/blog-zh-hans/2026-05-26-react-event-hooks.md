---
title: "驯服 React 里的 DOM 事件:useEventListener、useEventEmitter、useKeyModifier、useTextSelection、useDebounceFn、useThrottleFn"
description: "DOM 事件看上去简单,真上线就麻烦不断。监听器跨 remount 泄漏、回调拿到过期的 state、debounce 定时器在卸载后还在跑、修饰键在 alt-tab 后卡住、selectionchange 一秒触发六十次。本文梳理 ReactUse 中六个让事件接线变回「无聊」的 hook——useEventListener、useEventEmitter、useKeyModifier、useTextSelection、useDebounceFn、useThrottleFn,以及它们各自消除的 bug。"
slug: react-event-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-26
tags: [react, hooks, events, tutorial]
keywords: [react 事件监听 hook, react useEventListener, react addEventListener 清理, react 事件发射 hook, react useEventEmitter, react 发布订阅, react 修饰键 hook, react useKeyModifier, react Shift 键状态, react 文本选区 hook, react useTextSelection, react selectionchange, react 防抖 hook, react useDebounceFn, react 节流 hook, react useThrottleFn, react 监听器闭包陷阱, react 键盘快捷键 hook]
image: /img/og.png
---

# 驯服 React 里的 DOM 事件:useEventListener、useEventEmitter、useKeyModifier、useTextSelection、useDebounceFn、useThrottleFn

DOM 事件模型和 React 的渲染模型本来就不太处得来。`addEventListener` 想要一个稳定的函数引用,但 React 每次渲染都给你一个新的闭包。`setTimeout` 撑起来的 debounce 想活到下一帧,而 React 在定时器还没跑完的时候就把组件卸了。键盘告诉你某个键按下、再告诉你它松开,可如果用户中间 alt-tab 切走了,松开事件就不会再来,你那个"Shift 还按着"的标志就永远是 `true`。Selection API 更绝——`selectionchange` 在同一个 `Selection` 对象上反复触发,它原地改这对象,然后指望你自己察觉。

<!-- truncate -->

每个代码库最后都会把这些坑各打一遍补丁。一个加监听器又取消的 `useEffect`,一个放在 ref 里的 lodash debounce,一个带 alt-tab 兜底逻辑的 `keydown`/`keyup` reducer,而那段兜底逻辑现在没人记得是谁写的。补丁是能跑的。但它把五行的业务意图埋在了二十行的清理逻辑下面,而 bug 偏偏就藏在清理逻辑里。

[ReactUse](https://reactuse.com) 提供六个小而专的事件 hook,把清理收进 hook 自己。本文逐个拆解:朴素版本里的 bug、hook 是怎么改的、以及一个你真的会写出来的组件示例。如果你看过[关于 ref 逃生舱的那篇](/blog/react-ref-escape-hatch/),会眼熟一个模式——这里每个 hook 内部都用 [`useLatest`](https://reactuse.com/state/uselatest/) 闭住回调,这样即使函数引用每次变,监听器本身依然是稳定的。

## 一段 useEffect 里的 bug

一个会随输入触发搜索的搜索框:

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

三处坑,你应该都见过。第一,`onResults` 在依赖数组里,父组件每次传一个新的箭头函数过来,timeout 就被重建一次——debounce 窗口在每个按键时都被重置,根本永远不会触发,而开发环境往往因为父组件凑巧 memo 了所以没人发现。第二,如果组件在 timeout 还没跑完时被卸载,`clearTimeout` 是触发了,但已经在飞的 `search()` 还在跑,等它结束就会回调 `onResults`,对一个已经卸载的组件外两层的某处 `setState` 触发 warning。第三,清理函数每次依赖变化都跑,而不是只在卸载时跑,所以从 `"reactus"` 打到 `"reactuse"` 你发出去了两个请求,谁先返回完全不保证。

这三处每处一行就能修。[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 把这三行都收进 hook 里,组件就长成你在白板上画出来的那个样子。

## 1. useEventListener — 不会泄漏的 addEventListener

[`useEventListener`](https://reactuse.com/effect/useeventlistener/) 是本文最小的 hook,也是你最常会用到的。它在目标——`window`、`document`、一个 ref、一个返回元素的函数——上挂监听器,组件卸载或目标变化时自动移除。

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

不传 `element` 参数就默认挂到 `window` 上——正是全局快捷键想要的。处理函数在内部被 [`useLatest`](https://reactuse.com/state/uselatest/) 包了一层,所以 `onCmdK` 每次事件触发时都拿最新的,而 DOM 监听器本身不会重新绑定。每次渲染你都传一个全新的箭头函数过去,真正绑上去的那个监听器还是只挂一次、在 mount 时。

挂到 ref 上的写法长得一样:

```tsx
function VideoControls({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const [time, setTime] = useState(0);

  useEventListener('timeupdate', () => {
    if (videoRef.current) setTime(videoRef.current.currentTime);
  }, videoRef);

  return <div>{time.toFixed(1)}s</div>;
}
```

两个实现细节值得知道。Hook 接受目标的形式可以是 ref、节点、或返回节点的函数——也就是 ReactUse 大部分元素 hook 共享的 [`BasicTarget`](https://reactuse.com/state/uselatest/) 协议——这意味着你可以把监听器挂到一个还不属于你的元素上,比如子组件通过 `forwardRef` 渲染出去的那个。另外,`options` 参数(第三个位置参数)是深比较的,不是引用比较,所以你写在调用现场的 `{ passive: true }` 字面量不会像裸的 `addEventListener` 那样每次渲染都重新绑定。

Hook 唯一不做的事是包装合成事件。它就是 `addEventListener` 的薄包装,给你原生 DOM 事件,不是 React 的 `SyntheticEvent`。这是故意的——这个 hook 的大多数用法都在 window 或 document 上,而 React 合成事件系统本来就够不到那里。

## 2. useEventEmitter — 不走 context 的组件间发布订阅

大多数跨组件通信问题靠 React context 或全局 store 就能解决。两个都是对的,但都不太适合那种"临时通知"的场景——"用户刚保存了表单,在某个角落弹一个 toast"——你不想让 toast 组件因为表单状态变了就跟着重渲染。

[`useEventEmitter`](https://reactuse.com/effect/useeventemitter/) 给你一个作用域绑在创建它的组件上的、带类型的发布订阅原语:

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
    <button onClick={() => fire({ kind: 'success', message: '已保存' })}>
      保存
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

三点要注意。Hook 返回一个元组——`[event, fire, dispose]`——`event` 是订阅函数,不是数据字段。调用 `event(listener)` 会返回一个 `{ dispose }` 句柄,形状和 `vscode.Disposable` 一致。`fire` 函数最多接收两个位置参数,同步广播给所有监听器;广播是"先复制一份再迭代",所以监听器在回调里取消订阅自己也不会跳过相邻的监听器。`dispose()` 一次性把所有监听器都清掉——当 emitter 所在的 context 也快卸载时挺有用。

这个模式比"context 带 state"更适合的场景是:接收方除非有事件来,否则不该重渲染。一个纯粹的 `useEffect(() => event(listener), [event])` 订阅意味着 toast 视口只在 toast 来了时渲染,而不是每次表单里按键都跟着渲染。如果你曾经在火焰图里看到顶层 context provider 把整棵树都重渲染一遍,这就是你要替换它的那个 hook,至少在"发完就忘的通知"这类场景下是。

有一个细节:emitter 是用 `useRef` 创建的,所以它在拥有它的组件的多次渲染之间是*稳定的*——可以放心放进依赖数组。但它*不会*在兄弟组件间自动共享,除非你把它放到 context 上或者作为 prop 传下去。整个应用共享就是在根部 `useEventEmitter` 一次加一个 context provider;子树共享就是你自己挑的作用域。

## 3. useKeyModifier — 不会卡住的修饰键状态

朴素版本:跟踪 Shift 当前是不是按着。

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

这个在 demo 里能跑,但三个地方会坏。用户按住 Shift,alt-tab 切到另一个窗口,在页面外松开 Shift——keyup 永远不会到,你的标志就永远是 `true`。用户按住 Shift 然后点了一下——点击处理器跑的时候,Shift 状态是过期的,因为 keydown 触发的 setState 是异步的。在 macOS 上,系统有时会在 Cmd+Shift+某键的快捷键之后把 keyup 吃掉,导致 Cmd 和 Shift 都被记成"按着",直到下一次按键。

[`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/) 用一招绕过这三个问题:从用户每一个事件——mousedown、mouseup、keydown、keyup——里读 `KeyboardEvent.getModifierState()`,而不是自己维护一套账本。

```tsx
import { useKeyModifier } from '@reactuses/core';

function FileList({ files }: { files: File[] }) {
  const shift = useKeyModifier('Shift');
  const meta = useKeyModifier('Meta');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setSelected((prev) => {
      const next = meta ? new Set(prev) : new Set();
      if (shift) /* 相对锚点做范围选择 */;
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

Hook 接受 12 个标准 `KeyboardEvent.getModifierState` 键的任意一个——`Alt`、`AltGraph`、`CapsLock`、`Control`、`Fn`、`FnLock`、`Meta`、`NumLock`、`ScrollLock`、`Shift`、`Symbol`、`SymbolLock`。状态在用户已经在产生的事件上更新,所以紧跟着 keydown 的点击处理器看到的修饰键值就是最新的。而因为信息源是 `getModifierState()` 而不是你自己维护的 keydown/keyup 对,alt-tab 问题就消失了:用户下一次产生事件时会重新读真正的 OS 状态,系统就自动收敛。

Hook 默认监听的事件是 `mousedown`、`mouseup`、`keydown`、`keyup`。如果你有专门的诉求可以传一个更小的集合——比如 `events: ['mousedown', 'mouseup']` 用于只关心点击时修饰键状态的 UI——但默认值在绝大部分场景下都是对的。空跑的监听器开销可以忽略。

## 4. useTextSelection — 用循环之外的方式观察选区

Selection API 是 DOM 较老的特性之一,这一点你能感觉得到。`document.getSelection()` 每次调用返回的是*同一个* `Selection` 对象,然后用户改变选区时它在原地被修改。`selectionchange` 事件在每次修改时都触发,包括用户拖动过程中的中间态——在一台快机器上一秒钟六十次,每次都返回同一个对象引用,所以朴素的 `useState(document.getSelection())` 不会触发重渲染,因为 React 看到的值没变。

[`useTextSelection`](https://reactuse.com/state/usetextselection/) 把这两件事都搞定了:

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
      <button onClick={() => navigator.clipboard.writeText(text)}>复制</button>
      <button onClick={() => share(text)}>分享</button>
    </div>
  );
}
```

Hook 做了两件事让上面这段能跑。第一,它通过 `useEventListener` 在 document 上监听 `selectionchange`,所以清理是自动的。第二,它把 `setState` 和 `useUpdate()` 强制渲染配对使用——因为 `document.getSelection()` 每次返回同一个对象,`useState` 的 setter 会做引用相等检查并跳过更新,工具栏就没法跟着新的 range 更新。强制渲染是这个比 React 还老的 API 的解药;hook 把这一步藏起来,你的组件就读起来像 `Selection` 是个普通的不可变值。

两点实际注意。Hook 不会给你已渲染的范围矩形——你得自己调 `selection.getRangeAt(0).getBoundingClientRect()` 拿像素坐标,就像上面那个例子那样。Selection API 在 contenteditable 元素和普通文章上都能用;如果你在做一个长文阅读器(Medium 式)的高亮器,这就是那个原语。如果你在做一个有结构化 range 的富文本编辑器,你大概会想要 ProseMirror 或 Lexical 这种更高层的库——`useTextSelection` 是看向平台的窗口,不是替代编辑器状态的方案。

## 5. useDebounceFn — 卸载就清理的函数级 debounce

[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 是 lodash 的 `debounce` 套上一层 React 感知的壳:

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

对照前面那个坏掉的版本,三点变化。处理函数通过 `useMemo` 创建一次,key 是 `wait` 和 `options`,所以引用在多次渲染之间稳定;`onResults` *不是*依赖,因为 hook 内部通过 `useLatest` 读它。返回的 `{ run, cancel, flush }` 对象暴露出和 lodash debounced 函数一样的接口,你可以在表单提交时 flush 掉等待中的调用,或者在路由切换时 cancel 掉,而不用自己去碰定时器。Hook 还注册了 `useUnmount(() => debounced.cancel())`,所以等待中的 timeout 不会在组件卸载后再触发——没有过期 state 警告,也没有 `setState on unmounted component`。

`options` 参数直通 lodash:`{ leading: true, trailing: false, maxWait: 1000 }` 等等。默认值——`leading: false`、`trailing: true`——正好是你边输边搜场景想要的。如果是"每 N 秒保存草稿,无论如何"那种模式,`maxWait` 就是你要的选项;只有 trailing 的默认会让一个一直在打字的用户无限期延后保存。

Hook 故意没解决一件事:正在飞的请求乱序的问题。如果你触发了两个 debounce 搜索,慢的那个晚返回,老的响应会覆盖掉新的。那是 `AbortController` 的事,不是 debounce 的事——如果你需要取消底层请求而不仅是底层定时器,把 `useDebounceFn` 配合 per-call 的 `AbortController` 用。

## 6. useThrottleFn — 至多每 N 毫秒一次

`useDebounceFn` 说的是"等用户停下来再动";`useThrottleFn` 说的是"现在就动,但每 N 毫秒最多动一次"。两者经常被搞混,但解的是不同的问题。

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

[`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 的形状和 `useDebounceFn` 完全一样——`(fn, wait?, options?)` 返回 `{ run, cancel, flush }`——以及同样的内部卫生:稳定的引用、最新引用的回调、卸载时取消。行为上的差异来自 `lodash.throttle`:默认 leading 和 trailing 边都会触发,所以第一个 scroll 事件立刻跑(没有可察觉的延迟),最后一个事件在节流窗口结束时跑(不会丢最终位置)。

节流用于你想周期性采样的连续事件流——滚动位置、鼠标坐标、触发昂贵布局读取的 resize 处理器。防抖用于"告诉我用户什么时候停了"——搜索输入、自动保存、校验。一个常见 bug 是给 scroll 监听器套了 debounce;用户一直在滚,trailing 边永远不触发直到他们停下来,你那条 scroll 联动的进度条就一直停在 0。

`useEventListener` 和 `useThrottleFn` 联用时有一个细节:上面例子里把 `run` 直接作为事件处理器传进去,这是对的,因为 `run` 是*节流后的*函数。注意别一不小心把里面那个原始回调传进去——节流只有在你调外层那个 wrapper 时才生效。

## 拼起来:一个键盘感知的选区工具栏

一个用到这四个 hook 的小组件。用户选中文本时浮出一个工具栏,按住 Shift 点复制就走纯文本路径(跳过剪贴板的格式协商),位置在滚动时最多每 16ms 更新一次,一个全局 emitter 把复制结果广播给任何监听者:

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
        复制 {shift ? '(纯文本)' : ''}
      </button>
    </div>
  );
}
```

五个 hook,调用方每一行代码都对应一个明确的行为。不用它们写出来的等价组件大概八十行,需要你自己处理 scroll 监听清理、selectionchange 同对象 workaround、Shift 键的 keydown/keyup reducer、节流、以及跨组件通知。二十行的意图 vs 八十行的接线——这就是为什么值得引一个库,而不是在每个代码库里把那套 workaround 再贴一遍。

## 该挑哪一个

| 你要做的                                  | 用                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| 挂一个 DOM 监听器并自动清理               | [`useEventListener`](https://reactuse.com/effect/useeventlistener/)      |
| 在组件之间广播一个临时事件                | [`useEventEmitter`](https://reactuse.com/effect/useeventemitter/)        |
| 知道 Shift / Ctrl / Alt / Meta 是否按下   | [`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/)         |
| 观察用户当前的文本选区                    | [`useTextSelection`](https://reactuse.com/state/usetextselection/)       |
| 等用户停下来再跑一个函数                  | [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)            |
| 把连续事件采样到至多每 N 毫秒一次         | [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/)            |

两条不是规则的规则。如果你想要的是一个会防抖的*值*——比如让查询字符串比输入延后 300ms——挑 `useDebounce`(state 版),不是 `useDebounceFn`(函数版)。节流同理。带 `Fn` 后缀的是给回调用的;不带后缀的是给 state 值用的。还有,如果你发现自己想用 `useEventEmitter` 广播一份本来就是 state 的东西,你大概想要的是 context 加 `useReducer`——emitter 是给临时信号用的,不是给状态同步用的。

## 安装

```bash
npm install @reactuses/core
# 或
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

六个 hook 都可以单独 tree-shake——引 `useEventListener` 不会带进 `useTextSelection`。每个都带 TypeScript 类型,在客户端渲染应用和 SSR 框架(Next.js、Remix、Astro)里都能用;需要 DOM 的监听器在服务端是 no-op,hook 在水合前返回安全的默认值。

## 相关 Hook

如果事件处理是你当前的瓶颈,有两篇 ReactUse 邻近文章值得一读。[Ref 逃生舱那篇](/blog/react-ref-escape-hatch/)讲了 [`useLatest`](https://reactuse.com/state/uselatest/) 和 [`useEvent`](https://reactuse.com/effect/useevent/),也就是本文几乎每个 hook 内部用来保持闭包安全的原语——理解它们之后再读源码会顺很多。[指针与手势 hook 那篇](/blog/react-pointer-gesture-hooks/)讲了 `useHover`、`useLongPress`、`useDoubleClick`、`useClickOutside`,它们内部都共享同样的"挂 ref、用最新引用回调"的模式。

完整列表在 [reactuse.com](https://reactuse.com),或者随便挑一个 hook 翻翻源码——大部分都在 50 行以内,你大概会发现其中一两个是你在自己代码库里反复重新发明过好几年的东西。
