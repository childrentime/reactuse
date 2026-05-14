---
title: "Copy to Clipboard in React: A Complete Guide"
description: "Learn how to copy text to the clipboard in React using the modern Clipboard API and the useClipboard hook. Covers permissions, HTTPS requirements, fallbacks, and common use cases."
slug: react-copy-to-clipboard
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, clipboard, useClipboard]
keywords: [react copy to clipboard, useClipboard, react clipboard api, copy text react, react copy button]
image: /img/og.png
---

# Copy to Clipboard in React: A Complete Guide

Copying text to the clipboard sounds simple, but getting it right in React involves browser permissions, HTTPS requirements, and graceful fallbacks. This guide walks you through the evolution of clipboard access on the web and shows you the cleanest way to handle it today.

<!-- truncate -->

## The Old Way: document.execCommand

Before the Clipboard API existed, copying text meant creating a hidden textarea, selecting its contents, and calling `document.execCommand("copy")`:

```tsx
function copyToClipboard(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
```

This approach has serious problems. It is synchronous and blocks the main thread. It requires creating and removing DOM elements. It has been deprecated in all major browsers, and it has inconsistent behavior across devices, especially on iOS.

## The Modern Clipboard API

Browsers now provide `navigator.clipboard`, a promise-based API that is cleaner and more reliable:

```tsx
await navigator.clipboard.writeText("Hello, world!");
const text = await navigator.clipboard.readText();
```

This is the right foundation, but using it directly in React components introduces several challenges.

## Why It's Tricky

### Permissions

The Clipboard API requires explicit user permission. Browsers may prompt users before allowing read access, and some will silently deny access if the call does not originate from a user gesture like a click.

### HTTPS Only

`navigator.clipboard` is only available in secure contexts. If your app runs on `http://localhost` during development that is fine, but any deployed site must use HTTPS.

### SSR and Server Components

`navigator.clipboard` does not exist on the server. If you are using Next.js, Remix, or any SSR framework, referencing it at the module level will throw a `ReferenceError`.

### Fallbacks and Error Handling

You need to handle cases where the API is unavailable, the user denies permission, or the document is not focused. That is a lot of defensive code to write every time you need a copy button.

## useClipboard to the Rescue

The [useClipboard](https://reactuse.com/browser/useclipboard/) hook from ReactUse wraps all of this complexity into a simple, two-value tuple:

```tsx
import { useClipboard } from "@reactuses/core";

function App() {
  const [clipboardText, copy] = useClipboard();

  return (
    <div>
      <p>Current clipboard: {clipboardText}</p>
      <button onClick={() => copy("Copied with useClipboard!")}>
        Copy Text
      </button>
    </div>
  );
}
```

The hook returns:

- **`clipboardText`** — the current contents of the clipboard, updated automatically on copy, cut, and focus events.
- **`copy(text)`** — an async function that writes text to the clipboard.

Under the hood, `useClipboard` listens for `copy`, `cut`, and `focus` events so the displayed clipboard value stays in sync. It also guards against reading the clipboard when the document is not focused, which would otherwise throw an error in most browsers.

## Building a Copy Button with Feedback

Users need visual confirmation that a copy action succeeded. Here is a reusable component that shows a brief "Copied!" message:

```tsx
import { useState } from "react";
import { useClipboard } from "@reactuses/core";

function CopyButton({ text }: { text: string }) {
  const [, copy] = useClipboard();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copy(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  return (
    <button onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
```

Because `copy` returns a promise, you can catch errors and provide feedback for both success and failure states.

## Common Use Cases

### Code Blocks

Add a copy button to syntax-highlighted code blocks so readers can grab snippets without manually selecting text:

```tsx
<div style={{ position: "relative" }}>
  <pre><code>{codeSnippet}</code></pre>
  <CopyButton text={codeSnippet} />
</div>
```

### Share Links

Let users copy a shareable URL with one click instead of relying on the browser's address bar:

```tsx
<CopyButton text={`https://myapp.com/post/${postId}`} />
```

### Form Values

Copy generated values like API keys, invite codes, or configuration strings directly from a form field:

```tsx
function ApiKeyField({ apiKey }: { apiKey: string }) {
  const [, copy] = useClipboard();

  return (
    <div>
      <input readOnly value={apiKey} />
      <button onClick={() => copy(apiKey)}>Copy Key</button>
    </div>
  );
}
```

## Installation

```bash
npm i @reactuses/core
```

Then import the hook:

```tsx
import { useClipboard } from "@reactuses/core";
```

## Related Hooks

- [useClipboard documentation](https://reactuse.com/browser/useclipboard/) — full API reference and live demo
- [usePermission](https://reactuse.com/browser/usepermission/) — check whether the clipboard-read permission has been granted
- [useEventListener](https://reactuse.com/effect/useeventlistener/) — the lower-level hook used internally by useClipboard
- [useSupported](https://reactuse.com/state/usesupported/) — detect whether the Clipboard API is available in the current environment

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
