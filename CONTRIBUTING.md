# Contributing

Thanks for being willing to contribute 🙌 If you contribute to this project, you agree to release your work under the license of this project.

**Working on your first Pull Request?** You can learn how from this [First Contributions](https://github.com/firstcontributions/first-contributions)  guide.

## Project setup

1. Fork and clone the repo
1. Run `pnpm install` to install dependencies
1. Create a branch for your PR with `git checkout -b pr/your-branch-name`

> Tip: Keep your `master` branch pointing at the original repository and make
> pull requests from branches on your fork. To do this, run:
>
> ```sh
> git remote add upstream https://github.com/childrentime/reactuse.git
> git fetch upstream
> git branch --set-upstream-to=upstream/master master
> ```
>
> This will add the original repository as a "remote" called "upstream," Then
> fetch the git information from that remote, then set your local `master`
> branch to use the upstream master branch whenever you run `git pull`. Then you
> can make all of your pull request branches based on this `master` branch.
> Whenever you want to update your version of `master`, do a regular `git pull`.

## Development

This library is a collection of React hooks so a proposal for a new hook will need to utilize the [React Hooks API](https://reactjs.org/docs/hooks-reference.html) internally to be taken into consideration.

## Project Structure

packages is divided into two parts.

``` md
packages
  core/           - the core hook package
  website/        - the document package
```

### Creating a new hook

Before you start working, it's better to open an issue to discuss first.

1. Create `packages/core/hooks/useYourHookName/@(index.ts|demo.tsx|README.md)`, run `pnpm run docs:dev` to start the document development server and start coding your hook.
2. Create `packages/core/hooks/useYourHookName/index.spec.ts`, run `pnpm test` to start the test runner in watch mode and start writing tests for your hook
3. Export your hook from `package/core/index.ts`

In your hook folder:
```bash
useYourHookName
  ├- index.ts
  ├- index.spec.ts
  ├- demo.tsx
  └- README.md
```

You can run `pnpm run newHook` to auto generate these files.

You can also write your tests first if you prefer [test-driven development](https://en.wikipedia.org/wiki/Test-driven_development).

### Updating an existing hook

Feel free to enhance the existing functions. Please try not to introduce breaking changes.

## Code Style

- An if or for statement block must be enclosed in curly braces.
- Statements must be enclosed in semicolons.

## Thanks

Thank you again for being interested in this project! You are awesome!
