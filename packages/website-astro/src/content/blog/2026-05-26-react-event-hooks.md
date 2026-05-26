---
title: "Taming DOM Events in React: useEventListener, useEventEmitter, useKeyModifier, useTextSelection, useDebounceFn, useThrottleFn"
description: "DOM events look easy until you ship them. Listeners leak across remounts, callbacks see stale state, debounce timers survive unmount, modifier keys get stuck on alt-tab, and selectionchange fires sixty times per second. A walkthrough of six ReactUse hooks built to make event wiring boring again — useEventListener, useEventEmitter, useKeyModifier, useTextSelection, useDebounceFn, and useThrottleFn — and the specific bug each one removes."
slug: react-event-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-26
tags: [react, hooks, events, tutorial]
keywords: [react event listener hook, react useEventListener, react addEventListener cleanup, react event emitter hook, react useEventEmitter, react pubsub, react key modifier hook, react useKeyModifier, react shift key state, react text selection hook, react useTextSelection, react selectionchange, react debounce hook, react useDebounceFn, react throttle hook, react useThrottleFn, react stale closure event listener, react keyboard shortcut hook]
image: /img/og.png
---

# Taming DOM Events in React: useEventListener, useEventEmitter, useKeyModifier, useTextSelection, useDebounceFn, useThrottleFn

The DOM event model and the React render model do not get along. `addEventListener` wants a stable function reference; React hands you a new closure on every render. `setTimeout`-backed debounces want to outlive a frame; React reaches in and unmounts the component while the timer is still running. The keyboard tells you a key went down with one event and back up with another, but if the user alt-tabs in between, the up event never arrives and your "Shift is held" flag is stuck on `true` forever. The Selection API does not even fire `selectionchange` reliably on the same `Selection` object — it mutates the existing one and expects you to notice.

<!-- truncate -->

Every codebase ends up with the same patches for these. A `useEffect` that adds and removes a listener. A lodash debounce inside a ref. A `keydown`/`keyup` reducer with an `Alt+Tab` workaround that nobody quite remembers writing. The patches work. They are also five lines of intent buried under twenty lines of cleanup, and the cleanup is exactly where the bugs live.

