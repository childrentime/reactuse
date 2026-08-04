---
title: "React useDisclosure Hook: Manage Modal & Drawer State (2026)"
description: "A practical guide to useDisclosure in React: manage open/close state for modals, drawers, and popovers with controlled and uncontrolled modes, lifecycle callbacks, ref-stabilized handlers, and the toggle pattern — without pulling in a UI framework. TypeScript-first."
slug: react-usedisclosure-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-04
tags: [react, hooks, state, typescript, tutorial]
keywords: [react useDisclosure, usedisclosure, useDisclosure hook, react modal state hook, react disclosure hook, react toggle modal, react drawer state, chakra ui useDisclosure standalone, react controlled modal, react modal open close hook, usedisclosure react, react usedisclosure, react open close state, react dialog state management]
image: /img/og.png
---

# React useDisclosure Hook: Manage Modal & Drawer State (2026)

Every React app accumulates toggleable UI — a confirmation dialog, a mobile nav drawer, a settings popover, a notification panel. The state behind each one is always the same: a boolean, a way to open, a way to close, and maybe a callback for analytics or focus management when the transition happens. So you write `useState(false)` and three inline handlers, copy-paste it to the next modal, and somewhere around the fifth disclosure widget you notice you've scattered the same five-line pattern across a dozen files with nothing reusable and no lifecycle hooks.

