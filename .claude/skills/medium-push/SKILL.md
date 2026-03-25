---
name: medium-push
category: publishing
description: 将 Markdown 文件推送到浏览器中打开的 Medium 编辑器。当用户说"发布到 medium"、"推送到 medium"、"paste to medium"、"push to medium"或在完成文章生成后要求发送到 Medium 时触发。
---

# medium-push - 推送 Markdown 到 Medium 编辑器

通过 Chrome 扩展 + Bridge 服务（HTTP + SSE），将本地 Markdown 文件转换为富文本并推送到浏览器中打开的 Medium 编辑器。

## 架构

```
Claude Code (读取 Markdown 文件)
  → curl POST http://localhost:18766/paste
    → Bridge Server (SSE 推送)
      → Chrome Extension (content script)
        → Markdown → HTML 转换
          → Medium 编辑器 (模拟粘贴富文本)
```

## 工作流程

### 步骤 1：检查 Bridge 服务

```bash
curl -s http://localhost:18766/health 2>/dev/null || echo "NOT_RUNNING"
```

| 结果 | 操作 |
|------|------|
| `{"status":"ok",...}` | Bridge 已运行，跳到步骤 2 |
| `NOT_RUNNING` | 启动 Bridge 服务 |

**启动 Bridge：**

```bash
nohup node <skill-path>/scripts/bridge.mjs > /tmp/medium-push-bridge.log 2>&1 &
echo $!
```

等待 1 秒后再次检查 `/health` 确认启动成功。

### 步骤 2：确认 Medium 编辑器已打开

提示用户在 Chrome 中打开 Medium 新文章页面：

```
https://medium.com/new-story
```

### 步骤 3：读取 Markdown 文件

读取用户指定的 Markdown 文件路径。如果用户没有指定，查找 `blog-external/` 目录下的 `medium.md` 文件。

### 步骤 4：发送到 Medium 编辑器

**方式 A：通过文件路径（推荐）**

```bash
curl -s -X POST http://localhost:18766/paste \
  -H "Content-Type: application/json" \
  -d '{"filePath": "<absolute-path-to-markdown-file>"}'
```

**方式 B：直接发送内容**

```bash
curl -s -X POST http://localhost:18766/paste \
  -H "Content-Type: application/json" \
  -d @- <<'PAYLOAD'
{"content": "<markdown-content-here>"}
PAYLOAD
```

### 步骤 5：确认结果

检查响应中的字段：

| 字段 | 含义 |
|------|------|
| `success: true` | 请求成功 |
| `clientsSent > 0` | 内容已推送到浏览器扩展 |
| `clientsSent = 0` | 没有连接的扩展客户端 |

如果 `clientsSent = 0`，提示用户：
1. 确认 Chrome 扩展已安装
2. 确认已打开 `https://medium.com/new-story` 页面
3. 刷新页面后重试

**输出格式：**
```
文章已推送到 Medium 编辑器！

文件：{file_path}
内容长度：{contentLength} 字符
浏览器客户端：{clientsSent} 个

请在浏览器中查看 Medium 编辑器并检查内容格式。
```

## 首次安装

### 1. 安装 Chrome 扩展

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择 `<skill-path>/extension/` 目录
5. 安装完成

### 2. Bridge 服务

Bridge 为纯 Node.js 实现，零外部依赖，无需 npm install。
默认端口 18766（避免与 md-push 的 18765 冲突），可通过 `BRIDGE_PORT` 环境变量修改。

## 注意事项

- Bridge 使用 SSE（Server-Sent Events）推送，扩展会自动重连
- 扩展会自动剥离 Markdown 的 YAML frontmatter
- Markdown 在扩展端转换为 HTML 后通过模拟粘贴注入 Medium 编辑器
- 第一个 `#` 标题会自动填入 Medium 的标题字段
- 支持：标题、段落、粗体、斜体、代码块、行内代码、链接、图片、列表、引用
- 扩展 popup 支持手动粘贴（无需 Bridge）