[ReactUse](https://reactuse.com) ships six small event hooks that fold the cleanup into the hook itself. This post walks each one: the bug in the naive version, what the hook does instead, and a component you would actually write with it. If you read the post on [the ref escape hatch](/blog/react-ref-escape-hatch/), the pattern will be familiar — every hook in this list closes over its callback through [`useLatest`](https://reactuse.com/state/uselatest/) so the listener stays stable even as the function identity changes.

## The Bug, in One useEffect

A search box that fetches results when the user types:

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

Three things wrong, and you have seen all of them. First, `onResults` is in the dependency array, so any parent that passes a new arrow function rebuilds the timeout on every render — the debounce window resets every keystroke, never fires, and nobody notices in dev because their parent happens to memoize. Second, if the component unmounts while the timeout is pending, the `clearTimeout` fires but the in-flight `search()` keeps running and calls `onResults` after the component is gone — a `setState after unmount` warning two levels up. Third, the cleanup runs on every dep change, not just unmount, so if `query` is `"reactus"` then `"reactuse"`, you fire two requests with no guarantee that the second resolves second.

Each of those is fixable in one line. [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) bundles all three lines into the hook and leaves the component looking like the version you would draw on a whiteboard.

## 1. useEventListener — addEventListener, Without the Leak

[`useEventListener`](https://reactuse.com/effect/useeventlistener/) is the smallest hook in this post and the one you will reach for most often. It attaches a listener to a target — `window`, `document`, a ref, a function returning an element — and removes it when the component unmounts or the target changes.

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

No `element` argument means the default target is `window` — exactly what you want for a global keyboard shortcut. The handler is wrapped in [`useLatest`](https://reactuse.com/state/uselatest/) internally, so `onCmdK` is read fresh on every event without re-binding the listener. Pass a brand-new arrow function on every render and the actual DOM listener still binds once, on mount.

A ref-targeted variant looks the same:

```tsx
function VideoControls({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const [time, setTime] = useState(0);

  useEventListener('timeupdate', () => {
    if (videoRef.current) setTime(videoRef.current.currentTime);
  }, videoRef);

  return <div>{time.toFixed(1)}s</div>;
}
```

Two implementation details are worth knowing. The hook accepts the target as a ref, a node, or a function that returns one — the [`BasicTarget`](https://reactuse.com/state/uselatest/) protocol shared by most ReactUse element hooks — which means you can wire a listener to an element you do not own yet, such as one rendered by a child via `forwardRef`. And the listener `options` argument (third positional, fourth named) is deep-compared, not reference-compared, so `{ passive: true }` written inline does not cause a re-bind on every render the way a raw `addEventListener` call would.

The one thing the hook does *not* do is unwrap synthetic events. It is a thin wrapper around `addEventListener` and gives you the raw DOM event, not a React `SyntheticEvent`. That is intentional — most use cases for the hook are window or document listeners, where React's synthetic system does not reach anyway.

## 2. useEventEmitter — Pub-Sub Between Components, Without Context

Most cross-component event problems get solved with React context or a global store. Both are right answers most of the time, but neither fits the case where you want a *transient* notification — "the user just saved the form, show a toast somewhere" — without making the toast component re-render every time the form state changes.

[`useEventEmitter`](https://reactuse.com/effect/useeventemitter/) gives you a typed pub-sub primitive scoped to whatever component creates it:

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
    <button onClick={() => fire({ kind: 'success', message: 'Saved' })}>
      Save
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

Three things to notice. The hook returns a tuple — `[event, fire, dispose]` — and `event` is the *subscribe* function, not a data field. Calling `event(listener)` returns a `{ dispose }` handle, the same shape as `vscode.Disposable`. The `fire` function takes one or two positional arguments and broadcasts to every listener synchronously; the broadcast is a copy-on-iterate loop, so a listener that unsubscribes itself during the call does not skip neighbors. And `dispose()` removes all listeners at once — useful when the emitter lives on a context that itself is about to unmount.

The pattern beats context-with-state when the receiver does not need to re-render unless an event arrives. A pure `useEffect(() => event(listener), [event])` subscription means the toast viewport renders only when a toast comes in, not on every keystroke in the form. If you have ever profiled a flame graph and found a top-level context provider rerendering everything in the app, this is the hook you replace it with for the "fire-and-forget notification" cases.

There is a subtle quirk: the emitter is created with `useRef`, so it is *stable* across renders of the component that owns it — you can put it in a dependency array safely. But it is *not* shared between sibling components unless you put it on a context or pass it as a prop. Sharing across the whole app is a one-time `useEventEmitter` at the root plus a context provider; sharing within a subtree is whatever scope you choose.

## 3. useKeyModifier — Modifier State That Stays in Sync

The naive way to track whether Shift is currently held:

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

This works in the demo and breaks in three places. The user holds Shift, alt-tabs to another window, releases Shift outside the page — the keyup never fires and your flag is stuck on `true`. The user holds Shift, then clicks something — the click handler runs with stale Shift state because keydown updates the state asynchronously. And on macOS, the OS sometimes swallows the keyup after a Command+Shift+key shortcut, leaving both Cmd and Shift "held" until the next keypress.

[`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/) sidesteps all three by reading `KeyboardEvent.getModifierState()` from every event the user produces — mousedown, mouseup, keydown, keyup — rather than maintaining its own bookkeeping:

```tsx
import { useKeyModifier } from '@reactuses/core';

function FileList({ files }: { files: File[] }) {
  const shift = useKeyModifier('Shift');
  const meta = useKeyModifier('Meta');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setSelected((prev) => {
      const next = meta ? new Set(prev) : new Set();
      if (shift) /* range-select against last anchor */;
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

The hook accepts any of the 12 standard `KeyboardEvent.getModifierState` keys — `Alt`, `AltGraph`, `CapsLock`, `Control`, `Fn`, `FnLock`, `Meta`, `NumLock`, `ScrollLock`, `Shift`, `Symbol`, `SymbolLock`. The state updates on the same events the user is already producing, so the click handler that fires immediately after a keydown sees the up-to-date modifier value. And because the source of truth is `getModifierState()` rather than your own keydown/keyup pair, the alt-tab problem disappears: the next event the user produces re-reads the real OS state and you converge.

The default events the hook listens on are `mousedown`, `mouseup`, `keydown`, `keyup`. You can pass a smaller set if you have a specific case — `events: ['mousedown', 'mouseup']` for a UI that only cares about modifier state at click time, for instance — but the default is the right one almost always. The cost of an empty listener is negligible.

## 4. useTextSelection — Observe Selection Without the Loop

The Selection API is one of the older DOM features and it shows. `document.getSelection()` returns the *same* `Selection` object every call, then mutates it in place when the user changes their selection. The `selectionchange` event fires on every mutation, including the intermediate ones while the user is dragging — sixty events per second on a fast machine, each of which returns the same object reference, so a naive `useState(document.getSelection())` does not re-render because React sees the same value.

[`useTextSelection`](https://reactuse.com/state/usetextselection/) handles both halves of that:

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
      <button onClick={() => navigator.clipboard.writeText(text)}>Copy</button>
      <button onClick={() => share(text)}>Share</button>
    </div>
  );
}
```

The hook does two things to make this work. First, it listens to `selectionchange` on the document via `useEventListener`, so the cleanup is handled. Second, it pairs `setState` with a `useUpdate()` force-render — because `document.getSelection()` returns the same object every time, the `useState` setter shortcuts out and the toolbar does not re-render to the new range. The force-update is the workaround for an API older than React itself; the hook hides it so your component reads as if `Selection` were a normal immutable value.

Two practical notes. The hook does not give you the rendered range — you have to call `selection.getRangeAt(0).getBoundingClientRect()` yourself if you want pixel coordinates, which is what the example does. And the Selection API works on contenteditable elements and ordinary prose alike; if you are building a highlighter for a long-form reader (Medium-style), this is the primitive. If you are building a rich-text editor with structured ranges, you probably want a higher-level library like ProseMirror or Lexical — `useTextSelection` is a window onto the platform, not a replacement for editor state.

## 5. useDebounceFn — Function-Level Debounce That Cleans Up on Unmount

[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) wraps lodash's `debounce` in a React-aware shell:

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

Three things to notice against the earlier broken version. The handler is created once via `useMemo` keyed on `wait` and `options`, so identity is stable across renders; `onResults` is *not* a dependency because the hook reads it through `useLatest` internally. The returned `{ run, cancel, flush }` object exposes the same interface as lodash's debounced function, so you can flush a pending call (on form submit, for example) or cancel it (on route change) without reaching into the timer yourself. And the hook registers `useUnmount(() => debounced.cancel())`, so a pending timeout never fires after the component is gone — no stale-state warnings, no `setState on unmounted component`.

The `options` argument passes through to lodash: `{ leading: true, trailing: false, maxWait: 1000 }` and so on. The defaults — `leading: false`, `trailing: true` — are what you want for the search-as-you-type case. For a "save draft every N seconds, no matter what" pattern, `maxWait` is the option you want; the trailing-only default would let a continuously-typing user delay the save indefinitely.

One thing the hook intentionally does not solve: in-flight request ordering. If you fire two debounced searches and the slower one resolves second, the older response will overwrite the newer. That is an `AbortController` concern, not a debounce concern — pair `useDebounceFn` with a per-call `AbortController` if you need cancellation of the underlying request, not just the underlying timer.

## 6. useThrottleFn — At Most Once Per N Milliseconds

`useDebounceFn` says "wait until the user stops doing the thing, then act". `useThrottleFn` says "act now, but at most once per N milliseconds". The two get confused; they solve different problems.

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

[`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) takes the same shape as `useDebounceFn` — `(fn, wait?, options?)` returning `{ run, cancel, flush }` — and the same internal hygiene: stable identity, latest-ref callback, cancel on unmount. The behavioral difference is in `lodash.throttle`: by default both leading and trailing edges fire, so the first scroll event runs immediately (no perceptible lag) and the last one runs at the end of the throttle window (no missed final position).

Use throttle for continuous streams where you want regular sampling — scroll position, mouse coordinates, resize handlers driving expensive layout reads. Use debounce for "tell me when the user has paused" — search input, autosave, validation. A common bug is reaching for debounce on a scroll listener; the user keeps scrolling, the trailing edge never fires until they stop, and your scroll-linked progress bar sits at zero until they let go.

A nuance about combining `useEventListener` and `useThrottleFn`: the example above passes `run` directly as the event handler, and that is correct because `run` is the *throttled* function. Be careful not to pass the inner callback by mistake — the throttle only applies if you call the wrapper.

## Putting It Together: A Keyboard-Aware Selection Toolbar

A small component that uses four of these hooks at once. A floating toolbar appears over any text the user selects, the copy button skips the clipboard prompt when the user holds Shift (to copy as plain text), the position updates at most every 16 ms on scroll, and a global emitter broadcasts the copied text to anyone listening:

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
        Copy {shift ? '(plain)' : ''}
      </button>
    </div>
  );
}
```

Five hooks, each line of caller code corresponding to one specific behavior. The equivalent component without them is roughly 80 lines once you have written the scroll listener cleanup, the selectionchange same-object workaround, the shift-key keydown/keyup reducer, the throttle, and the cross-component notification. That ratio — twenty lines of intent vs eighty lines of plumbing — is the case for picking up the library instead of repeating the workaround in every codebase.

## When to Reach for Which

| You want to                                          | Use                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Attach a DOM listener with automatic cleanup         | [`useEventListener`](https://reactuse.com/effect/useeventlistener/)  |
| Broadcast a transient event between components       | [`useEventEmitter`](https://reactuse.com/effect/useeventemitter/)    |
| Know whether Shift / Ctrl / Alt / Meta is held       | [`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/)     |
| Observe the user's current text selection            | [`useTextSelection`](https://reactuse.com/state/usetextselection/)   |
| Wait for the user to pause before running a function | [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)        |
| Sample a continuous event at most once per N ms      | [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/)        |

Two non-rules. If you want a *value* that debounces — for example a query string that lags the input by 300 ms — reach for `useDebounce` (state version) rather than `useDebounceFn` (function version). Same for throttle. The `Fn` variants are for callbacks; the bare names are for state values. And if you find yourself reaching for `useEventEmitter` to broadcast something that already lives in state, you probably want context with a `useReducer` instead — the emitter is for transient signals, not state synchronization.

## Installation

```bash
npm install @reactuses/core
# or
pnpm add @reactuses/core
# or
yarn add @reactuses/core
```

All six hooks tree-shake individually — importing `useEventListener` does not pull in `useTextSelection`. Each ships TypeScript types and works in both client-rendered apps and SSR frameworks (Next.js, Remix, Astro); the listeners that need a DOM no-op on the server, and the hooks return safe defaults until hydration.

## Related Hooks

If event handling is your bottleneck, two adjacent ReactUse posts are worth a read. [The ref escape hatch](/blog/react-ref-escape-hatch/) covers [`useLatest`](https://reactuse.com/state/uselatest/) and [`useEvent`](https://reactuse.com/effect/useevent/), the primitives that almost every hook in this list uses internally to stay closure-safe — understanding them makes the source much easier to read. [Pointer and gesture hooks](/blog/react-pointer-gesture-hooks/) covers `useHover`, `useLongPress`, `useDoubleClick`, and `useClickOutside`, which all share the same "ref-targeted listener with latest-ref callback" pattern in their internals.

Browse the full set at [reactuse.com](https://reactuse.com), or open one of the hooks above and read the source — most are under 50 lines, and you will probably find one or two you have been re-implementing in your own codebase for years.
