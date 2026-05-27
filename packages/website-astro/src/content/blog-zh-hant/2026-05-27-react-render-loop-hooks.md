---
title: "在 React 裡寫動畫又不跟渲染週期較勁：useRafFn、useRafState、useFps、useDevicePixelRatio、useUpdate"
description: "React 的協調器按自己的節奏跑，瀏覽器的合成器每秒固定六十幀，你的動畫必須落在後者上又不被前者絆住。本文走讀五個 ReactUse hook——useRafFn、useRafState、useFps、useDevicePixelRatio、useUpdate——它們都建立在 requestAnimationFrame 之上，讓 React state、canvas 繪製、高 DPI 渲染不再互相阻塞。"
slug: react-render-loop-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-27
tags: [react, hooks, animation, performance, tutorial]
keywords: [react requestAnimationFrame hook, react useRafFn, react 動畫 hook, react raf 狀態, react useRafState, react 幀率 hook, react useFps, react 裝置像素比 hook, react useDevicePixelRatio, react retina canvas, react 強制重渲染, react useUpdate, react 60fps 動畫, react canvas hook, react 效能 hook, react 動畫循環, react 渲染幀合併]
image: /img/og.png
---

# 在 React 裡寫動畫又不跟渲染週期較勁：useRafFn、useRafState、useFps、useDevicePixelRatio、useUpdate

React 用一套時鐘，瀏覽器用另一套。React 的協調器根據 state 更新、effect、調度器對「儘快」的理解來決定何時重新渲染元件。瀏覽器的合成器則按顯示器能撐住的速度刷屏——大多數顯示器是 60Hz，少數是 120Hz。兩套時鐘並不同步。state 更新會落在兩次繪製之間被合併；龐大的渲染樹可能整個錯過一幀；`setInterval(handler, 16)` 一分鐘下來會漂移幾百毫秒，因為它根本不在乎 GPU 在幹嘛。

<!-- truncate -->

標準解法是 `requestAnimationFrame`。它在**下一次繪製之前**呼叫你的回呼，附帶一個高精度時間戳，並且在分頁隱藏時自動節流。它就是所有要看起來「絲滑」的東西該用的原語。但它在 React 裡手工接線很繁瑣：你需要一個 ref 存幀 ID、一個 effect 啟動循環、一段清理函式在卸載時取消、一個 `useLatest` 讓回呼看到最新的 props，再加一個 ref 才能做暫停/恢復。每個動畫元件都重寫一遍這套腳手架，而大多數人第一次寫都會漏掉某個清理。

