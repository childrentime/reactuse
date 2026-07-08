---
title: "React useReducedMotion Hook: Respect prefers-reduced-motion (2026)"
description: "A practical guide to the useReducedMotion hook in React: read the OS-level prefers-reduced-motion setting, disable or simplify animations for users with vestibular disorders, and see exactly which motion WCAG actually asks you to remove. One line over useMediaQuery, SSR-safe, and reactive to live OS changes."
slug: react-usereducedmotion-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-08
tags: [react, hooks, accessibility, typescript, tutorial]
keywords: [react useReducedMotion, useReducedMotion hook, prefers-reduced-motion react, react reduced motion hook, disable animations react, react accessibility hook, react vestibular disorder, react motion sickness, framer motion reduced motion, react useMediaQuery, ssr-safe reduced motion, react WCAG animation]
image: /img/og.png
---

# React useReducedMotion Hook: Respect prefers-reduced-motion (2026)

A full-bleed parallax hero. An auto-scrolling carousel. A loading spinner that spins, bounces, *and* rotates. For most users that's just "modern." For someone with a vestibular disorder, migraine with aura, or Meniere's disease, it can trigger real nausea, dizziness, or a headache bad enough to close the tab — not annoyance, an actual physical symptom. That's why every major OS ships a "Reduce Motion" toggle (iOS since 2013, macOS, Windows, Android, GNOME), and why CSS exposes it to the web as the [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) media feature.

`useReducedMotion` is the hook that reads that setting into React state — reactively, so it updates the instant the user flips the OS toggle, and safely, so it doesn't touch `window` during SSR. This post covers the real [`@reactuses/core`](https://reactuse.com) API, what `prefers-reduced-motion` actually asks you to remove (it's narrower than "no motion at all"), and the three integration patterns you'll actually reach for.

<!-- truncate -->

## The Naive Version

The obvious approach is `window.matchMedia` inside an effect:

```tsx
function Hero() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mql.matches);
    // 🐛 forget this and the value never updates again
    const onChange = () => setReduce(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return <div className={reduce ? 'hero' : 'hero hero--parallax'} />;
}
```

Three ways this goes wrong in practice. First, `window` doesn't exist on the server, so this whole block needs a guard the moment you're on Next.js, Remix, or Astro — and it's easy to reach for `typeof window !== 'undefined'` sprinkled through render instead of isolating it in an effect. Second, people initialize the state once with `mql.matches` and skip the `change` listener entirely — which works fine until a user actually toggles the setting *while your tab is open* (switching a laptop from battery to plugged-in triggers this on some OSes, and QA almost never tests it). Third, every component that cares about motion preference reimplements this same `matchMedia` + listener + cleanup dance.

## The API

