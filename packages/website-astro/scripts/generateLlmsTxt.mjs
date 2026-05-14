/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsPath = path.resolve(__dirname, '../src/content/docs')
const outputPath = path.resolve(__dirname, '../public/llms.txt')

const categories = ['state', 'effect', 'element', 'browser', 'integrations']

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match)
    return {}
  const fm = {}
  let currentKey = null
  let multiline = false
  for (const line of match[1].split('\n')) {
    if (multiline && line.match(/^\s/) && !line.includes(':')) {
      fm[currentKey] = `${(fm[currentKey] || '')} ${line.trim()}`.trim()
      continue
    }
    multiline = false
    const kv = line.match(/^(\w+):\s*(.*)/)
    if (kv) {
      currentKey = kv[1]
      const val = kv[2].trim().replace(/^["']|["']$/g, '')
      if (val === '>-' || val === '>') {
        multiline = true
        fm[currentKey] = ''
      }
      else {
        fm[currentKey] = val
      }
    }
  }
  return fm
}

function getFirstParagraph(content) {
  const body = content.replace(/^---[\s\S]*?---\n*/, '')
  const lines = body.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```') && !trimmed.startsWith('import')) {
      return trimmed.replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    }
  }
  return ''
}

let content = `# ReactUse - Collection of 110+ Essential React Hooks

> Full content (every hook page inlined): https://reactuse.com/llms-full.txt
> Per-page Markdown: append \`.md\` to any hook URL, e.g. https://reactuse.com/state/usetoggle.md

Website: https://reactuse.com | GitHub: https://github.com/childrentime/reactuse | NPM: https://www.npmjs.com/package/@reactuses/core

## Overview

ReactUse (@reactuses/core) is an open-source library of 110+ custom React Hooks for building production applications. It provides TypeScript-first, tree-shakable, and SSR-compatible hooks covering browser APIs, state management, DOM observation, side effects, and third-party integrations. ReactUse supports React 16.8 through React 19 and works with Next.js, Remix, and other server-side rendering frameworks.

## Key Features

- 110+ Hooks: Covers browser APIs, state management, DOM elements, effects, and integrations
- TypeScript-First: Full type definitions for every hook with generics support
- Tree-Shakable: Import only what you need; unused hooks are eliminated at build time
- SSR Compatible: Works seamlessly with Next.js, Remix, and other SSR frameworks
- React 16.8 - 19: Supports all modern React versions including React 19
- Production Proven: Used by Shopee, PDD, Ctrip, and Bambu Lab

## Installation

\`\`\`bash
npm i @reactuses/core
# or
yarn add @reactuses/core
# or
pnpm add @reactuses/core
\`\`\`

## Quick Start

\`\`\`tsx
import { useToggle } from '@reactuses/core'

function Demo() {
  const [on, toggle] = useToggle(true)
  return (
    <div>
      <div>{on ? 'ON' : 'OFF'}</div>
      <button onClick={toggle}>Toggle</button>
    </div>
  )
}
\`\`\`

## Complete Hook Reference

`

let totalHooks = 0

for (const category of categories) {
  const catPath = path.join(docsPath, category)
  if (!fs.existsSync(catPath))
    continue

  const files = fs.readdirSync(catPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md')).sort()
  const catTitle = category.charAt(0).toUpperCase() + category.slice(1)

  content += `### ${catTitle} (${files.length} hooks)\n\n`

  for (const file of files) {
    const filePath = path.join(catPath, file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const fm = extractFrontmatter(raw)
    const hookName = fm.sidebar_label || path.basename(file, path.extname(file))
    const description = fm.description || ''
    const expanded = getFirstParagraph(raw)

    content += `#### ${hookName}\n\n`
    if (description)
      content += `${description}\n\n`
    if (expanded && expanded !== description)
      content += `${expanded}\n\n`
    content += `Documentation: https://reactuse.com/${category}/${hookName.toLowerCase()}/\n`
    content += `Import: \`import { ${hookName} } from '@reactuses/core'\`\n\n`
    totalHooks++
  }
}

content += `## MCP Support

ReactUse supports Model Context Protocol (MCP) integration:

\`\`\`json
{
  "@reactuses/mcp": {
    "command": "npx",
    "args": ["-y", "@reactuses/mcp@latest"],
    "type": "stdio"
  }
}
\`\`\`

## Community & Support

- Discord: https://discord.gg/HMsq6cFkKp
- Issues: https://github.com/childrentime/reactuse/issues

## Companies Using ReactUse

PDD (Pinduoduo), Shopee, Ctrip, Bambu Lab

## License

Unlicense - Use freely without restrictions

---
Generated: ${new Date().toISOString()} | Total Hooks: ${totalHooks}
`

fs.writeFileSync(outputPath, content, 'utf-8')
console.log(`llms.txt generated: ${totalHooks} hooks, ${(content.length / 1024).toFixed(1)} KB`)
