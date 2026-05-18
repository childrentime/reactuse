---
name: publish-hashnode
category: blog
description: 把博客文章发布到 Hashnode (reactuse.hashnode.dev)，canonical URL 指回 reactuse.com。默认走 opencli 浏览器自动化（GraphQL API 已转付费）。当用户说"发到 hashnode"、"推送 hashnode"、"cross-post to hashnode"、"publish to hashnode"，或在写完/commit 了一篇新博客后说"发出去"、"同步发布"、"把这篇发了"、"publish the latest post"时触发。也在 `/publish` 类的工作流里作为多平台分发的一环。
---

# publish-hashnode — 跨发到 Hashnode

reactuse.com 的博客在 Hashnode 有镜像 `reactuse.hashnode.dev`。每篇新文章都应该同步过去：

- canonical URL 指回 reactuse.com（不抢 SEO 权重）
- Hashnode 流量是真实增量（独立 RSS/订阅用户）

## ⚠️ 唯一路径：浏览器自动化

Hashnode 在 2026-05-13 把 GraphQL API 转成了付费 + allow-list 制（参见 https://hashnode.com/announcements/graphql-api），`reactuse.hashnode.dev` 没在白名单里。老的 `scripts/publishHashnode.mjs` 已经在 2026-05-18 删掉，**不要重写一个**；除非将来真的付费拿到 allow-list（届时再考虑），否则就老老实实走 `opencli` 浏览器路径。

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
opencli --version                    # 需要 ≥ 1.7.22（1.7.18 之前 `--session` 是 flag，1.7.22 改成了位置参数）
opencli doctor                       # 必须看到 Connectivity: connected
```

如果版本旧：`npm install -g @jackwener/opencli` 然后 `opencli daemon restart`。**注意 CLI 形态变化**：1.7.22+ 用 `opencli browser <session> <command>`（位置参数），旧版是 `opencli browser --session <session> <command>`。本 SKILL.md 的命令是新形态。

如果 `Connectivity: failed (operation aborted)`：让用户把 Chrome 切到前台、点一下 opencli 扩展图标唤醒 service worker，再 `opencli doctor`。

## 工作流程

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
opencli browser default open "https://hashnode.com/drafts"
opencli browser default state                                  # 看页面
# 找到 [N]<button><span>New</span></button>，N 是 ref 编号
opencli browser default click <N>                              # 进新草稿
opencli browser default get url                                # 应是 /draft/<id>
```

如果第一次跑 Write 按钮（侧边栏的）跳到了 "Draft is being edited"，那是别的标签页或之前的会话占着锁。先 click "Back to Drafts"，再点 New 建一份新的。

### 步骤 3：切到 Markdown 模式

Hashnode 默认是 ProseMirror 富文本，对 markdown 不友好。切 markdown：

```bash
opencli browser default state                                  # 找标题栏右上角的下拉按钮 ref（旁边是 "AI" 和 "Publish"）
opencli browser default click <dropdown-ref>                   # 弹出菜单：See preview / Markdown / Copy markdown / Version history
opencli browser default state                                  # 找 "Markdown" menuitem 的 ref
opencli browser default click <markdown-menuitem-ref>
```

切完后 state 里应该有：
- `<textarea placeholder=Article Title... />`（标题）
- `<textarea placeholder=Start writing markdown... />`（正文）
- 旁边一对 `<button>Write</button>` / `<button>Preview</button>`

### 步骤 4：填标题 + 正文（⚠️ 必须触发 React onChange）

```bash
opencli browser default fill <title-textarea-ref> "<title>"

# 正文：fill 之后必须再用 eval 触发一次 React 的 onChange，否则 Hashnode 的 draft auto-save 不会保存，publish 时是空稿
MD="$(cat blog-external/post-N-<slug>/medium.md)"
opencli browser default fill <body-textarea-ref> "$MD" > /dev/null

opencli browser default eval '(() => {
  const ta = document.querySelector("textarea[placeholder=\"Start writing markdown...\"]");
  const nv = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  const cur = ta.value;
  nv.call(ta, cur + " ");
  ta.dispatchEvent(new Event("input", {bubbles: true}));
  nv.call(ta, cur);
  ta.dispatchEvent(new Event("input", {bubbles: true}));
  return ta.value.length;
})()'
```

