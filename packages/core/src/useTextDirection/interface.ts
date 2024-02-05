/**
 * @title useTextDirection
 * @returns 包含以下元素的元组：
 * - 文字方向。
 * - 更新文字方向值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the text direction.
 * - A function to update the value of the text direction.
 */
export type UseTextDirection = (
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseTextDirectionOptions
) => readonly [UseTextDirectionValue, (value: UseTextDirectionValue) => void];

/**
 * @title UseTextDirectionOptions
 */
export interface UseTextDirectionOptions {
  /**
   * @en CSS Selector for the target element applying to
   * @zh 适用于目标元素的 CSS 选择器
   * @defaultValue 'html'
   */
  selector?: string;
  /**
   * @en Initial value
   * @zh 初始值
   * @defaultValue 'ltr'
   */
  initialValue?: UseTextDirectionValue;
}

/**
 * @title UseTextDirectionValue
 */
export type UseTextDirectionValue = "ltr" | "rtl" | "auto";
