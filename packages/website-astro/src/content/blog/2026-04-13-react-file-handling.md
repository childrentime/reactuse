---
title: "React File Handling: Uploads, Drop Zones, and Object URLs"
description: "Build file pickers, drag-and-drop upload zones, image previews, and dynamic script loaders in React using composable hooks from ReactUse."
slug: react-file-handling
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-04-13
tags: [react, hooks, files, upload, tutorial]
keywords: [react file upload, useFileDialog, useDropZone, useObjectUrl, react drag and drop upload, useScriptTag, react file preview, react upload hook]
image: /img/og.png
---

# React File Handling: Uploads, Drop Zones, and Object URLs

Every non-trivial app eventually needs to handle files. A profile editor needs an avatar uploader. A note-taking app needs to attach images. A CSV importer needs a drop zone. A photo gallery needs thumbnails generated on the client. And every one of these features ends up rebuilt from scratch, because file handling in React touches three different browser APIs (`<input type="file">`, the Drag and Drop API, and `URL.createObjectURL`) plus React's own ref and effect machinery -- and most developers wire them together fresh each time.

<!-- truncate -->

This post walks through four file-handling primitives that every React app needs eventually: a file picker that opens a dialog without rendering a hidden `<input>`, a drop zone that accepts dragged files, an object URL helper that previews images without leaks, and a dynamic script loader for third-party libraries you only need on demand. For each one, we will write the manual implementation first so you understand what is happening under the hood, then swap it out for a purpose-built hook from [ReactUse](https://reactuse.com). At the end, we will combine all four into a complete photo upload widget that picks, drops, previews, and processes images with an on-demand image library.

## 1. Picking Files Without a Hidden Input

### The Manual Way

The traditional file picker pattern in React looks innocent but hides several footguns:

```tsx
import { useRef, useState } from "react";

function ManualFilePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => setFiles(e.target.files)}
      />
      <button onClick={() => inputRef.current?.click()}>
        Pick images
      </button>
      {files && <p>{files.length} file(s) selected</p>}
    </div>
  );
}
```

This works, but the moment you try to use it twice the seams show. The hidden `<input>` lives in your render tree, which means your styling reset has to be aware of it. Resetting the selection requires writing to `inputRef.current.value = ""` -- a side effect imperative enough that React linters will warn about it. And if you want to await the user's selection (say, inside an async handler that processes the files), you have to invent a one-shot promise yourself.

You also cannot reuse the same component twice on the same page without colliding refs. And if the user picks the same file twice, the `change` event will not fire the second time -- a famous gotcha that has tripped up generations of React devs.

### The ReactUse Way: useFileDialog

`useFileDialog` lifts the entire input element out of the render tree and gives you a tuple of `[files, open, reset]`:

```tsx
import { useFileDialog } from "@reactuses/core";

function ImagePicker() {
  const [files, open, reset] = useFileDialog({
    multiple: true,
    accept: "image/*",
  });

  return (
    <div>
      <button onClick={() => open()}>Pick images</button>
      <button onClick={reset} disabled={!files}>
        Reset
      </button>
      {files && (
        <ul>
          {Array.from(files).map((file) => (
            <li key={file.name}>
              {file.name} -- {(file.size / 1024).toFixed(1)} KB
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Three small but important things that the manual version got wrong:

1. **No hidden DOM**. The input is created in memory, not in your render tree. Your component output is just the button.
2. **Per-call options**. Pass options to `open()` directly, and they override the hook-level defaults. Want to reuse the same picker for either documents or images? Pass `accept` at call time.
3. **Real reset**. `reset()` clears both React state and the underlying input element so the same file can be selected again.

The `open()` function also returns a promise that resolves to the picked files. That makes async flows much cleaner:

```tsx
const handleUpload = async () => {
  const picked = await open();
  if (!picked) return;
  await uploadAll(Array.from(picked));
};
```

You no longer have to split your logic across an `onChange` handler and a button click handler. The picker is just an awaitable function.

## 2. Drag and Drop File Zones

### The Manual Way

Drag and drop is one of those APIs that looks simple in a tutorial and falls apart in production. The naive version:

```tsx
function ManualDropZone({ onFiles }: { onFiles: (f: File[]) => void }) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      style={{
        border: over ? "2px solid blue" : "2px dashed gray",
        padding: 40,
      }}
    >
      Drop files here
    </div>
  );
}
```

This *seems* to work until a user drags over a child element. The browser fires `dragleave` on the parent the instant the cursor crosses into a child, even though logically the file is still over the zone. Your border flickers. Your `over` state becomes a lie. To fix it properly, you have to track `dragenter` and `dragleave` with a counter, decrement on leave, and only consider the file "gone" when the counter hits zero. You also have to call `preventDefault` on `dragover` -- otherwise drop will not fire at all -- and remember that `dataTransfer.files` is an `FileList`, not an `Array`.

Most production drop zones get this wrong. The flicker is the tell.

### The ReactUse Way: useDropZone

`useDropZone` does the counter dance for you:

```tsx
import { useRef } from "react";
import { useDropZone } from "@reactuses/core";

