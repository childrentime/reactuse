---
title: "桶文件（Barrel Files）：index.ts 统一导出如何拖垮 Tree Shaking、Next.js 开发内存和 tsc (2026)"
description: "桶文件的真实代价：脆弱的 tree shaking、Next.js 开发页面为一个 import 拉进 552 kB、tsc 和 TS server 多解析上千个模块、以及以 'Cannot access before initialization' 现身的循环依赖。附 @reactuses/core 重建 dist 的真实前后数据，以及应用作者和库作者两侧的修复方案。"
slug: barrel-files-tree-shaking
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-06
tags: [react, typescript, performance, bundling, tutorial]
keywords: [barrel files, 桶文件, barrel file typescript, index.ts 统一导出, tree shaking, tree shaking 失效, nextjs optimizePackageImports, next.js 开发服务器慢, tsc 内存占用, typescript 循环依赖, cannot access before initialization, preserveModules, sideEffects false, javascript 打包体积, es modules re-export]
image: /img/og.png
---

# 桶文件（Barrel Files）：index.ts 统一导出如何拖垮 Tree Shaking、Next.js 开发内存和 tsc (2026)

桶文件（barrel file）是一个只做一件事的 `index.ts`：把其他模块重新导出，让使用方可以写一条整洁的 import 而不是五条。几乎每个 TypeScript 代码库都有它；几乎每个 npm 库都拿它做入口。它看起来是免费的代码组织手段——多年来整个生态也一直这么认为。

