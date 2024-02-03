/**
 * @title Plus
 * @zh 两数相乘
 * @en Multiply two numbers
 * @returns Product of two numbers
 */
type Plus = (
  /**
   * @en First number
   * @zh 被乘数
   */
  a: number,
  /**
   * @en Second number
   * @zh 乘数
   * @defaultValue 1
   */
  b: number
) => number;

/**
 * @title Add
 * @en Add two numbers
 * @zh 两数相加
 * @returns Sum of two numbers
 * @version 1.0.0
 */
function Add(
  /**
   * @zh 被加数
   * @en First number
   */
  a: number,
  /**
   * @zh 加数
   * @en Second number
   */
  b = 5
) {
  return a + b;
}

/**
 * @title Button
 * @zh 按钮
 * @en Button
 */
type ButtonType = {
  /**
   * @zh 尺寸
   * @en Size
   * @defaultValue default
   */
  size?: 'mini' | 'large' | 'default';
  /**
   * @zh 颜色
   * @en Color
   * @version 1.2.0
   */
  color?: string;
};
