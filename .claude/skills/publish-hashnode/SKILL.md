---
name: publish-hashnode
category: blog
description: 把博客文章通过 GraphQL 发布到 Hashnode (reactuse.hashnode.dev)，自动设 originalArticleURL canonical 回 reactuse.com。当用户说"发到 hashnode"、"推送 hashnode"、"cross-post to hashnode"、"publish to hashnode"，或在写完/commit 了一篇新博客后说"发出去"、"同步发布"、"把这篇发了"、"publish the latest post"时触发。也在 `/publish` 类的工作流里作为多平台分发的一环。
---

# publish-hashnode — 跨发到 Hashnode

reactuse.com 的博客在 Hashnode 有镜像 `reactuse.hashnode.dev`。每篇新文章都应该同步过去：

- canonical URL 指回 reactuse.com（不抢 SEO 权重）
- Hashnode 流量是真实增量（独立 RSS/订阅用户）
- 一次 GraphQL 调用搞定，不需要任何手工操作

## 触发场景

1. 用户明说："发到 hashnode" / "publish to hashnode" / "把这篇 cross-post 一下"
2. 用户刚写完一篇博客，并说"发出去" / "同步发布" / "推平台"——默认包括 Hashnode
3. 多平台分发流程的一步（dev.to + Medium + Hashnode + 掘金）
4. 补发历史文章："把上一篇也发到 hashnode" / "把 post-N 那篇推到 hashnode"

⚠️ **不要触发**：
- 用户只让发 Medium / dev.to / 掘金 —— 不要顺手也发 Hashnode
- 用户说"草稿" / "draft" —— 当前脚本是直接发布，没有 draft 模式

## 工作流程

### 步骤 1：确认目标文章

优先级：
1. 用户给了具体 slug 或路径 → 用那个
2. 用户说"最新的" / "刚写的" / "上一篇" → 用 latest（脚本默认）
3. 不确定时用 `--dry-run` 先确认 title + slug + canonical

```bash
node scripts/publishHashnode.mjs --dry-run               # 预览最新一篇
node scripts/publishHashnode.mjs --dry-run <slug>        # 预览指定 slug
```

### 步骤 2：执行发布

```bash
node scripts/publishHashnode.mjs                         # 发最新
node scripts/publishHashnode.mjs <slug>                  # 发指定 slug
node scripts/publishHashnode.mjs path/to/post.md         # 发指定路径
```

成功输出：
```
✅ Published: https://reactuse.hashnode.dev/<slug>
```

### 步骤 3：验证（可选）

如果用户希望确认上线：
```bash
opencli browser open "https://reactuse.hashnode.dev/<slug>"
opencli browser screenshot /tmp/hashnode-post.png
```
（Hashnode 的页面对 curl 直接返回 403，要走 browser session 才能看到。）

## 脚本行为

`scripts/publishHashnode.mjs` 做的事：

1. 从 `packages/website-astro/src/content/blog/{date}-{slug}.md(x)` 读 frontmatter
2. 解析 `title` / `slug` / `description` / `tags` / `image`
3. 剥掉正文里的 `<!-- truncate -->` 标记
4. 把 tags 转成 Hashnode 要求的 `[{name, slug}]` 格式（slug 自动 kebab-case，最多 5 个）
5. 调 `publishPost` mutation，发到 publication `69fdadfb6fb09594bd2c7700`
6. canonical = `https://reactuse.com/blog/{slug}/`（注意结尾斜杠）
7. cover image = `image` 字段（自动加 `https://reactuse.com` 前缀，除非已是绝对 URL）

## Env 要求

`.env` 里需要：
```
HASHNODE_PAT=...                                # hashnode.com/settings/developer 生成
HASHNODE_PUBLICATION_ID=69fdadfb6fb09594bd2c7700  # 已写死也写在 .env
HASHNODE_PUBLICATION_HOST=reactuse.hashnode.dev   # 备用，PAT_ID 缺失时用
```

PAT 如果丢了，重新生成：
1. 打开 `https://hashnode.com/settings/developer`（要登录）
2. Generate new token
3. 拷贝出来更新 `.env`

## 输出格式

发完简要回报：

```
✅ Hashnode: <title>
   → https://reactuse.hashnode.dev/<slug>
   canonical 指回 reactuse.com/blog/<slug>/
```

失败时打印 GraphQL 错误详情 + 建议下一步（PAT 过期 / publicationId 错 / 标题超长 / 重复 slug 等）。

## 注意事项

- **Tags 上限 5 个**：超过会被截断（按 frontmatter 里出现的顺序）
- **Slug 重复**：同一 slug 重发会失败。先把 Hashnode 上的旧版本删掉，或用 `updatePost`（脚本目前不支持，要 update 就手动改脚本或在 Hashnode UI 修）
- **正文里的相对链接**：脚本不会改写。如果博客里有 `/state/useToggle/` 这种站内链接，在 Hashnode 上会变成相对当前 host —— 大多数情况下这就是 hashnode.dev/state/useToggle/ 的 404。如果博客大量用站内链接，发之前可以建议把它们替换成绝对 URL `https://reactuse.com/state/useToggle/`
- **Cover image**：用了 `image: /img/og.png` 会被自动展开成 `https://reactuse.com/img/og.png`，Hashnode 会去 fetch 这张图存到自己的 CDN
- **不要 ping IndexNow 给 Hashnode 的 URL**：IndexNow 是给 reactuse.com 自己的，hashnode.dev 不归我们管
