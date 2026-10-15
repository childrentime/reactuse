/**
 * @jest-environment ./.test/ssr-environment
 */

import { act } from '@testing-library/react'
import ReactDOMServer from 'react-dom/server'
import ReactDOMClient from 'react-dom/client'
import { breakpointsTailwind, useBreakpoints } from '.'

function mockWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width: ([\d.]+)px/.exec(query)![1])
    return {
      media: query,
      matches: width >= min,
      addEventListener: () => {},
      removeEventListener: () => {},
    }
  }) as any
}

function Active() {
  const { active } = useBreakpoints(breakpointsTailwind, { defaultWidth: 1024 })
  return <>{active ?? 'none'}</>
}

describe('useBreakpoints SSR', () => {
  let originalError: typeof console.error

  beforeEach(() => {
    originalError = console.error
    console.error = jest.fn()
  })

  afterEach(() => {
    console.error = originalError
  })

  it('renders defaultWidth on the server and hydrates without a mismatch', async () => {
    mockWidth(1024)
    const markup = ReactDOMServer.renderToString(<Active />)
    expect(markup).toBe('lg')

    const element = document.createElement('div')
    document.body.appendChild(element)
    try {
      element.innerHTML = markup
      mockWidth(400)
      const root = await act(() => ReactDOMClient.hydrateRoot(element, <Active />))

      expect(console.error).not.toHaveBeenCalled()
      expect(element.innerHTML).toBe('none')

      await act(() => root.unmount())
    }
    finally {
      document.body.removeChild(element)
    }
  })
})
