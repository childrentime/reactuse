/**
 * @title useBatchedMount
 * @returns 已挂载的项目数
 * @returns_en number of items currently mounted
 * @returns_zh-Hant 已掛載的項目數
 */
export type UseBatchedMount = (
  /**
   * @zh 需要挂载的项目总数
   * @zh-Hant 需要掛載的項目總數
   * @en total number of items to mount
   */
  total: number,
  /**
   * @zh 每个空闲帧挂载的项目数
   * @zh-Hant 每個空閒幀挂載的項目數
   * @en number of items to mount per idle frame
   */
  batchSize: number
) => number
