---
title: "你不知道的 GEO：AI 可见性的原理、实践与取舍"
title_en: "You Didn't Know GEO: AI Visibility Principles, Practices, and Trade-offs"
author: Tw93 (@HiTw93)
source_url: https://tw93.fun/2026-05-01/ai-visibility.html
twitter_url: https://x.com/HiTw93/status/2050931710066565374
published: 2026-05-01
captured: 2026-05-06
language: zh-CN
tags: [GEO, AI-search, LLM, SEO, llms.txt, robots.txt, AI-visibility]
note: "本文档为基于公开文章的结构化整理，非逐字复刻；代码片段为原文 verbatim。"
---

# 你不知道的 GEO：AI 可见性的原理、实践与取舍

## TL;DR

- **值得花一小时**优化 AI 可见性，**不值得花一周**。
- 2025 上半年 AI 搜索同比 +527%，但仍 < 总流量 1%。当作品牌策略，不是流量主渠道。
- 让现有内容对 AI 更"可见"即可，不要投机取巧。
- JSON-LD、`/.well-known/ai.txt`、HTML 注释藏提示——**实测无效**。
- `llms.txt` + `llms-full.txt` + Markdown 路由 + Bing/IndexNow——**实测有效**。

---

## 1. 用 robots.txt 分清爬虫类型

### 1.1 五类 AI 爬虫

| 类别 | 代表 | 用途 | 建议 |
|---|---|---|---|
| 训练爬虫 | GPTBot, ClaudeBot, Meta-ExternalAgent, CCBot | 模型训练 | 屏蔽 |
| 搜索 / 检索 | OAI-SearchBot, Claude-SearchBot, PerplexityBot | 实时检索 | 放行 |
| 用户触发 | ChatGPT-User, Claude-User | 用户分享 URL 时触发 | 放行 |
| 退出标识 | Google-Extended, Applebot-Extended | 声明退出训练 | 表态 |
| 未声明 | Bytespider, Grok | 不表明身份 / 低规则遵守 | 屏蔽 |

### 1.2 robots.txt 配置示例

```
# Search & retrieval: allow
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# User-triggered: allow
User-agent: ChatGPT-User
Allow: /

User-agent: Claude-User
Allow: /

# Training: block
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

# Opt-out tokens
User-agent: Google-Extended
Disallow: /

# Undeclared: block
User-agent: Bytespider
Disallow: /
```

---

## 2. 写好 llms.txt 并让站点互相引用

### 2.1 llms.txt 是什么

- 类似 `robots.txt`，但专门给 AI 看。
- Markdown 格式，放在网站根目录。
- 已部署站点 84 万+，**实际采用率仅约 10%**。

### 2.2 格式示例

```
# Your Project Name

> One-line description of what this is.

## Links

- [Documentation](https://yoursite.com/docs)
- [GitHub](https://github.com/you/project)
- [Blog](https://yoursite.com/blog)

## About

Short paragraph explaining the project, its purpose,
key features, and what makes it different.
```

### 2.3 网状互引

让多个自有站点的 `llms.txt` **互相引用**，AI 爬虫从任意入口都能发现完整版图。

---

## 3. 提供完整版 llms-full.txt 与 Markdown 路由

| 文件 | 大小 | 访问量倍数 |
|---|---|---|
| `llms.txt` | 小，目录式 | 1× |
| `llms-full.txt` | 30–60 KB，完整内容 | 3–4× |

### Markdown 路由

通过 `<link>` 告知 AI 同一页面有 Markdown 精简版，**减少 ~80% token 消耗**：

```html
<link rel="alternate" type="text/markdown" href="/page.md" />
```

---

## 4. 去搜索平台登记

- **Google Search Console**：注册并提交 sitemap。
- **Bing Webmaster Tools**：驱动 Copilot / DuckDuckGo / Yahoo 的 AI 搜索。
- **IndexNow 协议**：主动通知索引更新。

---

## 5. 做一个专门给 AI 看的知识网页

作者实例：**Yobi**（取自日语「呼び」）。包含：

