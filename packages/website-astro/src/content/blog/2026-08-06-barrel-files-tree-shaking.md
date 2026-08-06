---
title: "Barrel Files: Why index.ts Re-Exports Hurt Tree Shaking, Next.js Dev Memory, and tsc (2026)"
description: "What barrel files actually cost: fragile tree shaking, a Next.js dev page pulling 552 kB for one import, tsc and TS server chewing through thousands of extra modules, and circular dependencies that surface as 'Cannot access before initialization'. With real before/after numbers from rebuilding @reactuses/core's dist, and fixes for both app authors and library authors."
slug: barrel-files-tree-shaking
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-06
tags: [react, typescript, performance, bundling, tutorial]
keywords: [barrel files, barrel file typescript, barrel file javascript, index.ts re-export, tree shaking, tree shaking not working, nextjs optimizePackageImports, next.js slow dev server, tsc out of memory, typescript circular dependency, cannot access before initialization, preserveModules, sideEffects false, javascript bundle size, es modules re-export]
image: /img/og.png
---

# Barrel Files: Why index.ts Re-Exports Hurt Tree Shaking, Next.js Dev Memory, and tsc (2026)

A barrel file is an `index.ts` whose only job is to re-export other modules, so consumers can write one tidy import instead of five. Almost every TypeScript codebase has them; almost every npm library ships one as its entry point. They look like free organization — and for years the ecosystem treated them that way.

They are not free. Barrel files are quietly behind three of the most common performance complaints in modern React development: bundles that don't tree-shake the way you expect, Next.js dev servers and `tsc` runs that get slower and hungrier as the app grows, and circular-dependency bugs that surface as `Cannot access 'X' before initialization`. We maintain [`@reactuses/core`](https://reactuse.com), a library of 120+ React hooks behind exactly one such barrel, and we recently had to rebuild our entire `dist` layout because of it — a Next.js dev page importing a single hook was pulling a **552 kB** client chunk that dropped to **64 kB** once the barrel was fixed. This post explains the mechanics behind all three problems and what to do about them, from both sides of the `node_modules` boundary.

<!-- truncate -->

## What Is a Barrel File?

A barrel file gathers a directory's public surface into one module:

```ts
// src/hooks/index.ts — the "barrel"
export * from './useAuth';
export * from './useCart';
export * from './useCheckout';
export * from './useAnalytics';
// …forty more
```

Consumers then import from the directory instead of the file:

```ts
import { useAuth } from '@/hooks';        // via the barrel
// instead of
import { useAuth } from '@/hooks/useAuth'; // direct
```

Published libraries do the same thing at package scale: the `main`/`exports` entry of `react-use`, `lodash-es`, `@mui/material`, `date-fns` — and yes, `@reactuses/core` — is a barrel that re-exports every public module. One import specifier, one autocomplete namespace, one place to define the public API. That's the appeal.

The cost comes from a fact that's easy to forget: **a module import is not a symbol lookup, it's a graph traversal.** When any runtime or tool — a bundler, Node, `tsc`, the TS language server — resolves `import { useAuth } from '@/hooks'`, it must load the barrel, and the barrel's body says "evaluate all forty-four of my children." The import of one symbol has become an import of everything, and everything those things import, transitively. Every problem in this post is that one sentence wearing a different costume.

## Harm #1: Tree Shaking Becomes Fragile (or Silently Impossible)

Tree shaking is dead-code elimination driven by the static structure of ES modules: the bundler builds the full module graph, marks which exports are actually used, and drops the rest. In theory a barrel is transparent to this — `export *` is statically analyzable, and a good bundler can trace `useAuth` through the barrel to its home module and discard the siblings.

In practice, the theory has conditions, and barrels are where they go to die:

**Side effects poison the whole barrel.** A bundler may only drop a module if doing so is unobservable. If *one* module in the barrel runs top-level code — patches a global, registers a custom element, calls `injectGlobalStyles()`, even constructs a `Map` the bundler can't prove pure — the bundler must keep it, along with anything it imports. The `sideEffects: false` field in `package.json` is the library author's promise that lets bundlers skip this analysis; forget it (or set it wrong) and a 200-module barrel is bundled pessimistically. One misbehaving module taxes every consumer of every other module, because the barrel wired their fates together.

**CommonJS output turns the shaking off entirely.** Tree shaking needs ESM's static `import`/`export`. If your package's entry resolves to CJS (an old `main` field, a misconfigured `exports` map, a tool that transpiled your ESM to `require` calls), the bundler sees dynamic property access on `module.exports` and keeps everything. A CJS barrel of 120 hooks *is* your bundle, whatever you imported.

