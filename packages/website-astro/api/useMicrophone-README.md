### UseMicrophoneOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|deviceId|Specific microphone deviceId; re-acquires the stream when changed while active|string |`-`|
|constraints|Extra MediaTrackConstraints merged with the defaults; deviceId above takes precedence|MediaTrackConstraints |`-`|
|levelInterval|Throttle interval (ms) for level state updates|number |`100`|
|mimeType|Preferred MediaRecorder mime type; falls back to auto-selection if unsupported|string |`-`|
|autoStart|Automatically open the microphone on mount|boolean |`false`|

### useMicrophone

#### Returns
`UseMicrophoneReturn`: An object exposing the microphone stream, audio level, recording controls, and lifecycle methods

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|Optional configuration|[UseMicrophoneOptions](#usemicrophoneoptions) \| undefined |-|