---
title: "React useSessionStorage Hook: Per-Tab State That Survives Reloads (2026)"
description: "A practical guide to useSessionStorage in React: what sessionStorage actually promises (survives reloads, navigations and redirect round-trips; dies with the tab; never leaks into other tabs), when to pick it over useLocalStorage and useCookie, the multi-step form, OAuth-redirect, per-tab-view and once-per-session patterns, automatic serialization for objects/Maps/Sets/Dates, setValue(null) to remove, same-tab component sync, and every gotcha from SSR hydration to browser tab restore. TypeScript-first, SSR-safe."
slug: react-usesessionstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-17
tags: [react, hooks, state-management, typescript, tutorial]
keywords: [react usesessionstorage, usesessionstorage, usesessionstorage react, useSessionStorage hook, react sessionstorage hook, sessionstorage react, react session storage state, react persist state on refresh per tab, react multi step form persist state, react wizard state refresh, sessionstorage vs localstorage react, useSessionStorage vs useLocalStorage, react sessionstorage typescript, ssr-safe sessionstorage, sessionstorage next.js hydration, react sessionstorage hook typescript, react save form state on reload]
image: /img/og.png
---

# React useSessionStorage Hook: Per-Tab State That Survives Reloads (2026)

Here's a checkout flow that loses the customer at step three:

```tsx
function Checkout() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  // step 1: address, step 2: shipping, step 3: payment…
}
```

The customer fills in their address, picks a shipping option, and on the payment step the provider redirects them out to a 3-D Secure page and back. Or they just hit refresh. Either way, `step` is `0` again and `form` is empty. `useState` lives exactly as long as the component instance does — a reload, a redirect, a full-page navigation, and it's gone.

Everyone knows the fix is Web Storage. Most people reach for `localStorage`, and it works — until it works too well. The half-finished checkout is now sitting in every tab the customer opens, it's still there next week when they come back for something else, and if they open two tabs to compare shipping options, [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) faithfully syncs the two forms into each other. What you actually wanted was state that survives *this tab's* reloads and redirects and then disappears when the tab does. That's `sessionStorage`, and [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) from [`@reactuses/core`](https://reactuse.com) is the `useState`-shaped hook for it. This post covers what `sessionStorage` really promises (and doesn't), when to choose it over `localStorage` and cookies, the four patterns it's built for, and the gotchas — hydration, tab restore, `window.open` — that bite the hand-rolled version.

<!-- truncate -->

## Quick Start

```bash
npm install @reactuses/core
```

```tsx
import { useSessionStorage } from "@reactuses/core";

function Checkout() {
  const [step, setStep] = useSessionStorage("checkout:step", 0);
  const [form, setForm] = useSessionStorage<CheckoutForm>("checkout:form", EMPTY_FORM);

  return (
    <Wizard step={step ?? 0} onNext={() => setStep(s => (s ?? 0) + 1)}>
      <AddressStep value={form!.address} onChange={address => setForm(f => ({ ...f!, address }))} />
      {/* … */}
    </Wizard>
  );
}
```

`useSessionStorage(key, defaultValue)` returns the same `[value, setValue]` tuple as `useState`, with the same functional updates. The value is read from `sessionStorage` on mount, written back on every update, and typed `T | null` — `null` because `setValue(null)` removes the key (more on that below). Reload the page, get redirected to a payment provider and back, navigate away and hit the browser's back button: `step` and `form` are exactly where the customer left them. Close the tab: they're gone, which is the point.

## What sessionStorage Actually Promises

The name misleads people into thinking "session" means "logged-in session" or "browser session". It means **one top-level browsing context — a tab or window — for one origin**. Concretely:

| Event | Survives? |
| --- | --- |
| Reload / hard refresh | ✅ |
| Client-side route change (SPA) | ✅ |
| Full-page navigation to another page on the same origin | ✅ |
| Redirect to a third-party site and back (OAuth, payment, SSO) | ✅ — same tab, same origin on return |
| Browser back / forward | ✅ |
| Open the same URL in a **new tab** | ❌ fresh, empty storage |
| Close the tab | ❌ cleared (with a caveat: browsers that restore closed tabs restore its `sessionStorage` too) |
| Close the browser | ❌ |

