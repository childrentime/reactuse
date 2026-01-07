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
