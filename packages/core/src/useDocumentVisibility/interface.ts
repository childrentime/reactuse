/**
 * @title useDocumentVisiblity
 * @returns_en document visibility
 * @returns 文档可见性
 * @returns_zh-Hant 文檔可見性
 */
export type UseDocumentVisibility = (
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @en default value
   */
  defaultValue?: DocumentVisibilityState
) => DocumentVisibilityState
