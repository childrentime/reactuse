export type Platform = 'ios' | 'android' | 'unknown'

/**
 * @title UsePlatformProps
 */
export interface UsePlatformProps {
  /**
   * @zh 服务端渲染时，需要传递 `userAgent`
   * @zh-Hant 服務端渲染時，需要傳遞 `userAgent`
   * @ru При серверном рендеринге необходимо передать `userAgent`
   * @en When server rendering, you need to pass `userAgent`
   */
  userAgent?: string
}

/**
 * @title usePlatform
 * @returns 和平台相关的对象
 * @returns_en object that related to platform
 * @returns_ru объект, связанный с платформой
 */
export type UsePlatform = (props?: UsePlatformProps) => UsePlatformReturn

/**
 * @title UsePlatformReturn
 */
export interface UsePlatformReturn {
  /**
   * @zh 平台
   * @ru платформа
   * @en platform
   */
  platform: Platform
  /**
   * @zh 是否在小程序中
   * @ru находится ли в мини-программе
   * @en Whether in mini program
   */
  isInMiniProgram: () => boolean
  /**
   * @zh 是否在微信中
   * @ru находится ли в WeChat
   * @en whether in wechat
   */
  isInWechat: () => boolean
  /**
   * @zh 是否是 iPhoneX
   * @ru является ли устройство iPhoneX
   * @en whether is iPhoneX
   */
  isiPhoneX: () => boolean
}
