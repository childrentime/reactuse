---
title: "React useIsomorphicLayoutEffect: Fix the SSR useLayoutEffect Warning (2026)"
description: "If you have ever seen \"Warning: useLayoutEffect does nothing on the server\" in a Next.js or Remix console, this is the fix. A deep look at why useLayoutEffect breaks under SSR, why swapping to useEffect causes flicker, and how useIsomorphicLayoutEffect resolves both — plus when to reach for it and the family of layout-timing hooks around it."
slug: react-isomorphic-layout-effect
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-06-25
tags: [react, hooks, ssr, nextjs, tutorial]
keywords: [react useIsomorphicLayoutEffect, useLayoutEffect SSR warning, useLayoutEffect does nothing on the server, react useLayoutEffect hydration, next.js useLayoutEffect warning, react ssr layout effect, isomorphic layout effect, useLayoutEffect vs useEffect, react useLayoutEffect server rendering, remix useLayoutEffect, react measure dom before paint, useUpdateLayoutEffect, ssr-safe react hooks, react hydration mismatch layout]
image: /img/og.png
---

# React useIsomorphicLayoutEffect: Fix the SSR useLayoutEffect Warning (2026)

You added a `useLayoutEffect` to measure a tooltip, shipped it, and the next time your Next.js (or Remix, or Gatsby) dev server rendered a page on the server, the console lit up:

```
Warning: useLayoutEffect does nothing on the server, because its effect cannot
be encoded into the server renderer's output format. This will lead to a
mismatch between the initial, non-hydrated UI and the intended UI. To avoid
this, useLayoutEffect should only be used in components that render exclusively
on the client.
```

The warning is correct, the suggested fix ("only use it on the client") is unhelpful, and the obvious workaround — just switch to `useEffect` — quietly reintroduces the visual bug you used `useLayoutEffect` to kill in the first place. `useIsomorphicLayoutEffect` is the small hook that resolves the standoff. This post explains exactly why the warning happens, why the two naive fixes are both wrong, and what the one-line hook actually does.

<!-- truncate -->

## Why useLayoutEffect Exists At All

React gives you two effect hooks that look nearly identical:

