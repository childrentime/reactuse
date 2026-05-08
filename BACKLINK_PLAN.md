# ReactUse Backlink Master Plan (synthesized from wave 4 — 40 research agents)

Sorted by **ROI = leverage × low-friction × likelihood-of-acceptance**. Updated 2026-05-08.

---

## Tier 0 — Already done

- ✅ Hashnode mirror (`reactuse.hashnode.dev`) — auto via `publishHashnode.mjs`
- ✅ dev.to cross-posting — auto via `DEVTO_API_KEY`
- ✅ enaqx/awesome-react PR #1708
- ✅ bestofjs Issue #1157
- ✅ Made With React.js (web form)
- ✅ Launching Next #133320
- ✅ Context7 / DeepWiki / GitMCP badges in READMEs

## Tier 1 — Auto-passive (no submission needed; verify only)

| Target | URL | Action |
|--------|-----|--------|
| Libraries.io | https://libraries.io/npm/@reactuses%2Fcore | Already indexed (dofollow homepage row) |
| npmtrends | https://npmtrends.com/@reactuses/core | Already indexed |
| jsDelivr | https://www.jsdelivr.com/package/npm/@reactuses/core | Already indexed |
| deps.dev | https://deps.dev/npm/%40reactuses%2Fcore | Already indexed (Google property) |
| Snyk Advisor | https://security.snyk.io/package/npm/%40reactuses%2Fcore | Already indexed |
| Bundlephobia | https://bundlephobia.com/package/@reactuses/core | Already indexed |
| Socket.dev | https://socket.dev/npm/package/@reactuses/core | Already indexed |
| npmmirror (CN) | https://npmmirror.com/package/@reactuses/core | Already indexed |
| Sourcegraph | sourcegraph.com search:`childrentime/reactuse` | Already indexed |
| Glama (MCP) | https://glama.ai/mcp/servers | Auto-crawls GitHub nightly — verify presence |

## Tier 2 — One-shot CLI / API submissions (highest leverage / least friction)

| # | Target | Action | Effort |
|---|--------|--------|--------|
| 1 | Official MCP Registry | `mcp-publisher` GitHub Action on tag push | 30 min one-time |
| 2 | mcp.so | `npx mcp-index <github-url>` | 1 min |
| 3 | Smithery | `smithery mcp publish <url> -n childrentime/reactuse` CLI | 5 min |
| 4 | PulseMCP | submission form at /use-cases/submit | 5 min web form |
| 5 | Cursor Directory | web form `/plugins/new` | 5 min |
| 6 | Cline mcp-marketplace | `gh issue create` with logo + repo URL | 10 min |
| 7 | Continue Hub | publish via Continue CLI block | 15 min |

## Tier 3 — GitHub PR (single-line, high-confidence)

| # | Repo | Stars | Notes |
|---|------|------:|-------|
| 1 | punkpeye/awesome-mcp-servers | 86k | Append `🤖🤖🤖` to PR title for fast-track |
| 2 | ComposioHQ/awesome-claude-skills | 58k | Active merging |
| 3 | hesreallyhim/awesome-claude-code | 42k | One-row CSV PR (auto-renders) |
| 4 | sorrycc/awesome-javascript | 35k | MVC Frameworks/Libraries section |
| 5 | wong2/awesome-mcp-servers | 4k | Direct precedent (Gluestack UI MCP) |
| 6 | appcypher/awesome-mcp-servers | 5.5k | Add new "Frontend / UI Libraries" subsection |
| 7 | jamesmurdza/awesome-ai-devtools | 3.8k | IDE Extensions section |
| 8 | ai-for-developers/awesome-ai-coding-tools | 1.7k | MCP Servers section |
| 9 | tolotrasmile/awesome-use | n/a | "VueUse-style for React" — perfect fit |
| 10 | lukasmasuch/best-of-react | 1k | Single YAML row in `projects.yaml` |
| 11 | brillout/awesome-react-components | 47k | Must remove one entry per addition (CONTRIBUTING rule) |
| 12 | markodenic/web-development-resources | 8k | React UI libraries table |
| 13 | docschina/awesome-react-hooks-cn | n/a | Chinese awesome list |
| 14 | ruanyf/weekly | n/a | issue submission (阮一峰科技爱好者周刊) |
| 15 | ascoders/weekly | n/a | issue#2 comment (前端精读参考池) |
| 16 | vitejs/awesome-vite | 17k | React → Helpers/Component Library |
| 17 | react-korea-developer/article | n/a | PR adding link to reading list |
| 18 | felipefialho/awesome-made-by-brazilians | gated | gated by maintainer nationality — skip |
| 19 | denolib/awesome-deno | 4.4k | Only if reactuse demonstrates Deno/JSR compat |
| 20 | semlinker/awesome-typescript | 4k | TypeScript Tools/Libraries |

