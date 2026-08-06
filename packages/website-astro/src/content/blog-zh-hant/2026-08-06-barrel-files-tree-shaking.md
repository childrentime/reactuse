---
title: "桶檔案（Barrel Files）：index.ts 統一匯出如何拖垮 Tree Shaking、Next.js 開發記憶體和 tsc (2026)"
description: "桶檔案的真實代價：脆弱的 tree shaking、Next.js 開發頁面為一個 import 拉進 552 kB、tsc 和 TS server 多解析上千個模組、以及以 'Cannot access before initialization' 現身的循環依賴。附 @reactuses/core 重建 dist 的真實前後資料，以及應用作者和函式庫作者兩側的修復方案。"
slug: barrel-files-tree-shaking
authors:
  - name: ReactUse Team
    url: https://github.com/childrentime
date: 2026-08-06
tags: [react, typescript, performance, bundling, tutorial]
keywords: [barrel files, 桶檔案, barrel file typescript, index.ts 統一匯出, tree shaking, tree shaking 失效, nextjs optimizePackageImports, next.js 開發伺服器慢, tsc 記憶體占用, typescript 循環依賴, cannot access before initialization, preserveModules, sideEffects false, javascript 打包體積, es modules re-export]
image: /img/og.png
---

# 桶檔案（Barrel Files）：index.ts 統一匯出如何拖垮 Tree Shaking、Next.js 開發記憶體和 tsc (2026)

桶檔案（barrel file）是一個只做一件事的 `index.ts`：把其他模組重新匯出，讓使用方可以寫一條整潔的 import 而不是五條。幾乎每個 TypeScript 程式碼庫都有它；幾乎每個 npm 函式庫都拿它當入口。它看起來是免費的程式碼組織手段——多年來整個生態也一直這麼認為。

