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
    this.allHooks = __ALL_HOOKS__
  }

  async fetchHookDoc(hookName: string): Promise<HookInfo | null> {
    if (this.hooksCache.has(hookName)) {
      return this.hooksCache.get(hookName)!
    }

    const hookMeta = this.allHooks.find(h => h.name === hookName)
    if (!hookMeta) {
      return null
    }

    try {
      const url = `${this.baseUrl}${hookMeta.path}`
      const response = await axios.get(url)
      const $ = cheerio.load(response.data)

      const hookInfo = this.parseHookPage($, hookMeta, url)

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

    const firstParagraph = $('h1').first().next('p')
    if (firstParagraph.length) {
      hookInfo.description = firstParagraph.text().trim()
    }

    const usageSection = $('h2, h3').filter((_, el) => $(el).text().includes('Usage'))
    if (usageSection.length) {
      const codeBlock = usageSection.nextAll('pre').first()
      if (codeBlock.length) {
        hookInfo.usage = codeBlock.text().trim()
      }
    }

    const liveEditorCode = $('pre code').first()
    if (liveEditorCode.length) {
      hookInfo.example = liveEditorCode.text().trim()
    }

    const apiSection = $('h2, h3').filter((_, el) => $(el).text().includes('API'))
    if (apiSection.length) {
      hookInfo.api = this.parseApiSection($, apiSection)
    }

    return hookInfo
  }

  private parseApiSection($: cheerio.CheerioAPI, apiSection: cheerio.Cheerio<any>) {
    const api: any = {}

    const returnsHeader = apiSection.nextAll('h3, h4').filter((_, el) => $(el).text().includes('Returns'))
    if (returnsHeader.length) {
      const returnsContent = returnsHeader.next()
      if (returnsContent.length) {
        api.returns = returnsContent.text().trim()
      }
    }

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

  getAllHooks(): HookMetadata[] {
    return this.allHooks
  }

  getHooksByCategory(category: string): HookMetadata[] {
    return this.allHooks.filter(hook => hook.category === category)
  }

  getAllCategories(): string[] {
    return [...new Set(this.allHooks.map(hook => hook.category))]
  }

  searchHooks(query: string): HookMetadata[] {
    const searchTerm = query.toLowerCase()
    return this.allHooks.filter(hook =>
      hook.name.toLowerCase().includes(searchTerm)
      || hook.category.toLowerCase().includes(searchTerm),
    )
  }
}
