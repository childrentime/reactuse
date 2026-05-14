# ReactUse - Project Guidelines

## Project Overview

ReactUse is a collection of React hooks (`@reactuses/core`). The website is built with Astro (`packages/website-astro`).

## Development

```bash
pnpm install      # install dependencies
pnpm lint         # eslint
pnpm test         # vitest
```

## SEO / 搜索数据分析

用 Google Search Console 数据做优化分析：`python3 scripts/gsc-report.py [天数]`。
输出概览、趋势、Top 关键词/页面，以及「临门一脚关键词」「高曝光低点击页面」两类优化机会。
配置、用法、优化打法见 `GSC.md`。

## Website URL Structure

Hook documentation pages follow the pattern: `https://reactuse.com/{category}/{hookname}/`

Categories: `browser`, `effect`, `element`, `state`, `integrations`

**There is NO `/docs/` or `/hooks/` prefix.** The URL is derived from the file path under `packages/website-astro/src/content/docs/`.

**URLs are all lowercase.** The file is `useGeolocation.mdx` but the canonical URL is `https://reactuse.com/browser/usegeolocation/` (lowercase). Never link to the camelCase form — it creates duplicate pages in Google's index. A Netlify edge function 301-redirects any camelCase path to lowercase as a safety net, but links should be lowercase at the source.

## Blog Post Guidelines

### Writing blog posts

- Blog posts live in `packages/website-astro/src/content/blog/` (English), with translations in `blog-zh-hans/` and `blog-zh-hant/`.
- The legacy Docusaurus blog is at `packages/website-docusaurus/blog/`.

### Hook links in blog posts

When linking to hook documentation in blog posts, **always** use the hook registry at `scripts/hook-registry.json` as the source of truth for correct URLs.

**Rules:**
1. Only link to hooks that exist in `hook-registry.json`. Never invent hook names or guess URLs.
2. Use the `url` field from the registry verbatim — it is already lowercase (`https://reactuse.com/{category}/{hookname}/`, no `/docs/` or `/hooks/` prefix). Never hand-build a camelCase URL.
3. Each hook belongs to exactly one category. Do not guess categories — look them up.

### Verification checklist (REQUIRED before committing blog posts)

After writing or editing a blog post, **you must verify all hook links**:

1. Extract every `reactuse.com` URL from the blog post.
2. For each URL, confirm the hook name and category exist in `scripts/hook-registry.json`.
3. If a hook does not exist in the registry, either remove the link or replace it with an existing hook.
4. Run this verification for all locale versions (en, zh-Hans, zh-Hant) of the post.

## External Blog Publishing

### Directory structure

External platform copies are stored in `blog-external/` with sequential numbering:

```
blog-external/
  post-N-{slug}/
    medium.md   # English, no frontmatter (for Medium push skill)
    devto.md    # English, with dev.to frontmatter (published: false)
    juejin.md   # Chinese (simplified), no frontmatter (user copies manually)
```

### Publishing workflow

After writing blog posts (3 locales in `packages/website-astro/src/content/`), always:

1. Create `blog-external/post-N-{slug}/` with `medium.md`, `devto.md`, `juejin.md`
2. **Only publish the first post** of each batch to all 4 platforms:
   - **Medium**: Use the `medium-push` skill with the `medium.md` file
   - **dev.to**: POST via API using `DEVTO_API_KEY` from `.env` (set `published: false` as draft)
   - **Hashnode**: Run `node scripts/publishHashnode.mjs` (publishes the latest post by default; pass a slug to target a specific post)
   - **Juejin (掘金)**: Tell user to copy from `juejin.md` (no API available)
3. The remaining posts are saved in `blog-external/` for future publishing

### dev.to API

```bash
curl -s -X POST https://dev.to/api/articles \
  -H "api-key: $DEVTO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"article": {"title": "...", "body_markdown": "...", "published": false, "tags": ["react","javascript","webdev","tutorial"]}}'
```

API key is in `.env` as `DEVTO_API_KEY`.

### Hashnode API

```bash
node scripts/publishHashnode.mjs                         # latest blog post
node scripts/publishHashnode.mjs <slug>                  # specific by slug
node scripts/publishHashnode.mjs --dry-run [slug]        # preview only
```

The script reads frontmatter from `packages/website-astro/src/content/blog/`, strips the `<!-- truncate -->` marker, and calls the Hashnode `publishPost` GraphQL mutation. It sets `originalArticleURL` to `https://reactuse.com/blog/{slug}/` so search engines treat reactuse.com as canonical.

Env vars (in `.env`):
- `HASHNODE_PAT` — from hashnode.com/settings/developer
- `HASHNODE_PUBLICATION_ID` — `69fdadfb6fb09594bd2c7700` (publication: reactuse.hashnode.dev)