但它並不免費。現代 React 開發中最常見的三類效能抱怨，背後都悄悄站著桶檔案：打包結果不像你預期的那樣被 tree-shake、Next.js 開發伺服器和 `tsc` 隨著應用成長越來越慢越來越吃記憶體、還有以 `Cannot access 'X' before initialization` 現身的循環依賴 bug。我們維護著 [`@reactuses/core`](https://reactuse.com)——一個 120+ React hooks 全部躲在一個桶檔案後面的函式庫——最近正因為它被迫重建了整個 `dist` 結構：一個只 import 一個 hook 的 Next.js 開發頁面，客戶端 chunk 高達 **552 kB**，修好桶檔案後降到 **64 kB**。這篇文章講清這三個問題背後的機制，以及 `node_modules` 邊界兩側各自該怎麼辦。

<!-- truncate -->

## 什麼是桶檔案？

桶檔案把一個目錄的公開介面收攏進一個模組：

```ts
// src/hooks/index.ts —— 所謂的「桶」
export * from './useAuth';
export * from './useCart';
export * from './useCheckout';
export * from './useAnalytics';
// …還有四十個
```

使用方從目錄匯入，而不是從具體檔案：

```ts
import { useAuth } from '@/hooks';        // 走桶檔案
// 而不是
import { useAuth } from '@/hooks/useAuth'; // 直接匯入
```

發佈到 npm 的函式庫在套件層級做同樣的事：`react-use`、`lodash-es`、`@mui/material`、`date-fns`——對，還有 `@reactuses/core`——的 `main`/`exports` 入口都是一個把全部公開模組重新匯出的桶。一個 import 說明符、一個自動補全命名空間、一處定義公開 API。這就是它的吸引力。

代價來自一個容易被遺忘的事實：**模組匯入不是符號查找，而是圖遍歷。** 任何執行時或工具——打包器、Node、`tsc`、TS language server——在解析 `import { useAuth } from '@/hooks'` 時，都必須載入桶檔案，而桶檔案的內容說的是「把我全部四十四個孩子都求值一遍」。匯入一個符號變成了匯入所有東西，以及這些東西遞移匯入的所有東西。本文的每個問題，都是這一句話換了套衣服。

## 危害一：Tree Shaking 變脆（甚至悄悄失效）

Tree shaking 是由 ES 模組的靜態結構驅動的死程式碼消除：打包器建構完整模組圖，標記哪些匯出真正被用到，丟掉其餘的。理論上桶檔案對它是透明的——`export *` 可靜態分析，一個好的打包器能順著桶追蹤到 `useAuth` 的所屬模組，丟棄它的兄弟們。

實務上，這套理論有前提條件，而桶檔案正是這些條件的墳場：

**副作用會毒化整個桶。** 打包器只有在「丟掉某個模組不可被觀察到」時才能丟它。只要桶裡有*一個*模組跑了頂層程式碼——改了全域物件、註冊了 custom element、呼叫了 `injectGlobalStyles()`、甚至只是建構了一個打包器無法證明純淨的 `Map`——打包器就必須保留它，連同它匯入的一切。`package.json` 裡的 `sideEffects: false` 是函式庫作者做出的承諾，讓打包器可以跳過這套分析；忘了寫（或寫錯），一個 200 模組的桶就會被悲觀打包。一個不守規矩的模組會向其他所有模組的所有使用者徵稅，因為桶把它們的命運綁在了一起。

**CommonJS 輸出直接關掉 tree shaking。** Tree shaking 依賴 ESM 靜態的 `import`/`export`。如果你的套件入口解析到 CJS（舊的 `main` 欄位、設定錯的 `exports` map、被工具轉譯成 `require` 的 ESM），打包器看到的就是對 `module.exports` 的動態屬性存取，只能全部保留。一個 120 個 hooks 的 CJS 桶*就是*你的 bundle，不管你匯入了什麼。

**轉譯器產物會擊敗純度分析。** class fields、裝飾器、`enum` 常被編譯成頂層 IIFE 和賦值語句，看起來有副作用。沒有 `/*#__PURE__*/` 註解，打包器就會保留它們——而在桶裡，「它們」指的是圖裡的每個模組，不只是你匯入的那個。

**而且開發模式下這一切根本不會執行。** 這是最讓人意外的部分：tree shaking 是*生產環境最佳化*。開發伺服器——dev 模式的 webpack、Next.js dev、Vite 對預打包依賴的隨需轉換——不做 shaking。它們照原樣解析並執行模組圖。開發時透過桶匯入一個 hook，意味著每次冷啟動、每個碰到它的頁面，都要載入、轉換、求值整個函式庫。這就引出了第二個危害。

## 危害二：Next.js 開發和 tsc 為整張圖買單——時間和記憶體

下面是逼我們重建 dist 的那次測量。一個 Next.js App Router 頁面，開發模式，只匯入一個 hook：

```tsx
'use client';
import { useDebounce } from '@reactuses/core';
```

這個頁面的開發模式客戶端 chunk：**552 kB**。不是因為 `useDebounce` 大——它就是包著 `setTimeout` 的幾百位元組——而是因為套件入口是個桶，而開發模式不做 shaking，於是頁面編譯並載入了全部 120+ hooks，包括那些拖著 QR code 產生、檔案儲存依賴的重量級 hook，頁面根本沒引用過它們。

把這個模式乘到一個真實應用上——幾個元件庫、一個圖示套件、一個日期函式庫、你自己的 `@/components` 和 `@/utils` 桶——你就得到了那些很少被歸因到 import 上的熟悉症狀：

- **開發模式冷編譯和路由切換慢。** Next.js 隨需編譯頁面；頁面匯入圖裡的每個桶都會放大需要解析、轉換、快取的模組數量。每頁多出幾千個模組很常見。基於 webpack 的開發伺服器還要把這些模組記錄、轉換後的原始碼和 source map 都留在記憶體裡——這是人們抱怨的動輒幾 GB 的 `next dev` 行程的一大來源，也是記憶體隨著你造訪更多路由不斷上漲的原因。
- **`tsc` 的時間和記憶體隨圖而不是隨你的程式碼擴張。** 型別檢查器必須載入、繫結、檢查從入口可達的每個檔案。桶讓*一切*都可達。哪怕只是對一個 hook 的純型別引用，也要解析 120 個模組和它們的 `.d.ts` 依賴鏈。編輯器裡的 TS language server 同理——「為什麼 VS Code 在這個專案上要吃 4 GB」往往是個模組圖問題，而桶就是圖的扇出點。
- **測試啟動也在買單。** Jest 和 Vitest 按測試檔案解析 import。一個透過桶匯入一個 helper 的單元測試會求值整個桶——這是「平凡的測試套件每個檔案啟動都要好幾秒」的經典原因。

### `optimizePackageImports`——以及我們踩到的坑

Next.js 提供了直接的反制手段：[`optimizePackageImports`](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports)。把套件列進去，編譯器就會在建置時把桶匯入改寫為直接的按模組匯入：

```ts
// 你寫的
import { useDebounce } from '@reactuses/core';
// 編譯器穿透桶，（概念上）產生
import { useDebounce } from '@reactuses/core/dist/useDebounce/index.mjs';
```

兩全其美：原始碼裡保持人體工學的匯入寫法，編譯後的圖裡沒有桶遍歷。很多流行函式庫（`lucide-react`、`@mui/icons-material`、`date-fns`……）都在預設清單裡。

但有一個文件輕描淡寫、卻狠狠咬了我們一口的前提：**最佳化器只能把桶展開到真實存在的檔案上。** 它的原理是靜態分析套件入口，把每個具名匯出對應到定義它的真實模組檔案。直到不久前，`@reactuses/core` 發佈的 `dist` 還是一個*內聯打包產物*——原始碼有按 hook 的檔案，但建置工具（bunchee）把整個函式庫編譯成了單一 `index.mjs`。在最佳化器眼裡，每個匯出都定義在入口自身。無論使用方怎麼設定，都無物可展開。桶只有是*薄*桶——純粹的重新匯出、指向真實的按模組檔案、一路薄到 `dist`——才可被最佳化。

## 危害三：桶檔案滋生循環依賴

第三個代價不是效能，是正確性。桶檔案是循環匯入進入程式碼庫最常見的通道，因為它給每一條經過它的 import 都加了一條隱藏的邊。

陷阱長這樣：

```ts
// hooks/index.ts
export * from './useAuth';
export * from './useCart';

// hooks/useCart.ts —— 作者想用 useAuth，用「整潔的方式」匯入
import { useAuth } from '.';   // ← 走了桶，而不是 './useAuth'

export function useCart() { const user = useAuth(); /* … */ }
```

循環出現了：`index.ts → useCart.ts → index.ts`。作者從沒寫過「useCart 依賴整個 hooks 目錄」，但 import 說的就是這個——之後加進桶裡的每個模組都會悄悄加入 useCart 的依賴圖，反之亦然。自動匯入讓情況更糟：編輯器樂於從桶補全，循環在沒人主動選擇的情況下不斷累積。

有時循環無害，你永遠不會察覺。咬不咬人取決於*求值順序*——執行時恰好先從哪個模組開始求值——而這恰恰是打包器、Node、Jest 之間會不一樣的東西：

- **ESM**：import 是被提升的 live binding，所以互相遞迴的*函式*沒問題——但在循環中途讀取 `const`/箭頭函式匯出會拋出臭名昭著的 **`ReferenceError: Cannot access 'useAuth' before initialization`**（暫時性死區）。它通常只在某一個工具裡出現（「Vite 裡能跑，Jest 裡就掛」），因為求值順序不同。
- **CJS**：沒有 TDZ，有更糟的——部分初始化的 `exports` 物件。循環中途的匯入靜默地變成 `undefined`，你會在*呼叫*時拿到 `TypeError: useAuth is not a function`，離真正的原因十萬八千里；類別則是 `extends undefined`。

循環還會悄悄削弱工具鏈：打包器無法對困在循環裡的模組做程式碼分割（它們必須落進同一個 chunk），HMR 失效範圍會沿著循環成員擴散，讓開發更新變慢。圖的問題和正確性的問題，是同一個問題。

## 該怎麼做

### 應用程式碼裡

1. **同套件內部直接從模組匯入，別走桶。** 這條規則同時防住圖爆炸和循環：桶是給*外部*使用者的；內部程式碼直接匯入兄弟模組（`./useAuth`，而不是 `.`）。用 lint 固化它：[`import/no-cycle`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md) 能抓循環（CI 裡跑，物有所值），[`eslint-plugin-no-barrel-files`](https://github.com/art0rz/eslint-plugin-no-barrel-files) / `import/no-internal-modules` 可以從任一方向強制策略。
2. **質疑每個桶存在的必要性。** 收攏五個內聚檔案的桶沒問題。全應用層級、300 個匯出的 `components/index.ts` 是接在每個頁面上的炸彈。如果桶存在只是為了讓 import「好看」，TypeScript 路徑別名（`@/components/Button`）能給你短匯入，而沒有任何圖代價。
3. **Next.js 裡把重型桶套件列進 `optimizePackageImports`**——並且透過檢查開發模式 chunk 大小驗證它真的生效了，因為（如上所述）不是每個套件發佈的 dist 都可被最佳化。

### 作為函式庫作者

這是我們這一側的柵欄，也是 [#216](https://github.com/childrentime/reactuse/pull/216) 在 `@reactuses/core` 裡改的東西：

1. **發佈按模組的檔案，而不是內聯 bundle。** Rollup 術語叫 `preserveModules`；在 [tsdown](https://tsdown.dev) 裡就是一個開關。我們的完整設定：

   ```ts
   // tsdown.config.ts
   import { defineConfig } from 'tsdown';

   export default defineConfig({
     entry: ['src/index.ts', 'src/useQRCode/index.ts'],
     format: ['esm', 'cjs'],
     dts: true,
     unbundle: true,   // 每個模組一個輸出檔案——入口保持為真正的桶
     target: 'es2015',
     platform: 'neutral',
   });
   ```

   現在 `dist` 與 `src` 鏡像：`dist/useDebounce/index.mjs`、`dist/useLocalStorage/index.mjs`……`dist/index.mjs` 是貨真價實的薄桶。（為此我們換了工具：bunchee 無法輸出 unbundled 產物，我們試圖用 120 個獨立入口硬造時它直接 OOM。）

2. **在 `package.json` 裡宣告 `sideEffects: false`**——對 hooks 函式庫來說是真的，也是對使用者 bundle 槓桿最高的一行。

3. **給 `exports` 加子路徑萬用字元**，讓想完全繞開桶的使用者可以繞開：

   ```json
   "./*": {
     "import": { "types": "./dist/*/index.d.mts", "default": "./dist/*/index.mjs" },
     "require": { "types": "./dist/*/index.d.ts", "default": "./dist/*/index.js" }
   }
   ```

   由此解鎖零桶匯入形式：`import { useDebounce } from '@reactuses/core/useDebounce'`。

**結果：** 同一個匯入 [`useDebounce`](https://reactuse.com/state/usedebounce/) 的 Next.js 開發頁面，從 552 kB 的 chunk（全部 hook，因為桶是內聯 bundle）降到 64 kB（`useDebounce` 及其真實依賴鏈）——砍掉 88%，使用方程式碼一行未改。`optimizePackageImports` 終於有真實檔案可以指了。

## 要點

- 桶檔案把「匯入一個東西」變成「遍歷所有東西」。這就是它的全部成本模型；每個症狀都由此而來。
- Tree shaking *可以*穿透桶，但前提是每個模組都無副作用、是 ESM、且宣告了 `sideEffects`——而且它在開發模式下根本不執行，那裡你要用編譯時間和記憶體為整張圖買單（Next.js dev、`tsc`、TS server、Jest 無一倖免）。
- 永遠不要在套件內部走自己的桶匯入——循環就是這麼開始的，而循環就是你在某個工具裡看到 `Cannot access 'X' before initialization`、在另一個裡卻看不到的原因。
- 函式庫作者：薄桶 + 按模組的 dist 檔案 + `sideEffects: false` + 子路徑 exports。這套組合才能讓使用者的最佳化器（比如 `optimizePackageImports`）真正生效——單檔案內聯 dist 會讓它們全部失效，哪怕你的原始碼結構完美無缺。

*`@reactuses/core` 提供 120+ SSR 安全、TypeScript 優先的 hooks——自 v6.5.0 起採用按模組 dist，你引入 [`useDebounce`](https://reactuse.com/state/usedebounce/) 時不用為其餘 119 個買單。全部 hooks 見 [reactuse.com](https://reactuse.com)。*
