import type { RefObject } from "react";

/**
 * @title useDropZone
 * @returns 文件是否在区域上
 * @returns_en Whether the file is on the zone
 */
export type UseDropZone = (
  /**
   * @zh 目标元素
   * @en target element
   */
  target: RefObject<EventTarget>,
/**
   * @zh 拖拽释放时候的回调
   * @en drop callback
   */
  onDrop?: ((files: File[] | null) => void) | undefined
) => boolean;
