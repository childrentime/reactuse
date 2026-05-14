/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsPath = path.resolve(__dirname, '../src/content/docs')
const outputPath = path.resolve(__dirname, '../public/llms-full.txt')

const categories = ['state', 'effect', 'element', 'browser', 'integrations']

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match)
    return { fm: {}, body: content }
  const fm = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)/)
    if (kv) {
      fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
    }
  }
  return { fm, body: content.slice(match[0].length).replace(/^\n+/, '') }
}

function stripImports(body) {
  return body.replace(/^import\s+(?:\S.*?)??from\s+['"][^'"]+['"];?\s*$/gm, '').replace(/^\n{3,}/gm, '\n\n')
}

function stripApiPlaceholder(body) {
  return body.replace(/^%%API%%\s*$/gm, '')
}

let out = `# ReactUse — Full Documentation (llms-full.txt)

Website: https://reactuse.com
GitHub: https://github.com/childrentime/reactuse
NPM: https://www.npmjs.com/package/@reactuses/core

ReactUse (@reactuses/core) is an open-source library of 110+ custom React Hooks for production applications. Hooks are TypeScript-first, tree-shakable, and SSR-compatible. Supports React 16.8 through React 19, Next.js, Remix, and other SSR frameworks.

This file inlines the full Markdown for every hook documentation page. Each hook section starts with the line "URL: https://reactuse.com/{category}/{hookname}/" so passages can be cited individually.

---

`

let totalHooks = 0
const stats = []

for (const category of categories) {
  const catPath = path.join(docsPath, category)
  if (!fs.existsSync(catPath))
    continue

  const files = fs.readdirSync(catPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md')).sort()
  const catTitle = category.charAt(0).toUpperCase() + category.slice(1)

  out += `# ${catTitle} hooks (${files.length})\n\n`

  for (const file of files) {
    const filePath = path.join(catPath, file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { fm, body } = extractFrontmatter(raw)
    const hookName = fm.sidebar_label || path.basename(file, path.extname(file))
    const url = `https://reactuse.com/${category}/${hookName.toLowerCase()}/`
    const cleaned = stripApiPlaceholder(stripImports(body)).trim()

    out += `## ${hookName}\n\n`
    out += `URL: ${url}\n`
    out += `Category: ${category}\n`
    if (fm.description)
      out += `Description: ${fm.description}\n`
    out += `Import: \`import { ${hookName} } from '@reactuses/core'\`\n\n`
    out += `${cleaned}\n\n---\n\n`
    totalHooks++
    stats.push({ category, hookName, bytes: cleaned.length })
  }
}

out += `\nGenerated: ${new Date().toISOString()} | Total hooks: ${totalHooks}\n`

fs.writeFileSync(outputPath, out, 'utf-8')
console.log(`llms-full.txt generated: ${totalHooks} hooks, ${(out.length / 1024).toFixed(1)} KB`)