function CsvDropZone() {
  const dropRef = useRef<HTMLDivElement>(null);
  const isOver = useDropZone(dropRef, (files) => {
    if (!files) return;
    const csvs = files.filter((f) => f.name.endsWith(".csv"));
    console.log("Dropped CSVs:", csvs);
  });

  return (
    <div
      ref={dropRef}
      style={{
        border: isOver ? "2px solid #3b82f6" : "2px dashed #cbd5e1",
        background: isOver ? "#eff6ff" : "transparent",
        padding: 60,
        borderRadius: 12,
        textAlign: "center",
        transition: "all 120ms ease",
      }}
    >
      <p style={{ margin: 0 }}>
        {isOver ? "Release to upload" : "Drag CSV files here"}
      </p>
    </div>
  );
}
```

Notice the API is essentially `(target, onDrop) => isOver`. That is it. The hook handles `dragenter`/`dragover`/`dragleave`/`drop` internally, maintains the enter/leave counter so child elements do not break the highlight, prevents the browser's default open-as-new-tab behavior, and gives you back a single boolean to drive your styling.

The callback receives `File[] | null` -- `null` when an empty drag happens (yes, that is a thing on some browsers when a user drags non-file content). Your handler can check once and bail out cleanly.

## 3. Previewing Files with Object URLs

### The Manual Way

Once you have a `File` in hand, you usually want to show it to the user. The browser gives you `URL.createObjectURL(blob)` to turn any blob into a temporary URL you can stick in an `<img>` or `<video>`. The catch: every URL you create allocates memory, and you have to remember to call `URL.revokeObjectURL` when you are done -- otherwise you leak. In React, "when you are done" usually means "when the component unmounts or the file changes", which is exactly the kind of timing problem effects exist for, and exactly the kind of thing developers forget:

```tsx
function ManualImagePreview({ file }: { file: File | null }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!file) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  if (!url) return null;
  return <img src={url} alt={file?.name} />;
}
```

This is correct, but it is the kind of correct that is one careless edit away from a leak. The cleanup function and the `createObjectURL` call have to stay paired forever. Add a conditional return or a forgotten dependency and you have a bug that only shows up in long-lived sessions.

### The ReactUse Way: useObjectUrl

`useObjectUrl` is the single-line version of that effect:

```tsx
import { useObjectUrl } from "@reactuses/core";

function ImagePreview({ file }: { file: File }) {
  const url = useObjectUrl(file);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={file.name}
      style={{ maxWidth: 200, borderRadius: 8 }}
    />
  );
}
```

The hook owns the lifecycle. When the `file` prop changes, it revokes the old URL and creates a new one. When the component unmounts, it revokes the last one. There is no way to forget the cleanup because you never write it in the first place.

## 4. Loading Third-Party Scripts on Demand

### The Manual Way

Sometimes the file you want to handle is too big or too rare to ship in your main bundle. Image cropping libraries, PDF parsers, OCR engines, video transcoders -- all of them are dozens of megabytes and worth nothing to a user who never uploads anything. You only want to pay for them after the first file lands.

Loading a script tag manually inside React is a small recipe of its own:

```tsx
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

function ManualImageProcessor() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadScript("https://cdn.example.com/heavy-image-lib.js")
      .then(() => setReady(true))
      .catch(console.error);
    // No cleanup -- once loaded, we leave it
  }, []);

  return ready ? <Editor /> : <p>Loading editor...</p>;
}
```

This handles the happy path but ignores the messy ones: what if the same script is loaded by two components at once (race condition)? What if the script fails halfway and you want to retry? What if you want to actively unload it when the component goes away?

### The ReactUse Way: useScriptTag

`useScriptTag` returns the same primitives you would have written, but with the edge cases handled:

```tsx
import { useScriptTag } from "@reactuses/core";

