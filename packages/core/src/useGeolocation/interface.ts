/**
 * @title useGeoLocation
 * @returns 包含以下元素的对象：
 * - 坐标。
 * - 获取坐标的时间戳。
 * - 错误。
 * - 浏览器是否支持 `geolocation`。
 * @returns_en A object with the following elements:
 * - coordinates.
 * - timestamp when get coordinates.
 * - errors.
 * - Whether the browser supports `geolocation`.
 * @returns_zh-Hant 包含以下元素的對象：
 * - 坐標。
 * - 獲取坐標的時間戳。
 * - 錯誤。
 * - 瀏覽器是否支援 `geolocation`。
 * @returns_ru Объект со следующими элементами:
 * - координаты.
 * - временная метка получения координат.
 * - ошибки.
 * - поддерживает ли браузер `geolocation`.
 */
export type UseGeolocation = (
  /**
   * @zh 可选 `PositionOptions` 参数
   * @zh-Hant 可選 `PositionOptions` 參數
   * @ru опциональные параметры `PositionOptions`
   * @en optional `PositionOptions` params
   */
  options?: Partial<PositionOptions>
) => {
  readonly coordinates: GeolocationCoordinates
  readonly locatedAt: number | null
  readonly error: GeolocationPositionError | null
  /**
   * @zh 浏览器是否支持 `geolocation`
   * @ru поддерживает ли браузер `geolocation`
   * @en Whether the browser supports `geolocation`
   */
  readonly isSupported: boolean
}
