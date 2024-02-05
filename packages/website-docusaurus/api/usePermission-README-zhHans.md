### usePermission

#### Returns
`UsePermissionState`: 权限状态

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|permissionDesc|权限描述符|[UsePermissionGeneralPermissionDescriptor](#UsePermissionGeneralPermissionDescriptor) \| "geolocation" \| "notifications" \| "persistent-storage" \| "push" \| "screen-wake-lock" \| "xr-spatial-tracking" \| "accelerometer" \| "accessibility-events" \| "ambient-light-sensor" \| "background-sync" \| "camera" \| "clipboard-read" \| "clipboard-write" \| "gyroscope" \| "magnetometer" \| "microphone" \| "payment-handler" \| "speaker"  **(必填)**|-|

### UsePermissionState

#### Type

`export type UsePermissionState = PermissionState | "";`


### UsePermissionGeneralPermissionDescriptor

#### Type

`export type UsePermissionGeneralPermissionDescriptor =
  | PermissionDescriptor
  | { name: UsePermissionDescriptorNamePolyfill };`


### UsePermissionDescriptorNamePolyfill

#### Type

`export type UsePermissionDescriptorNamePolyfill =
  | "accelerometer"
  | "accessibility-events"
  | "ambient-light-sensor"
  | "background-sync"
  | "camera"
  | "clipboard-read"
  | "clipboard-write"
  | "gyroscope"
  | "magnetometer"
  | "microphone"
  | "notifications"
  | "payment-handler"
  | "persistent-storage"
  | "push"
  | "speaker";`
