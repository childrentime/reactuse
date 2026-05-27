import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SERVER_PATH = fileURLToPath(new URL('../dist/index.js', import.meta.url))

describe('@reactuses/mcp over stdio', () => {
  let client: Client

  beforeAll(async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER_PATH],
      stderr: 'pipe',
    })
    client = new Client({ name: 'reactuses-mcp-test', version: '0.0.0' })
    await client.connect(transport)
  })

  afterAll(async () => {
    await client?.close()
  })

  describe('handshake', () => {
    it('exposes the expected server capabilities', () => {
      const caps = client.getServerCapabilities()
      expect(caps).toBeDefined()
      expect(caps!.tools).toBeDefined()
      expect(caps!.resources).toBeDefined()
      expect(caps!.prompts).toBeDefined()
      expect(caps!.logging).toBeDefined()
    })

    it('reports server info', () => {
      const info = client.getServerVersion()
      expect(info?.name).toBe('@reactuses/mcp')
      expect(info?.version).toMatch(/^\d+\.\d+\.\d+/)
    })
  })

  describe('tools/list', () => {
    it('returns 3 tools with structured schemas and annotations', async () => {
      const { tools } = await client.listTools()
      const names = tools.map(t => t.name).sort()
      expect(names).toEqual(['get_hook', 'list_hooks', 'search_hooks'])

      for (const tool of tools) {
        expect(tool.title).toBeTruthy()
        expect(tool.description).toBeTruthy()
        expect(tool.inputSchema).toBeDefined()
        expect(tool.outputSchema).toBeDefined()
        expect(tool.annotations?.readOnlyHint).toBe(true)
        expect(tool.annotations?.idempotentHint).toBe(true)
        expect(tool.annotations?.openWorldHint).toBe(false)
      }
    })
  })

  describe('get_hook', () => {
    it('returns structured content for a known hook (case-insensitive)', async () => {
      const result = await client.callTool({
        name: 'get_hook',
        arguments: { hook_name: 'usetoggle' },
      })

      expect(result.isError).toBeFalsy()
      const sc = result.structuredContent as Record<string, unknown>
      expect(sc).toBeDefined()
      expect(sc.name).toBe('useToggle')
      expect(sc.category).toBe('state')
      expect(sc.url).toContain('/state/usetoggle/')
      expect(typeof sc.description).toBe('string')
      expect((sc.description as string).length).toBeGreaterThan(20)
      expect(typeof sc.body).toBe('string')
      expect((sc.body as string)).toContain('useToggle')
      expect(typeof sc.api).toBe('string')
      expect((sc.api as string)).toContain('Returns')
    })

    it('returns isError=true for unknown hook', async () => {
      const result = await client.callTool({
        name: 'get_hook',
        arguments: { hook_name: 'useDefinitelyDoesNotExist' },
      })

      expect(result.isError).toBe(true)
      const text = (result.content as Array<{ type: string, text: string }>)[0].text
      expect(text).toMatch(/not found/i)
    })

    it('reports a validation error when required field is missing', async () => {
      const result = await client.callTool({
        name: 'get_hook',
        arguments: {} as Record<string, unknown>,
      })
      expect(result.isError).toBe(true)
      const text = (result.content as Array<{ text: string }>)[0].text
      expect(text).toMatch(/Invalid|expected string/i)
    })
  })

  describe('list_hooks', () => {
    it('lists all hooks when no category is given', async () => {
      const result = await client.callTool({ name: 'list_hooks', arguments: {} })
      expect(result.isError).toBeFalsy()
      const sc = result.structuredContent as { total: number, hooks: Array<{ name: string, category: string }> }
      expect(sc.total).toBeGreaterThanOrEqual(100)
      expect(sc.hooks.length).toBe(sc.total)
      const categories = new Set(sc.hooks.map(h => h.category))
      expect(categories.size).toBeGreaterThanOrEqual(4)
    })

    it('filters by category', async () => {
      const result = await client.callTool({
        name: 'list_hooks',
        arguments: { category: 'state' },
      })
      expect(result.isError).toBeFalsy()
      const sc = result.structuredContent as { total: number, category: string, hooks: Array<{ category: string }> }
      expect(sc.category).toBe('state')
      expect(sc.total).toBeGreaterThan(0)
      expect(sc.hooks.every(h => h.category === 'state')).toBe(true)
    })

    it('reports a validation error for an invalid category', async () => {
      const result = await client.callTool({
        name: 'list_hooks',
        arguments: { category: 'not-a-category' },
      })
      expect(result.isError).toBe(true)
      const text = (result.content as Array<{ text: string }>)[0].text
      expect(text).toMatch(/Invalid|expected one of/i)
    })
  })

  describe('search_hooks', () => {
    it('returns relevance-ranked results', async () => {
      const result = await client.callTool({
        name: 'search_hooks',
        arguments: { query: 'storage' },
      })
      expect(result.isError).toBeFalsy()
      const sc = result.structuredContent as { total: number, results: Array<{ name: string, score: number }> }
      expect(sc.total).toBeGreaterThan(0)
      const names = sc.results.map(r => r.name.toLowerCase())
      expect(names.some(n => n.includes('storage'))).toBe(true)
      for (let i = 1; i < sc.results.length; i++)
        expect(sc.results[i - 1].score).toBeGreaterThanOrEqual(sc.results[i].score)
    })

    it('honours the limit option', async () => {
      const result = await client.callTool({
        name: 'search_hooks',
        arguments: { query: 'use', limit: 3 },
      })
      const sc = result.structuredContent as { results: unknown[] }
      expect(sc.results.length).toBeLessThanOrEqual(3)
    })

    it('returns empty results gracefully', async () => {
      const result = await client.callTool({
        name: 'search_hooks',
        arguments: { query: 'zzzzzzzzzzzzznoMatchHere' },
      })
      expect(result.isError).toBeFalsy()
      const sc = result.structuredContent as { total: number, results: unknown[] }
      expect(sc.total).toBe(0)
      expect(sc.results.length).toBe(0)
    })
  })

  describe('resources/list', () => {
    it('lists the static index and the per-hook template results', async () => {
      const { resources } = await client.listResources()
      const uris = resources.map(r => r.uri)
      expect(uris).toContain('reactuse://index')
      expect(uris.some(u => u.startsWith('reactuse://hook/'))).toBe(true)
      const hookCount = uris.filter(u => u.startsWith('reactuse://hook/')).length
      expect(hookCount).toBeGreaterThanOrEqual(100)
    })

    it('lists the resource template', async () => {
      const { resourceTemplates } = await client.listResourceTemplates()
      const t = resourceTemplates.find(r => r.uriTemplate.includes('reactuse://hook/'))
      expect(t).toBeDefined()
    })
  })

  describe('resources/read', () => {
    it('reads the index resource as JSON', async () => {
      const result = await client.readResource({ uri: 'reactuse://index' })
      expect(result.contents).toHaveLength(1)
      const c = result.contents[0]
      expect(c.mimeType).toBe('application/json')
      const parsed = JSON.parse(c.text as string) as Array<{ name: string }>
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBeGreaterThanOrEqual(100)
    })

    it('reads a templated hook resource as markdown', async () => {
      const result = await client.readResource({ uri: 'reactuse://hook/useToggle' })
      expect(result.contents).toHaveLength(1)
      const c = result.contents[0]
      expect(c.mimeType).toBe('text/markdown')
      const text = c.text as string
      expect(text).toContain('# useToggle')
      expect(text).toContain('state')
    })

    it('errors on unknown hook URI', async () => {
      await expect(
        client.readResource({ uri: 'reactuse://hook/useNopeNope' }),
      ).rejects.toThrow(/not found/)
    })
  })

  describe('prompts/list', () => {
    it('exposes find_hook and migrate_from_vueuse', async () => {
      const { prompts } = await client.listPrompts()
      const names = prompts.map(p => p.name).sort()
      expect(names).toEqual(['find_hook', 'migrate_from_vueuse'])
    })
  })

  describe('prompts/get', () => {
    it('renders find_hook with the task interpolated', async () => {
      const result = await client.getPrompt({
        name: 'find_hook',
        arguments: { task: 'persist user settings to localStorage' },
      })
      expect(result.messages).toHaveLength(1)
      const m = result.messages[0]
      expect(m.role).toBe('user')
      expect(m.content.type).toBe('text')
      const text = (m.content as { text: string }).text
      expect(text).toContain('persist user settings to localStorage')
      expect(text).toContain('useLocalStorage')
    })

    it('migrate_from_vueuse maps known composable to ReactUse hook', async () => {
      const result = await client.getPrompt({
        name: 'migrate_from_vueuse',
        arguments: { vueuse_name: 'useStorage' },
      })
      const text = (result.messages[0].content as { text: string }).text
      expect(text).toContain('VueUse')
      expect(text).toContain('useLocalStorage')
    })

    it('migrate_from_vueuse falls back to search when no direct map exists', async () => {
      const result = await client.getPrompt({
        name: 'migrate_from_vueuse',
        arguments: { vueuse_name: 'useTotallyMadeUp' },
      })
      const text = (result.messages[0].content as { text: string }).text
      expect(text).toContain('doesn\'t have a direct equivalent')
    })
  })
})
