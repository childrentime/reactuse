---
name: publish-juejin
category: blog
description: 把博客文章发布到掘金（juejin.cn），通过 opencli 浏览器自动化。掘金编辑器是 ByteMD（CodeMirror 内核的 markdown 编辑器），直接吃 markdown，比 Medium 好搞。发的是简体中文版（juejin.md）。当用户说"发到掘金"、"推送掘金"、"publish to juejin"、"把这篇发掘金"，或在写完/commit 了一篇新博客后说"发出去"、"同步发布"、"推平台"时触发；也用于多平台分发流程的一环。
---

# publish-juejin — 跨发到掘金（opencli 浏览器自动化）

reactuse.com 的博客在掘金做简体中文分发，触达国内 React 开发者。**掘金没有公开 API**（2026-06 之前都是让用户手动复制 `juejin.md`），现在统一走 `opencli` 浏览器自动化，和 `publish-hashnode` / `publish-medium` 一致。

## ✅ 好消息：掘金编辑器吃 markdown

掘金「写文章」用的是 **ByteMD**（CodeMirror 内核的 markdown 编辑器），不像 Medium 那样要转 HTML。直接：
- 标题：填 `input.title-input`（React 受控，要触发 onChange）
- 正文：调 CodeMirror 的 `setValue(md)` API（ByteMD 监听 CM change，自动同步并触发草稿 auto-save）

## 触发场景

1. 用户明说："发到掘金" / "publish to juejin" / "把这篇发掘金"
2. 刚写完一篇博客并说"发出去" / "同步发布" / "推平台"——默认包括掘金
3. 多平台分发流程的一步（dev.to + Medium + Hashnode + 掘金）

⚠️ **不要触发**：用户只让发别的平台时，不要顺手也发掘金。

## ⚠️ 顺序：先推 GitHub，再跨发

跨发前先把博客 commit + push 到 GitHub（触发 Netlify 部署），让原文 `reactuse.com/blog/<slug>/` 真的存在。掘金发的是中文翻译版、独立站，正文里的 `reactuse.com` 链接是普通外链（不是 canonical），约束没英文平台那么硬，但保持「先推后发」的统一顺序更省心。

## 前置检查

```bash
opencli --version                    # 需要 ≥ 1.7.22
opencli doctor                       # 必须看到 Connectivity: connected
```

## 工作流程

### 步骤 1：确认目标文章 + 标题

正文用 `blog-external/post-N-<slug>/juejin.md`（简体中文，已剥 frontmatter / truncate，含 H1）。从 zh-hans 源文件 frontmatter 拿中文 `title`。

### 步骤 2：打开掘金新草稿

```bash
opencli browser default open "https://juejin.cn/editor/drafts/new"
opencli browser default get title          # 应是 "写文章 - 掘金"（说明已登录）
```

如果跳登录：让用户先在该 Chrome 登录掘金，再重来。

### 步骤 3：灌标题 + 正文

正文去掉首个 H1（标题单独填），base64 传进 eval：

```bash
SCRATCH=<scratchpad>
python3 -c "import re,base64; s=open('blog-external/post-N-<slug>/juejin.md').read(); s=re.sub(r'^#\s+.*\n+','',s,1); print(base64.b64encode((s.strip()+'\n').encode()).decode())" > "$SCRATCH/jj_b64.txt"
B64=$(cat "$SCRATCH/jj_b64.txt")
opencli browser default eval '(() => {
  const TITLE = "<中文标题>";
  const MD = new TextDecoder().decode(Uint8Array.from(atob("'"$B64"'"), c => c.charCodeAt(0)));
  // 标题：React 受控，native setter + input 事件
  const t = document.querySelector("input.title-input");
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(t, TITLE); t.dispatchEvent(new Event("input", {bubbles: true}));
  // 正文：CodeMirror setValue（ByteMD 监听 CM change → 自动 auto-save）
  const cm = document.querySelector(".CodeMirror").CodeMirror;
  cm.setValue(MD);
  return JSON.stringify({title: t.value.slice(0,40), bodyLen: cm.getValue().length});
})()'
```

### 步骤 4：确认草稿 auto-save

```bash
sleep 2
opencli browser default get url            # 应从 /drafts/new 变成 /editor/drafts/<id>，说明 auto-save 跑过了
```

