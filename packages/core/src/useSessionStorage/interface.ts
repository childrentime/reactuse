import type { Dispatch, SetStateAction } from 'react'

/**
 * @title useSessionStorage
 * @returns 包含以下元素的元组：
 * - sessionStorage 的当前值。
 * - 更新 sessionStorage 值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the sessionStorage.
 * - A function to update the value of the sessionStorage.
 * @returns_zh-Hant 包含以下元素的元組：
 * - sessionStorage 的當前值。
 * - 更新 sessionStorage 值的函數。
 */
export type UseSessionStorage = <
  T extends string | number | boolean | object | null,
>(
  /**
   * @zh 键值
   * @zh-Hant 鍵值
   * @en key
   */
  key: string,
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @en default value
   */
  defaultValue?: T,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
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
   * @zh-Hant 自定義數據序列化
   */
  serializer?: UseSessionStorageSerializer<T>
  /**
   * @en On error callback
   * @zh 错误回调
   * @zh-Hant 錯誤回調
   * @defaultValue `console.error`
   */
  onError?: (error: unknown) => void
  /**
   * @en set to storage when nodata in first mount, deprecated
   * @zh 首次挂载时没有数据时设置到 storage, 已弃用
   * @zh-Hant 首次掛載時沒有數據時設置到 storage, 已棄用
   * @deprecated
   */
  effectStorageValue?: T | (() => T)
  /**
   * @en set to storage when nodata in first mount
   * @zh 首次挂载时没有数据时设置到 storage
   * @zh-Hant 首次掛載時沒有數據時設置到 storage
   */
  mountStorageValue?: T | (() => T)
  /**
   * @en listen to storage changes
   * @zh 监听 storage 变化
   * @zh-Hant 監聽 storage 變化
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
   * @zh-Hant 自定義數據讀取
   */
  read: (raw: string) => T
  /**
   * @en Custom data write
   * @zh 自定义数据写入
   * @zh-Hant 自定義數據寫入
   */
  write: (value: T) => string
}
