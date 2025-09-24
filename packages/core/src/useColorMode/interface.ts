/**
 * @title UseColorModeOptions
 */
export interface UseColorModeOptions<T extends string = string> {
  /**
   * @en CSS Selector for the target element applying to
   * @zh 适用于目标元素的 CSS 选择器
   * @defaultValue 'html'
   */
  selector?: string

  /**
   * @en HTML attribute applying the target element
   * @zh 应用到目标元素的 html 属性
   * @defaultValue 'class'
   */
  attribute?: string

  /**
   * @en Available color modes
   * @zh 可用的颜色模式
   */
  modes: T[]

  /**
   * @en Default color mode
   * @zh 默认颜色模式
   */
  defaultValue?: T

  /**
   * @en Key to persist the data into localStorage/sessionStorage.
   * @zh 将数据持久保存到 localStorage/sessionStorage 的键值
   * @defaultValue 'reactuses-color-mode'
   */
  storageKey?: string

  /**
   * @en Storage object, can be localStorage or sessionStorage
   * @zh 存储对象，可以是localStorage或sessionStorage
   * @defaultValue `localStorage`
   */
  storage?: () => Storage | undefined

  /**
   * @en Function to get initial color mode from system preference
   * @zh 从系统偏好获取初始颜色模式的函数
   */
  initialValueDetector?: () => T

  /**
   * @en Mapping of color modes to their corresponding class names or attribute values
   * @zh 颜色模式到对应类名或属性值的映射
   */
  modeClassNames?: Partial<Record<T, string>>
}

/**
 * @title useColorMode
 * @returns_en A tuple with the following elements:
 * - The current color mode value.
 * - A function to set the color mode.
 * - A function to cycle through available modes.
 * @returns 包含以下元素的元组：
 * - 当前颜色模式值。
 * - 设置颜色模式的函数。
 * - 循环切换可用模式的函数。
 */
export type UseColorMode<T extends string = string> = (
  options: UseColorModeOptions<T>
) => readonly [
  T | null,
  React.Dispatch<React.SetStateAction<T | null>>,
  () => void,
]
