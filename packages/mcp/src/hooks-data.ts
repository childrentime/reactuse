import type { HookCategory, HookData } from './types.js'

export class HooksDataManager {
  private readonly hooksByName = new Map<string, HookData>()
  private readonly hooksByCategory = new Map<HookCategory, HookData[]>()
  readonly all: HookData[]

  constructor(hooks: HookData[]) {
    this.all = hooks
    for (const hook of hooks) {
      this.hooksByName.set(hook.name.toLowerCase(), hook)
      const cat = hook.category as HookCategory
      const list = this.hooksByCategory.get(cat) ?? []
      list.push(hook)
      this.hooksByCategory.set(cat, list)
    }
  }

  get(name: string): HookData | undefined {
    return this.hooksByName.get(name.toLowerCase())
  }

  byCategory(category: HookCategory): HookData[] {
    return this.hooksByCategory.get(category) ?? []
  }

  categories(): HookCategory[] {
    return [...this.hooksByCategory.keys()]
  }

  search(query: string, limit = 20): Array<HookData & { score: number }> {
    const q = query.toLowerCase().trim()
    if (!q)
      return []

    const results: Array<HookData & { score: number }> = []
    for (const hook of this.all) {
      const score = this.score(hook, q)
      if (score > 0) {
        results.push({ ...hook, score })
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  private score(hook: HookData, q: string): number {
    const name = hook.name.toLowerCase()
    if (name === q)
      return 1000
    if (name === `use${q}` || name === `use${q.replace(/^use/, '')}`)
      return 900
    if (name.startsWith(q))
      return 500
    if (name.includes(q))
      return 200

    const desc = hook.description.toLowerCase()
    if (desc.includes(q))
      return 50

    const body = hook.body.toLowerCase()
    if (body.includes(q))
      return 10

    if (hook.category.toLowerCase().includes(q))
      return 5

    return 0
  }
}
