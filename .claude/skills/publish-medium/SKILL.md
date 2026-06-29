---
name: publish-medium
category: blog
description: 把博客文章发布到 Medium（@wul55267），通过 opencli 浏览器自动化。Medium 编辑器是富文本，不吃裸 markdown，所以用 pandoc 把正文转 HTML，再模拟一次 paste 事件灌进去。当用户说"发到 medium"、"推送 medium"、"publish to medium"、"cross-post to medium"，或在写完/commit 了一篇新博客后说"发出去"、"同步发布"、"把这篇发了"时触发；也用于多平台分发流程（dev.to + Medium + Hashnode + 掘金）里的一环。
---

# publish-medium — 跨发到 Medium（opencli 浏览器自动化）

reactuse.com 的博客在 Medium 上做镜像分发，扩大英文触达。**Medium 是真实增量流量**（推荐流 + 订阅者收件箱）。

## ⚠️ 路径：opencli 浏览器自动化（已取代旧的 bridge + 扩展方案）

> 历史：2026-06 之前用的是本地 Bridge 服务 + Chrome 扩展（`medium-push` skill，靠 SSE 推 markdown 到扩展、扩展转 HTML 再模拟粘贴）。现在统一走 `opencli`，和 `publish-hashnode` 一致，不再需要那套 bridge。旧 skill 已删除。

**核心难点**：Medium 的编辑器（`.js-postField`，contenteditable + 自有数据模型）**不解析 markdown**。直接 fill markdown 文本只会得到一坨纯文本。正确做法和那个旧扩展一样——把 markdown 转成 HTML，然后**模拟一次 paste 事件**（带 `text/html` 的 DataTransfer），Medium 的粘贴处理器会把 HTML 正确吃进它的模型。标题则用 `execCommand("insertText")` 灌（Medium 模型只认"输入"路径，直接写 DOM textContent 不进模型）。

## 触发场景

1. 用户明说："发到 medium" / "publish to medium" / "把这篇 cross-post 到 medium"
2. 刚写完一篇博客并说"发出去" / "同步发布" / "推平台"——默认包括 Medium
3. 多平台分发流程的一步（dev.to + Medium + Hashnode + 掘金）

⚠️ **不要触发**：用户只让发别的平台（只发 Hashnode / 掘金 / dev.to）时，不要顺手也发 Medium。

## ⚠️ 顺序：先推 GitHub，再跨发

英文跨发（Medium / Hashnode / dev.to）的 canonical 都指回 `reactuse.com/blog/<slug>/`。**必须先把博客 commit + push 到 GitHub**（触发 Netlify 部署），让原文链接真的存在，再发跨平台版本——否则 canonical 指向一个 404。掘金是中文翻译、独立站，不受此约束。

> 注：Medium 原生编辑器**没有** canonical 字段（只有 Import 流程才有）。所以 Medium 这篇本身不会把权重让回 reactuse.com——它纯粹是触达渠道。这是已知取舍，不用纠结；旧的 bridge 方案同样没设 canonical。

## 前置检查

```bash
opencli --version                    # 需要 ≥ 1.7.22
opencli doctor                       # 必须看到 Connectivity: connected
command -v pandoc                    # 正文 markdown→HTML 靠 pandoc；没有就 brew install pandoc
```

如果 `Connectivity: failed`：让用户把 Chrome 切到前台、点一下 opencli 扩展图标唤醒 service worker，再 `opencli doctor`。

## 工作流程

### 步骤 1：确认目标文章 + 元数据

```bash
ls packages/website-astro/src/content/blog/ | tail -3
```

从 `blog-external/post-N-<slug>/medium.md` 拿正文（已剥掉 frontmatter 和 `<!-- truncate -->`，含 H1 标题）。从源文件 frontmatter 拿 `title`。

### 步骤 2：打开 Medium 新文章页

```bash
opencli browser default open "https://medium.com/new-story"
opencli browser default get title          # 应是 "New story – Medium"（说明已登录）
```

如果跳到登录页：让用户先在该 Chrome 里登录 Medium，再重来。

### 步骤 3：正文 markdown → HTML（pandoc）

去掉正文的首个 H1（标题单独灌），其余转 HTML 片段：

```bash
SCRATCH=<scratchpad>
python3 -c "import re; s=open('blog-external/post-N-<slug>/medium.md').read(); s=re.sub(r'^#\s+.*\n+','',s,1); open('$SCRATCH/body.md','w').write(s.strip()+'\n')"
pandoc -f gfm -t html --wrap=none "$SCRATCH/body.md" -o "$SCRATCH/body.html"
```

> Medium 不支持表格——pandoc 出来的 `<table>` 粘进去会被拍平成文本。正文里如果有关键表格，发前先在 medium.md 里改成列表。代码块 / 标题 / 列表 / 引用 / 行内代码 / 链接都没问题。

### 步骤 4：灌标题（execCommand insertText）

```bash
opencli browser default eval '(() => {
  const TITLE = "<title>";
  const title = document.querySelector("h3.graf--title");
  title.focus();
  const r = document.createRange(); r.selectNodeContents(title);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  document.execCommand("insertText", false, TITLE);
  return title.textContent.slice(0,60);
})()'
```

### 步骤 5：灌正文（模拟 paste 一段 HTML）

正文 HTML 用 base64 传进 eval（避开 shell 引号地狱）：

