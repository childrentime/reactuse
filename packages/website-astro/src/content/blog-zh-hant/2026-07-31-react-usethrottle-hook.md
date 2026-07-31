---
title: "React useThrottle Hook：節流值與回呼（2026）"
description: "一篇實用的 useThrottle 與 useThrottleFn 上手指南：把高頻變化的值或熱事件回呼壓到穩定節奏，調節 leading/trailing 邊緣，隨時 cancel 或 flush 掛起的呼叫——lodash 等級的計時精度、沒有閉包過期問題、卸載自動清理。SSR 安全，TypeScript 優先。"
slug: react-usethrottle-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-31
tags: [react, hooks, performance, typescript, tutorial]
keywords: [react useThrottle, usethrottle, useThrottle hook, react 節流 hook, react 捲動節流, useThrottleFn, react 節流狀態, react 節流回呼, lodash throttle react, react 節流 防抖 區別, react mousemove 節流, react throttle typescript, ssr 安全節流]
image: /img/og.png
---

# React useThrottle Hook：節流值與回呼（2026）

`scroll` 事件的觸發頻率全看合成器心情——通常一秒 60 次，有時 120 次。`mousemove` 更誇張。把它們直接灌進 `setState`，滾輪每動一下你的元件樹就以幀率重新渲染一遍；灌進事件追蹤或網路請求，你就親手對自己的後端發起了一次小型 DDoS。防抖（debounce）在這裡是錯誤的藥方：防抖後的捲動處理器要等捲動*停下來*才執行，於是閱讀進度條在捲動途中直接凍住，到頭了才猛地跳一下。你真正想要的是一個穩定節奏——*事件持續到來時，每 N 毫秒至多執行一次*。這就是節流（throttle）。

