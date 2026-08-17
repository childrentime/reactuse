import { resolve } from 'node:path'
import fs from 'node:fs'
import { generateMarkdown } from '@reactuses/ts-document'
import fg from 'fast-glob'
import type { GenerateMarkdownConfig } from '@reactuses/ts-document/lib/interface'

const cwd = resolve(__dirname, '../src')
const interfaces = fg.sync('**/interface.ts', { cwd, absolute: true })

// Consumed by the astro site's %%API%% remark plugin and by packages/mcp.
const apiDir = resolve(__dirname, '../../website-astro/api')

// ts-document lang -> suffix on the generated `<hook>-README<suffix>.md`
const locales: Array<[lang: string, suffix: string]> = [
  ['en', ''],
  ['zh', '-zhHans'],
  ['zh-Hant', '-zhHant'],
]

for (const [lang, suffix] of locales) {
  const config: GenerateMarkdownConfig = { sourceFilesPaths: interfaces, lang }

  for (const file of interfaces) {
    const res = generateMarkdown(file, config) as Record<string, string> | undefined
    if (!res || !Object.keys(res).length)
      continue

    const dir = file.slice(0, file.lastIndexOf('/'))
    const name = dir.slice(dir.lastIndexOf('/') + 1)
    fs.writeFileSync(resolve(apiDir, `${name}-README${suffix}.md`), Object.values(res).join('\n\n'))
  }
}
