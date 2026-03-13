import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const docs = defineCollection({
  loader: glob({ base: './src/content/docs', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    sidebar_label: z.string().optional(),
  }),
})

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    authors: z.array(z.union([
      z.string(),
      z.object({ name: z.string(), url: z.string().optional() }),
    ])).optional(),
    tags: z.array(z.string()).optional(),
    slug: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    image: z.string().optional(),
  }),
})

export const collections = { docs, blog }
