/**
 * @title useTextDirection
 * @returns 包含以下元素的元组：
 * - 文字方向。
 * - 更新文字方向值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the text direction.
 * - A function to update the value of the text direction.
 * @returns_zh-Hant 包含以下元素的元組：
 * - 文字方向。
 * - 更新文字方向值的函數。
 */
export type UseTextDirection = (
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @en optional params
   */
  options?: UseTextDirectionOptions
) => readonly [UseTextDirectionValue, (value: UseTextDirectionValue) => void]

/**
 * @title UseTextDirectionOptions
 */
export interface UseTextDirectionOptions {
  /**
   * @en CSS Selector for the target element applying to
   * @zh 适用于目标元素的 CSS 选择器
   * @zh-Hant 適用於目標元素的 CSS 選擇器
   * @defaultValue 'html'
   */
  selector?: string
  /**
   * @en Fallback direction, used when the target element has no `dir` attribute
   * @zh 兜底方向，目标元素没有 `dir` 属性时使用
   * @zh-Hant 兜底方向，目標元素沒有 `dir` 屬性時使用
   * @defaultValue 'ltr'
   */
  initialValue?: UseTextDirectionValue
}

/**
 * @title UseTextDirectionValue
 */
export type UseTextDirectionValue = 'ltr' | 'rtl' | 'auto'
