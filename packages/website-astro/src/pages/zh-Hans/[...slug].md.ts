import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export async function getStaticPaths() {
  const docs = await getCollection('docs-zh-hans')
  return docs
    .filter(entry => entry.id && entry.id !== '/' && entry.id !== 'index' && !entry.id.endsWith('/index'))
    .map(entry => ({
      params: { slug: entry.id },
      props: { entry },
    }))
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: { body?: string, data: { title: string, description?: string }, id: string } }
  const fm = entry.data
  const header = `---\ntitle: ${JSON.stringify(fm.title)}\n${fm.description ? `description: ${JSON.stringify(fm.description)}\n` : ''}canonical: https://reactuse.com/zh-Hans/${entry.id}/\n---\n\n`
  return new Response(header + (entry.body ?? ''), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
