import fs from 'node:fs'
import path from 'node:path'

export interface HookData {
  name: string
  category: string
  url: string
  description: string
  body: string
  api: string
}

const REPO_ROOT = path.resolve(__dirname, '../../..')
const REGISTRY_PATH = path.join(REPO_ROOT, 'scripts/hook-registry.json')
const ASTRO_DOCS = path.join(REPO_ROOT, 'packages/website-astro/src/content/docs')
const API_DIR = path.join(REPO_ROOT, 'packages/website-docusaurus/api')

const aliases: Record<string, string> = {
  useClickAway: 'useClickOutside',
  useCopyToClipboard: 'useClipboard',
}

function parseFrontmatter(raw: string): { fm: Record<string, string>, body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match)
    return { fm: {}, body: raw }
  const fm: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)/)
    if (kv) {
      fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
    }
  }
  return { fm, body: raw.slice(match[0].length).replace(/^\n+/, '') }
}

function stripImports(body: string): string {
  return body
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\n{3,}/gm, '\n\n')
}

function findMdxPath(hookName: string, category: string): string | null {
  const exact = path.join(ASTRO_DOCS, category, `${hookName}.mdx`)
  if (fs.existsSync(exact))
    return exact

  const dir = path.join(ASTRO_DOCS, category)
  if (!fs.existsSync(dir))
    return null
  const lower = hookName.toLowerCase()
  for (const f of fs.readdirSync(dir)) {
    if (f.toLowerCase() === `${lower}.mdx`)
      return path.join(dir, f)
  }
  return null
}

function loadApi(hookName: string): string {
  const target = aliases[hookName] || hookName
  const apiPath = path.join(API_DIR, `${target}-README.md`)
  if (!fs.existsSync(apiPath))
    return ''
  return fs.readFileSync(apiPath, 'utf-8').trim()
}

function generateHooks(): HookData[] {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`hook registry not found at ${REGISTRY_PATH}`)
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8')) as Record<
    string,
    { category: string, url: string }
  >

  const hooks: HookData[] = []

  for (const [name, meta] of Object.entries(registry)) {
    const mdxPath = findMdxPath(name, meta.category)
    if (!mdxPath) {
      continue
    }

    const raw = fs.readFileSync(mdxPath, 'utf-8')
    const { fm, body } = parseFrontmatter(raw)
    const cleaned = stripImports(body).replace(/^%%API%%\s*$/gm, '').trim()
    const description = fm.description || ''
    const api = loadApi(name)

    hooks.push({
      name,
      category: meta.category,
      url: meta.url,
      description,
      body: cleaned,
      api,
    })
  }

  return hooks
}

export function getHooksAsString(): string {
  return JSON.stringify(generateHooks())
}
