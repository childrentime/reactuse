import fs from 'node:fs'
import path from 'node:path'

interface HookInfo {
  name: string
  category: string
  description: string
  path: string
}

interface CategoryInfo {
  name: string
  description: string
  hooks: HookInfo[]
}

function extractHookInfo(filePath: string, category: string): HookInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    // 提取 frontmatter 中的信息
    let inFrontmatter = false
    let description = ''
    let title = ''
    let collectingDescription = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.trim() === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true
        } else {
          break
        }
        continue
      }
      
      if (inFrontmatter) {
        if (line.startsWith('description:')) {
          const descValue = line.replace('description:', '').trim()
          if (descValue && descValue !== '>-' && descValue !== '>') {
            description = descValue
          } else {
            // 多行描述，继续收集下一行
            collectingDescription = true
          }
        } else if (collectingDescription && line.trim() && !line.includes(':')) {
          // 继续收集描述的多行内容
          description += (description ? ' ' : '') + line.trim()
        } else if (line.includes(':')) {
          // 遇到新的字段，停止收集描述
          collectingDescription = false
        }
        
        if (line.startsWith('sidebar_label:')) {
          title = line.replace('sidebar_label:', '').trim()
        }
      }
    }
    
    // 如果没有从 frontmatter 获取到，尝试从文件内容获取
    if (!title) {
      const titleMatch = content.match(/^#\s+(\w+)/m)
      if (titleMatch) {
        title = titleMatch[1]
      }
    }
    
    if (!description) {
      // 获取标题后的第一行作为描述
      const descMatch = content.match(/^#\s+\w+\s*\n\s*\n(.+)/m)
      if (descMatch) {
        description = descMatch[1].trim()
      }
    }
    
    if (!title) return null
    
    const fileName = path.basename(filePath, '.mdx')
    const hookPath = `/${category}/${fileName}/`
    
    return {
      name: title,
      category,
      description: description || '',
      path: hookPath
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
    return null
  }
}

function getCategoryInfo(categoryPath: string, categoryName: string): CategoryInfo {
  const categoryJsonPath = path.join(categoryPath, '_category_.json')
  let description = ''
  
  if (fs.existsSync(categoryJsonPath)) {
    const categoryJson = JSON.parse(fs.readFileSync(categoryJsonPath, 'utf-8'))
    description = categoryJson.link?.description || ''
  }
  
  const hooks: HookInfo[] = []
  const files = fs.readdirSync(categoryPath)
  
  for (const file of files) {
    if (file.endsWith('.mdx') && file !== 'intro.mdx') {
      const filePath = path.join(categoryPath, file)
      const hookInfo = extractHookInfo(filePath, categoryName)
      if (hookInfo) {
        hooks.push(hookInfo)
      }
    }
  }
  
  // 按名称排序
  hooks.sort((a, b) => a.name.localeCompare(b.name))
  
  return {
    name: categoryName,
    description,
    hooks
  }
}

function generateLlmTxt(): string {
  const docsPath = path.resolve(__dirname, '../docs')
  const categories = ['state', 'effect', 'element', 'browser', 'integrations']
  
  let content = `# ReactUse - Collection of Essential React Hooks

Website: https://reactuse.com | GitHub: https://github.com/childrentime/reactuse | NPM: https://www.npmjs.com/package/@reactuses/core

## Overview

ReactUse is a comprehensive collection of custom React Hooks designed to supercharge your functional components. It provides a wide range of reusable hooks for state management, side effects, DOM manipulation, browser APIs, and more.

## Key Features

- Tree-shakable: Only bundle the hooks you use
- TypeScript Support: Full type definitions included
- SSR Compatible: Works with Next.js and other SSR frameworks
- Minimal Dependencies: Lightweight with only essential dependencies
- Modern React: Built for React 16.8+ with hooks
- Well Documented: Comprehensive docs with live examples

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
      <button onClick={() => toggle(true)}>set ON</button>
      <button onClick={() => toggle(false)}>set OFF</button>
    </div>
  )
}
\`\`\`

## Documentation Structure

The hooks are organized into the following categories:

`

  const allCategories: CategoryInfo[] = []
  
  for (const category of categories) {
    const categoryPath = path.join(docsPath, category)
    if (fs.existsSync(categoryPath)) {
      const categoryInfo = getCategoryInfo(categoryPath, category)
      allCategories.push(categoryInfo)
    }
  }
  
  // 添加分类概述
  for (const category of allCategories) {
    const categoryTitle = category.name.charAt(0).toUpperCase() + category.name.slice(1)
    content += `### ${categoryTitle}\n\n`
    if (category.description) {
      content += `${category.description} `
    }
    content += `(${category.hooks.length} hooks available)\n\n`
  }
  
  content += `\n## Complete Hook Reference\n\n`
  
  // 添加每个分类的详细列表
  for (const category of allCategories) {
    const categoryTitle = category.name.charAt(0).toUpperCase() + category.name.slice(1)
    content += `### ${categoryTitle} Hooks\n\n`
    
    for (const hook of category.hooks) {
      content += `#### ${hook.name}\n\n`
      if (hook.description) {
        content += `${hook.description}\n\n`
      }
      content += `Documentation: https://reactuse.com${hook.path}\n\n`
      content += `Usage: \`import { ${hook.name} } from '@reactuses/core'\`\n\n`
    }
    
    content += '\n'
  }
  
  // 添加其他重要信息
  content += `## MCP Support

ReactUse supports Model Context Protocol (MCP) integration for enhanced command-line support:

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

Discord: https://discord.gg/HMsq6cFkKp | Issues: https://github.com/childrentime/reactuse/issues | Contributing: https://github.com/childrentime/reactuse/blob/main/CONTRIBUTING.md

## License

UnLicense - Use freely without restrictions

## Companies Using ReactUse

PDD (Pinduoduo) - E-Commerce | Shopee - E-Commerce | Ctrip - Travel Platform | Bambu Lab - 3D Printing

---

Generated: ${new Date().toISOString()} | Total Hooks: ${allCategories.reduce((sum, cat) => sum + cat.hooks.length, 0)}
`
  
  return content
}

function main() {
  try {
    console.log('Generating llm.txt...')
    
    const content = generateLlmTxt()
    
    // 写入到 static 目录
    const staticPath = path.resolve(__dirname, '../static')
    if (!fs.existsSync(staticPath)) {
      fs.mkdirSync(staticPath, { recursive: true })
    }
    
    const outputPath = path.join(staticPath, 'llm.txt')
    fs.writeFileSync(outputPath, content, 'utf-8')
    
    console.log(`✅ llm.txt generated successfully at ${outputPath}`)
    console.log(`   File size: ${(content.length / 1024).toFixed(2)} KB`)
    
    // 统计信息
    const lines = content.split('\n').length
    const hooks = (content.match(/#### /g) || []).length
    console.log(`   Lines: ${lines}`)
    console.log(`   Total hooks documented: ${hooks}`)
  } catch (error) {
    console.error('❌ Error generating llm.txt:', error)
    process.exit(1)
  }
}

main()

