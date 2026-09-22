### UseSpeechRecognitionOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|continuous|控制是否為每次識別返回連續結果，或僅返回單個結果|boolean |`true`|
|interimResults|控制是否應返回臨時結果（true）或不返回（false）。臨時結果是尚未最終確定的結果|boolean |`true`|
|lang|語音識別的語言|string |`'en-US'`|
|maxAlternatives|表示每個結果返回的最大備選項數量的數字|number |`1`|

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
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|可選的語音識別配置參數|[UseSpeechRecognitionOptions](#usespeechrecognitionoptions) \| undefined |-|