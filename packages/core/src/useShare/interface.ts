/**
 * @title useShare
 * @returns_en Web Share API hook
 * @returns_zh Web Share API Hook
 * @returns_zh-Hant Web Share API Hook
 */
export interface UseShareData {
  /**
   * @en Title to share
   * @zh 分享标题
   * @zh-Hant 分享標題
   */
  title?: string
  /**
   * @en Text to share
   * @zh 分享文本
   * @zh-Hant 分享文本
   */
  text?: string
  /**
   * @en URL to share
   * @zh 分享链接
   * @zh-Hant 分享連結
   */
  url?: string
}

export interface UseShareReturn {
  /**
   * @en Whether the Web Share API is supported
   * @zh 是否支持 Web Share API
   * @zh-Hant 是否支持 Web Share API
   */
  isSupported: boolean
  /**
   * @en Trigger the share dialog
   * @zh 触发分享对话框
   * @zh-Hant 觸發分享對話框
   */
  share: (data?: UseShareData) => Promise<void>
}

export type UseShare = (data?: UseShareData) => UseShareReturn
