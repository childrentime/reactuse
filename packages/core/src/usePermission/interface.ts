/**
 * @title usePermission
 * @returns 权限状态
 * @returns_en permission state
 * @returns_zh-Hant 權限狀態
 * @returns_ru состояние разрешения
 */
export type UsePermission = (
  /**
   * @zh 权限描述符
   * @zh-Hant 權限描述符
   * @ru дескриптор разрешения
   * @en permission desc
   */
  permissionDesc:
    | UsePermissionGeneralPermissionDescriptor
    | UsePermissionGeneralPermissionDescriptor['name']
) => UsePermissionState

/**
 * @title UsePermissionState
 */
export type UsePermissionState = PermissionState | ''

/**
 * @title UsePermissionGeneralPermissionDescriptor
 */
export type UsePermissionGeneralPermissionDescriptor =
  | PermissionDescriptor
  | { name: UsePermissionDescriptorNamePolyfill }

/**
 * @title UsePermissionDescriptorNamePolyfill
 */
export type UsePermissionDescriptorNamePolyfill =
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
  | 'speaker'
