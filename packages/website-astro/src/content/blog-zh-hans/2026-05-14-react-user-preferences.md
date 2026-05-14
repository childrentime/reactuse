---
title: "React 与用户偏好:尊重用户已经在 OS 里设过的那些选项"
description: "用 ReactUse 中的 usePreferredDark、usePreferredColorScheme、useColorMode、usePreferredContrast、useReducedMotion、usePreferredLanguages 和 useTextDirection 构建可访问的、感知 OS 设置的 React UI——尊重深色模式、对比度、减弱动效、语言和文字方向。"
slug: react-user-preferences
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-14
tags: [react, hooks, accessibility, a11y, tutorial]
keywords: [react user preferences, react prefers-color-scheme, react prefers-reduced-motion, useReducedMotion, useColorMode, usePreferredDark, usePreferredContrast, react accessibility hooks, react dark mode hook, react a11y, react i18n direction]
image: /img/og.png
---

# React 与用户偏好:尊重用户已经在 OS 里设过的那些选项

每一个现代操作系统都会在某个时刻问用户:你想要什么样的 UI。深色还是浅色。高对比还是普通。动画开还是关。从左到右还是从右到左。首选语言。用户在系统设置里选一次,从那一刻起,这台机器上每一个好好做出来的原生 App 都会尊重这个选择。而你上线的 Web App 通常不会——它自己搞一个深色模式开关,自己用一个动画库,自己默认是英文,OS 偏好变成某个 issue 跟踪器里五行字的备注。

<!-- truncate -->

修起来不难,API 表面也很窄。浏览器通过 `window.matchMedia` 和 `navigator.language` 暴露这些 OS 偏好,任何一个现代 React 应用一个下午就能接好。问题不是能不能,而是接线代码住在跟所有 Web 特性一样的 `useEffect`/`useState`/SSR 不一致的沼泽里,所以永远被搁置。[ReactUse](https://reactuse.com) 为此提供了 7 个聚焦的 hook,它们一起覆盖了真正重要的 4 个用户偏好维度:主题、动效、对比度、语言区域。

这篇文章逐个走一遍——它返回什么、它藏了什么 bug、最终的组件长什么样。最后把它们组合进一个 `useAppearance()` hook,一次性读取这 4 个信号。

## 1. usePreferredDark——开启主题系统的那个布尔值

最简单的一个。`usePreferredDark()` 在用户 OS 设为深色模式时返回 `true`,否则 `false`。它是对 `window.matchMedia('(prefers-color-scheme: dark)').matches` 的轻量封装,帮你处理两件你本来要自己处理的事:SSR(没有 `window`)和实时更新(用户可以在你的标签页打开的同时切 OS 开关,你应该响应)。

### 手写版

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

这是对的,但初始 `useState(false)` 是猜的——对于 SSR 渲染的页面,深色模式用户第一次打开你网站时会产生 hydration 不一致。同样的修复在真实代码库里要写 5 次,而且默认值经常不一致。

### ReactUse 版

```tsx
import { usePreferredDark } from "@reactuses/core";

function Component() {
  const isDark = usePreferredDark();
  return <Theme name={isDark ? "dark" : "light"} />;
}
```

[`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/) 是布尔进、布尔出——丢哪都行,零配置。首次渲染返回 SSR 安全的默认值;客户端挂载后,真实的 `matchMedia` 值流进来,并随着用户切换保持同步。

## 2. usePreferredColorScheme——当"深色"不够用时

`prefers-color-scheme` 有 3 个值,不是 2 个:`'light'`、`'dark'`、`'no-preference'`。大多数应用把第三个塌缩到前两个里的一个——这没问题,直到你上线"跟随系统"模式,然后发现有用户显式设了"无偏好",而你的应用现在选错了默认值。[`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) 返回完整的字符串。

```tsx
import { usePreferredColorScheme } from "@reactuses/core";

function ThemeBadge() {
  const scheme = usePreferredColorScheme();
  // scheme: "light" | "dark" | "no-preference"
  return <span>System theme: {scheme}</span>;
}
```

三值形式最有用的地方是带"系统"选项的主题选择器:

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
      <legend>主题</legend>
      {(["light", "dark", "system"] as const).map((c) => (
        <label key={c}>
          <input
            type="radio"
            checked={choice === c}
            onChange={() => onChange(c)}
          />
          {c}
          {c === "system" && ` (当前 ${effective})`}
        </label>
      ))}
    </fieldset>
  );
}
```

可见标签告诉用户"系统"现在实际意味着什么——一个很小的细节,能挡住最常见的深色模式困惑("系统选项坏了;它给了我浅色")。

## 3. useColorMode——带持久化的主题状态

`usePreferredDark` 报告 OS 偏好。`useColorMode` 更进一步:它持有应用**实际应用的**主题。它把 OS 偏好作为默认值,允许用户覆盖,把覆盖持久化到 `localStorage`,并把选中的模式写到 `<html>` 的 class 或属性上,这样你的 CSS 就能切换。

[`useColorMode`](https://reactuse.com/browser/useColorMode/) 才是你要的真实主题切换器:

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

一个 hook 你就拿到:

- 初始值:如果用户之前设过,从 `localStorage` 读;否则从 `prefers-color-scheme` 读
- `'auto'` 模式下实时跟踪 OS 变化
- `<html>` 上 class 切换(`html.dark` vs `html.light`),CSS 里不用任何 JS 条件
- SSR 安全:服务端和首次客户端绘制渲染同样的模式

自己实现主题系统的常见坑:首次绘制会闪一下错误模式,因为 OS 偏好是在 hydration 之后读到的。`useColorMode` 在渲染时同步写入解析后的模式,并在 React 接管树之前从 `localStorage` 读取持久化选择,从而避开这个问题。配合 `<head>` 里一段微小的内联 `<script>` 在更早的时刻就把 class 设好,闪现就彻底没了。

## 4. useReducedMotion——Web 上最便宜的可访问性胜利

`prefers-reduced-motion` 是 OS 级信号,表示用户希望屏幕上动得少一点。被视差弄晕的人、对大幅过渡有身体疼痛的前庭功能障碍用户、屏幕阅读器用户(那本身就够"动")——他们都会打开这个。尊重它对你没成本,赢得巨大善意。无视它是上线一个排斥用户的 App 最快的方式之一。

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

减弱动效开启时,组件跳过 y 轴位移并用 0ms 过渡——内容仍然出现,只是没了动画。这是正确的模式:不要移除视觉变化,移除**运动**本身。一个不带动画的 toast 仍然有用;一个根本不出现的 toast 是 bug。

[`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) 返回布尔且响应 OS 设置,用户中途切换偏好时动画会立刻停下。

