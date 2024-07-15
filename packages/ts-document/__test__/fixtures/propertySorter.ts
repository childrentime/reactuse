/**
 * @title Button
 * @zh 按钮
 * @en Button
 */
interface ButtonType {
  /**
   * @zh 自定义文本渲染
   * @en Custom text render
   */
  renderText?: () => string
  /**
   * @zh 尺寸
   * @en Size
   * @defaultValue default
   */
  size?: 'mini' | 'large' | 'default'
  /**
   * @zh TabIndex
   * @en TabIndex
   */
  tabIndex?: number
  /**
   * @zh 只读
   * @en Readonly
   */
  readonly?: boolean
  /**
   * @zh 颜色
   * @en Color
   * @version 1.2.0
   */
  color?: string
  /**
   * @zh 禁用
   * @en Disabled
   */
  disabled?: boolean
}
