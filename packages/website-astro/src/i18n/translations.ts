export const locales = ['en', 'zh-Hans', 'zh-Hant'] as const
export type Locale = (typeof locales)[number]

export const localeLabels: Record<Locale, string> = {
  'en': 'English',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
}

const ui: Record<Locale, Record<string, string>> = {
  'en': {
    'nav.coffee': 'Buy me a coffee',
    'nav.blog': 'Blog',
    'nav.github': 'GitHub',
    'footer.built': 'Built with',
    'sidebar.state': 'State',
    'sidebar.effect': 'Effect',
    'sidebar.element': 'Element',
    'sidebar.browser': 'Browser',
    'sidebar.integrations': 'Integrations',
    'blog.title': 'Blog',
    'blog.description': 'ReactUse Blog - Articles about React hooks and best practices',
  },
  'zh-Hans': {
    'nav.coffee': 'Buy me a coffee',
    'nav.blog': '博客',
    'nav.github': 'GitHub',
    'footer.built': '使用',
    'sidebar.state': '状态',
    'sidebar.effect': '副作用',
    'sidebar.element': '元素',
    'sidebar.browser': '浏览器',
    'sidebar.integrations': '集成',
    'blog.title': '博客',
    'blog.description': 'ReactUse 博客 - 关于 React Hooks 的文章和最佳实践',
  },
  'zh-Hant': {
    'nav.coffee': 'Buy me a coffee',
    'nav.blog': '部落格',
    'nav.github': 'GitHub',
    'footer.built': '使用',
    'sidebar.state': '狀態',
    'sidebar.effect': '副作用',
    'sidebar.element': '元素',
    'sidebar.browser': '瀏覽器',
    'sidebar.integrations': '整合',
    'blog.title': '部落格',
    'blog.description': 'ReactUse 部落格 - 關於 React Hooks 的文章和最佳實踐',
  },
}

export function t(locale: Locale, key: string): string {
  return ui[locale]?.[key] ?? ui.en[key] ?? key
}

export function getLocaleFromUrl(url: URL): Locale {
  const seg = url.pathname.split('/')[1]
  if (seg === 'zh-Hans')
    return 'zh-Hans'
  if (seg === 'zh-Hant')
    return 'zh-Hant'
  return 'en'
}

export function getCollectionName(locale: Locale): string {
  if (locale === 'zh-Hans')
    return 'docs-zh-hans'
  if (locale === 'zh-Hant')
    return 'docs-zh-hant'
  return 'docs'
}

export function localePath(locale: Locale, path: string): string {
  if (locale === 'en')
    return path
  return `/${locale}${path}`
}
