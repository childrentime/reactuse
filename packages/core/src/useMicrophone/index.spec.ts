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

class FakeAnalyser {
  fftSize = 2048
  smoothingTimeConstant = 0.8
  frequencyBinCount = 1024
  connect = jest.fn()
  disconnect = jest.fn()
  // Test harness fills this; the hook will read it via getByteTimeDomainData
  nextData: number[] = []
  getByteTimeDomainData(out: Uint8Array) {
    for (let i = 0; i < out.length; i++) out[i] = this.nextData[i] ?? 128
  }
}

class FakeSourceNode {
  connect = jest.fn()
  disconnect = jest.fn()
}

class FakeAudioContext {
  state = 'running'
  close = jest.fn(async () => { this.state = 'closed' })
  createMediaStreamSource = jest.fn(() => new FakeSourceNode())
  createAnalyser = jest.fn(() => {
    this.lastAnalyser = new FakeAnalyser()
    return this.lastAnalyser
  })
  lastAnalyser: FakeAnalyser | null = null
}

function installAudioContextMock() {
  const ctor = jest.fn(() => new FakeAudioContext())
  ;(global as any).AudioContext = ctor
  ;(global as any).webkitAudioContext = ctor
  return ctor
}

function patchRaf() {
  let callbacks: Array<(t: number) => void> = []
  let now = 0
  ;(global as any).requestAnimationFrame = (cb: (t: number) => void) => {
    callbacks.push(cb)
    return callbacks.length
  }
  ;(global as any).cancelAnimationFrame = jest.fn()
  ;(global as any).performance = (global as any).performance || { now: () => now }
  ;(global as any).performance.now = () => now
  return {
    flush(advanceMs: number) {
      now += advanceMs
      const cbs = callbacks
      callbacks = []
      cbs.forEach(cb => cb(now))
    },
  }
}

class FakeMediaRecorder {
  static isTypeSupported = jest.fn((t: string) => t === 'audio/webm;codecs=opus')
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  mimeType: string
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  constructor(public stream: any, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType || ''
  }

  start = jest.fn(() => { this.state = 'recording' })
  stop = jest.fn(() => {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['chunk'], { type: this.mimeType || 'audio/webm' }) })
    this.onstop?.()
  })

  pause = jest.fn(() => { this.state = 'paused' })
  resume = jest.fn(() => { this.state = 'recording' })
}

function installMediaRecorderMock() {
  ;(global as any).MediaRecorder = FakeMediaRecorder
  FakeMediaRecorder.isTypeSupported = jest.fn((t: string) => t === 'audio/webm;codecs=opus')
}

