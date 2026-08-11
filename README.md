[![MCP Toplist](https://mcptoplist.com/badge/glama%2Fchildrentime%2Freactuse.svg)](https://mcptoplist.com/server/glama%2Fchildrentime%2Freactuse)

<p align="center">
<a href="https://github.com/childrentime/reactuse#gh-light-mode-only">
  <img src="https://reactuse.com/img/og.png#gh-light-mode-only" alt="ReactUse - Collection of essential React Hooks" width="300">
</a>
<a href="https://github.com/childrentime/reactuse#gh-dark-mode-only">
  <img src="https://reactuse.com/img/og-dark.png#gh-dark-mode-only" alt="ReactUse - Collection of essential React Hooks" width="300">
</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@reactuses/core"><img alt="NPM Version" src="https://img.shields.io/npm/v/@reactuses/core?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://www.npmjs.com/package/@reactuses/core"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@reactuses/core?color=50a36f&label=&style=for-the-badge&labelColor=24292e"></a>
  <img alt="UnLicense" src="https://img.shields.io/npm/l/@reactuses/core?style=for-the-badge&labelColor=24292e">
  <img alt="Tree Shaking Friendly" src="https://img.shields.io/badge/Tree%20Shaking-Friendly-brightgreen?style=for-the-badge&labelColor=24292e">
  <img alt="TypeScript Support" src="https://img.shields.io/badge/TypeScript-Support-blue?style=for-the-badge&labelColor=24292e">
  <a href="https://github.com/sponsors/childrentime"><img alt="Sponsor ReactUse" src="https://img.shields.io/badge/%E2%9D%A4-Sponsor-db61a2?style=for-the-badge&labelColor=24292e"></a>
</p>

<p align="center">
  <a href="https://context7.com/childrentime/reactuse"><img alt="Context7 indexed" src="https://img.shields.io/badge/Context7-Indexed-0078D4?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://deepwiki.com/childrentime/reactuse"><img alt="Ask DeepWiki" src="https://deepwiki.com/badge.svg"></a>
  <a href="https://gitmcp.io/childrentime/reactuse"><img alt="GitMCP" src="https://img.shields.io/badge/GitMCP-Use%20with%20AI-22c55e?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://glama.ai/mcp/servers/childrentime/reactuse"><img alt="ReactUse MCP server on Glama" src="https://glama.ai/mcp/servers/childrentime/reactuse/badges/score.svg"></a>
</p>

## Introduction

**ReactUse** is a comprehensive collection of **100+ essential React Hooks** for building modern React applications. Inspired by [VueUse](https://vueuse.org/), it provides production-ready hooks for browser APIs, state management, sensors, animations, DOM elements, and more.

### Features

- 🎯 **100+ Hooks** — The most comprehensive React hooks collection
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

## Who's Using This

[![PDD](https://img.shields.io/badge/PDD-E_Commerce-orange?style=for-the-badge)](https://www.pinduoduo.com/)
[![Shopee](https://img.shields.io/badge/Shopee-E_Commerce-red?style=for-the-badge)](https://shopee.com/)
[![Ctrip](https://img.shields.io/badge/Ctrip-Travel-blue?style=for-the-badge)](https://www.ctrip.com/)

---

## Sponsors

**`@reactuses/core` is installed 1.6M+ times every month.** Sponsoring ReactUse puts your product in front of the React developers who ship with it — your logo right here in the README, and on [reactuse.com/sponsor](https://reactuse.com/sponsor/).

<p align="center">
  <a href="https://github.com/sponsors/childrentime"><img alt="Gold Sponsor — this spot is open" src="https://img.shields.io/badge/%F0%9F%A5%87%20Gold-your%20logo%20here-FFD700?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://github.com/sponsors/childrentime"><img alt="Silver Sponsor — this spot is open" src="https://img.shields.io/badge/%F0%9F%A5%88%20Silver-your%20logo%20here-C0C0C0?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://github.com/sponsors/childrentime"><img alt="Bronze Sponsor — this spot is open" src="https://img.shields.io/badge/%F0%9F%A5%89%20Bronze-your%20logo%20here-CD7F32?style=for-the-badge&labelColor=24292e"></a>
</p>

<p align="center">
  <a href="https://github.com/sponsors/childrentime"><img alt="Sponsor on GitHub" src="https://img.shields.io/badge/%E2%9D%A4%20Sponsor%20on%20GitHub-db61a2?style=for-the-badge&labelColor=24292e"></a>
  <a href="https://www.buymeacoffee.com/lianwenwu"><img alt="Buy me a coffee" src="https://img.shields.io/badge/%E2%98%95%20Buy%20me%20a%20coffee-FFDD00?style=for-the-badge&labelColor=24292e"></a>
</p>

<p align="center"><sub>All sponsor slots are currently open — <a href="https://github.com/sponsors/childrentime">claim one</a> and your logo goes live within 48 hours. Tiers, benefits and company invoicing: <a href="https://reactuse.com/sponsor/">reactuse.com/sponsor</a>.</sub></p>

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

📖 [Full Documentation](https://reactuse.com) | 📖 [LLM-friendly Documentation](https://reactuse.com/llm.txt) | 💬 [Discord](https://discord.gg/VEMFdByJ) | 🐛 [Issues](https://github.com/childrentime/reactuse/issues)

---

## Contribute

See the [**Contributing Guide**](https://github.com/childrentime/reactuse/blob/main/CONTRIBUTING.md)

## ChangeLog

See the [**ChangeLog**](https://github.com/childrentime/reactuse/blob/main/packages/core/changelog.md)

---

## Thanks

This project is heavily inspired by the following awesome projects.

- [streamich/react-use](https://github.com/streamich/react-use)
- [ahooks](https://github.com/alibaba/hooks)
- [vueuse](https://github.com/vueuse/vueuse)

---

## Support ReactUse

ReactUse is free and MIT-licensed, maintained in spare time. If it saved you a day of work, consider [becoming a sponsor](https://github.com/sponsors/childrentime) (from $5/month) or [buying me a coffee](https://www.buymeacoffee.com/lianwenwu) — it keeps the hooks maintained and the docs interactive. 🥰