但它并不免费。现代 React 开发中最常见的三类性能抱怨，背后都悄悄站着桶文件：打包结果不像你预期的那样被 tree-shake、Next.js 开发服务器和 `tsc` 随着应用增长越来越慢越来越吃内存、还有以 `Cannot access 'X' before initialization` 现身的循环依赖 bug。我们维护着 [`@reactuses/core`](https://reactuse.com)——一个 120+ React hooks 全部躲在一个桶文件后面的库——最近正因为它被迫重建了整个 `dist` 结构：一个只 import 一个 hook 的 Next.js 开发页面，客户端 chunk 高达 **552 kB**，修好桶文件后降到 **64 kB**。这篇文章讲清这三个问题背后的机制，以及 `node_modules` 边界两侧各自该怎么办。

<!-- truncate -->

## 什么是桶文件？

桶文件把一个目录的公开接口收拢进一个模块：

```ts
// src/hooks/index.ts —— 所谓的"桶"
export * from './useAuth';
export * from './useCart';
export * from './useCheckout';
export * from './useAnalytics';
// …还有四十个
```

使用方从目录导入，而不是从具体文件：

```ts
import { useAuth } from '@/hooks';        // 走桶文件
// 而不是
import { useAuth } from '@/hooks/useAuth'; // 直接导入
```

发布到 npm 的库在包级别做同样的事：`react-use`、`lodash-es`、`@mui/material`、`date-fns`——对，还有 `@reactuses/core`——的 `main`/`exports` 入口都是一个把全部公开模块重新导出的桶。一个 import 说明符、一个自动补全命名空间、一处定义公开 API。这就是它的吸引力。

代价来自一个容易被遗忘的事实：**模块导入不是符号查找，而是图遍历。** 任何运行时或工具——打包器、Node、`tsc`、TS language server——在解析 `import { useAuth } from '@/hooks'` 时，都必须加载桶文件，而桶文件的内容说的是"把我全部四十四个孩子都求值一遍"。导入一个符号变成了导入所有东西，以及这些东西传递导入的所有东西。本文的每个问题，都是这一句话换了套衣服。

## 危害一：Tree Shaking 变脆（甚至悄悄失效）

Tree shaking 是由 ES 模块的静态结构驱动的死代码消除：打包器构建完整模块图，标记哪些导出真正被用到，丢掉其余的。理论上桶文件对它是透明的——`export *` 可静态分析，一个好的打包器能顺着桶追踪到 `useAuth` 的所属模块，丢弃它的兄弟们。

实践中，这套理论有前提条件，而桶文件正是这些条件的坟场：

**副作用会毒化整个桶。** 打包器只有在"丢掉某个模块不可被观察到"时才能丢它。只要桶里有*一个*模块跑了顶层代码——改了全局对象、注册了 custom element、调用了 `injectGlobalStyles()`、甚至只是构造了一个打包器无法证明纯净的 `Map`——打包器就必须保留它，连同它导入的一切。`package.json` 里的 `sideEffects: false` 是库作者做出的承诺，让打包器可以跳过这套分析；忘了写（或写错），一个 200 模块的桶就会被悲观打包。一个不守规矩的模块会向其他所有模块的所有使用者征税，因为桶把它们的命运绑在了一起。

**CommonJS 输出直接关掉 tree shaking。** Tree shaking 依赖 ESM 静态的 `import`/`export`。如果你的包入口解析到 CJS（老的 `main` 字段、配错的 `exports` map、被工具转译成 `require` 的 ESM），打包器看到的就是对 `module.exports` 的动态属性访问，只能全部保留。一个 120 个 hooks 的 CJS 桶*就是*你的 bundle，不管你导入了什么。

**转译器产物会击败纯度分析。** class fields、装饰器、`enum` 常被编译成顶层 IIFE 和赋值语句，看起来有副作用。没有 `/*#__PURE__*/` 注解，打包器就会保留它们——而在桶里，"它们"指的是图里的每个模块，不只是你导入的那个。

**而且开发模式下这一切根本不会运行。** 这是最让人意外的部分：tree shaking 是*生产环境优化*。开发服务器——dev 模式的 webpack、Next.js dev、Vite 对预打包依赖的按需转换——不做 shaking。它们照原样解析并执行模块图。开发时通过桶导入一个 hook，意味着每次冷启动、每个碰到它的页面，都要加载、转换、求值整个库。这就引出了第二个危害。

## 危害二：Next.js 开发和 tsc 为整张图买单——时间和内存

下面是逼我们重建 dist 的那次测量。一个 Next.js App Router 页面，开发模式，只导入一个 hook：

```tsx
'use client';
import { useDebounce } from '@reactuses/core';
```

这个页面的开发模式客户端 chunk：**552 kB**。不是因为 `useDebounce` 大——它就是包着 `setTimeout` 的几百字节——而是因为包入口是个桶，而开发模式不做 shaking，于是页面编译并加载了全部 120+ hooks，包括那些拖着二维码生成、文件保存依赖的重量级 hook，页面根本没引用过它们。

把这个模式乘到一个真实应用上——几个组件库、一个图标包、一个日期库、你自己的 `@/components` 和 `@/utils` 桶——你就得到了那些很少被归因到 import 上的熟悉症状：

- **开发模式冷编译和路由切换慢。** Next.js 按需编译页面；页面导入图里的每个桶都会放大需要解析、转换、缓存的模块数量。每页多出几千个模块很常见。基于 webpack 的开发服务器还要把这些模块记录、转换后的源码和 source map 都留在内存里——这是人们抱怨的动辄几 GB 的 `next dev` 进程的一大来源，也是内存随着你访问更多路由不断上涨的原因。
- **`tsc` 的时间和内存随图而不是随你的代码扩张。** 类型检查器必须加载、绑定、检查从入口可达的每个文件。桶让*一切*都可达。哪怕只是对一个 hook 的纯类型引用，也要解析 120 个模块和它们的 `.d.ts` 依赖链。编辑器里的 TS language server 同理——"为什么 VS Code 在这个项目上要吃 4 GB"往往是个模块图问题，而桶就是图的扇出点。
- **测试启动也在买单。** Jest 和 Vitest 按测试文件解析 import。一个通过桶导入一个 helper 的单测会求值整个桶——这是"平凡的测试套件每个文件启动都要好几秒"的经典原因。

### `optimizePackageImports`——以及我们踩到的坑

Next.js 提供了直接的反制手段：[`optimizePackageImports`](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports)。把包列进去，编译器就会在构建时把桶导入改写为直接的按模块导入：

```ts
// 你写的
import { useDebounce } from '@reactuses/core';
// 编译器穿透桶，（概念上）生成
import { useDebounce } from '@reactuses/core/dist/useDebounce/index.mjs';
```

两全其美：源码里保持人体工学的导入写法，编译后的图里没有桶遍历。很多流行库（`lucide-react`、`@mui/icons-material`、`date-fns`……）都在默认列表里。

但有一个文档轻描淡写、却狠狠咬了我们一口的前提：**优化器只能把桶展开到真实存在的文件上。** 它的原理是静态分析包入口，把每个具名导出映射到定义它的真实模块文件。直到不久前，`@reactuses/core` 发布的 `dist` 还是一个*内联打包产物*——源码有按 hook 的文件，但构建工具（bunchee）把整个库编译成了单个 `index.mjs`。在优化器眼里，每个导出都定义在入口自身。无论使用方怎么配置，都无物可展开。桶只有是*薄*桶——纯粹的重新导出、指向真实的按模块文件、一路薄到 `dist`——才可被优化。

## 危害三：桶文件滋生循环依赖

第三个代价不是性能，是正确性。桶文件是循环导入进入代码库最常见的通道，因为它给每一条经过它的 import 都加了一条隐藏的边。

陷阱长这样：

```ts
// hooks/index.ts
export * from './useAuth';
export * from './useCart';

// hooks/useCart.ts —— 作者想用 useAuth，用"整洁的方式"导入
import { useAuth } from '.';   // ← 走了桶，而不是 './useAuth'

export function useCart() { const user = useAuth(); /* … */ }
```

循环出现了：`index.ts → useCart.ts → index.ts`。作者从没写过"useCart 依赖整个 hooks 目录"，但 import 说的就是这个——之后加进桶里的每个模块都会悄悄加入 useCart 的依赖图，反之亦然。自动导入让情况更糟：编辑器乐于从桶补全，循环在没人主动选择的情况下不断累积。

有时循环无害，你永远不会察觉。咬不咬人取决于*求值顺序*——运行时恰好先从哪个模块开始求值——而这恰恰是打包器、Node、Jest 之间会不一样的东西：

- **ESM**：import 是被提升的 live binding，所以互相递归的*函数*没问题——但在循环中途读取 `const`/箭头函数导出会抛出臭名昭著的 **`ReferenceError: Cannot access 'useAuth' before initialization`**（暂时性死区）。它通常只在某一个工具里出现（"Vite 里能跑，Jest 里就挂"），因为求值顺序不同。
- **CJS**：没有 TDZ，有更糟的——部分初始化的 `exports` 对象。循环中途的导入静默地变成 `undefined`，你会在*调用*时拿到 `TypeError: useAuth is not a function`，离真正的原因十万八千里；类则是 `extends undefined`。

循环还会悄悄削弱工具链：打包器无法对困在循环里的模块做代码分割（它们必须落进同一个 chunk），HMR 失效范围会沿着循环成员扩散，让开发更新变慢。图的问题和正确性的问题，是同一个问题。

## 该怎么做

### 应用代码里

1. **同包内部直接从模块导入，别走桶。** 这条规则同时防住图爆炸和循环：桶是给*外部*使用者的；内部代码直接导入兄弟模块（`./useAuth`，而不是 `.`）。用 lint 固化它：[`import/no-cycle`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md) 能抓循环（CI 里跑，物有所值），[`eslint-plugin-no-barrel-files`](https://github.com/art0rz/eslint-plugin-no-barrel-files) / `import/no-internal-modules` 可以从任一方向强制策略。
2. **质疑每个桶存在的必要性。** 收拢五个内聚文件的桶没问题。全应用级、300 个导出的 `components/index.ts` 是接在每个页面上的炸弹。如果桶存在只是为了让 import "好看"，TypeScript 路径别名（`@/components/Button`）能给你短导入，而没有任何图代价。
3. **Next.js 里把重型桶包列进 `optimizePackageImports`**——并且通过检查开发模式 chunk 大小验证它真的生效了，因为（如上所述）不是每个包发布的 dist 都可被优化。

### 作为库作者

这是我们这一侧的栅栏，也是 [#216](https://github.com/childrentime/reactuse/pull/216) 在 `@reactuses/core` 里改的东西：

1. **发布按模块的文件，而不是内联 bundle。** Rollup 术语叫 `preserveModules`；在 [tsdown](https://tsdown.dev) 里就是一个开关。我们的完整配置：

   ```ts
   // tsdown.config.ts
   import { defineConfig } from 'tsdown';

   export default defineConfig({
     entry: ['src/index.ts', 'src/useQRCode/index.ts'],
     format: ['esm', 'cjs'],
     dts: true,
     unbundle: true,   // 每个模块一个输出文件——入口保持为真正的桶
     target: 'es2015',
     platform: 'neutral',
   });
   ```

   现在 `dist` 与 `src` 镜像：`dist/useDebounce/index.mjs`、`dist/useLocalStorage/index.mjs`……`dist/index.mjs` 是货真价实的薄桶。（为此我们换了工具：bunchee 无法输出 unbundled 产物，我们试图用 120 个独立入口硬造时它直接 OOM。）

2. **在 `package.json` 里声明 `sideEffects: false`**——对 hooks 库来说是真的，也是对使用者 bundle 杠杆最高的一行。

3. **给 `exports` 加子路径通配符**，让想完全绕开桶的使用者可以绕开：

   ```json
   "./*": {
     "import": { "types": "./dist/*/index.d.mts", "default": "./dist/*/index.mjs" },
     "require": { "types": "./dist/*/index.d.ts", "default": "./dist/*/index.js" }
   }
   ```

   由此解锁零桶导入形式：`import { useDebounce } from '@reactuses/core/useDebounce'`。

**结果：** 同一个导入 [`useDebounce`](https://reactuse.com/state/usedebounce/) 的 Next.js 开发页面，从 552 kB 的 chunk（全部 hook，因为桶是内联 bundle）降到 64 kB（`useDebounce` 及其真实依赖链）——砍掉 88%，使用方代码一行未改。`optimizePackageImports` 终于有真实文件可以指了。

## 要点

- 桶文件把"导入一个东西"变成"遍历所有东西"。这就是它的全部成本模型；每个症状都由此而来。
- Tree shaking *可以*穿透桶，但前提是每个模块都无副作用、是 ESM、且声明了 `sideEffects`——而且它在开发模式下根本不运行，那里你要用编译时间和内存为整张图买单（Next.js dev、`tsc`、TS server、Jest 无一幸免）。
- 永远不要在包内部走自己的桶导入——循环就是这么开始的，而循环就是你在某个工具里看到 `Cannot access 'X' before initialization`、在另一个里却看不到的原因。
- 库作者：薄桶 + 按模块的 dist 文件 + `sideEffects: false` + 子路径 exports。这套组合才能让使用方的优化器（比如 `optimizePackageImports`）真正生效——单文件内联 dist 会让它们全部失效，哪怕你的源码结构完美无缺。

*`@reactuses/core` 提供 120+ SSR 安全、TypeScript 优先的 hooks——自 v6.5.0 起采用按模块 dist，你引入 [`useDebounce`](https://reactuse.com/state/usedebounce/) 时不用为其余 119 个买单。全部 hooks 见 [reactuse.com](https://reactuse.com)。*
