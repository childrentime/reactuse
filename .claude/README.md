# ReactUse AI Agent System

A small, Claude-Code-native agent system, adapted from
[Chromium's `agents/` infrastructure](https://mp.weixin.qq.com/s/sCmRKJjTpdB4k3145OzZMg)
and sized for this repo (a ~112-hook TypeScript library). It keeps the *valuable*
patterns — a usage policy, a knowledge-base router, reusable skills, task commands, and
an eval set — and drops the heavy machinery Chromium needs at 35M-line scale (eval farms,
CI sharding, MCP extensions).

## The layers

| Chromium piece          | Here                                   | Loaded when                          |
|-------------------------|----------------------------------------|--------------------------------------|
| `ai_policy.md`          | [`ai-policy.md`](./ai-policy.md)       | Read it before shipping AI-assisted code |
| `common.md` workflow    | `## AI Agent System` in root `CLAUDE.md` | Always (project memory)            |
| `knowledge_base.md`     | [`knowledge-base.md`](./knowledge-base.md) | Always (it's the router)         |
| Skills                  | [`skills/`](./skills)                  | Auto-activated by relevant requests  |
| Task Prompts (`/cr:…`)  | [`commands/`](./commands)              | When you type the slash command      |
| Eval cases + harness    | [`eval/`](./eval)                      | Manually, after editing prompts/skills |

## Engineering skills

| Skill | Use it to |
|-------|-----------|
| [`new-hook`](./skills/new-hook/SKILL.md)       | Scaffold a new hook with the repo's real conventions |
| [`hook-test`](./skills/hook-test/SKILL.md)     | Write & run jest tests for a hook |
| [`hook-docs`](./skills/hook-docs/SKILL.md)     | Write the `.mdx` docs (3 locales) + regenerate the registry |
| [`pr-description`](./skills/pr-description/SKILL.md) | Generate a commit/PR description in this repo's style |

(The existing `medium-push`, `ping-indexnow`, and `publish-hashnode` skills cover blog
publishing — see `CLAUDE.md`.)

## Commands

- `/new-hook <useName> "<description>" <category>` — full pipeline: scaffold → test → docs → registry → lint.
- `/pre-pr` — pre-upload checklist (lint, test, registry, debug-log scan).
- `/pr-desc` — generate a PR/commit description from the current diff.

## Core principle

The same one Chromium leads with: **consult the real source before you act, and reuse
before you write.** This codebase has strong conventions (SSR-safety, a shared util
layer, a 3-part public export, multilingual JSDoc). The
[knowledge base](./knowledge-base.md) routes a task to the files and utilities that
already solve it. Start there.
