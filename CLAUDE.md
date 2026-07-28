# ReactUse - Project Guidelines

## Project Overview

ReactUse is a collection of React hooks (`@reactuses/core`). The website is built with Astro (`packages/website-astro`).

## Development

```bash
pnpm install      # install dependencies
pnpm lint         # eslint
pnpm test         # vitest
```

## AI Agent System (`.claude/`)

This repo carries a small, Chromium-inspired AI agent system under `.claude/` — sized for a
hooks library, not a 35M-line codebase. Map: [`.claude/README.md`](.claude/README.md).

**Engineering workflow** (apply to any hook/code task):

1. **Understand first.** Read the real source of the files you'll touch — and at least one
   similar existing hook — before writing. Don't infer behavior from names.
2. **Build**, reusing what exists. This codebase has a shared util layer and strong
   conventions; reuse before writing. Browser APIs **must** be SSR-safe.
3. **Test.** Jest, co-located `index.spec.ts` (`pnpm --filter @reactuses/core test <name>`).
4. **Verify.** `pnpm lint` + tests green. Stay on task — no unrelated drive-by edits.

**Where to look:**

- [`.claude/knowledge-base.md`](.claude/knowledge-base.md) — task → file/utility router. **Start here**; it tells you which existing code already solves your task.
- [`.claude/api-design.md`](.claude/api-design.md) — the public-signature contract (naming, options object, return shape, SSR defaults). **Read before adding or changing any hook signature.**
- [`.claude/ai-policy.md`](.claude/ai-policy.md) — you own every line you ship; understand it before review.
- Skills (auto-activate): `new-hook`, `hook-test`, `hook-docs`, `pr-description`.
- Commands: `/new-hook`, `/pre-pr`, `/pr-desc`.

## Secrets (`.env`, gitignored)

`.env` holds API tokens — never commit (it is gitignored):

- `DEVTO_API_KEY` — dev.to publishing
- `HASHNODE_PAT` / `HASHNODE_PUBLICATION_ID` / `HASHNODE_PUBLICATION_HOST` — Hashnode publishing
- `NETLIFY_AUTH_TOKEN` — Netlify account PAT (DNS + site API). **reactuse.com DNS is Netlify-managed** (DNS zone under account `childrentime`). Use this token against `https://api.netlify.com/api/v1/dns_zones` to manage records — e.g. the `google-site-verification` TXT that verifies the `sc-domain:reactuse.com` GSC property (a domain property can only be verified by DNS TXT, not the `<meta>` tag in `BaseLayout.astro`).

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

### Writing blog post titles (SEO — for NEW posts only)

> **Why this exists** (2026-06 growth analysis): blog posts pull huge search **impressions**
> but near-zero **CTR** because they rank #9–17 with weak titles — e.g.
> `react-hooks-vs-vue-composables` had **13.8k impressions but 0.2% CTR**. Meanwhile hook
> **doc** pages that match `useX` queries convert at **9–44% CTR**, and the developers who
> actually star the repo are **English-speaking / international** (only ~7% China). The funnel
> to GitHub stars is: English search → reactuse.com → star. **Do NOT rewrite old posts — apply
> this only to new ones.**

Title rules, in priority order:

1. **Lead with the concrete searched term** — a specific hook name or exact phrase
   (`useDebounce`, `useLocalStorage`, `useIntersectionObserver`) in the first ~60 chars.
   Vague/clever titles earn impressions but no clicks.
2. **Target a keyword you're already near page 1 on.** Before writing, run
   `python3 scripts/gsc-report.py 90` and pick a "临门一脚" query (rank 4–15, impressions ≥50);
   write the post to own it. A great post ranking #9 on a brand-new keyword wins nothing.
3. **Match search intent, not cleverness** — use real query shapes: `How to …`, `… in React`,
   `X vs Y`, a year (`2026`), `… with TypeScript`.
4. **One post = one primary keyword.** The page must read as *the* answer to that one query.
5. **Add a click-earning differentiator** — specificity / the problem solved
   (e.g. `…(SSR-safe, TypeScript)`).
6. **Write English-first.** zh-Hans / zh-Hant are translations; English is the star driver.

Examples:
- ✅ `React useDebounce Hook: Debounce State & Callbacks (2026)`
- ✅ `useLocalStorage in React: SSR-Safe Persistent State`
- ❌ `React Hooks vs Vue Composables` (broad/abstract → 13.8k impressions, 0.2% CTR in reality)
- ❌ `Mastering Reactivity Patterns` (no searchable keyword)

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
    medium.md   # English, no frontmatter (publish-medium skill — pandoc→HTML→paste)
    devto.md    # English, with dev.to frontmatter (published: false)
    juejin.md   # Chinese (simplified), no frontmatter (publish-juejin skill)
```

### Publishing workflow

After writing blog posts (3 locales in `packages/website-astro/src/content/`), always:

1. Create `blog-external/post-N-{slug}/` with `medium.md`, `devto.md`, `juejin.md`
2. **Push the blog to GitHub FIRST.** The English cross-posts (Medium/Hashnode/dev.to)
   carry a `canonical_url` pointing at `reactuse.com/blog/<slug>/`. Commit + push the post so
   Netlify deploys the original *before* cross-posting — otherwise the canonical points at a 404.
   (Juejin is a zh-Hans translation on a standalone site, so it's not canonical-bound, but keep
   the same push-then-publish order.)
3. **Only publish the first post** of each batch to all 4 platforms — all three browser platforms
   go through `opencli` (same as `publish-hashnode`); the user just needs to be logged in to each
   in the opencli-controlled Chrome:
   - **Medium**: Use the `publish-medium` skill (opencli — pandoc converts the body to HTML, then a
     synthetic paste event injects it; Medium's editor doesn't parse raw markdown). Note: Medium's
     native editor has **no canonical field**, so this copy doesn't return SEO weight — it's reach only.
   - **dev.to**: POST via API using `DEVTO_API_KEY` from `.env` (set `published: false` as draft); requires a `User-Agent` header — Forem's edge rejects requests without one
   - **Hashnode**: Use the `publish-hashnode` skill (opencli browser automation). The old GraphQL script was deleted on 2026-05-18 after Hashnode moved the API to a paid + allow-list plan
   - **Juejin (掘金)**: Use the `publish-juejin` skill (opencli — ByteMD/CodeMirror editor takes markdown directly). Replaces the old "copy manually" step; there's still no public API
4. The remaining posts are saved in `blog-external/` for future publishing

### dev.to API

```bash
curl -s -X POST https://dev.to/api/articles \
  -H "api-key: $DEVTO_API_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: reactuse-blog-publisher/1.0" \
  -d '{"article": {"title": "...", "body_markdown": "...", "published": false, "tags": ["react","javascript","webdev","tutorial"], "canonical_url": "https://reactuse.com/blog/<slug>/"}}'
```

API key is in `.env` as `DEVTO_API_KEY`. Without a `User-Agent` header, Forem's Varnish edge returns 403 with an empty body.
