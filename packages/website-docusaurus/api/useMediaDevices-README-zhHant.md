### useMediaDevices

#### Returns
`readonly [{ devices: { deviceId: string; groupId: string; kind: MediaDeviceKind; label: string; }[]; }, () => Promise<boolean>]`: 包含以下元素的元組：
- 媒體設備信息。
- 請求媒體設備權限。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|可选参数|[UseMediaDeviceOptions](#usemediadeviceoptions) \| undefined |-|

### UseMediaDeviceOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|requestPermissions|自动请求权限|boolean |`false`|
|constraints|请求媒体权限类型|MediaStreamConstraints |`{ audio: true, video: true }`|