<p align="center">
<a href="https://github.com/childrentime/reactuse">
  <img src="https://reactuse.com/img/og.png" alt="ReactUse - Collection of essential React Hooks" width="300">
</a>
</p>

<p align="center">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/@reactuses/core?style=for-the-badge&labelColor=24292e">
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@reactuses/core?color=50a36f&label=&style=for-the-badge&labelColor=24292e">
  <img alt="UnLicense" src="https://img.shields.io/npm/l/@reactuses/core?style=for-the-badge&labelColor=24292e">
  <img alt="Tree Shaking Friendly" src="https://img.shields.io/badge/Tree%20Shaking-Friendly-brightgreen?style=for-the-badge&labelColor=24292e">
  <img alt="TypeScript Support" src="https://img.shields.io/badge/TypeScript-Support-blue?style=for-the-badge&labelColor=24292e">
</p>

## Introduction

**ReactUse** is a comprehensive collection of **115+ essential React Hooks** for building modern React applications. Inspired by [VueUse](https://vueuse.org/), it provides production-ready hooks for browser APIs, state management, sensors, animations, DOM elements, and more.

### Features

- 🎯 **115+ Hooks** — The most comprehensive React hooks collection
- 📦 **Tree-Shakable** — Import only what you need
- 🔷 **TypeScript** — Full type definitions for every hook
- 🖥️ **SSR Compatible** — Works with Next.js, Remix, and more
- 📚 **Well Documented** — Interactive demos for every hook
- 🤖 **MCP Support** — AI-powered hook discovery

### Installation

```bash
npm i @reactuses/core
```

### Quick Start

```tsx
import { useToggle } from "@reactuses/core";

const Demo = () => {
  const [on, toggle] = useToggle(true);
  return <button onClick={toggle}>{on ? "ON" : "OFF"}</button>;
};
```

---

## Hook Categories

<details>
<summary><strong>Browser (48 hooks)</strong></summary>

useClipboard, useColorMode, useCookie, useDarkMode, useDocumentVisibility, useEyeDropper, useFavicon, useFileDialog, useFullscreen, useMediaDevices, useMediaQuery, useOnline, usePermission, usePlatform, usePreferredColorScheme, usePreferredContrast, usePreferredDark, usePreferredLanguages, useScreenSafeArea, useScriptTag, useTextDirection, useTitle, useWebNotification, useBroadcastChannel, useEventSource, useFetchEventSource, useGeolocation, useIdle, useKeyModifier, useMobileLandscape, useNetwork, useOrientation, usePageLeave, useSpeechRecognition, useWindowFocus, useWindowScroll, useWindowSize, and more...

</details>

<details>
<summary><strong>State (24 hooks)</strong></summary>

useBoolean, useControlled, useCounter, useCycleList, useDebounce, useDebounceFn, useDisclosure, useLocalStorage, useMap, usePrevious, useSessionStorage, useSetState, useThrottle, useThrottleFn, useToggle, and more...

</details>

<details>
<summary><strong>Element (19 hooks)</strong></summary>

useClickOutside, useDraggable, useDropZone, useElementBounding, useElementByPoint, useElementSize, useElementVisibility, useFocus, useHover, useInfiniteScroll, useIntersectionObserver, useLongPress, useMeasure, useMouse, useMousePressed, useMutationObserver, useResizeObserver, useScroll, useScrollIntoView, and more...

</details>

<details>
<summary><strong>Effect (20 hooks)</strong></summary>

useAsyncEffect, useCustomCompareEffect, useDeepCompareEffect, useEventListener, useInterval, useMount, useRafFn, useTimeout, useTimeoutFn, useUnmount, useUpdate, and more...

</details>

---

## Who's Using This

[![PDD](https://img.shields.io/badge/PDD-E_Commerce-orange?style=for-the-badge)](https://www.pinduoduo.com/)
[![Shopee](https://img.shields.io/badge/Shopee-E_Commerce-red?style=for-the-badge)](https://shopee.com/)
[![Ctrip](https://img.shields.io/badge/Ctrip-Travel-blue?style=for-the-badge)](https://www.ctrip.com/)
[![Bambu Lab](https://img.shields.io/badge/Bambu_Lab-3D_Printing-green?style=for-the-badge)](https://bambulab.com/)

---

## MCP Support

If you want to use the MCP (Model Context Protocol) integration with reactuse, you can easily set it up with the following configuration. This allows you to run the `@reactuses/mcp` utility via `npx` for enhanced command-line support and automation.

Add the following to your configuration:

```json
"@reactuses/mcp": {
  "command": "npx",
  "args": ["-y", "@reactuses/mcp@latest"],
  "type": "stdio"
}
```

---

## Documentation

📖 [Full Documentation](https://reactuse.com) | 💬 [Discord](https://discord.gg/VEMFdByJ) | 🐛 [Issues](https://github.com/childrentime/reactuse/issues)

---

## Thanks

This project is heavily inspired by the following awesome projects.

- [streamich/react-use](https://github.com/streamich/react-use)
- [ahooks](https://github.com/alibaba/hooks)
- [vueuse](https://github.com/vueuse/vueuse)

---

## Sponsor Me

If my work has helped you, consider buying me a cup of coffee. Thank you very much🥰!.

[Buy me a coffee](https://www.buymeacoffee.com/lianwenwu)
