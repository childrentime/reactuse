/**
 * @title useGeoLocation
 * @returns 包含以下元素的元组：
 * - 坐标。
 * - 获取坐标的时间戳。
 * - 错误。
 * @returns_en A tuple with the following elements:
 * - coordinates.
 * - timestamp when get coordinates.
 * - errors.
 */
export type UseGeolocation = (
  /**
   * @zh 可选 `PositionOptions` 参数
   * @en optional `PositionOptions` params
   */
  options?: Partial<PositionOptions>
) => {
  readonly coordinates: GeolocationCoordinates;
  readonly locatedAt: number | null;
  readonly error: GeolocationPositionError | null;
};
