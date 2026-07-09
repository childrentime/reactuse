---
title: "React useLocalStorage Hook: SSR-Safe Persistent State (2026)"
description: "A practical guide to the useLocalStorage hook in React: a useState-like API that persists across reloads, serializes objects, Maps, Sets and Dates automatically, syncs across tabs and components, and renders safely on the server. Every failure mode of the hand-rolled version, handled."
slug: react-uselocalstorage-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-09
tags: [react, hooks, state-management, typescript, tutorial]
keywords: [react useLocalStorage, useLocalStorage hook, uselocalstorage react, react localstorage hook, persist state react, react localstorage typescript, ssr-safe localstorage, react localstorage cross-tab sync, react save state on refresh, localstorage react hydration, useLocalStorage next.js, react persistent state hook, useSessionStorage, localstorage json react]
image: /img/og.png
---

# React useLocalStorage Hook: SSR-Safe Persistent State (2026)

The user spends two minutes setting up filters on your dashboard, hits refresh, and everything resets. `useState` is ephemeral by design — every reload starts from scratch. The fix everyone knows is `localStorage`; the wiring everyone writes for it — a `useState` initializer that reads storage plus a `useEffect` that writes it back — ships at least four bugs: it crashes or mismatches under SSR, it throws on corrupted data, it desyncs across browser tabs, and two components using the same key silently drift apart.

