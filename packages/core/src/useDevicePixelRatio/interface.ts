/**
 * @title UseDevicePixelRatio
 */
export type UseDevicePixelRatio = () => UseDevicePixelRatioReturn

/**
 * @title UseDevicePixelRatioReturn
 */
export interface UseDevicePixelRatioReturn {
  /**
   * @zh 像素比率
   * @en Pixel ratio
   */
  pixelRatio: number
}
