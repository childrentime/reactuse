---
title: "Building Accessible React Components with Hooks"
description: "Learn how to respect user preferences for reduced motion, color contrast, and color scheme in React using accessibility hooks from ReactUse."
slug: react-accessibility-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-03-25
tags: [react, hooks, accessibility, a11y, tutorial]
keywords: [react accessibility, useReducedMotion, prefers-reduced-motion, react a11y hooks, accessible react components, prefers-color-scheme, prefers-contrast]
image: /img/og.png
---

# Building Accessible React Components with Hooks

Accessibility is not a checklist you run through before launch. It is a design constraint that shapes how your application behaves from the first line of code. When we talk about accessibility in React, most developers think of ARIA attributes, semantic HTML, and screen reader support. Those matter. But there is an entire category of accessibility that gets far less attention: **respecting the preferences your users have already set at the operating system level**.

<!-- truncate -->

Every major operating system lets users configure preferences like reduced motion, high contrast, dark mode, and text direction. These are not cosmetic choices. A user who enables "reduce motion" may experience vestibular disorders that make animated transitions physically uncomfortable. A user who enables high contrast may have low vision. When your React application ignores these signals, it is not just a missed feature — it is a barrier.

This article shows you how to detect and respond to these OS-level preferences in React using hooks from [ReactUse](https://reactuse.com). We will cover reduced motion, contrast preferences, color scheme detection, focus management, and text direction — then bring everything together in a practical component.

## The Problem with Manual Media Query Listeners

The browser exposes OS-level preferences through CSS media queries like `prefers-reduced-motion`, `prefers-contrast`, and `prefers-color-scheme`. You can read these in JavaScript using `window.matchMedia`. Here is what the manual approach looks like:

```tsx
import { useState, useEffect } from "react";

function useManualReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
```

This works, but it has problems. You need to handle SSR (where `window` does not exist), manage event listener cleanup, and repeat this pattern for every media query you want to track. Multiply that across reduced motion, contrast, color scheme, and other queries, and you end up with a lot of boilerplate that is easy to get wrong.

ReactUse provides hooks that encapsulate this pattern with correct SSR handling, proper cleanup, and real-time updates when the user changes their system preferences.

## useReducedMotion: Respecting Motion Preferences

The [`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) hook detects whether the user has enabled the "reduce motion" setting on their device. This is one of the most impactful accessibility hooks you can use, because motion can cause real physical discomfort for users with vestibular disorders.

```tsx
import { useReducedMotion } from "@reactuses/core";

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      style={{
        transition: prefersReducedMotion
          ? "none"
          : "transform 0.3s ease, opacity 0.3s ease",
        animation: prefersReducedMotion ? "none" : "fadeIn 0.5s ease-in",
      }}
    >
      {children}
    </div>
  );
}
```

The key insight here is not just to disable animations — it is to provide an equivalent experience without motion. A card that fades in over 500ms for most users should simply appear instantly for users who prefer reduced motion. The content is the same; only the delivery changes.

You can also use this hook to swap between animation strategies:

```tsx
import { useReducedMotion } from "@reactuses/core";

function PageTransition({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // Instant transition — no motion, but still a visual change
    return <div style={{ opacity: 1 }}>{children}</div>;
  }

  // Full slide-in animation for users who haven't opted out
  return (
    <div
      style={{
        animation: "slideInFromRight 0.4s ease-out",
      }}
    >
      {children}
    </div>
  );
}
```

## usePreferredContrast: Adapting to Contrast Needs

The [`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) hook reads the `prefers-contrast` media query, which tells you whether the user wants more contrast, less contrast, or has no preference. This is critical for users with low vision.

```tsx
import { usePreferredContrast } from "@reactuses/core";

function ThemedButton({ children, onClick }: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const contrast = usePreferredContrast();

  const getButtonStyles = () => {
    switch (contrast) {
      case "more":
        return {
          backgroundColor: "#000000",
          color: "#FFFFFF",
          border: "3px solid #FFFFFF",
          fontWeight: 700 as const,
        };
      case "less":
        return {
          backgroundColor: "#E8E8E8",
          color: "#333333",
          border: "1px solid #CCCCCC",
          fontWeight: 400 as const,
        };
      default:
        return {
          backgroundColor: "#3B82F6",
          color: "#FFFFFF",
          border: "2px solid transparent",
          fontWeight: 500 as const,
        };
    }
  };

  return (
    <button onClick={onClick} style={getButtonStyles()}>
      {children}
    </button>
  );
}
```

