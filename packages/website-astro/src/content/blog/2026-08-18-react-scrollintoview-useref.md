---
title: "React scrollIntoView with useRef: Scroll to an Element (2026)"
description: "How to scroll to an element in React with useRef and scrollIntoView: the correct baseline pattern, the block/inline/behavior arguments, why scroll-margin-top beats a magic offset under a sticky header, how to scroll to something that was just rendered (useEffect vs flushSync vs callback refs), and when the native one-liner runs out — no duration or easing control, no completion callback, no way to cancel when the user starts scrolling. Then useScrollIntoView from @reactuses/core for the cases it can't cover. TypeScript-first, SSR-safe."
slug: react-scrollintoview-useref
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-18
tags: [react, hooks, dom, typescript, tutorial]
keywords: [react scrollintoview, scrollintoview react, react useref scrollintoview, react scroll to element, react scroll to ref, useScrollIntoView, react scroll to element on click, react scroll to component, react smooth scroll to element, scrollintoview react example, react scroll to div, react scroll to first error, scroll-margin-top react, react scroll to element after render, react scrollintoview typescript, react scroll to element in container, react horizontal scroll to element]
image: /img/og.png
---

# React scrollIntoView with useRef: Scroll to an Element (2026)

You have a long form. The user hits Submit, validation fails on a field three screens down, and the error message renders somewhere they can't see. The fix is one browser API call — but *where* you put it, and what you pass it, is where an afternoon goes.

The short answer, which is what most people are here for:

```tsx
import { useRef } from "react";

function Article() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <button onClick={() => sectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
        Jump to details
      </button>
      {/* … a lot of content … */}
      <div ref={sectionRef}>Details</div>
    </>
  );
}
```

That's the whole pattern: a ref on the element, `.scrollIntoView()` in the handler, `?.` because `sectionRef.current` is `null` until React commits. It's built into every browser, it costs nothing, and for a static anchor like this it's the right answer — don't reach for a library.

This post covers the rest of it: what the arguments actually do, the sticky-header offset problem (and why the CSS answer beats the JavaScript one), how to scroll to something that was *just* rendered, and the four things the native call genuinely can't do — at which point [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) from [`@reactuses/core`](https://reactuse.com) earns its place.

<!-- truncate -->

## The Arguments You Actually Have

`Element.scrollIntoView()` takes one optional options object with three keys:

| Option | Values | Default | What it does |
| --- | --- | --- | --- |
| `block` | `start` · `center` · `end` · `nearest` | `start` | Alignment along the **block** axis — vertical in a normal writing mode |
| `inline` | `start` · `center` · `end` · `nearest` | `nearest` | Alignment along the **inline** axis — horizontal |
| `behavior` | `auto` · `instant` · `smooth` | `auto` | `auto` follows the CSS `scroll-behavior` of the scrolling box |

So the three calls worth memorizing:

```tsx
el.scrollIntoView();                                        // snap it to the top
el.scrollIntoView({ behavior: "smooth", block: "center" }); // glide it to the middle
el.scrollIntoView({ block: "nearest" });                    // move only if it's off-screen
```

`block: "nearest"` is the underrated one. It scrolls the *minimum* distance needed to bring the element into view and does nothing at all if the element is already visible — exactly what you want for keyboard navigation in a listbox, where re-centering on every arrow key makes the list feel like it's fighting you.

There's also a legacy boolean form: `scrollIntoView(true)` means `block: "start"`, `scrollIntoView(false)` means `block: "end"`. It still works everywhere; the object form says what it means.

One thing that surprises people: `scrollIntoView` scrolls **every scrollable ancestor**, not just the nearest one. If your element sits in a scrollable panel inside a scrollable page, both move so the element ends up visible. That's almost always what you wanted.

## Sticky Headers: Use CSS, Not a Magic Number

The single most common follow-up: you scroll to a heading, and your 64px sticky header sits right on top of it.

The instinct is to compute it by hand:

```tsx
// don't
const top = el.getBoundingClientRect().top + window.scrollY - 64;
window.scrollTo({ top, behavior: "smooth" });
```

