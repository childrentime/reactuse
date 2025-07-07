// src/global.d.ts
declare global {
  const __DEV__: boolean
  const __ALL_HOOKS__: Array<{
    name: string
    category: string
    path: string
  }>
}

export {}