## Tier 4 — Account-required forms / web forms (manual click required)

| Target | URL | Notes |
|--------|-----|-------|
| PkgPulse | https://www.pkgpulse.com/submit | Web form, GitHub auth, npm-package focus |
| libs.tech | https://libs.tech/react/hook-libraries | GitHub auth + issue at github.com/libstech/issues |
| Sidebar.io | https://sidebar.io/submit | Login required |
| Astro Showcase | https://astro.build/showcase/submit | Site IS built with Astro — qualifies |
| DevHunt | https://devhunt.org | GitHub auth |
| OpenAlternative | https://openalternative.co/submit | Free, OSS-only directory |
| Uneed | https://www.uneed.best/submit-a-tool | Free queued slot |
| Indie Hackers | https://www.indiehackers.com/products/new | + "Show IH" post |
| Showwcase | https://www.showwcase.com/ | Free signup |
| HackerNoon | https://hackernoon.com (writer profile) | Profile setup; then publish |
| Open Collective | https://opencollective.com/reactuse | Already exists, dormant — resume profile |
| Liberapay | https://liberapay.com/sign-up | Dofollow profile fields |
| GitHub Sponsors | https://github.com/sponsors/childrentime | Apply (waitlist) |
| Polar.sh | https://polar.sh | GitHub OAuth |
| thanks.dev | https://thanks.dev | GitHub OAuth, claim @childrentime |

## Tier 5 — User-side login required

| Platform | Why login | Notes |
|----------|-----------|-------|
| Echo JS, MicroLaunch, TinyLaunch | account signup | dofollow ~60-71 DR |
| SaaSHub | multi-step | high DR |
| CodeTriage | GitHub OAuth | mid DR (manual one-time) |
| DevHunt | GitHub OAuth | (also Tier 4) |
| Bing/Yandex/Baidu Webmaster | account | sitemap submission |
| Reactiflux Discord | account | `#i-made-this` channel |
| Next.js Discord | account | `#showcase` |
| T3 Discord | account | `#showcase` |
| GeekNews (KR) | account | `/write` submission |
| Velog (KR) | account | Korean-language tutorial post |
| OKKY (KR) | account | Korean dev community |
| Habr (RU) | account | Sandbox flow |
| vc.ru (RU) | account | personal blog |
| TabNews (BR) | account | PT-BR only |
| Frontend Brasil GH Discussion | GitHub | "Mostre seu trabalho" |
| midudev Discord (ES) | account | `#proyectos` |

## Tier 5b — GitHub Discussion / Issue replies (low-effort, dofollow GitHub.com)

Concrete open issues where reactuse is on-topic to recommend:

| Repo + Issue | Topic | Reply angle |
|--------------|-------|-------------|
| juliencrn/usehooks-ts#712 | "this library no longer maintained?" | "Maintained alternative — here's the equivalent hook" + code snippet |
| streamich/react-use#2611 | `useUpdateEffect` broken on React 19 | Pitch reactuse equivalent (already maintained) |
| streamich/react-use#2612 | useIntersection warning on React 19 | Multi-hook React 19 pain point — show reactuse equivalents |
| streamich/react-use#2683 | `useHash` "window not defined" in Next 15 | SSR-safe alternative |
| alibaba/hooks#2739 | 何时能够支持 React 19 | Chinese-language pitch; reactuse has full zh-Hans/zh-Hant docs |

