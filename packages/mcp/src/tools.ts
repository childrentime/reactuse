import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod/v4'
import type { HooksDataManager } from './hooks-data.js'
import { CATEGORIES } from './types.js'

const CategoryEnum = z.enum(CATEGORIES)

const HookSummary = z.object({
  name: z.string(),
  category: CategoryEnum,
  url: z.url(),
  description: z.string(),
})

const HookDetails = HookSummary.extend({
  body: z.string().describe('Markdown body of the hook documentation (usage, examples, notes)'),
  api: z.string().describe('Auto-generated API table (arguments, returns)'),
})

export function registerTools(server: McpServer, hooks: HooksDataManager): void {
  server.registerTool(
    'get_hook',
    {
      title: 'Get hook details',
      description: 'Fetch full documentation (description, usage example, API table) for a specific @reactuses/core React hook by name.',
      inputSchema: {
        hook_name: z.string().describe('Hook name, e.g. "useToggle", "useClipboard". Case-insensitive.'),
      },
      outputSchema: HookDetails.shape,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ hook_name }) => {
      const hook = hooks.get(hook_name)
      if (!hook) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Hook "${hook_name}" not found. Use the list_hooks tool to see all available hooks.`,
            },
          ],
        }
      }

      const structuredContent = {
        name: hook.name,
        category: hook.category,
        url: hook.url,
        description: hook.description,
        body: hook.body,
        api: hook.api,
      }

      const text = [
        `# ${hook.name}`,
        '',
        `**Category**: ${hook.category}`,
        `**Docs**: ${hook.url}`,
        '',
        hook.description,
        '',
        hook.body,
        '',
        hook.api ? `## API\n\n${hook.api}` : '',
      ].filter(Boolean).join('\n')

      return {
        structuredContent,
        content: [{ type: 'text', text }],
      }
    },
  )

  server.registerTool(
    'list_hooks',
    {
      title: 'List hooks',
      description: 'List all available @reactuses/core hooks, optionally filtered by category.',
      inputSchema: {
        category: CategoryEnum.optional().describe('Optional category filter. One of: browser, effect, element, state, integrations.'),
      },
      outputSchema: {
        total: z.number().int(),
        category: z.string().optional(),
        hooks: z.array(HookSummary),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ category }) => {
      const subset = category ? hooks.byCategory(category) : hooks.all
      const summary = subset.map(h => ({
        name: h.name,
        category: h.category,
        url: h.url,
        description: h.description,
      }))

      const structuredContent = {
        total: summary.length,
        category,
        hooks: summary,
      }

      const lines: string[] = []
      if (category) {
        lines.push(`# ReactUse ${category} hooks (${summary.length})\n`)
        for (const h of summary)
          lines.push(`- **${h.name}** — ${h.description || h.url}`)
      }
      else {
        lines.push(`# ReactUse hooks (${summary.length} total)\n`)
        for (const cat of hooks.categories()) {
          const list = hooks.byCategory(cat)
          lines.push(`\n## ${cat} (${list.length})`)
          for (const h of list)
            lines.push(`- **${h.name}** — ${h.description || h.url}`)
        }
      }

      return {
        structuredContent,
        content: [{ type: 'text', text: lines.join('\n') }],
      }
    },
  )

  server.registerTool(
    'search_hooks',
    {
      title: 'Search hooks',
      description: 'Search @reactuses/core hooks by name, description, or content. Results are ranked by relevance.',
      inputSchema: {
        query: z.string().min(1).describe('Search query (matches hook names, descriptions, and body text).'),
        limit: z.number().int().min(1).max(50).optional().describe('Maximum number of results (default 20).'),
      },
      outputSchema: {
        query: z.string(),
        total: z.number().int(),
        results: z.array(HookSummary.extend({ score: z.number() })),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, limit }) => {
      const matches = hooks.search(query, limit ?? 20)
      const results = matches.map(m => ({
        name: m.name,
        category: m.category,
        url: m.url,
        description: m.description,
        score: m.score,
      }))

      const structuredContent = {
        query,
        total: results.length,
        results,
      }

      const text = results.length === 0
        ? `No hooks matched "${query}".`
        : [
            `Found ${results.length} hook(s) matching "${query}":\n`,
            ...results.map(r => `- **${r.name}** (${r.category}) — ${r.description || r.url}`),
          ].join('\n')

      return {
        structuredContent,
        content: [{ type: 'text', text }],
      }
    },
  )
}
