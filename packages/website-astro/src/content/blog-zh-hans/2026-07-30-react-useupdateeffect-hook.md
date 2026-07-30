---
title: "React useUpdateEffect Hook：跳过首次渲染（2026）"
description: "一篇实用的 useUpdateEffect 上手指南：让 effect 只在依赖变化时执行、跳过挂载那一次；背后只有四行的实现；经过实测验证的 StrictMode 行为（开发模式下回调真的会在挂载时触发——附测试输出为证）；cleanup 语义；以及什么时候你真正需要的是 useMount、useUpdate 或 useDeepCompareEffect。TypeScript 优先。"
slug: react-useupdateeffect-hook
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-07-30
tags: [react, hooks, effect, typescript, tutorial]
keywords: [react useUpdateEffect, useupdateeffect, useEffect 跳过首次渲染, react useEffect 跳过初次执行, effect 只在更新时执行, useEffect 不在挂载时执行, react 只响应变化, useUpdateEffect typescript, useUpdateEffect strictmode, react 跳过挂载 effect]
image: /img/og.png
---

# React useUpdateEffect Hook：跳过首次渲染（2026）

`useEffect` 从不关心自己*为什么*在执行。挂载也好、更新也罢——回调照跑不误。于是「设置已保存 ✓」的 toast 在页面刚加载时就跟用户打了个招呼，autosave 把一个没人碰过的表单 POST 了出去，埋点上报了一次「变更」——实际上只是组件出现了而已。你想表达的是*这个值变化时执行*；你实际写出来的是*这个值变化时执行，另外开头再无缘无故执行一次*。

