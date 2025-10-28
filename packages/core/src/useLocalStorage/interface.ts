import type { Dispatch, SetStateAction } from 'react'

/**
 * @title useLocalStorage
 * @returns 包含以下元素的元组：
 * - localStorage 的当前值。
 * - 更新 localStorage 值的函数。
 * @returns_en A tuple with the following elements:
 * - The current value of the localStorage.
 * - A function to update the value of the localStorage.
 * @returns_zh-Hant 包含以下元素的元組：
 * - localStorage 的當前值。
 * - 更新 localStorage 值的函數。
 * @returns_ru Кортеж со следующими элементами:
 * - Текущее значение localStorage.
 * - Функция для обновления значения localStorage.
 */
export type UseLocalStorage = <
  T extends string | number | boolean | object | null,
>(
  /**
   * @zh 键值
   * @zh-Hant 鍵值
   * @ru ключ
   * @en key
   */
  key: string,
  /**
   * @zh 默认值
   * @zh-Hant 預設值
   * @ru значение по умолчанию
   * @en default value
   */
  defaultValue?: T,
  /**
   * @zh 可选参数
   * @zh-Hant 可選參數
   * @ru опциональные параметры
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
   * @zh-Hant 自訂資料序列化
   * @ru пользовательская сериализация данных
   */
  serializer?: UseLocalStorageSerializer<T>
  /**
   * @en On error callback
   * @zh 错误回调
   * @zh-Hant 錯誤回呼
   * @ru обратный вызов при ошибке
   * @defaultValue `console.error`
   */
  onError?: (error: unknown) => void
  /**
   * @en set to storage when nodata in first mount, deprecated
   * @zh 首次挂载时没有数据时设置到 storage, 已弃用
   * @zh-Hant 首次掛載時沒有資料時設定到 storage，已棄用
   * @ru установить в storage при отсутствии данных при первом монтировании, устарело
   * @deprecated
   */
  effectStorageValue?: T | (() => T)
  /**
   * @en set to storage when nodata in first mount
   * @zh 首次挂载时没有数据时设置到 storage
   * @zh-Hant 首次掛載時沒有資料時設定到 storage
   * @ru установить в storage при отсутствии данных при первом монтировании
   */
  mountStorageValue?: T | (() => T)
  /**
   * @en listen to storage changes
   * @zh 监听 storage 变化
   * @zh-Hant 監聽 storage 變化
   * @ru прослушивать изменения в storage
   * @defaultValue `true`
   */
  listenToStorageChanges?: boolean
}
/**
 * @title UseLocalStorageSerializer
 */
export interface UseLocalStorageSerializer<T> {
  /**
   * @en Custom data read
   * @zh 自定义数据读取
   * @zh-Hant 自訂資料讀取
   * @ru пользовательское чтение данных
   */
  read: (raw: string) => T
  /**
   * @en Custom data write
   * @zh 自定义数据写入
   * @zh-Hant 自訂資料寫入
   * @ru пользовательская запись данных
   */
  write: (value: T) => string
}
