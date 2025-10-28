/**
 * @title useMount
 */
export type UseMount = (
  /**
   * @zh 副作用函数
   * @zh-Hant 副作用函數
   * @ru функция эффекта
   * @en effect function
   */
  effect: () => void
) => void
