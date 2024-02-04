### useMediaDevices

#### Returns
`readonly [{ devices: { deviceId: string; groupId: string; kind: MediaDeviceKind; label: string; }[]; }, () => Promise<boolean>]`: 包含以下元素的元组：
- 媒体设备信息。
- 请求媒体设备权限。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|可选参数|[UseMediaDeviceOptions](#UseMediaDeviceOptions) \| undefined |-|

### UseMediaDeviceOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|requestPermissions|自动请求权限|boolean |`false`|
|constraints|请求媒体权限类型|MediaStreamConstraints |`{ audio: true, video: true }`|