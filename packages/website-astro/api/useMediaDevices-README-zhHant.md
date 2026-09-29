### useMediaDevices

#### Returns
`readonly [{ devices: { deviceId: string; groupId: string; kind: MediaDeviceKind; label: string; }[]; }, () => Promise<boolean>]`: 包含以下元素的元組：
- 媒體設備信息。
- 請求媒體設備權限。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|可選參數|[UseMediaDeviceOptions](#usemediadeviceoptions) \| undefined |-|

### UseMediaDeviceOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|requestPermissions|自動請求權限|boolean |`false`|
|constraints|請求媒體權限類型|MediaStreamConstraints |`{ audio: true, video: true }`|