[`useDisclosure`](https://reactuse.com/state/usedisclosure/) from [`@reactuses/core`](https://reactuse.com) is that pattern extracted once: uncontrolled by default, controlled when you need it, with `onOpen` / `onClose` / `onChange` callbacks that fire at exactly the right time. The returned handlers are ref-stabilized so they never cause downstream re-renders. This post walks the API, the internals, the controlled-vs-uncontrolled contract, and real patterns for modals, drawers, and composed multi-disclosure UIs. TypeScript-first.

<!-- truncate -->

## The Simplest Case: A Modal Toggle

```tsx
import { useDisclosure } from '@reactuses/core';

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button onClick={onOpen}>Open settings</button>
      {isOpen && (
        <dialog open>
          <h2>Settings</h2>
          <p>Your settings panel content here.</p>
          <button onClick={onClose}>Close</button>
        </dialog>
      )}
    </>
  );
}
```

No `useState`, no inline `() => setOpen(true)` / `() => setOpen(false)`, no naming decisions. The hook returns named functions whose intent is obvious in JSX — `onOpen` on the trigger, `onClose` on the dismiss button. It returns the same function identity on every render (ref-stabilized), so passing `onClose` to a memoized child component doesn't break `React.memo`.

## The Full API

```ts
const {
  isOpen,       // boolean — current state
  onOpen,       // () => void — set to true
  onClose,      // () => void — set to false
  onOpenChange, // () => void — toggle: calls onOpen if closed, onClose if open
  isControlled, // boolean — true if you passed `isOpen` in props
} = useDisclosure({
  defaultOpen,  // boolean — initial state (uncontrolled mode only)
  isOpen,       // boolean — pass to enter controlled mode
  onOpen,       // () => void — fires after opening
  onClose,      // () => void — fires after closing
  onChange,     // (isOpen: boolean | undefined) => void — fires on any change
});
```

Every field is optional. Call `useDisclosure()` with no arguments and you get an uncontrolled toggle that starts closed. That covers most modals and drawers. The options exist for the cases where "just a boolean" isn't enough.

## Lifecycle Callbacks: When Opening and Closing Have Side Effects

A boolean toggle becomes insufficient the moment your modal does more than show and hide. Real disclosure widgets need side effects: send an analytics event when the user opens the pricing modal, trap focus when a drawer opens, restore focus when it closes, start or stop a background poll when a notification panel toggles. Inline handlers scatter this logic across JSX:

```tsx
// Without useDisclosure — side effects tangled in JSX
<button onClick={() => {
  setIsOpen(true);
  analytics.track('pricing_modal_opened');
  focusTrap.activate();
}}>
  View pricing
</button>
```

With `useDisclosure`, the side effects live in the hook call, co-located and centralized:

```tsx
const { isOpen, onOpen, onClose } = useDisclosure({
  onOpen() {
    analytics.track('pricing_modal_opened');
    focusTrap.activate();
  },
  onClose() {
    analytics.track('pricing_modal_closed');
    focusTrap.deactivate();
  },
});

// JSX is now clean
<button onClick={onOpen}>View pricing</button>
```

The callbacks fire *after* the state updates — `onOpen` runs when `isOpen` transitions to `true`, `onClose` when it transitions to `false`. `onChange` fires on every transition with the new value, for when you want one handler covering both directions (e.g. syncing to a URL param or external store).

The callback props are wrapped in [`useLatest`](https://reactuse.com/state/uselatest/) internally — meaning you can pass inline arrow functions without causing the returned `onOpen` / `onClose` to get new identities. The handlers stay referentially stable even if the callbacks change:

```tsx
const { onOpen } = useDisclosure({
  onOpen: () => console.log(someValueThatChanges),
});
// onOpen is the same function reference every render
```

This is why `useDisclosure` returns stable handlers where a plain `useState` + inline closures wouldn't.

## Controlled Mode: When the Parent Owns the State

Sometimes the open state belongs to a parent or a state manager, and the disclosure widget just renders it. Pass `isOpen` in props and the hook switches to controlled mode:

```tsx
function ControlledDrawer({ isOpen, onToggle }: Props) {
  const disclosure = useDisclosure({
    isOpen,
    onOpen: onToggle,
    onClose: onToggle,
  });

  // disclosure.isControlled === true
  // disclosure.isOpen reflects the prop
  // disclosure.onOpen / onClose fire the parent's onToggle

  return (
    <aside className={disclosure.isOpen ? 'open' : ''}>
      <button onClick={disclosure.onClose}>×</button>
      {/* drawer content */}
    </aside>
  );
}
```

In controlled mode, `onOpen` and `onClose` do *not* update internal state — the hook respects the prop as the source of truth. They only fire the callback, so the parent can decide what happens. The `isControlled` flag is exposed so you can branch logic if needed, though in practice you rarely check it.

The boundary between modes is clean: if `isOpen` is `undefined` (or not passed), the hook is uncontrolled. If it's a boolean — even `false` — the hook is controlled. There's no "semi-controlled" gray zone.

## onOpenChange: The Toggle Shorthand

Many UI frameworks expose a single `onOpenChange` callback instead of separate open/close handlers. `useDisclosure` returns an `onOpenChange` function that acts as a toggle: it calls `onOpen` when the disclosure is closed, and `onClose` when it's open. This maps directly onto components that expose a single callback:

```tsx
const { isOpen, onOpenChange } = useDisclosure();

// Works with Radix-style APIs
<Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>...</Dialog.Content>
</Dialog.Root>

// Works as a toggle button handler
<button onClick={onOpenChange}>
  {isOpen ? 'Hide' : 'Show'} filters
</button>
```

The toggle isn't a third state path — it delegates to the same `onOpen` / `onClose` that fire your callbacks. One transition, one callback, one code path.

## How It Works Inside

The full implementation is short:

```ts
import { useCallback } from 'react';
import { useControlled } from '../useControlled';
import { useLatest } from '../useLatest';

export function useDisclosure(props = {}) {
  const {
    defaultOpen,
    isOpen: isOpenProp,
    onClose: onCloseProp,
    onOpen: onOpenProp,
    onChange = () => {},
  } = props;

  const onOpenPropRef = useLatest(onOpenProp);
  const onClosePropRef = useLatest(onCloseProp);
  const [isOpen, setIsOpen] = useControlled(
    isOpenProp,
    defaultOpen || false,
    onChange,
  );

  const isControlled = isOpenProp !== undefined;

  const onClose = useCallback(() => {
    if (!isControlled) setIsOpen(false);
    onClosePropRef.current?.();
  }, [isControlled, onClosePropRef, setIsOpen]);

  const onOpen = useCallback(() => {
    if (!isControlled) setIsOpen(true);
    onOpenPropRef.current?.();
  }, [isControlled, onOpenPropRef, setIsOpen]);

  const onOpenChange = useCallback(() => {
    (isOpen ? onClose : onOpen)();
  }, [isOpen, onOpen, onClose]);

  return { isOpen: !!isOpen, onOpen, onClose, onOpenChange, isControlled };
}
```

Three building blocks:

1. **[`useControlled`](https://reactuse.com/state/usecontrolled/)** — a hook that switches between internal `useState` and an external prop. When `isOpenProp` is `undefined`, it manages its own state with `defaultOpen` as the initial value. When `isOpenProp` is a boolean, it returns that value directly and the setter becomes a no-op. `onChange` fires on either path.

2. **[`useLatest`](https://reactuse.com/state/uselatest/)** — wraps the `onOpen` and `onClose` callback props in a ref so their current value is always accessible without adding them to dependency arrays. This is why the returned `onOpen` and `onClose` functions have stable identities — their `useCallback` deps don't include the callback props themselves, only the ref containers.

3. **The controlled guard** — `if (!isControlled) setIsOpen(...)` ensures the hook never fights the parent. In controlled mode, calling `onOpen` fires the callback but leaves the state alone; the parent updates `isOpen` in its own time, and the hook reflects the new value on the next render.

No effects, no subscriptions, no browser APIs. The hook is SSR-safe by construction — it's pure React state. The server renders it, the client hydrates it, and nothing diverges.

## useDisclosure vs useBoolean vs useToggle

`@reactuses/core` has three hooks that manage a boolean. Here's when each one fits:

| | [`useDisclosure`](https://reactuse.com/state/usedisclosure/) | [`useBoolean`](https://reactuse.com/state/useboolean/) | [`useToggle`](https://reactuse.com/state/usetoggle/) |
|---|---|---|---|
| **Returns** | `{ isOpen, onOpen, onClose, onOpenChange, isControlled }` | `[value, { toggle, setTrue, setFalse }]` | `[value, toggle, setValue]` |
| **Controlled mode** | Yes (`isOpen` prop) | No | No |
| **Lifecycle callbacks** | `onOpen`, `onClose`, `onChange` | None | None |
| **Stable handlers** | Ref-stabilized via `useLatest` | Standard `useCallback` | Standard `useCallback` |
| **Best for** | Modals, drawers, popovers — anything with open/close semantics and side effects | Simple show/hide flags where you don't need callbacks | Minimal boolean toggle; non-boolean alternation (`'asc'` / `'desc'`) |

If you don't need callbacks or controlled mode, `useBoolean` or `useToggle` is lighter. `useDisclosure` earns its weight when opening and closing carry meaning beyond the boolean itself.

## Patterns

### Confirmation Dialog with Escape and Overlay Dismiss

```tsx
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button onClick={onOpen}>Delete</button>
      {isOpen && (
        <div className="overlay" onClick={onClose}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <p>Are you sure?</p>
            <button onClick={() => { onConfirm(); onClose(); }}>
              Yes, delete
            </button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
```

The overlay's `onClick` calls `onClose`, the dialog stops propagation. The confirm button runs the action *then* closes. No state management code visible in the JSX.

### Mobile Drawer with Animation Awareness

```tsx
function MobileNav() {
  const [isAnimating, setIsAnimating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure({
    onOpen: () => setIsAnimating(true),
    onClose: () => setIsAnimating(true),
    onChange: () => {
      setTimeout(() => setIsAnimating(false), 300);
    },
  });

  return (
    <>
      <button onClick={onOpen} disabled={isAnimating}>
        Menu
      </button>
      <nav className={`drawer ${isOpen ? 'open' : 'closed'}`}>
        <button onClick={onClose}>×</button>
        {/* nav links */}
      </nav>
    </>
  );
}
```

The `onOpen` / `onClose` callbacks set an animating flag to disable the trigger during transitions. `onChange` clears it after the CSS transition duration. All the timing logic is in one place.

### Multiple Disclosures with Mutual Exclusion

```tsx
function SettingsPanel() {
  const general = useDisclosure({ defaultOpen: true });
  const security = useDisclosure();
  const notifications = useDisclosure();

  const closeAll = () => {
    general.onClose();
    security.onClose();
    notifications.onClose();
  };

  const openExclusive = (target: ReturnType<typeof useDisclosure>) => {
    closeAll();
    target.onOpen();
  };

  return (
    <div>
      <button onClick={() => openExclusive(general)}>General</button>
      <button onClick={() => openExclusive(security)}>Security</button>
      <button onClick={() => openExclusive(notifications)}>Notifications</button>

      {general.isOpen && <GeneralSettings />}
      {security.isOpen && <SecuritySettings />}
      {notifications.isOpen && <NotificationSettings />}
    </div>
  );
}
```

Each section gets its own `useDisclosure`. The `openExclusive` helper closes all, then opens one — accordion behavior without an accordion library.

## Coming from Chakra UI

If you've used Chakra UI's `useDisclosure`, the API is nearly identical. The main differences:

- **No `getButtonProps` / `getDisclosureProps`** — this hook manages state, not DOM attributes. Use `isOpen` and `onOpen` / `onClose` directly.
- **`onOpenChange` instead of `onToggle`** — same behavior (toggle), different name. Matches the naming convention used by Radix, Headless UI, and Ariakit.
- **`onChange` callback** — Chakra doesn't expose this; `@reactuses/core` does, for syncing the boolean to external stores.
- **No dependency on a UI framework** — install `@reactuses/core` and use it with any component library or none.

```tsx
// Chakra UI
const { isOpen, onOpen, onClose, onToggle } = useDisclosure();

// @reactuses/core — same shape, different toggle name
const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
```

Migration is a rename.

## Takeaways

- **[`useDisclosure`](https://reactuse.com/state/usedisclosure/) replaces the `useState(false)` + three inline handlers pattern** that accumulates across every modal, drawer, and popover in your app.
- **Lifecycle callbacks (`onOpen`, `onClose`, `onChange`) centralize side effects** — analytics, focus management, animation triggers — away from JSX.
- **Controlled mode is opt-in**: pass `isOpen` and the hook defers to your state; omit it and the hook manages its own.
- **Handlers are ref-stabilized** — `onOpen`, `onClose`, and `onOpenChange` keep the same identity across renders, so they're safe to pass to memoized children.
- **`onOpenChange` is a toggle** that delegates to `onOpen` / `onClose`, mapping directly onto the single-callback API that Radix, Headless UI, and Ariakit use.
- **SSR-safe by construction** — no browser APIs, no effects, pure React state.

Grab it from [`@reactuses/core`](https://reactuse.com/state/usedisclosure/) and stop copy-pasting modal state.
