/**
 * @title A
 *
 * @zh 这是接口描述。
 *
 * @en This is interface description.
 */
export interface AProps {
  /**
   * @zh 尺寸
   * @en size
   */
  size?: 'mini' | 'large' | 'default'
  /**
   * @zh 获取数据函数
   * @en Function to fetch data
   */
  fetchData?: () => Promise<string>
}
