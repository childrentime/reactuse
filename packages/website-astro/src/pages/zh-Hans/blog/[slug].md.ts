import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export async function getStaticPaths() {
  const posts = await getCollection('blog-zh-hans')
  return posts.map(entry => ({
    params: { slug: entry.data.slug || entry.id },
    props: { entry },
  }))
}

export const GET: APIRoute = async ({ props, params }) => {
  const { entry } = props as { entry: { body?: string, data: { title: string, description?: string, date?: Date } } }
  const fm = entry.data
  const slug = params.slug
  const date = fm.date ? new Date(fm.date).toISOString().slice(0, 10) : ''
  const header = `---\ntitle: ${JSON.stringify(fm.title)}\n${fm.description ? `description: ${JSON.stringify(fm.description)}\n` : ''}${date ? `date: ${date}\n` : ''}canonical: https://reactuse.com/zh-Hans/blog/${slug}/\n---\n\n`
  return new Response(header + (entry.body ?? ''), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
