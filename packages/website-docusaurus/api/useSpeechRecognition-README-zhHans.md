### UseSpeechRecognitionOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|continuous|控制是否为每次识别返回连续结果，或仅返回单个结果|boolean |`-`|
|interimResults|控制是否应返回临时结果（true）或不返回（false）。临时结果是尚未最终确定的结果|boolean |`-`|
|lang|语音识别的语言|string |`-`|
|maxAlternatives|表示每个结果返回的最大备选项数量的数字|number |`-`|

### useSpeechRecognition

#### Returns
`{ readonly isSupported: boolean; readonly isListening: boolean; readonly isFinal: boolean; readonly recognition: SpeechRecognition | undefined; readonly result: string; readonly error: SpeechRecognitionErrorEvent | undefined; readonly toggle: (value?: boolean | undefined, startOptions?: Partial<UseSpeechRecognitionOptions> | undefined) => void; readonly start: (startOptions?: Partial<UseSpeechRecognitionOptions> | undefined) => void; readonly stop: () => void; }`: 包含以下元素的對象：
- 是否支持語音識別。
- 是否正在監聽。
- 識別結果是否為最終結果。
- SpeechRecognition 實例。
- 識別結果文本。
- 錯誤信息。
- 切換監聽狀態的函數。
- 開始監聽的函數。
- 停止監聽的函數。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|可选的语音识别配置参数|[UseSpeechRecognitionOptions](#UseSpeechRecognitionOptions) \| undefined |-|