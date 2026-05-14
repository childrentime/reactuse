import type { Context } from '@netlify/edge-functions'

// Hook doc pages have lowercase canonical URLs (e.g. /browser/usegeolocation/),
// but the file names are camelCase (useGeolocation.mdx) and Netlify serves
// static assets case-insensitively — so /browser/useGeolocation/ also resolves
// with a 200. Google indexed both casings, creating ~258 duplicate URL pairs
// and splitting ranking signal. This 301-redirects any non-lowercase path
// segment to its lowercase form so there is a single canonical URL.
//
// The zh-Hans / zh-Hant locale prefixes are intentionally case-sensitive and
// must be preserved as-is.

const LOCALE_SEGMENTS = new Set(['zh-Hans', 'zh-Hant'])

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  let changed = false

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (!seg || LOCALE_SEGMENTS.has(seg))
      continue
    const lower = seg.toLowerCase()
    if (lower !== seg) {
      segments[i] = lower
      changed = true
    }
  }

  // Already all-lowercase (apart from the locale prefix) — nothing to do.
  // This guard also makes the redirect loop-safe: the redirected URL passes
  // straight through on the next request.
  if (!changed)
    return context.next()

  url.pathname = segments.join('/')
  return Response.redirect(url.toString(), 301)
}

export const config = {
  path: [
    '/browser/*',
    '/effect/*',
    '/element/*',
    '/state/*',
    '/integrations/*',
    '/zh-Hans/*',
    '/zh-Hant/*',
  ],
}
