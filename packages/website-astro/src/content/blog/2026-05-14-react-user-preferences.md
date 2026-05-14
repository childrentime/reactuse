---
title: "React and User Preferences: Respect the OS Settings Your Users Already Picked"
description: "Build accessible, OS-aware React UIs that respect dark mode, contrast, reduced motion, language, and text direction — with usePreferredDark, usePreferredColorScheme, useColorMode, usePreferredContrast, useReducedMotion, usePreferredLanguages, and useTextDirection from ReactUse."
slug: react-user-preferences
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-14
tags: [react, hooks, accessibility, a11y, tutorial]
keywords: [react user preferences, react prefers-color-scheme, react prefers-reduced-motion, useReducedMotion, useColorMode, usePreferredDark, usePreferredContrast, react accessibility hooks, react dark mode hook, react a11y, react i18n direction]
image: /img/og.png
---

# React and User Preferences: Respect the OS Settings Your Users Already Picked

Every modern operating system asks the user, at some point, what kind of UI they want. Dark mode or light. High contrast or normal. Animations on or stripped down. Left-to-right or right-to-left. Preferred language. The user picks once, in System Settings, and from that moment on every well-built native app on the machine respects the choice. The web app you ship usually does not — it picks its own dark mode toggle, its own animation library, its own assumed-English copy, and the OS preference becomes a five-line note in someone's bug tracker.

<!-- truncate -->

