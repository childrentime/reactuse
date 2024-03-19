export type Platform = "ios" | "android" | "unknown";

/**
 * @title UsePlatformProps
 */
export interface UsePlatformProps {
  /**
   * @zh 服务端渲染时，需要传递 `userAgent`
   * @en When server rendering, you need to pass `userAgent`
   */
  userAgent?: string;
}

/**
 * @title usePlatform
 * @returns 和平台相关的对象
 * @returns_en object that related to platform
 */
export type UsePlatform = (props?: UsePlatformProps) => UsePlatformReturn

/**
 * @title UsePlatformReturn
 */
export interface UsePlatformReturn {
    /**
   * @zh 平台
   * @en platform
   */
    platform: Platform;
    /**
     * @zh 是否在小程序中
     * @en Whether in mini program
     */
    isInMiniProgram: () => boolean;
    /**
     * @zh 是否在微信中
     * @en whether in wechat
     */
    isInWechat: () => boolean;
    /**
     * @zh 是否是 iPhoneX
     * @en whether is iPhoneX
     */
    isiPhoneX: () => boolean;
}
