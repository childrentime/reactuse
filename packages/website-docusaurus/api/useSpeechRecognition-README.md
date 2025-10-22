### useSpeechRecognition

#### Returns
`{ readonly isSupported: boolean; readonly isListening: boolean; readonly isFinal: boolean; readonly recognition: SpeechRecognition | undefined; readonly result: string; readonly error: SpeechRecognitionErrorEvent | undefined; readonly toggle: (value?: boolean | undefined, startOptions?: Partial<UseSpeechRecognitionOptions> | undefined) => void; readonly start: (startOptions?: Partial<UseSpeechRecognitionOptions> | undefined) => void; readonly stop: () => void; }`: A object with the following elements:
- Whether speech recognition is supported.
- Whether currently listening.
- Whether the recognition result is final.
- SpeechRecognition instance.
- Recognition result text.
- Error information.
- Function to toggle listening state.
- Function to start listening.
- Function to stop listening.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|Optional speech recognition configuration options|[UseSpeechRecognitionOptions](#UseSpeechRecognitionOptions) \| undefined |-|

### UseSpeechRecognitionOptions

```js
export interface UseSpeechRecognitionOptions {
  /**
   * Controls whether continuous results are returned for each recognition, or only a single result.
   *
   * @zh 控制是否为每次识别返回连续结果，或仅返回单个结果
   * @en Controls whether continuous results are returned for each recognition, or only a single result
   * @default true
   */
  continuous?: boolean;
  /**
   * Controls whether interim results should be returned (true) or not (false.) Interim results are results that are not yet final
   *
   * @zh 控制是否应返回临时结果（true）或不返回（false）。临时结果是尚未最终确定的结果
   * @en Controls whether interim results should be returned (true) or not (false.) Interim results are results that are not yet final
   * @default true
   */
  interimResults?: boolean;
  /**
   * Language for SpeechRecognition
   *
   * @zh 语音识别的语言
   * @en Language for SpeechRecognition
   * @default 'en-US'
   */
  lang?: string;
  /**
   * A number representing the maximum returned alternatives for each result.
   *
   * @zh 表示每个结果返回的最大备选项数量的数字
   * @en A number representing the maximum returned alternatives for each result
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/maxAlternatives
   * @default 1
   */
  maxAlternatives?: number;
}
```