**关键坑**：opencli `fill` 用同步 value 赋值，React 不监听这种变更，Hashnode 的 auto-save 永远不会触发。结果：你 fill 了 16KB，publish 时草稿还是空的，发出来 404。两次 `nv.call + dispatchEvent` 强制 React 走 onChange 路径，auto-save 才会跑。

> 注：用 `blog-external/post-N-*/medium.md` 最稳，它已经剥掉了 frontmatter 和 truncate 标记。
> 如果还没建外部副本，直接拿源文件用 python 剥：
> ```bash
> python3 -c "import re,sys; s=open('<file>').read(); print(re.sub(r'<!-- truncate -->\\n?','', re.sub(r'^---.*?\\n---\\n','',s,1,re.DOTALL)))"
> ```

**验证 auto-save 跑过了**：重载页面后 textarea 不应再是空的。

```bash
opencli browser default open "https://hashnode.com/draft/<id>" > /dev/null
sleep 3
opencli browser default eval "document.querySelectorAll('textarea')[1].value.length"
```

应该返回正文长度（几千到一万多），而不是 0。返回 0 说明 onChange 没触发，重新走步骤 4。

Title fill 不需要这一步——title textarea 用了不同的事件路径，fill 就够 auto-save 了。

### 步骤 5：点 Publish 打开发布设置弹窗

```bash
# 找 <button>Publish</button> 的 ref（页面里可能有两个，点任一都行）
opencli browser default click <publish-ref>
opencli browser default state                                  # 弹窗：Draft settings
```

弹窗有 4 个 tab：Attribution / Discovery / Scheduling / Visibility。Attribution 默认就好（publication = "ReactUse Blog"）。

### 步骤 6：Discovery tab —— 改 slug、加 tags、设 canonical

```bash
opencli browser default click <Discovery-tab-ref>
```

**6a. 改 slug**

默认 slug 是从 title 长长地生成的。改成 frontmatter 里的短 slug：

```bash
opencli browser default click <Edit-button-ref>                # slug 行的 Edit 按钮
opencli browser default fill <slug-input-ref> "<short-slug>"
opencli browser default click <Save-button-ref>
```

**6b. 加 tags（前 3 个）**

Hashnode tag 必须是已存在的——自由输入会让 publish 卡住。type 进去后从自动补全选最热门那个（顶上一条，posts 数最高）：

```bash
opencli browser default type <tags-input-ref> "react"
opencli browser default get text <first-dropdown-ref>          # 应是 "#reactjs..." 或 "#react..."
opencli browser default click <first-dropdown-ref>             # 选第一项
```

ReactUse 博客常用 3 个：`react`、`javascript`、`web-development`（点 `webdev` 也行，看下拉）。

**6c. canonical URL**

```bash
opencli browser default click <canonical-checkbox-ref>          # "Add a canonical URL"
opencli browser default state                                   # 找新出现的 <input placeholder=https://example.com/original-article />
opencli browser default fill <canonical-input-ref> "https://reactuse.com/blog/<slug>/"
```

### 步骤 7：Publish

弹窗里有 3 个 `<button>Publish</button>`（两个在编辑器工具条，一个在弹窗底部），ref 编号经常在 click → re-render 之间漂走（拿到 ref 时弹窗在打开，click 时已经关上或重排）。**直接 eval 选中弹窗里那一个**，避开 stale_ref：

```bash
opencli browser default eval '(() => {
  const btn = Array.from(document.querySelectorAll("[role=dialog] button")).find(b => b.textContent.trim() === "Publish");
  if (!btn) return "notfound";
  btn.scrollIntoView();
  ["mousedown","mouseup","click"].forEach(t => btn.dispatchEvent(new MouseEvent(t, {bubbles: true, cancelable: true, view: window, button: 0})));
  return "clicked";
})()'
sleep 8
opencli browser default get url                                 # 应跳到 /edit/<cuid>
```

URL 进了 `/edit/<id>` 就是发出去了。如果还停在 `/draft/<id>`，先看两件事：

