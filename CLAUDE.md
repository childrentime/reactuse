# ReactUse - Project Guidelines

## Project Overview

ReactUse is a collection of React hooks (`@reactuses/core`). The website is built with Astro (`packages/website-astro`).

## Development

```bash
pnpm install      # install dependencies
pnpm lint         # eslint
pnpm test         # vitest
```

## Website URL Structure

Hook documentation pages follow the pattern: `https://reactuse.com/{category}/{hookName}/`

Categories: `browser`, `effect`, `element`, `state`, `integrations`

**There is NO `/docs/` or `/hooks/` prefix.** The URL is derived directly from the file path under `packages/website-astro/src/content/docs/`.

## Blog Post Guidelines

### Writing blog posts

- Blog posts live in `packages/website-astro/src/content/blog/` (English), with translations in `blog-zh-hans/` and `blog-zh-hant/`.
- The legacy Docusaurus blog is at `packages/website-docusaurus/blog/`.

### Hook links in blog posts

When linking to hook documentation in blog posts, **always** use the hook registry at `scripts/hook-registry.json` as the source of truth for correct URLs.

**Rules:**
1. Only link to hooks that exist in `hook-registry.json`. Never invent hook names or guess URLs.
2. The URL format is `https://reactuse.com/{category}/{hookName}/` — no `/docs/` or `/hooks/` prefix.
3. Each hook belongs to exactly one category. Do not guess categories — look them up.

### Verification checklist (REQUIRED before committing blog posts)

After writing or editing a blog post, **you must verify all hook links**:

1. Extract every `reactuse.com` URL from the blog post.
2. For each URL, confirm the hook name and category exist in `scripts/hook-registry.json`.
3. If a hook does not exist in the registry, either remove the link or replace it with an existing hook.
4. Run this verification for all locale versions (en, zh-Hans, zh-Hant) of the post.
