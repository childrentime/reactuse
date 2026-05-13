---
name: publish-hashnode
category: blog
description: 把博客文章发布到 Hashnode (reactuse.hashnode.dev)，canonical URL 指回 reactuse.com。默认走 opencli 浏览器自动化（GraphQL API 已转付费）。当用户说"发到 hashnode"、"推送 hashnode"、"cross-post to hashnode"、"publish to hashnode"，或在写完/commit 了一篇新博客后说"发出去"、"同步发布"、"把这篇发了"、"publish the latest post"时触发。也在 `/publish` 类的工作流里作为多平台分发的一环。
---

# publish-hashnode — 跨发到 Hashnode

reactuse.com 的博客在 Hashnode 有镜像 `reactuse.hashnode.dev`。每篇新文章都应该同步过去：

- canonical URL 指回 reactuse.com（不抢 SEO 权重）
- Hashnode 流量是真实增量（独立 RSS/订阅用户）

## ⚠️ 2026-05-13 之后：API 已付费，默认走浏览器

Hashnode 在 2026-05-13 把 GraphQL API 转成了付费 + allow-list 制（参见 https://hashnode.com/announcements/graphql-api）。`scripts/publishHashnode.mjs` 在 `reactuse.hashnode.dev` 没被加白之前会失败，`gql.hashnode.com` 直接 301 重定向到公告页。

**默认路径**：用 `opencli browser` 自动化网页编辑器。已经在 2026-05-13 验证过整条流程跑通。
**降级路径**：如果哪天我们付了费拿到 allow-list，再走 `node scripts/publishHashnode.mjs`（流程见末尾"API 路径（暂不可用）"）。

## 触发场景

1. 用户明说："发到 hashnode" / "publish to hashnode" / "把这篇 cross-post 一下"
2. 用户刚写完一篇博客，并说"发出去" / "同步发布" / "推平台"——默认包括 Hashnode
3. 多平台分发流程的一步（dev.to + Medium + Hashnode + 掘金）
4. 补发历史文章："把上一篇也发到 hashnode" / "把 post-N 那篇推到 hashnode"

⚠️ **不要触发**：
- 用户只让发 Medium / dev.to / 掘金 —— 不要顺手也发 Hashnode
- 用户说"草稿" / "draft" —— 网页流程默认是直接 Publish，要 draft 留草稿就不要点最后那下 Publish

## 前置检查

```bash
opencli --version                    # 需要 ≥ 1.7.18（1.7.14 有 connectivity bug）
opencli doctor                       # 必须看到 Connectivity: connected
```

如果是 1.7.14：`npm install -g @jackwener/opencli` 然后 `opencli daemon restart`。

如果 `Connectivity: failed (operation aborted)`：让用户把 Chrome 切到前台、点一下 opencli 扩展图标唤醒 service worker，再 `opencli doctor`。

## 工作流程（opencli 路径）

### 步骤 1：确认目标文章 + 提取元数据

```bash
ls packages/website-astro/src/content/blog/ | tail -3                    # 看最新一批
```

从 `packages/website-astro/src/content/blog/{date}-{slug}.md` 的 frontmatter 拿到：
- `title` — 文章标题
- `slug` — 用作 Hashnode 的 URL 段，也用来拼 canonical
- `tags` — 前 3 个用作 Hashnode tag（Hashnode tag 必须是已存在的，要从下拉里挑）

canonical URL = `https://reactuse.com/blog/{slug}/`（**结尾斜杠必加**）

### 步骤 2：到草稿编辑器

**坑点：不要 open `https://hashnode.com/new`** —— 会被 Hashnode 解析成用户名 `@new`（确实有这个用户）。

正确路径：

```bash
opencli browser --session default open "https://hashnode.com/drafts"
opencli browser --session default state                                  # 看页面
# 找到 [N]<button><span>New</span></button>，N 是 ref 编号
opencli browser --session default click <N>                              # 进新草稿
opencli browser --session default get url                                # 应是 /draft/<id>
```

