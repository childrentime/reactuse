---
title: "React useObjectUrl Hook: Preview Files & Blobs Without Memory Leaks (2026)"
description: "A practical guide to the useObjectUrl hook in React: turns any File, Blob, or MediaSource into a URL.createObjectURL() string and automatically revokes it on every change and unmount, so preview URLs never pile up in memory. SSR-safe, TypeScript-first."
slug: react-useobjecturl-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-10
tags: [react, hooks, browser-api, typescript, tutorial]
keywords: [react useObjectUrl, useObjectUrl hook, useobjecturl react, react blob url, react file preview hook, URL.createObjectURL react, react memory leak file upload, react image preview hook, revokeObjectURL react, react MediaSource hook, react video preview, useObjectUrl typescript]
image: /img/og.png
---

# React useObjectUrl Hook: Preview Files & Blobs Without Memory Leaks (2026)

A user uploads a dozen images to a gallery editor. Each one gets a live preview via `URL.createObjectURL()`. The session runs for twenty minutes, previews get swapped as files are added and removed, and the tab's memory usage climbs the entire time — because every `createObjectURL()` call has to be paired with a `revokeObjectURL()` call, and that pairing has to survive re-renders, prop changes, and unmounts. Most components get it wrong, and the bug is invisible until someone leaves the tab open long enough to notice the fan spin up.

`useObjectUrl` is the one-line fix: hand it a `File`, `Blob`, or `MediaSource`, get back a URL string, and never call `revokeObjectURL` yourself again. Everything below is the real [`@reactuses/core`](https://reactuse.com) API, TypeScript-first.

<!-- truncate -->

## The Manual Version, and Where It Leaks

`URL.createObjectURL()` is the browser API behind every client-side file preview: pass it a `Blob` (a `File` is one) and it hands back a `blob:` URL you can drop straight into an `<img src>` or `<video src>`. The catch is on the other end — every URL it mints stays alive, holding a reference to the underlying data, until you explicitly call `URL.revokeObjectURL()`. Forget that call, or call it at the wrong time, and the URL — and the memory behind it — never gets released.

In a React component, "the wrong time" is easy to hit:

```tsx
function FilePreview({ file }: { file?: File }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!file) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url ? <img src={url} /> : null;
}
```

This one is actually correct — the cleanup closes over `next`, not over state, so it always revokes exactly the URL it created. But it's correct in the way hand-rolled effects tend to be: one careless refactor away from breaking. Move the `URL.createObjectURL` call outside the effect, memoize it wrong, or read `url` from state instead of the local `next`, and the pairing silently comes apart. Multiply this pattern across every component that previews a file — an avatar uploader, a chat attachment, a gallery thumbnail — and you're maintaining the same fragile lifecycle logic in five different places.

## useObjectUrl — Create and Revoke, Handled

```tsx
import { useObjectUrl } from '@reactuses/core';

function FilePreview({ file }: { file?: File }) {
  const url = useObjectUrl(file);
  return url ? <img src={url} /> : null;
}
```

That's the whole hook. The signature:

```ts
function useObjectUrl(object: Blob | MediaSource): string | undefined;
```

Pass a `Blob` (or the `File` subtype of it) or a [`MediaSource`](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource), get back the object URL — or `undefined` before a source exists. Internally it's one `useEffect`: call `URL.createObjectURL()` when the source is present, and return a cleanup that calls `URL.revokeObjectURL()`. The difference from the hand-rolled version isn't behavior, it's that the pairing lives in one audited place instead of being re-derived per component.

## When the Source Changes — and When It Unmounts

The revoke fires in both cases that matter:

- **The source changes.** Swap the `file` prop for a different `File` and the hook revokes the old URL before minting the new one — no accumulation as a user clicks through a list of attachments.
- **The component unmounts.** Close the preview modal, navigate away, remove the item from a list — the cleanup runs and the URL is released. Nothing is left waiting for a garbage collector that doesn't know to collect it.

That second case is the one hand-rolled code most often skips, because it only shows up as a slow memory creep during actual use, not in a quick manual test.

## Real Use Cases

- **File input previews.** Show the image, video, or PDF a user just selected before they commit to uploading it — the canonical case, and the one in the demo below.
- **Blob API responses.** An endpoint that returns a `Blob` (a generated export, a signed asset, a `fetch().blob()` result) can be turned into a downloadable `<a href>` or an inline `<img>`/`<video>` without writing it to disk.
- **Canvas exports.** `canvas.toBlob()` produces a `Blob`; feed it straight into `useObjectUrl` to preview or offer a download of what the user just drew or cropped.
- **`MediaSource` for custom video players.** `MediaSource` is the [Media Source Extensions](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) object behind adaptive streaming and custom-buffered video — you build the stream programmatically, then still need a URL to hand to `<video src>`. `useObjectUrl` accepts it directly, same as a `Blob`.

## SSR-Safe by Construction

`URL.createObjectURL` doesn't exist on the server — there's no DOM, no `Blob` URLs to mint. `useObjectUrl` never touches the `URL` API during server rendering; it returns `undefined` until the effect runs on the client, so there's no `typeof window` guard to remember and no server crash to debug. If you're auditing other hand-rolled browser-API code for the same gap, [SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/) covers the general pattern.

## The File-Handling Trio

`useObjectUrl` is one piece of a small set of hooks that cover the full file lifecycle — picking a file, dropping a file, and previewing it:

| Hook | Role |
| --- | --- |
| [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) | Opens the native file picker, returns the selected `FileList` |
| [`useDropZone`](https://reactuse.com/element/usedropzone/) | Turns any element into a drag-and-drop target for files |
| [`useObjectUrl`](https://reactuse.com/browser/useobjecturl/) | Turns the resulting `File`/`Blob` into a safe, auto-revoked preview URL |

Wire a `useFileDialog` or `useDropZone` result straight into `useObjectUrl` and the preview step needs no cleanup code at all. The full walkthrough — including a multi-file gallery that combines all three — is in [React File Handling](https://reactuse.com/blog/react-file-handling/).

## Takeaways

- **The core problem is a pairing bug.** Every `URL.createObjectURL()` needs a matching `URL.revokeObjectURL()`, and re-deriving that pairing correctly in every component that shows a file preview is where memory leaks creep in.
- **`useObjectUrl(object)`** takes a `Blob` (or `File`) or `MediaSource` and returns the URL string, or `undefined` before a source exists.
- **Revocation is automatic** on both triggers that matter: the source changing and the component unmounting.
- Covers more than image previews: Blob API responses, `canvas.toBlob()` exports, and `MediaSource` for custom video players.
- **SSR-safe** — returns `undefined` on the server, no `URL` API access, no guard code needed.
- Pairs with [`useFileDialog`](https://reactuse.com/browser/usefiledialog/) and [`useDropZone`](https://reactuse.com/element/usedropzone/) to cover selection, drop, and preview with zero manual lifecycle management.

Grab it from [`@reactuses/core`](https://reactuse.com/browser/useobjecturl/) and stop auditing components for missing `revokeObjectURL` calls.
