/**
 * @title useClipBoard
 * @returns_en Returns a readonly tuple containing the clipboard text, copy function, and support status.
 * @returns 返回包含剪贴板文本、复制函数和支持状态的只读元组.
 * @returns_zh-Hant 返回包含剪貼簿文字、複製函式和支援狀態的唯讀元組.
 */
export type UseClipboard = () => readonly [
  string,
  (txt: string) => Promise<void>,
  /**
   * @en Whether the browser supports the Clipboard API.
   * @zh 浏览器是否支持 Clipboard API.
   * @zh-Hant 瀏覽器是否支援 Clipboard API.
   */
  boolean,
]