**Transpiler artifacts defeat purity analysis.** Class fields, decorators, and `enum`s often compile to top-level IIFEs and assignments that look side-effectful. Without `/*#__PURE__*/` annotations, the bundler keeps them — and in a barrel, "them" means every module in the graph, not just the one you imported.

**And in dev mode, none of this runs anyway.** This is the part that surprises people: tree shaking is a *production optimization*. Dev servers — webpack in dev, Next.js dev, Vite's on-demand transform of a pre-bundled dependency — do not shake. They resolve and execute the graph as written. Importing one hook through a barrel in dev means loading, transforming, and evaluating the entire library, every cold start, on every page that touches it. Which brings us to the second harm.

## Harm #2: Next.js Dev and tsc Pay the Full Graph, in Time and Memory

Here is the measurement that forced our rebuild. A Next.js App Router page in dev mode, importing exactly one hook:

```tsx
'use client';
import { useDebounce } from '@reactuses/core';
```

The dev-mode client chunk for that page: **552 kB**. Not because `useDebounce` is big — it's a few hundred bytes around a `setTimeout` — but because the package entry was a barrel and dev mode doesn't shake, so the page compiled and shipped all 120+ hooks, including the heavyweight ones that drag in QR-code generation and file-saving dependencies the page never referenced.

Multiply this pattern across a real app — a few component libraries, an icon package, a date library, your own `@/components` and `@/utils` barrels — and you get the familiar symptoms that people rarely attribute to their imports:

- **Slow cold compiles and route transitions in dev.** Next.js compiles pages on demand; every barrel in a page's import graph multiplies the number of modules to resolve, transform, and cache. Thousands of extra modules per page is common. The webpack-based dev server also holds all of these module records, transformed source, and source maps in memory — this is a big slice of the multi-gigabyte `next dev` processes people complain about, and why memory climbs as you visit more routes.
- **`tsc` time and memory scale with the graph, not your code.** The type checker must load, bind, and check every file reachable from your entry points. Barrels make *everything* reachable. A type-only reference to one hook still parses 120 modules and their `.d.ts` dependency chains. The same applies to the TS language server in your editor — the "why does VS Code need 4 GB for this project" problem is very often a module-graph problem, and barrels are the graph's fan-out points.
- **Test startup pays it too.** Jest and Vitest resolve imports per test file. A unit test importing one helper through a barrel evaluates the whole barrel — a classic reason trivial test suites take seconds per file to boot.

### `optimizePackageImports` — and the catch we hit

Next.js ships a direct countermeasure: [`optimizePackageImports`](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports). Listing a package there makes the compiler rewrite barrel imports into direct per-module imports at build time:

```ts
// you write
import { useDebounce } from '@reactuses/core';
// the compiler resolves through the barrel and emits (conceptually)
import { useDebounce } from '@reactuses/core/dist/useDebounce/index.mjs';
```

Best of both: ergonomic imports in source, no barrel traversal in the compiled graph. Many popular libraries (`lucide-react`, `@mui/icons-material`, `date-fns`, …) are on the default list.

But there's a precondition the docs understate, and it's the one that bit us: **the optimizer can only unroll a barrel into files that actually exist.** It works by statically analyzing the package's entry and mapping each named export to the real module file that defines it. Until recently, `@reactuses/core`'s published `dist` was one *inlined bundle* — our source had per-hook files, but the build tool (bunchee) compiled the whole library into a single `index.mjs`. From the optimizer's perspective every export was defined in the entry itself. There was nothing to unroll, no matter what the consumer configured. A barrel is only optimizable if it's a *thin* barrel — pure re-exports over real per-module files — all the way into `dist`.

## Harm #3: Barrels Breed Circular Dependencies

The third cost isn't performance, it's correctness. Barrel files are the single most common way import cycles enter a codebase, because they add a hidden edge to every import that goes through them.

The trap looks like this:

```ts
// hooks/index.ts
export * from './useAuth';
export * from './useCart';

// hooks/useCart.ts — author wants useAuth, imports it "the tidy way"
import { useAuth } from '.';   // ← through the barrel, not './useAuth'

export function useCart() { const user = useAuth(); /* … */ }
```

The cycle is now `index.ts → useCart.ts → index.ts`. The author never wrote "useCart depends on the whole hooks directory," but that's what the import says — and every future module added to the barrel silently joins useCart's dependency graph, and vice versa. Auto-import makes this worse: editors happily complete from the barrel, so cycles accrete without anyone choosing them.

Sometimes the cycle is harmless and you never notice. Whether it bites depends on *evaluation order* — which module the runtime happens to start evaluating first — and that's exactly the kind of thing that differs between your bundler, Node, and Jest:

