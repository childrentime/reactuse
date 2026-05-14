---
title: "React 與使用者偏好:尊重使用者已經在 OS 裡設過的那些選項"
description: "用 ReactUse 中的 usePreferredDark、usePreferredColorScheme、useColorMode、usePreferredContrast、useReducedMotion、usePreferredLanguages 和 useTextDirection 建構可存取的、感知 OS 設定的 React UI——尊重深色模式、對比度、減弱動效、語言和文字方向。"
slug: react-user-preferences
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-14
tags: [react, hooks, accessibility, a11y, tutorial]
keywords: [react user preferences, react prefers-color-scheme, react prefers-reduced-motion, useReducedMotion, useColorMode, usePreferredDark, usePreferredContrast, react accessibility hooks, react dark mode hook, react a11y, react i18n direction]
image: /img/og.png
---

# React 與使用者偏好:尊重使用者已經在 OS 裡設過的那些選項

每一個現代作業系統都會在某個時刻問使用者:你想要什麼樣的 UI。深色還是淺色。高對比還是普通。動畫開還是關。從左到右還是從右到左。首選語言。使用者在系統設定裡選一次,從那一刻起,這台機器上每一個好好做出來的原生 App 都會尊重這個選擇。而你上線的 Web App 通常不會——它自己搞一個深色模式開關,自己用一個動畫函式庫,自己預設是英文,OS 偏好變成某個 issue 追蹤器裡五行字的備註。

<!-- truncate -->

