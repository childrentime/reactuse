/**
 * @title useFavicon
 */
export type UseFavicon = (
  /**
   * @zh 图标路径
   * @en icon href
   */
  href: string,
  /**
   * @zh 基础 url
   * @en base url
   */
  baseUrl?: string,
  /**
   * @zh 设置 link 标签的 rel 属性
   * @en set rel attribute to link element
   * @defaultValue icon
   */
  rel?: string
) => void