[`@reactuses/core`](https://reactuse.com) 的 [`useThrottle`](https://reactuse.com/state/usethrottle/) 和 [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 就是這個節奏的 hook 形態——一個管值，一個管回呼——底層是久經沙場的 lodash `throttle`，外面包了一層，把 React 裡兩種經典翻車方式（閉包過期、計時器比元件活得久）直接封死。這篇文章會走讀真實實作、`leading`/`trailing` 兩個旋鈕、`cancel`/`flush` 兩個逃生艙，以及一個被測試套件釘死的掛載時機細節。TypeScript 優先。

<!-- truncate -->

## useThrottle —— 節流一個值

`useThrottle` 接收一個變化太快的值，回傳一份以文明速度更新的副本：

```tsx
import { useState } from 'react';
import { useThrottle } from '@reactuses/core';

function MarkdownEditor() {
  const [source, setSource] = useState('');
  const throttledSource = useThrottle(source, 500);

  return (
    <div className="editor">
      <textarea value={source} onChange={e => setSource(e.target.value)} />
      {/* 即使全速打字，每秒也至多重新解析兩次 */}
      <Preview markdown={throttledSource} />
    </div>
  );
}
```

輸入框保持完全跟手——`source` 每次擊鍵都更新。被節流的只有昂貴的消費方：`throttledSource` 在第一次變化時立即更新，之後只要變化持續到來就每 500 ms 至多更新一次，停止後落在最終值上。對比這個編輯器的防抖版本：打字期間預覽會一臉茫然地空著，只在停頓的間隙追上來。節流讓它保持*活著*，只是刷新率低一點。

簽名如下：

```ts
function useThrottle<T>(value: T, wait?: number, options?: ThrottleSettings): T;
```

`ThrottleSettings` 就是 lodash 的——`{ leading?: boolean; trailing?: boolean }`——下文細說。

## useThrottleFn —— 節流一個回呼

當需要減速的是一個*函數*而不是值時，[`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/) 把它包起來並交還一組控制器：

```tsx
import { useState } from 'react';
import { useThrottleFn, useEventListener } from '@reactuses/core';

function ScrollSpy({ sectionIds }: { sectionIds: string[] }) {
  const [active, setActive] = useState(sectionIds[0]);

  const { run } = useThrottleFn(() => {
    setActive(computeActiveSection(sectionIds, window.scrollY));
  }, 200);

  useEventListener('scroll', run);

  return <TableOfContents ids={sectionIds} active={active} />;
}
```

捲動事件以幀率觸發；`computeActiveSection` 一秒只跑五次。回傳值是包含三個函數的物件：

```ts
const { run, cancel, flush } = useThrottleFn(fn, wait, options);
```

- **`run(...args)`** —— 節流後的函數。參數與 `fn` 相同，回傳 `fn` 的結果（呼叫被抑制時回傳最近一次的結果——標準 lodash 語義）。
- **`cancel()`** —— 丟棄掛起的 trailing 呼叫。一個清空介面的「重設」按鈕，不應該在 200 ms 後被上一次捲動事件的幽靈更新反殺；互動被放棄時就呼叫 `cancel()`。
- **`flush()`** —— 反過來：不等視窗關閉，掛起的呼叫*現在*就執行。經典用法：節流的自動儲存 + 「送出」時 `flush()`，讓最終狀態在跳轉前落地，而不是 2 秒之後。

這些不是擺設——庫的測試套件用假計時器驅動了一整條 `run`/`cancel`/`flush` 時間線，釘死了每一個中間計數：leading 呼叫同步觸發、被抑制的呼叫塌縮成一次攜帶*最新*參數的 trailing 呼叫、`cancel()` 真的會丟棄掛起呼叫、`flush()` 真的會提前執行它。

## 原始碼解析：lodash 加兩處修補

[實作](https://reactuse.com/effect/usethrottlefn/)短到一杯咖啡就能讀完：

```ts
export function useThrottleFn<T extends (...args: any) => any>(
  fn: T, wait?: number, options?: ThrottleSettings,
) {
  const fnRef = useLatest(fn);

  const throttled = useMemo(
    () =>
      throttle(
        (...args: [...Parameters<T>]): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [wait, JSON.stringify(options)],
  );

  useUnmount(() => {
    throttled.cancel();
  });

  return { run: throttled, cancel: throttled.cancel, flush: throttled.flush };
}
```

節流引擎是 `lodash-es` 的 `throttle`——有十年生產里程的計時邏輯，不是手搓的 `setTimeout` 雜技。這個 hook 補上的，恰好是你自己在元件裡呼叫 `lodash.throttle` 時必然踩的兩個坑：

1. **沒有閉包過期。** 樸素寫法 `useMemo(() => throttle(fn, wait), [])` 會把*首次渲染*的 `fn`——連同首次渲染的 props 和 state——凍結整個元件生命週期。這裡 memo 住的 throttle 呼叫的是 `fnRef.current`，一個由 [`useLatest`](https://reactuse.com/state/uselatest/) 維護、每次渲染都指向最新 `fn` 的 ref。計時狀態住在一個穩定的 throttle 實例裡；它呼叫的程式碼永遠是最新的。
2. **沒有比元件命長的計時器。** [`useUnmount`](https://reactuse.com/effect/useunmount/) 會呼叫 `throttled.cancel()`，掛起的 trailing 呼叫不可能打進一個已卸載的元件。測試套件斷言卸載後計時器數量就是零。

依賴陣列裡有個小彩蛋：`JSON.stringify(options)`。你可以行內傳 `{ trailing: false }`——每次渲染都是新物件——而不會重建 throttle 實例，因為 memo 按*內容*而非參考比較 options。而 `useThrottle` 本身就是這個 hook 對準 state 的產物——`useThrottleFn(() => setThrottled(value), wait, options)` 加一個在 `value` 變化時呼叫 `run()` 的 effect。一個計時引擎，兩種形態。

## 調參：leading 與 trailing

兩個邊緣都預設 `true`，這也是你通常想要的行為——首次回應即時、最終值不丟：

```tsx
useThrottle(value, 500);                      // 立即觸發，之後每 ≤500ms 一次，最後落在終值
useThrottle(value, 500, { leading: false });  // 跳過即時的首次更新
useThrottle(value, 500, { trailing: false }); // 跳過落到終值的收尾更新
```

- **`leading: false`** 把首次呼叫推遲到視窗結束。適合突發事件流裡第一個事件本身沒有意義的場景——比如回報「使用者正在捲動」的事件追蹤，你不希望單獨一格滾輪就觸發。
- **`trailing: false`** 表示視窗中途的呼叫直接丟棄而非延後。對連續資料流沒問題，反正下個視窗會帶來新讀數；但凡*最後一個*值重要就不行（你的進度條會停在差一點到 100% 的地方）。
- 兩個都 `false` 是 lodash 的陷阱——函數只能在沒有視窗打開時被呼叫才會執行，對穩定事件流來說約等於*永遠不會*。別這麼幹。

## 掛載陷阱——第一次變化可能要等

這是 `useThrottle`（值版本）值得知道的細節。它內部在掛載時的 effect 裡呼叫了 `run()`——那次 leading 呼叫只是把初始值重新 set 了一遍，肉眼不可見。但它同時*打開了節流視窗*。後果是：**掛載後 `wait` 毫秒內**到來的值變化不會立即更新，leading 也救不了——它處在視窗中間，只能等 trailing 邊緣。測試套件寫得明明白白：

```ts
const { result, rerender } = renderHook(props => useThrottle(props, 100), {
  initialProps: 0,
});
rerender(1);                     // 掛載後立刻變化
jest.advanceTimersByTime(50);
expect(result.current).toBe(0);  // 還是舊值——推遲到 t=100
```

第一個視窗過期之後，落在空檔裡的變化會拿到自己的 leading 邊緣、立即顯示。所以穩態下 `useThrottle` 的手感是先即時後節流，與宣傳完全一致——但如果元件掛載和值變化幾乎同時發生（hydration 交接、掛載即回傳的請求結果），第一次變化最多會遲到 `wait` 毫秒。在意的話，要麼調小 `wait`，要麼改用 `useThrottleFn` 去節流*源頭*而不是值。

## 節流還是防抖？

三十秒速覽，畢竟它們是同一根譜系的兩端：

- **防抖** = 「等待安靜」。事件*停止* `wait` 毫秒之前什麼都不發生。適合邊打邊搜、自動儲存、resize 結束後的版面計算——只有最終狀態重要的場景。對應 [`useDebounce`](https://reactuse.com/state/usedebounce/) / [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/)。
- **節流** = 「穩定心跳」。在活動*進行中*以限定頻率執行。適合捲動位置、滑鼠追蹤、拖曳回饋、進度回報——使用者需要在過程中看到回饋的場景。

判別口訣：如果功能的防抖版本在互動過程中給人*凍住*的感覺，你要的是節流。兩個 hook 並排的完整決策指南見[《React 中的 Debounce vs Throttle》](https://reactuse.com/blog/react-debounce-vs-throttle/)。

## 限頻家族

- [`useDebounce`](https://reactuse.com/state/usedebounce/) / [`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) —— 同樣的值/回呼二人組，「等待安靜」的計時策略，同一個 lodash 核心、同樣的閉包與卸載修補。
- [`useRafFn`](https://reactuse.com/effect/useraffn/) —— 按*顯示器*的節奏而非毫秒預算節流：每個動畫幀執行一次回呼。給渲染供資料的工作（元素高亮、canvas 繪製），一幀一次勝過任何手挑的 `wait`。
- [`useRafState`](https://reactuse.com/state/userafstate/) —— setter 在下一幀才提交的 `useState`；一幀內多次高頻 set 塌縮成一次渲染。治 `mousemove` 驅動狀態的最輕量方案。
- [`useScroll`](https://reactuse.com/browser/usescroll/) 與 [`useMouse`](https://reactuse.com/browser/usemouse/) —— 位置追蹤 hooks，通常出現在節流的*輸入*端。

## SSR 安全

`useThrottleFn` 在渲染期建立 lodash throttle，但建立不啟動任何計時器——計時器在 `run()` 被呼叫時才啟動，而所有呼叫點都在 effect 或事件處理器裡，伺服器端渲染期間永遠不會執行。伺服器端不碰 `window`、不碰 `document`、不碰時鐘：你的 Next.js / Remix 建置渲染初始值、乾淨地完成 hydration，節流在客戶端接管後甦醒。與 [`@reactuses/core`](https://reactuse.com) 的所有 hook 一樣，SSR 安全是構造使然。

## 重點回顧

- **節流是節奏，防抖是等待。** 使用者在互動*過程中*盯著看的東西——捲動、拖曳、滑鼠、即時預覽——用 [`useThrottle`](https://reactuse.com/state/usethrottle/) / [`useThrottleFn`](https://reactuse.com/effect/usethrottlefn/)，別用防抖。
- **值和回呼是同一引擎的兩種形態**：`useThrottle` 字面上就是對準 `setState` 的 `useThrottleFn`。
- **這層封裝賺回了兩次門票**：[`useLatest`](https://reactuse.com/state/uselatest/) 殺死閉包過期，[`useUnmount`](https://reactuse.com/effect/useunmount/) 取消掛起計時器——每個手搓 lodash.throttle-in-React 遲早都會上線的兩個 bug。
- **`cancel()` 和 `flush()` 是逃生艙**——互動被放棄時丟棄掛起呼叫，使用者送出時強制執行。
- **留意掛載視窗**：掛載後 `wait` 毫秒內的值變化要等 trailing 邊緣——測試套件驗證過，不是感覺。
- **SSR 安全，零設定**——客戶端接管之前，沒有計時器、沒有瀏覽器全域物件。

裝上 [`@reactuses/core`](https://reactuse.com)，把 `useThrottle` 對準你最吵的那個值，讓渲染迴圈擁有脈搏，而不是抽搐。
