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
 */
export type UseScriptTag = (
  /**
   * @zh 资源地址
   * @en source
   */
  src: string,
  /**
   * @zh 资源加载完成的回调
   * @en source loaded callback
   */
  onLoaded?: (el: HTMLScriptElement) => void,
  /**
   * @zh 可选参数
   * @en optional params
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
   * @defaultValue true
   */
  immediate?: boolean

  /**
   * @en Add `async` attribute to the script tag
   * @zh 在 `script` 标签上加上 `async`
   * @defaultValue true
   */
  async?: boolean

  /**
   * @en Script type
   * @zh 脚本类型
   * @defaultValue 'text/javascript'
   */
  type?: string

  /**
   * @en Manual controls the timing of loading and unloading
   * @zh 手动控制加载和卸载时机
   * @defaultValue false
   */
  manual?: boolean

  /**
   * @zh 跨域属性
   * @en cross origin
   */
  crossOrigin?: 'anonymous' | 'use-credentials'

  /**
   * @en referrer policy
   * @zh 来源属性
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
   */
  noModule?: boolean

  /**
   * @en Add `defer` attribute to the script tag
   * @zh 在 `script` 标签上加上 `defer`
   */
  defer?: boolean

  /**
   * @en Add custom attribute to the script tag
   * @zh 在 script 标签上添加自定义属性
   */
  attrs?: Record<string, string>
}

/**
 * @title UseScriptTagStatus
 */
export type UseScriptTagStatus = 'idle' | 'loading' | 'ready' | 'error'
