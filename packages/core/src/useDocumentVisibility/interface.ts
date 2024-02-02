/**
 * @title useDocumentVisiblity
 * @returns @en document visibility
 * @returns @zh 文档可见性
 */
export type UseDocumentVisibility = (
  /**
   * @zh 默认值
   * @en default value
   */
  defaultValue?: DocumentVisibilityState
) => DocumentVisibilityState;
