/**
 * @title useObjectUrl
 * @returns 返回一个由 Blob 或 MediaSource 对象生成的 URL（如果存在），否则返回 undefined
 * @returns_en Returns a URL created from the Blob or MediaSource object, or undefined if none exists
 * @returns_zh-Hant 返回一個由 Blob 或 MediaSource 對象生成的 URL（如果存在），否則返回 undefined
 * @returns_ru Возвращает URL, созданный из объекта Blob или MediaSource, или undefined, если он не существует
 */
export type UseObjectUrl = (
  /**
   * @zh 文件或者媒体对象
   * @zh-Hant 檔案或者媒體對象
   * @ru файл или медиаисточник
   * @en file or media source
   */
  object: Blob | MediaSource
) => string | undefined
