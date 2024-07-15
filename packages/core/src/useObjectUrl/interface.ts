/**
 * @title useObjectUrl
 * @returns 返回一个由 Blob 或 MediaSource 对象生成的 URL（如果存在），否则返回 undefined
 * @returns_en Returns a URL created from the Blob or MediaSource object, or undefined if none exists
 */
export type UseObjectUrl = (
  /**
   * @zh 文件或者媒体对象
   * @en file or media source
   */
  object: Blob | MediaSource
) => string | undefined