`useLocalStorage` is the hook that gets all of it right. It looks exactly like `useState`, but the value survives reloads, serializes more than just strings, stays in sync across tabs *and* across components, and renders safely on the server. Everything below is the real [`@reactuses/core`](https://reactuse.com) API, TypeScript-first.

<!-- truncate -->

## Why Not Just useState + useEffect?

Here is the version that ends up in most codebases, and it's buggier than it looks:

```tsx
function usePersistedState(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key); // 🐛 see below
    return stored !== null ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

1. **It breaks under SSR.** On the server there is no `localStorage`, so the initializer throws. Guard it with `typeof window` and you trade the crash for a hydration mismatch: the server rendered the default, the client immediately renders the stored value, and React warns — or worse, silently patches the wrong DOM.
2. **It throws on bad data.** `JSON.parse` over a value that was hand-edited, half-written, or saved by an older version of your app takes the whole component down with it.
3. **It ignores other tabs.** The user changes the setting in tab A; tab B keeps showing — and re-saving — the stale value until a full reload.
4. **It ignores other components.** Two components calling `usePersistedState('theme', …)` each hold their own `useState`. One updates, the other doesn't re-render. Same key, two truths.

Each bug is fixable by hand, and the fixes add up to exactly what a good hook already is.

## useLocalStorage — useState That Survives Reloads

The API is deliberately shaped like `useState`: a tuple of value and setter, with the default as the second argument.

```tsx
import { useLocalStorage } from '@reactuses/core';

function Settings() {
  const [layout, setLayout] = useLocalStorage('dashboard-layout', 'grid');

  return (
    <select value={layout ?? 'grid'} onChange={(e) => setLayout(e.target.value)}>
      <option value="grid">Grid</option>
      <option value="list">List</option>
    </select>
  );
}
```

The signature is `useLocalStorage(key, defaultValue, options?)`:

```ts
const [value, setValue] = useLocalStorage<T>(key, defaultValue, options);
// value: T | null      setValue: Dispatch<SetStateAction<T | null>>
```

On first visit `value` is the default; after any `setValue`, the value is written to `localStorage` and comes back on the next reload. Functional updates work exactly like `useState`'s: `setValue(prev => …)` receives the current stored value. The only visible difference from `useState` is the type: `value` is `T | null`, because a persisted key can also be *removed* — more on that below.

## Objects, Maps, Sets, Dates — Serialization Is Automatic

`localStorage` only stores strings; the hook picks the right serializer for you by looking at the type of the default value. Pass an object and it round-trips through `JSON.stringify`/`JSON.parse`; pass a number and you get a number back, not `"42"`:

```tsx
const [filters, setFilters] = useLocalStorage('filters', {
  status: 'open',
  assignee: null as string | null,
});

const [fontSize, setFontSize] = useLocalStorage('font-size', 16);
const [seen, setSeen] = useLocalStorage('seen-ids', new Set<string>());
const [lastVisit, setLastVisit] = useLocalStorage('last-visit', new Date());
```

That last pair is the part hand-rolled versions never handle: `Map`, `Set`, and `Date` defaults get dedicated serializers (`Set` → JSON array, `Date` → ISO string, and back), so `seen` is a real `Set` with `.has()` after a reload — not a stringified husk.

When the built-ins don't fit — say the value needs to stay compatible with a format some other system wrote — pass your own:

```tsx
const [config, setConfig] = useLocalStorage('legacy-config', defaultConfig, {
  serializer: {
    read: (raw) => parseLegacyFormat(raw),
    write: (value) => toLegacyFormat(value),
  },
});
```

## Removing the Key: setValue(null)

Persisted state has one operation `useState` doesn't: *forget this*. Setting the value to `null` removes the key from `localStorage` entirely:

```tsx
const [token, setToken] = useLocalStorage<string>('auth-token', null);

// login
setToken(response.token);
// logout — key is deleted from localStorage, value becomes null
setToken(null);
```

This is why the value's type is `T | null`. A removed key stays `null` for the rest of the session — it does **not** snap back to the default — which is what you want: "logged out" and "never logged in with a default" are different states, and the hook doesn't blur them.

## SSR and Hydration, Actually Safe

`useLocalStorage` is built on `useSyncExternalStore` — React's own primitive for subscribing to external data — with a server snapshot that returns the default value. That one design choice buys three things:

- **No crash on the server.** The hook never touches `window` or `localStorage` during server rendering. No `typeof window` guard in your code.
- **No hydration mismatch.** The client's first render deliberately matches the server HTML (the default), then React re-renders with the stored value through the proper `useSyncExternalStore` path — no warning, no patched-over DOM.
- **Concurrent-safe reads.** Because storage is treated as an external store, React 18+ features like transitions never see a torn value.

The one thing no localStorage hook can eliminate is the brief flash of the default before the stored value appears — the server genuinely doesn't know what's in the browser's storage. For values where that flash hurts (theme is the classic), the fix lives outside React, in a blocking inline script; the trade-offs are covered in [SSR-Safe React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/).

And when storage itself is unavailable — some privacy modes, or storage access that throws — the hook degrades to a plain in-memory state holder and reports the failure through `onError` instead of crashing:

```tsx
const [draft, setDraft] = useLocalStorage('draft', '', {
  onError: (e) => trackWarning('storage unavailable', e), // default: console.error
});
```

The same `onError` catches corrupted data (the `JSON.parse` bug from the naive version — the hook returns the default instead of throwing) and quota-exceeded writes.

## In Sync Across Tabs — and Across Components

Change the value in one tab and every other tab updates instantly, because the hook listens to the browser's native `storage` event:

```tsx
// Tab A and Tab B both render this — flip it in one, both update.
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

Cross-tab sync is on by default; opt out with `listenToStorageChanges: false` if a tab should keep its own view until reload.

The subtler half is **same-tab** sync. The native `storage` event never fires in the tab that made the change, so in a hand-rolled hook, a `theme` toggle in the header updates the header — and the sidebar reading the same key keeps its stale copy. `useLocalStorage` re-broadcasts every write internally, so every component on the same key re-renders together, always. Two components, one key, one truth — the drift bug from the naive version simply doesn't exist. (If you're syncing more than persisted state across tabs, [Cross-Tab State in React](https://reactuse.com/blog/react-cross-tab-state/) covers the full toolbox.)

## The Storage Family

`useLocalStorage` has siblings; pick by *where* the value should live and *how long*:

| Hook | Persists in… | Survives | Cross-tab |
| --- | --- | --- | --- |
| [`useLocalStorage`](https://reactuse.com/state/uselocalstorage/) | `localStorage` | reloads + browser restarts | ✅ synced |
| [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) | `sessionStorage` | reloads, per tab | ❌ per-tab by design |
| [`useCookie`](https://reactuse.com/state/usecookie/) | cookies | per cookie options; sent to the server | ✅ |
| [`useBroadcastChannel`](https://reactuse.com/browser/usebroadcastchannel/) | nothing (messaging only) | — | ✅ live messaging |

`useSessionStorage` shares the exact same API and serialization — swap the import and the value becomes per-tab. `useCookie` is the one to reach for when the *server* needs the value on the first request (which is also the real fix for the theme-flash problem). `useBroadcastChannel` isn't storage at all, but it's the right tool when tabs need to *talk* rather than *persist*.

## Takeaways

- The hand-rolled `useState` + `useEffect` + `localStorage` combo ships four bugs: SSR crash or hydration mismatch, `JSON.parse` crashes on bad data, no cross-tab sync, and drift between components sharing a key.
- **`useLocalStorage(key, defaultValue)`** is a drop-in `useState` that persists — same tuple, same functional updates, typed `T | null`.
- Serialization is automatic and driven by the default's type — objects, arrays, numbers, booleans, and even `Map`, `Set`, and `Date` round-trip correctly. Custom `serializer` when you need a specific format.
- **`setValue(null)` removes the key** — "cleared" is a real state, distinct from the default.
- Built on `useSyncExternalStore`: SSR-safe with no guards, hydration-mismatch-free, and it degrades to in-memory state (with `onError`) when storage is blocked.
- Sync is total: native `storage` events across tabs (toggle with `listenToStorageChanges`), internal re-broadcast across components in the same tab — always on.
- Same API, different lifetime: [`useSessionStorage`](https://reactuse.com/state/usesessionstorage/) for per-tab, [`useCookie`](https://reactuse.com/state/usecookie/) when the server needs it too.

Grab it from [`@reactuses/core`](https://reactuse.com/state/uselocalstorage/) and let refresh stop meaning reset.
