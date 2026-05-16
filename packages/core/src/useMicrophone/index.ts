import { useCallback, useRef, useState } from 'react'
import { useSupported } from '../useSupported'
import { useEvent } from '../useEvent'
import type { UseMicrophone, UseMicrophoneOptions } from './interface'

const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

function buildAudioConstraints(
  deviceId: string | undefined,
  extra: MediaTrackConstraints | undefined,
): MediaTrackConstraints {
  const merged: MediaTrackConstraints = { ...DEFAULT_AUDIO_CONSTRAINTS, ...(extra || {}) }
  if (deviceId) {
    merged.deviceId = { exact: deviceId }
  }
  return merged
}

export const useMicrophone: UseMicrophone = (options: UseMicrophoneOptions = {}) => {
  const { deviceId, constraints } = options

  const isSupported = useSupported(
    () => typeof navigator !== 'undefined'
      && !!navigator.mediaDevices
      && typeof navigator.mediaDevices.getUserMedia === 'function',
  )

  const [isActive, setIsActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stop = useEvent(() => {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach(t => t.stop())
    }
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
    if (streamRef.current) {
      return
    }
    try {
      const audio = buildAudioConstraints(deviceId, constraints)
      const s = await navigator.mediaDevices.getUserMedia({ audio })
      streamRef.current = s
      setStream(s)
      setIsActive(true)
      setError(null)
    }
    catch (e) {
      setError(e as Error)
      throw e
    }
  })

  const noop = useCallback(() => {}, [])
  const asyncNullResult = useCallback(async () => null, [])

  return {
    isSupported,
    isActive,
    stream,
    level: 0,
    analyser: null,
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
