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
   * @zh-Hant 像素比率
   * @ru соотношение пикселей
   * @en Pixel ratio
   */
  pixelRatio: number
}
