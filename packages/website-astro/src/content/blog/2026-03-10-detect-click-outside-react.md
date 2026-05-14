---
title: "How to Detect Click Outside an Element in React"
description: "Learn how to detect clicks outside an element in React using the useClickOutside hook. Perfect for modals, dropdowns, and popover menus."
slug: detect-click-outside-react
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
tags: [react, hooks, tutorial, useClickOutside]
keywords: [react click outside, detect click outside react, useClickOutside, close modal on outside click, react dropdown close]
image: /img/og.png
---

# How to Detect Click Outside an Element in React

Detecting clicks outside an element is one of the most common UI patterns in React. It's essential for closing modals, dropdown menus, popover menus, and tooltips when a user clicks elsewhere on the page.

<!-- truncate -->

## The Problem

When building interactive components like dropdown menus or modals, you need to close them when the user clicks anywhere outside. Implementing this manually requires:

1. Adding a document-level click event listener
2. Checking if the click target is inside or outside your element
3. Cleaning up the listener on unmount
4. Handling edge cases (portals, nested elements, etc.)

## The Manual Approach

Here's how most developers implement this from scratch:

```tsx
import { useEffect, useRef } from "react";

function Dropdown() {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return <div ref={ref}>{/* dropdown content */}</div>;
}
```

This works, but you'll repeat this pattern everywhere. And it misses edge cases like touch events, iframe clicks, and shadow DOM.

## The Better Way: useClickOutside

[ReactUse](https://reactuse.com) provides `useClickOutside` that handles all of this for you:

```tsx
import { useClickOutside } from "@reactuses/core";
import { useRef, useState } from "react";

function Dropdown() {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(ref, () => {
    setIsOpen(false);
  });

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Menu</button>
      {isOpen && (
        <div ref={ref}>
          <p>Click outside to close</p>
        </div>
      )}
    </div>
  );
}
```

## Common Use Cases

- **Modal dialogs** — close when clicking the backdrop
- **Dropdown menus** — close when clicking outside the menu
- **Tooltip/Popover** — dismiss on outside interaction
- **Search autocomplete** — close suggestions panel
- **Context menus** — dismiss custom right-click menus

## Try It Live

Check out the [interactive demo](https://reactuse.com/element/useclickoutside/) on our documentation site, where you can edit the code and see results in real-time.

## Installation

```bash
npm i @reactuses/core
```

## Related Hooks

- [useClickOutside documentation](https://reactuse.com/element/useclickoutside/)
- [useEventListener](https://reactuse.com/effect/useeventlistener/) — for custom event handling
- [useFocus](https://reactuse.com/element/usefocus/) — for tracking focus state

---

ReactUse provides 100+ hooks for React. [Explore them all →](https://reactuse.com)
