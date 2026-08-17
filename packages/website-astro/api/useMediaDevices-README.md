### useMediaDevices

#### Returns
`readonly [{ devices: { deviceId: string; groupId: string; kind: MediaDeviceKind; label: string; }[]; }, () => Promise<boolean>]`: A tuple with the following elements:
- The media devices info.
- A function to request media devices permission.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|optional params|[UseMediaDeviceOptions](#usemediadeviceoptions) \| undefined |-|

### UseMediaDeviceOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|requestPermissions|Request for permissions immediately if it's not granted,otherwise label and deviceIds could be empty|boolean |`false`|
|constraints|Request for types of media permissions|MediaStreamConstraints |`{ audio: true, video: true }`|