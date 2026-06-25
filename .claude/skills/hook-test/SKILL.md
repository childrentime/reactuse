---
name: hook-test
category: engineering
description: Write and run jest tests for a hook in @reactuses/core, following the repo's conventions (co-located index.spec.ts, renderHook/act, fake timers, the .test/ helpers, and the SSR jest-environment pragma). Triggers on "write a test", "add test coverage", "fix the failing test", or "test this hook".
---

# hook-test — test a hook the ReactUse way

The core package uses **jest** (not vitest), `testEnvironment: 'jsdom'`. Tests run via
babel-jest against `src/` directly — **no build step needed**.

## Where tests live

Co-located with the hook: `packages/core/src/useX/index.spec.ts` (a couple use `.test.ts`,
but prefer `index.spec.ts`). There is no central `__tests__` directory.

## Basic pattern

```ts
import { act, renderHook } from '@testing-library/react'
import { useX } from '.'

describe('useX', () => {
  function setUp(initial?: number) {
    return renderHook(() => useX(initial))
  }

  it('inits with the given value', () => {
    const { result } = setUp(5)
    expect(result.current[0]).toBe(5)
  })

  it('updates on set', () => {
    const { result } = setUp(0)
    act(() => {
      result.current[1](10)        // wrap every state mutation in act()
    })
    expect(result.current[0]).toBe(10)
  })
})
```

Key rules:
- Wrap a `renderHook` call in a small `setUp()` helper.
- **Every** state mutation goes inside `act(() => { … })`.
- Read current values via `result.current`; use `rerender()` / `unmount()` from the
  `renderHook` return for prop changes and cleanup assertions.

## Timer hooks

```ts
describe('useInterval', () => {
  jest.useFakeTimers()
  jest.spyOn(global, 'clearInterval')

  it('fires on the interval', () => {
    const cb = jest.fn()
    renderHook(() => useInterval(cb, 20))
    expect(cb).not.toBeCalled()
    jest.advanceTimersByTime(70)
    expect(cb).toHaveBeenCalledTimes(3)
  })

  it('clears on unmount', () => {
    const { unmount } = renderHook(() => useInterval(jest.fn(), 200))
    unmount()
    expect(clearInterval).toHaveBeenCalledTimes(1)
  })
})
```

## SSR / hydration tests

For hooks that must not break SSR or cause hydration mismatch, use the custom environment
and render on the server, then hydrate:

```tsx
/**
 * @jest-environment ./.test/ssr-environment
 */
import { act } from '@testing-library/react'
import ReactDOMServer from 'react-dom/server'
import ReactDOMClient from 'react-dom/client'
import { createMockMediaMatcher } from '../../.test'
import { createTestComponent } from '../../.test/testingHelpers'

describe('useX SSR', () => {
  beforeEach(() => {
    jest.resetModules()
    window.matchMedia = createMockMediaMatcher({ '(prefers-color-scheme: dark)': true }) as any
  })

  it('does not mismatch during hydration', async () => {
    const TestComponent = createTestComponent(() => useX())
    const el = document.createElement('div')
    const markup = ReactDOMServer.renderToString(<TestComponent />)
    el.innerHTML = markup
    const root = await act(() => ReactDOMClient.hydrateRoot(el, <TestComponent />))
    expect(el.innerHTML).toBe(markup)
    await act(() => root.unmount())
  })
})
```

Reference: `packages/core/src/usePreferredDark/index.ssr.spec.tsx`.

## Helpers (`packages/core/.test/`)

- `createMockMediaMatcher(matches)` and `createMockRaf()` — `../../.test`
- `createTestComponent(hook)`, `sleep(ms)`, `request(req)` — `../../.test/testingHelpers`
- `jest-setup.ts` adds a `toHaveErrorMatching` matcher and a `window.testErrors` array.

## Running

```bash
pnpm --filter @reactuses/core test useX     # single hook (jest name pattern)
pnpm --filter @reactuses/core test          # whole package
pnpm --filter @reactuses/core test:coverage # with coverage
```

When fixing a *failing* test: run it first to see the real error, read the hook source and
at least one call site, make the **minimal** fix, then re-run green. No speculative edits.