常见接入位置:
- 页面过渡
- Modal/抽屉的进入退出
- 数字递增动画
- 视差/滚动驱动效果
- 自动播放轮播(减弱动效时也要停掉 autoplay)

## 5. usePreferredContrast——被请求时增强边界

`prefers-contrast` 是较新的媒体特性,报告用户是否要求 OS 给更高或更低的对比度。值有 `'more'`、`'less'`、`'no-preference'` 或 `'custom'`。和减弱动效一样,这是一个小群体但收益巨大——高对比模式对低视力用户至关重要。

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

高对比变体通常做 3 件事:更粗的边框、更强的颜色值(没有粉彩/灰蒙背景)、更清晰的焦点环。你不需要并行另一套主题——几个针对性覆盖就够:

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

[`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) 返回原始字符串,所以如果你对低对比用户有事可做,可以独立分支 `'more'` 和 `'less'`(大多数应用只匹配 `'more'`,忽略其余)。

## 6. usePreferredLanguages——超越 `navigator.language`

浏览器暴露 `navigator.languages`——用户首选区域的有序数组,例如 `["en-US", "zh-CN", "ja-JP"]`。大多数应用只读 `navigator.language`(第一项),丢掉了信号:一个设了 `["zh-CN", "en-US"]` 的用户想要中文优先、英文兜底,而不是你猜的随便什么。

[`usePreferredLanguages`](https://reactuse.com/browser/usePreferredLanguages/) 返回完整数组,并在用户改浏览器语言偏好时保持同步:

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

协商逻辑做的事就是服务端 `Accept-Language` 内容协商干了几十年的事:挑出应用支持的优先级最高的语言,优雅 fallback,最后兜底英文。相对 `navigator.language` 的胜利是实打实的:一个首选 `"de-CH"`、次选 `"en"` 的用户如果你不支持德语,就会落到英文版,而不是看到一个翻译了一半的 UI。

## 7. useTextDirection——RTL 不只是 CSS

从右到左的语言(阿拉伯语、希伯来语、波斯语)把整个页面的阅读方向翻转。CSS 通过逻辑属性(`margin-inline-start` 而不是 `margin-left`)处理大部分,但真正的 RTL 实现还需要 JS 驱动的行为翻转:键盘方向键、轮播的滚动吸附、动画方向、拖拽消除方向。

[`useTextDirection`](https://reactuse.com/browser/useTextDirection/) 读取(也可写入)目标元素的 `dir` 属性:

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

默认 hook 读 `<html dir="...">`,但它可以指向任意元素——对那些需要独立于外围页面感知 RTL 的嵌入式 widget 很有用。

## 拼起来:useAppearance

大多数应用想在根节点一次性读这 4 个信号——颜色、动效、对比度、方向——然后通过 context 往下传。单一派生 hook 比每个组件里调 4 次更干净:

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

在根节点用一次:

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

`<html>` 元素现在反映用户设过的每一个偏好:`class` 给主题/对比度/动效变体,`dir` 给方向,`lang` 给区域。任何想根据偏好分支的 CSS 规则用一个属性选择器就行,任何需要原始信号的组件可以从 `AppearanceContext` 拿,不必再次订阅 `matchMedia`。

## 能用 CSS 就用 CSS,JS 留给真需要时

合理的疑问:这些东西一半是不是根本不需要 JS?`prefers-color-scheme`、`prefers-reduced-motion`、`prefers-contrast` 都是 CSS 媒体特性,可以在样式表里处理:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

纯视觉变化,CSS 赢。这些 JS hook 真正赚到饭的场景:

- 偏好驱动**行为**而不仅是外观(轮播自动播放、传给动画库的时长数值)
- 偏好决定**挂载哪个组件**(`<Parallax />` vs `<StaticImage />`)
- 偏好影响一个住在 React state 里的派生值(区域协商、主题持久化)
- 你想要一个用户开关来**覆盖** OS 偏好(`useColorMode` 的 `'auto'` vs `'light'` vs `'dark'`)

经验法则:静态的交给 CSS,JS 真需要知道时再拿这些 hook。

## 总结

| Hook | 信号 | 什么时候用…… |
| --- | --- | --- |
| [`usePreferredDark`](https://reactuse.com/browser/usePreferredDark/) | OS 深色模式偏好 | 选主题要一个布尔值 |
| [`usePreferredColorScheme`](https://reactuse.com/browser/usePreferredColorScheme/) | 完整 `light`/`dark`/`no-preference` | "跟随系统"模式 UX 需要第三个值 |
| [`useColorMode`](https://reactuse.com/browser/useColorMode/) | 带持久化的实际应用主题 | 你在搭主题系统本身 |
| [`useReducedMotion`](https://reactuse.com/browser/useReducedMotion/) | `prefers-reduced-motion` | 你把时长传给动画库,或要拦下动效繁重的组件 |
| [`usePreferredContrast`](https://reactuse.com/browser/usePreferredContrast/) | `prefers-contrast` | 你要出一个高对比变体 |
| [`usePreferredLanguages`](https://reactuse.com/browser/usePreferredLanguages/) | 完整 `navigator.languages` | 你要做区域协商,不只是检测首选语言 |
| [`useTextDirection`](https://reactuse.com/browser/useTextDirection/) | `dir` 属性 | 你支持 RTL 语言并需要 JS 驱动翻转 |

尊重用户已经在 OS 里设过的偏好,是你能上线的最便宜的可访问性升级。门槛低——返回布尔、切 className、传时长——收益高。更多 hook 在 [reactuse.com](https://reactuse.com),如果你明天打开 `prefers-reduced-motion`,你的 App 不再把卡片到处甩,那今天键盘没白敲。
