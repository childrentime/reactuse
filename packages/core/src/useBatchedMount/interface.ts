/**
 * @title useBatchedMount
 * @returns 已挂载的项目数
 * @returns_en number of items currently mounted
 * @returns_zh-Hant 已掛載的項目數
 */
export type UseBatchedMount = (
  /**
   * @zh 需要挂载的项目总数。增大时保留已挂载的进度；减小时收敛到新的总数，而不是从第一批重新开始
   * @zh-Hant 需要掛載的項目總數。增大時保留已掛載的進度；減小時收斂到新的總數，而不是從第一批重新開始
   * @en total number of items to mount. Growing it preserves the progress already made; shrinking it clamps to the new total rather than restarting from the first batch
   */
  total: number,
  /**
   * @zh 每个空闲帧挂载的项目数。小于 1 的值按 1 处理，因此由尚未完成的测量得出的 batchSize 不会让列表永久停滞
   * @zh-Hant 每個空閒幀掛載的項目數。小於 1 的值以 1 處理，因此由尚未完成的量測得出的 batchSize 不會讓列表永久停滯
   * @en number of items to mount per idle frame. Values below 1 are treated as 1, so a batchSize derived from a measurement that has not settled yet cannot stall the list forever
   */
  batchSize: number
) => number
