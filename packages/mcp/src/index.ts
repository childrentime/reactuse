import { randomUUID } from 'node:crypto'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { createServer } from './server.js'

interface CliOptions {
  mode: 'stdio' | 'http'
  port: number
  host: string
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    mode: 'stdio',
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '127.0.0.1',
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--http') {
      opts.mode = 'http'
      const next = argv[i + 1]
      if (next && /^\d+$/.test(next)) {
        opts.port = Number(next)
        i++
      }
    }
    else if (arg === '--port') {
      opts.port = Number(argv[++i])
    }
    else if (arg === '--host') {
      opts.host = argv[++i]
    }
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
    else if (arg === '--version' || arg === '-v') {
      process.stdout.write(`@reactuses/mcp v${__PKG_VERSION__}\n`)
      process.exit(0)
    }
  }
  return opts
}

function printHelp() {
  process.stdout.write(`@reactuses/mcp v${__PKG_VERSION__}

MCP server for the ReactUse React Hooks library.

USAGE
  reactuses-mcp                  # stdio (default)
  reactuses-mcp --http [port]    # Streamable HTTP, default port 3000
  reactuses-mcp --port 8080      # set HTTP port explicitly
  reactuses-mcp --host 0.0.0.0   # bind HTTP host (default 127.0.0.1)

ENV
  PORT, HOST    same as --port, --host

LINKS
  Docs: https://reactuse.com
  Repo: https://github.com/childrentime/reactuse
`)
}

async function startStdio() {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write(`@reactuses/mcp v${__PKG_VERSION__} running on stdio\n`)
}

async function startHttp(opts: CliOptions) {
  const app = createMcpExpressApp({ host: opts.host })
  const transports = new Map<string, StreamableHTTPServerTransport>()

  app.post('/mcp', async (req, res) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      let transport: StreamableHTTPServerTransport | undefined = sessionId ? transports.get(sessionId) : undefined

      if (!transport) {
        if (!isInitializeRequest(req.body)) {
          res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Bad Request: missing session for non-initialize request' },
            id: null,
          })
          return
        }

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: id => {
            transports.set(id, transport!)
          },
        })

        transport.onclose = () => {
          if (transport!.sessionId)
            transports.delete(transport!.sessionId)
        }

        const server = createServer()
        await server.connect(transport)
      }

      await transport.handleRequest(req, res, req.body)
    }
    catch (err) {
      process.stderr.write(`HTTP error: ${err instanceof Error ? err.stack : String(err)}\n`)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        })
      }
    }
  })

  app.get('/mcp', (_req, res) => {
    res.status(405).set('Allow', 'POST').send('Method Not Allowed')
  })

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, version: __PKG_VERSION__, hooks: __ALL_HOOKS__.length })
  })

  app.listen(opts.port, opts.host, () => {
    process.stderr.write(`@reactuses/mcp v${__PKG_VERSION__} listening on http://${opts.host}:${opts.port}/mcp\n`)
  })
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.mode === 'http')
    await startHttp(opts)
  else
    await startStdio()
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exit(1)
})