Now you own that `64`. It's wrong on mobile where the header is shorter, wrong when a promo banner appears above it, wrong when the element is inside a scroll container rather than the page, and you've given up `scrollIntoView`'s ancestor handling to boot.

The platform has a property for exactly this:

```css
.section {
  scroll-margin-top: 5rem; /* or var(--header-height) */
}
```

`scroll-margin-top` tells the browser to treat the element as if it had that much extra margin *for scrolling purposes only*. Plain `el.scrollIntoView({ behavior: "smooth" })` then stops 5rem short, layout is untouched, and the value lives next to the header height it depends on. It also fixes `:target` anchors and browser find-in-page for free, which the JavaScript version never will.

Reach for `scroll-margin-top` first. Every time.

## Scrolling to Something That Just Rendered

The other half of the problem is timing. You add an item to a list and want to scroll to it; you open an accordion and want to reveal it; you set an error and want to jump to it. The naive version doesn't work:

```tsx
// broken: the DOM doesn't have the new row yet
function addRow() {
  setRows(r => [...r, newRow]);
  lastRowRef.current?.scrollIntoView(); // still the *old* last row, or null
}
```

`setRows` schedules a render. React commits it later — and under React 18+ concurrent rendering, "later" is genuinely not this tick. At the moment that line runs, the DOM is still the old DOM.

**The default fix is an effect.** Scroll after the commit that added the row:

```tsx
useEffect(() => {
  lastRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}, [rows.length]);
```

Use `useLayoutEffect` instead if you want an *instant* scroll to land before the browser paints — otherwise the user sees one frame at the old position, which reads as a flicker. For a smooth scroll it doesn't matter; the animation starts either way.

**Callback refs are cleaner for "the element I just created".** No effect, no dependency array, no ref to keep in sync — the callback fires the moment React attaches the node:

```tsx
const scrollOnMount = useCallback((node: HTMLElement | null) => {
  node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}, []);

// …
{rows.map((row, i) => (
  <Row key={row.id} ref={i === rows.length - 1 ? scrollOnMount : undefined} />
))}
```

**`flushSync` is the escape hatch, not the default.** If you truly must scroll in the same event handler that changed the state, you can force the commit:

```tsx
import { flushSync } from "react-dom";

flushSync(() => setExpanded(true));
detailsRef.current?.scrollIntoView({ behavior: "smooth" });
```

It works, and it costs you the batching and concurrency React was doing on your behalf. Fine as a one-off in a handler; a smell if it shows up three times in a file.

## Where the Native Call Runs Out

For anchors, "scroll to the error", and keyboard list navigation, everything above is enough and you should stop reading. Four things it genuinely cannot do:

**1. You can't control the duration or the curve.** `behavior: "smooth"` is whatever the browser decides — different speed in Chrome and Firefox, and no knob at all. If the scroll is part of a choreographed transition that has to line up with a 400ms fade, you can't.

**2. There's no reliable "it finished" callback.** The `scrollend` event was designed for this and landed in Chrome/Edge 114 and Firefox 109, with Safari following later — check support before you depend on it, and note it doesn't tell you *which* programmatic scroll ended. The workarounds people ship instead (a `setTimeout` guess, polling `scrollY` until it stops changing) are exactly as fragile as they sound.

**3. You can't cancel it.** Start a long smooth scroll, and if the user grabs the wheel halfway down, the browser keeps dragging them to the destination. On a long page this is the single most annoying scroll bug there is, and there is no API to stop it.

**4. It ignores `prefers-reduced-motion`.** Browsers do not universally downgrade `behavior: "smooth"` for users who asked for reduced motion — that's on you:

```tsx
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
```

Easy to write once, easy to forget in the other eleven places you scroll.

## useScrollIntoView

