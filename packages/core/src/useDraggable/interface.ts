import type { Dispatch, RefObject, SetStateAction } from "react";
import type { PointerType, Position } from "../utils/types";
import type { BasicTarget } from "../utils/domTarget";

/**
 * @title useDraggable
 * @returns 包含以下元素的元组：
 * - x
 * - y
 * - 元素是否在拖动中
 * - 设置元素的位置
 * @returns_en A tuple with the following elements:
 * - x
 * - y
 * - Whether the element is being dragged
 * set the element position
 */
export type UseDraggable = (
  /**
   * @zh dom对象
   * @en dom element
   */
  target: BasicTarget<HTMLElement | SVGElement>,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseDraggableOptions
) => readonly [number, number, boolean, Dispatch<SetStateAction<Position>>];

/**
 * @title  UseDraggableOptions
 */
export interface UseDraggableOptions {
  /**
   * @en Only start the dragging when click on the element directly
   * @zh 仅当直接单击元素时才开始拖动
   * @defaultValue false
   */
  exact?: boolean;

  /**
   * @en Prevent events defaults
   * @zh 阻止默认事件
   * @defaultValue false
   */
  preventDefault?: boolean;

  /**
   * @en Prevent events propagation
   * @zh 阻止事件冒泡
   * @defaultValue false
   */
  stopPropagation?: boolean;

  /**
   * @en Element to attach `pointermove` and `pointerup` events to.
   * @zh 将“pointermove”和“pointerup”事件附加到的dom元素
   * @defaultValue window
   */
  draggingElement?: BasicTarget<HTMLElement | SVGElement>;

  /**
   * @en Element for calculating bounds (If not set, it will use the event's target).
   * @zh 设置拖拽容器边界
   * @defaultValue undefined
   */
  containerElement?: BasicTarget<HTMLElement | SVGAElement>;

  /**
   * @en Handle that triggers the drag event
   * @zh 触发拖动事件的dom元素
   * @defaultValue target
   */
  handle?: RefObject<HTMLElement | SVGElement>;

  /**
   * @en Pointer types that listen to.
   * @zh 监听的事件类型
   * @defaultValue ['mouse', 'touch', 'pen']
   */
  pointerTypes?: PointerType[];

  /**
   * @en Initial position of the element.
   * @zh 初始的元素位置
   * @defaultValue { x: 0, y: 0 }
   */
  initialValue?: Position;

  /**
   * @en Callback when the dragging starts. Return `false` to prevent dragging.
   * @zh 拖动开始时的回调。 返回“false”以防止拖动
   */
  onStart?: (position: Position, event: PointerEvent) => void | false;

  /**
   * @en Callback during dragging.
   * @zh 拖动时候的回调
   */
  onMove?: (position: Position, event: PointerEvent) => void;

  /**
   * @en Callback when dragging end.
   * @zh 拖动结束的回调
   */
  onEnd?: (position: Position, event: PointerEvent) => void;
}
