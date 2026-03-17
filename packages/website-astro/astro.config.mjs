import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import remarkDirective from 'remark-directive'
import { remarkLiveCode } from './src/plugins/remark-live-code.mjs'
import { remarkApiInject } from './src/plugins/remark-api-inject.mjs'
import { remarkAdmonitions } from './src/plugins/remark-admonitions.mjs'

export default defineConfig({
  site: 'https://reactuse.com',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hans', 'zh-Hant'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          "zh-Hans": "zh-Hans",
          "zh-Hant": "zh-Hant",
        },
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkDirective, remarkAdmonitions, remarkLiveCode, remarkApiInject],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
})
