---
title: "React useDropZone Hook: Build a File Drop Zone (2026)"
description: "A practical guide to useDropZone in React: the dragenter/dragleave nested-element flicker bug and how the hook's internal counter fixes it, the drop callback shape, pairing with useFileDialog for a keyboard-accessible fallback, and the SSR-safe rules. TypeScript-first."
slug: react-usedropzone-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-28
tags: [react, hooks, element, typescript, tutorial]
keywords: [react useDropZone, useDropZone hook, usedropzone react, react drop zone hook, react drag and drop files, react file drop, drag and drop react hook, useDropZone typescript, react dragenter dragleave, react file upload dropzone]
image: /img/og.png
---

# React useDropZone Hook: Build a File Drop Zone (2026)

Drag a file over a drop zone that has any child element inside it — an icon, a label, a preview thumbnail — and a hand-rolled `isOver` toggle starts flickering: `true`, `false`, `true`, `false`, as the cursor crosses from the container onto the child and back. The highlight border blinks the whole time the file is over the zone. The bug isn't in your event handler logic; it's in what `dragenter` and `dragleave` actually fire on.

`useDropZone` from [`@reactuses/core`](https://reactuse.com) turns a DOM element into a file drop target with none of that flicker, plus a callback that hands you the dropped `File[]` directly. The internals are short enough to read in one sitting, so this post walks through the real bug it fixes and the real API, TypeScript-first.

<!-- truncate -->

## The Manual Version, and Where It Frays

The obvious first attempt pairs `dragenter`/`dragleave` with a boolean:

```tsx
function DropZone() {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragEnter={() => setIsOver(true)}
      onDragLeave={() => setIsOver(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        console.log(e.dataTransfer.files);
      }}
      style={{ border: isOver ? "2px solid blue" : "2px dashed gray" }}
    >
      <span>Drop files here</span>
    </div>
  );
}
```

It looks right, and it's wrong the moment the zone has a child node. Here's the part that isn't obvious: `dragenter` and `dragleave` fire on whatever element the pointer is over, and they **bubble**. Drag a file across the `<span>` inside the div above, and the browser fires, in order: `dragenter` on the div, `dragenter` on the span (bubbles to the div — no-op for this handler), `dragleave` on the div as the pointer crosses onto the span, then `dragenter` on the span again as it re-enters. Your `setIsOver(false)` on that middle `dragleave` fires even though the cursor never left the drop zone — it just crossed a child boundary. The border flickers for as long as the file hovers over any nested content.

Two more things people get wrong the first time:

- **Skip `preventDefault()` on `dragover`, and `drop` never fires at all.** The browser's default action for `dragover` is "reject the drop" — no `preventDefault`, no `drop` event, full stop.
- **The dropped payload isn't a plain array.** `event.dataTransfer.files` is a `FileList`, not a `File[]` — no `.map`, no `.filter`, until you convert it.

## useDropZone — Fixing the Flicker with a Counter

```tsx
import { useRef } from 'react';
import { useDropZone } from '@reactuses/core';

function DropZone() {
  const ref = useRef<HTMLDivElement>(null);
  const isOver = useDropZone(ref, (files) => {
    console.log(files); // File[] | null
  });

  return (
    <div ref={ref} style={{ border: isOver ? "2px solid blue" : "2px dashed gray" }}>
      <span>Drop files here</span>
    </div>
  );
}
```

The signature:

```ts
function useDropZone(
  target: BasicTarget<EventTarget>,
  onDrop?: (files: File[] | null) => void
): boolean;
```

The fix for the nesting bug is a plain integer, not a debounce or a `relatedTarget` check — [the actual implementation](https://github.com/childrentime/reactuse) is short enough to quote in full:

```ts
const counter = useRef(0);

useEventListener('dragenter', (e) => {
  e.preventDefault();
  counter.current += 1;
  setOver(true);
}, target);

useEventListener('dragleave', (e) => {
  e.preventDefault();
  counter.current -= 1;
  if (counter.current === 0) setOver(false);
}, target);

useEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  counter.current = 0;
  setOver(false);
  const files = Array.from(e.dataTransfer?.files ?? []);
  onDrop?.(files.length === 0 ? null : files);
}, target);
```

Every `dragenter` — container or child — increments the counter; every `dragleave` decrements it. `isOver` only flips back to `false` when the counter returns to zero, which happens exactly when the pointer has left every element in the subtree, container included. Entering a child increments then immediately re-increments (net positive), so the count never dips to zero mid-hover. It's the same technique used to solve the identical bubbling problem for `mouseenter`/`mouseleave` chains, applied to drag events. `preventDefault()` is already called for you on all four events, so `drop` fires reliably and the browser never tries to navigate to a dropped file.

## What onDrop Actually Gives You

- **`target` accepts any `EventTarget`**, not just `HTMLElement` — it's a ref, wired up through the same `useEventListener` the rest of the library's DOM hooks use, so listeners attach and detach with the component lifecycle automatically.
- **The callback receives `File[]`, already converted** from the raw `FileList` — no `Array.from` needed at the call site.
- **Dropping something that isn't files — a link, selected text — calls back with `null`**, not an empty array. Check for `null` before assuming `files[0]` exists.
- **A drop resets the counter to `0` unconditionally.** Even if the browser's `dragenter`/`dragleave` bookkeeping somehow drifted, every completed drop starts the next hover cycle clean.

## Pairing with useFileDialog: The Accessibility Gap

Drag-and-drop has a real gap: it's mouse- and touch-only. There's no keyboard equivalent to "drag a file from the desktop," so a drop zone that's *only* a drop zone is unusable for keyboard and screen-reader users. The fix is a visible "or browse files" fallback, and [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) is built for exactly that pairing — it opens the native file picker without a hidden `<input>`:

```tsx
import { useRef } from 'react';
import { useDropZone, useFileDialog } from '@reactuses/core';

function Uploader({ onFiles }: { onFiles: (files: File[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isOver = useDropZone(ref, (files) => files && onFiles(files));
  const [dialogFiles, open] = useFileDialog({ accept: 'image/*' });

  return (
    <div ref={ref} style={{ border: isOver ? "2px solid blue" : "2px dashed gray" }}>
      <p>Drag files here, or</p>
      <button onClick={() => open()}>browse files</button>
    </div>
  );
}
```

Same visual drop target, plus a real `<button>` that a keyboard user can tab to and activate — two paths into the same upload flow.

## Real Use Cases

- **Custom-styled upload widgets.** The default `<input type="file">` can't be restyled in most browsers; a `useDropZone` + `useFileDialog` pair gives full control over the drop target's appearance while keeping both drag and click working.
- **Image galleries and media managers.** Drop a batch of images onto a gallery grid, feed each `File` into [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/) to get an instant preview `blob:` URL before any upload request completes.
- **CMS and form-builder drop targets.** Editors that accept dragged assets (a hero image field, a document attachment slot) need exactly the flicker-free `isOver` state to render a convincing "drop here" highlight.
- **Multi-zone uploaders.** Because `target` is just a ref, the same hook instantiated against different refs gives each zone (e.g., "cover image" vs. "gallery images" in one form) independent, correctly isolated hover state.

## SSR Safety

`useDropZone` never touches `document` or `window` at the top level — all four listeners are attached through `useEventListener`, which only runs inside an effect, after the component has mounted on the client. On the server, `isOver` simply renders as its initial `false`, and there's no DOM to attach to yet, so there's no hydration mismatch to guard against — unlike hooks that read a value (a cookie, `localStorage`) that can differ between server and client. Nothing extra to configure here.

## Takeaways

- **The nesting flicker is a bubbling problem, not a logic bug** — a naive boolean toggle breaks the instant a drop zone has any child element. [`useDropZone`](https://reactuse.com/element/usedropzone/) fixes it with an enter/leave counter that only zeroes out when the pointer has actually left the whole subtree.
- **`preventDefault()` on `dragover` is non-negotiable** — skip it and `drop` never fires. The hook calls it on all four events for you.
- **`onDrop` hands you a real `File[]` (or `null`)** — already converted from the raw `FileList`, with `null` distinguishing "no files were dropped" from "dropped zero files."
- **Drag-and-drop alone excludes keyboard users** — pair it with [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) so there's always a clickable, tabbable way into the same upload flow.
- **No SSR ceremony needed** — the hook attaches nothing until the client mounts, so there's no server/client mismatch to design around.

Grab it from [`@reactuses/core`](https://reactuse.com/element/usedropzone/) and stop debugging drag-event bubbling by hand.
