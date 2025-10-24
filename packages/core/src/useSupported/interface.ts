/**
 * @title useSupported
 * @returns 浏览器是否支持
 * @returns_en whether the browser support
 * @returns_zh-Hant 瀏覽器是否支援
 */
export type UseSupported = (
  /**
   * @zh 测试回调
   * @zh-Hant 測試回調
   * @en test callback
   */
  callback: () => unknown,
  /**
   * @zh 使用 useLayoutEffect来进行测试
   * @zh-Hant 使用 useLayoutEffect來進行測試
   * @en use useLayoutEffect to test
   * @defaultValue false
   */
  sync?: boolean
) => boolean
