declare global {
  const __DEV__: boolean
  const __PKG_VERSION__: string
  const __ALL_HOOKS__: Array<{
    name: string
    category: string
    url: string
    description: string
    body: string
    api: string
  }>
}

export {}
