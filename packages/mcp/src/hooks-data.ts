import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ApiArgument, HookInfo, HookMetadata } from './types.js'

export class HooksDataManager {
  private hooksCache: Map<string, HookInfo> = new Map()
  private allHooks: HookMetadata[] = []
  private readonly baseUrl = 'https://www.reactuse.com'

  constructor() {
    this.initializeHooksList()
  }

  private initializeHooksList() {
    // 从您提供的信息，我们可以预定义这些分类和 hooks
    // 实际项目中，您可能需要从 GitHub API 或其他方式动态获取
    this.allHooks = __ALL_HOOKS__
  }

  async fetchHookDoc(hookName: string): Promise<HookInfo | null> {
    // 检查缓存
    if (this.hooksCache.has(hookName)) {
      return this.hooksCache.get(hookName)!
    }

    // 查找 hook 元数据
    const hookMeta = this.allHooks.find(h => h.name === hookName)
    if (!hookMeta) {
      return null
    }

    try {
      const url = `${this.baseUrl}${hookMeta.path}`
      const response = await axios.get(url)
      const $ = cheerio.load(response.data)

      const hookInfo = this.parseHookPage($, hookMeta, url)

      // 缓存结果
      this.hooksCache.set(hookName, hookInfo)

      return hookInfo
    }
    catch (error) {
      console.error(`Failed to fetch documentation for ${hookName}:`, error)
      return null
    }
  }

  private parseHookPage($: cheerio.CheerioAPI, hookMeta: HookMetadata, url: string): HookInfo {
    const hookInfo: HookInfo = {
      name: hookMeta.name,
      category: hookMeta.category,
      description: '',
      url,
    }

    // 提取描述 - 通常在第一个 h1 标签后的 p 标签
    const firstParagraph = $('h1').first().next('p')
    if (firstParagraph.length) {
      hookInfo.description = firstParagraph.text().trim()
    }

    // 提取使用示例 - 查找 Usage 部分的代码
    const usageSection = $('h2, h3').filter((_, el) => $(el).text().includes('Usage'))
    if (usageSection.length) {
      const codeBlock = usageSection.nextAll('pre').first()
      if (codeBlock.length) {
        hookInfo.usage = codeBlock.text().trim()
      }
    }

    // 提取 Live Editor 中的示例代码
    const liveEditorCode = $('pre code').first()
    if (liveEditorCode.length) {
      hookInfo.example = liveEditorCode.text().trim()
    }

    // 提取 API 信息
    const apiSection = $('h2, h3').filter((_, el) => $(el).text().includes('API'))
    if (apiSection.length) {
      hookInfo.api = this.parseApiSection($, apiSection)
    }

    return hookInfo
  }

  private parseApiSection($: cheerio.CheerioAPI, apiSection: cheerio.Cheerio<any>) {
    const api: any = {}

    // 查找 Returns 部分
    const returnsHeader = apiSection.nextAll('h3, h4').filter((_, el) => $(el).text().includes('Returns'))
    if (returnsHeader.length) {
      const returnsContent = returnsHeader.next()
      if (returnsContent.length) {
        api.returns = returnsContent.text().trim()
      }
    }

    // 查找 Arguments 表格
    const argumentsHeader = apiSection.nextAll('h3, h4').filter((_, el) => $(el).text().includes('Arguments'))
    if (argumentsHeader.length) {
      const table = argumentsHeader.nextAll('table').first()
      if (table.length) {
        api.arguments = this.parseArgumentsTable($, table)
      }
    }

    return api
  }

  private parseArgumentsTable($: cheerio.CheerioAPI, table: cheerio.Cheerio<any>): ApiArgument[] {
    const args: ApiArgument[] = []

    table.find('tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length >= 3) {
        const name = $(cells[0]).text().trim()
        const description = $(cells[1]).text().trim()
        const type = $(cells[2]).text().trim()
        const defaultValue = cells.length > 3 ? $(cells[3]).text().trim() : undefined

        args.push({
          name,
          description,
          type,
          defaultValue: defaultValue === '-' ? undefined : defaultValue,
          required: description.includes('Required') || defaultValue === 'undefined (Required)',
        })
      }
    })

    return args
  }

  // 获取所有 hooks
  getAllHooks(): HookMetadata[] {
    return this.allHooks
  }

  // 按分类获取 hooks
  getHooksByCategory(category: string): HookMetadata[] {
    return this.allHooks.filter(hook => hook.category === category)
  }

  // 获取所有分类
  getAllCategories(): string[] {
    return [...new Set(this.allHooks.map(hook => hook.category))]
  }

  // 搜索 hooks
  searchHooks(query: string): HookMetadata[] {
    const searchTerm = query.toLowerCase()
    return this.allHooks.filter(hook =>
      hook.name.toLowerCase().includes(searchTerm)
      || hook.category.toLowerCase().includes(searchTerm),
    )
  }
}
