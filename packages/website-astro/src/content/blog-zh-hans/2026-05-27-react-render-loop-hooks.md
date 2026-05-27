---
title: "在 React 里写动画又不跟渲染周期较劲：useRafFn、useRafState、useFps、useDevicePixelRatio、useUpdate"
description: "React 的协调器按自己的节奏跑，浏览器的合成器每秒固定六十帧，你的动画必须落在后者上又不被前者绊住。本文走读五个 ReactUse hook——useRafFn、useRafState、useFps、useDevicePixelRatio、useUpdate——它们都建立在 requestAnimationFrame 之上，让 React state、canvas 绘制、高 DPI 渲染不再互相阻塞。"
slug: react-render-loop-hooks
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-05-27
tags: [react, hooks, animation, performance, tutorial]
keywords: [react requestAnimationFrame hook, react useRafFn, react 动画 hook, react raf 状态, react useRafState, react 帧率 hook, react useFps, react 设备像素比 hook, react useDevicePixelRatio, react retina canvas, react 强制重渲染, react useUpdate, react 60fps 动画, react canvas hook, react 性能 hook, react 动画循环, react 渲染帧合并]
image: /img/og.png
---

# 在 React 里写动画又不跟渲染周期较劲：useRafFn、useRafState、useFps、useDevicePixelRatio、useUpdate

React 用一套时钟，浏览器用另一套。React 的协调器根据 state 更新、effect、调度器对"尽快"的理解来决定何时重新渲染组件。浏览器的合成器则按显示器能撑住的速度刷屏——大多数显示器是 60Hz，少数是 120Hz。两套时钟并不同步。state 更新会落在两次绘制之间被合并；庞大的渲染树可能整个错过一帧；`setInterval(handler, 16)` 一分钟下来会漂移几百毫秒，因为它根本不关心 GPU 在干嘛。

<!-- truncate -->

标准解法是 `requestAnimationFrame`。它在**下一次绘制之前**调用你的回调，附带一个高精度时间戳，并且在标签页隐藏时自动节流。它就是所有要看起来"丝滑"的东西该用的原语。但它在 React 里手工接线很繁琐：你需要一个 ref 存帧 ID、一个 effect 启动循环、一段清理函数在卸载时取消、一个 `useLatest` 让回调看到最新的 props，再加一个 ref 才能做暂停/恢复。每个动画组件都重写一遍这套脚手架，而大多数人第一次写都会漏掉某个清理。

