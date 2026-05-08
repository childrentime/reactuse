// Cross-post a blog article from packages/website-astro/src/content/blog/ to Hashnode
// via the GraphQL publishPost mutation, setting the canonical URL back to reactuse.com
// so search engines treat reactuse.com as the original.
//
// Usage:
//   node scripts/publishHashnode.mjs                       # latest blog post
//   node scripts/publishHashnode.mjs <slug>                # specific by slug
//   node scripts/publishHashnode.mjs <path-to-md>          # specific by path
//   node scripts/publishHashnode.mjs --dry-run [slug]      # preview payload, do not publish
//
// Env (loaded from .env if present):
//   HASHNODE_PAT             Personal Access Token from hashnode.com/settings/developer
//   HASHNODE_PUBLICATION_ID  Publication ID (queried once via host)
//   HASHNODE_PUBLICATION_HOST Optional, used only if PUBLICATION_ID missing

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ENDPOINT = 'https://gql.hashnode.com'
const SITE = 'https://reactuse.com'
const BLOG_DIR = path.join(ROOT, 'packages/website-astro/src/content/blog')

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath))
    return
  for (const raw of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#'))
      continue
    const i = line.indexOf('=')
    if (i < 0)
      continue
    const k = line.slice(0, i).trim()
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\'')))
      v = v.slice(1, -1)
    if (!process.env[k])
      process.env[k] = v
  }
}

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m)
    throw new Error('No frontmatter block found at top of file')
  const meta = {}
  for (const line of m[1].split('\n')) {
    const kv = /^([\w-]+):[ \t](.*)$/.exec(line)
    if (!kv)
      continue
    let v = kv[2].trim()
    if (v.startsWith('"') && v.endsWith('"'))
      v = v.slice(1, -1)
    else if (v.startsWith('\'') && v.endsWith('\''))
      v = v.slice(1, -1)
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    }
    meta[kv[1]] = v
  }
  return { meta, body: m[2] }
}

function findLatestBlog() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx')).sort().reverse()
  if (!files.length)
    throw new Error(`No blog files in ${BLOG_DIR}`)
  return path.join(BLOG_DIR, files[0])
}

function resolveBlog(arg) {
  if (!arg || arg.startsWith('--'))
    return findLatestBlog()
  if (arg.endsWith('.md') || arg.endsWith('.mdx')) {
    const abs = path.isAbsolute(arg) ? arg : path.resolve(arg)
    if (!fs.existsSync(abs))
      throw new Error(`File not found: ${abs}`)
    return abs
  }
  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => (f.endsWith('.md') || f.endsWith('.mdx')) && (f.endsWith(`-${arg}.md`) || f.endsWith(`-${arg}.mdx`) || f === `${arg}.md`))
  if (!files.length)
    throw new Error(`No blog matching slug "${arg}" in ${BLOG_DIR}`)
  return path.join(BLOG_DIR, files[0])
}

function toTagInputs(rawTags) {
  const arr = Array.isArray(rawTags) ? rawTags : (rawTags ? [rawTags] : [])
  return arr.slice(0, 5).map(t => ({
    name: String(t).trim(),
    slug: String(t).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  })).filter(t => t.slug)
}

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': process.env.HASHNODE_PAT, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const data = await res.json()
  if (data.errors) {
    const err = new Error('GraphQL error')
    err.detail = data.errors
    throw err
  }
  return data.data
}

async function main() {
  loadDotEnv()

  if (!process.env.HASHNODE_PAT) {
    console.error('Missing HASHNODE_PAT in .env')
    process.exit(1)
  }
  if (!process.env.HASHNODE_PUBLICATION_ID && process.env.HASHNODE_PUBLICATION_HOST) {
    const host = process.env.HASHNODE_PUBLICATION_HOST
    const r = await gql(`query($h: String!) { publication(host: $h) { id } }`, { h: host })
    process.env.HASHNODE_PUBLICATION_ID = r.publication.id
  }
  if (!process.env.HASHNODE_PUBLICATION_ID) {
    console.error('Missing HASHNODE_PUBLICATION_ID (and no HASHNODE_PUBLICATION_HOST to derive from)')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const positional = args.find(a => !a.startsWith('--'))

  const mdPath = resolveBlog(positional)
  const src = fs.readFileSync(mdPath, 'utf-8')
  const { meta, body } = parseFrontmatter(src)

  if (!meta.title)
    throw new Error(`Frontmatter missing title in ${mdPath}`)
  if (!meta.slug)
    throw new Error(`Frontmatter missing slug in ${mdPath}`)

  const cleanBody = body.replace(/<!--\s*truncate\s*-->/g, '').trim()
  const tags = toTagInputs(meta.tags)
  const canonicalUrl = `${SITE}/blog/${meta.slug}/`

  const input = {
    title: meta.title,
    contentMarkdown: cleanBody,
    publicationId: process.env.HASHNODE_PUBLICATION_ID,
    tags,
    slug: meta.slug,
    originalArticleURL: canonicalUrl,
    metaTags: {
      title: meta.title,
      description: meta.description || '',
    },
    ...(meta.image ? { coverImageOptions: { coverImageURL: meta.image.startsWith('http') ? meta.image : `${SITE}${meta.image}` } } : {}),
  }

  console.log(`source:    ${path.relative(ROOT, mdPath)}`)
  console.log(`title:     ${input.title}`)
  console.log(`slug:      ${input.slug}`)
  console.log(`canonical: ${canonicalUrl}`)
  console.log(`tags:      ${tags.map(t => t.slug).join(', ')}`)
  console.log(`body:      ${cleanBody.length} chars`)

  if (dryRun) {
    console.log('\n--dry-run set, not publishing.')
    return
  }

  const mutation = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post { id url slug }
      }
    }
  `
  try {
    const result = await gql(mutation, { input })
    console.log(`\n✅ Published: ${result.publishPost.post.url}`)
  }
  catch (e) {
    console.error('\n❌ Publish failed:')
    console.error(JSON.stringify(e.detail || e.message, null, 2))
    process.exit(1)
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
