import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { HooksDataManager } from './hooks-data.js'
import { registerPrompts } from './prompts.js'
import { registerResources } from './resources.js'
import { registerTools } from './tools.js'

export function createServer(): McpServer {
  const hooks = new HooksDataManager(__ALL_HOOKS__)

  const server = new McpServer(
    {
      name: '@reactuses/mcp',
      version: __PKG_VERSION__,
      websiteUrl: 'https://reactuse.com',
    },
    {
      capabilities: {
        tools: {},
        resources: { listChanged: false },
        prompts: { listChanged: false },
        logging: {},
      },
    },
  )

  registerTools(server, hooks)
  registerResources(server, hooks)
  registerPrompts(server, hooks)

  return server
}
