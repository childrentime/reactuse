---
title: "React Pointer Hooks: Hover, Long-Press, Double-Click, Scratch, and Click-Outside Without the Bugs"
description: "Pointer events are a swamp — mouse vs touch, single vs double, hover that flickers on child elements, long-press that fires an iOS ghost click, click-outside that misses a portal. A walkthrough of six ReactUse hooks built for pointer and gesture handling — useHover, useMousePressed, useLongPress, useDoubleClick, useClickOutside, and useScratch — and the specific bug each one removes."
slug: react-pointer-gesture-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-25
tags: [react, hooks, ui, tutorial]
keywords: [react hover hook, react useHover, react long press hook, react useLongPress, react double click hook, react useDoubleClick, react click outside hook, react useClickOutside, react useClickAway, react mouse pressed, react useMousePressed, react drag gesture, react useScratch, react touch events, react ios ghost click, react pointer events, react gesture hooks]
image: /img/og.png
---

# React Pointer Hooks: Hover, Long-Press, Double-Click, Scratch, and Click-Outside Without the Bugs

Pointer events are the part of React nobody writes about because everybody assumes they have already been figured out. They have not. The standard answers — `onMouseEnter`, `onClick`, a `setTimeout` for double-click, a window listener for click-outside — all work in the demo and all break in production. They flicker as the cursor crosses a child element. They fire an iOS ghost click 300 ms after a touch ends. They miss elements rendered through a portal. They count a double-click as two single-clicks because the second click handler runs before the first one is cancelled.

<!-- truncate -->

The DOM event model is what it is. Browsers ship different gesture pipelines on mobile and desktop, the spec for `dblclick` is older than React, and `composedPath()` is the only reliable way to walk a click out through shadow boundaries and portals. None of that is going to change. What you can change is whether every component in your app re-implements the workarounds from scratch.

