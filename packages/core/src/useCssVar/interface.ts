import type { BasicTarget } from '../utils/domTarget'

export const defaultOptions: UseCssVarOptions = {
  observe: false,
}

/**
 * @title useCssVar
 * @returns_en A tuple with the following elements:
 * - The current value of the css var.
 * - A function to update the value of the css var.
 *  @returns 包含以下元素的元组：
 * - css 变量值
 * - 更新 css 变量值的函数
 * @returns_zh-Hant 包含以下元素的元組：
 * - css 變數值
 * - 更新 css 變數值的函數
 */
export type UseCssVar = <T extends HTMLElement = HTMLElement>(
  /**
   * @zh 属性值，比如 --color
   * @zh-Hant 屬性值，比如 --color
   * @en prop, eg: --color
   */
  prop: string,
  /**
   * @zh dom元素
   * @zh-Hant dom元素
   * @en dom element
   */
  target: BasicTarget<T>,
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @en default value
   */
  defaultValue?: string,
  /**
   * @zh 可选项
   * @zh-Hant 可選項
   * @en options
   */
  options?: UseCssVarOptions
) => readonly [string, (v: string) => void]

/**
 * @title UseCssVarOptions
 */
export interface UseCssVarOptions {
  /**
   * @en Use MutationObserver to monitor variable changes
   * @zh 使用 MutationObserver 来监听变量变更
   * @zh-Hant 使用 MutationObserver 來監聽變數變更
   * @defaultValue false
   */
  observe?: boolean
}
