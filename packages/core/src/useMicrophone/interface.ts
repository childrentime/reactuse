/**
 * @title UseMicrophoneOptions
 */
export interface UseMicrophoneOptions {
  /**
   * @zh 指定要使用的麦克风设备 ID；激活状态下变化会自动重新获取流
   * @zh-Hant 指定要使用的麥克風裝置 ID；啟動狀態下變化會自動重新取得串流
   * @en Specific microphone deviceId; re-acquires the stream when changed while active
   */
  deviceId?: string
  /**
   * @zh 与默认音频约束合并的额外 MediaTrackConstraints；deviceId 优先
   * @zh-Hant 與預設音訊約束合併的額外 MediaTrackConstraints；deviceId 優先
   * @en Extra MediaTrackConstraints merged with the defaults; deviceId above takes precedence
   */
  constraints?: MediaTrackConstraints
  /**
   * @zh 音量级别状态更新的节流间隔（毫秒）
   * @zh-Hant 音量等級狀態更新的節流間隔（毫秒）
   * @en Throttle interval (ms) for level state updates
   * @defaultValue 100
   */
  levelInterval?: number
  /**
   * @zh MediaRecorder 的首选 mime 类型；不受支持时自动回退
   * @zh-Hant MediaRecorder 的首選 mime 類型；不支援時自動回退
   * @en Preferred MediaRecorder mime type; falls back to auto-selection if unsupported
   */
  mimeType?: string
  /**
   * @zh 挂载时自动打开麦克风
   * @zh-Hant 掛載時自動開啟麥克風
   * @en Automatically open the microphone on mount
   * @defaultValue false
   */
  autoStart?: boolean
}

/**
 * @title useMicrophone
 * @returns 包含麦克风流、音量级别、录音控制等的对象
 * @returns_en An object exposing the microphone stream, audio level, recording controls, and lifecycle methods
 * @returns_zh-Hant 包含麥克風串流、音量等級、錄音控制等的物件
 */
export type UseMicrophone = (
  /**
   * @zh 可选配置
   * @zh-Hant 可選配置
   * @en Optional configuration
   */
  options?: UseMicrophoneOptions
) => UseMicrophoneReturn

export interface UseMicrophoneReturn {
  /** @zh 浏览器是否支持麦克风访问 @zh-Hant 瀏覽器是否支援麥克風存取 @en Whether the browser supports microphone access */
  readonly isSupported: boolean
  /** @zh 麦克风是否已开启 @zh-Hant 麥克風是否已開啟 @en Whether the microphone stream is open */
  readonly isActive: boolean
  /** @zh 当前 MediaStream @zh-Hant 目前的 MediaStream @en The current MediaStream, or null when inactive */
  readonly stream: MediaStream | null
  /** @zh 当前音量级别（0-1，RMS） @zh-Hant 目前音量等級（0-1，RMS） @en Current normalized audio level (0..1, RMS, throttled) */
  readonly level: number
  /** @zh AnalyserNode 实例，供高级用例使用 @zh-Hant AnalyserNode 實例，供進階用例使用 @en The AnalyserNode for advanced consumers */
  readonly analyser: AnalyserNode | null
  /** @zh 最近一次错误 @zh-Hant 最近一次錯誤 @en Most recent error, if any */
  readonly error: Error | null

  /** @zh 是否正在录音 @zh-Hant 是否正在錄音 @en Whether recording is in progress */
  readonly isRecording: boolean
  /** @zh 录音是否处于暂停状态 @zh-Hant 錄音是否處於暫停狀態 @en Whether recording is paused */
  readonly isPaused: boolean
  /** @zh 最近一次录音生成的 Blob @zh-Hant 最近一次錄音產生的 Blob @en Blob produced by the most recent stopRecording() */
  readonly blob: Blob | null
  /** @zh 由 Hook 管理生命周期的对象 URL @zh-Hant 由 Hook 管理生命週期的物件 URL @en Hook-managed object URL; revoked on next record / on unmount */
  readonly audioUrl: string | null
  /** @zh 实际使用的 mime 类型 @zh-Hant 實際使用的 mime 類型 @en The mime type actually used by MediaRecorder */
  readonly mimeType: string | null
  /** @zh MediaRecorder 实例 @zh-Hant MediaRecorder 實例 @en The underlying MediaRecorder instance, when recording */
  readonly recorder: MediaRecorder | null

  /** @zh 打开麦克风 @zh-Hant 開啟麥克風 @en Open the microphone */
  readonly start: () => Promise<void>
  /** @zh 关闭麦克风 @zh-Hant 關閉麥克風 @en Close the microphone */
  readonly stop: () => void
  /** @zh 开始录音（需先调用 start） @zh-Hant 開始錄音（須先呼叫 start） @en Begin recording (requires start() first) */
  readonly startRecording: () => void
  /** @zh 停止录音并返回 Blob @zh-Hant 停止錄音並返回 Blob @en Stop recording; resolves with the captured Blob */
  readonly stopRecording: () => Promise<Blob | null>
  /** @zh 暂停录音 @zh-Hant 暫停錄音 @en Pause recording */
  readonly pauseRecording: () => void
  /** @zh 恢复录音 @zh-Hant 恢復錄音 @en Resume recording */
  readonly resumeRecording: () => void
}
