import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const docSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  sidebar_label: z.string().optional(),
  sidebar_position: z.number().optional(),
})

const docs = defineCollection({
  loader: glob({ base: './src/content/docs', pattern: '**/*.{md,mdx}' }),
  schema: docSchema,
})

const docsZhHans = defineCollection({
  loader: glob({ base: './src/content/docs-zh-hans', pattern: '**/*.{md,mdx}' }),
  schema: docSchema,
})

const docsZhHant = defineCollection({
  loader: glob({ base: './src/content/docs-zh-hant', pattern: '**/*.{md,mdx}' }),
  schema: docSchema,
})

const blogSchema = z.object({
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
})

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: blogSchema,
})

const blogZhHans = defineCollection({
  loader: glob({ base: './src/content/blog-zh-hans', pattern: '**/*.{md,mdx}' }),
  schema: blogSchema,
})

const blogZhHant = defineCollection({
  loader: glob({ base: './src/content/blog-zh-hant', pattern: '**/*.{md,mdx}' }),
  schema: blogSchema,
})

export const collections = { docs, 'docs-zh-hans': docsZhHans, 'docs-zh-hant': docsZhHant, blog, 'blog-zh-hans': blogZhHans, 'blog-zh-hant': blogZhHant }
