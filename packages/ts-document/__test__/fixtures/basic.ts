import { ReactNode } from 'react';

/**
 * @title A
 *
 * @zh
 *
 * 这是接口描述。
 *
 * @en
 *
 * This is interface description.
 */
export interface AProps {
  /**
   * @zh 自定义操作项
   * @en this is action
   * @version 2.15.0
   */
  action?: ReactNode;
  /**
   * @zh 是否可以关闭
   * @en Whether Alert can be closed
   * @defaultValue {}
   */
  closable?: InnerProps;
}

export interface InnerProps {
  /**
   * @zh 位置
   * @en position
   */
  position?: string;
  /**
   * @zh 尺寸
   * @en Size
   */
  size?: string;
}
