# ChangeLog

## 1.0.0 (September 18 ,2022)

### Core

* Initial public release

## 1.0.2 (September 20 ,2022)

### Core

* add useActiveElement
* add useDraggable

## 1.0.3 (September 20 ,2022)

### Core

* add useElemenBounding hook

## 1.0.4 (September 22 ,2022)

### Core

* add useElementVisibility hook
* add useWindowsFocus hook

## 1.0.5 (September 24 ,2022)

### Core

* add useWindowScroll
* add useWindowSize

## 1.0.6(September 24 ,2022)

### Core

* fix useWindowScroll error

## 1.0.7(September 28, 2022)

### Core

* add useClickOutside
* add useClipboard
* add useCycleList
* refactor(useMediaQuery): rewrite with uses

## 1.1.2(Jan 20, 2023)

### Core

* add useFocus

## 1.1.3(Jan 21, 2023)

### Core

* add useControlled

## 2.0.0(March 4, 2023)

### Core

* fixed some ssr error
* add useScrollIntoView
* add useSticky
* add useReducedMotion

## 2.0.1(March 4, 2023)

### Core

* fixed some ssr error
* fixed some test

## 2.2.0(March 8, 2023)

### Core

* fixed some ssr error
* fixed some test

## 2.2.2(March 10, 2023)

### Core

* add test for useActiveElement
* fix bug in useDarkMode
* add Option ignoreDefault in useLocalStorage and useSessionStorage

## 2.2.3(March 14, 2023)

### Core

* fix bug in useDarkMode
* delete option ignoreDefault in useLocalStorage and useSessionStorage
* add option csrData in useLocalStorage and useSessionStorage

## 2.2.4(March 30, 2023)

### Core

* add useCountDown Hook

## 2.2.5(April 6, 2023)

### Core

* add useSupported
* add useTextSelection
* add useEyeDropper

## 2.2.6(May 8, 2023)

### Core

* fix esm import error

## 2.2.9(Jul 6, 2023)

### Core

* add useSetState
* add useMeasure

## 3.0.0(Jul 7, 2023)

### Core

#### Breaking Change

* Dynamic dom element passing parameters is now supported

## 3.0.1(Jul 18, 2023)

### Core

* useMediaDevices support request permissons, and change return result to array.

## 3.0.2(Jul 18, 2023)

### Core

* fix useMediaDevices in firefox.

## 3.0.3(Jul 18, 2023)

### Core

* fix useMediaDevices when create default value;

## 4.0.0(Ju1 22, 2023)

### Core

#### Breaking Changes

* options are now consider reference immutable.

## 4.0.1(Ju1 26, 2023)

### Core

* fix useClickOutside.

## 4.0.3(Ju1 26, 2023)

### Core

* fix useElementVisibility
* fix external deps

## 4.0.6(Aug 27, 2023)

### Core

* feat: add useHover hook

## 4.0.7(Sep 3, 2023)

### Core

* feat: add useCssVar, useScreenSafeArea

## 4.0.8(Sep 21, 2023)

### Core

* usePermission: Do not fail on Safari 15

* move types package to devDeps

## 4.0.9(Oct 07, 2023)

### Core

* feat: add useWebNotification

## 4.0.10(Oct 08, 2023)

### Core

* feat: add useLocationSelector

## 4.0.11(Jan 09, 2024)

### Core

* perf: reduce useWindowSize re-render

## 5.0.0(Feb 05, 2024)

### Website

* New website
* Use comments when generating the types of APIs.

### Breaking Change

* Element target support dropped
* For a complex object passed in, adopt deep comparison when used in an effect.
* Delete `useControlled` and `useVirtualList`

## 5.0.1(Feb 22, 2024)

### Core

* fix(useLocalStorage): remove `defaultValue` in deps

## 5.0.2(Feb 22, 2024)

### Core

* fix(useDraggable): remove max call effect.

## 5.0.3(Feb 22, 2024)

### Core

* feat(useDraggable): add container boundary

## 5.0.4(Feb 22, 2024)

### Core

* fix(useLocalStorage): use `useDeepCompareEffect`

## 5.0.5(Feb 22, 2024)

### Core

* feat(useDraggable): improve boundary for scroll container

## 5.0.6(Feb 28, 2024)

### Core

* feat(useDraggable): support mannual set position

## 5.0.7(March 01, 2024)

### Core

* restore target element
* feat(useClickOutSide): support enable prop

## 5.0.8(March 12, 2024)

### Core

* fix(useWindowScroll): ssr error

## 5.0.9(March 17, 2024)

### Core

* add usePlatform
* add useMobileLandscape