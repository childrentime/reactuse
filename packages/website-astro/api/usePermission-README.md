### usePermission

#### Returns
`UsePermissionState`: permission state

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|permissionDesc|permission desc|[UsePermissionGeneralPermissionDescriptor](#usepermissiongeneralpermissiondescriptor) \| "geolocation" \| "notifications" \| "persistent-storage" \| "push" \| "screen-wake-lock" \| "xr-spatial-tracking" \| "accelerometer" \| "accessibility-events" \| "ambient-light-sensor" \| "background-sync" \| "camera" \| "clipboard-read" \| "clipboard-write" \| "gyroscope" \| "magnetometer" \| "microphone" \| "payment-handler" \| "speaker"  **(Required)**|-|

### UsePermissionState

#### Type

`export type UsePermissionState = PermissionState | ''`


### UsePermissionGeneralPermissionDescriptor

#### Type

`export type UsePermissionGeneralPermissionDescriptor =
  | PermissionDescriptor
  | { name: UsePermissionDescriptorNamePolyfill }`


### UsePermissionDescriptorNamePolyfill

#### Type

`export type UsePermissionDescriptorNamePolyfill =
  | 'accelerometer'
  | 'accessibility-events'
  | 'ambient-light-sensor'
  | 'background-sync'
  | 'camera'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'gyroscope'
  | 'magnetometer'
  | 'microphone'
  | 'notifications'
  | 'payment-handler'
  | 'persistent-storage'
  | 'push'
  | 'speaker'`
