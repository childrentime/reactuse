/**
 * @title useMediaDevices
 * @returns 包含以下元素的元组：
 * - 媒体设备信息。
 * - 请求媒体设备权限。
 * @returns_en A tuple with the following elements:
 * - The media devices info.
 * - A function to request media devices permission.
 * @returns_zh-Hant 包含以下元素的元組：
 * - 媒體設備信息。
 * - 請求媒體設備權限。
 * @returns_ru Кортеж со следующими элементами:
 * - Информация о медиаустройствах.
 * - Функция для запроса разрешений медиаустройств.
 */
export type UseMediaDevices = (
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @ru опциональные параметры
   * @en optional params
   */
  options?: UseMediaDeviceOptions
) => readonly [
  {
    devices: {
      deviceId: string
      groupId: string
      kind: MediaDeviceKind
      label: string
    }[]
  },
  () => Promise<boolean>,
]

/**
 * @title UseMediaDeviceOptions
 */
export interface UseMediaDeviceOptions {
  /**
   * @en Request for permissions immediately if it's not granted,
   * otherwise label and deviceIds could be empty
   * @zh 自动请求权限
   * @zh-Hant 自動請求權限
   * @ru автоматически запрашивать разрешения
   * @defaultValue false
   */
  requestPermissions?: boolean
  /**
   * @en Request for types of media permissions
   * @zh 请求媒体权限类型
   * @zh-Hant 請求媒體權限類型
   * @ru типы запрашиваемых разрешений для медиа
   * @defaultValue { audio: true, video: true }
   */
  constraints?: MediaStreamConstraints
}
