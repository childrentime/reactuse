import { act, renderHook } from '@testing-library/react'
import { StrictMode, createElement } from 'react'
import type { ReactNode } from 'react'
import { useBroadcastChannel } from '.'

class FakeBroadcastChannel extends EventTarget {
  static instances: FakeBroadcastChannel[] = []
  closed = false
  posted: unknown[] = []

  constructor(public name: string) {
    super()
    FakeBroadcastChannel.instances.push(this)
  }

  postMessage(data: unknown) {
    this.posted.push(data)
  }

  close() {
    this.closed = true
  }
}

beforeEach(() => {
  FakeBroadcastChannel.instances = []
  ;(window as any).BroadcastChannel = FakeBroadcastChannel
})

afterEach(() => {
  delete (window as any).BroadcastChannel
})

const latest = () =>
  FakeBroadcastChannel.instances[FakeBroadcastChannel.instances.length - 1]

it('should receive messages and post to the channel', () => {
  const { result } = renderHook(() =>
    useBroadcastChannel<string, string>({ name: 'a' }),
  )

  expect(result.current.isSupported).toBe(true)
  expect(result.current.isClosed).toBe(false)

  act(() => {
    latest().dispatchEvent(new MessageEvent('message', { data: 'hello' }))
  })
  expect(result.current.data).toBe('hello')

  act(() => {
    result.current.post('out')
  })
  expect(latest().posted).toEqual(['out'])
})

it('should report closed after close()', () => {
  const { result } = renderHook(() => useBroadcastChannel({ name: 'a' }))

  act(() => {
    result.current.close()
  })
  expect(result.current.isClosed).toBe(true)
  expect(latest().closed).toBe(true)
})

it('should report open again after the name changes', () => {
  const { result, rerender } = renderHook(
    ({ name }) => useBroadcastChannel({ name }),
    { initialProps: { name: 'a' } },
  )

  rerender({ name: 'b' })

  expect(latest().name).toBe('b')
  expect(latest().closed).toBe(false)
  expect(result.current.isClosed).toBe(false)
})

it('should report open under StrictMode', () => {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(StrictMode, null, children)
  const { result } = renderHook(() => useBroadcastChannel({ name: 'a' }), {
    wrapper,
  })

  expect(latest().closed).toBe(false)
  expect(result.current.isClosed).toBe(false)
})

it('should close the channel on unmount', () => {
  const { unmount } = renderHook(() => useBroadcastChannel({ name: 'a' }))

  unmount()
  expect(latest().closed).toBe(true)
})