function HeavyImageEditor() {
  const [, status, , unload] = useScriptTag(
    "https://cdn.example.com/image-editor.js",
    () => console.log("Editor library ready"),
    { manual: false, async: true },
  );

  if (status === "loading") return <p>Downloading editor...</p>;
  if (status === "error") return <p>Failed to load editor</p>;
  if (status !== "ready") return null;

  return <ImageEditorComponent onClose={unload} />;
}
```

Four things you get for free:

1. **Singleton behavior**. If the same script URL is requested twice, the hook deduplicates -- no race conditions, no double loads.
2. **Status state**. `idle`/`loading`/`ready`/`error` lets you render exactly the right thing at every step.
3. **Manual control**. Set `manual: true` and the script will not load until you call the returned `load()` function -- perfect for "load on first interaction" patterns.
4. **Unload**. Call `unload()` to remove the script tag from the document. Useful if you want the heavy library out of memory once the user closes the editor.

## Putting It All Together: A Photo Upload Widget

Now we combine all four hooks into a single component: a photo upload widget that lets users pick or drop images, previews them on the fly, and lazy-loads a hypothetical client-side resize library only the first time it is needed.

```tsx
import { useRef, useState } from "react";
import {
  useFileDialog,
  useDropZone,
  useObjectUrl,
  useScriptTag,
} from "@reactuses/core";

interface QueuedImage {
  file: File;
  id: string;
}

function Thumbnail({ image }: { image: QueuedImage }) {
  const url = useObjectUrl(image.file);
  return (
    <figure
      style={{
        margin: 0,
        padding: 8,
        background: "#f8fafc",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      {url && (
        <img
          src={url}
          alt={image.file.name}
          style={{
            width: 120,
            height: 120,
            objectFit: "cover",
            borderRadius: 4,
          }}
        />
      )}
      <figcaption
        style={{
          marginTop: 6,
          fontSize: 12,
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {image.file.name}
      </figcaption>
    </figure>
  );
}

function PhotoUploadWidget() {
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [shouldLoadResizer, setShouldLoadResizer] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const [, openPicker, resetPicker] = useFileDialog({
    multiple: true,
    accept: "image/*",
  });

  const isOver = useDropZone(dropRef, (files) => {
    if (!files) return;
    addFiles(files);
  });

  const [, resizerStatus] = useScriptTag(
    "https://cdn.example.com/image-resize.js",
    () => console.log("Resizer ready"),
    { manual: !shouldLoadResizer },
  );

  const addFiles = (files: File[]) => {
    const newImages = files
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        file,
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
      }));
    setQueue((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) setShouldLoadResizer(true);
  };

  const handlePick = async () => {
    const picked = await openPicker();
    if (picked) addFiles(Array.from(picked));
  };

  const clearAll = () => {
    setQueue([]);
    resetPicker();
  };

  return (
    <div style={{ maxWidth: 720, fontFamily: "system-ui, sans-serif" }}>
      <div
        ref={dropRef}
        style={{
          border: isOver ? "2px solid #3b82f6" : "2px dashed #cbd5e1",
          background: isOver ? "#eff6ff" : "#ffffff",
          padding: 48,
          borderRadius: 16,
          textAlign: "center",
          transition: "all 120ms ease",
        }}
      >
        <p style={{ marginTop: 0, fontSize: 18 }}>
          {isOver ? "Drop to upload" : "Drag photos here"}
        </p>
        <button
          onClick={handlePick}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #3b82f6",
            background: "#3b82f6",
            color: "white",
            cursor: "pointer",
          }}
        >
          Or pick from device
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, color: "#64748b" }}>
          {queue.length} image(s) queued
          {shouldLoadResizer && ` -- resizer: ${resizerStatus}`}
        </span>
        {queue.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {queue.length > 0 && (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {queue.map((image) => (
            <Thumbnail key={image.id} image={image} />
          ))}
        </div>
      )}
    </div>
  );
}
```

Four hooks, four responsibilities, zero overlap:

- **`useFileDialog`** owns the click-to-pick flow with an awaitable promise
- **`useDropZone`** handles drag-and-drop without flicker on child elements
- **`useObjectUrl`** generates and revokes preview URLs per thumbnail, tied to component lifecycle
- **`useScriptTag`** lazy-loads the resize library only after the first image arrives, and only once per session

The composition is natural because every hook does one thing. Refs are not shared between them. Effects do not cascade. The component you ship is roughly 100 lines of mostly markup and styling, with the tricky browser plumbing tucked away inside hooks that have been tested and SSR-hardened by the library.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) -- Open a file picker dialog without rendering a hidden input
- [`useDropZone`](https://reactuse.com/element/usedropzone/) -- Track files being dragged over an element with proper child-aware highlighting
- [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/) -- Create and auto-revoke URLs for File and Blob objects
- [`useScriptTag`](https://reactuse.com/browser/usescripttag/) -- Dynamically load external scripts with status tracking and unload support
- [`useEventListener`](https://reactuse.com/effect/useeventlistener/) -- Attach event listeners declaratively for custom upload progress events
- [`useSupported`](https://reactuse.com/state/usesupported/) -- Check whether the browser supports a given API reactively

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
