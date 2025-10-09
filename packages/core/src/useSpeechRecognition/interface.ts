import type { SpeechRecognition, SpeechRecognitionErrorEvent } from './types'

export interface UseSpeechRecognitionOptions {
  /**
   * Controls whether continuous results are returned for each recognition, or only a single result.
   *
   * @zh 控制是否为每次识别返回连续结果，或仅返回单个结果
   * @en Controls whether continuous results are returned for each recognition, or only a single result
   * @default true
   */
  continuous?: boolean
  /**
   * Controls whether interim results should be returned (true) or not (false.) Interim results are results that are not yet final
   *
   * @zh 控制是否应返回临时结果（true）或不返回（false）。临时结果是尚未最终确定的结果
   * @en Controls whether interim results should be returned (true) or not (false.) Interim results are results that are not yet final
   * @default true
   */
  interimResults?: boolean
  /**
   * Language for SpeechRecognition
   *
   * @zh 语音识别的语言
   * @en Language for SpeechRecognition
   * @default 'en-US'
   */
  lang?: string
  /**
   * A number representing the maximum returned alternatives for each result.
   *
   * @zh 表示每个结果返回的最大备选项数量的数字
   * @en A number representing the maximum returned alternatives for each result
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/maxAlternatives
   * @default 1
   */
  maxAlternatives?: number
}

/**
 * @title useSpeechRecognition
 * @returns 包含以下元素的对象：
 * - 是否支持语音识别。
 * - 是否正在监听。
 * - 识别结果是否为最终结果。
 * - SpeechRecognition 实例。
 * - 识别结果文本。
 * - 错误信息。
 * - 切换监听状态的函数。
 * - 开始监听的函数。
 * - 停止监听的函数。
 * @returns_en A object with the following elements:
 * - Whether speech recognition is supported.
 * - Whether currently listening.
 * - Whether the recognition result is final.
 * - SpeechRecognition instance.
 * - Recognition result text.
 * - Error information.
 * - Function to toggle listening state.
 * - Function to start listening.
 * - Function to stop listening.
 */
export type UseSpeechRecognition = (
  /**
   * @zh 可选的语音识别配置参数
   * @en Optional speech recognition configuration options
   */
  options?: UseSpeechRecognitionOptions
) => {
  /**
   * @zh 浏览器是否支持语音识别
   * @en Whether the browser supports speech recognition
   */
  readonly isSupported: boolean
  /**
   * @zh 是否正在监听
   * @en Whether currently listening
   */
  readonly isListening: boolean
  /**
   * @zh 识别结果是否为最终结果
   * @en Whether the recognition result is final
   */
  readonly isFinal: boolean
  /**
   * @zh SpeechRecognition 实例
   * @en SpeechRecognition instance
   */
  readonly recognition: SpeechRecognition | undefined
  /**
   * @zh 识别结果文本
   * @en Recognition result text
   */
  readonly result: string
  /**
   * @zh 错误信息
   * @en Error information
   */
  readonly error: SpeechRecognitionErrorEvent | undefined
  /**
   * @zh 切换监听状态
   * @en Toggle listening state
   */
  readonly toggle: (value?: boolean, language?: string, continuous?: boolean) => void
  /**
   * @zh 开始监听
   * @en Start listening
   */
  readonly start: (language?: string, continuous?: boolean) => void
  /**
   * @zh 停止监听
   * @en Stop listening
   */
  readonly stop: () => void
}

export type UseSpeechRecognitionReturn = ReturnType<UseSpeechRecognition>
