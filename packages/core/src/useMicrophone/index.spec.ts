import { renderHook, act } from '@testing-library/react'
import { useMicrophone } from '.'

function makeMockTrack() {
  return {
    kind: 'audio',
    stop: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }
}

function makeMockStream(tracks = [makeMockTrack()]) {
  return {
    getTracks: () => tracks,
    getAudioTracks: () => tracks.filter(t => t.kind === 'audio'),
    _tracks: tracks,
  }
}

function installMediaDevicesMock(getUserMedia: jest.Mock) {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  })
}

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

  describe('start/stop lifecycle', () => {
    it('start() acquires a stream and flips isActive; stop() releases it', async () => {
      const track = makeMockTrack()
      const stream = makeMockStream([track])
      const getUserMedia = jest.fn().mockResolvedValue(stream)
      installMediaDevicesMock(getUserMedia)

      const { result } = renderHook(() => useMicrophone())

      await act(async () => {
        await result.current.start()
      })

      expect(getUserMedia).toHaveBeenCalledTimes(1)
      const constraintsArg = getUserMedia.mock.calls[0][0]
      expect(constraintsArg).toHaveProperty('audio')
      expect(result.current.isActive).toBe(true)
      expect(result.current.stream).toBe(stream)

      act(() => {
        result.current.stop()
      })

      expect(track.stop).toHaveBeenCalledTimes(1)
      expect(result.current.isActive).toBe(false)
      expect(result.current.stream).toBeNull()
    })
  })

  describe('permission denial', () => {
    it('sets error and stays inactive when getUserMedia rejects', async () => {
      const denial = Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
      const getUserMedia = jest.fn().mockRejectedValue(denial)
      installMediaDevicesMock(getUserMedia)

      const { result } = renderHook(() => useMicrophone())

      await act(async () => {
        await expect(result.current.start()).rejects.toBe(denial)
      })

      expect(result.current.isActive).toBe(false)
      expect(result.current.stream).toBeNull()
      expect(result.current.error).toBe(denial)
    })
  })
})
