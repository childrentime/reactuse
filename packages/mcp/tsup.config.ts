import { defineConfig } from 'tsup'
import { getHooksAsString } from './scripts/generateHooks'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  define: {
    __DEV__: process.env.NODE_ENV === 'development' ? 'true' : 'false',
    __ALL_HOOKS__: getHooksAsString(),
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
})
