export interface HookData {
  name: string
  category: string
  url: string
  description: string
  body: string
  api: string
}

export type HookCategory = 'browser' | 'effect' | 'element' | 'state' | 'integrations'

export const CATEGORIES: HookCategory[] = ['browser', 'effect', 'element', 'state', 'integrations']
