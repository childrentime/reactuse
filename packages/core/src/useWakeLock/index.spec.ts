import { act, renderHook } from '@testing-library/react'
import { useWakeLock } from '.'

// Mock WakeLockSentinel
function createMockSentinel() {
  const listeners: Record<string, Function[]> = {}
  return {
    released: false,
    type: 'screen' as WakeLockType,
    addEventListener: jest.fn((event: string, handler: Function, options?: { once?: boolean }) => {
      if (!listeners[event]) {
        listeners[event] = []
      }
      listeners[event].push(handler)
    }),
    removeEventListener: jest.fn((event: string, handler: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler)
      }
    }),
    release: jest.fn(async function (this: any) {
      this.released = true
      const handlers = listeners.release?.slice() ?? []
      listeners.release = []
      handlers.forEach(fn => fn())
    }),
    onrelease: null,
    dispatchEvent: jest.fn(),
  } as unknown as WakeLockSentinel
}

describe('useWakeLock', () => {
  let mockSentinel: WakeLockSentinel
  let originalNavigator: Navigator

  beforeEach(() => {
    mockSentinel = createMockSentinel()
    originalNavigator = globalThis.navigator

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...originalNavigator,
        wakeLock: {
          request: jest.fn(async () => mockSentinel),
        },
      },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
    jest.restoreAllMocks()
  })

  it('should detect support', () => {
    const { result } = renderHook(() => useWakeLock())

    expect(result.current.isSupported).toBe(true)
    expect(result.current.isActive).toBe(false)
  })

  it('should detect no support', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useWakeLock())

    expect(result.current.isSupported).toBe(false)
  })

  it('should request a wake lock', async () => {
    const onRequest = jest.fn()
    const { result } = renderHook(() => useWakeLock({ onRequest }))

    await act(async () => {
      await result.current.request()
    })

    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen')
    expect(result.current.isActive).toBe(true)
    expect(onRequest).toHaveBeenCalledTimes(1)
  })

  it('should release a wake lock', async () => {
    const onRelease = jest.fn()
    const { result } = renderHook(() => useWakeLock({ onRelease }))

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.isActive).toBe(true)

    await act(async () => {
      await result.current.release()
    })

    expect(mockSentinel.release).toHaveBeenCalled()
    expect(result.current.isActive).toBe(false)
    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it('should handle request error', async () => {
    const error = new Error('Wake lock request failed')
    const onError = jest.fn()

    ;(navigator.wakeLock.request as jest.Mock).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useWakeLock({ onError }))

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.isActive).toBe(false)
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should not request when not supported', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useWakeLock())

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.isActive).toBe(false)
  })

  it('should not release when not active', async () => {
    const { result } = renderHook(() => useWakeLock())

    await act(async () => {
      await result.current.release()
    })

    // Should not throw
    expect(result.current.isActive).toBe(false)
  })

  it('should release wake lock on unmount', async () => {
    const { result, unmount } = renderHook(() => useWakeLock())

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.isActive).toBe(true)

    unmount()

    expect(mockSentinel.release).toHaveBeenCalled()
  })

  it('should re-acquire wake lock on visibility change after auto-release', async () => {
    const mockSentinel2 = createMockSentinel()
    const requestMock = navigator.wakeLock.request as jest.Mock
    requestMock
      .mockResolvedValueOnce(mockSentinel)
      .mockResolvedValueOnce(mockSentinel2)

    const { result } = renderHook(() => useWakeLock())

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.isActive).toBe(true)
    expect(requestMock).toHaveBeenCalledTimes(1)

    // Simulate browser auto-releasing wake lock (e.g. page becomes hidden)
    await act(async () => {
      await (mockSentinel.release as jest.Mock)()
    })

    expect(result.current.isActive).toBe(false)

    // Simulate page becoming visible again
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Should re-acquire
    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it('should not re-acquire wake lock after explicit release', async () => {
    const { result } = renderHook(() => useWakeLock())

    await act(async () => {
      await result.current.request()
    })

    expect(result.current.isActive).toBe(true)

    await act(async () => {
      await result.current.release()
    })

    // Simulate page becoming visible
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Should NOT re-acquire since user explicitly released
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(1)
  })

  it('should not re-acquire wake lock when not active', async () => {
    renderHook(() => useWakeLock())

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Should not request since never requested
    expect(navigator.wakeLock.request).not.toHaveBeenCalled()
  })

  it('should handle release error gracefully', async () => {
    const error = new Error('Release failed')
    const onError = jest.fn()

    const { result } = renderHook(() => useWakeLock({ onError }))

    await act(async () => {
      await result.current.request()
    })

    ;(mockSentinel.release as jest.Mock).mockRejectedValueOnce(error)

    await act(async () => {
      await result.current.release()
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should provide stable function references', () => {
    const { result, rerender } = renderHook(() => useWakeLock())

    const initialRequest = result.current.request
    const initialRelease = result.current.release
    const initialForceRequest = result.current.forceRequest

    rerender()

    expect(result.current.request).toBe(initialRequest)
    expect(result.current.release).toBe(initialRelease)
    expect(result.current.forceRequest).toBe(initialForceRequest)
  })

  it('should release old sentinel before acquiring new one via forceRequest', async () => {
    const mockSentinel2 = createMockSentinel()
    const requestMock = navigator.wakeLock.request as jest.Mock
    requestMock
      .mockResolvedValueOnce(mockSentinel)
      .mockResolvedValueOnce(mockSentinel2)

    const { result } = renderHook(() => useWakeLock())

    await act(async () => {
      await result.current.forceRequest()
    })

    expect(result.current.isActive).toBe(true)

    await act(async () => {
      await result.current.forceRequest()
    })

    // Old sentinel should have been released
    expect(mockSentinel.release).toHaveBeenCalled()
    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(result.current.isActive).toBe(true)
  })

  it('should defer request when page is not visible', async () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useWakeLock())

    await act(async () => {
      await result.current.request()
    })

    // Should not request immediately since page is hidden
    expect(navigator.wakeLock.request).not.toHaveBeenCalled()
    expect(result.current.isActive).toBe(false)

    // Simulate page becoming visible
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Now should acquire
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(1)
  })
})
