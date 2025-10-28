import type { DependencyList } from 'react'

/**
 *
 * @title useAsyncEffect
 */
export type UseAsyncEffect = <T>(
/**
 * @zh 支持promise的副作用函数
 * @zh-Hant 支援promise的副作用函數
 * @ru эффект, поддерживающий promise
 * @en effect that support promise
 */
  effect: () => Promise<T> | T,
/**
 * @zh 清理函数
 * @zh-Hant 清理函數
 * @ru функция очистки
 * @en cleanup function
 * @defaultValue () => {}
 */
  cleanup?: typeof effect,
/**
 * @zh 依赖列表
 * @zh-Hant 依賴列表
 * @ru список зависимостей
 * @en dependency list
 */
  deps?: DependencyList
) => void
