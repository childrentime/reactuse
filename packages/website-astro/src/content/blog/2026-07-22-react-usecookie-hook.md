---
title: "React useCookie Hook: Cookies as Reactive State (2026)"
description: "A practical guide to useCookie in React: read, write, and delete cookies as component state — js-cookie options (expires, path, sameSite), same-tab sync, a refresh escape hatch for server-set cookies, and the SSR defaultValue rule explained. TypeScript-first."
slug: react-usecookie-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-22
tags: [react, hooks, state, typescript, tutorial]
keywords: [react useCookie, useCookie hook, usecookie react, react cookie hook, react cookies state, js-cookie react, react read cookie, react set cookie hook, react delete cookie, cookie state management react, useCookie typescript, react cookie ssr, useLocalStorage vs useCookie]
image: /img/og.png
---

# React useCookie Hook: Cookies as Reactive State (2026)

A theme toggle stores the user's choice in a cookie so the server can render the right theme on the next request — no flash of the wrong mode. The component writes `document.cookie = 'theme=dark'`, and then… nothing re-renders. `document.cookie` is not React state: writing it notifies nobody, reading it means parsing a semicolon-separated string, and there's no event to subscribe to when it changes. Every component that cares about that cookie is quietly reading a stale copy.

`useCookie` from [`@reactuses/core`](https://reactuse.com) turns a cookie into ordinary component state: read it like state, set it like state, and every instance watching the same key in the tab updates together. It's built on [`js-cookie`](https://github.com/js-cookie/js-cookie), so the attribute handling (expiry, path, `SameSite`) is the battle-tested kind. Everything below is the real API, TypeScript-first.

<!-- truncate -->

## The Manual Version, and Where It Frays

Cookies predate every framework you've used, and their API shows it. The hand-rolled React version looks like this:

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('theme='))
      ?.split('=')[1] ?? 'light'
  );

  const update = (next: string) => {
    document.cookie = `theme=${next}; path=/; max-age=31536000`;
    setTheme(next);
  };
  // ...
}
```

The common ways it frays:

- **The string parsing is your problem.** Splitting on `'; '`, prefix-matching the key, decoding values — that's a cookie parser you now maintain, per component.
- **Nothing else updates.** Two components showing the same cookie each hold their own `useState` copy. One writes; the other keeps rendering the old value until something unrelated re-renders it.
- **Attributes are stringly-typed.** `path`, `expires`, `secure`, `SameSite` are all fragments you concatenate by hand — and a typo doesn't throw, it just silently produces a cookie with the wrong scope.
- **It crashes on the server.** `document` doesn't exist during SSR, and even guarded, the server render and the client's first render can disagree — a hydration mismatch.

## useCookie — Cookies as State

```tsx
import { useCookie } from '@reactuses/core';

function ThemeToggle() {
  const [theme, setTheme] = useCookie('theme', { expires: 365, path: '/' }, 'light');

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current theme: {theme}
    </button>
  );
}
```

The signature:

```ts
function useCookie(
  key: string,
  options?: Cookies.CookieAttributes,
  defaultValue?: string
): readonly [
  string | undefined,                                    // current value
  (value: string | undefined | ((prev) => string | undefined)) => void, // update
  () => void                                             // refresh
];
```

Three things worth noting:

- **Values are strings.** Cookies are a string transport — the hook doesn't guess at serialization. Storing an object? `JSON.stringify` it yourself, or reconsider whether it belongs in a cookie at all (there's a ~4KB budget per cookie, and every byte rides along on every HTTP request).
- **Setting `undefined` deletes the cookie.** `setTheme(undefined)` removes it outright — no separate `remove` function to import. Functional updates work too: `setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))`.
- **If the cookie is missing on mount, the default is written to it.** Pass `'light'` as the default and the cookie materializes as `theme=light` on first render — which means the *server* sees it on the very next request. For a theme cookie, that's exactly the point.

## Cookie Attributes — Typed, Not Concatenated

The `options` argument is passed straight to `js-cookie`, so it's the full `Cookies.CookieAttributes` shape:

| Attribute | What it does |
| --- | --- |
| `expires` | Days from now (`365`), or a `Date` for an exact moment. Omit it for a session cookie that dies with the browser |
| `path` | Which paths see the cookie — you almost always want `'/'` |
| `domain` | Share across subdomains (`'.example.com'`) |
| `secure` | HTTPS-only |
| `sameSite` | `'strict'`, `'lax'`, or `'none'` — cross-site send policy |

The options object is compared by value, not identity — passing `{ expires: 365, path: '/' }` inline on every render is fine and doesn't churn anything.

One sharp edge worth knowing: attributes are *write-time* configuration. The browser doesn't let JavaScript read a cookie's path or expiry back — so the delete path uses the same `path`/`domain` you wrote with. Keep the options consistent for a given key and this never bites you.

## The Sync Model: Same Tab, Other Tabs, and the Server

This is where cookies genuinely differ from Web Storage, and the hook is honest about it.

**Same tab: automatic.** Every `useCookie('theme', …)` instance in the tab updates when any of them writes. Cookies have no native change event, so the hook dispatches an internal window event on write — sibling components stay in sync without you wiring anything.

**Other tabs: not automatic.** `localStorage` fires a cross-tab `storage` event; cookies fire nothing. If another tab writes the cookie, this tab won't know on its own. Cross-tab preference sync is [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) territory — or see [Cross-Tab State in React](https://reactuse.com/blog/react-cross-tab-state/) for the full toolbox.

**The server (or anything else): `refreshCookie`.** Cookies' superpower is that the *server* can write them — a `Set-Cookie` header on a fetch response, for instance. No client-side event fires for that either, so the third tuple element re-reads the cookie on demand:

```tsx
const [session, , refreshSession] = useCookie('session_hint', {}, '');