function installUrlMock() {
  let counter = 0
  const created: string[] = []
  const revoked: string[] = []
  ;(global as any).URL.createObjectURL = jest.fn(() => {
    const u = `blob:test/${++counter}`
    created.push(u)
    return u
  })
  ;(global as any).URL.revokeObjectURL = jest.fn((u: string) => { revoked.push(u) })
  return { created, revoked }
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

  describe('level meter', () => {
    it('emits level via state at the configured throttle interval', async () => {
      const raf = patchRaf()
      installAudioContextMock()
      const getUserMedia = jest.fn().mockResolvedValue(makeMockStream())
      installMediaDevicesMock(getUserMedia)

      const { result } = renderHook(() => useMicrophone({ levelInterval: 100 }))

      await act(async () => {
        await result.current.start()
      })

      expect(result.current.analyser).toBeTruthy()

      // Feed loud audio: 255 = peak deviation from 128 midpoint, so RMS=1.0
      const analyser = result.current.analyser as unknown as FakeAnalyser
      analyser.nextData = new Array(analyser.frequencyBinCount).fill(255)

      // First frame at t=0 should emit (lastEmit is initialized so the first tick fires)
      act(() => { raf.flush(0) })
      expect(result.current.level).toBeGreaterThan(0)
      const firstLevel = result.current.level

      // A frame at t=50ms should NOT emit (under the 100ms throttle)
      analyser.nextData = new Array(analyser.frequencyBinCount).fill(128) // silence
      act(() => { raf.flush(50) })
      expect(result.current.level).toBe(firstLevel)

      // A frame at t=150ms should emit (>=100ms since last)
      act(() => { raf.flush(100) })
      expect(result.current.level).toBe(0)
    })
  })

  describe('deviceId reactivity', () => {
    it('re-acquires the stream when deviceId changes while active', async () => {
      patchRaf()
      installAudioContextMock()

      const oldTrack = makeMockTrack()
      const newTrack = makeMockTrack()
      const oldStream = makeMockStream([oldTrack])
      const newStream = makeMockStream([newTrack])
      const getUserMedia = jest
        .fn()
        .mockResolvedValueOnce(oldStream)
        .mockResolvedValueOnce(newStream)
      installMediaDevicesMock(getUserMedia)

      const { result, rerender } = renderHook(
        ({ deviceId }: { deviceId?: string }) => useMicrophone({ deviceId }),
        { initialProps: { deviceId: 'mic-a' } },
      )

      await act(async () => { await result.current.start() })
      expect(result.current.stream).toBe(oldStream)

      await act(async () => {
        rerender({ deviceId: 'mic-b' })
        // Let the effect flush
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(oldTrack.stop).toHaveBeenCalled()
      expect(getUserMedia).toHaveBeenCalledTimes(2)
      const secondCallConstraints = getUserMedia.mock.calls[1][0].audio
      expect(secondCallConstraints.deviceId).toEqual({ exact: 'mic-b' })
      expect(result.current.stream).toBe(newStream)
    })
  })

  describe('recording', () => {
    it('startRecording + stopRecording yields a Blob and a hook-managed audioUrl', async () => {
      patchRaf()
      installAudioContextMock()
      installMediaRecorderMock()
      const urlSpy = installUrlMock()
      const getUserMedia = jest.fn().mockResolvedValue(makeMockStream())
      installMediaDevicesMock(getUserMedia)

      const { result } = renderHook(() => useMicrophone())

      await act(async () => { await result.current.start() })

      act(() => { result.current.startRecording() })
      expect(result.current.isRecording).toBe(true)
      expect(result.current.mimeType).toBe('audio/webm;codecs=opus')

      let returned: Blob | null = null
      await act(async () => {
        returned = await result.current.stopRecording()
      })

      expect(returned).toBeInstanceOf(Blob)
      expect(result.current.blob).toBeInstanceOf(Blob)
      expect(result.current.audioUrl).toBe('blob:test/1')
      expect(urlSpy.created).toEqual(['blob:test/1'])
      expect(result.current.isRecording).toBe(false)
    })
  })

  describe('mime-type selection', () => {
    it('falls back to audio/mp4 when webm is unsupported', async () => {
      patchRaf()
      installAudioContextMock()
      installMediaRecorderMock()
      // Override isTypeSupported: webm unsupported, mp4 supported
      ;(FakeMediaRecorder as any).isTypeSupported = jest.fn((t: string) => t === 'audio/mp4')
      installUrlMock()
      installMediaDevicesMock(jest.fn().mockResolvedValue(makeMockStream()))

      const { result } = renderHook(() => useMicrophone())
      await act(async () => { await result.current.start() })
      act(() => { result.current.startRecording() })
      expect(result.current.mimeType).toBe('audio/mp4')
    })

    it('honors a supported preferred mimeType option', async () => {
      patchRaf()
      installAudioContextMock()
      installMediaRecorderMock()
      ;(FakeMediaRecorder as any).isTypeSupported = jest.fn(() => true)
      installUrlMock()
      installMediaDevicesMock(jest.fn().mockResolvedValue(makeMockStream()))

      const { result } = renderHook(() => useMicrophone({ mimeType: 'audio/ogg;codecs=opus' }))
      await act(async () => { await result.current.start() })
      act(() => { result.current.startRecording() })
      expect(result.current.mimeType).toBe('audio/ogg;codecs=opus')
    })
  })

  describe('object URL lifecycle', () => {
    it('revokes the previous audioUrl when a new recording starts', async () => {
      patchRaf()
      installAudioContextMock()
      installMediaRecorderMock()
      const urls = installUrlMock()
      installMediaDevicesMock(jest.fn().mockResolvedValue(makeMockStream()))

      const { result } = renderHook(() => useMicrophone())
      await act(async () => { await result.current.start() })

      act(() => { result.current.startRecording() })
      await act(async () => { await result.current.stopRecording() })
      expect(result.current.audioUrl).toBe('blob:test/1')

      act(() => { result.current.startRecording() })
      expect(urls.revoked).toContain('blob:test/1')
    })

    it('revokes the audioUrl on unmount', async () => {
      patchRaf()
      installAudioContextMock()
      installMediaRecorderMock()
      const urls = installUrlMock()
      installMediaDevicesMock(jest.fn().mockResolvedValue(makeMockStream()))

      const { result, unmount } = renderHook(() => useMicrophone())
      await act(async () => { await result.current.start() })
      act(() => { result.current.startRecording() })
      await act(async () => { await result.current.stopRecording() })

      unmount()
      expect(urls.revoked).toContain('blob:test/1')
    })
  })
})
