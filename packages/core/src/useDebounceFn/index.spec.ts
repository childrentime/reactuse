import type { RenderHookResult } from '@testing-library/react'
import { act, renderHook } from '@testing-library/react'
import type { DebouncedFunc } from 'lodash'
import { sleep } from '../../.test/testingHelpers'
import { useDebounceFn } from '.'

interface ParamsObj {
  fn: (...arg: any) => any
  deps?: any[]
  wait: number
}

let count = 0
function debounceFn(gap: number) {
  count += gap
}

function setUp({ fn, wait }: ParamsObj) {
  return renderHook(() => useDebounceFn(fn, wait))
}

let hook: RenderHookResult<
  {
    run: DebouncedFunc<(...args: any) => any>
    cancel: () => void
    flush: () => any
  },
  unknown
>
describe(useDebounceFn, () => {
  it('run, cancel and flush should work', async () => {
    act(() => {
      hook = setUp({
        fn: debounceFn,
        wait: 200,
      })
    })
    await act(async () => {
      hook.result.current.run(2)
      hook.result.current.run(2)
      hook.result.current.run(2)
      hook.result.current.run(2)
      expect(count).toBe(0)
      await sleep(300)
      expect(count).toBe(2)

      hook.result.current.run(4)
      expect(count).toBe(2)
      await sleep(300)
      expect(count).toBe(6)

      hook.result.current.run(4)
      expect(count).toBe(6)
      hook.result.current.cancel()
      expect(count).toBe(6)
      await sleep(300)
      expect(count).toBe(6)

      hook.result.current.run(1)
      expect(count).toBe(6)
      hook.result.current.flush()
      expect(count).toBe(7)
      await sleep(300)
      expect(count).toBe(7)
    })
  })
})