The fix is small and the API surface is narrow. The browser exposes the OS preferences through `window.matchMedia` and `navigator.language`, and every modern React app can wire them up in an afternoon. The problem is not capability; it is that the wiring lives in the same `useEffect`/`useState`/SSR-mismatch swamp that every web feature lives in, and so it gets postponed forever. [ReactUse](https://reactuse.com) ships seven focused hooks for this, and together they cover the four user-preference dimensions that actually matter: theme, motion, contrast, and locale.

This post walks through each one — what it returns, what bug it hides, and what shape the resulting component has. At the end we put them together into a single `useAppearance()` hook that reads the four signals at once.

## 1. usePreferredDark — The Boolean That Starts a Theme System

The simplest one. `usePreferredDark()` returns `true` if the user's OS is set to dark mode, `false` if not. It is a thin wrapper over `window.matchMedia('(prefers-color-scheme: dark)').matches` that handles two things you would otherwise have to handle yourself: SSR (no `window`) and live updates (the user can flip the OS toggle while your tab is open and it should react).

### The Manual Way

```tsx
import { useEffect, useState } from "react";

function ManualDark() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return dark ? "dark" : "light";
}
```

That is correct, but the initial `useState(false)` is a guess — for SSR-rendered pages it produces a hydration mismatch the first time a dark-mode user lands on your site. The same fix applies in five places across a real codebase, and rarely with consistent defaults.

### The ReactUse Way

```tsx
import { usePreferredDark } from "@reactuses/core";

function Component() {
  const isDark = usePreferredDark();
  return <Theme name={isDark ? "dark" : "light"} />;
}
```

[`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/) is `boolean` in, `boolean` out — drop it anywhere in the tree, no setup. The first render returns the SSR-safe default; once the client mounts the real `matchMedia` value flows in and stays in sync as the user toggles.

## 2. usePreferredColorScheme — When "Dark" Is Not Enough

`prefers-color-scheme` has three values, not two: `'light'`, `'dark'`, and `'no-preference'`. Most apps collapse the third into one of the first two, which is fine — until you ship a "follow system" mode and discover that some users explicitly set "no preference" and now your app picks the wrong default. [`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) returns the full string.

```tsx
import { usePreferredColorScheme } from "@reactuses/core";

function ThemeBadge() {
  const scheme = usePreferredColorScheme();
  // scheme: "light" | "dark" | "no-preference"
  return <span>System theme: {scheme}</span>;
}
```

The most useful place for the three-value form is in a theme picker that has a "System" option:

```tsx
type Choice = "light" | "dark" | "system";

function ThemePicker({ choice, onChange }: { choice: Choice; onChange: (c: Choice) => void }) {
  const scheme = usePreferredColorScheme();
  const effective =
    choice === "system"
      ? scheme === "dark"
        ? "dark"
        : "light"
      : choice;

  return (
    <fieldset>
      <legend>Theme</legend>
      {(["light", "dark", "system"] as const).map((c) => (
        <label key={c}>
          <input
            type="radio"
            checked={choice === c}
            onChange={() => onChange(c)}
          />
          {c}
          {c === "system" && ` (currently ${effective})`}
        </label>
      ))}
    </fieldset>
  );
}
```

The visible label tells the user what "System" actually means right now — a tiny touch that prevents the most common dark-mode confusion ("the system option is broken; it's giving me light").

## 3. useColorMode — Theme State With Persistence

`usePreferredDark` reports the OS preference. `useColorMode` goes a step further: it owns the application's *applied* theme. It reads the OS preference as a default, lets the user override it, persists the override to `localStorage`, and writes the chosen mode onto a class or attribute on `<html>` so your CSS can switch.

[`useColorMode`](https://reactuse.com/browser/useColorMode/) is what you want for a real theme toggle:

```tsx
import { useColorMode } from "@reactuses/core";

function ThemeToggle() {
  const [mode, setMode] = useColorMode();
  // mode: "light" | "dark" | "auto"

  return (
    <button onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
      Switch to {mode === "dark" ? "light" : "dark"}
    </button>
  );
}
```

With one hook you get:

- Initial value from `localStorage` if the user has set it before, otherwise from `prefers-color-scheme`
- Live tracking of OS changes when in `'auto'`
- Class flipped on `<html>` (`html.dark` vs `html.light`) so your CSS works without any JS conditional
- SSR-safe: the same mode is rendered on server and first client paint

A common gotcha when rolling your own theme system: the first paint shows the wrong mode for a heartbeat because the OS preference is read after hydration. `useColorMode` avoids this by writing the resolved mode synchronously during render and reading the persisted choice from `localStorage` before React picks up the tree. Pair it with a tiny inline `<script>` in your `<head>` to set the class even earlier and the flash is gone entirely.

## 4. useReducedMotion — The Cheapest Accessibility Win on the Web

`prefers-reduced-motion` is the OS-level signal that the user wants less movement on screen. People who get motion sick from parallax, vestibular-disorder users for whom large transitions are physically painful, anyone using a screen reader that already produces enough motion of its own — they all turn this on. Respecting it costs you nothing and earns enormous goodwill. Ignoring it is one of the fastest ways to ship an app that excludes users.

```tsx
import { useReducedMotion } from "@reactuses/core";
import { motion } from "framer-motion";

function FadeIn({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4 }}
    >
      {children}
    </motion.div>
  );
}
```

When reduced motion is on, the component skips the y-translate and uses a 0ms transition — the content still appears, just without the animation. This is the right pattern: do not remove the visual change, remove the *motion*. A toast that fades in is still useful with no movement; a toast that does not appear at all is a bug.

[`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) returns a boolean and is reactive to the OS setting, so a user who flips the preference mid-session sees animations stop immediately.

Common places to wire it up:
- Page transitions
- Modal/drawer enter-exit
- Number-counting animations
- Parallax / scroll-driven effects
- Auto-playing carousels (also stop autoplay when reduced motion is on)

## 5. usePreferredContrast — Boost the Edges When Asked

`prefers-contrast` is a newer media feature that reports whether the user has asked their OS for higher or lower contrast. Values are `'more'`, `'less'`, `'no-preference'`, or `'custom'`. Like reduced motion, it is a small group of users with a large benefit — high-contrast mode is critical for low-vision users.

```tsx
import { usePreferredContrast } from "@reactuses/core";

function Card({ children }: { children: React.ReactNode }) {
  const contrast = usePreferredContrast();
  const cls =
    contrast === "more"
      ? "card card--high-contrast"
      : "card";
  return <div className={cls}>{children}</div>;
}
```

The high-contrast variant typically does three things: thicker borders, stronger color values (no pastel/muted backgrounds), and clearer focus rings. You do not need a parallel theme — just a few targeted overrides:

```css
.card--high-contrast {
  border: 2px solid currentColor;
  background: var(--surface);
  color: var(--text-strong);
}
.card--high-contrast :focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
```

[`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) returns the raw string, so you can branch on `'more'` vs `'less'` independently if you have something useful to do for low-contrast users (most apps just match `'more'` and ignore the rest).

## 6. usePreferredLanguages — Beyond `navigator.language`

The browser exposes `navigator.languages` — an ordered array of the user's preferred locales, e.g. `["en-US", "zh-CN", "ja-JP"]`. Most apps read only `navigator.language` (the first entry), which throws away signal: a user with `["zh-CN", "en-US"]` set wants Chinese first and English as a fallback, not whatever you guessed.

[`usePreferredLanguages`](https://reactuse.com/browser/usePreferredLanguages/) returns the full array and stays in sync as the user changes browser language preferences:

```tsx
import { usePreferredLanguages } from "@reactuses/core";

const SUPPORTED = ["en", "zh-Hans", "zh-Hant", "ja", "es"] as const;

function pickLocale(preferred: readonly string[]): string {
  for (const lang of preferred) {
    const base = lang.toLowerCase();
    if (SUPPORTED.includes(base as (typeof SUPPORTED)[number])) return base;
    const region = base.split("-")[0];
    const match = SUPPORTED.find((s) => s.toLowerCase().startsWith(region));
    if (match) return match;
  }
  return "en";
}

function LocaleAuto() {
  const preferred = usePreferredLanguages();
  const locale = pickLocale(preferred);
  return <App locale={locale} />;
}
```

The negotiation logic does what `Accept-Language` content negotiation has done on the server for decades: pick the highest-priority language the app supports, fall back gracefully, default to English at the end. The win over `navigator.language` is real: a user whose first preference is `"de-CH"` but second is `"en"` will land on your English version if you do not support German, instead of seeing a half-translated UI.

## 7. useTextDirection — RTL Is Not Just CSS

Right-to-left languages (Arabic, Hebrew, Persian) flip the entire reading direction of the page. CSS handles most of this through logical properties (`margin-inline-start` instead of `margin-left`), but a real RTL implementation also needs JavaScript-driven behavior to flip: keyboard arrow handling, scroll snapping in carousels, animation directions, drag-to-dismiss directions.

[`useTextDirection`](https://reactuse.com/browser/useTextDirection/) reads (and optionally writes) the `dir` attribute on a target element:

```tsx
import { useEffect } from "react";
import { useTextDirection } from "@reactuses/core";

function App({ locale }: { locale: string }) {
  const [dir, setDir] = useTextDirection();

  useEffect(() => {
    setDir(isRtl(locale) ? "rtl" : "ltr");
  }, [locale, setDir]);

  return (
    <main>
      <Carousel direction={dir === "rtl" ? "leftward" : "rightward"} />
      <KeyboardHandler arrowsFlipped={dir === "rtl"} />
    </main>
  );
}

function isRtl(locale: string): boolean {
  return ["ar", "he", "fa", "ur"].some((p) => locale.startsWith(p));
}
```

By default the hook reads `<html dir="...">`, but it can target any element — useful for embedded widgets that need to be RTL-aware independently of the surrounding page.

## Putting It All Together: useAppearance

Most apps want to read all four signals — color, motion, contrast, direction — in one place at the root, then thread them down through context. A single derived hook is cleaner than calling four hooks in every component:

```tsx
import {
  usePreferredDark,
  usePreferredContrast,
  useReducedMotion,
  usePreferredLanguages,
  useTextDirection,
} from "@reactuses/core";

export type Appearance = {
  isDark: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  locale: string;
  dir: "ltr" | "rtl";
};

export function useAppearance(): Appearance {
  const isDark = usePreferredDark();
  const contrast = usePreferredContrast();
  const reducedMotion = useReducedMotion();
  const preferred = usePreferredLanguages();
  const [dir] = useTextDirection();

  const locale = pickLocale(preferred);

  return {
    isDark,
    highContrast: contrast === "more",
    reducedMotion,
    locale,
    dir: dir === "rtl" ? "rtl" : "ltr",
  };
}
```

Use it once at the root:

```tsx
function App() {
  const appearance = useAppearance();

  return (
    <AppearanceContext.Provider value={appearance}>
      <html
        className={`${appearance.isDark ? "dark" : "light"} ${
          appearance.highContrast ? "contrast-more" : ""
        } ${appearance.reducedMotion ? "motion-reduce" : ""}`}
        dir={appearance.dir}
        lang={appearance.locale}
      >
        <Routes />
      </html>
    </AppearanceContext.Provider>
  );
}
```

The `<html>` element now reflects every preference the user has set: `class` for theme/contrast/motion variants, `dir` for direction, `lang` for locale. Every CSS rule that wants to branch on a preference can do so with a single attribute selector, and every component that needs the raw signal can pull it from `AppearanceContext` without re-subscribing to `matchMedia`.

## CSS-First Where Possible, JS Where Necessary

A reasonable question: do you need JavaScript at all for half of this? `prefers-color-scheme`, `prefers-reduced-motion`, and `prefers-contrast` are all CSS media features and can be handled in stylesheets:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

For pure visual changes, CSS wins. The JavaScript hooks earn their keep when:

- The preference drives behavior, not just appearance (carousel autoplay, animation duration values you pass to a library)
- The preference toggles which component to mount (`<Parallax />` vs `<StaticImage />`)
- The preference influences a derived value that lives in React state (locale negotiation, theme persistence)
- You want a user toggle that overrides the OS preference (`useColorMode`'s `'auto'` vs `'light'` vs `'dark'`)

The rule of thumb: handle the static stuff in CSS, reach for these hooks when JavaScript actually needs to know.

## Summary

| Hook | Signal | Reach for it when… |
| --- | --- | --- |
| [`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/) | OS dark mode preference | You need a boolean for theme picking |
| [`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) | Full `light`/`dark`/`no-preference` | You need the third value for "System" mode UX |
| [`useColorMode`](https://reactuse.com/browser/useColorMode/) | Applied theme with persistence | You are building the theme system itself |
| [`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) | `prefers-reduced-motion` | You pass duration to an animation lib, or gate motion-heavy components |
| [`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) | `prefers-contrast` | You ship a high-contrast variant |
| [`usePreferredLanguages`](https://reactuse.com/browser/usePreferredLanguages/) | Full `navigator.languages` | You do locale negotiation, not just first-language detection |
| [`useTextDirection`](https://reactuse.com/browser/useTextDirection/) | `dir` attribute | You support RTL languages and need JS-driven flips |

Respecting the OS preferences your users already picked is the cheapest accessibility upgrade you will ever ship. The bar is low — return a boolean, branch a className, pass a duration — and the win is high. Browse the rest of the catalog at [reactuse.com](https://reactuse.com), and if you flip `prefers-reduced-motion` on tomorrow and your app stops flinging cards across the screen, that is a good day.
