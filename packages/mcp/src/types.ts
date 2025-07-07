export interface HookInfo {
  name: string
  category: string
  description: string
  usage?: string
  example?: string
  api?: {
    returns?: string
    arguments?: ApiArgument[]
  }
  url: string
}

export interface ApiArgument {
  name: string
  description: string
  type: string
  defaultValue?: string
  required?: boolean
}

export interface HookMetadata {
  name: string
  category: string
  path: string
}