[`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) runs the animation itself on `requestAnimationFrame`, which is what buys back all four:

```bash
npm install @reactuses/core
```

```tsx
import { useRef } from "react";
import { useScrollIntoView } from "@reactuses/core";

function Article() {
  const targetRef = useRef<HTMLParagraphElement>(null);
  const { scrollIntoView, cancel } = useScrollIntoView(targetRef, {
    duration: 600,
    offset: 80,
    onScrollFinish: () => targetRef.current?.focus(),
  });

  return (
    <>
      <button onClick={() => scrollIntoView({ alignment: "center" })}>Jump to details</button>
      <div style={{ height: "150vh" }} />
      <p ref={targetRef} tabIndex={-1}>Details</p>
    </>
  );
}
```

`useScrollIntoView(target, options?, scrollContainer?)` returns `{ scrollIntoView, cancel }`. It's SSR-safe — nothing touches the DOM until you call it — and the target can be a ref, an element, or a getter function, so it works with whatever you already have.

The options, all optional:

| Option | Default | Notes |
| --- | --- | --- |
| `duration` | `1250` | Milliseconds. `0` jumps instantly. |
| `easing` | `easeInOutQuad` | Any `(t: number) => number` over `0…1`. |
| `axis` | `"y"` | `"x"` for horizontal scrollers. One axis per hook. |
| `offset` | `0` | Extra distance from the edge — the sticky-header allowance. |
| `cancelable` | `true` | Wheel or touch input aborts the animation. |
| `isList` | `false` | Skip the scroll when the target is already in view. |
| `onScrollFinish` | — | Fires when the animation settles. |

And the alignment goes on the call, not the config, because it's usually per-invocation: `scrollIntoView({ alignment: "start" | "center" | "end" })`.

### Cancelable is the one you'll actually feel

With `cancelable: true` (the default) the hook watches for `wheel` and `touchmove` and stops the animation where it is. The user reaches for the scrollbar mid-flight and the page just… lets them. Compare that with `behavior: "smooth"`, which will happily fight a user for a full second.

You can also stop it yourself — closing the modal that triggered the scroll, say:

```tsx
const { scrollIntoView, cancel } = useScrollIntoView(targetRef);
useEffect(() => cancel, [cancel]); // it also cancels on unmount
```

### Reduced motion is handled

The hook reads `prefers-reduced-motion` internally via [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/). When the user has asked for less motion, the easing collapses to its final value and the scroll becomes an instant jump — same destination, same `onScrollFinish`, no animation. You don't write the branch.

### Scrolling inside a container, and sideways

Pass a scroll container as the third argument when you want to move a specific element's scroll position rather than the page:

```tsx
const listRef = useRef<HTMLDivElement>(null);
const itemRef = useRef<HTMLLIElement>(null);

const { scrollIntoView } = useScrollIntoView(itemRef, { isList: true }, listRef);
```

Without the third argument the hook walks up from the target and picks the first ancestor whose computed `overflow-x`/`overflow-y` is `auto` or `scroll`, falling back to the page. That auto-detection is convenient and correct most of the time; pass the container explicitly when you know it.

For a carousel, flip the axis:

```tsx
const { scrollIntoView } = useScrollIntoView(slideRef, { axis: "x", duration: 400 }, trackRef);
scrollIntoView({ alignment: "center" });
```

### Scroll to the first invalid field

The pattern that started this post, with the pieces in the right places:

```tsx
function CheckoutForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstErrorRef = useRef<HTMLDivElement>(null);

  const { scrollIntoView } = useScrollIntoView(firstErrorRef, {
    offset: 96,          // clear the sticky header
    duration: 500,
    onScrollFinish: () => firstErrorRef.current?.querySelector("input")?.focus(),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0) scrollIntoView({ alignment: "start" });
  }

  const firstErrorField = Object.keys(errors)[0];

  return (
    <form onSubmit={onSubmit}>
      {FIELDS.map(f => (
        <Field key={f.name} ref={f.name === firstErrorField ? firstErrorRef : undefined} {...f} />
      ))}
    </form>
  );
}
```

Because the hook resolves the target when you *call* `scrollIntoView` — not when it renders — calling it in the same handler as `setErrors` works even though `firstErrorRef` is attached by the render that `setErrors` triggers. No `flushSync`, no effect. Moving focus in `onScrollFinish` rather than immediately means screen-reader users and sighted users arrive at the same time.

## Gotchas Worth Knowing

- **`offset` doesn't apply to `alignment: "center"`.** It's an allowance measured from the *nearest edge*, so it only affects `"start"` and `"end"`. Centering something under a sticky header means either using `"start"` with an offset, or accepting the center. This one silently does nothing if you assume otherwise.
- **Don't combine it with `scroll-behavior: smooth`.** The hook animates by assigning `scrollTop`/`scrollLeft` every frame. If CSS also says that box scrolls smoothly, the browser tries to animate each of those ~60 assignments and the result is a stuttering mess. Pick one: CSS smooth scrolling *or* this hook, per container.
- **One axis per hook.** `axis` is `"x"` or `"y"`, not both. A grid that needs diagonal movement needs two hooks, or the native call.
- **The auto-detected scroll parent is cached per element.** The first lookup for a given node is remembered. If your layout toggles `overflow` on an ancestor at runtime — a panel that becomes scrollable only when expanded — pass the container as the third argument instead of relying on detection.
- **`cancelable` covers wheel and touch, not keys.** Page Down and the scrollbar don't abort the animation. It's the common case, not every case; call `cancel()` yourself from a keydown handler if that matters to you.
- **`isList` is directional.** With `isList: true` the hook only moves when the target is outside the container on the side implied by `alignment` — a target already visible produces no scroll at all. That's the point (it stops a keyboard-navigated list from jittering on every keystroke), but it means `isList: true` with the wrong alignment can look like the hook is ignoring you.
- **`duration: 0` is an instant jump, not a no-op.** Useful for honouring your own "no animations" setting without branching on which function to call.

## When to Skip the Hook

Native `scrollIntoView` is the right call more often than not:

- **A static anchor or a table-of-contents link** → `el.scrollIntoView({ behavior: "smooth" })` plus `scroll-margin-top`. No dependency, no animation loop.
- **Keyboard navigation in a listbox** → `block: "nearest"` does the minimum-movement behaviour natively, and instant is the correct feel there anyway.
- **You need to align on both axes at once** → the native call takes `block` *and* `inline`.
- **You're scrolling to a position, not an element** → `window.scrollTo` / `el.scrollTo`, or [`useScroll`](https://reactuse.com/browser/usescroll/) to read and react to scroll position.
- **You want to know what's on screen rather than move to it** → [`useIntersectionObserver`](https://reactuse.com/element/useintersectionobserver/), which is also how you highlight the current section in a TOC.
- **You want to stop the page scrolling entirely** (modal open) → [`useScrollLock`](https://reactuse.com/browser/usescrolllock/).

## Takeaways

- The baseline is three lines: `useRef` on the element, `ref.current?.scrollIntoView({ behavior: "smooth" })` in the handler, `?.` because the ref is `null` before commit. Learn `block: "nearest"` — it's the one you'll use most.
- Solve sticky-header overlap with `scroll-margin-top` in CSS, not by subtracting a hard-coded pixel value from `getBoundingClientRect()`. It survives responsive headers and fixes `:target` anchors too.
- To scroll to something you just rendered, scroll in an effect keyed on the change, or use a callback ref. `flushSync` works but gives up batching — keep it as an escape hatch.
- Native smooth scrolling has no duration control, no dependable completion event, no cancel, and no `prefers-reduced-motion` handling. If none of those matter, don't add a dependency.
- [`useScrollIntoView`](https://reactuse.com/browser/usescrollintoview/) covers exactly those gaps — configurable `duration`/`easing`, `onScrollFinish`, wheel-and-touch cancellation, automatic reduced-motion fallback, plus `offset`, horizontal `axis`, an explicit scroll container, and `isList` for jitter-free list navigation. It resolves the target at call time, so it works in the same handler as the `setState` that rendered it.

`useScrollIntoView`, `useScroll`, `useScrollLock`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
