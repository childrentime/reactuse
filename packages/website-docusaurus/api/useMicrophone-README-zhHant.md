### UseMicrophoneOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|deviceId|指定要使用的麦克风设备 ID；激活状态下变化会自动重新获取流|string |`-`|
|constraints|与默认音频约束合并的额外 MediaTrackConstraints；deviceId 优先|MediaTrackConstraints |`-`|
|levelInterval|音量级别状态更新的节流间隔（毫秒）|number |`-`|
|mimeType|MediaRecorder 的首选 mime 类型；不受支持时自动回退|string |`-`|
|autoStart|挂载时自动打开麦克风|boolean |`-`|

### useMicrophone

#### Returns
`UseMicrophoneReturn`: 包含麥克風串流、音量等級、錄音控制等的物件

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|可选配置|[UseMicrophoneOptions](#usemicrophoneoptions) \| undefined |-|