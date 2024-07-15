import type { Dispatch, SetStateAction } from 'react'

/**
 * @title useLocalStorage
 * @returns 包含以下元素的元组：
 * - localStorage 的当前值。
 * - 更新 localStorage 值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the localStorage.
 * - A function to update the value of the localStorage.
 */
export type UseLocalStorage = <
  T extends string | number | boolean | object | null,
>(
  /**
   * @zh 键值
   * @en key
   */
  key: string,
  /**
   * @zh 默认值
   * @en default value
   */
  defaultValue?: T,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseLocalStorageOptions<T>
) => readonly [T | null, Dispatch<SetStateAction<T | null>>]

/**
 * @title UseLocalStorageOptions
 */
export interface UseLocalStorageOptions<T> {
  /**
   * @en Custom data serialization
   * @zh 自定义数据序列化
   */
  serializer?: UseLocalStorageSerializer<T>
  /**
   * @en On error callback
   * @zh 错误回调
   * @defaultValue `console.error`
   */
  onError?: (error: unknown) => void
  /**
   * @en set to storage when storage doesn't has data in effect, fallback to `defaultValue`
   * @zh 当副作用执行的时候没有在 storage 中获取到数据时设置，默认会设置 `defaultValue`
   */
  effectStorageValue?: T | (() => T)
}

/**
 * @title UseLocalStorageSerializer
 */
export interface UseLocalStorageSerializer<T> {
  /**
   * @en Custom data read
   * @zh 自定义数据读取
   */
  read: (raw: string) => T
  /**
   * @en Custom data write
   * @zh 自定义数据写入
   */
  write: (value: T) => string
}
