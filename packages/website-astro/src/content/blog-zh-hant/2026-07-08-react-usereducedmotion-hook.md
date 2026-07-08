---
title: "React useReducedMotion Hook：尊重 prefers-reduced-motion（2026）"
description: "一篇實用的 useReducedMotion 上手指南：讀取作業系統層級的 prefers-reduced-motion 設定，為前庭功能障礙使用者停用或簡化動畫，並搞清楚 WCAG 真正要求你拿掉的是哪些動效。只是 useMediaQuery 上的一行封裝，SSR 安全，且能即時響應系統設定的變化。"
slug: react-usereducedmotion-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-08
tags: [react, hooks, accessibility, typescript, tutorial]
keywords: [react useReducedMotion, useReducedMotion hook, prefers-reduced-motion react, react 減少動態效果, 停用動畫 react, react 無障礙 hook, react 前庭功能障礙, react 暈動症, framer motion 減少動態效果, react useMediaQuery, ssr 安全 減少動態效果, react WCAG 動畫]
image: /img/og.png
---

# React useReducedMotion Hook：尊重 prefers-reduced-motion（2026）

一張鋪滿整個螢幕的視差首圖。一個自動捲動的輪播圖。一個又轉又彈又跳的載入動畫。對大多數使用者來說這只是「夠現代」。但對有前庭功能障礙、先兆偏頭痛或梅尼爾氏症的使用者來說，這可能會引發真實的噁心、暈眩，或是嚴重到直接關掉頁面的頭痛——這不是「不爽」，而是實實在在的生理症狀。這正是為什麼每個主流作業系統都內建「減弱動態效果」開關（iOS 從 2013 年起、macOS、Windows、Android、GNOME），也是為什麼 CSS 把它暴露給了 Web，也就是 [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) 媒體特性。

