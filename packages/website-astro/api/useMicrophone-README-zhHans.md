### UseMicrophoneOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|deviceId|指定要使用的麦克风设备 ID；激活状态下变化会自动重新获取流|string |`-`|
|constraints|与默认音频约束合并的额外 MediaTrackConstraints；deviceId 优先|MediaTrackConstraints |`-`|
|levelInterval|音量级别状态更新的节流间隔（毫秒）|number |`100`|
|mimeType|MediaRecorder 的首选 mime 类型；不受支持时自动回退|string |`-`|
|autoStart|挂载时自动打开麦克风|boolean |`false`|

### useMicrophone

#### Returns
`UseMicrophoneReturn`: 包含麦克风流、音量级别、录音控制等的对象

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|可选配置|[UseMicrophoneOptions](#usemicrophoneoptions) \| undefined |-|