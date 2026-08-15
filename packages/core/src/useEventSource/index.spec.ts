import { act, renderHook } from '@testing-library/react'
import { useEventSource } from '.'

class MockEventSource {
  static instances: MockEventSource[] = []
  url: string | URL
  withCredentials: boolean
  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  closed = false
  listeners = new Map<string, Set<(ev: MessageEvent) => void>>()

  constructor(url: string | URL, init?: EventSourceInit) {
    this.url = url
    this.withCredentials = !!init?.withCredentials
    MockEventSource.instances.push(this)
  }

  addEventListener(name: string, fn: (ev: MessageEvent) => void) {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set())
    }
    this.listeners.get(name)!.add(fn)
  }

  removeEventListener(name: string, fn: (ev: MessageEvent) => void) {
    this.listeners.get(name)?.delete(fn)
  }

  close() {
    this.closed = true
  }

  // test helpers
  emitOpen() {
    this.onopen?.(new Event('open'))
  }

  emitError() {
    this.onerror?.(new Event('error'))
  }

  emitMessage(data: string, lastEventId = '') {
    this.onmessage?.({ data, lastEventId } as MessageEvent)
  }

  emitNamed(name: string, data: string) {
    this.listeners.get(name)?.forEach(fn => fn({ data } as MessageEvent))
  }
}

const last = () => MockEventSource.instances[MockEventSource.instances.length - 1]

describe('useEventSource', () => {
  const OriginalEventSource = (globalThis as any).EventSource

  beforeAll(() => {
    jest.useFakeTimers()
    ;(globalThis as any).EventSource = MockEventSource
  })

  afterEach(() => {
    jest.clearAllTimers()
    MockEventSource.instances = []
  })

  afterAll(() => {
    jest.useRealTimers()
    ;(globalThis as any).EventSource = OriginalEventSource
  })

  it('should be defined', () => {
    expect(useEventSource).toBeDefined()
  })

  it('opens immediately and tracks status / data / lastEventId', () => {
    const { result } = renderHook(() => useEventSource('/sse'))
    expect(MockEventSource.instances).toHaveLength(1)
    expect(result.current.status).toBe('CONNECTING')

    act(() => last().emitOpen())
    expect(result.current.status).toBe('CONNECTED')

    act(() => last().emitMessage('hello', '42'))
    expect(result.current.data).toBe('hello')
    expect(result.current.lastEventId).toBe('42')
  })

  it('does not connect when immediate is false, until open() is called', () => {
    const { result } = renderHook(() =>
      useEventSource('/sse', [], { immediate: false }),
    )
    expect(MockEventSource.instances).toHaveLength(0)
    expect(result.current.status).toBe('DISCONNECTED')

    act(() => result.current.open())
    expect(MockEventSource.instances).toHaveLength(1)
    expect(result.current.status).toBe('CONNECTING')
  })

  it('subscribes to named events and reports the event name', () => {
    const { result } = renderHook(() =>
      useEventSource('/sse', ['ping', 'pong']),
    )
    act(() => last().emitNamed('pong', '{"n":1}'))
    expect(result.current.event).toBe('pong')
    expect(result.current.data).toBe('{"n":1}')
  })

  it('closes the underlying EventSource on unmount', () => {
    const { unmount } = renderHook(() => useEventSource('/sse'))
    const es = last()
    unmount()
    expect(es.closed).toBe(true)
  })

  it('reconnects after `delay` when autoReconnect is set', () => {
    renderHook(() =>
      useEventSource('/sse', [], { autoReconnect: { delay: 500 } }),
    )
    expect(MockEventSource.instances).toHaveLength(1)

    act(() => last().emitError())
    expect(MockEventSource.instances).toHaveLength(1)

    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(MockEventSource.instances).toHaveLength(2)
    expect(MockEventSource.instances[0].closed).toBe(true)
  })

  it('gives up after `retries` consecutive failures and calls onFailed', () => {
    const onFailed = jest.fn()
    renderHook(() =>
      useEventSource('/sse', [], {
        autoReconnect: { retries: 3, delay: 100, onFailed },
      }),
    )
    // attempt #1 fails → retry 1
    act(() => last().emitError())
    act(() => {
      jest.advanceTimersByTime(100)
    })
    // attempt #2 fails → retry 2
    act(() => last().emitError())
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(MockEventSource.instances).toHaveLength(3)
    expect(onFailed).not.toHaveBeenCalled()

    // attempt #3 fails → retries exhausted (3 failures) → onFailed, no new EventSource
    act(() => last().emitError())
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(onFailed).toHaveBeenCalledTimes(1)
    expect(MockEventSource.instances).toHaveLength(3)
  })

  it('resets the retry budget after a successful connection', () => {
    const onFailed = jest.fn()
    renderHook(() =>
      useEventSource('/sse', [], {
        autoReconnect: { retries: 2, delay: 100, onFailed },
      }),
    )
    // fail once, reconnect, succeed
    act(() => last().emitError())
    act(() => {
      jest.advanceTimersByTime(100)
    })
    act(() => last().emitOpen())
    // fail once more — should still retry, since the counter was reset by onopen
    act(() => last().emitError())
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(MockEventSource.instances).toHaveLength(3)
    expect(onFailed).not.toHaveBeenCalled()
  })

  it('does not reconnect after an explicit close()', () => {
    const { result } = renderHook(() =>
      useEventSource('/sse', [], { autoReconnect: { delay: 100 } }),
    )
    const es = last()
    act(() => result.current.close())
    expect(es.closed).toBe(true)

    act(() => es.emitError())
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(MockEventSource.instances).toHaveLength(1)
  })

  it('cancels a pending reconnect on unmount', () => {
    const { unmount } = renderHook(() =>
      useEventSource('/sse', [], { autoReconnect: { delay: 100 } }),
    )
    act(() => last().emitError())
    unmount()
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(MockEventSource.instances).toHaveLength(1)
  })
})
