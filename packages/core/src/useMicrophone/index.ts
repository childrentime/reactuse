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
  if (deviceId)
    merged.deviceId = { exact: deviceId }
  return merged
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined')
    return undefined
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

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
]

function resolveMimeType(preferred: string | undefined): string | undefined {
  const MR = (typeof window !== 'undefined' ? (window as any).MediaRecorder : undefined)
    || (typeof globalThis !== 'undefined' ? (globalThis as any).MediaRecorder : undefined)
  if (!MR)
    return undefined
  if (preferred && typeof MR.isTypeSupported === 'function' && MR.isTypeSupported(preferred)) {
    return preferred
  }
  for (const c of MIME_CANDIDATES) {
    if (typeof MR.isTypeSupported === 'function' && MR.isTypeSupported(c))
      return c
  }
  return undefined
}

export const useMicrophone: UseMicrophone = (options: UseMicrophoneOptions = {}) => {
  const {
    deviceId,
    constraints,
    levelInterval = DEFAULT_LEVEL_INTERVAL,
    autoStart,
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

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recorderState, setRecorderState] = useState<MediaRecorder | null>(null)
  const [resolvedMime, setResolvedMime] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioUrlRef = useRef<string | null>(null)
  const stopResolverRef = useRef<((b: Blob | null) => void) | null>(null)

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

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const a = analyserRef.current
    if (!a)
      return
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
    if (!Ctx)
      return
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
    analyserRef.current = null
    setAnalyser(null)
    // AudioContext stays alive across start/stop cycles (cheap to keep, expensive to recreate).
  }, [cancelRaf])

  const stopRecorderIfActive = useCallback(() => {
    const r = recorderRef.current
    if (r && r.state !== 'inactive') {
      try {
        r.stop()
      }
      catch {
        /* ignore */
      }
    }
  }, [])

  const stop = useEvent(() => {
    stopRecorderIfActive()
    teardownAudioGraph()
    const s = streamRef.current
    if (s)
      s.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStream(null)
    setIsActive(false)
  })

  const attachTrackEndedListeners = useEvent((s: MediaStream) => {
    s.getAudioTracks().forEach(t => {
      t.addEventListener('ended', () => {
        setError(new Error('Microphone disconnected'))
        stopRecorderIfActive()
        stop()
      }, { once: true })
    })
  })

  const start = useEvent(async () => {
    if (!isSupported) {
      const err = new Error('Microphone not supported in this environment')
      setError(err)
      throw err
    }
    if (streamRef.current)
      return
    try {
      const audio = buildAudioConstraints(deviceId, constraints)
      const s = await navigator.mediaDevices.getUserMedia({ audio })
      streamRef.current = s
      setStream(s)
      setIsActive(true)
      setError(null)
      buildAudioGraph(s)
      attachTrackEndedListeners(s)
    }
    catch (e) {
      setError(e as Error)
      throw e
    }
  })

  // Re-acquire stream when deviceId / constraints change while active
  const isActiveRef = useRef(false)
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    if (!isActiveRef.current)
      return
    // Tear down current stream + graph, then re-start
    stopRecorderIfActive()
    teardownAudioGraph()
    const s = streamRef.current
    if (s)
      s.getTracks().forEach(t => t.stop())
    streamRef.current = null
    // Acquire new stream
    ;(async () => {
      try {
        const audio = buildAudioConstraints(deviceId, constraints)
        const ns = await navigator.mediaDevices.getUserMedia({ audio })
        streamRef.current = ns
        setStream(ns)
        buildAudioGraph(ns)
        attachTrackEndedListeners(ns)
      }
      catch (e) {
        setError(e as Error)
        setIsActive(false)
        setStream(null)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, JSON.stringify(constraints)])

  useUnmount(() => {
    stop()
    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null
    revokeAudioUrl()
  })

  const autoStartRef = useRef(autoStart)
  useEffect(() => {
    if (autoStartRef.current && isSupported) {
      start().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported])

  const startRecording = useEvent(() => {
    if (!streamRef.current) {
      setError(new Error('useMicrophone: call start() before startRecording()'))
      return
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive')
      return

    revokeAudioUrl()
    setBlob(null)
    setAudioUrl(null)
    chunksRef.current = []

    const mime = resolveMimeType(options.mimeType)
    const MR = (window as any).MediaRecorder as typeof MediaRecorder
    if (!MR) {
      setError(new Error('MediaRecorder is not supported'))
      return
    }
    const recorder = new MR(streamRef.current, mime ? { mimeType: mime } : undefined)
    recorderRef.current = recorder
    setRecorderState(recorder)
    setResolvedMime(mime || null)

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0)
        chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const finalBlob = chunksRef.current.length
        ? new Blob(chunksRef.current, { type: mime || chunksRef.current[0].type })
        : null
      if (finalBlob) {
        const url = URL.createObjectURL(finalBlob)
        audioUrlRef.current = url
        setBlob(finalBlob)
        setAudioUrl(url)
      }
      setIsRecording(false)
      setIsPaused(false)
      recorderRef.current = null
      setRecorderState(null)
      stopResolverRef.current?.(finalBlob)
      stopResolverRef.current = null
    }

    recorder.start()
    setIsRecording(true)
    setIsPaused(false)
  })

  const stopRecording = useEvent((): Promise<Blob | null> => {
    const r = recorderRef.current
    if (!r || r.state === 'inactive')
      return Promise.resolve(null)
    return new Promise<Blob | null>(resolve => {
      stopResolverRef.current = resolve
      r.stop()
    })
  })

  const pauseRecording = useEvent(() => {
    const r = recorderRef.current
    if (r && r.state === 'recording') {
      r.pause()
      setIsPaused(true)
    }
  })

  const resumeRecording = useEvent(() => {
    const r = recorderRef.current
    if (r && r.state === 'paused') {
      r.resume()
      setIsPaused(false)
    }
  })

  return {
    isSupported,
    isActive,
    stream,
    level,
    analyser,
    error,

    isRecording,
    isPaused,
    blob,
    audioUrl,
    mimeType: resolvedMime,
    recorder: recorderState,

    start,
    stop,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } as const
}

export type { UseMicrophoneOptions, UseMicrophoneReturn } from './interface'
