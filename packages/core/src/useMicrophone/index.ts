import { useSupported } from '../useSupported'
import type { UseMicrophone, UseMicrophoneOptions } from './interface'

const noop = () => {}
const asyncNoop = async () => {}

export const useMicrophone: UseMicrophone = (_options: UseMicrophoneOptions = {}) => {
  const isSupported = useSupported(
    () => typeof navigator !== 'undefined'
      && !!navigator.mediaDevices
      && typeof navigator.mediaDevices.getUserMedia === 'function',
  )

  return {
    isSupported,
    isActive: false,
    stream: null,
    level: 0,
    analyser: null,
    error: null,

    isRecording: false,
    isPaused: false,
    blob: null,
    audioUrl: null,
    mimeType: null,
    recorder: null,

    start: asyncNoop,
    stop: noop,
    startRecording: noop,
    stopRecording: async () => null,
    pauseRecording: noop,
    resumeRecording: noop,
  } as const
}

export type { UseMicrophoneOptions, UseMicrophoneReturn } from './interface'
