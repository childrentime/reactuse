// Ping IndexNow with one or more URLs to nudge Bing/Copilot/Yandex to recrawl.
//
// Usage:
//   node scripts/pingIndexNow.mjs https://reactuse.com/blog/foo/ https://reactuse.com/state/useToggle/
//   node scripts/pingIndexNow.mjs --all   # read every URL from public/dist sitemap
//
// Env (optional):
//   INDEXNOW_KEY  override the default key

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEY = process.env.INDEXNOW_KEY || 'fef79adedf094ebea713a5bc6584bc56'
const HOST = 'reactuse.com'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/IndexNow'

async function readSitemapUrls() {
  const sitemapPath = path.resolve(__dirname, '../packages/website-astro/dist/sitemap-0.xml')
  if (!fs.existsSync(sitemapPath)) {
    console.error(`Sitemap not found at ${sitemapPath}. Run \`pnpm --filter website-astro run build\` first.`)
    process.exit(1)
  }
  const xml = fs.readFileSync(sitemapPath, 'utf-8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
}

async function ping(urls) {
  if (urls.length === 0) {
    console.log('No URLs to ping.')
    return
  }
  // IndexNow accepts up to 10,000 URLs per request.
  const chunks = []
  for (let i = 0; i < urls.length; i += 10000) chunks.push(urls.slice(i, i + 10000))
  for (const chunk of chunks) {
    const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: chunk })
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body,
    })
    console.log(`POST ${ENDPOINT} (${chunk.length} urls) -> ${res.status} ${res.statusText}`)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      if (text)
        console.log(text.slice(0, 500))
    }
  }
}

const args = process.argv.slice(2)
const urls = args.includes('--all') ? await readSitemapUrls() : args.filter(a => a.startsWith('http'))
await ping(urls)
