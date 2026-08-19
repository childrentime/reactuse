---
title: "React useScrollLock Hook: Lock Body Scroll for Modals (2026)"
description: "A practical guide to useScrollLock in React: why `overflow: hidden` on body doesn't stop iOS Safari rubber-banding, how the hook's touchmove guard keeps your modal's own content scrolling, useScrollLock vs the position:fixed and body:has(dialog[open]) approaches, locking a scroll container instead of the document, and the real gotchas — unmounting while locked, two owners fighting over one element, initialState skipping the iOS guard, and scrollbar layout shift. TypeScript-first, SSR-safe."
slug: react-usescrolllock-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-19
tags: [react, hooks, browser, typescript, tutorial]
keywords: [react usescrolllock, usescrolllock, useScrollLock hook, react lock body scroll, prevent body scroll react modal, react disable background scroll, body scroll lock react, react modal scroll lock, ios safari scroll lock react, overflow hidden body react, react prevent scroll behind modal, overscroll-behavior contain react, react drawer scroll lock, scrollbar-gutter stable, react scroll lock hook]
image: /img/og.png
---

# React useScrollLock Hook: Lock Body Scroll for Modals (2026)

Your modal is open, centered, perfect. Then someone flicks the overlay and the page behind it scrolls away underneath. Everyone's first fix is the same three lines:

```tsx
useEffect(() => {
  document.body.style.overflow = open ? "hidden" : "";
}, [open]);
```

It works on your laptop. Then the bug reports arrive:

1. **On iPhone the page still moves.** iOS Safari rubber-band scrolls the document by touch even with `overflow: hidden` on `<body>`.
2. **Something else got wiped.** `""` isn't necessarily what was there before — you just erased whatever your design system or CSS-in-JS had set inline.
3. **Two overlays, one frozen page.** A drawer and a lightbox both own `body.style.overflow`; close them in the wrong order and the page never scrolls again.
4. **The layout jumps** the instant the desktop scrollbar disappears.

