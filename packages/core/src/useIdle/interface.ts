/**
 * @title UseIdle
 * @returns 是否处于空闲
 * @returns_en whether user is idle
 */
export type UseIdle = (
  /**
   * @zh 检测时间
   * @en detection time
   * @defaultValue 60e3
   */
  ms?: number,
  /**
   * @zh 初始值
   * @en initial value
   * @defaultValue false
   */
  initialState?: boolean,
  /**
   * @zh 监听的事件
   * @en listener events
   * @defaultValue ["mousemove","mousedown","resize","keydown","touchstart","wheel"]
   */
  events?: (keyof WindowEventMap)[]
) => boolean;
