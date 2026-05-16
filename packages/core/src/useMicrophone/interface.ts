export interface UseMicrophoneOptions {
  deviceId?: string
  constraints?: MediaTrackConstraints
  levelInterval?: number
  mimeType?: string
  autoStart?: boolean
}

export interface UseMicrophoneReturn {
  readonly isSupported: boolean
  readonly isActive: boolean
  readonly stream: MediaStream | null
  readonly level: number
  readonly analyser: AnalyserNode | null
  readonly error: Error | null

  readonly isRecording: boolean
  readonly isPaused: boolean
  readonly blob: Blob | null
  readonly audioUrl: string | null
  readonly mimeType: string | null
  readonly recorder: MediaRecorder | null

  readonly start: () => Promise<void>
  readonly stop: () => void
  readonly startRecording: () => void
  readonly stopRecording: () => Promise<Blob | null>
  readonly pauseRecording: () => void
  readonly resumeRecording: () => void
}

export type UseMicrophone = (options?: UseMicrophoneOptions) => UseMicrophoneReturn