Etiquette: disclose authorship; lead with code, not link; vary phrasing across threads.

## Tier 6 — Manual outreach (effort-heavy)

| Channel | DR | Best angle |
|---------|----|-----------|
| Hacker News (Show HN) | 94 | Tue–Thu 14-17 UTC; plain factual title |
| Reddit r/reactjs Showcase Saturday/Thursday | 90 | weekly self-promo thread |
| Reddit r/javascript Showoff Saturday | 90 | flair-required |
| HackerNoon article | 87 | "Top X hooks" listicle, canonical to reactuse.com |
| freeCodeCamp News | 91 | guest tutorial — needs 3 writing samples |
| CSS-Tricks (DigitalOcean) | 92 | $250 honorarium, weekly review |
| SitePoint | 84 | $150-300/article, fast turnaround |
| Smashing Magazine | 89 | longer review cycle |
| Codrops Collective | 78 | submit a hook playground demo |
| DevTools.fm podcast | 60 | best topical fit (OSS-maintainer focus) |
| Syntax.fm potluck | 80 | submit hook-shaped Q&A |
| Software Engineering Daily | 80 | broader "React hooks ecosystem" angle |
| QIITA / Zenn (JP) | 90 / 78 | original Japanese content (no canonical support) |
| GeeksforGeeks Write Portal (IN) | 88 | Indian audience |
| TutorialsPoint (IN) | 88 | $250-500/tutorial |
| t3n.de (DE) | 85 | German tech publication pitch |
| entwickler.de Experten (DE) | 75 | open author program |

## Tier 7 — Programmatic SEO (do today, no submission)

1. **Add npm keywords** in `packages/core/package.json`: `nextjs`, `remix`, `astro`, `web-api`, `nextjs-hooks`, `observer-hooks`, `react-mcp` (each = npmjs.com listing-page backlink)
2. **Add Schema.org `SoftwareApplication`** with `offers/price:0`, `applicationCategory:DeveloperApplication`, `aggregateRating` (KG eligibility)
3. **GitHub Topics**: swap 2 lower-value topics for `react18`, `react19`
4. **Add `funding` + `bugs` + `author.url`** in package.json (npm sidebar dofollow)

## Tier 8 — Anti-bot infrastructure (one-time investment)

For sites that block CDP automation (reactlibraries.com, etc):
1. Inject `puppeteer-extra-plugin-stealth` evasions via `Page.addScriptToEvaluateOnNewDocument`
2. Switch synthetic events → CDP `Input.dispatchMouseEvent` / `dispatchKeyEvent`
3. Detach `Runtime` domain during reCAPTCHA evaluation
4. Fallback: CapSolver ($0.40-0.80/1k Turnstile/v3)

## 🚫 Confirmed not viable (don't waste effort)

- React.dev official docs / community page — closed since 2023 rewrite
- Country-specific awesome-* lists — most gated by maintainer nationality
- LogRocket guest authoring — currently CLOSED
- Pluralsight — too React-unfriendly, 5-10% acceptance
- Lobste.rs — invite-only, public queue removed
- 30-seconds-of-react — archived
- usehooks.com (uidotdev) — effectively unmaintained, 29 PRs untouched
- Frontend Masters teachers — invite-only
- Codecademy partnerships — enterprise-only
- Stipend.dev — domain dead
- pkgstats.io / Openbase / Moiva — defunct npm indexers
- Glitch — hosting killed July 2025
- React Round Up podcast — last ep Nov 2024
- Front End Happy Hour podcast — last ep Mar 2025
- JS Party podcast — ended Feb 2025
