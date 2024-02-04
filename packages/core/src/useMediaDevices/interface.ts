/**
 * @title useMediaDevices
 * @returns 包含以下元素的元组：
 * - 媒体设备信息。
 * - 请求媒体设备权限。
 * @returns_en A tuple with the following elements:
 * - The media devices info.
 * - A function to request media devices permission.
 */
export type UseMediaDevices = (
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseMediaDeviceOptions
) => readonly [
  {
    devices: {
      deviceId: string;
      groupId: string;
      kind: MediaDeviceKind;
      label: string;
    }[];
  },
  () => Promise<boolean>,
];

/**
 * @title UseMediaDeviceOptions
 */
export interface UseMediaDeviceOptions {
  /**
   * @en Request for permissions immediately if it's not granted,
   * otherwise label and deviceIds could be empty
   * @zh 自动请求权限
   * @defaultValue false
   */
  requestPermissions?: boolean;
  /**
   * @en Request for types of media permissions
   * @zh 请求媒体权限类型
   * @defaultValue { audio: true, video: true }
   */
  constraints?: MediaStreamConstraints;
}
