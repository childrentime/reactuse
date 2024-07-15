/**
 * @title useFileDialog
 * @returns 包含以下元素的元组：
 * - 文件数组。
 * - 打开文件选择器函数。
 * - 重置函数。
 * @returns_en A tuple with the following elements:
 * - file array.
 * - A function to open file dialog.
 * - A function to reset files
 */
export type UseFileDialog = (
  options?: UseFileDialogOptions
) => readonly [
  FileList | null,
  (localOptions?: Partial<UseFileDialogOptions>) => Promise<FileList | null | undefined>,
  () => void,
]

/**
 * @title UseFileDialogOptions
 */
export interface UseFileDialogOptions {
  /**
   * @zh 选择多个文件
   * @en choose multiple file
   * @defaultValue true
   */
  multiple?: boolean
  /**
   * @zh 可以接受的文件类型
   * @en accept file type
   * @defaultValue '*'
   */
  accept?: string
  /**
   * @zh [指定设备，可以从麦克风或者摄像头中获取文件](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)
   * @en [Specify the device to obtain files from the microphone or camera](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)
   * @see [HTMLInputElement Capture](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)
   */
  capture?: string
}
