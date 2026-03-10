import type { BasicTarget } from '../utils/domTarget';

/**
 * @title useTextareaAutosize
 * @returns_en Auto-sizing textarea utilities
 * @returns_zh 自动调整大小的文本框工具
 * @returns_zh-Hant 自動調整大小的文字框工具
 */
export interface UseTextareaAutosizeOptions {
  /**
   * @en Minimum number of rows
   * @zh 最小行数
   * @zh-Hant 最小行數
   * @defaultValue 1
   */
  minRows?: number;
  /**
   * @en Maximum number of rows
   * @zh 最大行数
   * @zh-Hant 最大行數
   */
  maxRows?: number;
}

export interface UseTextareaAutosizeReturn {
  /**
   * @en Current textarea value
   * @zh 当前文本框的值
   * @zh-Hant 當前文字框的值
   */
  value: string;
  /**
   * @en Set the textarea value
   * @zh 设置文本框的值
   * @zh-Hant 設置文字框的值
   */
  setValue: (value: string) => void;
  /**
   * @en Manually trigger resize
   * @zh 手动触发调整大小
   * @zh-Hant 手動觸發調整大小
   */
  triggerResize: () => void;
}

export type UseTextareaAutosize = (
  target: BasicTarget<HTMLTextAreaElement>,
  options?: UseTextareaAutosizeOptions,
) => UseTextareaAutosizeReturn;
