# Contributing

Thanks for being willing to contribute 🙌 If you contribute to this project, you agree to release your work under the license of this project.

**Working on your first Pull Request?** You can learn how from this [First Contributions](https://github.com/firstcontributions/first-contributions) guide.

## Project setup

1. Fork and clone the repo
1. Run `pnpm install` to install dependencies
1. Create a branch for your PR with `git checkout -b pr/your-branch-name`

> Tip: Keep your `main` branch pointing at the original repository and make
> pull requests from branches on your fork. To do this, run:
>
> ```sh
> git remote add upstream https://github.com/childrentime/reactuse.git
> git fetch upstream
> git branch --set-upstream-to=upstream/main main
> ```
>
> This will add the original repository as a "remote" called "upstream," Then
> fetch the git information from that remote, then set your local `main`
> branch to use the upstream main branch whenever you run `git pull`. Then you
> can make all of your pull request branches based on this `main` branch.
> Whenever you want to update your version of `main`, do a regular `git pull`.

## Development

This library is a collection of React hooks so a proposal for a new hook will need to utilize the [React Hooks API](https://reactjs.org/docs/hooks-reference.html) internally to be taken into consideration.

## Project Structure

packages holds four workspaces.

```md
packages
core/         - the core hook package (@reactuses/core, published)
mcp/          - the MCP server (@reactuses/mcp, published)
ts-document/  - generates the API tables from each hook's interface.ts
website-astro/ - the document site (reactuse.com)
```

### Creating a new hook

Before you start working, it's better to open an issue to discuss first.

You can write your tests first if you prefer [test-driven development](https://en.wikipedia.org/wiki/Test-driven_development).

### Updating an existing hook

Feel free to enhance the existing functions. Please try not to introduce breaking changes.

## Using AI assistants

AI-assisted contributions are welcome. The one rule is that **you own every line you
open a PR with**: read and understand the whole diff before you push it, including the
parts an AI wrote, and be ready to answer review feedback yourself. Please mention
substantial AI use in the PR description — it helps reviewers calibrate.

The full policy is short: [`.claude/ai-policy.md`](./.claude/ai-policy.md).

## Thanks

Thank you again for being interested in this project! You are awesome!
