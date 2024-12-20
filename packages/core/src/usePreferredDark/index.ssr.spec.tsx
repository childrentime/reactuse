/**
 * @jest-environment ./.test/ssr-environment
 */

import { act } from '@testing-library/react'
import ReactDOMServer from 'react-dom/server'
import ReactDOMClient from 'react-dom/client'
import { createMockMediaMatcher } from '../../.test'
import { createTestComponent } from '../../.test/testingHelpers'
import { usePreferredDark } from '.'

describe(usePreferredDark, () => {
  let originalError: (message?: any, ...optionalParams: any[]) => void
  let mockError: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    originalError = console.error
    mockError = jest.fn()
    console.error = mockError

    window.matchMedia = createMockMediaMatcher({
      '(prefers-color-scheme: dark)': false,
    }) as any
  })

  afterEach(() => {
    console.error = originalError
  })

  it('should not throw mismatch during hydrating when set default state in dark', async () => {
    const TestComponent = createTestComponent(() => usePreferredDark(true))
    const element = document.createElement('div')
    document.body.appendChild(element)

    try {
      const markup = ReactDOMServer.renderToString(<TestComponent />)
      element.innerHTML = markup
      window.matchMedia = createMockMediaMatcher({
        '(prefers-color-scheme: dark)': true,
      }) as any
      const root = await act(() => {
        return ReactDOMClient.hydrateRoot(element, <TestComponent />)
      })
      expect(element.innerHTML).toBe(markup)
      await act(() => {
        root.unmount()
      })
      expect(element.innerHTML).toEqual('')
    }
    finally {
      document.body.removeChild(element)
    }
  })

  it('should throw mismatch during hydrating when not set default state in dark', async () => {
    const TestComponent = createTestComponent(() => usePreferredDark())
    const element = document.createElement('div')
    document.body.appendChild(element)

    try {
      const markup = ReactDOMServer.renderToString(<TestComponent />)
      element.innerHTML = markup
      window.matchMedia = createMockMediaMatcher({
        '(prefers-color-scheme: dark)': true,
      }) as any

      try {
        await act(async () => {
          return ReactDOMClient.hydrateRoot(element, <TestComponent />)
        })
      }
      catch (error) {

      }
      expect((console.error as jest.Mock).mock.calls[0].slice(0, 3))
        .toMatchInlineSnapshot(`
        [
          [Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

        - A server/client branch \`if (typeof window !== 'undefined')\`.
        - Variable input such as \`Date.now()\` or \`Math.random()\` which changes each time it's called.
        - Date formatting in a user's locale which doesn't match the server.
        - External changing data without sending a snapshot of it along with the HTML.
        - Invalid HTML tag nesting.

        It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

        https://react.dev/link/hydration-mismatch

          <TestComponent>
        +   true
        -   false
        ],
        ]
      `)
    }
    finally {
      expect(window.testErrors).toHaveErrorMatching('Hydration failed because the server rendered HTML didn\'t match the client')
      document.body.removeChild(element)
    }
  })
})
