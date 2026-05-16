import { useCallback, useEffect, useRef, useState } from 'react'
import { useSupported } from '../useSupported'
import { useEvent } from '../useEvent'
import { useUnmount } from '../useUnmount'
import type { UseMicrophone, UseMicrophoneOptions } from './interface'

const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}
const DEFAULT_LEVEL_INTERVAL = 100

function buildAudioConstraints(
  deviceId: string | undefined,
  extra: MediaTrackConstraints | undefined,
): MediaTrackConstraints {
  const merged: MediaTrackConstraints = { ...DEFAULT_AUDIO_CONSTRAINTS, ...(extra || {}) }
  if (deviceId) merged.deviceId = { exact: deviceId }
  return merged
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as any).AudioContext || (window as any).webkitAudioContext
}

function computeRms(buf: Uint8Array): number {
  let sumSquares = 0
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128
    sumSquares += v * v
  }
  return Math.min(1, Math.sqrt(sumSquares / buf.length))
}

export const useMicrophone: UseMicrophone = (options: UseMicrophoneOptions = {}) => {
  const {
    deviceId,
    constraints,
    levelInterval = DEFAULT_LEVEL_INTERVAL,
  } = options

  const isSupported = useSupported(
    () => typeof navigator !== 'undefined'
      && !!navigator.mediaDevices
      && typeof navigator.mediaDevices.getUserMedia === 'function',
  )

  const [isActive, setIsActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [level, setLevel] = useState(0)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastLevelEmitRef = useRef<number>(-Infinity)
  const levelIntervalRef = useRef<number>(levelInterval)

  useEffect(() => {
    levelIntervalRef.current = levelInterval
  }, [levelInterval])

  const cancelRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const a = analyserRef.current
    if (!a) return
    const buf = new Uint8Array(a.frequencyBinCount)
    a.getByteTimeDomainData(buf)
    const now = performance.now()
    if (now - lastLevelEmitRef.current >= levelIntervalRef.current) {
      lastLevelEmitRef.current = now
      setLevel(computeRms(buf))
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const buildAudioGraph = useCallback((s: MediaStream) => {
    const Ctx = getAudioContextCtor()
    if (!Ctx) return
    if (!audioContextRef.current) {
      audioContextRef.current = new Ctx()
    }
    const ctx = audioContextRef.current
    sourceRef.current = ctx.createMediaStreamSource(s)
    const a = ctx.createAnalyser()
    a.fftSize = 2048
    a.smoothingTimeConstant = 0.8
    sourceRef.current.connect(a)
    analyserRef.current = a
    setAnalyser(a)
    lastLevelEmitRef.current = -Infinity
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const teardownAudioGraph = useCallback(() => {
    cancelRaf()
    sourceRef.current?.disconnect()
    sourceRef.current = null
    // Keep analyser + audioContext alive across start/stop cycles
  }, [cancelRaf])

  const stop = useEvent(() => {
    teardownAudioGraph()
    const s = streamRef.current
    if (s) s.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStream(null)
    setIsActive(false)
  })

  const start = useEvent(async () => {
    if (!isSupported) {
      const err = new Error('Microphone not supported in this environment')
      setError(err)
      throw err
    }
    if (streamRef.current) return
    try {
      const audio = buildAudioConstraints(deviceId, constraints)
      const s = await navigator.mediaDevices.getUserMedia({ audio })
      streamRef.current = s
      setStream(s)
      setIsActive(true)
      setError(null)
      buildAudioGraph(s)
    }
    catch (e) {
      setError(e as Error)
      throw e
    }
  })

  useUnmount(() => {
    stop()
    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null
    analyserRef.current = null
    setAnalyser(null)
  })

  const noop = useCallback(() => {}, [])
  const asyncNullResult = useCallback(async () => null, [])

  return {
    isSupported,
    isActive,
    stream,
    level,
    analyser,
    error,

    isRecording: false,
    isPaused: false,
    blob: null,
    audioUrl: null,
    mimeType: null,
    recorder: null,

    start,
    stop,
    startRecording: noop,
    stopRecording: asyncNullResult,
    pauseRecording: noop,
    resumeRecording: noop,
  } as const
}

export type { UseMicrophoneOptions, UseMicrophoneReturn } from './interface'
