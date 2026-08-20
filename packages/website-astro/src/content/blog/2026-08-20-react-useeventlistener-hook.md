---
title: "React useEventListener Hook: Type-Safe DOM Events (2026)"
description: "A practical guide to useEventListener in React: why the hand-rolled useEffect + addEventListener pair either re-subscribes on every render or reads stale state, how useEventListener attaches exactly once per target, the four target forms (window, document, ref, any EventTarget), what TypeScript actually infers for each one, passive listeners and options that don't retrigger, plus the ref-remount and SSR gotchas. TypeScript-first, SSR-safe."
slug: react-useeventlistener-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-20
tags: [react, hooks, dom, typescript, tutorial]
keywords: [react useeventlistener, useeventlistener, useeventlistener react, useEventListener hook, react addeventlistener hook, react useeffect addeventlistener, react event listener cleanup, react keydown listener hook, react window resize listener, react addeventlistener typescript, react remove event listener on unmount, react passive event listener, useeventlistener typescript, react document event listener hook, react escape key hook]
image: /img/og.png
---

# React useEventListener Hook: Type-Safe DOM Events (2026)

Here's a modal close-on-Escape that quietly does the wrong thing:

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

If the parent passes an inline `onClose={() => setOpen(false)}` — and it almost always does — `onClose` is a new function on every render, so this effect tears the listener down and adds a fresh one on *every single render* of the parent. Drop `onClose` from the deps to stop the churn and you get the other bug: the listener now holds the first render's `onClose` forever, and closing the modal calls a stale closure.

