---
name: ping-indexnow
category: seo
description: 通过 IndexNow 协议主动通知 Bing / Copilot / Yandex / Naver 重新抓取一批 URL。当用户说"ping indexnow"、"通知索引"、"提交到 indexnow"、"通知必应"，或在写完一篇博客后请求"通知搜索引擎更新"时触发；也用于一次性把全站推到 IndexNow（`--all`）。
---

# ping-indexnow — 主动推送 URL 到 IndexNow

reactuse.com 已在根目录托管 IndexNow key 文件 `fef79adedf094ebea713a5bc6584bc56.txt`。把任何 URL 通过 IndexNow API POST 一次，就能让 Bing/Copilot/Yandex/Naver 在数分钟内重新抓取——不用等下一轮自动 crawl。

## 触发场景

1. 用户提到 "ping indexnow / 通知索引 / 提交到必应 / push to indexnow"
2. 刚写完并 commit 了一篇博客（场景 = 通知收录）
3. 一次性"全站推送"——使用 `--all` 读取 `dist/sitemap-0.xml`

## 工作流程

### A. 单/多 URL 模式（增量）

适用：刚发布 1–N 篇文章后立即推送。

**步骤 1：确定要 ping 的 URL 列表**

优先来源（按优先级）：
1. 用户在消息里直接给的 URL
2. 最近一次 git commit 新增的 markdown 文件 → 推算线上 URL
3. 用户指定的 slug 列表

如果是从 git diff 推算 URL，规则：
- `packages/website-astro/src/content/blog/2026-XX-YY-{slug}.md(x)` → `https://reactuse.com/blog/{slug}/`（slug 取 frontmatter 里的 `slug` 字段；没有就用文件名去掉日期前缀）
- `packages/website-astro/src/content/blog-zh-hans/...` → `https://reactuse.com/zh-Hans/blog/{slug}/`
- `packages/website-astro/src/content/blog-zh-hant/...` → `https://reactuse.com/zh-Hant/blog/{slug}/`
- `packages/website-astro/src/content/docs/{category}/{name}.mdx` → `https://reactuse.com/{category}/{name}/`（保留原大小写；和 `scripts/hook-registry.json` 对齐）

读 frontmatter 确认 `slug` 字段比从文件名推断更可靠。

**步骤 2：执行 ping**

```bash
node scripts/pingIndexNow.mjs <url1> <url2> <url3>
```

预期输出：
```
POST https://api.indexnow.org/IndexNow (3 urls) -> 200 OK
```

非 2xx 响应需打印响应体，常见原因：
- `403`：key 文件不可访问（检查 https://reactuse.com/fef79adedf094ebea713a5bc6584bc56.txt）
- `422`：URL 格式不合法或不在 host 范围内
- `429`：触发速率限制，等几分钟重试

### B. 全量模式

适用：首次接入 IndexNow，或大改 sitemap 后。

**前置**：必须先 build 出最新 sitemap。

```bash
pnpm --filter website-astro run build
node scripts/pingIndexNow.mjs --all
```

会读 `packages/website-astro/dist/sitemap-0.xml` 里所有 `<loc>`，最多 10000 URL/请求。当前站点约 440 URL，单次请求即可。

## 输出格式

执行完报告：

```
IndexNow ping 完成

URLs: <数量>
样本: <第 1–3 个 URL>
响应: <HTTP 状态>
```

如果失败，列出原因 + 建议下一步（验证 key 文件 / 等待重试 / 检查 URL 是否已 deploy）。

## 注意事项

- IndexNow 只是"通知"，不是"立即收录"。Bing 通常 24 小时内重抓。
- 不要对没变动的 URL 重复 ping，会被降权。
- 新发布的 URL 必须先在线（Netlify deploy 完成）才有效——刚 push 完要等 1–2 分钟再 ping。
- key 是公开的（必须可在 https://reactuse.com/<key>.txt 访问），不算秘密；要轮换就生成新 key 文件、更新 `scripts/pingIndexNow.mjs` 默认值。
