const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const EN_ROOT = path.join(__dirname, '../packages/website-docusaurus/docs')
const ZH_ROOT = path.join(__dirname, '../packages/website-docusaurus/i18n/zh-Hans/docusaurus-plugin-content-docs/current')
const HOOK_PREFIX = 'use'
const HOOK_CATEGORIES = {
  browser: 'Browser',
  state: 'State',
  element: 'Element',
  integrations: 'Integrations',
  effect: 'Effect',
}

function getCategoryFromPath(filePath) {
  const parts = filePath.split(path.sep)
  for (const cat of Object.keys(HOOK_CATEGORIES)) {
    if (parts.includes(cat))
      return HOOK_CATEGORIES[cat]
  }
  return ''
}

function getHookName(fileName) {
  const base = path.basename(fileName, path.extname(fileName))
  return base
}

function isHookFile(fileName) {
  return fileName.startsWith(HOOK_PREFIX) && path.extname(fileName).match(/\.mdx?$/)
}

function isDocFile(fileName) {
  return path.extname(fileName).match(/\.mdx?$/) && !fileName.startsWith('_category_')
}

function getTitle({ hook, category, lang, fileName }) {
  if (hook && category) {
    if (lang === 'zh') {
      return `${hook} 用法与示例`
    }
    else {
      return `${hook} – ${category} Hook Usage & Examples`
    }
  }
  else {
    // 非 hook 文档
    const docName = getHookName(fileName)
    if (lang === 'zh') {
      return `${docName}`
    }
    else {
      return `${docName}`
    }
  }
}

function getSidebarLabel({ hook, fileName }) {
  return hook || getHookName(fileName)
}

function getDescription({ lang, hook, category, fileName, content }) {
  // 取正文前两段（去掉 markdown 标题和空行）
  const lines = content.split('\n').map(l => l.trim())
  const paras = []
  let para = ''
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (!l || l.startsWith('#'))
      continue
    if (l.startsWith('---'))
      continue
    if (l.startsWith('```'))
      break // 遇到代码块提前结束
    para += (para ? ' ' : '') + l
    if (l.endsWith('.') || l.endsWith('。') || l.endsWith('!') || l.endsWith('！')) {
      paras.push(para)
      para = ''
      if (paras.length >= 2)
        break
    }
  }
  if (para && paras.length < 2)
    paras.push(para)
  let desc = paras.join(' ')
  if (lang === 'zh') {
    if (!desc)
      desc = `${hook || getHookName(fileName)} 是一个 React Hook。`
    if (!desc.endsWith('。'))
      desc += '。'
    desc += ' 本文介绍其用法、最佳实践与代码示例。'
    if (desc.length < 80)
      desc += '适用于 React 开发中需要处理副作用的场景。'
    return desc.slice(0, 160)
  }
  else {
    if (!desc)
      desc = `${hook || getHookName(fileName)} is a React Hook.`
    if (!desc.endsWith('.'))
      desc += '.'
    desc += ' Learn usage patterns, best practices, and code examples for React developers.'
    if (desc.length < 80)
      desc += ' Suitable for handling side effects in React.'
    return desc.slice(0, 160)
  }
}

function parseFrontmatter(content) {
  if (!content.startsWith('---'))
    return [{}, content]
  const end = content.indexOf('---', 3)
  if (end === -1)
    return [{}, content]
  const fmRaw = content.slice(3, end).trim()
  let fm = {}
  try {
    fm = yaml.load(fmRaw) || {}
  }
  catch (e) {
    fm = {}
  }
  const body = content.slice(end + 3).replace(/^\s+/, '')
  return [fm, body]
}

function buildFrontmatter(fm) {
  return `---\n${yaml.dump(fm, { lineWidth: 160 })}---\n`
}

function processFile(filePath, lang) {
  const rel = path.relative(process.cwd(), filePath)
  const fileName = path.basename(filePath)
  if (!isDocFile(fileName))
    return
  const category = getCategoryFromPath(filePath)
  const hook = isHookFile(fileName) ? getHookName(fileName) : ''
  const content = fs.readFileSync(filePath, 'utf-8')
  const [fm, body] = parseFrontmatter(content)
  // 生成新字段
  fm.title = getTitle({ hook, category, lang, fileName })
  fm.sidebar_label = getSidebarLabel({ hook, fileName })
  fm.description = getDescription({ lang, hook, category, fileName, content: body })
  // 重建 frontmatter
  const newContent = buildFrontmatter(fm) + body
  fs.writeFileSync(filePath, newContent, 'utf-8')
  console.log(`Updated: ${rel}`)
}

function walkDir(dir, lang) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) {
      walkDir(full, lang)
    }
    else {
      processFile(full, lang)
    }
  })
}

console.log('Processing English docs...')
walkDir(EN_ROOT, 'en')
console.log('Processing Chinese docs...')
walkDir(ZH_ROOT, 'zh')
console.log('Done!')
