/**
 * @title useFavicon
 */
export type UseFavicon = (
  /**
   * @zh 图标路径
   * @zh-Hant 圖標路徑
   * @ru путь к иконке
   * @en icon href
   */
  href: string,
  /**
   * @zh 基础 url
   * @zh-Hant 基礎 url
   * @ru базовый url
   * @en base url
   */
  baseUrl?: string,
  /**
   * @zh 设置 link 标签的 rel 属性
   * @zh-Hant 設定 link 標籤的 rel 屬性
   * @ru установить атрибут rel для элемента link
   * @en set rel attribute to link element
   * @defaultValue icon
   */
  rel?: string
) => void
