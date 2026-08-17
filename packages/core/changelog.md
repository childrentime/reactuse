# ChangeLog

## 1.0.0 (September 18 ,2022)

- Initial public release

## 1.0.2 (September 20 ,2022)

- add useActiveElement
- add useDraggable

## 1.0.3 (September 20 ,2022)

- add useElemenBounding hook

## 1.0.4 (September 22 ,2022)

- add useElementVisibility hook
- add useWindowsFocus hook

## 1.0.5 (September 24 ,2022)

- add useWindowScroll
- add useWindowSize

## 1.0.6(September 24 ,2022)

- fix useWindowScroll error

## 1.0.7(September 28, 2022)

- add useClickOutside
- add useClipboard
- add useCycleList
- refactor(useMediaQuery): rewrite with uses

## 1.1.2(Jan 20, 2023)

- add useFocus

## 1.1.3(Jan 21, 2023)

- add useControlled

## 2.0.0(March 4, 2023)

- fixed some ssr error
- add useScrollIntoView
- add useSticky
- add useReducedMotion

## 2.0.1(March 4, 2023)

- fixed some ssr error
- fixed some test

## 2.2.0(March 8, 2023)

- fixed some ssr error
- fixed some test

## 2.2.2(March 10, 2023)

- add test for useActiveElement
- fix bug in useDarkMode
- add Option ignoreDefault in useLocalStorage and useSessionStorage

## 2.2.3(March 14, 2023)

- fix bug in useDarkMode
- delete option ignoreDefault in useLocalStorage and useSessionStorage
- add option csrData in useLocalStorage and useSessionStorage

## 2.2.4(March 30, 2023)

- add useCountDown Hook

## 2.2.5(April 6, 2023)

- add useSupported
- add useTextSelection
- add useEyeDropper

## 2.2.6(May 8, 2023)

- fix esm import error

## 2.2.9(Jul 6, 2023)

- add useSetState
- add useMeasure

## 3.0.0(Jul 7, 2023)

- Dynamic dom element passing parameters is now supported

## 3.0.1(Jul 18, 2023)

- useMediaDevices support request permissons, and change return result to array.

## 3.0.2(Jul 18, 2023)

- fix useMediaDevices in firefox.

## 3.0.3(Jul 18, 2023)

- fix useMediaDevices when create default value;

## 4.0.0(Ju1 22, 2023)

- options are now consider reference immutable.

## 4.0.1(Ju1 26, 2023)

- fix useClickOutside.

## 4.0.3(Ju1 26, 2023)

- fix useElementVisibility
- fix external deps

## 4.0.6(Aug 27, 2023)

- feat: add useHover hook

## 4.0.7(Sep 3, 2023)

- feat: add useCssVar, useScreenSafeArea

## 4.0.8(Sep 21, 2023)

- usePermission: Do not fail on Safari 15

- move types package to devDeps

## 4.0.9(Oct 07, 2023)

- feat: add useWebNotification

## 4.0.10(Oct 08, 2023)

- feat: add useLocationSelector

## 4.0.11(Jan 09, 2024)

- perf: reduce useWindowSize re-render

## 5.0.0(Feb 05, 2024)

**Website**:

- New website
- Use comments when generating the types of APIs.

**Breaking Change**:

- Element target support dropped
- For a complex object passed in, adopt deep comparison when used in an effect.
- Delete `useControlled` and `useVirtualList`

## 5.0.1(Feb 22, 2024)

- fix(useLocalStorage): remove `defaultValue` in deps

## 5.0.2(Feb 22, 2024)

- fix(useDraggable): remove max call effect.

## 5.0.3(Feb 22, 2024)

- feat(useDraggable): add container boundary

## 5.0.4(Feb 22, 2024)

- fix(useLocalStorage): use `useDeepCompareEffect`

## 5.0.5(Feb 22, 2024)

- feat(useDraggable): improve boundary for scroll container

## 5.0.6(Feb 28, 2024)

- feat(useDraggable): support mannual set position

## 5.0.7(March 01, 2024)

- restore target element
- feat(useClickOutSide): support enable prop

## 5.0.8(March 12, 2024)

- fix(useWindowScroll): ssr error

## 5.0.9(March 17, 2024)

- add usePlatform
- add useMobileLandscape

## 5.0.10(March 17, 2024)

- add deps in usePlatform useCallback

## 5.0.11(April 12, 2024)

- Fixed the issue where useOnceEffect does not execute the cleanup function

## 5.0.12(April 28, 2024)

- support `Pauseble` with useInterval

## 5.0.13(April 29, 2024)

- useFileDialog: add files return in `open`
- docs: fix search

## 5.0.14(May 17, 2024)

- fix(useLocalStorage): remove extra render caused by diff default value

## 5.0.15(June 05, 2024)

- feat: add useDisclosure
- feat: add useEventSource
- feat: add useControlled

## 5.0.16(July 15, 2024)

- feat: add useMergedRefs

## 5.0.17(July 16, 2024)

- feat: add use polyfill

## 5.0.18(July 17, 2024)