- **ESM**: imports are hoisted live bindings, so mutually recursive *functions* work — but a `const`/arrow-function export read during the cycle throws the infamous **`ReferenceError: Cannot access 'useAuth' before initialization`** (temporal dead zone). Typically it appears only in one tool ("works in Vite, dies in Jest") because evaluation order differs.
- **CJS**: no TDZ, something worse — the partially-initialized `exports` object. Mid-cycle imports are silently `undefined`, and you get `TypeError: useAuth is not a function` at *call* time, far from the actual cause, or `extends undefined` for classes.

Cycles also degrade tooling quietly: bundlers can't code-split modules locked in a cycle (they must land in the same chunk), and HMR invalidation spreads through cycle members, making dev updates slower. The graph problem and the correctness problem are the same problem.

## What To Do Instead

### In application code

1. **Import from the module, not the barrel, inside the same package.** The rule that prevents both the graph blowup and the cycles: barrels are for *external* consumers; internal code imports siblings directly (`./useAuth`, not `.`). Lint it: [`import/no-cycle`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md) catches the cycles (worth its cost in CI), and [`eslint-plugin-no-barrel-files`](https://github.com/art0rz/eslint-plugin-no-barrel-files) / `import/no-internal-modules` can enforce a policy either way.
2. **Question each barrel's existence.** A barrel that groups five cohesive files is fine. App-wide `components/index.ts` with 300 exports is a bomb wired to every page. If a barrel exists only so imports "look clean," TypeScript path aliases (`@/components/Button`) give you short imports with none of the graph cost.
3. **In Next.js, list heavy barrel packages in `optimizePackageImports`** — and verify it worked by checking the dev chunk size, because (as above) not every package ships an optimizable dist.

### As a library author

This is our side of the fence, and what [#216](https://github.com/childrentime/reactuse/pull/216) changed in `@reactuses/core`:

1. **Ship per-module files, not an inlined bundle.** In Rollup terms `preserveModules`; in [tsdown](https://tsdown.dev) it's one flag. Our whole config:

   ```ts
   // tsdown.config.ts
   import { defineConfig } from 'tsdown';

   export default defineConfig({
     entry: ['src/index.ts', 'src/useQRCode/index.ts'],
     format: ['esm', 'cjs'],
     dts: true,
     unbundle: true,   // one output file per module — the entry stays a real barrel
     target: 'es2015',
     platform: 'neutral',
   });
   ```

   `dist` now mirrors `src`: `dist/useDebounce/index.mjs`, `dist/useLocalStorage/index.mjs`, …, with `dist/index.mjs` a genuinely thin barrel of re-exports. (We switched tools to get this: bunchee couldn't emit unbundled output, and OOM'd when we tried to fake it with 120 separate entry points.)

2. **Declare `sideEffects: false`** in `package.json` — true for a hooks library, and the single highest-leverage line for your consumers' bundles.

3. **Add a subpath wildcard to `exports`**, so consumers who want to bypass the barrel entirely can:

   ```json
   "./*": {
     "import": { "types": "./dist/*/index.d.mts", "default": "./dist/*/index.mjs" },
     "require": { "types": "./dist/*/index.d.ts", "default": "./dist/*/index.js" }
   }
   ```

   Which enables the zero-barrel import form: `import { useDebounce } from '@reactuses/core/useDebounce'`.

**The result:** the same Next.js dev page importing [`useDebounce`](https://reactuse.com/state/usedebounce/) went from a 552 kB chunk (every hook, because the barrel was an inlined bundle) to 64 kB (`useDebounce` and its actual dependency chain) — an 88% cut, with no change to the consumer's code. `optimizePackageImports` finally had files to point at.

## Takeaways

- A barrel file converts "import one thing" into "traverse everything." That's its entire cost model; every symptom follows.
- Tree shaking *can* see through barrels, but only if every module is side-effect-clean, ESM, and `sideEffects` is declared — and it never runs in dev, where you pay the full graph in compile time and memory (Next.js dev, `tsc`, TS server, Jest alike).
- Never import through your own barrel from inside the package — that's how cycles start, and cycles are why you see `Cannot access 'X' before initialization` in one tool but not another.
- Library authors: thin barrel over per-module dist files, `sideEffects: false`, subpath exports. That combination is what makes consumers' optimizers (like `optimizePackageImports`) actually work — an inlined single-file dist defeats them even when your source layout is perfect.

*`@reactuses/core` ships 120+ SSR-safe, TypeScript-first hooks — since v6.5.0 with per-module dist, so you get [`useDebounce`](https://reactuse.com/state/usedebounce/) without paying for the other 119. Browse them at [reactuse.com](https://reactuse.com).*
