import type { ReactElement, ReactNode } from "react";
import type { AProps, CProps as DProps, Option } from "./a";

type ExtendType = Pick<Pick<AProps & DProps, "bb" | "animation">, "animation" | "bb">;

/**
 * @title Alert
 * @zh
 * 向用户显示警告的信息时，通过警告提示，展现需要关注的信息。
 * @en
 * Display warning information to the user. the Alert is used to display the information that needs attention.
 */
export interface AlertProps extends ExtendType {
  children: ReactNode;
  /**
   * @zh 自定义操作项
   * @en this is action
   * @version 2.15.0
   */
  action: ReactElement;
  /**
   * @zh 是否可以关闭
   * @en Whether Alert can be closed
   * @defaultValue false
   */
  closable?: {
    a: boolean;
    b: string;
  };
  /**
   * @zh 回调参数
   * @en Callback function
   */
  callback?: (option: Option) => void;
}

interface InnerProps {
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

/**
 * @title Test
 */
export type TestType = InnerProps & AlertProps;
