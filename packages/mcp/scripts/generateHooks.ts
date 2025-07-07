import fs from 'node:fs'
import path from 'node:path'

interface HookInfo {
  name: string
  category: string
  path: string
}

function generateHooks(): HookInfo[] {
  const packagesDir = path.join(__dirname, '../../website-docusaurus')
  const allHooks: HookInfo[] = []

  // 基于你的目录结构
  const categories = ['state', 'effect', 'browser', 'element', 'integrations']

  categories.forEach(category => {
    const categoryPath = path.join(packagesDir, 'docs', category)

    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath)

      files.forEach(file => {
        if (file.endsWith('.mdx')) {
          const hookName = file.replace('.mdx', '')
          allHooks.push({
            name: hookName,
            category,
            path: `/${category}/${hookName}`,
          })
        }
      })
    }
  })

  return allHooks
}

// 导出为可以被 tsup 使用的格式
export function getHooksAsString(): string {
  const hooks = generateHooks()
  return JSON.stringify(hooks)
}