[`useScrollLock`](https://reactuse.com/browser/usescrolllock/) from [`@reactuses/core`](https://reactuse.com) is those three lines with the hard parts handled: it restores the exact inline `overflow` it replaced, adds a `touchmove` guard on iOS that still lets your modal's own content scroll, exposes the lock as React state you can render off, and works on any element — not just `<body>`. This post covers what it actually does line by line, why `overflow: hidden` is not enough on iOS, how it compares to the `position: fixed` and `body:has(dialog[open])` approaches, and the six gotchas that show up in real apps.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useScrollLock } from "@reactuses/core";
import { useEffect } from "react";

function Modal({ open, onClose, children }: ModalProps) {
  // a getter, not `document.body` — see the SSR gotcha below
  const [, setLocked] = useScrollLock(() => document.body);

  useEffect(() => {
    setLocked(open);
    return () => setLocked(false); // release even if we unmount while open
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

The signature:

```ts
const [locked, setLocked] = useScrollLock(target, initialState?)
```

- **`target`** — the element whose scrolling you're locking. Accepts an element, a `RefObject`, or a getter `() => element`. Resolved lazily, on every call.
- **`initialState`** — start locked. Defaults to `false`, and you should keep it that way (gotcha 3).
- **Returns** `[locked, setLocked]`. `locked` is real state; `setLocked` is identity-stable, so it's safe in a dependency array or as a prop.

## What useScrollLock Actually Does

The core of it, condensed from the source:

```tsx
const [locked, setLocked] = useState(initialState);
const initialOverflowRef = useRef<CSSStyleDeclaration["overflow"]>("scroll");

useEffect(() => {
  const element = getTargetElement(target);
  if (element) {
    initialOverflowRef.current = element.style.overflow; // remember what we're replacing
    if (locked) element.style.overflow = "hidden";
  }
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
  element.style.overflow = initialOverflowRef.current; // restore, don't clobber
  setLocked(false);
});
```

Four decisions in there are worth naming, because they're exactly where hand-rolled versions differ:

- **The lock is state, not a fire-and-forget side effect.** `locked` is a real `useState` value, so the same boolean that drives the style can drive your `aria-hidden`, your class names, your Esc handler.
- **It restores the inline value it replaced**, not `""`. If something had set `overflow: overlay` inline, that's what comes back.
- **The target is resolved lazily** through `getTargetElement`, which returns `undefined` when there is no `window`. Nothing touches the DOM on the server.
- **Only iOS gets a `touchmove` guard.** Which is the genuinely interesting part.

## Why `overflow: hidden` Isn't Enough on iOS

`overflow: hidden` on the scrolling element is the correct, spec-blessed way to stop scrolling — and iOS Safari has never fully honored it on `<body>`. Touch drags still rubber-band the document. The only reliable stop is to cancel the gesture itself:

```tsx
element.addEventListener("touchmove", preventDefault, { passive: false });
```

`passive: false` is mandatory here, not decoration. Browsers register touch listeners on document-level targets as passive by default, and a passive listener's `preventDefault()` is ignored with a console warning — your lock would silently do nothing.

But a blanket `preventDefault` on `touchmove` breaks the thing you actually wanted: scrolling *inside* the modal. So the handler asks a question before cancelling:

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

Walk up from `event.target`; if any ancestor is genuinely scrollable — `overflow: scroll`, or `overflow: auto` **with content that actually overflows right now** — let the gesture through untouched. Otherwise cancel it. Two nice properties fall out of that:

- An `overflow: auto` container whose content currently *fits* is not scrollable, so it gets locked — correctly. Add enough content and it starts scrolling again with no code change.
- Multi-touch is excluded (`if (e.touches.length > 1) return true`, before any `preventDefault`), so pinch-to-zoom keeps working. Killing zoom inside a modal is an accessibility regression, and this sidesteps it.

## useScrollLock vs the Other Four Approaches

| Approach | Stops iOS rubber-band | Keeps inner scroll | Keeps scroll position | Cost |
| --- | --- | --- | --- | --- |
| `body.style.overflow = "hidden"` by hand | ❌ | ✅ | ✅ | clobbers the inline style, never restores it |
| `body:has(dialog[open]) { overflow: hidden }` | ❌ | ✅ | ✅ | zero JS — but the same iOS hole |
| `body { position: fixed; top: -scrollY }` | ✅ | ✅ | only if you save and restore it yourself | takes `<body>` out of flow: `position: fixed` children re-anchor, scroll anchoring and `scroll-behavior: smooth` get strange |
| `overscroll-behavior: contain` on the dialog **and** `::backdrop` | ✅ (Chrome 144+) | ✅ | ✅ | cleanest of all, where it's supported — and only for `<dialog>` |
| `useScrollLock` | ✅ | ✅ | ✅ | ~40 lines of JS behind one hook call |

One thing that trips people up: `<dialog>.showModal()` makes the rest of the document **inert** — clicks and Tab can't reach it — but it does *not* reliably block scrolling, particularly by touch on mobile. Inertness and scroll-locking are separate problems, and the browser only solves the first one for you.

And a complement rather than an alternative: `overscroll-behavior: contain` on your *inner* scroller stops scroll **chaining** — the inner list hitting its end and handing the gesture to the page. That's worth adding regardless of how you lock, but on its own it doesn't stop a drag that started on the backdrop.

## Patterns

### 1. Declare the lock, don't toggle it

The Quick Start example is the pattern to internalize. Instead of calling `setLocked(true)` in your open handler and `setLocked(false)` in your close handler — two places to forget, plus every early-return path in between — bind the lock to the state that already describes the modal:

```tsx
useEffect(() => {
  setLocked(open);
  return () => setLocked(false);
}, [open, setLocked]);
```

Now the lock can't drift out of sync with the UI, and the cleanup covers the case the imperative version always misses: a route change that unmounts the modal while it's open.

Combined with [`useDisclosure`](https://reactuse.com/state/usedisclosure/) for the open/close state itself:

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
      <button onClick={onOpen}>Menu</button>
      <main aria-hidden={locked}>{/* page content */}</main>
      {isOpen && (
        <aside className="drawer">
          {children}
          <button onClick={onClose}>Close</button>
        </aside>
      )}
    </>
  );
}
```

Note the `locked` half of the tuple earning its keep: one boolean drives both the style and the accessibility state, so they cannot disagree. (On React 19 you can use the same value for `inert`.)

### 2. Lock a scroll container, not the document

Plenty of apps don't scroll the document at all — the shell is `height: 100vh; overflow: auto` and everything scrolls inside a div. `overflow: hidden` on `<body>` does exactly nothing there, which is a confusing afternoon if you don't know it. Point the hook at the real scroller:

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

Same hook, same tuple. This is why `target` is required rather than defaulting to `document.body`: the library can't know which element is your scroll root.

### 3. Lock during a drag

Touch-dragging a slider, a sortable list, or a custom carousel scrolls the page unless something stops it — and a `touchmove` guard is exactly the right tool:

```tsx
const [, setLocked] = useScrollLock(() => document.body);

<div
  onPointerDown={() => setLocked(true)}
  onPointerUp={() => setLocked(false)}
  onPointerCancel={() => setLocked(false)}
/>
```

`onPointerCancel` matters: the browser can steal the pointer mid-gesture, and without it you'd leave the page locked. If you're building the drag itself rather than wiring one up, [`useDraggable`](https://reactuse.com/element/usedraggable/) already handles the pointer bookkeeping.

## Gotchas Worth Knowing

### 1. The lock is a style, not a lifecycle

As of `@reactuses/core` v6.5.2, the hook does **not** restore the style when the owning component unmounts — unmount while locked and `overflow: hidden` stays on the element with nothing left to remove it. The fix is one line, and it's already in every example above:

```tsx
useEffect(() => () => setLocked(false), [setLocked]);
```

Think of the returned setter as owning a style you borrowed. Every borrow needs a return, including the one on the way out.

### 2. One owner per element

Two hook instances locking the same element is the subtlest failure mode, because each keeps its *own* memory of the original `overflow`:

```text
A.lock()    → overflow: hidden    (A remembered "auto")
B.lock()    → overflow: hidden    (B remembered "hidden" 😬)
A.unlock()  → overflow: auto      (page scrolls, though B still thinks it's locked)
B.unlock()  → overflow: hidden    (page is now stuck, with nothing open)
```

Nothing is going to save you here — this is inherent to "save the old value, put it back" and applies to every hand-rolled lock and most libraries. The answer is architectural: **one lock owner per element.** Put the `useScrollLock(() => document.body)` call in your layout, provider, or store, and let modals ask it to lock rather than each carrying its own.

### 3. `initialState: true` skips the iOS guard

`useScrollLock(target, true)` applies `overflow: hidden` from the first commit — but the `touchmove` listener is only attached inside `lock()`, which never ran. So a page that starts locked is still rubber-band-scrollable on iOS. Start `false` and flip it:

```tsx
const [, setLocked] = useScrollLock(() => document.body);
useEffect(() => { setLocked(true); }, [setLocked]); // locked from mount, guard included
```

### 4. Desktop layout shift

Hiding the scrollbar reclaims ~15px and the entire page shifts sideways. That's not the hook's job to fix, and it's one CSS line:

```css
html { scrollbar-gutter: stable; }
```

### 5. Pass a getter, not `document.body`, for SSR

`useScrollLock(document.body)` evaluates `document.body` **during render**, which throws on the server before the hook gets a chance to be careful. `() => document.body` (or a ref) is only read inside effects and handlers, where `getTargetElement` already bails out without a `window`:

```tsx
const [, setLocked] = useScrollLock(() => document.body); // ✅ SSR-safe
const [, setLocked] = useScrollLock(document.body);       // ❌ crashes on the server
```

The same rule applies to every hook in the library that takes an element target, and it's the single most common SSR mistake in Next.js and Remix apps.

### 6. `hidden` stops gestures, not programmatic scrolling

An `overflow: hidden` box is still scrollable via `scrollTop`, `scrollTo`, `scrollIntoView` — and, crucially, by the browser scrolling a newly focused element into view. If focus escapes to a link behind your modal, your "locked" page will scroll to it. Scroll locking and focus trapping are two halves of the same feature; ship both.

## When Not to Use useScrollLock

- **You only need to stop an inner scroller from chaining to the page** → `overscroll-behavior: contain` in CSS, no JavaScript at all.
- **You're using `<dialog>` and can require Chrome 144+** → `overscroll-behavior: contain` on the dialog and its `::backdrop` is less code than any hook.
- **You want to scroll *to* something** → [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/), or the native one-liner — [yesterday's post on scrollIntoView with useRef](https://reactuse.com/blog/react-scrollintoview-useref/) covers both.
- **You want to read or react to scroll position** → [`useScroll`](https://reactuse.com/browser/usescroll/) or [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/).
- **You want a genuinely immersive, chrome-free view** → [`useFullscreen`](https://reactuse.com/browser/usefullscreen/) instead of locking a scroll container.
- **You're loading more rows as the user scrolls** → [`useInfiniteScroll`](https://reactuse.com/browser/useinfinitescroll/); the last thing you want there is a lock.

## Takeaways

- `overflow: hidden` is the right mechanism on desktop and an incomplete one on iOS Safari, where only cancelling `touchmove` (with `passive: false`) actually stops the document from rubber-banding.
- [`useScrollLock`](https://reactuse.com/browser/usescrolllock/) pairs that guard with a scroll-aware ancestor check, so the page can't move while your modal's own content still scrolls — and multi-touch zoom survives.
- It restores the exact inline `overflow` it replaced, exposes the lock as state you can render off, and works on any element, which is what you need when your app scrolls inside a div rather than the document.
- Bind the lock to the state that describes your UI (`setLocked(open)` plus a cleanup), keep **one owner per element**, start `initialState` at `false`, pass a getter for SSR, and add `scrollbar-gutter: stable` for the desktop shift.
- Scroll locking is half a modal. Trap focus too, or `hidden` will still scroll when something behind the overlay takes focus.

`useScrollLock`, `useDisclosure`, `useScrollIntoView`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