`useReducedMotion` 就是把這個設定讀進 React state 的 hook——響應式的，使用者一切換系統開關就立刻更新；也是安全的，不會在 SSR 期間碰 `window`。本文講清楚真實的 [`@reactuses/core`](https://reactuse.com) API、`prefers-reduced-motion` 到底要求你拿掉什麼動效（它比「完全不能動」要窄得多），以及你會真正用到的三種整合模式。

<!-- truncate -->

## 最樸素的寫法

最直覺的做法是在 effect 裡手寫 `window.matchMedia`：

```tsx
function Hero() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mql.matches);
    // 🐛 忘了這行，值就再也不會更新了
    const onChange = () => setReduce(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return <div className={reduce ? 'hero' : 'hero hero--parallax'} />;
}
```

實務上這會以三種方式出問題。第一，`window` 在伺服器端不存在，所以這整段一旦跑在 Next.js、Remix 或 Astro 上就需要守衛——而人們很容易圖方便，在渲染邏輯裡到處撒 `typeof window !== 'undefined'`，而不是把它收斂進一個 effect。第二，很多人只用 `mql.matches` 初始化一次 state，然後乾脆省略 `change` 監聽——這在大多數情況下沒問題，直到使用者在分頁開著的時候*真的*切換了這個設定（筆電從電池切到插電，在某些系統上就會觸發它，而這一點 QA 幾乎從不測）。第三，每個關心動效偏好的元件都在重寫同一套 `matchMedia` + 監聽器 + 清理的舞步。

## API

[`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) 只是一次呼叫：

```ts
const prefersReducedMotion = useReducedMotion(defaultState?: boolean): boolean;
```

- **`defaultState`** —— 可選，預設 `false`。這是 SSR 期間以及客戶端首次渲染時（媒體查詢還來不及求值之前）回傳的值。
- **回傳值** —— 一個從 `defaultState` 開始的布林值，會在使用者改變作業系統層級的動效偏好時即時更新。不用手寫監聽器，也沒有清理邏輯要忘記。

在底層，實作真的就這麼簡單——整個實作就是對 [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) 的一行呼叫：

```ts
export function useReducedMotion(defaultState?: boolean) {
  return useMediaQuery('(prefers-reduced-motion: reduce)', defaultState);
}
```

真正做事的是 `useMediaQuery`——它在 effect 內部建構 `MediaQueryList`（所以渲染期間和伺服器端都不會碰 `matchMedia`），並替你訂閱它的 `change` 事件。`useReducedMotion` 只是把查詢字串釘死了。這就是它的全部價值：你每次都能拿到正確、拼寫正確、接線正確的那個查詢。

## 模式一：關掉單一動畫

最小的用法——用這個旗標控制單一 CSS transition 或類別名稱：

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

`.hero--parallax` 帶著那個捲動聯動的 `transform: translateY(...)` 動畫；基礎的 `.hero` 類別沒有。當 `reduce` 為 `true` 時，根本沒有任何 JS 動畫邏輯在跑——你不只是跳過了*視覺上*的動效，也跳過了驅動它的那個捲動監聽器或 `requestAnimationFrame` 迴圈，這在低階裝置上同樣是實打實的效能收益。

## 模式二：接入 Framer Motion / GSAP

如果你在用動畫函式庫，hook 的值可以直接接進它的 duration/transition 設定，而不是切換類別名稱：

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

注意這裡並沒有拿掉淡入效果——`opacity` 不屬於 `prefers-reduced-motion` 想管的那類動效（見下一節）。它拿掉的是*位移*：`reduce` 為真時 `y` 永遠不動，過渡也是瞬時的，所以卡片只是「出現」而已。Framer Motion 自己也帶了一個 [`useReducedMotion`](https://www.framer.com/motion/use-reduced-motion/) hook，做的是同樣的 `matchMedia` 讀取——如果你已經在用 `@reactuses/core` 處理其他一切，用這個 hook 能讓你保持單一真相來源，而不是兩個函式庫各自獨立讀同一個媒體查詢。

## 模式三：一個全域開關，而不是 N 處判斷

一旦設計系統裡有幾十個帶動畫的元件，逐一用 `reduce ? ... : ...` 判斷的寫法會很難擴展。真正能擴展的模式是：在靠近應用程式根部的地方讀一次這個 hook，用它驅動一個 `data-` 屬性，讓全域樣式表來響應。

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

這和那個經典的、[直接建在媒體查詢上的 CSS 萬用選擇器規則](https://web.dev/prefers-reduced-motion/)是同一個形狀——差別是這裡的 `data-motion` 屬性由 React state 驅動，所以同一個旗標既能給你的 JS 動畫邏輯用（模式二），也能給這裡的 CSS 用，不用把媒體查詢讀兩遍，也不用擔心兩邊會不同步。

## 「減弱」不等於什麼

`prefers-reduced-motion: reduce` 不是「停用一切動效」。[WCAG 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) 和各平台廠商真正針對的是**大範圍、非必要的動效**：視差捲動、自動播放的背景影片、縮放/平移式的首圖動畫、自動輪播、裝飾性的彈跳/旋轉載入動畫。而那些承載資訊或確認互動的動效——核取方塊的打勾動畫、按鈕短暫的按壓狀態、指示「仍在載入」的載入指示器、拖放回饋——一般可以保留，理想情況下只是更短、更平靜一些。把*每一個*像素的移動都拿掉，包括一個 `:hover` 的顏色過渡，並不是這個設定想要的，反而可能讓介面顯得像是壞了，而不是變得無障礙。拿不準的時候可以這樣判斷：「這個動效是不是鋪滿了螢幕的大部分區域，或是在沒有使用者操作的情況下持續執行？」——這才是該拿掉的那類動效。

還有一點值得知道：如果你只需要在 CSS 裡用它，從來不需要在 JS 邏輯裡用，Tailwind 的 [`motion-reduce:`](https://tailwindcss.com/docs/animation#accounting-for-reduced-motion-preferences) 變體（或是一段普通的 `@media (prefers-reduced-motion: reduce)` 規則）就能零 JavaScript 搞定。真正需要用到這個 hook 的場景，是這個判斷需要深入到渲染或 effect 邏輯裡的時候——比如在自動播放的 `<video>` 和靜態海報圖之間做選擇，徹底跳過某個捲動驅動動畫函式庫的初始化，或是上面那個 data 屬性模式。

## SSR 安全

`useReducedMotion` 在伺服器端渲染時是安全的。`useMediaQuery` 只在 effect 內部呼叫 `window.matchMedia`——而 React 在 SSR 期間從不執行 effect——所以伺服器端和客戶端首次渲染都會使用 `defaultState`（除非你另外傳值，否則是 `false`）。沒有 `typeof window` 守衛要寫，也沒有 hydration mismatch：React 在兩次渲染中調和的是同一個值，真實的偏好會在掛載後立即在客戶端讀取並生效。（關於這個模式背後的一般原理，可以看 [SSR 安全的 React Hooks](https://reactuse.com/blog/ssr-safe-react-hooks/)。）

## 偏好查詢家族

`useReducedMotion` 屬於一小組讀取作業系統層級無障礙與顯示偏好的 hook——它們都是建在同一個原語之上的、以用途命名的薄封裝：

| Hook | 媒體查詢 | 回傳值 |
| --- | --- | --- |
| [`useReducedMotion`](https://reactuse.com/browser/usereducedmotion/) | `prefers-reduced-motion` | `boolean` |
| [`usePreferredColorScheme`](https://reactuse.com/browser/usepreferredcolorscheme/) | `prefers-color-scheme` | `"dark" \| "light" \| "no-preference"` |
| [`usePreferredContrast`](https://reactuse.com/browser/usepreferredcontrast/) | `prefers-contrast` | `"more" \| "less" \| "custom" \| "no-preference"` |
| [`usePreferredDark`](https://reactuse.com/browser/usepreferreddark/) | `prefers-color-scheme: dark` | `boolean` |
| [`useMediaQuery`](https://reactuse.com/browser/usemediaquery/) | 你傳入的任意查詢 | `boolean` |

優先用這些具名的 hook——它們存在的意義就是讓那串查詢字串只被正確拼寫一次，寫在一個地方——遇到更特殊的場景（比如自訂斷點）再直接降到 `useMediaQuery`。想看更完整的、讓 React 應用尊重使用者已經在系統層級設定好的偏好的 hook 集合，見 [React 與使用者偏好](https://reactuse.com/blog/react-user-preferences/)；想看更廣的無障礙工具箱，見 [用 Hooks 打造無障礙的 React 元件](https://reactuse.com/blog/react-accessibility-hooks/)。

## 要點回顧

- `prefers-reduced-motion` 不是個可有可無的加分項——對有前庭功能障礙或偏頭痛誘因的使用者來說，無視它可能讓頁面在生理層面變得無法使用。
- **`useReducedMotion(defaultState?)`** 響應式地讀取它：只是對 `useMediaQuery('(prefers-reduced-motion: reduce)', defaultState)` 的一行封裝，所以 SSR 安全和即時更新都是白拿的。
- 對零散場景，逐一控制單一過渡效果（模式一）；把它接進 Framer Motion/GSAP 的 transition 設定（模式二）；或是在應用程式根部驅動一個全域 `data-motion` 屬性，讓 CSS 和 JS 共用單一真相來源（模式三）。
- 這個設定針對的是大範圍或非必要的動效——視差、自動播放、裝飾性循環動畫——不是每一個 `:hover` 過渡。保留簡短而有功能性的動效，拿掉其餘的。
- 預設 SSR 安全：`defaultState` 涵蓋了伺服器端和首次渲染，不需要 `typeof window` 守衛。

從 [`@reactuses/core`](https://reactuse.com/browser/usereducedmotion/) 取用——它是唯一站在你的動畫和一個沒辦法安全看這些動畫的使用者之間的那個 hook。