- fix: add useGeolocation navigator support check

## 5.0.19(July 25, 2024)

- feat: add usePreferredLanguages
- feat: add useBroadcastChannel
- feat: add useDevicePixelRatio
- feat: add useElementByPoint
- feat: add useQRCode
- fix next.js import error: `SyntaxError: Named export 'a' not found. The requested module './index-client-Qon46B4S.js' is a CommonJS module, which may not support all module.exports as named exports.`. which caused by `use client` with bunchee;

## 5.0.20(Aug 12, 2024)

- fix(useActiveElement): add init state

## 5.0.21(Aug 16, 2024)

- feat(useLocalStorage): deprecated `effectStorageValue`, rename to `mountStorageValue`. add `listenToStorageChanges` option, default to `true`

## 5.0.23(Nov 11, 2024)

- feat: add useFetchEventSource

## 6.0.0(Dec 20, 2024)

**Breaking Changes**: Modified the runtime behavior of the following hooks to ensure concurrent mode safety:

- useActiveElement
- useCustomCompareEffect
- useDarkMode
- useLatest
- usePrevious
- useMouse

Warning: These changes will affect your applications. Using unstable references as prop parameters in these hooks may trigger infinite React re-renders, since these props are now included in the hooks' dependency arrays.

All DOM parameter passing now requires a stable reference. When using SSR mode, you might commonly pass functions like () => window. Make sure to extract these functions to the outer scope to maintain a stable reference, for example:

If you're passing DOM parameters using refs, you don't need to worry about this issue since refs always maintain stable references.

```js
// Don't do this:
function Component() {
  useHook(() => window)
}

// Do this instead:
const getWindow = () => window
function Component() {
  useHook(getWindow)
}
```

**Chore**: List React19 as Dependency.

## 6.0.2(May 06, 2025)

- fix(react native): Property 'document' doesn't exist.

## 6.0.3(May 23, 2025)

- fix(useEventSource): improve EventSource connection handling

## 6.0.4(Jul 02, 2025)

- fix(useClipboard): immediately access clipboard

## 6.0.5(Jul 03, 2025)

- fix(useClipboard): add document focus check

## 6.1.0(Sep 24, 2025)

**Breaking Changes**:

- **useDarkMode**: Storage format changed from boolean to string values ('dark'/'light'). This affects localStorage/sessionStorage data and SSR scripts. Existing stored boolean values will be automatically migrated, but custom SSR scripts need to be updated to handle string comparisons instead of boolean values.

**Features**:

- feat: add useMap hook for reactive Map state management with set, get, remove, has, clear, and reset operations
- feat: add useColorMode hook with support for multiple color modes beyond dark/light
- feat: add useBoolean hook for boolean state management with setValue, setTrue, setFalse, and toggle operations
- feat: add useClickAway alias for useClickOutside hook
- feat: add useCopyToClipboard alias for useClipboard hook
- feat: add comprehensive documentation for useColorMode hook
- docs: add context provider examples for both useColorMode and useDarkMode  
- docs: add multi-color theme examples in useColorMode documentation (6 themes: light, dark, blue, green, purple, sepia)
- docs: update useDarkMode documentation scripts to handle new string storage format

## 6.1.1(Oct 22, 2025)

- feat: add useSpeechRecognition hook.

## 6.1.2(Oct 30, 2025)

- feat: add useScratch hook.

## 6.1.6(Nov 21, 2025)

- fix(createStorage): use `useLatest` to avoid unnecessary re-renders and simplify dependency arrays

## 6.1.8(Dec 2025)

- fix(useMap): fix type parameter support by moving generics into function signature, now `useMap<string, number>()` works correctly

## 6.1.9(Jan 2026)

- fix(useRafState): fix bug where multiple consecutive functional updates would only apply the last one. Now correctly accumulates all updates within the same animation frame, matching React's useState behavior. For example, calling `setState(n => n + 1)` three times consecutively will now correctly increase the value by 3 instead of 1.

## 6.1.11(Jan 20, 2026)

- fix(usePageLeave): fix infinite re-render issue caused by unstable handler references  
- fix(useEventListener): improve stability to prevent unnecessary event listener re-bindings while maintaining support for ref-based targets. Uses stable element identifiers: for refs, tracks the ref object itself; for functions/direct elements, tracks the resolved actual element. This allows function-based targets like `() => document` to work without causing infinite loops, while still re-binding when the actual target element changes
- fix(useSticky): fix infinite re-render issue when passing unstable function references as target or scroll element
- fix(useMutationObserver): add missing `target` dependency - now correctly re-observes when target element changes
- fix(useResizeObserver): fix infinite re-render issue when passing unstable function references as target
- fix(useIntersectionObserver): add missing `target` dependency - now correctly re-observes when target element changes
- feat(useStableTarget): add new internal utility hook for creating stable identifiers for BasicTarget parameters that can be safely used in effect dependencies. This solves the common problem where passing unstable function references like `() => document` would cause infinite re-renders

## 6.1.12(Mar 10, 2026)

- fix(useGeolocation): make useSupported check more robust

