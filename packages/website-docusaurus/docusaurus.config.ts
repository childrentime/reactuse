import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'ReactUse',
  tagline: '100+ Essential React Hooks - The React Equivalent of VueUse',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://reactuse.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'childrentime', // Usually your GitHub org/user name.
  projectName: 'reactuse', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hans', 'zh-Hant'],
    localeConfigs: {
      en: { label: 'English', htmlLang: 'en' },
      'zh-Hans': { label: '简体中文', htmlLang: 'zh-Hans' },
      'zh-Hant': { label: '繁體中文', htmlLang: 'zh-Hant' },
    },
  },

  themes: [
    '@docusaurus/theme-live-codeblock',
  ],
  plugins: ['./webpack.plugin.js'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/childrentime/reactuse/tree/main/packages/website-docusaurus',
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'ReactUse Blog',
          blogDescription: 'Tutorials, guides, and updates about React Hooks and the ReactUse library',
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-3JKY4KFF7Y',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],
  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ReactUse',
        url: 'https://reactuse.com',
        description: 'Collection of 100+ essential React Hooks with TypeScript support, tree-shaking, and SSR compatibility',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://reactuse.com/search/?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }),
    },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://8I3BLA6GDS-dsn.algolia.net', crossorigin: 'anonymous' },
    },
  ],
  trailingSlash: true,
  themeConfig: {
    // Algolia search configuration
    algolia: {
      appId: '8I3BLA6GDS',
      apiKey: 'd70ec992605c0048bc1301c882f4a2ec',
      indexName: 'reactuse',
      contextualSearch: true,
      searchParameters: {
        hitsPerPage: 10, // 每页显示的结果数量
      },
      searchPagePath: 'search',
    },
    colorMode: {
      respectPrefersColorScheme: true,
      disableSwitch: false,
      defaultMode: 'dark'
    },
    metadata: [
      {
        name: 'google-site-verification',
        content: 'cYSXMQh7Yfm6rW16yR-5_x0jmMX_ABwMDwAoPPlPc1M',
      },
      {
        name: 'msvalidate.01',
        content: 'FCAB31FC7E191890AC6C3BC3A945596A',
      },
      {
        name: 'baidu-site-verification',
        content: 'code-WMH1e8oKID',
      },
      {
        name: 'description',
        content: 'Collection of 100+ essential React Hooks with TypeScript support, tree-shaking, and SSR compatibility. The React equivalent of VueUse.',
      },
      {
        name: 'keywords',
        content: 'react hooks, custom hooks, react hook library, react utilities, useEffect, useState, typescript hooks, SSR hooks, reactuse, react use, browser hooks, state management hooks',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        property: 'twitter:domain',
        content: 'reactuse.com',
      },
      {
        name: 'twitter:site',
        content: '@wulianwen1',
      },
    ],
    image: 'img/og.png',
    navbar: {
      title: 'React',
      items: [
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://buymeacoffee.com/lianwenwu',
          label: 'Buy me a coffee',
          position: 'right',
        },
        {
          href: 'https://github.com/childrentime/reactuse/tree/main',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Get Started',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/aMhGpqEe',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/wulianwen1',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} React Use, Inc. Built with Docusaurus. <a target="_blank" href="https://beian.miit.gov.cn/">备案号鄂ICP备2023017842号</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