You can't win this with a dependency array, because the two things you want are in direct conflict: **subscribe once**, but **always run the newest handler**. The fix is to separate them — register the listener on a stable identity, and call through a ref that's kept current. [`useEventListener`](https://reactuse.com/effect/useeventlistener/) from [`@reactuses/core`](https://reactuse.com) is that split, packaged. This post covers what it actually does under the hood, the four ways to name a target, exactly what TypeScript infers for each one (this part surprises people), the options that don't retrigger, and the two gotchas worth knowing before you ship it.

<!-- truncate -->

## Quick Start

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

That's the whole fix. No dependency array, no `useCallback` on the parent, no cleanup to remember. The listener is added to `window` once when the component mounts and removed when it unmounts; the arrow function you passed is re-created on every render and it doesn't matter, because the listener never re-registers — it calls the latest one. `e` is a `KeyboardEvent`, inferred, not annotated.

The signature is four arguments, three of them optional:

```tsx
useEventListener(eventName, handler, target?, options?);
```

`target` defaults to `window`. `options` is the same `boolean | AddEventListenerOptions` you'd pass to `addEventListener`.

## What It Actually Does

The implementation is short enough to read in full, and worth reading because every line is answering one of the problems above:

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

Four decisions are packed in there:

**The handler is held in a ref, not in the deps.** [`useLatest`](https://reactuse.com/state/uselatest/) keeps `savedHandler.current` pointing at the newest handler after every committed render, and the function actually registered with the DOM is a thin wrapper that forwards to it. So the handler you pass can be a brand-new closure every render — inline arrow functions are not just allowed, they're the expected usage — while `addEventListener` is called exactly once. That's the "subscribe once, run the newest" split, and it's why `handler` is deliberately absent from the dependency list.

**The dependency list is deep-compared.** The effect is [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/), not `useEffect`, so a fresh-but-identical `options` object each render doesn't count as a change. Writing `useEventListener("scroll", onScroll, ref, { passive: true })` with the object literal inline is fine: three renders, one `addEventListener` call. Change the contents to `{ passive: false }` and it does re-register, which is what you want.

**The target is resolved inside the effect, at commit time.** `getTargetElement` runs in the effect body rather than during render, so a ref target has already been populated by React — `ref.current` is `null` while rendering and only becomes a node in the commit phase. This is the difference between the listener attaching and silently doing nothing.

**On the server it's a no-op.** The export is `isBrowser ? implementation : noop`, so nothing touches `window` during SSR and there's no `typeof window === "undefined"` guard for you to write. Listeners attach after hydration, in the effect, like every other browser subscription.

## The Four Ways to Name a Target

`target` accepts four shapes, and picking the right one is most of the API:

```tsx
// 1. omitted → window
useEventListener("resize", () => setWidth(window.innerWidth));

// 2. a function returning an element → document, or anything you look up lazily
useEventListener("visibilitychange", () => setActive(!document.hidden), () => document);

// 3. a ref
const boxRef = useRef<HTMLDivElement>(null);
useEventListener("wheel", (e: WheelEvent) => e.preventDefault(), boxRef, { passive: false });

// 4. any EventTarget you already hold
useEventListener("message", (e: MessageEvent) => handle(e.data), worker);
```

Case 2 exists because `document` isn't available during module evaluation on the server, and because passing `document` directly would be a new-identity-every-render problem for anything looked up on the fly. The wrapper function is resolved at commit time and its *result* is what the effect keys on, so `() => document` is stable in the way that matters.

Case 4 is the one people forget: `EventTarget` is not just DOM elements. A `Worker`, a `WebSocket`, an `EventSource`, a `MediaQueryList`, `window.visualViewport`, a `BroadcastChannel`, an `<audio>` element, `navigator.serviceWorker`, even an `AbortSignal` — all of them are event targets, and all of them work here with the same automatic cleanup. (For the common ones, the library already ships purpose-built hooks: [`useEventSource`](https://reactuse.com/browser/useeventsource/), [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/), [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/), [`useNetwork`](https://reactuse.com/browser/usenetwork/).)

## What TypeScript Actually Infers

This is the part worth being precise about, because the hook ships six overloads and they don't all give you the same thing. Verified against the current types:

| Target form | `e` is inferred as |
| --- | --- |
| omitted (`window`) | the exact `WindowEventMap` type — `"keydown"` → `KeyboardEvent` ✅ |
| a raw `HTMLElement` / `Element` / `Document` | the exact event type — `"click"` → `MouseEvent` ✅ |
| a **ref object** | `any` ⚠️ |
| a **function** target (`() => document`) | `any` ⚠️ |

The two `any` cases fall through to the general overload, which types the handler as `(...p: any) => void`. Nothing breaks — but you lose the autocomplete and the type checking exactly where refs are most common. The fix is one annotation, and it costs nothing:

```tsx
// ⚠️ e is any
useEventListener("click", (e) => console.log(e.clientX), buttonRef);

// ✅ e is MouseEvent, checked
useEventListener("click", (e: MouseEvent) => console.log(e.clientX), buttonRef);
```

Two related sharp edges in the same area. First, `e` is the **native** DOM event, not React's `SyntheticEvent` — `e.target` is not typed for you, `e.currentTarget` is `EventTarget | null`, and there's no pooling to worry about. Second, the event *name* is only constrained when the target is one of the typed overloads; with a ref or function target the name is a plain `string`, so a typo like `"keydwon"` compiles happily and attaches a listener that never fires. If a listener seems dead, check the spelling before you check anything else.

## Patterns

### Keyboard shortcuts

The canonical `window` listener. One hook per shortcut, or one handler with a switch — both are fine, because neither re-registers:

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

Note the composition: `useEventListener` is a fine primitive to build *your* hooks on, and because the handler is ref-held, `run` and `combo` can be inline closures over fresh state without any memoization ceremony. If you only need the modifier keys themselves, [`useKeyModifier`](https://reactuse.com/browser/usekeymodifier/) already tracks them.

### Non-passive wheel and touch listeners

This is the case JSX props genuinely cannot do. React attaches `onWheel` and `onTouchStart` as passive listeners at the root, so calling `e.preventDefault()` inside them logs a console warning and does nothing. To actually block a scroll or a pinch you need a real listener registered with `{ passive: false }` on the element:

```tsx
function ZoomCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEventListener(
    "wheel",
    (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault(); // works — this listener is genuinely non-passive
      setZoom((z) => clamp(z * (1 - e.deltaY / 500), 0.5, 4));
    },
    canvasRef,
    { passive: false },
  );

  return <div ref={canvasRef} style={{ transform: `scale(${zoom})` }} />;
}
```

The mirror image is just as useful: mark a high-frequency `scroll` or `touchmove` listener `{ passive: true }` so the browser knows it never needs to wait on your handler before scrolling.

### Window and document events React doesn't give you props for

`resize`, `online`/`offline`, `visibilitychange`, `beforeunload`, `hashchange`, `storage`, `paste` at the document level — none of these have a JSX equivalent, and all of them are one line:

```tsx
function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEventListener("online", () => setOnline(true));
  useEventListener("offline", () => setOnline(false));
  return online;
}
```

Before you write these by hand, check whether the library already has them — [`useWindowSize`](https://reactuse.com/element/usewindowsize/), [`useOnline`](https://reactuse.com/browser/useonline/), [`useDocumentVisibility`](https://reactuse.com/element/usedocumentvisibility/), [`usePageLeave`](https://reactuse.com/browser/usepageleave/), [`useTextSelection`](https://reactuse.com/state/usetextselection/) are all thin wrappers over exactly this hook, with the state management already done.

### Rate-limiting a hot event

`scroll`, `mousemove`, `resize` and `pointermove` fire far faster than you want to re-render. Wrap the handler, not the listener:

```tsx
function ScrollSpy() {
  const [y, setY] = useState(0);
  const onScroll = useThrottleFn(() => setY(window.scrollY), 100);
  useEventListener("scroll", onScroll);
  return <progress value={y} max={document.body.scrollHeight} />;
}
```

[`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) for "at most every N ms", [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) for "once the user stops". Both keep a stable identity, so the listener still registers once. For scroll position specifically, [`useScroll`](https://reactuse.com/browser/usescroll/) and [`useWindowScroll`](https://reactuse.com/element/usewindowscroll/) already do this properly.

## Gotchas Worth Knowing

- **A ref target keys on the ref, not on `ref.current`.** The effect's dependency is the ref *object*, which is stable for the component's lifetime, so if the DOM node behind the ref is replaced — a conditional branch that mounts a genuinely different element, a `key` change, a list reorder — the listener stays attached to the old, detached node and never moves. React usually reuses the same DOM node when the element type and position match, which is why this rarely bites, but when it does it's baffling. The fix is to make the *node* the dependency by holding it in state with a callback ref:

  ```tsx
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEventListener("click", (e: MouseEvent) => handle(e), node);
  return show ? <button ref={setNode}>A</button> : <span ref={setNode}>B</span>;
  ```

  Now the target identity changes when the node does, and the listener re-registers on the new element.

- **Listeners attach after paint, not during render.** It's an effect, so between first paint and the effect running there is a window — usually a frame — where the listener isn't there yet. Irrelevant for user-driven events (nobody presses a key that fast), but it means you cannot use this to catch an event that fires during mount. If an element needs a listener from its very first paint, that's what layout effects and JSX props are for.

- **Passing `document` or an element directly is fine — until it's conditional.** `useEventListener("click", h, someState ? elA : elB)` re-registers when the element changes, which is correct. But `useEventListener("click", h, document.getElementById("x"))` runs a DOM query on every render and returns `null` on the server; prefer the function form `() => document.getElementById("x")`.

- **It doesn't return an `off()` handle.** Unlike VueUse's version, there's no manual stop function — the lifetime is the component's. If you need to start and stop a listener on demand, gate it inside the handler with a ref or a piece of state (`if (!enabledRef.current) return`), which is cheaper than re-registering anyway.

- **One hook, one event.** There's no array form. `useEventListener("mousedown", h)` and `useEventListener("touchstart", h)` as two calls is the idiom — hooks are cheap, and it keeps the dependency comparison trivial.

- **SSR-safe by construction, so don't guard it.** No `typeof window` checks, no `useEffect` wrapper, no dynamic import. On the server the hook does nothing at all.

## When Not to Use It

`useEventListener` is a primitive. If a purpose-built hook exists, it will handle the state, the edge cases and the cleanup you'd otherwise re-derive:

- **A click landing outside an element** → [`useClickOutside`](https://reactuse.com/element/useclickoutside/) or [`useClickAway`](https://reactuse.com/element/useclickaway/) (they handle the "mousedown started inside, mouseup outside" case you'd get wrong).
- **Hover, long-press, double-click, drag** → [`useHover`](https://reactuse.com/state/usehover/), [`useLongPress`](https://reactuse.com/browser/uselongpress/), [`useDoubleClick`](https://reactuse.com/element/usedoubleclick/), [`useDraggable`](https://reactuse.com/element/usedraggable/).
- **Element size or visibility** → [`useResizeObserver`](https://reactuse.com/element/useresizeobserver/), [`useElementSize`](https://reactuse.com/element/useelementsize/), [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/). These are observers, not events; a `resize` listener on `window` cannot tell you an element changed size.
- **The event has a JSX prop and the target is your own element** → just use `onClick`. Delegated React handlers are cheaper and colocated. Reach for a real listener when you need `window`/`document`, a non-passive listener, or an event React doesn't surface.
- **You only wanted a stable function identity** → that's [`useEvent`](https://reactuse.com/effect/useevent/); no listener involved.

## Takeaways

- The `useEffect` + `addEventListener` pair forces a false choice: put the handler in the deps and re-subscribe on every render, or leave it out and call a stale closure.
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) resolves it by registering a stable wrapper once and forwarding to a [`useLatest`](https://reactuse.com/state/uselatest/) ref, so inline arrow handlers are free and `addEventListener` runs once per target.
- Options are deep-compared, so an inline `{ passive: true }` doesn't retrigger; the target is resolved at commit time, so refs work; the whole hook is a no-op during SSR.
- TypeScript infers the exact event type for `window` and raw-element targets, and falls back to `any` for ref and function targets — annotate the handler parameter there, and watch for event-name typos, which those overloads won't catch.
- Use it as a primitive to build your own hooks on. If a dedicated hook already exists for what you're listening to, use that instead.

`useEventListener`, `useLatest`, `useClickOutside`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
