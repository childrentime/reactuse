import { act, renderHook } from '@testing-library/react'
import { useDevicePixelRatio } from '.'

interface FakeMedia {
  listeners: Set<() => void>
  dispatch: () => void
}

let created: FakeMedia[] = []
const originalMatchMedia = window.matchMedia
const originalRatio = window.devicePixelRatio

// jsdom has no matchMedia, and the shared helper only implements the legacy
// addListener API. This one records listeners so they can be counted, and
// honours `{ once: true }` so the count matches a real browser.
function installMatchMedia() {
  created = []
  window.matchMedia = (() => {
    const listeners = new Set<() => void>()
    const once = new Set<() => void>()
    created.push({
      listeners,
      dispatch: () => [...listeners].forEach((listener) => {
        if (once.has(listener)) {
          listeners.delete(listener)
          once.delete(listener)
        }
        listener()
      }),
    })
    return {
      matches: true,
      addEventListener: (_: string, listener: () => void, options?: { once?: boolean }) => {
        listeners.add(listener)
        if (options?.once)
          once.add(listener)
      },
      removeEventListener: (_: string, listener: () => void) => {
        listeners.delete(listener)
      },
    }
  }) as unknown as typeof window.matchMedia
}

function liveListeners() {
  return created.reduce((total, media) => total + media.listeners.size, 0)
}

beforeEach(() => {
  installMatchMedia()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  Object.defineProperty(window, 'devicePixelRatio', {
    value: originalRatio,
    configurable: true,
  })
})

it('should report the current device pixel ratio', () => {
  Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true })
  const { result } = renderHook(() => useDevicePixelRatio())

  expect(result.current.pixelRatio).toBe(3)
})

it('should follow the ratio when the media query fires', () => {
  const { result } = renderHook(() => useDevicePixelRatio())

  Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true })
  act(() => {
    created[created.length - 1].dispatch()
  })
  expect(result.current.pixelRatio).toBe(2)
})

it('should leave no listener behind after a ratio change and unmount', () => {
  const { unmount } = renderHook(() => useDevicePixelRatio())
  expect(liveListeners()).toBe(1)

  // Each change re-subscribes to a new media query; the cleanup must follow.
  act(() => {
    created[created.length - 1].dispatch()
  })
  expect(liveListeners()).toBe(1)

  unmount()
  expect(liveListeners()).toBe(0)
})
