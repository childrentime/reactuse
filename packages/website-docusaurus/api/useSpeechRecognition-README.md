### UseSpeechRecognitionOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|continuous|Controls whether continuous results are returned for each recognition, or only a single result|boolean |`-`|
|interimResults|Controls whether interim results should be returned (true) or not (false.) Interim results are results that are not yet final|boolean |`-`|
|lang|Language for SpeechRecognition|string |`-`|
|maxAlternatives|A number representing the maximum returned alternatives for each result|number |`-`|

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