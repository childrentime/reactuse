/**
 * @title useScriptTag
 * @returns 包含以下元素的元组：
 * - 用来加载资源的 html 元素。
 * - 资源加载状态。
 * - 资源加载函数。
 * - 资源卸载函数
 * @returns_en A tuple with the following elements:
 * - html element used to load resources.
 * - Resource loading status.
 * - Resource loading function.
 * - Resource unloading function
 * @returns_zh-Hant 包含以下元素的元組：
 * - 用來加載資源的 html 元素。
 * - 資源加載狀態。
 * - 資源加載函數。
 * - 資源卸載函數
 * @returns_ru Кортеж со следующими элементами:
 * - html элемент, используемый для загрузки ресурсов.
 * - статус загрузки ресурса.
 * - функция загрузки ресурса.
 * - функция разгрузки ресурса.
 */
export type UseScriptTag = (
  /**
   * @zh 资源地址
   * @zh-Hant 資源地址
   * @en source
   * @ru адрес ресурса
   */
  src: string,
  /**
   * @zh 资源加载完成的回调
   * @zh-Hant 資源加載完成的回調
   * @en source loaded callback
   * @ru callback, вызываемый после загрузки ресурса
   */
  onLoaded?: (el: HTMLScriptElement) => void,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @en optional params
   * @ru опциональные параметры
   */
  options?: UseScriptTagOptions
) => readonly [
  HTMLScriptElement | null,
  UseScriptTagStatus,
  (waitForScriptLoad?: boolean) => Promise<HTMLScriptElement | boolean>,
  () => void,
]

/**
 * @title UseScriptTagOptions
 */
export interface UseScriptTagOptions {
  /**
   * @en Load the script immediately
   * @zh 立即加载资源
   * @zh-Hant 立即加載資源
   * @defaultValue true
   */
  immediate?: boolean

  /**
   * @en Add `async` attribute to the script tag
   * @zh 在 `script` 标签上加上 `async`
   * @zh-Hant 在 `script` 標籤上加上 `async`
   * @defaultValue true
   */
  async?: boolean

  /**
   * @en Script type
   * @zh 脚本类型
   * @zh-Hant 腳本類型
   * @defaultValue 'text/javascript'
   */
  type?: string

  /**
   * @en Manual controls the timing of loading and unloading
   * @zh 手动控制加载和卸载时机
   * @zh-Hant 手動控制加載和卸載時機
   * @defaultValue false
   */
  manual?: boolean

  /**
   * @zh 跨域属性
   * @zh-Hant 跨域屬性
   * @en cross origin
   */
  crossOrigin?: 'anonymous' | 'use-credentials'

  /**
   * @en referrer policy
   * @zh 来源属性
   * @zh-Hant 來源屬性
   */
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'

  /**
   * @en Add `noModule` attribute to the script tag
   * @zh 在 `script` 标签上加上 `noModule`
   * @zh-Hant 在 `script` 標籤上加上 `noModule`
   */
  noModule?: boolean

  /**
   * @en Add `defer` attribute to the script tag
   * @zh 在 `script` 标签上加上 `defer`
   * @zh-Hant 在 `script` 標籤上加上 `defer`
   */
  defer?: boolean

  /**
   * @en Add custom attribute to the script tag
   * @zh 在 script 标签上添加自定义属性
   * @zh-Hant 在 script 標籤上添加自定義屬性
   */
  attrs?: Record<string, string>
}

/**
 * @title UseScriptTagStatus
 */
export type UseScriptTagStatus = 'idle' | 'loading' | 'ready' | 'error'