const login = async (creds: Credentials) => {
  await fetch('/api/login', { method: 'POST', body: JSON.stringify(creds) });
  refreshSession(); // pick up the cookie the response just set
};
```

That's the mental model in one line each: same-tab writes propagate themselves; cross-tab needs `localStorage`; external writes need `refreshCookie()`.

## useCookie vs useLocalStorage vs useSessionStorage

All three make persistent values reactive; they differ in *who can see the value and for how long*:

| | [`useCookie`](https://reactuse.com/state/usecookie/) | [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) | [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) |
| --- | --- | --- | --- |
| Server sees it | ✅ on every request | ❌ | ❌ |
| Lifetime | You choose (`expires`) | Forever until cleared | Tab close |
| Cross-tab sync | ❌ (no native event) | ✅ | ❌ |
| Size budget | ~4KB, sent on every request | ~5MB, stays local | ~5MB, stays local |
| Value type | `string` | Any (typed serializers) | Any (typed serializers) |

The decision rule: **does the server need this value to render correctly?** Theme, locale, consent, an A/B bucket — if the answer is yes, it belongs in a cookie, because the server reads it from the request headers before sending a single byte of HTML. If the value is client-only — draft form state, UI panel positions, a cached preference the server never renders — Web Storage is roomier and syncs across tabs. There's a full guide to the storage side in [useLocalStorage in React](https://reactuse.com/blog/react-uselocalstorage-hook/).

(And to be explicit about the elephant: real auth tokens belong in `HttpOnly` cookies, which JavaScript — including this hook — *cannot read at all*. That's a feature. `useCookie` is for the readable layer: preferences, hints, flags.)

## Real Use Cases

- **Flash-free theming.** The theme cookie rides on the request, the server renders `<html class="dark">` directly, and no correction happens on the client. This use case is *impossible* with `localStorage` — the server never sees storage.
- **Locale selection.** Same shape: the user picks a language, the cookie persists it, server-side rendering reads it and responds in the right language from the first byte.
- **Consent banners.** Write the consent decision with a long `expires`; both client code and server middleware can check it before loading analytics.
- **A/B experiment buckets.** Assign once with a functional update (`setBucket((prev) => prev ?? assignBucket())`), and the bucket is visible to server rendering, edge middleware, and the client alike.
- **Post-login UI hints.** A non-sensitive `logged_in=1` hint cookie (set by the server next to the real `HttpOnly` session) lets the client render account chrome instantly — `refreshCookie()` after the login call picks it up.

## SSR: The defaultValue Rule

During server rendering there is no `document.cookie`, so the hook can't read anything. The rule is one sentence: **when server-rendering, always pass `defaultValue`.** The server renders the default, the client's first render produces the same markup (that's what hydration requires — React compares the two), and the real cookie value lands in an effect immediately after. Skip the default in an SSR app and the hook warns you in development, because the server (rendering nothing) and the client (rendering the cookie) would disagree — a hydration mismatch.

If your framework reads cookies server-side (Next.js `cookies()`, a Remix loader), you can go one better: pass the *actual* request cookie as `defaultValue`, and the first paint is correct without any post-hydration correction. The broader pattern — why browser APIs need this discipline everywhere, not just here — is covered in [SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/).

## Takeaways

- **`document.cookie` isn't state** — no reactivity, string parsing, hand-concatenated attributes. [`useCookie`](https://reactuse.com/state/usecookie/) makes it a `[value, set, refresh]` tuple backed by `js-cookie`.
- **Setting `undefined` deletes; functional updates work;** a missing cookie is initialized to your `defaultValue` so the server sees it on the next request.
- **Know the sync model:** same-tab instances sync automatically; other tabs don't (that's [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/)); server-set cookies need an explicit `refreshCookie()`.
- **Choose by audience:** if the server needs the value to render — theme, locale, consent, A/B — it's a cookie. Client-only data belongs in Web Storage.
- **SSR rule:** always pass `defaultValue` when server-rendering — or better, thread the real request cookie in as the default.

Grab it from [`@reactuses/core`](https://reactuse.com/state/usecookie/) and make your cookies behave like the state they always wanted to be.
