/**
 * @jest-environment node
 */

import ReactDOMServer from 'react-dom/server'
import type { UseOrientationLockType } from './interface'
import { useOrientation } from '.'

describe('useOrientation SSR', () => {
  it('should not touch window when locking or unlocking on the server', () => {
    let lockOrientation: ((type: UseOrientationLockType) => any) | undefined
    let unlockOrientation: (() => void) | undefined

    function TestComponent() {
      const [state, lock, unlock] = useOrientation()
      lockOrientation = lock
      unlockOrientation = unlock
      return <span>{`${state.type}:${state.angle}`}</span>
    }

    const markup = ReactDOMServer.renderToString(<TestComponent />)

    // Guard against a vacuous pass: the render must have happened and
    // handed the real functions out before we exercise them.
    expect(markup).toBe('<span>landscape-primary:0</span>')
    expect(lockOrientation).toBeDefined()
    expect(unlockOrientation).toBeDefined()

    expect(() => lockOrientation!('portrait')).not.toThrow()
    expect(lockOrientation!('portrait')).toBeUndefined()
    expect(() => unlockOrientation!()).not.toThrow()
  })
})
