### useSpeechRecognition

#### Returns
`{ readonly isSupported: boolean; readonly isListening: boolean; readonly isFinal: boolean; readonly recognition: SpeechRecognition | undefined; readonly result: string; readonly error: SpeechRecognitionErrorEvent | undefined; readonly toggle: (value?: boolean | undefined, startOptions?: Partial<UseSpeechRecognitionOptions> | undefined) => void; readonly start: (startOptions?: Partial<UseSpeechRecognitionOptions> | undefined) => void; readonly stop: () => void; }`: 包含以下元素的对象：
- 是否支持语音识别。
- 是否正在监听。
- 识别结果是否为最终结果。
- SpeechRecognition 实例。
- 识别结果文本。
- 错误信息。
- 切换监听状态的函数。
- 开始监听的函数。
- 停止监听的函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|可选的语音识别配置参数|[UseSpeechRecognitionOptions](#UseSpeechRecognitionOptions) \| undefined |-|

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