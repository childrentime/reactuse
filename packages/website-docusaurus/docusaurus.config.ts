import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "React Use",
  tagline: "Collection of essential React Hooks Utilities.",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://reactuse.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "berlin", // Usually your GitHub org/user name.
  projectName: "reactuse", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh-Hans"],
  },

  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      {
        // ... Your options.
        // `hashed` is recommended as long-term-cache of index file is possible.
        hashed: true,
        // For Docs using Chinese, The `language` is recommended to set to:
        // ```
        language: ["en", "zh"],
        // ```
      },
    ],
    "@docusaurus/theme-live-codeblock",
  ],
  plugins: ["./webpack.plugin.js"],
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/childrentime/reactuse/tree/main/packages/website-docusaurus",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
        gtag: {
          trackingID: 'G-3JKY4KFF7Y',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: "google-site-verification",
        content: "cYSXMQh7Yfm6rW16yR-5_x0jmMX_ABwMDwAoPPlPc1M",
      },
      {
        name: "msvalidate.01",
        content: "FCAB31FC7E191890AC6C3BC3A945596A",
      },
      {
        name: "baidu-site-verification",
        content: "code-WMH1e8oKID",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: "https://reactuse.com/",
      },
      {
        property: "og:title",
        content: "ReactUse Docs",
      },
      {
        property: "og:description",
        content: "Collection of essential React Hooks Utilities.",
      },
      {
        property: "description",
        content: "Collection of essential React Hooks Utilities.",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        property: "twitter:domain",
        content: "reactuse.com",
      },
      {
        property: "twitter:url",
        content: "https://www.reactuse.com/",
      },
      {
        property: "twitter:title",
        content: "ReactUse Docs",
      },
      {
        property: "twitter:description",
        content: "Collection of essential React Hooks Utilities.",
      },
    ],
    image: "img/og.png",
    navbar: {
      title: "React",
      items: [
        {
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/childrentime/reactuse/tree/main",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Get Started",
              to: "/",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Discord",
              href: "https://discord.gg/aMhGpqEe",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/wulianwen1",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} React Use, Inc. Built with Docusaurus. <a target="_blank" href="https://beian.miit.gov.cn/">备案号: 鄂ICP备2023017842号</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