- `llms.txt` 概览
- 50 KB 的 `llms-full.txt`
- 每个项目独立页面
- 4 个 JSON API 端点：`profile`、`projects`、`blog`、`weekly`
- 实时 GitHub API 数据，**ISR 缓存 1 小时**

---

## 6. 给每个项目独立页面

- 每个项目自包含的 Markdown 文档：摘要、核心特性、竞品对比、使用场景。
- URL slug **用自然语言**（如 `/projects/pake`），引用率高于不透明 ID。

---

## 7. 把结构化数据镜像到主域名

- 子域名权重低，关键数据要镜像到主域。
- 实践：GitHub Action 每天凌晨把子站数据同步到博客仓库。

---

## 8. 试过但没用的方法（反模式）

| 反模式 | 失败原因 |
|---|---|
| `<meta name="ai-content-url">` / `<meta name="llms">` | 无规范支持 |
| `/.well-known/ai.txt` | 多个竞争提案，未被采纳 |
| HTML 注释里塞 AI 提示 | 解析器会剥掉注释 |
| User-Agent 嗅探返回不同内容 | 属于 cloaking，Google 会惩罚 |
| JSON-LD | 实测 LLM 当普通文本读，**不理解结构化语义** |

---

## 9. 研究数据

### 9.1 Princeton + IIT Delhi (KDD 2024)

| 手段 | AI 可见性提升 |
|---|---|
| 权威引用 | +115% |
| 直接引用可信来源 | +43% |
| 相关统计数据 | +33% |

### 9.2 yaojingang 的研究

- **具体性**：有真实数据 / 清晰定义 / 横向对比的页面，影响力比泛泛而谈高 **>50%**。
- **内容长度**：高引用页平均 **~2000 词、10+ 标题**；低引用页仅 170 词，**差距 10 倍以上**。最稳妥区间 **1000–3000 词**。
- **相关性**：页面 vs 用户问题是否同一件事，比所有机械 SEO 指标更重要。
- **平台差异**：
  - ChatGPT 引用少但深，**单条引用影响力 = Google 的 5×**。
  - Perplexity 广撒网。
- **内容类型**：官网 / 新闻 / 垂类占 80%；**百科 / 解释型页面影响力 = 新闻的 3×**。
- **语言分布**：英文占全球样本 **>83%**。
- **被检索 ≠ 被引用**：ChatGPT 检索的页面中**仅 15%** 进入最终回答。
- **第三方引用**：品牌被第三方域引用的概率是被自有域引用的 **6.5×**。

---

## 10. 重要警告

- **ChatGPT 引用归因不靠谱**：CJR 测试 200 条引用，**153 条部分 / 完全错误**。
- 不要被 AI SEO 工具的"分数"带跑。
- **删除与 About 重复的 FAQ**——重复内容反而有害。

---

## 11. 行动清单（约 1 小时）

- [ ] 配置 `robots.txt`（按第 1.2 节模板）
- [ ] 编写 `llms.txt` + `llms-full.txt`，多站互引
- [ ] 加 Markdown 路由 `<link rel="alternate" type="text/markdown">`
- [ ] 提交 sitemap 到 Google Search Console
- [ ] 注册 Bing Webmaster Tools，开启 IndexNow
- [ ] 几天后在 ChatGPT / Perplexity / Claude 搜自己名字 / 项目名，校验引用准确性

---

## 延伸阅读

1. https://arxiv.org/abs/2311.09735
2. https://github.com/yaojingang/geo-citation-lab
3. https://llmstxt.org/
4. https://ahrefs.com/blog/why-chatgpt-cites-pages/
5. https://www.convertmate.io/research/geo-benchmark-2026
6. https://evilmartians.com/chronicles/optimizing-content-for-ai-discovery
7. https://searchviu.com/en/how-llms-actually-use-schema-markup/
8. https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php
9. https://seranking.com/blog/llms-txt/
10. https://www.mintlify.com/blog/how-often-do-llms-visit-llms-txt
11. https://www.indexnow.org/documentation

---

**原文**：<https://tw93.fun/2026-05-01/ai-visibility.html>
**作者推文**：<https://x.com/HiTw93/status/2050931710066565374>
