import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SERVER_PATH = fileURLToPath(new URL('../dist/index.js', import.meta.url))
const PORT = 38473

async function waitForHealth(url: string, deadlineMs = 8000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < deadlineMs) {
    try {
      const res = await fetch(url)
      if (res.ok)
        return
    }
    catch {
      // not up yet
    }
    await new Promise(r => setTimeout(r, 100))
  }
  throw new Error(`server did not become ready at ${url}`)
}

describe('@reactuses/mcp over streamable HTTP', () => {
  let proc: ChildProcessWithoutNullStreams
  let client: Client

  beforeAll(async () => {
    proc = spawn(process.execPath, [SERVER_PATH, '--http', String(PORT)], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    proc.stderr?.on('data', () => { /* swallow */ })
    proc.stdout?.on('data', () => { /* swallow */ })

    await waitForHealth(`http://127.0.0.1:${PORT}/healthz`)

    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${PORT}/mcp`))
    client = new Client({ name: 'reactuses-mcp-http-test', version: '0.0.0' })
    await client.connect(transport)
  })

  afterAll(async () => {
    await client?.close()
    proc?.kill('SIGTERM')
    await new Promise(r => setTimeout(r, 100))
    if (!proc.killed)
      proc.kill('SIGKILL')
  })

  it('serves the healthz endpoint', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/healthz`)
    expect(res.ok).toBe(true)
    const json = await res.json() as { ok: boolean, hooks: number, version: string }
    expect(json.ok).toBe(true)
    expect(json.hooks).toBeGreaterThanOrEqual(100)
    expect(json.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('rejects GET /mcp with 405', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/mcp`)
    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('POST')
  })

  it('handles a tools/list round trip via HTTP', async () => {
    const { tools } = await client.listTools()
    const names = tools.map(t => t.name).sort()
    expect(names).toEqual(['get_hook', 'list_hooks', 'search_hooks'])
  })

  it('handles a get_hook call via HTTP', async () => {
    const result = await client.callTool({
      name: 'get_hook',
      arguments: { hook_name: 'useClipboard' },
    })
    expect(result.isError).toBeFalsy()
    const sc = result.structuredContent as { name: string }
    expect(sc.name).toBe('useClipboard')
  })
})