如果第一次跑 Write 按钮（侧边栏的）跳到了 "Draft is being edited"，那是别的标签页或之前的会话占着锁。先 click "Back to Drafts"，再点 New 建一份新的。

### 步骤 3：切到 Markdown 模式

Hashnode 默认是 ProseMirror 富文本，对 markdown 不友好。切 markdown：

```bash
opencli browser --session default state                                  # 找标题栏右上角的下拉按钮 ref（旁边是 "AI" 和 "Publish"）
opencli browser --session default click <dropdown-ref>                   # 弹出菜单：See preview / Markdown / Copy markdown / Version history
opencli browser --session default state                                  # 找 "Markdown" menuitem 的 ref
opencli browser --session default click <markdown-menuitem-ref>
```

切完后 state 里应该有：
- `<textarea placeholder=Article Title... />`（标题）
- `<textarea placeholder=Start writing markdown... />`（正文）
- 旁边一对 `<button>Write</button>` / `<button>Preview</button>`

### 步骤 4：填标题 + 正文

```bash
opencli browser --session default fill <title-textarea-ref> "<title>"

# 正文用 shell 变量传整个 markdown 文件
MD="$(cat blog-external/post-N-<slug>/medium.md)"     # 或直接读 blog 源文件，剥掉 frontmatter + <!-- truncate -->
opencli browser --session default fill <body-textarea-ref> "$MD"
```

> 注：用 `blog-external/post-N-*/medium.md` 最稳，它已经剥掉了 frontmatter 和 truncate 标记。
> 如果还没建外部副本，直接拿源文件用 python 剥：
> ```bash
> python3 -c "import re,sys; s=open('<file>').read(); print(re.sub(r'<!-- truncate -->\\n?','', re.sub(r'^---.*?\\n---\\n','',s,1,re.DOTALL)))"
> ```

fill 返回 `"verified": true` 表示设进去了；正文一般 10-20KB，shell 变量传值没问题。

### 步骤 5：点 Publish 打开发布设置弹窗

```bash
# 找 <button>Publish</button> 的 ref（页面里可能有两个，点任一都行）
opencli browser --session default click <publish-ref>
opencli browser --session default state                                  # 弹窗：Draft settings
```

弹窗有 4 个 tab：Attribution / Discovery / Scheduling / Visibility。Attribution 默认就好（publication = "ReactUse Blog"）。

### 步骤 6：Discovery tab —— 改 slug、加 tags、设 canonical

```bash
opencli browser --session default click <Discovery-tab-ref>
```

**6a. 改 slug**

默认 slug 是从 title 长长地生成的。改成 frontmatter 里的短 slug：

```bash
opencli browser --session default click <Edit-button-ref>                # slug 行的 Edit 按钮
opencli browser --session default fill <slug-input-ref> "<short-slug>"
opencli browser --session default click <Save-button-ref>
```

**6b. 加 tags（前 3 个）**

Hashnode tag 必须是已存在的——自由输入会让 publish 卡住。type 进去后从自动补全选最热门那个（顶上一条，posts 数最高）：

```bash
opencli browser --session default type <tags-input-ref> "react"
opencli browser --session default get text <first-dropdown-ref>          # 应是 "#reactjs..." 或 "#react..."
opencli browser --session default click <first-dropdown-ref>             # 选第一项
```

ReactUse 博客常用 3 个：`react`、`javascript`、`web-development`（点 `webdev` 也行，看下拉）。

**6c. canonical URL**

```bash
opencli browser --session default click <canonical-checkbox-ref>          # "Add a canonical URL"
opencli browser --session default state                                   # 找新出现的 <input placeholder=https://example.com/original-article />
opencli browser --session default fill <canonical-input-ref> "https://reactuse.com/blog/<slug>/"
```

### 步骤 7：Publish

```bash
opencli browser --session default state                                   # 找 <button>Publish</button>（弹窗底部，不是 "Submit for Review"）
opencli browser --session default click <publish-final-ref>
sleep 2
opencli browser --session default get url                                 # 应跳到 /edit/<cuid>，title 前面带 [Edit]
```

