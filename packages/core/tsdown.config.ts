import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/useQRCode/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  // Emit one file per module (preserveModules) instead of a single bundle, so
  // the published entry stays a real barrel of re-exports. Next.js
  // optimizePackageImports and similar barrel-file optimizers can only unroll
  // imports when the underlying per-module files exist in dist.
  unbundle: true,
  target: 'es2015',
  platform: 'neutral',
})
