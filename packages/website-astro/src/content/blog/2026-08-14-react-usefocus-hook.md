---
title: "React useFocus Hook: Track & Control Element Focus State (2026)"
description: "A practical guide to element focus in React with useFocus: a live isFocused boolean plus a setter that focuses or blurs the element on demand — no manual focus/blur listeners, no non-reactive document.activeElement reads. Covers floating labels, validate-on-blur, slash-to-search shortcuts, autofocus on mount, and when to reach for CSS :focus-visible, useActiveElement, or useWindowFocus instead. TypeScript-first, SSR-safe."
slug: react-usefocus-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-14
tags: [react, hooks, element, typescript, tutorial]
keywords: [usefocus, react usefocus, useFocus hook, react focus state hook, track input focus react, focus input react hook, programmatically focus input react, react autofocus hook, react focus blur hook, react input focused state, document.activeElement react, focus management react, react floating label focus, validate on blur react]
image: /img/og.png
---

# React useFocus Hook: Track & Control Element Focus State (2026)

Focus is where interaction actually happens — the input receiving keystrokes, the button the keyboard user just tabbed to. Yet React gives you no state for it. `document.activeElement` knows the answer but never tells you when it changes, the `autoFocus` attribute fires once and can't be re-triggered, and reading focus for *rendering* — show hints while editing, float a label, validate after leaving — means wiring `focus`/`blur` listeners by hand on every field that needs it.