URL 进了 `/edit/<id>` 就是发出去了。

### 步骤 8：验证

```bash
opencli browser --session default open "https://reactuse.hashnode.dev/<slug>"
opencli browser --session default get title                               # 应是文章标题
opencli browser --session default get url                                 # 应是 reactuse.hashnode.dev/<slug>
```

`curl` 直接打 reactuse.hashnode.dev 会被 Cloudflare bot challenge 拦（HTTP 403），必须走浏览器 session。

## 输出格式

发完简要回报：

```
✅ Hashnode: <title>
   → https://reactuse.hashnode.dev/<slug>
   canonical 指回 reactuse.com/blog/<slug>/
```

失败时附上最后一次 `state` 的关键片段 + 建议下一步（slug 重复、tag 没选成、canonical 没填、Cloudflare 拦截等）。

## 常见踩坑

- **`https://hashnode.com/new` 是用户名陷阱** —— 走 `/drafts` 然后点 New
- **"Draft is being edited"** —— 其它标签页/session 占着，点 Back to Drafts 重开一份
- **Markdown 模式藏得很深** —— 草稿页右上角的下拉里（不是设置）
- **Tag 必须从下拉选** —— 自由输入的 tag publish 会卡，必须有 `aria-haspopup` 的下拉里挑现成的
- **Slug 重复发不了** —— 同一 slug 第二次 publish 会失败。要么先在 Hashnode UI 删旧的，要么改 slug 加后缀
- **本地 DNS 给 `gql.hashnode.com` NXDOMAIN** —— 有些路由器/DNS 服务对它有污染。浏览器走 `hashnode.com` 主域不受影响，可以无视
- **正文里的相对链接** —— `[useToggle](/state/useToggle/)` 这种到 Hashnode 上会指到 hashnode.dev 自己。如果博客大量用站内链接，发之前 sed 把它们替换成 `https://reactuse.com/state/useToggle/`
- **opencli ref 编号每次 state 都会变** —— 每步前重新 `state` 拿当前 ref，不要复用上一步的编号
- **interactive 数量 > 80 时 state 可能截断** —— 用 `python3` 解析 JSON.data 拿完整字符串，或在响应里 grep 关键字

## API 路径（暂不可用）

如果将来 `reactuse.hashnode.dev` 被 Hashnode 加白了，老脚本路径还在：

```bash
node scripts/publishHashnode.mjs --dry-run               # 预览最新一篇
node scripts/publishHashnode.mjs                         # 发最新
node scripts/publishHashnode.mjs <slug>                  # 发指定 slug
node scripts/publishHashnode.mjs path/to/post.md         # 发指定路径
```

env：`.env` 里 `HASHNODE_PAT` + `HASHNODE_PUBLICATION_ID=69fdadfb6fb09594bd2c7700`。失败一般是：

- `fetch failed` —— `gql.hashnode.com` 域名问题（DNS 污染或 API 还没加白）
- `Unauthorized` —— PAT 过期，去 `https://hashnode.com/settings/developer` 重新生成
- `slug already exists` —— 改 slug 或先删旧文章

每次试 API 之前先：

```bash
curl -sI -m 5 --resolve gql.hashnode.com:443:104.26.12.250 https://gql.hashnode.com | head -3
```

如果还在 301 到 `/announcements/graphql-api`，就老老实实走浏览器。

## 注意事项

- **Tags 上限 3 个**（之前 API 是 5 个，但 UI 流程下 3 个是常见上限且更精准）
- **Cover image** 现在浏览器流程不自动处理；如果文章 frontmatter 里有 `image: /img/og.png`，发完后到 Hashnode UI 上传 `https://reactuse.com/img/og.png`，或在 step 6 的 Discovery tab 用 `editor-og-image` 那个 file input
- **不要 ping IndexNow 给 Hashnode 的 URL** —— IndexNow 是给 reactuse.com 自己的，hashnode.dev 不归我们管