1. **稿子是空的** —— 步骤 4 的 onChange 没跑，回去走验证流程
2. **`btn.click()` 不触发 publish** —— 2026-05-18 实战发现，光 `.click()` 在 Hashnode 当前的 React 实现下有时不响应；必须显式派发 `mousedown` / `mouseup` / `click` 完整序列（上面 eval 已经这么写了）。如果你照搬了老版本 SKILL.md 里裸 `btn.click()`，换成上面这段

### 步骤 8：验证

```bash
opencli browser default open "https://reactuse.hashnode.dev/<slug>"
opencli browser default get title                               # 应是文章标题
opencli browser default get url                                 # 应是 reactuse.hashnode.dev/<slug>
```

`curl` 直接打 reactuse.hashnode.dev 会被 Cloudflare bot challenge 拦（HTTP 403），必须走浏览器 session。

**⚠️ CDN 传播延迟**：刚 publish 完几分钟内，直接访问 `reactuse.hashnode.dev/<slug>` 可能返回 "Post Not Found"——这是 Hashnode 自己的 CDN 缓存还没更新，不是 publish 失败。**正确的成功判定**：访问 publication 首页 `https://reactuse.hashnode.dev/`，新文章应该出现在文章列表顶部。

```bash
opencli browser default open "https://reactuse.hashnode.dev/"
opencli browser default eval '(() => {
  const links = Array.from(document.querySelectorAll("a")).filter(a =>
    a.href.includes("reactuse.hashnode.dev/") &&
    !a.href.endsWith(".dev/") && !a.href.includes("#") &&
    !a.href.includes("/p/") && !a.href.includes("/series/") && !a.href.includes("/tag/")
  );
  const out = []; const seen = new Set();
  for (const a of links) {
    if (seen.has(a.href)) continue;
    seen.add(a.href);
    out.push({href: a.href, text: a.textContent.trim().slice(0,80)});
    if (out.length >= 3) break;
  }
  return JSON.stringify(out);
})()'
```

返回结果第一条 href 是 `reactuse.hashnode.dev/<slug>` 就是发出去了。

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
- **正文 fill 不触发 React onChange，draft 不保存** —— 这是最隐蔽的坑。`opencli fill` 是同步 value 赋值，Hashnode auto-save 不会跑。fill 之后必须 eval 触发 input event（见步骤 4）。症状：publish 后访问公开 URL 是 Post Not Found，publication 首页也没有这篇。修复后能看到首页列表里有新文章
- **弹窗里 Publish ref 漂走** —— click 时拿到的 ref 在 click 之间已经因为弹窗 re-render 变了。用 `eval` 选 `<button>Publish</button>` + `.closest("[role=dialog]")` 直接 click，不走 ref（见步骤 7）
- **`btn.click()` 在 publish 按钮上有时不响应** —— 2026-05-18 实测，光 `.click()` 不会真的触发 publish；必须显式派发 `mousedown`/`mouseup`/`click` 三联击（步骤 7 的 eval 已经写成这样）
- **同一 session 内 eval 不能用裸 `const`/`let`** —— opencli 把每次 eval 都注入到同一全局作用域，第二次声明同名变量会 `Identifier 'X' has already been declared`。所有 eval 都包成 `(() => { ... })()` IIFE，变量作用域局限在闭包内
- **publish 后直接 URL 返回 Post Not Found，但 publication 首页有这篇** —— Hashnode 自己 CDN 缓存延迟（几分钟）。判断成功用 publication 首页文章列表，不要用直接 URL

## 注意事项

- **Tags 上限 3 个**（之前 API 是 5 个，但 UI 流程下 3 个是常见上限且更精准）
- **Cover image** 现在浏览器流程不自动处理；如果文章 frontmatter 里有 `image: /img/og.png`，发完后到 Hashnode UI 上传 `https://reactuse.com/img/og.png`，或在 step 6 的 Discovery tab 用 `editor-og-image` 那个 file input
- **不要 ping IndexNow 给 Hashnode 的 URL** —— IndexNow 是给 reactuse.com 自己的，hashnode.dev 不归我们管