[`useFocus`](https://reactuse.com/element/usefocus/) from [`@reactuses/core`](https://reactuse.com) collapses all of that into one line: a live `isFocused` boolean your component just renders, plus a setter that focuses or blurs the element whenever your logic decides to.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useRef } from "react";
import { useFocus } from "@reactuses/core";

function SearchField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setFocused] = useFocus(ref);

  return (
    <div className={isFocused ? "field field--active" : "field"}>
      <input ref={ref} placeholder="Search hooks…" />
      {isFocused && <kbd className="hint">esc to clear</kbd>}
      <button onClick={() => setFocused(true)}>Jump to search</button>
    </div>
  );
}
```

That's the whole integration. The hook subscribes to the element's `focus` and `blur` events and mirrors them into state; `setFocused(true)` calls `element.focus()`, `setFocused(false)` calls `element.blur()`. One tuple, both directions — observe focus and command it.

## Why Not autoFocus, activeElement, or Plain CSS?

Each of the built-in options covers a sliver of the problem:

- **CSS `:focus` / `:focus-within`** is the right tool when the response is *pure styling* — a border color, a glow. Use it; it costs zero JavaScript and zero re-renders. The hook earns its place the moment focus drives **logic or JSX**: rendering a hints panel, deciding *when* to validate, pausing a ticker while the user types.
- **`document.activeElement`** is a snapshot, not a subscription. Read it in render and it's stale by the next tab-press; nothing re-renders your component when focus moves.
- **`autoFocus`** fires once, at mount, and that's the entire API. It can't focus on demand ("press `/` to search"), can't blur, and tells you nothing about the current state.
- **`ref.current.focus()` sprinkled in handlers** works — until you also need to *know* whether the element is focused, and now you're maintaining listeners anyway.

## The Manual Way — and Where It Bites

The hand-rolled version looks harmless:

```tsx
// ⚠️ hand-rolled — works in the demo, leaks bugs in the app
function SearchField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    return () => {
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
    };
  }, []);
  // …
}
```

Three problems hiding in fifteen lines:

1. **Late-mounting targets never get wired.** The `if (!el) return` guard runs once. If the input renders conditionally — inside a modal, behind a tab, after a loading state — the effect has already returned and no listener ever attaches. An empty dependency array can't express "re-run when the element appears."
2. **It misses the initial state.** If something focuses the element before your effect runs (an `autoFocus` attribute, a router's focus restoration), your state says `false` while the element sits there focused. You need a `document.activeElement` check on mount *in addition to* the listeners.
3. **It's per-field boilerplate.** Multiply those fifteen lines by every input in a form and the form file is mostly plumbing.

`useFocus` absorbs all three: targets can be lazy getters (`() => document.querySelector(".modal input")`) that re-resolve as the DOM changes, mount-time state is reconciled for you, and each field is one line.

## The useFocus API

```tsx
const [isFocused, setFocused] = useFocus(target, initialValue?);
```

**`target`** is flexible — pass whichever you have:

```tsx
useFocus(ref);                                     // a ref object
useFocus(document.getElementById("search"));       // an element
useFocus(() => document.querySelector(".otp input")); // a lazy getter
```

SVG elements work too — the target type is `HTMLElement | SVGElement`, so a focusable `<circle tabindex="0">` in a chart is fair game.

**`initialValue`** (default `false`) is declarative autofocus: pass `true` and the hook focuses the element on mount. Unlike the `autoFocus` attribute, it goes through the same code path as `setFocused`, works with getter targets, and leaves you holding the live state afterwards.

**`setFocused`** is imperative control with cleanup included: `true` → `element.focus()`, `false` → `element.blur()`. If the target doesn't exist yet, the call is a safe no-op instead of a crash.

## Real Patterns

### Floating labels — the label knows when to float

The material-style input: label sits inside the field, floats up when the field is active *or* has content.

```tsx
function FloatingLabelInput({ label }: { label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused] = useFocus(ref);
  const [value, setValue] = useState("");

  const floated = isFocused || value.length > 0;

  return (
    <label className="float-field">
      <span className={floated ? "float-label up" : "float-label"}>
        {label}
      </span>
      <input ref={ref} value={value} onChange={e => setValue(e.target.value)} />
    </label>
  );
}
```

CSS alone gets close with `:focus-within` + `:placeholder-shown`, but the moment the float condition involves app state — a controlled value, a validation flag — you need focus *as state*, and this is it.

### Validate on blur, not on keystroke

Yelling "invalid email" at someone who has typed three characters is the classic form-UX failure. The fix is *touched* semantics — validate only after the user leaves the field:

```tsx
function EmailField() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused] = useFocus(ref);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isFocused) return;      // still editing — stay quiet
    if (value) setTouched(true); // left the field with content → judge it
  }, [isFocused, value]);

  const error = touched && !isFocused && !value.includes("@");

  return (
    <div>
      <input ref={ref} value={value} onChange={e => setValue(e.target.value)} />
      {error && <p className="error">That doesn't look like an email.</p>}
    </div>
  );
}
```

The `isFocused` transition *is* the touched signal — no `onBlur` prop threading, and the error clears itself the moment the user comes back to fix it.

### Press `/` to search

Every documentation site does this, and `setFocused` plus [`useEventListener`](https://reactuse.com/effect/useeventlistener/) is the entire implementation:

```tsx
function DocSearch() {
  const ref = useRef<HTMLInputElement>(null);
  const [isFocused, setFocused] = useFocus(ref);

  useEventListener("keydown", (e) => {
    if (e.key === "/" && !isFocused) {
      e.preventDefault();     // don't type the slash
      setFocused(true);
    }
    if (e.key === "Escape") setFocused(false);
  });

  return <input ref={ref} placeholder="Press / to search" />;
}
```

Note how both halves of the tuple earn their keep: `isFocused` guards against hijacking a `/` the user is legitimately typing *into the field*, and `setFocused` does the jump.

### Autofocus that survives conditional rendering

Focusing the first field of a modal form, where the input doesn't exist until [`useDisclosure`](https://reactuse.com/state/usedisclosure/) says so:

```tsx
function RenameDialog({ open }: { open: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useFocus(ref, true); // focuses on mount — which is when the dialog opens

  if (!open) return null;
  return (
    <dialog open>
      <input ref={ref} defaultValue="untitled.md" />
    </dialog>
  );
}
```

Because the component (and the hook) mounts when the dialog opens, `initialValue: true` fires at exactly the right moment — no `setTimeout(…, 0)` incantations.

## useFocus vs Its Siblings

`@reactuses/core` ships three focus hooks at three zoom levels — pick by the question you're asking:

| Hook | Answers | Reach for it when |
| --- | --- | --- |
| [`useFocus`](https://reactuse.com/element/usefocus/) | "is **this element** focused?" + control | per-field UI: labels, hints, validation timing, shortcuts |
| [`useActiveElement`](https://reactuse.com/element/useactiveelement/) | "**which element** has focus, document-wide?" | form-level logic, focus debugging, roving-focus widgets |
| [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/) | "is the **tab/window** focused at all?" | pausing polling or animations when the user switches away |
| CSS `:focus` / `:focus-visible` | styling only | any pure-CSS response — always try this first |

The rule of thumb: one element → `useFocus`; whole document → [`useActiveElement`](https://reactuse.com/element/useactiveelement/); the browser window itself → [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/).

## Production Notes

- **SSR is handled.** There's no DOM on the server; the hook renders the `initialValue` you gave it and wires listeners after hydration — no `typeof window` guards in your code.
- **`element.focus()` scrolls.** Browsers scroll a newly focused element into view. Autofocusing something below the fold on page load yanks the viewport — reserve `initialValue: true` for elements that are already where the user is looking (modals, inline editors).
- **Don't steal focus.** Moving focus is an accessibility action, not a visual one: screen readers announce the newly focused element, and keyboard users lose their place. Focus in response to *user intent* (a shortcut, opening a dialog), never on a timer or a data refresh.
- **Blur sends focus to `<body>`.** `setFocused(false)` doesn't restore focus to where it was before — after closing a dialog, hand focus back to the trigger button explicitly.
- **Style with `:focus-visible`, decide with `isFocused`.** Keyboard-only focus rings are a solved CSS problem; keep the ring in CSS and spend the hook's state on logic. Related concerns compose the same way — clicks outside the field are [`useClickOutside`](https://reactuse.com/element/useclickoutside/), not a blur hack.

## Takeaways

- React has no focus state, and the primitives don't compose into one: `document.activeElement` isn't reactive, `autoFocus` is fire-once, and hand-rolled listeners miss late-mounting elements and pre-focused mounts. [`useFocus`](https://reactuse.com/element/usefocus/) is the missing `[isFocused, setFocused]` tuple.
- The setter is bidirectional control — `true` focuses, `false` blurs, safely no-oping if the element isn't there yet; `initialValue: true` is declarative autofocus that lands exactly at mount.
- The killer patterns are timing patterns: float labels while editing, validate only after leaving, jump to search on `/`, focus the modal's first field the instant it exists.
- Pure styling belongs to CSS `:focus` and `:focus-visible` — spend the hook on logic and JSX. And pick your zoom level: element → `useFocus`, document → [`useActiveElement`](https://reactuse.com/element/useactiveelement/), window → [`useWindowFocus`](https://reactuse.com/element/usewindowfocus/).
- Focus is an accessibility surface: move it on user intent, never steal it, and return it where it came from when you're done.

`useFocus` and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