修起來不難,API 表面也很窄。瀏覽器透過 `window.matchMedia` 和 `navigator.language` 暴露這些 OS 偏好,任何一個現代 React 應用一個下午就能接好。問題不是能不能,而是接線程式碼住在跟所有 Web 特性一樣的 `useEffect`/`useState`/SSR 不一致的沼澤裡,所以永遠被擱置。[ReactUse](https://reactuse.com) 為此提供了 7 個聚焦的 hook,它們一起涵蓋了真正重要的 4 個使用者偏好維度:主題、動效、對比度、語言區域。

這篇文章逐個走一遍——它回傳什麼、它藏了什麼 bug、最終的元件長什麼樣。最後把它們組合進一個 `useAppearance()` hook,一次性讀取這 4 個訊號。

## 1. usePreferredDark——開啟主題系統的那個布林值

最簡單的一個。`usePreferredDark()` 在使用者 OS 設為深色模式時回傳 `true`,否則 `false`。它是對 `window.matchMedia('(prefers-color-scheme: dark)').matches` 的輕量封裝,幫你處理兩件你本來要自己處理的事:SSR(沒有 `window`)和即時更新(使用者可以在你的分頁打開的同時切 OS 開關,你應該回應)。

### 手寫版

```tsx
import { useEffect, useState } from "react";

function ManualDark() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return dark ? "dark" : "light";
}
```

這是對的,但初始 `useState(false)` 是猜的——對於 SSR 渲染的頁面,深色模式使用者第一次打開你網站時會產生 hydration 不一致。同樣的修復在真實程式碼庫裡要寫 5 次,而且預設值經常不一致。

### ReactUse 版

```tsx
import { usePreferredDark } from "@reactuses/core";

function Component() {
  const isDark = usePreferredDark();
  return <Theme name={isDark ? "dark" : "light"} />;
}
```

[`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/) 是布林進、布林出——丟哪都行,零設定。首次渲染回傳 SSR 安全的預設值;客戶端掛載後,真實的 `matchMedia` 值流進來,並隨著使用者切換保持同步。

## 2. usePreferredColorScheme——當「深色」不夠用時

`prefers-color-scheme` 有 3 個值,不是 2 個:`'light'`、`'dark'`、`'no-preference'`。大多數應用把第三個塌縮到前兩個裡的一個——這沒問題,直到你上線「跟隨系統」模式,然後發現有使用者顯式設了「無偏好」,而你的應用現在選錯了預設值。[`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) 回傳完整的字串。

```tsx
import { usePreferredColorScheme } from "@reactuses/core";

function ThemeBadge() {
  const scheme = usePreferredColorScheme();
  // scheme: "light" | "dark" | "no-preference"
  return <span>System theme: {scheme}</span>;
}
```

三值形式最有用的地方是帶「系統」選項的主題選擇器:

```tsx
type Choice = "light" | "dark" | "system";

function ThemePicker({ choice, onChange }: { choice: Choice; onChange: (c: Choice) => void }) {
  const scheme = usePreferredColorScheme();
  const effective =
    choice === "system"
      ? scheme === "dark"
        ? "dark"
        : "light"
      : choice;

  return (
    <fieldset>
      <legend>主題</legend>
      {(["light", "dark", "system"] as const).map((c) => (
        <label key={c}>
          <input
            type="radio"
            checked={choice === c}
            onChange={() => onChange(c)}
          />
          {c}
          {c === "system" && ` (目前 ${effective})`}
        </label>
      ))}
    </fieldset>
  );
}
```

可見標籤告訴使用者「系統」現在實際意味著什麼——一個很小的細節,能擋住最常見的深色模式困惑(「系統選項壞了;它給了我淺色」)。

## 3. useColorMode——帶持久化的主題狀態

`usePreferredDark` 回報 OS 偏好。`useColorMode` 更進一步:它持有應用**實際套用的**主題。它把 OS 偏好作為預設值,允許使用者覆寫,把覆寫持久化到 `localStorage`,並把選中的模式寫到 `<html>` 的 class 或屬性上,這樣你的 CSS 就能切換。

[`useColorMode`](https://reactuse.com/browser/useColorMode/) 才是你要的真實主題切換器:

```tsx
import { useColorMode } from "@reactuses/core";

function ThemeToggle() {
  const [mode, setMode] = useColorMode();
  // mode: "light" | "dark" | "auto"

  return (
    <button onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
      切到 {mode === "dark" ? "light" : "dark"}
    </button>
  );
}
```

一個 hook 你就拿到:

- 初始值:如果使用者之前設過,從 `localStorage` 讀;否則從 `prefers-color-scheme` 讀
- `'auto'` 模式下即時追蹤 OS 變化
- `<html>` 上 class 切換(`html.dark` vs `html.light`),CSS 裡不用任何 JS 條件
- SSR 安全:伺服器和首次客戶端繪製渲染同樣的模式

自己實作主題系統的常見坑:首次繪製會閃一下錯誤模式,因為 OS 偏好是在 hydration 之後讀到的。`useColorMode` 在渲染時同步寫入解析後的模式,並在 React 接管樹之前從 `localStorage` 讀取持久化選擇,從而避開這個問題。配合 `<head>` 裡一段微小的內聯 `<script>` 在更早的時刻就把 class 設好,閃現就徹底沒了。

## 4. useReducedMotion——Web 上最便宜的可存取性勝利

`prefers-reduced-motion` 是 OS 級訊號,表示使用者希望螢幕上動得少一點。被視差弄暈的人、對大幅過渡有身體疼痛的前庭功能障礙使用者、螢幕閱讀器使用者(那本身就夠「動」)——他們都會打開這個。尊重它對你沒成本,贏得巨大善意。無視它是上線一個排斥使用者的 App 最快的方式之一。

```tsx
import { useReducedMotion } from "@reactuses/core";
import { motion } from "framer-motion";

function FadeIn({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4 }}
    >
      {children}
    </motion.div>
  );
}
```

減弱動效開啟時,元件跳過 y 軸位移並用 0ms 過渡——內容仍然出現,只是沒了動畫。這是正確的模式:不要移除視覺變化,移除**運動**本身。一個不帶動畫的 toast 仍然有用;一個根本不出現的 toast 是 bug。

[`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) 回傳布林且回應 OS 設定,使用者中途切換偏好時動畫會立刻停下。

常見接入位置:
- 頁面過渡
- Modal/抽屜的進入退出
- 數字遞增動畫
- 視差/捲動驅動效果
- 自動播放輪播(減弱動效時也要停掉 autoplay)

## 5. usePreferredContrast——被請求時增強邊界

`prefers-contrast` 是較新的媒體特性,回報使用者是否要求 OS 給更高或更低的對比度。值有 `'more'`、`'less'`、`'no-preference'` 或 `'custom'`。和減弱動效一樣,這是一個小族群但收益巨大——高對比模式對低視力使用者至關重要。

```tsx
import { usePreferredContrast } from "@reactuses/core";

function Card({ children }: { children: React.ReactNode }) {
  const contrast = usePreferredContrast();
  const cls =
    contrast === "more"
      ? "card card--high-contrast"
      : "card";
  return <div className={cls}>{children}</div>;
}
```

高對比變體通常做 3 件事:更粗的邊框、更強的色彩值(沒有粉彩/灰矇背景)、更清晰的焦點環。你不需要並行另一套主題——幾個針對性覆寫就夠:

```css
.card--high-contrast {
  border: 2px solid currentColor;
  background: var(--surface);
  color: var(--text-strong);
}
.card--high-contrast :focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
```

[`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) 回傳原始字串,所以如果你對低對比使用者有事可做,可以獨立分支 `'more'` 和 `'less'`(大多數應用只匹配 `'more'`,忽略其餘)。

## 6. usePreferredLanguages——超越 `navigator.language`

瀏覽器暴露 `navigator.languages`——使用者首選區域的有序陣列,例如 `["en-US", "zh-CN", "ja-JP"]`。大多數應用只讀 `navigator.language`(第一項),丟掉了訊號:一個設了 `["zh-CN", "en-US"]` 的使用者想要中文優先、英文兜底,而不是你猜的隨便什麼。

[`usePreferredLanguages`](https://reactuse.com/browser/usePreferredLanguages/) 回傳完整陣列,並在使用者改瀏覽器語言偏好時保持同步:

```tsx
import { usePreferredLanguages } from "@reactuses/core";

const SUPPORTED = ["en", "zh-Hans", "zh-Hant", "ja", "es"] as const;

function pickLocale(preferred: readonly string[]): string {
  for (const lang of preferred) {
    const base = lang.toLowerCase();
    if (SUPPORTED.includes(base as (typeof SUPPORTED)[number])) return base;
    const region = base.split("-")[0];
    const match = SUPPORTED.find((s) => s.toLowerCase().startsWith(region));
    if (match) return match;
  }
  return "en";
}

function LocaleAuto() {
  const preferred = usePreferredLanguages();
  const locale = pickLocale(preferred);
  return <App locale={locale} />;
}
```

協商邏輯做的事就是伺服器端 `Accept-Language` 內容協商幹了幾十年的事:挑出應用支援的優先級最高的語言,優雅 fallback,最後兜底英文。相對 `navigator.language` 的勝利是實打實的:一個首選 `"de-CH"`、次選 `"en"` 的使用者如果你不支援德語,就會落到英文版,而不是看到一個翻譯了一半的 UI。

## 7. useTextDirection——RTL 不只是 CSS

從右到左的語言(阿拉伯語、希伯來語、波斯語)把整個頁面的閱讀方向翻轉。CSS 透過邏輯屬性(`margin-inline-start` 而不是 `margin-left`)處理大部分,但真正的 RTL 實作還需要 JS 驅動的行為翻轉:鍵盤方向鍵、輪播的捲動吸附、動畫方向、拖拽消除方向。

[`useTextDirection`](https://reactuse.com/browser/useTextDirection/) 讀取(也可寫入)目標元素的 `dir` 屬性:

```tsx
import { useEffect } from "react";
import { useTextDirection } from "@reactuses/core";

function App({ locale }: { locale: string }) {
  const [dir, setDir] = useTextDirection();

  useEffect(() => {
    setDir(isRtl(locale) ? "rtl" : "ltr");
  }, [locale, setDir]);

  return (
    <main>
      <Carousel direction={dir === "rtl" ? "leftward" : "rightward"} />
      <KeyboardHandler arrowsFlipped={dir === "rtl"} />
    </main>
  );
}

function isRtl(locale: string): boolean {
  return ["ar", "he", "fa", "ur"].some((p) => locale.startsWith(p));
}
```

預設 hook 讀 `<html dir="...">`,但它可以指向任意元素——對那些需要獨立於外圍頁面感知 RTL 的嵌入式 widget 很有用。

## 拼起來:useAppearance

大多數應用想在根節點一次性讀這 4 個訊號——顏色、動效、對比度、方向——然後透過 context 往下傳。單一衍生 hook 比每個元件裡呼叫 4 次更乾淨:

```tsx
import {
  usePreferredDark,
  usePreferredContrast,
  useReducedMotion,
  usePreferredLanguages,
  useTextDirection,
} from "@reactuses/core";

export type Appearance = {
  isDark: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  locale: string;
  dir: "ltr" | "rtl";
};

export function useAppearance(): Appearance {
  const isDark = usePreferredDark();
  const contrast = usePreferredContrast();
  const reducedMotion = useReducedMotion();
  const preferred = usePreferredLanguages();
  const [dir] = useTextDirection();

  const locale = pickLocale(preferred);

  return {
    isDark,
    highContrast: contrast === "more",
    reducedMotion,
    locale,
    dir: dir === "rtl" ? "rtl" : "ltr",
  };
}
```

在根節點用一次:

```tsx
function App() {
  const appearance = useAppearance();

  return (
    <AppearanceContext.Provider value={appearance}>
      <html
        className={`${appearance.isDark ? "dark" : "light"} ${
          appearance.highContrast ? "contrast-more" : ""
        } ${appearance.reducedMotion ? "motion-reduce" : ""}`}
        dir={appearance.dir}
        lang={appearance.locale}
      >
        <Routes />
      </html>
    </AppearanceContext.Provider>
  );
}
```

`<html>` 元素現在反映使用者設過的每一個偏好:`class` 給主題/對比度/動效變體,`dir` 給方向,`lang` 給區域。任何想根據偏好分支的 CSS 規則用一個屬性選擇器就行,任何需要原始訊號的元件可以從 `AppearanceContext` 拿,不必再次訂閱 `matchMedia`。

## 能用 CSS 就用 CSS,JS 留給真需要時

合理的疑問:這些東西一半是不是根本不需要 JS?`prefers-color-scheme`、`prefers-reduced-motion`、`prefers-contrast` 都是 CSS 媒體特性,可以在樣式表裡處理:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

純視覺變化,CSS 贏。這些 JS hook 真正賺到飯的場景:

- 偏好驅動**行為**而不僅是外觀(輪播自動播放、傳給動畫函式庫的時長數值)
- 偏好決定**掛載哪個元件**(`<Parallax />` vs `<StaticImage />`)
- 偏好影響一個住在 React state 裡的衍生值(區域協商、主題持久化)
- 你想要一個使用者開關來**覆寫** OS 偏好(`useColorMode` 的 `'auto'` vs `'light'` vs `'dark'`)

經驗法則:靜態的交給 CSS,JS 真需要知道時再拿這些 hook。

## 總結

| Hook | 訊號 | 什麼時候用…… |
| --- | --- | --- |
| [`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/) | OS 深色模式偏好 | 選主題要一個布林值 |
| [`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) | 完整 `light`/`dark`/`no-preference` | 「跟隨系統」模式 UX 需要第三個值 |
| [`useColorMode`](https://reactuse.com/browser/useColorMode/) | 帶持久化的實際套用主題 | 你在搭主題系統本身 |
| [`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) | `prefers-reduced-motion` | 你把時長傳給動畫函式庫,或要擋下動效繁重的元件 |
| [`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) | `prefers-contrast` | 你要出一個高對比變體 |
| [`usePreferredLanguages`](https://reactuse.com/browser/usePreferredLanguages/) | 完整 `navigator.languages` | 你要做區域協商,不只是偵測首選語言 |
| [`useTextDirection`](https://reactuse.com/browser/useTextDirection/) | `dir` 屬性 | 你支援 RTL 語言並需要 JS 驅動翻轉 |

尊重使用者已經在 OS 裡設過的偏好,是你能上線的最便宜的可存取性升級。門檻低——回傳布林、切 className、傳時長——收益高。更多 hook 在 [reactuse.com](https://reactuse.com),如果你明天打開 `prefers-reduced-motion`,你的 App 不再把卡片到處甩,那今天鍵盤沒白敲。
