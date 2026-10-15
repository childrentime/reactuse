/**
 * @title Breakpoints
 */
export type Breakpoints<K extends string = string> = Record<K, number>

/**
 * @title UseBreakpointsOptions
 */
export interface UseBreakpointsOptions {
  /**
   * @en The viewport width, in pixels, assumed on the server and during hydration. Use it to render the layout most of your visitors will see.
   * @zh 在服务端和水合期间假定的视口宽度（像素）。可设为大多数访问者会看到的布局对应的宽度。
   * @zh-Hant 在伺服器端和水合期間假定的視口寬度（像素）。可設為大多數訪客會看到的版面對應的寬度。
   * @defaultValue 0
   */
  defaultWidth?: number
}

/**
 * @title UseBreakpointsReturn
 */
export type UseBreakpointsReturn<K extends string = string> = Record<K, boolean> & {
  /**
   * @en Whether the viewport is at least as wide as the breakpoint
   * @zh 视口宽度是否大于或等于该断点
   * @zh-Hant 視口寬度是否大於或等於該斷點
   */
  greaterOrEqual: (k: K) => boolean
  /**
   * @en Whether the viewport is wider than the breakpoint
   * @zh 视口宽度是否大于该断点
   * @zh-Hant 視口寬度是否大於該斷點
   */
  greater: (k: K) => boolean
  /**
   * @en Whether the viewport is narrower than the breakpoint
   * @zh 视口宽度是否小于该断点
   * @zh-Hant 視口寬度是否小於該斷點
   */
  smaller: (k: K) => boolean
  /**
   * @en Whether the viewport is at most as wide as the breakpoint
   * @zh 视口宽度是否小于或等于该断点
   * @zh-Hant 視口寬度是否小於或等於該斷點
   */
  smallerOrEqual: (k: K) => boolean
  /**
   * @en Whether the viewport is at least as wide as `a` and narrower than `b`
   * @zh 视口宽度是否大于或等于 `a` 且小于 `b`
   * @zh-Hant 視口寬度是否大於或等於 `a` 且小於 `b`
   */
  between: (a: K, b: K) => boolean
  /**
   * @en Every breakpoint the viewport has reached, from smallest to largest
   * @zh 视口已达到的所有断点，从小到大排列
   * @zh-Hant 視口已達到的所有斷點，從小到大排列
   */
  current: K[]
  /**
   * @en The largest breakpoint the viewport has reached, or undefined below the smallest one
   * @zh 视口已达到的最大断点，小于最小断点时为 undefined
   * @zh-Hant 視口已達到的最大斷點，小於最小斷點時為 undefined
   */
  active: K | undefined
}

/**
 * @title useBreakpoints
 * @returns_en A boolean per breakpoint (true once the viewport is at least that wide), comparison helpers, and the current and active breakpoints
 * @returns 每个断点对应一个布尔值（视口宽度达到该断点时为 true），以及比较函数和当前、活动断点
 * @returns_zh-Hant 每個斷點對應一個布林值（視口寬度達到該斷點時為 true），以及比較函數和目前、活動斷點
 */
export type UseBreakpoints = <K extends string>(
  /**
   * @en A map from breakpoint name to its minimum viewport width in pixels
   * @zh 断点名称到其最小视口宽度（像素）的映射
   * @zh-Hant 斷點名稱到其最小視口寬度（像素）的對應
   */
  breakpoints: Breakpoints<K>,
  /**
   * @en Options
   * @zh 可选参数
   * @zh-Hant 可選參數
   */
  options?: UseBreakpointsOptions
) => UseBreakpointsReturn<K>
