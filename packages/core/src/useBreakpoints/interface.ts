/**
 * @title useBreakpoints
 * @returns_en Responsive breakpoint utilities
 * @returns_zh 响应式断点工具
 * @returns_zh-Hant 響應式斷點工具
 */
export type Breakpoints<K extends string = string> = Record<K, number>

export interface UseBreakpointsReturn<K extends string> {
  /**
   * @en Check if viewport width is greater than the breakpoint
   * @zh 检查视口宽度是否大于断点值
   * @zh-Hant 檢查視口寬度是否大於斷點值
   */
  greater: (key: K) => boolean
  /**
   * @en Check if viewport width is greater than or equal to the breakpoint
   * @zh 检查视口宽度是否大于等于断点值
   * @zh-Hant 檢查視口寬度是否大於等於斷點值
   */
  greaterOrEqual: (key: K) => boolean
  /**
   * @en Check if viewport width is smaller than the breakpoint
   * @zh 检查视口宽度是否小于断点值
   * @zh-Hant 檢查視口寬度是否小於斷點值
   */
  smaller: (key: K) => boolean
  /**
   * @en Check if viewport width is smaller than or equal to the breakpoint
   * @zh 检查视口宽度是否小于等于断点值
   * @zh-Hant 檢查視口寬度是否小於等於斷點值
   */
  smallerOrEqual: (key: K) => boolean
  /**
   * @en Check if viewport width is between two breakpoints
   * @zh 检查视口宽度是否在两个断点值之间
   * @zh-Hant 檢查視口寬度是否在兩個斷點值之間
   */
  between: (min: K, max: K) => boolean
  /**
   * @en Current matching breakpoint name
   * @zh 当前匹配的断点名称
   * @zh-Hant 當前匹配的斷點名稱
   */
  current: () => K[]
}

export type UseBreakpoints = <K extends string>(breakpoints: Breakpoints<K>) => UseBreakpointsReturn<K>

/**
 * @title breakpointsTailwind
 * @en Tailwind CSS default breakpoints
 * @zh Tailwind CSS 默认断点
 * @zh-Hant Tailwind CSS 預設斷點
 */
export declare const breakpointsTailwind: Breakpoints<'sm' | 'md' | 'lg' | 'xl' | '2xl'>

/**
 * @title breakpointsBootstrap
 * @en Bootstrap default breakpoints
 * @zh Bootstrap 默认断点
 * @zh-Hant Bootstrap 預設斷點
 */
export declare const breakpointsBootstrap: Breakpoints<'sm' | 'md' | 'lg' | 'xl' | 'xxl'>

/**
 * @title breakpointsAntDesign
 * @en Ant Design default breakpoints
 * @zh Ant Design 默认断点
 * @zh-Hant Ant Design 預設斷點
 */
export declare const breakpointsAntDesign: Breakpoints<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>
