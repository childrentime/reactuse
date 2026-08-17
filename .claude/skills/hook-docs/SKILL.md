---
name: hook-docs
category: engineering
description: Write the Astro .mdx documentation for a hook (English + zh-Hans + zh-Hant), following the website-astro content schema and live-demo convention, then regenerate scripts/hook-registry.json. Triggers on "document this hook", "add docs for useXxx", "write the mdx", or after creating a new hook.
---

# hook-docs — document a hook the ReactUse way

Docs live in the Astro site `packages/website-astro`. The sidebar and routes are built
**automatically** from file paths — there is no `routes.json` or sidebar config to edit.

## File locations (one per locale)

```
packages/website-astro/src/content/docs/{category}/useX.mdx          # English
packages/website-astro/src/content/docs-zh-hans/{category}/useX.mdx  # 简体中文
packages/website-astro/src/content/docs-zh-hant/{category}/useX.mdx  # 繁體中文
```

`{category}` is one of: `browser`, `effect`, `element`, `state`, `integrations`. The folder
you choose **is** the category — it sets the registry entry and the canonical URL
(`https://reactuse.com/{category}/usex/`, lowercase).

## Frontmatter

Schema is in `packages/website-astro/src/content.config.ts` — only `title` is required;
`description`, `sidebar_label`, `sidebar_position` are optional. Match the existing style:

```yaml
---
title: useX – State Hook Usage & Examples
sidebar_label: useX
description: "useX is a React hook that … (one sentence, used as the meta description)."
---
```

## Body structure

Follow the established shape (see `content/docs/browser/useClipboard.mdx`):

```mdx
# useX

One-line summary of what it does.

A short paragraph explaining the hook, linking to the relevant MDN/spec page where useful.

### When to Use

- bullet of a concrete use case
- another

### Notes

- SSR safety / browser-support caveats
- any gotchas

## Usage

```tsx live
function Demo() {
  const [value, set] = useX(0);
  return <button onClick={() => set(value + 1)}>{value}</button>;
};
```

%%API%%
```

- The ` ```tsx live ` fence renders a live, editable demo. Write the demo **inline** — it is
  not imported from the hook's source.
- Keep `%%API%%` as the last line. It's replaced at build time with the generated API table
  (from the hook's `interface.ts` JSDoc); if no API doc exists yet it's silently removed.

## Translations

The zh-Hans / zh-Hant files mirror the English structure exactly — translate the prose and
the frontmatter `title`/`description`, keep the code demo identical.

zh-Hans → zh-Hant is not a pure character conversion; these terms differ:

| 简体 | 繁體 |     | 简体 | 繁體 |
|------|------|-----|------|------|
| 状态 | 狀態 |     | 默认 | 預設 |
| 函数 | 函數 |     | 设置 | 設定 |
| 参数 | 參數 |     | 获取 | 獲取 |
| 组件 | 組件 |     | 监听 | 監聽 |
| 类型 | 類型 |     | 处理 | 處理 |
| 数组 | 數組 |     | 实例 | 實例 |
| 对象 | 對象 |     | 管理 / 配置 | unchanged |

## After writing — regenerate the registry

```bash
bash scripts/generate-hook-registry.sh
```

This walks the English docs folder and rewrites `scripts/hook-registry.json`
(hookName → `{ category, url }`). Required so blog/doc links resolve correctly. Verify the
new hook appears with the right category and a **lowercase** URL.