When the user has requested higher contrast, you should increase the difference between foreground and background colors, use heavier font weights, and make borders more visible. When they request less contrast, soften the visual intensity. The default branch handles users who have not set a preference.

## usePreferredColorScheme: System Theme Detection

The [`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) hook tells you whether the user's operating system is set to light mode, dark mode, or has no preference. This is the foundation for building theme-aware components.

```tsx
import { usePreferredColorScheme } from "@reactuses/core";

function AdaptiveCard({ title, body }: { title: string; body: string }) {
  const colorScheme = usePreferredColorScheme();

  const isDark = colorScheme === "dark";

  return (
    <div
      style={{
        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        color: isDark ? "#E2E8F0" : "#1E293B",
        border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
        borderRadius: "8px",
        padding: "24px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
```

For a simpler boolean check, ReactUse also provides [`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/), which returns `true` when the user prefers a dark color scheme. And if you need a full dark mode toggle that persists the user's choice, [`useDarkMode`](https://reactuse.com/browser/useDarkMode/) provides that out of the box.

For even more granular control over media queries, [`useMediaQuery`](https://reactuse.com/browser/useMediaQuery/) lets you subscribe to any CSS media query string and get live updates.

## useFocus: Keyboard Navigation and Focus Management

Keyboard navigation is a core accessibility requirement. Users who cannot use a mouse rely on the Tab key to move between interactive elements. The [`useFocus`](https://reactuse.com/element/useFocus/) hook gives you programmatic control over focus, which is essential for modal dialogs, dropdown menus, and dynamic content.

```tsx
import { useRef } from "react";
import { useFocus } from "@reactuses/core";

function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useFocus(inputRef);

  return (
    <div>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search..."
        style={{
          outline: focused ? "2px solid #3B82F6" : "1px solid #D1D5DB",
          padding: "8px 12px",
          borderRadius: "6px",
          width: "100%",
        }}
      />
      <button onClick={() => setFocused(true)}>
        Focus Search (Ctrl+K)
      </button>
    </div>
  );
}
```

The hook returns both the current focus state and a setter function. You can use the focus state to apply visual indicators (beyond the browser default) and use the setter to programmatically move focus — for example, when a modal opens or when a keyboard shortcut is triggered.

Pairing this with [`useActiveElement`](https://reactuse.com/element/useActiveElement/) lets you track which element currently has focus across your entire application, which is useful for building focus traps and skip-navigation links.

## useTextDirection: RTL and LTR Support

Internationalization and accessibility overlap heavily. The [`useTextDirection`](https://reactuse.com/browser/useTextDirection/) hook detects and manages the text direction of your document, supporting both left-to-right (LTR) and right-to-left (RTL) layouts.

```tsx
import { useTextDirection } from "@reactuses/core";

function NavigationMenu() {
  const [dir, setDir] = useTextDirection();

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: dir === "rtl" ? "row-reverse" : "row",
        gap: "16px",
        padding: "12px 24px",
      }}
    >
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
      <button onClick={() => setDir(dir === "rtl" ? "ltr" : "rtl")}>
        Toggle Direction
      </button>
    </nav>
  );
}
```

RTL support affects more than text alignment. Navigation order, icon placement, and margin/padding directions all need to flip. By using `useTextDirection` as the source of truth, you can build layout logic that adapts automatically.

## Putting It All Together: An Accessible Notification Component

Here is a practical example that combines multiple accessibility hooks into a single component — a notification toast that respects motion preferences, adapts to contrast settings, follows the system color scheme, and manages focus correctly:

```tsx
import { useRef, useEffect } from "react";
import {
  useReducedMotion,
  usePreferredContrast,
  usePreferredColorScheme,
  useFocus,
} from "@reactuses/core";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
  onDismiss: () => void;
}

function AccessibleNotification({
  message,
  type,
  visible,
  onDismiss,
}: NotificationProps) {
  const prefersReducedMotion = useReducedMotion();
  const contrast = usePreferredContrast();
  const colorScheme = usePreferredColorScheme();
  const dismissRef = useRef<HTMLButtonElement>(null);
  const [, setFocused] = useFocus(dismissRef);

  const isDark = colorScheme === "dark";
  const isHighContrast = contrast === "more";

  // Move focus to the dismiss button when notification appears
  useEffect(() => {
    if (visible) {
      setFocused(true);
    }
  }, [visible, setFocused]);

  if (!visible) return null;

  const colors = {
    success: {
      bg: isDark ? "#064E3B" : "#ECFDF5",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#10B981" : "#6EE7B7",
      text: isDark ? "#A7F3D0" : "#065F46",
    },
    error: {
      bg: isDark ? "#7F1D1D" : "#FEF2F2",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#EF4444" : "#FCA5A5",
      text: isDark ? "#FECACA" : "#991B1B",
    },
    info: {
      bg: isDark ? "#1E3A5F" : "#EFF6FF",
      border: isHighContrast ? "#FFFFFF" : isDark ? "#3B82F6" : "#93C5FD",
      text: isDark ? "#BFDBFE" : "#1E40AF",
    },
  };

  const scheme = colors[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        backgroundColor: scheme.bg,
        color: scheme.text,
        border: `${isHighContrast ? "3px" : "1px"} solid ${scheme.border}`,
        borderRadius: "8px",
        padding: "16px 20px",
        maxWidth: "400px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontWeight: isHighContrast ? 700 : 400,
        // Respect motion preferences
        animation: prefersReducedMotion ? "none" : "slideIn 0.3s ease-out",
        transition: prefersReducedMotion ? "none" : "opacity 0.2s ease",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        ref={dismissRef}
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: `1px solid ${scheme.text}`,
          color: scheme.text,
          cursor: "pointer",
          borderRadius: "4px",
          padding: "4px 8px",
          fontWeight: isHighContrast ? 700 : 500,
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
```

This component demonstrates several accessibility principles working together:

1. **`role="alert"` and `aria-live="assertive"`** ensure screen readers announce the notification immediately.
2. **`useReducedMotion`** disables the slide-in animation for users who prefer reduced motion.
3. **`usePreferredContrast`** increases border width and font weight for users who need more contrast.
4. **`usePreferredColorScheme`** adapts all colors to the user's light or dark theme.
5. **`useFocus`** moves keyboard focus to the dismiss button so the user can act on the notification without reaching for the mouse.

## Why Hooks Are the Right Abstraction for Accessibility

Hooks are composable. Each accessibility concern is encapsulated in its own hook, and you combine them as needed. A simple button might only use `usePreferredContrast`. A complex modal might use all five hooks we covered. The hooks do not know about each other, which means you can adopt them incrementally without refactoring existing code.

Hooks also respond to changes in real time. If a user switches from light to dark mode while your application is open, the hooks update and your components re-render with the new preference. This is difficult to achieve with CSS-only solutions that rely on static class names.

## Installation

Install ReactUse via your package manager:

```bash
npm install @reactuses/core
```

Then import the hooks you need:

```tsx
import {
  useReducedMotion,
  usePreferredContrast,
  usePreferredColorScheme,
  useFocus,
  useTextDirection,
} from "@reactuses/core";
```

## Related Hooks

- [`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) — detect the `prefers-reduced-motion` preference
- [`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) — detect the `prefers-contrast` preference
- [`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) — detect `prefers-color-scheme` (light, dark, or no preference)
- [`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/) — boolean shorthand for dark mode detection
- [`useDarkMode`](https://reactuse.com/browser/useDarkMode/) — full dark mode toggle with persistence
- [`useMediaQuery`](https://reactuse.com/browser/useMediaQuery/) — subscribe to any CSS media query
- [`useFocus`](https://reactuse.com/element/useFocus/) — programmatic focus management
- [`useActiveElement`](https://reactuse.com/element/useActiveElement/) — track the currently focused element
- [`useTextDirection`](https://reactuse.com/browser/useTextDirection/) — detect and control LTR/RTL text direction

ReactUse provides 100+ hooks for React. [Explore them all &rarr;](https://reactuse.com)
