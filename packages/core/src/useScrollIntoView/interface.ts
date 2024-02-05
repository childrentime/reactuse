import type { BasicTarget } from "../utils/domTarget";

/**
 * @title useScrollIntoView
 * @returns 包含以下元素的对象：
 * - scrollIntoView：滚动进入视口函数。
 * - cancel： 取消滚动函数。
 * @returns_en A object with the following elements:
 * - scrollIntoView: scroll target element into viewport
 * - cancel: cancel scroll function
 */
export type UseScrollIntoView = (
  /**
   * @zh dom对象
   * @en dom element
   */
  targetElement: BasicTarget<HTMLElement>,
  /**
   * @zh 可选参数
   * @en optional params
   */ params?: UseScrollIntoViewParams,
  /**
   * @zh 滚动容器
   * @en scroll container
   */
  scrollElement?: BasicTarget<HTMLElement>
) => {
  scrollIntoView: (animation?: UseScrollIntoViewAnimation) => void;
  cancel: () => void;
};

/**
 * @title UseScrollIntoViewAnimation
 */
export interface UseScrollIntoViewAnimation {
  /**
   * @en target element alignment relatively to parent based on current axis
   * @zh 基于当前轴的目标元素相对于父元素的对齐方式
   */
  alignment?: "start" | "end" | "center";
}

/**
 * @title  UseScrollIntoViewParams
 */
export interface UseScrollIntoViewParams {
  /**
   * @en callback fired after scroll
   * @zh 滚动完成回调
   */
  onScrollFinish?: () => void;

  /**
   * @en duration of scroll in milliseconds
   * @zh 滚动时间
   * @defaultValue 1250
   */
  duration?: number;

  /**
   * @en axis of scroll
   * @zh 滚动方向
   * @defaultValue y
   */
  axis?: "x" | "y";

  /**
   * @en custom mathematical easing function
   * @zh 自定义缓和数学函数
   * @defaultValue (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
   */
  easing?: (t: number) => number;

  /**
   * @en additional distance between nearest edge and element
   * @zh 最近的边缘和元素之间的附加距离
   * @defaultValue 0
   */
  offset?: number;

  /**
   * @en indicator if animation may be interrupted by user scrolling
   * @zh 指示动画是否可能因用户滚动而中断
   * @defaultValue true
   */
  cancelable?: boolean;

  /**
   * @en prevents content jumping in scrolling lists with multiple targets
   * @zh 防止内容在具有多个目标的滚动列表中跳跃
  */
  isList?: boolean;
}
