import { ReactNode, PropsWithChildren } from 'react';
import { BlinkProps, ClinkProps, ShouldBeIgnoredProps } from './components/Blink/interface';

export interface OptionInfo extends PropsWithChildren<BlinkProps> {
  valid: boolean;
  index: number;
  origin: 'children' | 'options' | 'userCreatedOptions' | 'userCreatingOption';
}

/**
 * @title A
 *
 * @zh 这是接口描述。
 * @en This is interface description.
 *
 */
export interface AProps {
  /**
   * @zh 树选择数据属性
   * @en treeSelectDataType
   */
  treeSelectDataType?: TreeSelectDataType;
  /**
   * @zh 点击回调
   * @en onClick
   */
  onClick: (num: number) => void;
  /**
   * @zh 属性 B
   * @en BProps
   */
  b: BlinkProps;
  /**
   * @zh 属性 baseB
   * @en baseBlink
   */
  unionBlink: UnionBlinkProps;
  /**
   * @zh 操作项
   * @en action
   */
  action?: ReactNode;
  /**
   * @zh 负责人
   * @en owner
   */
  owner?: Partial<Owner>;
  /**
   * @zh 尺寸
   * @en size
   */
  size?: Size;
  /**
   * @zh 列配置
   * @en column settings
   * @defaultValue {}
   */
  columns?: ColProps;
  /**
   * @zh 排序
   * @en sorter
   */
  sorter: (a: SorterProps, b: SorterProps) => Promise<void>;
  /**
   * @zh 方向
   * @en direction
   */
  direction?: Direction;
  /**
   * @zh 选项
   * @en option
   */
  option: OptionInfo;
  shouldBeIgnoreProps: ShouldBeIgnoredProps;
}

export interface ColProps {
  // width of the column
  width?: number;
  name?: string;
  onColumnCallback: (param: onColumnCallbackProps) => number;
}

type SizeObject = { [key in string]: number };
export type Size = number | string | SizeObject;

enum Direction {
  LEFT,
  RIGHT,
  UP,
  DOWN,
}

interface SorterProps {
  counter: number;
}

interface onColumnCallbackProps {
  // index of column
  index: string;
  position: { x: number; y: number };
}

interface Owner {
  name: string;
  age: number;
}

export type TreeSelectDataType = TreeDataType & {
  getInnerMethods: (inner: boolean) => InnerMethodsReturnType;
};

export type TreeDataType = {
  key?: string;
  _index?: number;
  children: TreeDataType[];
  loadMore: (data: TreeDataType) => void;
};

interface InnerMethodsReturnType {
  text: string;
}

type UnionBlinkProps = ClinkProps & BlinkProps;
