import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { HooksDataManager } from './hooks-data.js'

export function registerResources(server: McpServer, hooks: HooksDataManager): void {
  server.registerResource(
    'reactuse-index',
    'reactuse://index',
    {
      title: 'ReactUse hook index',
      description: 'JSON index of all 110+ @reactuses/core hooks (name, category, URL, description).',
      mimeType: 'application/json',
    },
    async uri => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(
            hooks.all.map(h => ({
              name: h.name,
              category: h.category,
              url: h.url,
              description: h.description,
            })),
            null,
            2,
          ),
        },
      ],
    }),
  )

  server.registerResource(
    'reactuse-hook',
    new ResourceTemplate('reactuse://hook/{name}', {
      list: async () => ({
        resources: hooks.all.map(h => ({
          uri: `reactuse://hook/${h.name}`,
          name: h.name,
          title: `${h.name} (${h.category})`,
          description: h.description,
          mimeType: 'text/markdown',
        })),
      }),
      complete: {
        name: async value => hooks.all
          .map(h => h.name)
          .filter(n => n.toLowerCase().startsWith(value.toLowerCase()))
          .slice(0, 25),
      },
    }),
    {
      title: 'ReactUse hook documentation',
      description: 'Full markdown documentation for a specific hook. URI: reactuse://hook/<hookName>',
      mimeType: 'text/markdown',
    },
    async (uri, { name }) => {
      const hookName = Array.isArray(name) ? name[0] : name
      const hook = hooks.get(hookName)
      if (!hook) {
        throw new Error(`Hook "${hookName}" not found`)
      }

      const markdown = [
        `# ${hook.name}`,
        '',
        `- **Category**: ${hook.category}`,
        `- **Docs**: ${hook.url}`,
        '',
        hook.description,
        '',
        hook.body,
        hook.api ? `\n## API\n\n${hook.api}` : '',
      ].join('\n')

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: markdown,
          },
        ],
      }
    },
  )
}
