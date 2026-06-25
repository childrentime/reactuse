---
name: pr-description
category: engineering
description: Generate a commit message or PR description for ReactUse in the repo's conventional-commit style, derived from the actual git diff. Triggers on "write the PR description", "draft a commit message", "describe this change", or before opening a PR.
---

# pr-description — describe a change the ReactUse way

Generate a title + body from the **real diff**, matching this repo's conventions. Don't
invent scope or impact — read what actually changed.

## Step 1 — Read the change

```bash
git status
git diff --stat
git diff                 # or: git diff origin/main...HEAD for a branch
git log --oneline -10    # match the prevailing style
```

## Step 2 — Title: conventional commits with a scope

Format: `type(scope): summary` — imperative, lowercase, no trailing period.

Types seen in this repo: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
Common scopes: `core` (hooks), `website`, `blog`, `readme`, `mcp`, `skill`.

Real examples from history:
- `feat(core): add useMicrophone hook (#198)`
- `fix(core): emit default values in generated API docs`
- `docs(website): add useMicrophone hook documentation (#199)`
- `docs(blog): add React event hooks post (en, zh-Hans, zh-Hant)`
- `chore: release v6.3.3`

Pick the type by the dominant change. A new hook is `feat(core):`; its docs are
`docs(website):`; they're usually separate commits/PRs.

## Step 3 — Body

Keep it tight. Include only sections that apply:

```
## What
- bullet of each meaningful change

## Why
- the motivation / problem solved

## Test plan
- pnpm --filter @reactuses/core test useX
- pnpm lint
- (for docs) built locally / live demo renders

## AI assistance
- e.g. scaffolded with the new-hook skill   (optional, see .claude/ai-policy.md)
```

## Rules

- **Verify every hook reference** against `scripts/hook-registry.json` — never invent a
  hook name, category, or URL. Links must be the lowercase canonical form.
- Multi-locale doc/blog changes: note all three locales like history does
  (`(en, zh-Hans, zh-Hant)`).
- Mention the issue/PR number if one exists.
- Disclosing AI use is recommended (see [`ai-policy.md`](../../ai-policy.md)), not required.