[ReactUse](https://reactuse.com) ships six small pointer hooks that close the gaps. This post walks each one: the bug in the naive version, what the hook does instead, and a concrete component you would actually build with it. If you read [the post on the ref escape hatch](/blog/react-ref-escape-hatch/), one detail will look familiar — most of these hooks use [`useLatest`](https://reactuse.com/state/uselatest/) internally so that the listener stays stable even as the callback identity moves.

## Why Pointer Events Are a Swamp

A two-line example. A dropdown that closes when you click outside it:

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

Four things wrong with this. First, no `touchstart` listener, so it does not close on mobile. Second, `contains` does not cross portals — if `<Menu />` renders into `document.body`, clicking the menu items closes the menu. Third, the listener uses the bare `Element.contains` check instead of `composedPath()`, so anything inside a shadow root inside the dropdown is treated as outside. Fourth, the handler captures the initial `setOpen` closure; if the parent passes a new `onClose` prop, the listener still calls the old one because the effect only re-binds on mount.

Each of those is a one-line fix. Each of those one-line fixes is what makes the hook below 25 lines instead of 5. That is the whole pitch.

## 1. useHover — Hover State That Does Not Flicker

[`useHover`](https://reactuse.com/state/usehover/) returns a boolean for whether the cursor is currently inside a target element. The signature is exactly what you would write yourself:

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

Two details matter. The hook listens to `mouseenter` and `mouseleave`, not `mouseover` and `mouseout`. `mouseover` bubbles, which means the cursor crossing into any child element fires another event and you spend most of your time flickering between `true` and `false` if you are not careful. `mouseenter` does not bubble — it fires once when the cursor enters the bounding element and once when it leaves, regardless of how many children sit underneath. This is the same reason CSS `:hover` does not flicker on nested elements: the browsers built the right primitive, they just hid it behind a less-obvious event name.

The other detail is that `useHover` takes a target ref, not a callback ref. The hook resolves the target through ReactUse's [`BasicTarget`](https://reactuse.com/state/uselatest/) helper, which means you can pass a ref, a DOM node, or a function that returns one — useful when the element comes from another hook like [`useDraggable`](https://reactuse.com/element/usedraggable/).

## 2. useMousePressed — Pressed State, Plus Where the Press Came From

`hovered` tells you if the pointer is over the element. [`useMousePressed`](https://reactuse.com/browser/usemousepressed/) tells you if the pointer is *down* on it — distinguishing mouse, touch, and drag as separate sources so you can react differently to each.

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

Two values come back as a tuple: the boolean and a `sourceType` of `'mouse' | 'touch' | null`. The source matters more than it looks. A touch press should not animate a hover-style transition because the user's finger is covering the element. A drag-start press should not trigger the button's onClick — you can use the source to decide whether to ignore the release. The hook handles the listener cleanup including the `dragend` and `touchcancel` paths that are easy to forget; if you have ever shipped a button that stayed in the "pressed" state because the user dragged off it, you have shipped the bug this hook closes.

There is a subtle thing about the listener targets too. `mousedown` is attached to the element, but `mouseup` and `mouseleave` are attached to the *window*. That is intentional: if the user presses on the button and releases outside it, you want to see the release. Attaching `mouseup` to the element itself misses that case — the button stays "pressed" until the user comes back and clicks it again.

## 3. useLongPress — Tap-and-Hold Without the iOS Ghost Click

A long-press is a tap held for a configurable duration before firing. The naive version is a `setTimeout` on `mousedown` cleared by `mouseup`:

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

That works on desktop. On iOS Safari, after the user lifts their finger from a long press, the OS fires a synthetic `click` event 300 ms later — the "ghost click" — which can trigger an unrelated handler on whatever element the finger landed on next. The fix is to attach a one-shot `touchend` listener with `preventDefault` to the element that was pressed, which is exactly the bookkeeping [`useLongPress`](https://reactuse.com/browser/uselongpress/) does for you:

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

The hook returns an object of event handlers you spread onto the element — `onMouseDown`, `onMouseUp`, `onMouseLeave`, `onTouchStart`, `onTouchEnd` — so the listener wiring lives inside React's synthetic event system instead of a raw `addEventListener`. That matters because synthetic events get batched correctly with React's state updates; a long-press that opens a modal will not produce two extra renders the way a manual `addEventListener` would.

`isPreventDefault` defaults to `true` and is the setting you want for almost every use case except scrolling. The one case where you want it off: when the long-press target is something the user might also want to scroll past, like a list item where the long-press opens a context menu but a vertical swipe should still scroll the list.

## 4. useDoubleClick — One Click vs Two, Without the Race

The browser ships a `dblclick` event, but it fires *in addition to* two `click` events, not instead of them. If you wire up both `onClick` and `onDoubleClick`, every double-click also triggers two single-click handlers. The standard fix is a debounce window — count clicks, wait for the gap, then dispatch single or double based on the count:

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

[`useDoubleClick`](https://reactuse.com/element/usedoubleclick/) takes a target plus two callbacks and a `latency`. Click once, wait `latency` ms; if nothing else arrives, it is a single click. Click twice within `latency`, it is a double-click and the single-click never fires. The default latency of 300 ms matches what most desktop file managers use; you can pull it down to 200 ms for snappier UI or push it up to 500 ms if you are building something for older users or touch-first interfaces.

The hook also calls `preventDefault` on `touchend` events to head off iOS's "double-tap to zoom" behavior, which would otherwise zoom the page when a user double-taps a list row. That is one of those defaults you do not notice until it is missing and a beta tester files a bug.

## 5. useClickOutside — Dismiss on Outside Click, Through Portals

[`useClickOutside`](https://reactuse.com/element/useclickoutside/) (also exported as [`useClickAway`](https://reactuse.com/element/useclickaway/) for parity with the older API name) is the "dismiss when the user clicks anywhere else" hook. The naive `contains` check breaks on portals and shadow DOM; the hook uses `composedPath()` instead, which walks the full event path including across shadow boundaries and across portals into their logical parents.

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

The hook listens to both `mousedown` and `touchstart`, not `click`. `mousedown` fires before `mouseup` and before `click`, which means the dropdown closes as soon as the press happens — before the click event would have triggered any handler on the element the user is pressing on. That feels right. If you listened to `click` instead, the click handler on the *target* would run before the dropdown closed, and if that handler also opened a modal, you would see the modal flash open and then the dropdown's close ripple through.

The third argument is an `enabled` boolean. Pass `false` when the menu is hidden to avoid running the listener at all — small thing, but if you have fifty dropdowns on a page you have fifty global `mousedown` listeners, and the cost adds up.

One thing to be aware of: the hook closes over `handler` through [`useLatest`](https://reactuse.com/state/uselatest/), so the listener stays stable even if you pass a new function on every render. That means you can write `useClickOutside(ref, () => setOpen(false))` inline without worrying about the listener re-binding — same trick the [ref escape hatch](/blog/react-ref-escape-hatch/) post covers in detail.

## 6. useScratch — Relative Pointer Position During a Drag

[`useScratch`](https://reactuse.com/browser/usescratch/) is the workhorse for any UI that needs to know *where* inside an element the pointer is during a drag — color pickers, signature pads, marquee selection, slider thumbs that need pixel-perfect tracking. The hook returns a `state` object containing the press's start position, the current position, the delta from the previous frame, and whether a scratch is in progress.

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

Two implementation details are worth knowing. First, the position updates run through [`useRafState`](https://reactuse.com/state/uselatest/) so React re-renders at most once per animation frame — you can drag a finger across the element at 120 Hz and your component still renders at 60. Without rAF batching, a fast drag generates one render per `mousemove`, and on a high-DPI touchscreen that is hundreds per second.

Second, the hook attaches its `mousemove` and `mouseup` listeners to the *document*, not the element, while only `mousedown` is on the element. That is the same reason `useMousePressed` listens on the window — once the press starts, the drag can leave the original bounding box and you still want to track it. If the listeners were on the element, the user would only have to drag a few pixels outside before the gesture broke.

The callbacks — `onScratch`, `onScratchStart`, `onScratchEnd` — are read through a `useLatest` ref, so you can pass closures that capture component state without breaking memoization. Useful for the signature-pad pattern, where `onScratch` needs to draw onto a canvas using the latest `strokeColor`.

## Putting It Together: A Context Menu

A small example that uses four of these hooks together. Long-press to open a context menu, the menu dismisses on outside click, the trigger shows a pressed state while the press is in progress, and the items in the menu support double-click to perform a "default action":

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
    onSingleClick: () => {/* hover-equivalent: do nothing */},
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
        Hold me
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

Four hooks, each ten lines of caller code. The equivalent component without them is roughly 120 lines once you have handled the iOS ghost click, the portal-aware click-outside, the rAF-batched pressed state, and the single-vs-double dispatch. That ratio — ten lines of intent vs a hundred lines of plumbing — is the case for picking up the library instead of pasting the same workaround into ten components.

## When to Reach for Which

| You want to react to                                       | Use                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Cursor entering / leaving an element                       | [`useHover`](https://reactuse.com/state/usehover/)                        |
| Pointer is currently down on an element                    | [`useMousePressed`](https://reactuse.com/browser/usemousepressed/)        |
| Tap-and-hold for `N` ms (especially on mobile)             | [`useLongPress`](https://reactuse.com/browser/uselongpress/)              |
| Single vs double click with no double-fire                 | [`useDoubleClick`](https://reactuse.com/element/usedoubleclick/)          |
| Click anywhere outside an element (dropdown, modal, popup) | [`useClickOutside`](https://reactuse.com/element/useclickoutside/)        |
| Where inside an element a drag is happening                | [`useScratch`](https://reactuse.com/browser/usescratch/)                  |

Two non-rules. If you want a draggable element that moves with the pointer (a panel, a sticky note), reach for [`useDraggable`](https://reactuse.com/element/usedraggable/) instead — `useScratch` gives you coordinates but does not move the element. And if you want focus, not press, use [`useFocus`](https://reactuse.com/element/usefocus/) or [`useActiveElement`](https://reactuse.com/element/useactiveelement/); a "pressed" button and a "focused" button are different things and you usually want both.

## Installation

```bash
npm install @reactuses/core
# or
pnpm add @reactuses/core
# or
yarn add @reactuses/core
```

All six hooks tree-shake individually — importing `useHover` does not pull in `useScratch`. Each ships TypeScript types and works in both client-rendered apps and SSR frameworks (Next.js, Remix, Astro); the listeners that need a DOM no-op on the server, and the hooks return safe defaults until hydration.

## Related Hooks

If pointer interactions are your bottleneck, two adjacent ReactUse posts are worth a read. [Observer hooks](/blog/react-observer-hooks/) covers `useIntersectionObserver`, `useResizeObserver`, and `useMutationObserver` — the right primitives when "user did X" should become "element is in state Y". The [ref escape hatch](/blog/react-ref-escape-hatch/) post covers `useLatest` and `useEvent`, which are what every hook in this post uses internally to stay closure-safe; understanding them makes the source of these gesture hooks much easier to read.

Browse the full set at [reactuse.com](https://reactuse.com), or open one of the hooks above and read the source — most are under 40 lines, and you will probably find one or two you have been re-implementing in your own codebase for years.
