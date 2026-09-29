/**
 * @jest-environment node
 */

import ReactDOMServer from 'react-dom/server'
import { useScriptTag } from '.'

describe('useScriptTag SSR', () => {
  it('should not touch document when loading or unloading on the server', async () => {
    let load: ((waitForScriptLoad?: boolean) => Promise<HTMLScriptElement | boolean>) | undefined
    let unload: (() => void) | undefined

    function TestComponent() {
      const [, status, l, u] = useScriptTag('https://example.com/lib.js', undefined, {
        immediate: false,
      })
      load = l
      unload = u
      return <span>{status}</span>
    }

    const markup = ReactDOMServer.renderToString(<TestComponent />)

    // Guard against a vacuous pass: the render must have happened and
    // handed the real functions out before we exercise them.
    expect(markup).toBe('<span>loading</span>')
    expect(load).toBeDefined()
    expect(unload).toBeDefined()

    await expect(load!()).resolves.toBe(false)
    expect(() => unload!()).not.toThrow()
  })
})
