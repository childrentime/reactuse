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
 */
export type UseGeolocation = (
  /**
   * @zh 可选 `PositionOptions` 参数
   * @en optional `PositionOptions` params
   */
  options?: Partial<PositionOptions>
) => {
  readonly coordinates: GeolocationCoordinates
  readonly locatedAt: number | null
  readonly error: GeolocationPositionError | null
  /**
   * @zh 浏览器是否支持 `geolocation`
   * @en Whether the browser supports `geolocation`
   */
  readonly isSupported: boolean
}
