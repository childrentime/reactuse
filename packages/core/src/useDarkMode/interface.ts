/**
 * @title UseDarkOptions
 */
export interface UseDarkOptions {
  /**
   * @en CSS Selector for the target element applying to
   * @zh 适用于目标元素的 CSS 选择器
   * @zh-Hant 適用於目標元素的 CSS 選擇器
   * @defaultValue 'html'
   */
  selector?: string

  /**
   * @en HTML attribute applying the target element
   * @zh 应用到目标元素的 html 属性
   * @zh-Hant 應用到目標元素的 html 屬性
   * @defaultValue 'class'
   */
  attribute?: string
  /**
   * @en default value
   * @zh 默认值
   * @zh-Hant 預設值
   * @defaultValue false
   */
  defaultValue?: boolean
  /**
   * @en Key to persist the data into localStorage/sessionStorage.
   * @zh 将数据持久保存到 localStorage/sessionStorage 的键值
   * @zh-Hant 將資料持久保存到 localStorage/sessionStorage 的鍵值
   * @defaultValue 'reactuses-color-scheme'
   */
  storageKey?: string
  /**
   * @en Storage object, can be localStorage or sessionStorage
   * @zh 存储对象，可以是localStorage或sessionStorage
   * @zh-Hant 儲存對象，可以是localStorage或sessionStorage
   * @defaultValue `localStorage`
   */
  storage?: () => Storage
  /**
   * @en name dark apply to element
   * @zh  应用到目标元素上黑色类名称
   * @zh-Hant 應用到目標元素上黑色類名稱
   */
  classNameDark: string
  /**
   * @en name light apply to element
   * @zh 应用到目标元素上的亮色类名称
   * @zh-Hant 應用到目標元素上的亮色類名稱
   */
  classNameLight: string
}

/**
 * @title useDarkMode
 * @returns_en A tuple with the following elements:
 * - The current value of the dark state.
 * - A function to toggle the dark state.
 * -  A function to update the dark state.
 * @returns 包含以下元素的元组：
 * - 黑暗状态的当前值。
 * - 切换黑暗状态的功能。
 * - 更新黑暗状态的功能。
 * @returns_zh-Hant 包含以下元素的元組：
 * - 黑暗狀態的當前值。
 * - 切換黑暗狀態的功能。
 * - 更新黑暗狀態的功能。
 */
export type UseDarkMode = (
  options: UseDarkOptions
) => readonly [
  boolean | null,
  () => void,
  React.Dispatch<React.SetStateAction<boolean | null>>,
]