```bash
HTML_B64=$(base64 < "$SCRATCH/body.html" | tr -d '\n')
PLAIN_B64=$(base64 < "$SCRATCH/body.md"  | tr -d '\n')
opencli browser default eval '(() => {
  const dec = b => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)));
  const HTML = dec("'"$HTML_B64"'");
  const PLAIN = dec("'"$PLAIN_B64"'");
  const field = document.querySelector(".js-postField");
  field.focus();
  const grafs = field.querySelectorAll(".graf");
  const last = grafs[grafs.length - 1];
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(last); range.collapse(false);
  sel.removeAllRanges(); sel.addRange(range);
  const dt = new DataTransfer();
  dt.setData("text/html", HTML);
  dt.setData("text/plain", PLAIN);
  const evt = new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true});
  const target = field.contains(document.activeElement) ? document.activeElement : field;
  target.dispatchEvent(evt);
  return "paste dispatched";
})()'
```

**验证正文吃进去了**（grafCount 应该几十、textLen 上万、能数到代码块 / 标题）：

```bash
opencli browser default eval '(() => {
  const f = document.querySelector(".js-postField");
  return JSON.stringify({
    grafs: f.querySelectorAll(".graf").length,
    pre: f.querySelectorAll(".graf--pre, pre").length,
    h3: f.querySelectorAll(".graf--h3").length,
    textLen: f.innerText.length
  });
})()'
```

`grafs` 是个位数 / `textLen` 几百，说明 paste 没被 Medium 接住——多半是焦点没落在 `.js-postField` 里。重新 focus + 设置 selection range 再 dispatch。

### 步骤 6：Publish → 选 topics → 终发

```bash
# 打开发布面板
opencli browser default eval '(() => { const b = Array.from(document.querySelectorAll("button")).find(b=>b.textContent.trim()==="Publish"); b.click(); return "opened"; })()'
sleep 2
```

加 topics（Medium 最多 5 个，自由文本，无需从下拉选）。输入框 placeholder 一开始是 `Add a topic...`，加进第一个后变成 `Add more topics...`：

```bash
# 对每个 topic：set value + input 事件，再敲 Enter 提交
opencli browser default eval '(() => {
  const inp = document.querySelector("input[placeholder*=\"topic\"]");
  inp.focus();
  const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;
  s.call(inp, "React"); inp.dispatchEvent(new Event("input",{bubbles:true}));
  return "typed";
})()'
sleep 1
opencli browser default eval '(() => {
  const inp = document.querySelector("input[placeholder*=\"topic\"]");
  ["keydown","keypress","keyup"].forEach(t => inp.dispatchEvent(new KeyboardEvent(t,{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:true})));
  return "enter";
})()'
```

ReactUse 常用：`React`、`JavaScript`、`React Hook`、`Web Development`、`Programming`。**坑**：点 Publish 后 Medium 会切到「submission」整页（URL 变成 `/p/<id>/submission?...`），这一页的 topic 输入框不是普通 `<input type=text>`，原来加的 topic 会保留，但想再加新的可能加不进——**前 2 个稳的 topic（React + JavaScript）就够了**，不用强求 5 个。

终发（submission 页的绿色 Publish）：

```bash
opencli browser default eval '(() => {
  const pub = Array.from(document.querySelectorAll("button")).find(b => /^Publish( now)?$/.test(b.textContent.trim()));
  ["mousedown","mouseup","click"].forEach(t=>pub.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window,button:0})));
  return "clicked Publish";
})()'
sleep 5
opencli browser default get url        # 发出去后是 https://medium.com/p/<id>?postPublishedType=initial
```

### 步骤 7：拿干净的公开链接

```bash
opencli browser default eval '(() => (document.querySelector("link[rel=canonical]")||{}).href || (document.querySelector("meta[property=\"og:url\"]")||{}).content)()'
# → https://medium.com/@wul55267/<slug>-<id>
```

## 输出格式

```
✅ Medium: <title>
   → https://medium.com/@wul55267/<slug>-<id>
   topics: React, JavaScript（Medium 原生无 canonical 字段）
```

失败时附最后一次 eval 的关键返回 + 建议下一步。

## 常见踩坑

- **裸 markdown 不解析** —— Medium 编辑器要 HTML。必须 pandoc 转 HTML + 模拟 paste 事件，不能直接 fill markdown 文本
- **标题别用 fill / textContent** —— Medium 自有模型只认输入路径。标题用 `execCommand("insertText")`，正文用模拟 paste
- **paste 没被接住** —— 焦点必须在 `.js-postField` 里、selection range 要落在最后一个 `.graf`。focus 后重设 range 再 dispatch
- **表格被拍平** —— Medium 不支持表格，发前把表格改成列表
- **submission 整页的 topic 输入框不是标准 input** —— 切到 submission 页后想再加 topic 会失败；点 Publish 前就把 topic 加好（或接受 2 个就够）
- **Enter 提交 topic** —— `Add a topic...` 输入后必须派发 Enter（keydown+keypress+keyup）才提交成第一个 topic；提交后 placeholder 变 `Add more topics...`
- **同一 session 内 eval 不能用裸 `const`/`let` 重名** —— opencli 把每次 eval 注入同一全局作用域，全部包成 `(() => { ... })()` IIFE
- **没有 canonical** —— Medium 原生编辑器不提供 canonical（只有 Import 流程有）。这篇纯触达，不让权重回 reactuse.com，是已知取舍
- **大正文 base64** —— 10KB markdown → ~20KB base64 字符串传进 eval 没问题，opencli 扛得住
