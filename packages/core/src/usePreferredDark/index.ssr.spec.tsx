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

      await act(() => {
        return ReactDOMClient.hydrateRoot(element, <TestComponent />)
      })
      expect((console.error as jest.Mock).mock.calls[0].slice(0, 3))
        .toMatchInlineSnapshot(`
        [
          "Warning: Text content did not match. Server: "%s" Client: "%s"%s",
          "false",
          "true",
        ]
      `)
    }
    finally {
      document.body.removeChild(element)
    }
  })
})