[ReactUse](https://reactuse.com) 把这套脚手架收进了五个共享同一底层循环的 hook。本文逐个走读——`useRafFn` 提供循环本身，`useRafState` 做随循环更新的 state，`useFps` 量化这个循环，`useDevicePixelRatio` 让你在循环里以正确分辨率绘制，`useUpdate` 应付那些"需要推一下 React 但又没 state 可改"的场景。合起来基本能覆盖你在专门的动画库之外要做的所有事。

## 一个组件里的 bug

一张跟随鼠标的浮卡：

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

看上去没毛病。打开 devtools 性能面板，鼠标在屏幕上甩一遍。在一台快点的笔记本上，`mousemove` 每秒触发 120 到 500 次，看输入设备和 OS。每次都会调用 `setPos`，每次都触发一次重渲染调度，React 把它们合并到下一个 microtask。你在做屏幕能展示的两到八倍的协调工作，多出来的渲染全是纯开销——真正有意义的只是下一次绘制之前的最后一次。

[`useRafState`](https://reactuse.com/state/userafstate/) 把这件事压缩成每帧一次，不管事件多快。原地替换，同样的 `[state, setState]` API，每次鼠标抖动少三次协调。本文剩下的 hook 都遵循同一个模式：保留 React 风格的 API，把 `requestAnimationFrame` 的管道藏起来。

## 1. useRafFn——带暂停/恢复的循环

[`useRafFn`](https://reactuse.com/effect/useraffn/) 是其他一切的基石。它接收一个回调，在每个 `requestAnimationFrame` tick 上调用，并把高精度时间戳传进去。返回 `[stop, start, isActive]`，让你可以在标签页失焦、用户交互或任何其他信号上暂停循环：

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
        {isActive() ? '暂停' : '继续'}
      </button>
    </>
  );
}
```

这个 hook 有四个设计选择值得理解。回调在**下一次绘制之前**运行——这是 `requestAnimationFrame` 的语义——所以回调里做的任何 DOM 读取看到的都是即将绘制时的布局，不会额外触发强制回流。回调引用被 [`useLatest`](https://reactuse.com/state/uselatest/) 包了一层，所以你可以闭包到新鲜的 props（`count`、作用域里任何东西）而不必重启循环。循环挂载时自动启动；第二个参数传 `false` 则从第一帧起就停在手动控制状态。清理注册在 effect 上，所以卸载时会取消挂起的帧——不会有野回调在死掉的组件上跑。

`isActive` 返回的是函数而不是布尔。在事件处理器里调用它总能拿到当前值；在渲染里调用只能看到渲染时的值。这种不对称容易踩。如果你要把激活标志用在 JSX 的 `disabled={}` 这种 prop 上，配合 `useUpdate` 在 `stop`/`start` 调用方里手动 `update()`——上面示例没这么做是因为按钮文案下一次点击时本来就会重算。

`useRafFn` 真实场景下还有不少 canvas 之外的用法：任何要在**两次事件之间**追踪时间的活儿都用得到。一个要按 delta time 积分速度的物理模拟。一个 scrub bar 想紧跟媒体元素的 `currentTime`，而不是等那个粗糙的 `timeupdate` 事件（它按编解码器心情触发，不按你心情）。一个用弹簧拖尾跟随真实鼠标的自定义指针——`useRafFn` 读最新的目标位置，跑一步弹簧迭代，把结果写到 CSS 变量。这些都在替代那些会漂移、又会在后台标签里烧电池的 `setInterval` 模式。

## 2. useRafState——按帧合并的 useState

[`useRafState`](https://reactuse.com/state/userafstate/) 是那张浮卡你真正会发布的版本：

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

API 完全是 `useState`——同样的 setter 签名，同样支持 updater 函数——但写入会被 `requestAnimationFrame` 排队。同一帧内的五次 `setPos` 合并为一次 React 更新；React 更新每次绘制最多 flush 一次；DOM 更新的频率正好与屏幕刷新同步。`mousemove` 监听还是按 500Hz 触发，开销几乎等同于调一个空函数。协调成本掉到 60Hz，正好是屏幕能展示的。

几点要知道。这个 hook 给每个 state 槽位维护一个挂起的 `requestAnimationFrame` ID，所以同一帧内连续的 setter 是**替换**，不是排队——最后一个值赢。视觉 state 几乎总是想要这个语义：你不在乎中间的鼠标位置，只在乎绘制那一刻光标在哪。如果你真的在乎——比如你在采样传感器数据每个值都要——那就用普通 `useState` 并接受重渲染成本，或者写到 ref 里然后用 `useRafFn` tick 来 flush。

清理细节和 `useRafFn` 一样：挂起的帧在卸载时取消，所以快速点击-拖拽-卸载的连击不会冒出 `setState on unmounted component` 警告。内部实现是 `useState` + `useRef`（存帧 ID） + `useUnmount` 清理，总共大概二十行。你自己写得出来；这个 hook 只是省下了你每次都写一遍。

有个坑。因为 state 比事件慢一帧，调用 setter **立刻**读 state 还是旧值：

```tsx
setPos({ x: 100, y: 100 });
console.log(pos); // 还是 { x: 0, y: 0 } —— 更新还没跑
```

普通 `useState` 在同一次渲染周期内也是这样，但**慢整整一帧**这件事在拼命令式代码时容易让你意外。要回读这个值，旁边再放一个 ref 同步存。

## 3. useFps——量化你做出来的东西

`useRafFn` 和 `useRafState` 都在改善流畅度，但流畅度是一个可量化的指标，不是感觉。[`useFps`](https://reactuse.com/browser/usefps/) 返回当前帧率（数字），通过统计底层 `requestAnimationFrame` 回调触发的频率算出来：

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

丢进 dev build，你就有了平时要打开 Chrome rendering 面板才能看的 FPS 计数器。hook 接受一个 `every` 选项（默认 `10`），控制平均多少帧；小数字对卡顿响应快但抖动多，大数字读数更平滑但对突然掉帧反应慢。角落的常驻 overlay 用 10 很合适；如果你在调一段具体的卡顿过场动画，就用 1 或 2。

更有意思的用法是**自适应渲染**。读 FPS，掉到阈值以下就减少要做的事：

```tsx
function ParticleSystem({ baseCount = 1000 }: { baseCount?: number }) {
  const fps = useFps({ every: 30 });
  const count =
    fps >= 55 ? baseCount : fps >= 40 ? baseCount / 2 : baseCount / 4;

  return <Particles count={count} />;
}
```

这正是 3A 游戏引擎在帧预算吃紧时的做法——降粒子数、调阴影分辨率、把流体模拟换成更粗的网格。对一个 React 应用来说，通常把动画背景的粒子数减半，或者干脆停掉一个非关键的 `useRafFn` 循环，就足够了。阈值数字凭口味；60Hz 显示器上 55 是一条合理的"我们基本还行"的线，因为平均值光被 GC 拽一下就能掉进 55 到 60 区间，没人会注意到。

关于 SSR：hook 在服务端返回 `0`，所以别把关键 UI 卡在"值非零"上。客户端第一次渲染在首个测量窗口结束前也是 `0`，下个 tick 才跳到真实值。如果你拿它做自适应渲染，第一个测量到达之前默认走"高保真"分支。

## 4. useDevicePixelRatio——以正确分辨率绘制

Canvas 元素有两套尺寸：CSS 尺寸决定它在页面上看起来多大；像素缓冲尺寸决定它看起来多精细。在 Retina 屏上设备像素比是 2，于是一个 CSS 尺寸 `600px × 400px` 的 `<canvas width="600" height="400">` 会显得糊——600×400 的像素缓冲被浏览器合成器拉伸到 1200×800 的物理像素上。修法是把缓冲设为 `cssWidth × dpr` 和 `cssHeight × dpr`，再把绘图上下文按 `dpr` 缩放，这样坐标还是按 CSS 单位写。

[`useDevicePixelRatio`](https://reactuse.com/browser/usedevicepixelratio/) 响应式地追踪当前像素比——包括用户把窗口从 Retina 笔记本屏拖到外接 1x 显示器时：

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

三行命令式 setup，但这三行恰好是几乎所有 React canvas 教程都写错的三行：把缓冲尺寸设为 `css × dpr`，再用内联 style 把 CSS 尺寸设回原始值，最后缩放上下文。这个 hook 让第三个依赖——像素比——变成响应式，所以把窗口从一个显示器拖到另一个会触发以新密度重绘。

内部用的是 [`matchMedia`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/matchMedia)，针对当前像素比的 `(resolution: <ratio>dppx)` query。比率变化时 `matchMedia` 监听器触发，hook 重渲染，你的 effect 拿到新值再跑一次。监听器在挂载时加一次、卸载时移除——和本文所有 hook 一样的生命周期。

同样的模式适用于一切要画像素的东西：图像 canvas、WebGL 上下文、视频帧抽取。对 `<img>` 的 `srcset` 选择也有意义，但浏览器会自动处理；只有你自己在做渲染时才需要这个 hook。SSR 返回 `1`，让服务端的布局计算保持合理，hydration 后第一次绘制时再更新到真实值。

## 5. useUpdate——一次无 state 的重渲染

本文最怪也是你最少用到的 hook。[`useUpdate`](https://reactuse.com/effect/useupdate/) 返回一个引用稳定的函数，调用时强制组件重渲染：

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

这个秒表每帧更新一次，并不把已用时间放到 React state 里。真相来源是 `performance.now()`，每次渲染重新读；`useUpdate` 的存在只是为了调度渲染。六行，没有 `setState`，没有对过期时间的闭包。你也可以用 `useState((s) => s + 1)` 做同样的事，但用 `useUpdate` 意图更清楚——"再渲一次这玩意"，而不是"为了让它再渲一次而递增一个计数器"。

更实用的用法是**和那些 React 不追踪其变化的命令式 API 互通**。一个通过引用暴露当前相机位置的 WebGL 渲染器；一个 Three.js 场景图；一个你拿来当 state 用、但不想每次改都重建的 `Set` 或 `Map`。改完之后调一下 `update()` 告诉 React 这个组件脏了：

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

直接改 `Set` 再重渲，对大集合来说比 `setFavorites(new Set([...favorites].filter(x => x !== id)))` 快，还能让 `Set` 的引用在多次渲染间保持稳定，下游 memoize 的子组件就不用重算。它当然也是个一脚踏入坑里的好办法——React 的优化假设不可变，凡是靠引用变化检测更新的地方都会默默失灵。要刻意用、用要标注清楚、性能压不出问题就老老实实 `useState`。

`useUpdate` 也常和 `useTextSelection` 这类与可变平台对象打交道的 hook 搭档（[事件 hooks](/blog/react-event-hooks/) 那篇覆盖了这种情况）。如果底层对象在多次调用间是同一个引用，`setState` 是个空操作；`useUpdate` 就是绕路办法。

## 凑齐：60fps 弹簧拖尾指针

一次用上五个里的四个。一个用弹簧拖尾跟随真实鼠标的自定义指针，在 Retina 上以正确分辨率绘制，角落显示自己的 FPS，标签页隐藏时暂停：

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

四个 hook 各干各的。`useEventListener` 以原生速率把鼠标坐标读到 ref——不触发 React 渲染。`useRafFn` 每帧跑一次弹簧积分，读最新目标位置、写当前弹簧位置。`useRafState` 把每帧的位置更新合并成一次渲染。`useFps` 反馈当前帧率。`useDevicePixelRatio` 影响 `image-rendering` 的选择（小细节，但正好是那种没人注意到、直到 1x 显示器上的用户来投诉的细节）。

朴素版本要么在每个 mousemove 上 `setState`（500Hz 渲染，烧电池），要么靠 `setInterval(handler, 16)`（漂移，并且在后台标签里继续跑），要么干脆不要弹簧、看上去很廉价。用这些 hook 之后，读取频率就是问题本身的频率——每帧一次，React 树永远不会以快于用户能看到的速度重渲染。

## 何时用哪个

| 你想                                                       | 用                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 每个动画帧跑一个回调                                       | [`useRafFn`](https://reactuse.com/effect/useraffn/)                           |
| 每次绘制最多更新一次 state                                 | [`useRafState`](https://reactuse.com/state/userafstate/)                      |
| 测当前帧率                                                 | [`useFps`](https://reactuse.com/browser/usefps/)                              |
| 以显示器原生分辨率绘制                                     | [`useDevicePixelRatio`](https://reactuse.com/browser/usedevicepixelratio/)    |
| 改了 React 看不到的东西之后重新渲染                        | [`useUpdate`](https://reactuse.com/effect/useupdate/)                         |

两条非规则。`useRafFn` 不是 `setInterval` 的替代——它按显示器刷新率跑，ProMotion 屏上是 120Hz，省电模式标签里是 30Hz。如果你要严格的"每秒 N 次"节拍，用 `useInterval` 然后接受视觉代价。还有 `useUpdate` 是逃生舱——一份代码库里反复用它超过一两次，背后的真问题往往是"我为了性能把 state 放到了 React 之外"，正确的修法是修那个性能问题，而不是把逃生舱当常规。

## 安装

```bash
npm install @reactuses/core
# 或
pnpm add @reactuses/core
# 或
yarn add @reactuses/core
```

五个 hook 都是单独 tree-shake——引 `useRafState` 不会把 `useDevicePixelRatio` 拖进来。每个都带 TypeScript 类型，在客户端渲染应用和 SSR 框架（Next.js、Remix、Astro）里都能用；基于循环的 hook 在服务端是 no-op，`useDevicePixelRatio` 和 `useFps` 在 hydration 之前返回安全默认值（分别是 `1` 和 `0`）。

## 相关 hook

如果你想要的渲染循环 hook 不在这份名单里，三篇邻居博客可以一起看。[ref 逃生舱](/blog/react-ref-escape-hatch/) 那篇讲 [`useLatest`](https://reactuse.com/state/uselatest/)——它就是 `useRafFn` 内部用来让回调看到新鲜闭包又不重启循环的那个 trick——如果你想理解这些 hook 怎么实现而不只是怎么用，从这一篇开始。[事件 hooks](/blog/react-event-hooks/) 讲 `useEventListener` 和 `useThrottleFn`，它们和 `useRafFn` 在输入驱动的动画上配合得很自然。[滚动效果](/blog/react-scroll-effects/) 那篇讲的是在这些原语之上更高一层的滚动联动动画 hook。

在 [reactuse.com](https://reactuse.com) 浏览完整列表，或者直接打开上面任意一个 hook 读源码——它们大多不到 40 行，五个 hook 底下的循环原语都是同一个八行的 `useRef` + `useEffect` 模式，你大概率已经自己写过半打了。