[`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) is one call:

```ts
const prefersReducedMotion = useReducedMotion(defaultState?: boolean): boolean;
```

- **`defaultState`** — optional, defaults to `false`. This is the value returned during SSR and on the very first client render, before the media query can be evaluated.
- **returns** — a boolean that starts as `defaultState` and updates live whenever the user's OS-level motion preference changes. No manual listener, no cleanup to forget.

Under the hood it's genuinely this simple — the whole implementation is a one-line call into [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/):

```ts
export function useReducedMotion(defaultState?: boolean) {
  return useMediaQuery('(prefers-reduced-motion: reduce)', defaultState);
}
```

`useMediaQuery` is the hook doing the actual work — constructing the `MediaQueryList` inside an effect (so nothing touches `matchMedia` during render or on the server) and subscribing to its `change` event for you. `useReducedMotion` just pins the query string. That's the whole value: you get the right query, spelled correctly, wired up correctly, every time.

## Pattern 1: Kill a Single Animation

The smallest use — gate one CSS transition or class on the flag:

```tsx
import { useReducedMotion } from '@reactuses/core';

function Hero() {
  const reduce = useReducedMotion();

  return (
    <div className={reduce ? 'hero' : 'hero hero--parallax'}>
      <h1>Welcome</h1>
    </div>
  );
}
```

`.hero--parallax` carries the `transform: translateY(...)` scroll-linked animation; the base `.hero` class doesn't. No JS animation logic runs at all when `reduce` is `true` — you're not just skipping the *visual* motion, you're skipping the scroll-listener or `requestAnimationFrame` loop driving it, which is also a real performance win on lower-end devices.

## Pattern 2: Framer Motion / GSAP Integration

If you're using an animation library, the hook value plugs straight into its duration/transition config instead of a class swap:

```tsx
import { motion } from 'framer-motion';
import { useReducedMotion } from '@reactuses/core';

function Card({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4 }}
    >
      {children}
    </motion.div>
  );
}
```

Note this doesn't remove the fade — `opacity` isn't the kind of motion `prefers-reduced-motion` is about (see the next section). It removes the *displacement*: with `reduce` true, `y` never moves and the transition is instant, so the card just appears. Framer Motion also ships its own [`useReducedMotion`](https://www.framer.com/motion/use-reduced-motion/) hook that does the same `matchMedia` read — if you're already pulling in `@reactuses/core` for everything else, this hook keeps you on one source of truth instead of two libraries independently reading the same media query.

## Pattern 3: One Global Switch Instead of N Guards

Gating every individual animation with `reduce ? ... : ...` scales badly once a design system has dozens of animated components. The pattern that scales is: read the hook *once*, near the app root, and drive a `data-` attribute that a global stylesheet reacts to.

```tsx
function App({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div data-motion={reduce ? 'reduce' : 'no-preference'}>
      {children}
    </div>
  );
}
```

```css
[data-motion="reduce"] *,
[data-motion="reduce"] *::before,
[data-motion="reduce"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

This is the same shape as the classic [CSS-only universal-selector rule](https://web.dev/prefers-reduced-motion/) built directly on the media query — the difference is the `data-motion` attribute is driven by React state, so the exact same flag is available to your JS animation logic (Pattern 2) *and* your CSS (this pattern) without reading the media query twice or risking the two getting out of sync.

## What "Reduce" Doesn't Mean

`prefers-reduced-motion: reduce` is not "disable all motion." [WCAG 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) and the platform vendors are specifically after **large-scale, non-essential motion**: parallax scrolling, autoplaying background video, zooming/panning hero animations, auto-advancing carousels, bouncing/spinning decorative loaders. Motion that carries information or confirms an interaction — a checkbox's tick animation, a button's brief press state, a spinner indicating "still loading," drag-and-drop feedback — is generally fine to keep, ideally just shorter and calmer. Removing *every* pixel of movement, including a `:hover` color transition, isn't what the setting is asking for and can make an interface feel broken rather than accessible. When in doubt, ask "does this motion span a large portion of the screen, or run continuously without user action?" — that's the motion to gate.

One more nuance worth knowing: if you only need this in CSS and never in JS logic, Tailwind's [`motion-reduce:`](https://tailwindcss.com/docs/animation#accounting-for-reduced-motion-preferences) variant (or a plain `@media (prefers-reduced-motion: reduce)` block) gets there with zero JavaScript. Reach for the hook specifically when the decision needs to reach into render or effect logic — choosing between an autoplaying `<video>` and a static poster image, skipping a scroll-driven animation library's setup entirely, or the data-attribute pattern above.

## SSR Safety

`useReducedMotion` is safe to render on the server. `useMediaQuery` only calls `window.matchMedia` inside an effect — which React never runs during SSR — so the server and the very first client paint both use `defaultState` (`false` unless you pass otherwise). There's no `typeof window` guard to write and no hydration mismatch: React reconciles the same value on both passes, and the real preference is read and applied on the client right after mount. (For the general pattern behind this, see [SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/).)

## The Preference-Query Family

`useReducedMotion` is one of a small set of hooks that read OS-level accessibility and display preferences — all thin, purpose-named wrappers over the same primitive:

| Hook | Media query | Returns |
| --- | --- | --- |
| [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) | `prefers-reduced-motion` | `boolean` |
| [`usePreferredColorScheme`](https://reactuse.com/browser/usepreferredcolorscheme/) | `prefers-color-scheme` | `"dark" \| "light" \| "no-preference"` |
| [`usePreferredContrast`](https://reactuse.com/browser/usepreferredcontrast/) | `prefers-contrast` | `"more" \| "less" \| "custom" \| "no-preference"` |
| [`usePreferredDark`](https://reactuse.com/browser/usepreferreddark/) | `prefers-color-scheme: dark` | `boolean` |
| [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) | any query you pass | `boolean` |

Reach for the named ones first — they exist so the query string is spelled correctly once, in one place — and drop down to `useMediaQuery` directly for anything more specific, like a custom breakpoint. For the wider set of hooks that make a React app respect what the user already configured at the OS level, see [React and User Preferences](https://reactuse.com/blog/react-user-preferences/); for the broader accessibility toolkit, see [Building Accessible React Components with Hooks](https://reactuse.com/blog/react-accessibility-hooks/).

## Takeaways

- `prefers-reduced-motion` isn't a nice-to-have — for users with vestibular disorders or migraine triggers, ignoring it can make a page physically unusable.
- **`useReducedMotion(defaultState?)`** reads it reactively: a one-line wrapper over `useMediaQuery('(prefers-reduced-motion: reduce)', defaultState)`, so it inherits SSR-safety and live updates for free.
- Gate individual transitions for one-off cases (Pattern 1), feed it into Framer Motion/GSAP transition configs (Pattern 2), or drive a global `data-motion` attribute once at the app root so CSS and JS share one source of truth (Pattern 3).
- The setting targets large-scale or non-essential motion — parallax, autoplay, decorative loops — not every `:hover` transition. Keep short, functional motion; cut the rest.
- SSR-safe by default: `defaultState` covers the server and first paint, no `typeof window` guard needed.

Grab it from [`@reactuses/core`](https://reactuse.com/browser/usereducedmotion/) — it's one hook standing between your animations and a user who can't safely look at them.
