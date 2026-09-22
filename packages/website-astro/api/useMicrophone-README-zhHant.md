### UseMicrophoneOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|deviceId|指定要使用的麥克風裝置 ID；啟動狀態下變化會自動重新取得串流|string |`-`|
|constraints|與預設音訊約束合併的額外 MediaTrackConstraints；deviceId 優先|MediaTrackConstraints |`-`|
|levelInterval|音量等級狀態更新的節流間隔（毫秒）|number |`100`|
|mimeType|MediaRecorder 的首選 mime 類型；不支援時自動回退|string |`-`|
|autoStart|掛載時自動開啟麥克風|boolean |`false`|

### useMicrophone

#### Returns
`UseMicrophoneReturn`: 包含麥克風串流、音量等級、錄音控制等的物件

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|可選配置|[UseMicrophoneOptions](#usemicrophoneoptions) \| undefined |-|