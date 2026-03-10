/**
 * @title useImage
 * @returns_en Image loading state
 * @returns_zh 图片加载状态
 * @returns_zh-Hant 圖片載入狀態
 */
export interface UseImageOptions {
  /**
   * @en Image source URL
   * @zh 图片源URL
   * @zh-Hant 圖片源URL
   */
  src: string
  /**
   * @en Image srcset attribute
   * @zh 图片srcset属性
   * @zh-Hant 圖片srcset屬性
   */
  srcset?: string
  /**
   * @en Image sizes attribute
   * @zh 图片sizes属性
   * @zh-Hant 圖片sizes屬性
   */
  sizes?: string
}

export interface UseImageState {
  /**
   * @en Whether the image is loading
   * @zh 图片是否正在加载
   * @zh-Hant 圖片是否正在載入
   */
  isLoading: boolean
  /**
   * @en Error if image failed to load
   * @zh 图片加载失败的错误
   * @zh-Hant 圖片載入失敗的錯誤
   */
  error: string | Event | undefined
}

export type UseImage = (options: UseImageOptions) => UseImageState