- [`useEffect`](https://react.dev/reference/react/useEffect) runs **after** the browser has painted. Its callback is queued and fires asynchronously once the frame is on screen.
- `useLayoutEffect` runs **before** the browser paints, synchronously, right after React has mutated the DOM but before the user sees anything.

That timing difference is the whole point. If you need to read layout — `getBoundingClientRect`, `scrollHeight`, the measured width of a node — and then write a style based on it, you have to do it *before* paint. Otherwise the user sees one frame of the wrong layout, then a flicker as your `useEffect` corrects it. The canonical example is a tooltip that has to position itself relative to its own measured size:

```tsx
function Tooltip({ targetRect, children }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const { height, width } = ref.current!.getBoundingClientRect();
    // place the tooltip above the target, centered
    setPos({
      top: targetRect.top - height - 8,
      left: targetRect.left + targetRect.width / 2 - width / 2,
    });
  }, [targetRect]);

  return <div ref={ref} style={{ position: 'fixed', ...pos }}>{children}</div>;
}
```

With `useLayoutEffect`, React measures and repositions in the same synchronous pass, so the tooltip is only ever painted in the right spot. Swap in `useEffect` and the tooltip flashes at `{ top: 0, left: 0 }` for one frame before jumping into place. On a fast machine you might not notice; on a throttled phone you absolutely will.

## Why the Server Hates It

Server-side rendering produces an HTML string. There is no browser, no DOM, no layout phase, and — critically — nothing ever *paints*. The entire reason `useLayoutEffect` exists is to run synchronously before a paint that, on the server, never comes.

So React makes a deliberate choice: **`useLayoutEffect` callbacks do not run during server rendering at all.** They can't be meaningfully serialized into the HTML, and running them would do nothing useful. React knows this is a footgun — your component's server output won't reflect whatever the layout effect would have computed — so it emits that warning to tell you the server HTML and the intended client UI may not match.

The warning is not a bug in your code. It is React pointing out that you have a hook whose *only job* is impossible to do on the server.

## Why You Can't Just Use useEffect

The first instinct is to silence the warning by switching to `useEffect`, which React is perfectly happy to run on the server (it just defers the callback). The warning disappears. The flicker comes back.

Remember the timing: `useEffect` fires *after* paint. So on the client, after hydration, your measure-then-reposition logic now runs one frame late. The user sees the un-positioned state first, then the correction. You traded a console warning for a visible visual glitch — a strictly worse outcome, because at least the warning was invisible to users.

The second instinct — render the component only on the client (`typeof window !== 'undefined'` guards, dynamic imports with `ssr: false`, mounting flags) — works but throws away server rendering for that whole subtree. You lose the SSR HTML, the content is invisible to crawlers until hydration, and you've added a layout-shift on first load. That's a sledgehammer for a hook-selection problem.

## The Actual Fix: Branch on Environment

The realization is simple: you want `useLayoutEffect`'s pre-paint timing **in the browser**, and you want `useEffect`'s "quietly do nothing useful, no warning" behavior **on the server**. Those are two different hooks, and which one is correct depends entirely on where the code is running.

So pick at module-load time based on whether you're in a browser:

```ts
import { useEffect, useLayoutEffect } from 'react';

const isBrowser = typeof window !== 'undefined';

export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;
```

That is the entire hook. In the browser it *is* `useLayoutEffect` — identical pre-paint, synchronous timing, identical signature. On the server it *is* `useEffect`, which React never warns about and which never runs a useless layout pass. "Isomorphic" is the old term for code that runs the same way on server and client; the hook picks the right same-meaning effect for each environment.

ReactUse ships exactly this as [`useIsomorphicLayoutEffect`](https://reactuse.com/effect/useisomorphiclayouteffect/), so you don't copy-paste the snippet into every project:

```tsx
import { useIsomorphicLayoutEffect } from '@reactuses/core';

function Tooltip({ targetRect, children }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Same code as before — but no SSR warning, and no client flicker.
  useIsomorphicLayoutEffect(() => {
    const { height, width } = ref.current!.getBoundingClientRect();
    setPos({
      top: targetRect.top - height - 8,
      left: targetRect.left + targetRect.width / 2 - width / 2,
    });
  }, [targetRect]);

  return <div ref={ref} style={{ position: 'fixed', ...pos }}>{children}</div>;
}
```

It's a drop-in replacement for `useLayoutEffect`: same callback, same optional dependency array, same cleanup function. The only thing that changes is that the warning goes away and your client behavior stays identical.

### One subtlety: why the branch lives outside render

Notice the `isBrowser ? useLayoutEffect : useEffect` runs *once*, at module evaluation, not inside the component. That's deliberate. The [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) require that you call the same hooks in the same order on every render. If you wrote `if (isBrowser) useLayoutEffect(...) else useEffect(...)` *inside* the component, you'd technically be calling different hooks on server vs client — and worse, the linter would (rightly) complain about a conditional hook call.

By resolving the choice to a single stable function reference at module load, the component just calls `useIsomorphicLayoutEffect(...)` unconditionally. `isBrowser` never changes within a process, so the selected hook is constant for the lifetime of the bundle. Hook order stays stable; the lint rule stays happy.

## When To Reach For It (And When Not)

Use `useIsomorphicLayoutEffect` when **all** of these are true:

- You need layout-phase timing — you're measuring or mutating the DOM and the result must be on screen in the *first* painted frame (tooltips, popovers, autosizing textareas, scroll restoration, focus management, anything where a one-frame flash is visible).
- The component is server-rendered (Next.js, Remix, Astro islands, Gatsby, TanStack Start — anything that calls `renderToString`/`renderToPipeableStream`).
- You want the SSR warning gone without disabling SSR for the subtree.

Do **not** reach for it as a blanket replacement for `useEffect`. If your effect doesn't touch layout — fetching data, subscribing to an event, syncing to `localStorage`, logging — plain `useEffect` is correct and you want its post-paint, non-blocking timing. `useLayoutEffect` (and therefore the isomorphic version) runs synchronously and *blocks paint*; overusing it makes your app feel janky for no benefit. The rule of thumb hasn't changed: reach for layout effects only when you'd otherwise see a flicker.

And if a component is genuinely client-only — it imports `window` at the top level, or wraps a browser-only library — rendering it client-side (`dynamic(() => ..., { ssr: false })`) is still the right tool. `useIsomorphicLayoutEffect` is for components that *do* render on the server and just have a layout effect inside them.

## The Layout-Timing Family

`useIsomorphicLayoutEffect` is the base of a small family of effect hooks in ReactUse. Once you understand the SSR-safe layout-effect, the rest fall out naturally:

- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) — a layout effect that **skips the first mount** and only runs on updates. Internally it wraps `useLayoutEffect` with a first-mount guard, so it's the layout-phase sibling of `useUpdateEffect`. Handy when the initial DOM is already correct and you only need to react to subsequent prop changes (animating a value *to* a new position, not *into* existence). Note that this one uses `useLayoutEffect` directly — combine the pattern with an `isBrowser` branch if you need it SSR-silent.
- [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) — the same skip-first-render behavior on top of `useEffect`. The everyday "run this on change but not on mount" hook.
- [`useMount`](https://reactuse.com/effect/usemount/) — runs a callback exactly once after mount. A readable alias for `useEffect(fn, [])` when all you mean is "on mount".

There's also a quietly important consumer of this hook inside the library itself. [`useEvent`](https://reactuse.com/effect/useevent/) — ReactUse's stable-callback hook, the one that gives you an event handler with a permanent identity but always-fresh closure — uses `useIsomorphicLayoutEffect` to sync the latest function into a ref *before* paint:

```ts
const handlerRef = useRef(fn);
useIsomorphicLayoutEffect(() => {
  handlerRef.current = fn;
}, [fn]);
```

Writing the ref in the layout phase guarantees that if any child fires the handler during *its* layout effect, it already sees the newest version — and doing it isomorphically means `useEvent` itself never trips the SSR warning. It's a good illustration of why a library hook reaches for the isomorphic variant by default: you don't know which environment your consumers run in, so you pick the one that's correct in both.

## Takeaways

- The warning "useLayoutEffect does nothing on the server" is React telling you a pre-paint hook can't run where there's no paint. It's accurate, not a false alarm.
- Switching to `useEffect` silences the warning but reintroduces a one-frame flicker on the client, because `useEffect` runs after paint.
- `useIsomorphicLayoutEffect` resolves both: it *is* `useLayoutEffect` in the browser and `useEffect` on the server, chosen once at module load so hook order stays stable.
- Use it for layout measurement/mutation in server-rendered components; keep plain `useEffect` for everything that doesn't touch layout.
- ReactUse ships it (and the related `useUpdateLayoutEffect`, `useUpdateEffect`, `useMount`) so you don't reinvent the one-liner — and uses it internally to keep its own hooks SSR-safe.

Browse the full set of SSR-safe effect hooks at [reactuse.com](https://reactuse.com), and drop `useIsomorphicLayoutEffect` in wherever a `useLayoutEffect` is making your server console nervous.