[`@reactuses/core`](https://reactuse.com) 的 [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 就是去掉挂载那一次的 `useEffect`：签名完全一致，cleanup 语义完全一致，恰好跳过一次调用。实现只有四行，所以这篇文章会讲清这四行做了什么、这层抽象唯一真正漏气的地方——React 18 StrictMode，我们会用测试证明开发模式下回调*确实*会在挂载时触发——以及那几个容易和它搞混的邻居 hooks。TypeScript 优先。

<!-- truncate -->

## 手写的守卫

跳过挂载执行没什么玄学——任何有点年头的 React 代码库里都有这段：

```tsx
function SearchFilters({ filters }: { filters: Filters }) {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackEvent("filters_changed", filters); // 页面加载时别上报，拜托
  }, [filters]);
  // ...
}
```

它能用。问题不在正确性，在于这个守卫是*每个 effect 一份*的：ref、判断、翻转，每个需要这行为的 effect 都要重新敲一遍，而真正的意图——「跳过挂载」四个字——被六行仪式感埋住了。这份配方的各种变体还会在 code review 里慢慢腐烂：有人把标志「简化」成 `useState`，白买一次渲染；有人把守卫复制进第二个 effect 却让两个 effect 共享一个 ref，于是谁先执行谁消耗掉那次跳过，另一个照样在挂载时触发。

对付有名字的样板代码，标准解法就是：把名字给它。

## useUpdateEffect —— 去掉挂载的 useEffect

```tsx
import { useState } from 'react';
import { useUpdateEffect } from '@reactuses/core';

function EditorSettings({ userId }: { userId: string }) {
  const [settings, setSettings] = useState(loadDefaults);

  useUpdateEffect(() => {
    saveSettings(userId, settings);
    toast("设置已保存 ✓");
  }, [settings]);

  return <SettingsForm value={settings} onChange={setSettings} />;
}
```

挂载时：什么都不发生——没有幽灵保存，没有对着用户还没碰过的表单弹 toast。之后每次 `settings` 变化：和 `useEffect` 一模一样。签名就是 `useEffect` 的原文照抄：

```ts
function useUpdateEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
```

依赖数组、effect 返回的 cleanup 函数，全部按你的 `useEffect` 直觉运作。没有任何新东西要学——这正是它的意义。

## 四行代码，一个原语

[实现](https://reactuse.com/effect/useupdateeffect/)是一层薄到几乎不好意思展开讲的包装——几乎：

```ts
const createUpdateEffect = (hook) => (effect, deps) => {
  const isFirstMount = useFirstMountState();

  hook(() => {
    if (!isFirstMount) {
      return effect();
    }
  }, deps);
};

export const useUpdateEffect = createUpdateEffect(useEffect);
```

底下的原语 [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/)，靠在渲染期间翻转一个 ref 来回答「这是第一次渲染吗」：

```ts
export const useFirstMountState = (): boolean => {
  const isFirst = useRef(true);
  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }
  return isFirst.current;
};
```

有两个细节值得停下来看。第一，*effect 本身在挂载时仍然会跑*——React 照常注册它、diff 依赖、调度回调。被跳过的是里面*你的*那个函数。这很重要，因为它意味着依赖数组从第一次渲染起就是活的；第二次渲染 diff 时有真实的东西可比。第二，`createUpdateEffect` 是一个针对 effect hook 的工厂，[`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) 就是这么来的：同样的跳过逻辑，换成 `useLayoutEffect` 的时机，用于仅更新时需要在绘制前测量或改动 DOM 的场景。

cleanup 的行为从「你的回调从没跑过」自然推出：挂载后没有东西需要清理，所以第一次 cleanup 发生在你的 effect *第二次*更新执行之前——而卸载时，只要你的 effect 至少跑过一次，它的 cleanup 会正常触发。库自己的测试套件把这一点钉死了。

## StrictMode 的坑——实测验证，不是道听途说

这是大多数 `useUpdateEffect` 文章跳过的一节，而它恰恰是真正会咬你的那个。在 React 18+ 上用 `<StrictMode>` 包住组件，开发模式下运行：

```tsx
const effect = jest.fn();

function Comp() {
  const [c, setC] = useState(0);
  useUpdateEffect(() => { effect(c); }, [c]);
  // ...
}

render(<StrictMode><Comp /></StrictMode>);
// effect.mock.calls.length === 2   ← 挂载时。两次。
```

这不是假设——这是对真实实现跑测试的输出。这个「跳过第一次」的 hook 在 StrictMode 开发模式下，挂载时执行了，还是两次。链条是这样的：

1. StrictMode 会**把渲染函数调用两遍**。第一遍翻转了 ref：`useFirstMountState` 返回 `true`。第二遍——同一个组件实例、同一个 ref——发现它已经翻过了，返回 `false`。给 hook 加上探针，两遍的返回值恰好是 `[true, false]`。
2. 最终提交的是第二遍渲染，所以 effect 闭包捕获到的是 `isFirstMount === false`。守卫在任何 effect 执行之前就已经被攻破了。
3. 接着 StrictMode 会**把 effect 跑两遍**（挂载 → 模拟卸载 → 重新挂载），两次都畅通无阻地穿过了敞开的守卫。两次调用。

先别急着提 bug：这不是 reactuse 的缺陷，这正是 StrictMode 存在的目的所要制造的碰撞。在渲染期间翻转 ref 是几乎所有基于 ref 的首次挂载检测的工作方式，而「这个函数渲染过几次」恰恰是 StrictMode 的双重调用被设计出来要揪出的那类隐藏的渲染次数依赖。生产构建不会双重调用，所以**生产环境下这个跳过完全按广告宣传的方式工作**——分歧只存在于开发模式。

实用的准则：

- 把 `useUpdateEffect` 用在 **UX 级**的跳过上——toast、autosave、埋点、筛选变化时重新请求。开发模式多触发一次不会造成真实损失，生产环境行为端正。
- 别把它用在**正确性级**的保证上——「这个网络请求绝不能在挂载时发出」如果只靠 `useUpdateEffect` 兜底，那它在每次 StrictMode 开发运行时都会在挂载时发出，然后你就得搭进去一下午。正确性需要的是基于*数据*的条件，而不是渲染计数：用 [`usePrevious`](https://reactuse.com/state/useprevious/) 对比上一个值，或者在触发前检查真实状态（「表单是否已被编辑」）。

如果你在哪个 hooks 库的 issue 区见过「我的 useUpdateEffect 在挂载时执行了！」——每一次，都是这个原因。

## 别把它和邻居搞混

effect 家族里有几个名字近得容易撞车，选错了不是 bug 而是范畴错误，所以——认门指南：

- [`useMount`](https://reactuse.com/effect/usemount/) 是镜像：回调**只**在挂载时执行，更新时永不。它和 `useUpdateEffect` 加起来，`useEffect` 的两半各自有了名字。
- [`useUpdate`](https://reactuse.com/effect/useupdate/)——虽然名字像——完全不属于这个家族。它返回一个**强制重新渲染**的函数。如果你冲着「更新时的 effect」找到了它，你要找的其实是本文这个 hook。
- [`useUpdateLayoutEffect`](https://reactuse.com/effect/useupdatelayouteffect/) 是同样的跳过逻辑套在 `useLayoutEffect` 的时机上——仅更新时测量 DOM，不闪一帧未绘制的状态。
- [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/) 解决的是 effect 的*另一个*经典抱怨：依赖用 `Object.is` 比较，每次渲染新建的对象字面量都会重新触发。如果你的 effect 过度触发是因为对象标识而不是挂载时机，你要的是它。
- [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) 是原语本身——当你需要在*渲染期间*感知首次渲染时直接用它（比如初次绘制时跳过一个动画 class），而不是在 effect 里。

## 真实使用场景

- **尊重水合的 autosave。** 表单状态来自服务端或 `localStorage`；挂载时把它存回去，轻则一次浪费的写入，重则用默认值覆盖掉更新的数据。在*变化*时保存。（顺手做个防抖——[`useDebounceFn`](https://reactuse.com/effect/usedebouncefn/) 在回调里组合得很干净。）
- **变更通知。**「主题已更新」「筛选已应用」「已复制！」——这是对*动作*的反馈。挂载时没有动作，所以页面加载就弹 toast 看起来像个 bug。这是人们来找这个 hook 的头号原因。
- **跳过重复的初次请求。** 页面已经带着数据服务端渲染了，或者首批数据从 props 传下来了；这个 effect 的存在意义是查询条件变化时*重新*请求。挂载执行 = 对屏幕上已有的数据立刻再发一次请求。
- **只在变化时埋点。** `trackEvent("sort_changed", sort)` 应该意味着用户改了排序——而不是组件带着默认值挂载了。需要 from → to 的事件负载时，配合 [`usePrevious`](https://reactuse.com/state/useprevious/)。

## SSR 安全性

没什么需要守卫的。服务端渲染期间 effect 根本不执行——这是 React 的规则，不是库的功劳——而 `useFirstMountState` 不碰 `window`、不碰 `document`，只有一个 ref。服务端渲染、水合、客户端首次渲染：你的回调在这三步里全程静默，然后在第一次真实更新时醒来。和 [`@reactuses/core`](https://reactuse.com) 里每个 hook 的目标一样是构造上 SSR 安全——只不过这一个是靠根本没有可出错的地方来达成的。

## 要点回顾

- **`useEffect` 会在挂载时执行；有时你想要的是「仅变化时」。** [`useUpdateEffect`](https://reactuse.com/effect/useupdateeffect/) 就是这个意图的名字——同样的签名、同样的 cleanup，少一次调用。
- **实现是包在 [`useFirstMountState`](https://reactuse.com/state/usefirstmountstate/) 外面的四行**；effect 在挂载时照常注册，被跳过的只是你的回调，所以依赖追踪从第一次渲染就开始。
- **StrictMode 开发模式下它会在挂载时触发——两次——这是实测验证的，不是传闻。** 双重渲染调用能攻破任何「渲染期间翻转 ref」的守卫。生产环境不受影响。UX 级的跳过放心用；正确性级的规则要建立在数据上，而不是渲染计数上。
- **小心撞名**：[`useMount`](https://reactuse.com/effect/usemount/) 是它的另一半，[`useUpdate`](https://reactuse.com/effect/useupdate/) 是来自另一个宇宙的重渲染触发器，而对象标识导致的过度触发要找 [`useDeepCompareEffect`](https://reactuse.com/effect/usedeepcompareeffect/)。
- **零仪式的 SSR 安全**——服务端根本不跑 effect，挂载跳过原封不动地穿过水合。

从 [`@reactuses/core`](https://reactuse.com/effect/useupdateeffect/) 拿走它，让你的 effect 别再为自己的出生开派对了。
