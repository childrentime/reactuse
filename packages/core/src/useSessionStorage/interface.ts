import type { Dispatch, SetStateAction } from 'react'

/**
 * @title useSessionStorage
 * @returns 包含以下元素的元组：
 * - sessionStorage 的当前值。
 * - 更新 sessionStorage 值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the sessionStorage.
 * - A function to update the value of the sessionStorage.
 */
export type UseSessionStorage = <
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
  options?: UseSessionStorageOptions<T>
) => readonly [T | null, Dispatch<SetStateAction<T | null>>]

/**
 * @title UseSessionStorageOptions
 */
export interface UseSessionStorageOptions<T> {
  /**
   * @en Custom data serialization
   * @zh 自定义数据序列化
   */
  serializer?: UseSessionStorageSerializer<T>
  /**
   * @en On error callback
   * @zh 错误回调
   * @defaultValue `console.error`
   */
  onError?: (error: unknown) => void
  /**
   * @en set to storage when nodata in first mount, deprecated
   * @zh 首次挂载时没有数据时设置到 storage, 已弃用
   * @deprecated
   */
  effectStorageValue?: T | (() => T)
  /**
   * @en set to storage when nodata in first mount
   * @zh 首次挂载时没有数据时设置到 storage
   */
  mountStorageValue?: T | (() => T)
  /**
   * @en listen to storage changes
   * @zh 监听 storage 变化
   * @defaultValue `true`
   */
  listenToStorageChanges?: boolean
}

/**
 * @title UseSessionStorageSerializer
 */
export interface UseSessionStorageSerializer<T> {
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
