/**
 * @title UseIdle
 * @returns 是否处于空闲
 * @returns_en whether user is idle
 * @returns_zh-Hant 是否處於空閒
 * @returns_ru находится ли пользователь в режиме бездействия
 */
export type UseIdle = (
  /**
   * @zh 检测时间
   * @zh-Hant 檢測時間
   * @ru время обнаружения
   * @en detection time
   * @defaultValue 60e3
   */
  ms?: number,
  /**
   * @zh 初始值
   * @zh-Hant 初始值
   * @ru начальное значение
   * @en initial value
   * @defaultValue false
   */
  initialState?: boolean,
  /**
   * @zh 监听的事件
   * @ru прослушиваемые события
   * @en listener events
   * @defaultValue ["mousemove","mousedown","resize","keydown","touchstart","wheel"]
   */
  events?: (keyof WindowEventMap)[]
) => boolean
