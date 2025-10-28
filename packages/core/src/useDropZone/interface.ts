import type { BasicTarget } from '../utils/domTarget'

/**
 * @title useDropZone
 * @returns 文件是否在区域上
 * @returns_en Whether the file is on the zone
 * @returns_zh-Hant 檔案是否在區域上
 * @returns_ru находится ли файл в зоне
 */
export type UseDropZone = (
  /**
   * @zh 目标元素
   * @zh-Hant 目標元素
   * @ru целевой элемент
   * @en target element
   */
  target: BasicTarget<EventTarget>,
/**
 * @zh 拖拽释放时候的回调
 * @zh-Hant 拖拽釋放時候的回調
 * @ru обратный вызов при отпускании перетаскивания
 * @en drop callback
 */
  onDrop?: ((files: File[] | null) => void) | undefined
) => boolean
