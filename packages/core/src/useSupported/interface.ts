/**
 * @title useSupported
 * @returns 浏览器是否支持
 * @returns_en whether the browser support
 */
export type UseSupported = (
  /**
   * @zh 测试回调
   * @en test callback
   */
  callback: () => unknown,
  /**
   * @zh 使用 useLayoutEffect来进行测试
   * @en use useLayoutEffect to test
   * @defaultValue false
   */
  sync?: boolean
) => boolean