## 6.3.0(Mar 24, 2026)

- refactor(createStorage): replace `useState` + `useDeepCompareEffect` with `useSyncExternalStore`, eliminating CSR first-render flicker, SSR hydration mismatches, and stale cross-tab reads (#195)
- fix(createStorage): fix stale closure in consecutive functional updates within the same synchronous batch — `updateState` now reads from `getSnapshot()` instead of the render-time `state`
- test(useLocalStorage): add 12 new test cases covering cross-tab sync, `storage.clear()`, `listenToStorageChanges` toggle, three-state semantics, `onError`, `mountStorageValue`, and consecutive functional updates

## 6.4.1(Jul 28, 2026)

- fix(useScriptTag): handle the rejection from the `immediate` auto-load (#206). The auto-load called `load()` as a bare statement, so when a script failed to load — blocked by an ad blocker, offline, 404 — the rejected promise reached `window.onunhandledrejection` and got reported by error trackers. It now attaches a no-op catch; `status === 'error'` remains the reporting channel, and an explicit `load()` still rejects for callers that hold the promise themselves. Thanks @Faithfinder

## 6.4.2(Jul 31, 2026)

- fix(useOrientation): correct the inverted `isBrowser` guards in `lockOrientation`/`unlockOrientation` (#215). Both early-returned *in* the browser and only ran during SSR, making them no-ops everywhere it mattered; the guards now return when there is no browser. Thanks @ostapondo
- fix(useInterval): clear a manually resumed interval on unmount (#212). With `controls: true` the effect registered no cleanup, so an interval started through `resume()` kept firing after the component unmounted; the cleanup now runs in its own mount-scoped effect. `resume()` also clears a running timer before starting a new one, so calling it twice no longer leaks an interval that `pause()` can't reach. Thanks @ostapondo
- fix(useMicrophone): reset `level` to 0 on `stop()` (#213). The rAF loop is the only writer of `level`, so a meter bound to it stayed frozen at the last reading long after the microphone was released. Thanks @ostapondo
- fix(useElementByPoint): avoid a re-render on every frame in `multiple` mode (#214). `elementsFromPoint` allocates a fresh array on every call, so the hit list is now compared element-by-element and the previous state is kept when nothing changed. Thanks @ostapondo

## 6.5.0(Aug 5, 2026)

- build(core): ship per-module `dist` (bunchee → tsdown, `unbundle`) so barrel-file optimizers such as Next.js `optimizePackageImports` can unroll `@reactuses/core` imports (#216). A Next.js dev page importing only `useDebounce` previously pulled every hook into one 552 kB chunk; it now loads just `useDebounce` and its dependency chain (64 kB, −88%). Every hook is also importable as a subpath (`@reactuses/core/useDebounce`) via a new `./*` export; the CJS entry moves to `./dist/index.js` / `./dist/index.d.ts`

## 6.5.1(Aug 15, 2026)

- fix(useInterval): don't run the `immediate` callback while paused (#128). `immediate: true` invoked the callback inside the effect unconditionally, so a `delay` flipping to `null` — the documented "stop the timer" value — still ran it once at the moment of pausing (e.g. a poll firing exactly when `visible && online ? 10_000 : null` went offline). The immediate call is now guarded on `delay !== null`; `controls: true` behaviour is unchanged. Thanks @vincerubinetti
- fix(useEventSource): honor `autoReconnect.retries` and cancel a pending reconnect on unmount. `open()` reset the retry counter on every call, but the reconnect path was `setTimeout(open, delay)`, so each retry wiped the counter and `retries` could never be exceeded (a flapping server retried forever and `onFailed` never fired). Reconnects now go through an internal `connect()` that keeps the count; a successful `onopen` resets it; the public `open()` starts a fresh budget. The reconnect timer is tracked and cleared from `close()`, so unmounting (or an explicit `close()`) during the delay no longer spawns a fresh `EventSource` for a component that's gone
- docs(useInterval): describe what `immediate` and `controls` actually do — `immediate` runs the callback once whenever the interval starts (mount and every `delay` change, never while `null`); `controls` switches to manual `resume()` / `pause()` instead of auto-starting from `delay` (#128)

## 6.5.2(Aug 17, 2026)

- fix(useClipboard): work in non-secure contexts, and expose Clipboard API support (#218, #219). `navigator.clipboard` is `undefined` whenever `window.isSecureContext` is false — plain `http://`, LAN IPs, some embedded webviews — so `copy()` rejected and the hook was unusable there. Copying now falls back to a temporary `<textarea>` plus `document.execCommand('copy')`, and `copy`/`cut` events fall back to the current document selection when a Clipboard API read is unavailable or denied. The returned tuple gains a third element, `isSupported`, reporting whether `navigator.clipboard` exists — the copy fallback works either way, so treat it as a capability hint rather than a gate. The selection is captured synchronously inside the event, because by the time an awaited continuation runs the browser has already cleared it on `cut` (Firefox) or torn down the fallback textarea. Verified against Chromium, Firefox and WebKit. Thanks @tanukihee
