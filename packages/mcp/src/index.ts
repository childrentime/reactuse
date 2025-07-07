import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { HooksDataManager } from './hooks-data.js'
import type { HookInfo } from './types.js'

// Create server instance
const server = new McpServer({
  name: '@reactuses/mcp',
  version: '1.0.0',
  capabilities: {
    resources: {},
    tools: {},
  },
})

// Initialize hooks manager
const hooksManager = new HooksDataManager()

// Helper function to format hook details
function formatHookDetails(hookInfo: HookInfo): string {
  let details = `# ${hookInfo.name}\n\n`
  details += `**Category:** ${hookInfo.category}\n\n`

  if (hookInfo.description) {
    details += `**Description:** ${hookInfo.description}\n\n`
  }

  if (hookInfo.example) {
    details += `**Example:**\n\`\`\`tsx\n${hookInfo.example}\n\`\`\`\n\n`
  }

  if (hookInfo.api) {
    details += `**API:**\n\n`

    if (hookInfo.api.returns) {
      details += `**Returns:** ${hookInfo.api.returns}\n\n`
    }

    if (hookInfo.api.arguments && hookInfo.api.arguments.length > 0) {
      details += `**Arguments:**\n`
      hookInfo.api.arguments.forEach(arg => {
        details += `- \`${arg.name}\` (\`${arg.type}\`)${arg.required ? ' *required*' : ''}: ${arg.description}`
        if (arg.defaultValue && arg.defaultValue !== '-') {
          details += ` (default: \`${arg.defaultValue}\`)`
        }
        details += '\n'
      })
      details += '\n'
    }
  }

  details += `**Documentation:** ${hookInfo.url}\n`

  return details
}

// Register tools using the new server.tool() method
server.tool(
  'get-hook-details',
  'Get detailed information about a specific @reactuse/core react hook',
  {
    hookName: z.string().describe('The name of the hook to get details for (e.g., useToggle, useBroadcastChannel)'),
  },
  async ({ hookName }) => {
    const hookInfo = await hooksManager.fetchHookDoc(hookName)

    if (!hookInfo) {
      return {
        content: [
          {
            type: 'text',
            text: `Hook "${hookName}" not found. Please check the hook name and try again.`,
          },
        ],
      }
    }

    const detailsText = formatHookDetails(hookInfo)

    return {
      content: [
        {
          type: 'text',
          text: detailsText,
        },
      ],
    }
  },
)

server.tool(
  'list-hooks',
  'List all available react hooks or hooks in a specific category',
  {
    category: z.string().optional().describe('Optional category to filter hooks (browser, effect, element, state, integrations)'),
  },
  async ({ category }) => {
    if (category) {
      const hooks = hooksManager.getHooksByCategory(category)
      const hooksText = `ReactUse ${category} hooks:\n\n${hooks.map(hook => `- ${hook.name}`).join('\n')}`

      return {
        content: [
          {
            type: 'text',
            text: hooksText,
          },
        ],
      }
    }
    else {
      const categories = hooksManager.getAllCategories()
      const allHooks = hooksManager.getAllHooks()

      let result = `ReactUse hooks (${allHooks.length} total):\n\n`

      categories.forEach(cat => {
        const categoryHooks = hooksManager.getHooksByCategory(cat)
        result += `**${cat}** (${categoryHooks.length}):\n`
        result += categoryHooks.map(hook => `- ${hook.name}`).join('\n')
        result += '\n\n'
      })

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      }
    }
  },
)

server.tool(
  'search-hooks',
  'Search for react hooks by name or category',
  {
    query: z.string().describe('Search query to find hooks'),
  },
  async ({ query }) => {
    const results = hooksManager.searchHooks(query)

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No hooks found matching "${query}".`,
          },
        ],
      }
    }

    const resultText = `Found ${results.length} hooks matching "${query}":\n\n${
      results.map(hook => `- ${hook.name} (${hook.category})`).join('\n')
    }`

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    }
  },
)

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('@reactuses/mcp MCP Server running on stdio')
}

main().catch(error => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