URL 拿到 `<id>` 就说明草稿存住了。

### 步骤 5：点「发布」打开发布弹窗

```bash
opencli browser default eval '(() => { const b = Array.from(document.querySelectorAll("button")).find(b=>b.textContent.trim()==="发布"); b.click(); return "clicked 发布"; })()'
sleep 1.5
```

弹窗必填：**分类** + **至少一个标签**。还有可选：封面、收录专栏、话题、摘要（一般自动生成 100 字）。

### 步骤 6：选分类（前端）

```bash
opencli browser default eval '(() => {
  const el = Array.from(document.querySelectorAll("[class*=category] *")).find(e => e.children.length===0 && e.textContent.trim()==="前端");
  el.click(); return "前端 selected";
})()'
```

分类候选：后端 / 前端 / Android / iOS / 人工智能 / 开发工具 / 代码人生 / 阅读。ReactUse 选 **前端**。

### 步骤 7：加标签（byte-select，从下拉选现成的）

标签框是 `input.byte-select__input`，下拉项是 `li.byte-select-option`。type 进去触发下拉，再点匹配项。**标签必须从下拉选已存在的**，自由输入发不出去。

```bash
# 对每个标签：填值触发下拉 → 点精确匹配项
opencli browser default eval '(() => {
  const sel = document.querySelectorAll("input.byte-select__input")[0];
  sel.focus();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;
  setter.call(sel, "React"); sel.dispatchEvent(new Event("input",{bubbles:true}));
  return "typed React";
})()'
sleep 1.2
opencli browser default eval '(() => {
  const opt = Array.from(document.querySelectorAll("li.byte-select-option")).find(o => o.textContent.trim() === "React.js")
            || document.querySelectorAll("li.byte-select-option")[0];
  opt.click(); return "picked "+opt.textContent.trim();
})()'
```

ReactUse 常用标签：**React.js**、**JavaScript**（再加个 **前端** 也行）。注意下拉项 class 是 `byte-select-option`（不是 `byte-select__option`，下划线数量不一样，别搞错）。

### 步骤 8：确定并发布

```bash
opencli browser default eval '(() => {
  const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "确定并发布");
  ["mousedown","mouseup","click"].forEach(t => btn.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window,button:0})));
  return "clicked 确定并发布";
})()'
sleep 4
opencli browser default get title          # 成功是 "发布成功"
```

### 步骤 9：验证

`get title` 返回 **"发布成功"** 即发布成功。掘金新文章会进**审核队列**（成功页有「前往申诉 / 我知道了」按钮，是正常的审核提示，不是报错）。审核通过后出现在用户主页文章列表，URL 形如 `juejin.cn/post/<id>`。

```bash
opencli browser default eval '(() => { const b = Array.from(document.querySelectorAll("button")).find(b=>b.textContent.trim()==="我知道了"); if(b) b.click(); return "dismissed"; })()'
```

## 输出格式

```
✅ 掘金: <中文标题>（已提交，审核中）
   草稿 id: <draft-id>
   分类 前端 · 标签 React.js / JavaScript
```

## 常见踩坑

- **标题填了不触发 onChange** —— `input.title-input` 是 React 受控，必须 native setter + `input` 事件，光 `fill` 不进 React state
- **正文别 fill** —— CodeMirror 不从隐藏 textarea 读值。用 `document.querySelector(".CodeMirror").CodeMirror.setValue(md)` 走 CM API，ByteMD 才会同步 + auto-save
- **标签 class 是 `byte-select-option`** —— 不是 `byte-select__option`（命名是 BEM 单/双下划线混用，dropdown wrap 是 `byte-select-dropdown__wrap`、option 是 `byte-select-option`、input 是 `byte-select__input`）
- **标签必须从下拉选** —— 自由输入的标签发不出去，必须 type 触发下拉再点现成项
- **分类是必填** —— 不选分类点「确定并发布」会卡住
- **审核中 ≠ 失败** —— "发布成功" + 「前往申诉 / 我知道了」是掘金正常的发布后审核流程，文章已提交
- **同一 session 内 eval 不能用裸 `const`/`let` 重名** —— 全部包成 `(() => { ... })()` IIFE
- **base64 传正文** —— 中文正文直接拼进 eval 命令行会有引号/转义问题，base64 编码后用 `TextDecoder` 解最稳
