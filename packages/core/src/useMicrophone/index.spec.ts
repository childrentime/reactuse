import { renderHook } from '@testing-library/react'
import { useMicrophone } from '.'

describe('useMicrophone', () => {
  describe('capability detection', () => {
    const originalMediaDevices = (global.navigator as any).mediaDevices

    afterEach(() => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: originalMediaDevices,
        configurable: true,
      })
    })

    it('reports isSupported=false when mediaDevices is undefined', () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        configurable: true,
      })

      const { result } = renderHook(() => useMicrophone())
      expect(result.current.isSupported).toBe(false)
    })

    it('reports isSupported=true when getUserMedia exists', () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: { getUserMedia: jest.fn() },
        configurable: true,
      })

      const { result } = renderHook(() => useMicrophone())
      expect(result.current.isSupported).toBe(true)
    })
  })
})
