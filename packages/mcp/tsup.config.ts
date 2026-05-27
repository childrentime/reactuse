import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'
import { getHooksAsString } from './scripts/generateHooks'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  define: {
    __DEV__: process.env.NODE_ENV === 'development' ? 'true' : 'false',
    __PKG_VERSION__: JSON.stringify(pkg.version),
    __ALL_HOOKS__: getHooksAsString(),
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
})
