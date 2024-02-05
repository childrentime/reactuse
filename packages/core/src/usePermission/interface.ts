/**
 * @title usePermission
 * @returns 权限状态
 * @returns_en permission state
 */
export type UsePermission = (
  /**
   * @zh 权限描述符
   * @en permission desc
   */
  permissionDesc:
  | UsePermissionGeneralPermissionDescriptor
  | UsePermissionGeneralPermissionDescriptor["name"]
) => UsePermissionState;

/**
 * @title UsePermissionState
 */
export type UsePermissionState = PermissionState | "";

/**
 * @title UsePermissionGeneralPermissionDescriptor
 */
export type UsePermissionGeneralPermissionDescriptor =
  | PermissionDescriptor
  | { name: UsePermissionDescriptorNamePolyfill };

/**
 * @title UsePermissionDescriptorNamePolyfill
 */
export type UsePermissionDescriptorNamePolyfill =
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
  | "speaker";