[ReactUse](https://reactuse.com) 把這套腳手架收進了五個共享同一底層循環的 hook。本文逐個走讀——`useRafFn` 提供循環本身，`useRafState` 做隨循環更新的 state，`useFps` 量化這個循環，`useDevicePixelRatio` 讓你在循環裡以正確解析度繪製，`useUpdate` 應付那些「需要推一下 React 但又沒 state 可改」的場景。合起來基本能覆蓋你在專門的動畫函式庫之外要做的所有事。

## 一個元件裡的 bug

一張跟隨滑鼠的浮卡：

```tsx
function FloatingCard() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      card
    </div>
  );
}
```

看上去沒毛病。打開 devtools 效能面板，滑鼠在螢幕上甩一遍。在一台快點的筆電上，`mousemove` 每秒觸發 120 到 500 次，看輸入裝置和 OS。每次都會呼叫 `setPos`，每次都觸發一次重渲染調度，React 把它們合併到下一個 microtask。你在做螢幕能展示的兩到八倍的協調工作，多出來的渲染全是純開銷——真正有意義的只是下一次繪製之前的最後一次。

[`useRafState`](https://reactuse.com/state/userafstate/) 把這件事壓縮成每幀一次，不管事件多快。原地替換，同樣的 `[state, setState]` API，每次滑鼠抖動少三次協調。本文剩下的 hook 都遵循同一個模式：保留 React 風格的 API，把 `requestAnimationFrame` 的管道藏起來。

## 1. useRafFn——帶暫停/恢復的循環

[`useRafFn`](https://reactuse.com/effect/useraffn/) 是其他一切的基石。它接收一個回呼，在每個 `requestAnimationFrame` tick 上呼叫，並把高精度時間戳傳進去。回傳 `[stop, start, isActive]`，讓你可以在分頁失焦、使用者互動或任何其他訊號上暫停循環：

```tsx
import { useRef } from 'react';
import { useRafFn } from '@reactuses/core';

function StarField({ count = 200 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.5 + 0.5,
    })),
  );

  const [stop, start, isActive] = useRafFn((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const t = time / 1000;
    for (const star of starsRef.current) {
      const x = ((star.x + t * 0.02 * star.z) % 1) * width;
      const y = star.y * height;
      ctx.fillStyle = `rgba(255, 255, 255, ${star.z})`;
      ctx.fillRect(x, y, 2, 2);
    }
  });

  return (
    <>
      <canvas ref={canvasRef} width={600} height={400} />
      <button onClick={() => (isActive() ? stop() : start())}>
        {isActive() ? '暫停' : '繼續'}
      </button>
    </>
  );
}
```

這個 hook 有四個設計選擇值得理解。回呼在**下一次繪製之前**執行——這是 `requestAnimationFrame` 的語義——所以回呼裡做的任何 DOM 讀取看到的都是即將繪製時的版面，不會額外觸發強制回流。回呼引用被 [`useLatest`](https://reactuse.com/state/uselatest/) 包了一層，所以你可以閉包到新鮮的 props（`count`、作用域裡任何東西）而不必重啟循環。循環掛載時自動啟動；第二個參數傳 `false` 則從第一幀起就停在手動控制狀態。清理註冊在 effect 上，所以卸載時會取消掛起的幀——不會有野回呼在死掉的元件上跑。

`isActive` 回傳的是函式而不是布林。在事件處理器裡呼叫它總能拿到當前值；在渲染裡呼叫只能看到渲染時的值。這種不對稱容易踩。如果你要把啟用標誌用在 JSX 的 `disabled={}` 這種 prop 上，配合 `useUpdate` 在 `stop`/`start` 呼叫方裡手動 `update()`——上面範例沒這麼做是因為按鈕文案下一次點擊時本來就會重算。

`useRafFn` 真實場景下還有不少 canvas 之外的用法：任何要在**兩次事件之間**追蹤時間的活兒都用得到。一個要按 delta time 積分速度的物理模擬。一個 scrub bar 想緊跟媒體元素的 `currentTime`，而不是等那個粗糙的 `timeupdate` 事件（它按編解碼器心情觸發，不按你心情）。一個用彈簧拖尾跟隨真實滑鼠的自訂指標——`useRafFn` 讀最新的目標位置，跑一步彈簧迭代，把結果寫到 CSS 變數。這些都在替代那些會漂移、又會在背景分頁裡燒電池的 `setInterval` 模式。

## 2. useRafState——按幀合併的 useState

[`useRafState`](https://reactuse.com/state/userafstate/) 是那張浮卡你真正會發佈的版本：

```tsx
import { useRafState } from '@reactuses/core';
import { useEventListener } from '@reactuses/core';

function FloatingCard() {
  const [pos, setPos] = useRafState({ x: 0, y: 0 });

  useEventListener('mousemove', (e) => {
    setPos({ x: e.clientX, y: e.clientY });
  });

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        transition: 'transform 0.1s',
      }}
    >
      card
    </div>
  );
}
```

API 完全是 `useState`——同樣的 setter 簽名，同樣支援 updater 函式——但寫入會被 `requestAnimationFrame` 排隊。同一幀內的五次 `setPos` 合併為一次 React 更新；React 更新每次繪製最多 flush 一次；DOM 更新的頻率正好與螢幕刷新同步。`mousemove` 監聽還是按 500Hz 觸發，開銷幾乎等同於呼叫一個空函式。協調成本掉到 60Hz，正好是螢幕能展示的。

幾點要知道。這個 hook 給每個 state 槽位維護一個掛起的 `requestAnimationFrame` ID，所以同一幀內連續的 setter 是**替換**，不是排隊——最後一個值贏。視覺 state 幾乎總是想要這個語義：你不在乎中間的滑鼠位置，只在乎繪製那一刻游標在哪。如果你真的在乎——比如你在取樣感測器資料每個值都要——那就用普通 `useState` 並接受重渲染成本，或者寫到 ref 裡然後用 `useRafFn` tick 來 flush。

清理細節和 `useRafFn` 一樣：掛起的幀在卸載時取消，所以快速點擊-拖曳-卸載的連擊不會冒出 `setState on unmounted component` 警告。內部實作是 `useState` + `useRef`（存幀 ID） + `useUnmount` 清理，總共大概二十行。你自己寫得出來；這個 hook 只是省下了你每次都寫一遍。

有個坑。因為 state 比事件慢一幀，呼叫 setter **立刻**讀 state 還是舊值：

```tsx
setPos({ x: 100, y: 100 });
console.log(pos); // 還是 { x: 0, y: 0 } —— 更新還沒跑
```

普通 `useState` 在同一次渲染週期內也是這樣，但**慢整整一幀**這件事在拼命令式程式碼時容易讓你意外。要回讀這個值，旁邊再放一個 ref 同步存。

## 3. useFps——量化你做出來的東西

`useRafFn` 和 `useRafState` 都在改善流暢度，但流暢度是一個可量化的指標，不是感覺。[`useFps`](https://reactuse.com/browser/usefps/) 回傳當前幀率（數字），透過統計底層 `requestAnimationFrame` 回呼觸發的頻率算出來：

```tsx
import { useFps } from '@reactuses/core';

function FpsOverlay() {
  const fps = useFps();
  const color = fps >= 55 ? 'green' : fps >= 30 ? 'orange' : 'red';

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        padding: '4px 8px',
        background: 'rgba(0,0,0,0.7)',
        color,
        fontFamily: 'monospace',
      }}
    >
      {fps} fps
    </div>
  );
}
```

丟進 dev build，你就有了平時要打開 Chrome rendering 面板才能看的 FPS 計數器。hook 接受一個 `every` 選項（預設 `10`），控制平均多少幀；小數字對卡頓回應快但抖動多，大數字讀數更平滑但對突然掉幀反應慢。角落的常駐 overlay 用 10 很合適；如果你在調一段具體的卡頓過場動畫，就用 1 或 2。

更有意思的用法是**自適應渲染**。讀 FPS，掉到閾值以下就減少要做的事：

```tsx
function ParticleSystem({ baseCount = 1000 }: { baseCount?: number }) {
  const fps = useFps({ every: 30 });
  const count =
    fps >= 55 ? baseCount : fps >= 40 ? baseCount / 2 : baseCount / 4;

  return <Particles count={count} />;
}
```

這正是 3A 遊戲引擎在幀預算吃緊時的做法——降粒子數、調陰影解析度、把流體模擬換成更粗的網格。對一個 React 應用來說，通常把動畫背景的粒子數減半，或者乾脆停掉一個非關鍵的 `useRafFn` 循環，就足夠了。閾值數字憑口味；60Hz 顯示器上 55 是一條合理的「我們基本還行」的線，因為平均值光被 GC 拽一下就能掉進 55 到 60 區間，沒人會注意到。

關於 SSR：hook 在伺服端回傳 `0`，所以別把關鍵 UI 卡在「值非零」上。客戶端第一次渲染在首個測量視窗結束前也是 `0`，下個 tick 才跳到真實值。如果你拿它做自適應渲染，第一個測量到達之前預設走「高保真」分支。

## 4. useDevicePixelRatio——以正確解析度繪製

Canvas 元素有兩套尺寸：CSS 尺寸決定它在頁面上看起來多大；像素緩衝尺寸決定它看起來多精細。在 Retina 屏上裝置像素比是 2，於是一個 CSS 尺寸 `600px × 400px` 的 `<canvas width="600" height="400">` 會顯得糊——600×400 的像素緩衝被瀏覽器合成器拉伸到 1200×800 的物理像素上。修法是把緩衝設為 `cssWidth × dpr` 和 `cssHeight × dpr`，再把繪圖上下文按 `dpr` 縮放，這樣座標還是按 CSS 單位寫。

[`useDevicePixelRatio`](https://reactuse.com/browser/usedevicepixelratio/) 響應式地追蹤當前像素比——包括使用者把視窗從 Retina 筆電屏拖到外接 1x 顯示器時：

```tsx
import { useRef, useEffect } from 'react';
import { useDevicePixelRatio } from '@reactuses/core';

function CrispCanvas({ width, height, draw }: {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pixelRatio } = useDevicePixelRatio();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(pixelRatio, pixelRatio);
    draw(ctx, width, height);
  }, [width, height, pixelRatio, draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
    />
  );
}
```

三行命令式 setup，但這三行恰好是幾乎所有 React canvas 教學都寫錯的三行：把緩衝尺寸設為 `css × dpr`，再用內聯 style 把 CSS 尺寸設回原始值，最後縮放上下文。這個 hook 讓第三個依賴——像素比——變成響應式，所以把視窗從一個顯示器拖到另一個會觸發以新密度重繪。

內部用的是 [`matchMedia`](https://developer.mozilla.org/zh-TW/docs/Web/API/Window/matchMedia)，針對當前像素比的 `(resolution: <ratio>dppx)` query。比率變化時 `matchMedia` 監聽器觸發，hook 重渲染，你的 effect 拿到新值再跑一次。監聽器在掛載時加一次、卸載時移除——和本文所有 hook 一樣的生命週期。

同樣的模式適用於一切要畫像素的東西：影像 canvas、WebGL 上下文、影片幀抽取。對 `<img>` 的 `srcset` 選擇也有意義，但瀏覽器會自動處理；只有你自己在做渲染時才需要這個 hook。SSR 回傳 `1`，讓伺服端的版面計算保持合理，hydration 後第一次繪製時再更新到真實值。

## 5. useUpdate——一次無 state 的重渲染

本文最怪也是你最少用到的 hook。[`useUpdate`](https://reactuse.com/effect/useupdate/) 回傳一個引用穩定的函式，呼叫時強制元件重渲染：

```tsx
import { useRef } from 'react';
import { useUpdate, useRafFn } from '@reactuses/core';

function StopwatchDisplay() {
  const startRef = useRef(performance.now());
  const update = useUpdate();

  useRafFn(() => {
    update();
  });

  const elapsed = ((performance.now() - startRef.current) / 1000).toFixed(2);
  return <div>{elapsed}s</div>;
}
```

這個碼錶每幀更新一次，並不把已用時間放到 React state 裡。真相來源是 `performance.now()`，每次渲染重新讀；`useUpdate` 的存在只是為了調度渲染。六行，沒有 `setState`，沒有對過期時間的閉包。你也可以用 `useState((s) => s + 1)` 做同樣的事，但用 `useUpdate` 意圖更清楚——「再渲一次這玩意」，而不是「為了讓它再渲一次而遞增一個計數器」。

更實用的用法是**和那些 React 不追蹤其變化的命令式 API 互通**。一個透過引用暴露當前相機位置的 WebGL 渲染器；一個 Three.js 場景圖；一個你拿來當 state 用、但不想每次改都重建的 `Set` 或 `Map`。改完之後呼叫一下 `update()` 告訴 React 這個元件髒了：

```tsx
function FavoritesList({ favorites }: { favorites: Set<string> }) {
  const update = useUpdate();

  return (
    <ul>
      {[...favorites].map((id) => (
        <li key={id}>
          {id}{' '}
          <button onClick={() => {
            favorites.delete(id);
            update();
          }}>
            remove
          </button>
        </li>
      ))}
    </ul>
  );
}
```

直接改 `Set` 再重渲，對大集合來說比 `setFavorites(new Set([...favorites].filter(x => x !== id)))` 快，還能讓 `Set` 的引用在多次渲染間保持穩定，下游 memoize 的子元件就不用重算。它當然也是個一腳踏入坑裡的好辦法——React 的最佳化假設不可變，凡是靠引用變化偵測更新的地方都會默默失靈。要刻意用、用要標註清楚、效能壓不出問題就老老實實 `useState`。

`useUpdate` 也常和 `useTextSelection` 這類與可變平台物件打交道的 hook 搭檔（[事件 hooks](/blog/react-event-hooks/) 那篇覆蓋了這種情況）。如果底層物件在多次呼叫間是同一個引用，`setState` 是個空操作；`useUpdate` 就是繞路辦法。

## 湊齊：60fps 彈簧拖尾指標

一次用上五個裡的四個。一個用彈簧拖尾跟隨真實滑鼠的自訂指標，在 Retina 上以正確解析度繪製，角落顯示自己的 FPS，分頁隱藏時暫停：

```tsx
import { useRef } from 'react';
import {
  useRafFn,
  useRafState,
  useFps,
  useDevicePixelRatio,
  useEventListener,
} from '@reactuses/core';

function SpringCursor() {
  const target = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useRafState({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const fps = useFps();
  const { pixelRatio } = useDevicePixelRatio();

  useEventListener('mousemove', (e: MouseEvent) => {
    target.current = { x: e.clientX, y: e.clientY };
  });

  useRafFn(() => {
    const dx = target.current.x - pos.x;
    const dy = target.current.y - pos.y;
    const stiffness = 0.15;
    const damping = 0.7;
    velocity.current.x = velocity.current.x * damping + dx * stiffness;
    velocity.current.y = velocity.current.y * damping + dy * stiffness;
    setPos({
      x: pos.x + velocity.current.x,
      y: pos.y + velocity.current.y,
    });
  });

  useEventListener('visibilitychange', () => {
    if (document.hidden) velocity.current = { x: 0, y: 0 };
  });

  const size = 24;
  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: '50%',
          background: 'currentColor',
          pointerEvents: 'none',
          imageRendering: pixelRatio >= 2 ? 'auto' : 'pixelated',
        }}
      />
      <div style={{ position: 'fixed', top: 8, left: 8, fontFamily: 'monospace' }}>
        {fps} fps @ {pixelRatio}x
      </div>
    </>
  );
}
```

四個 hook 各幹各的。`useEventListener` 以原生速率把滑鼠座標讀到 ref——不觸發 React 渲染。`useRafFn` 每幀跑一次彈簧積分，讀最新目標位置、寫當前彈簧位置。`useRafState` 把每幀的位置更新合併成一次渲染。`useFps` 回饋當前幀率。`useDevicePixelRatio` 影響 `image-rendering` 的選擇（小細節，但正好是那種沒人注意到、直到 1x 顯示器上的使用者來投訴的細節）。

樸素版本要麼在每個 mousemove 上 `setState`（500Hz 渲染，燒電池），要麼靠 `setInterval(handler, 16)`（漂移，並且在背景分頁裡繼續跑），要麼乾脆不要彈簧、看上去很廉價。用這些 hook 之後，讀取頻率就是問題本身的頻率——每幀一次，React 樹永遠不會以快於使用者能看到的速度重渲染。

## 何時用哪個

| 你想                                                       | 用                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 每個動畫幀跑一個回呼                                       | [`useRafFn`](https://reactuse.com/effect/useraffn/)                           |
| 每次繪製最多更新一次 state                                 | [`useRafState`](https://reactuse.com/state/userafstate/)                      |
| 測當前幀率                                                 | [`useFps`](https://reactuse.com/browser/usefps/)                              |
| 以顯示器原生解析度繪製                                     | [`useDevicePixelRatio`](https://reactuse.com/browser/usedevicepixelratio/)    |
| 改了 React 看不到的東西之後重新渲染                        | [`useUpdate`](https://reactuse.com/effect/useupdate/)                         |

兩條非規則。`useRafFn` 不是 `setInterval` 的替代——它按顯示器刷新率跑，ProMotion 屏上是 120Hz，省電模式分頁裡是 30Hz。如果你要嚴格的「每秒 N 次」節拍，用 `useInterval` 然後接受視覺代價。還有 `useUpdate` 是逃生艙——一份程式碼庫裡反覆用它超過一兩次，背後的真問題往往是「我為了效能把 state 放到了 React 之外」，正確的修法是修那個效能問題，而不是把逃生艙當常規。

## 安裝

```bash
npm install @reactuses/core
# 或
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

五個 hook 都是單獨 tree-shake——引 `useRafState` 不會把 `useDevicePixelRatio` 拖進來。每個都帶 TypeScript 型別，在客戶端渲染應用和 SSR 框架（Next.js、Remix、Astro）裡都能用；基於循環的 hook 在伺服端是 no-op，`useDevicePixelRatio` 和 `useFps` 在 hydration 之前回傳安全預設值（分別是 `1` 和 `0`）。

## 相關 hook

如果你想要的渲染循環 hook 不在這份名單裡，三篇鄰居部落格可以一起看。[ref 逃生艙](/blog/react-ref-escape-hatch/) 那篇講 [`useLatest`](https://reactuse.com/state/uselatest/)——它就是 `useRafFn` 內部用來讓回呼看到新鮮閉包又不重啟循環的那個 trick——如果你想理解這些 hook 怎麼實作而不只是怎麼用，從這一篇開始。[事件 hooks](/blog/react-event-hooks/) 講 `useEventListener` 和 `useThrottleFn`，它們和 `useRafFn` 在輸入驅動的動畫上配合得很自然。[滾動效果](/blog/react-scroll-effects/) 那篇講的是在這些原語之上更高一層的滾動聯動動畫 hook。

在 [reactuse.com](https://reactuse.com) 瀏覽完整列表，或者直接打開上面任意一個 hook 讀原始碼——它們大多不到 40 行，五個 hook 底下的循環原語都是同一個八行的 `useRef` + `useEffect` 模式，你大概率已經自己寫過半打了。