Two edge cases surprise people. First, **`window.open()` copies** the opener's `sessionStorage` into the new window (per the HTML spec, whenever the new window keeps an `opener`), and Chrome's "Duplicate tab" copies it too — but it's a one-time snapshot, not a live link; the two tabs diverge from then on. Modern browsers open `target="_blank"` links with `noopener` by default, so ordinary links start clean. Second, `sessionStorage` is **shared with same-origin iframes in the same tab** — they're the same browsing context group — which is the only place the browser's native `storage` event has any meaning for it (below).

The rest is the same contract as `localStorage`: synchronous, string-only, roughly 5 MB per origin, and readable by any script on the page — so it's **not a security boundary**. It's *shorter-lived* than `localStorage`, which limits the blast radius of a leak, but XSS reads it just as easily. Anything that must be secret from JavaScript belongs in an `httpOnly` cookie, not here.

## useSessionStorage vs useLocalStorage vs useCookie vs useState

Pick by *where* the value should live and *how long*:

| You need state that… | Reach for |
| --- | --- |
| lives as long as the component | `useState` |
| survives reloads and redirects **in this tab**, then disappears | [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) |
| survives browser restarts and stays in sync **across tabs** | [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) |
| the **server** needs on the first request | [`useCookie`](https://reactuse.com/state/usecookie/) |
| is messaged between tabs, not stored | [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) |

The rule of thumb that resolves 90% of "local or session?" debates: **if two tabs showing different values would be a bug, use `localStorage`; if two tabs showing the same value would be a bug, use `sessionStorage`.** Theme, language, "don't show this again forever" — a user expects those to be one value everywhere, so local. A half-completed form, the filters on *this* dashboard view, the page you were on before an auth redirect — those belong to one tab, so session.

`useSessionStorage` and `useLocalStorage` share **the exact same API, serialization, and internals** — swap the import and the lifetime changes, nothing else does. Everything in the [useLocalStorage deep-dive](https://reactuse.com/blog/react-uselocalstorage-hook/) about hydration, `setValue(null)`, custom serializers and `onError` applies verbatim, so I'll only recap the parts that matter and spend the rest on the session-specific patterns and gotchas.

## What You Get Over the Hand-Rolled Version

Every codebase has a `useState` initializer that reads storage plus a `useEffect` that writes it back. Here's what that version gets wrong and `useSessionStorage` gets right:

- **SSR and hydration.** The hook is built on `useSyncExternalStore` with a server snapshot that returns the default. It never touches `window` on the server, and the client's first render matches the server HTML, then re-renders with the stored value through the proper path — no crash, no hydration-mismatch warning, no `typeof window` guard in your code.
- **Serialization by default type.** Pass a number and you get a number back; pass an object and it's `JSON.stringify`/`JSON.parse`; pass a `Map`, `Set` or `Date` and they round-trip correctly (a plain `JSON.stringify(new Map())` gives you `{}`). Need a specific wire format? Provide `serializer: { read, write }`.
- **`setValue(null)` removes the key.** "Cleared" is a real state, distinct from "reset to default": after `setForm(null)` the value is `null`, and on the next mount it comes back as `EMPTY_FORM`. That's your "start over" button, and it's why the type is `T | null`.
- **Corrupted data doesn't crash.** Someone edits DevTools, an old deploy wrote a different shape, a `JSON.parse` throws — the hook returns the default and reports through `onError` (default `console.error`) instead of taking the component down.
- **Storage unavailable? Degrades to memory.** Some privacy modes and embedded contexts throw on storage access. The hook catches it, calls `onError`, and behaves like plain `useState` for the rest of the session.
- **Every component on the same key agrees.** Two `useSessionStorage("checkout:step", 0)` calls — a progress bar in the header, the wizard body — re-render together on every write. The native `storage` event never fires in the document that made the change, so the hand-rolled version drifts; the hook re-broadcasts each write internally so it can't.

## Patterns

### Multi-step forms and wizards

The intro's checkout, done properly. Two details worth copying: **namespace your keys** (`checkout:step`, `checkout:form`) so a "start over" can clear them together and unrelated features on the same origin never collide, and store the *draft* separately from what's been *submitted*, so a successful order can wipe the draft without touching anything else:

```tsx
const [step, setStep] = useSessionStorage("checkout:step", 0);
const [draft, setDraft] = useSessionStorage<CheckoutForm>("checkout:form", EMPTY_FORM);

async function submit() {
  await api.placeOrder(draft!);
  setDraft(null); // remove the key — nothing lingers in the tab
  setStep(null);
  navigate("/thank-you");
}
```

For a large form with a keystroke-per-field update rate, storage writes are synchronous but cheap (a few KB of JSON); if you'd rather batch them, wrap the field updates in [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) and write the draft on the trailing edge.

### Surviving a redirect round-trip

OAuth, SSO, payment providers, "verify your email" links that come back to the app — anything that navigates the tab away and returns needs to stash "where was I?" somewhere that survives a full-page unload but shouldn't be shared with the tab next door. That's `sessionStorage`'s home turf: it's where auth libraries like MSAL keep their PKCE verifier and `state` by default, for exactly this reason.

```tsx
function useReturnTo() {
  const [returnTo, setReturnTo] = useSessionStorage<string>("auth:returnTo", null);
  const navigate = useNavigate();

  const stashAndRedirect = () => {
    setReturnTo(window.location.pathname + window.location.search);
    window.location.assign(buildAuthorizeUrl());
  };

  const restore = () => {
    const target = returnTo ?? "/";
    setReturnTo(null); // consume it — one round-trip, one restore
    navigate(target, { replace: true });
  };

  return { stashAndRedirect, restore };
}
```

Two tabs, two logins, two different `returnTo`s — no cross-talk. Had this been `localStorage`, tab B's redirect would overwrite tab A's return path.

### Per-tab view state that must *not* sync

The case that catches `useLocalStorage` fans off guard: a user opens two tabs of the same dashboard to compare "last 7 days" against "last 30 days". With `localStorage` and cross-tab sync, changing the range in one tab changes it in the other, and the user is left thinking the app is haunted. Any view state that's about *this window* — filters, sort column, expanded rows, which side panel is open — is a `sessionStorage` value:

```tsx
const [range, setRange] = useSessionStorage<"7d" | "30d" | "90d">("dashboard:range", "7d");
```

Reload preserves it, a second tab starts from the default, and the two never fight. If you *also* want a persisted "last used" default across sessions, keep that in `localStorage` and read it as the session default — two hooks, two lifetimes, both explicit.

### Once per session

Announcement banners, "we use cookies" notices, an onboarding tooltip — things a user should be able to dismiss for the duration of their visit without you promising to hide them forever:

```tsx
function ReleaseBanner() {
  const [dismissed, setDismissed] = useSessionStorage("banner:v6.5-dismissed", false);
  if (dismissed) return null;
  return (
    <aside>
      New in v6.5 — <a href="/changelog">see what changed</a>
      <button onClick={() => setDismissed(true)}>Dismiss</button>
    </aside>
  );
}
```

Ship it in the key (`banner:v6.5-dismissed`) so a new release gets a fresh banner without touching the old flag. The same shape works for "the user already saw the intro animation this session" — pair it with [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) if the animation is the kind you should skip anyway.

### A stable per-tab ID

`sessionStorage` is the only browser primitive that naturally gives you "one value per tab that survives reloads". That's precisely what you want for a tab identifier — tagging analytics events, correlating logs, or telling [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) messages apart by sender. `mountStorageValue` seeds the key on first mount only if it's absent:

```tsx
const [tabId] = useSessionStorage<string>("tab:id", null, {
  mountStorageValue: () => crypto.randomUUID(),
});
// null on the very first render, then a UUID that's stable across reloads of this tab
```

## Gotchas Worth Knowing

- **The default flashes before the stored value, once.** Under SSR the server can't see the browser's storage, so the first paint shows the default and the stored value arrives on the post-hydration render. For a wizard step that's a non-issue; for something like "which panel is open" you may want a skeleton until the value is in. The trade-offs are the same as for `localStorage` — see [SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/).
- **"Cleared when the tab closes" has an asterisk.** Chrome, Firefox and Safari all restore `sessionStorage` when the user reopens a closed tab or the browser restores a session after a crash. Don't rely on tab close as a *guaranteed* wipe for anything sensitive; if it must go, `setValue(null)` it yourself.
- **New tab ≠ same tab.** Users who Ctrl-click your link into a new tab arrive with empty `sessionStorage`. That's usually correct (they want a fresh view), but it means "the user has already dismissed the banner" and "the wizard is on step 3" don't carry over. If they should, that's a `localStorage` value.
- **`window.open()` copies, then forks.** If you `window.open()` a same-origin popup (a preview, a print view), it starts with a *copy* of the opener's `sessionStorage`. Writes in the popup don't reach the opener; use [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) or `postMessage` if they need to.
- **`listenToStorageChanges` is mostly moot for sessionStorage.** The native `storage` event only reaches *other documents sharing the same area* — for `sessionStorage`, that's same-origin iframes in the same tab, not other tabs. Same-tab sync between components is a separate, always-on mechanism and isn't affected by the option; leave it at the default and forget about it unless you have iframes.
- **Not a vault.** It's JavaScript-readable storage. It's fine for a PKCE verifier (single-use, short-lived, and worthless without the authorization code) and for drafts and view state; it's the wrong place for a long-lived access token you'd be upset to see exfiltrated. Server-side sessions and `httpOnly` cookies exist for that.
- **Storage can be full or blocked.** Quota is small and shared with everything else on the origin; some embedded/private contexts throw on access. Both are reported through `onError` and the hook keeps working in memory. Log it — a "my form reset" bug report often traces back to a `QuotaExceededError` nobody looked at.
- **The value is `T | null`, on purpose.** After `setValue(null)` the key is gone and you get `null`, not the default. If your code can't handle `null`, either never call `setValue(null)` (write the default instead) or normalize at the read site: `const s = step ?? 0`.

## When Not to Use useSessionStorage

- **The value should be one thing everywhere, forever** (theme, locale, "never show again") → [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/).
- **The server needs it on the first request** (theme without a flash, A/B bucket, auth session) → [`useCookie`](https://reactuse.com/state/usecookie/).
- **Tabs need to *talk*, not *store*** ("you were logged out in another tab") → [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/).
- **You're keeping a value across renders, not across reloads** → `useState`, `useRef`, or [`useLatest`](https://reactuse.com/state/uselatest/) — the [previous post in this series](https://reactuse.com/blog/react-uselatest-hook/) covers when each applies.
- **You want it in the URL** (shareable filters, deep-linkable steps) → put it in the query string; that beats every storage API when a link should reproduce the view.

## Takeaways

- `sessionStorage` = one tab, one origin, until the tab closes. It survives reloads, SPA and full-page navigations, back/forward, and redirect round-trips; it does **not** cross into new tabs (except as a one-time copy via `window.open()` / duplicate-tab), and browsers may restore it when a closed tab is reopened.
- [`useSessionStorage(key, default)`](https://reactuse.com/state/usesessionstorage/) is a drop-in `useState` with that lifetime: same tuple, functional updates, automatic serialization for objects/Maps/Sets/Dates, `setValue(null)` to remove, `onError` for corrupt data and blocked storage, SSR-safe via `useSyncExternalStore`, and every component on the same key stays in sync.
- Rule of thumb: two tabs disagreeing would be a bug → `localStorage`; two tabs *agreeing* would be a bug → `sessionStorage`. Multi-step forms, redirect round-trips, per-tab view state, once-per-session flags, and per-tab IDs are session values.
- It's a lifetime, not a security boundary. Keep secrets in `httpOnly` cookies, and clear sensitive keys yourself with `setValue(null)` rather than trusting tab close.

`useSessionStorage`, `useLocalStorage`, `useCookie`, and 110+ other SSR-safe, TypeScript-first hooks live in [`@reactuses/core`](https://reactuse.com) — one install, tree-shakeable, no dependencies to babysit.

```bash
npm install @reactuses/core
```
