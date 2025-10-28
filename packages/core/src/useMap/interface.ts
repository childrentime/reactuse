/**
 * @title useMap
 * @returns_en An object with the following properties:
 * - map: The current Map instance.
 * - set: A function to set a key-value pair in the map.
 * - get: A function to get a value by key from the map.
 * - remove: A function to remove a key from the map and return whether it existed.
 * - has: A function to check if a key exists in the map.
 * - clear: A function to clear all entries from the map.
 * - reset: A function to reset the map to its initial state.
 * - size: The current size of the map.
 * @returns 包含以下属性的对象：
 * - map: 当前的 Map 实例。
 * - set: 在 map 中设置键值对的函数。
 * - get: 通过键从 map 中获取值的函数。
 * @returns_zh-Hant 包含以下屬性的對象：
 * - map: 當前的 Map 實例。
 * - set: 在 map 中設定鍵值對的函數。
 * - get: 通過鍵從 map 中獲取值的函數。
 * - remove: 從 map 中刪除鍵並返回是否存在的函數。
 * - has: 檢查鍵是否存在於 map 中的函數。
 * - clear: 清除 map 中所有條目的函數。
 * - reset: 將 map 重置為其初始狀態的函數。
 * - size: map 的當前大小。
 * @returns_ru Объект со следующими свойствами:
 * - map: Текущий экземпляр Map.
 * - set: Функция для установки пары ключ-значение в map.
 * - get: Функция для получения значения по ключу из map.
 * - remove: Функция для удаления ключа из map и возврата информации о его существовании.
 * - has: Функция для проверки существования ключа в map.
 * - clear: Функция для очистки всех записей в map.
 * - reset: Функция для сброса map к начальному состоянию.
 * - size: Текущий размер map.
 */
export type UseMap<K = any, V = any> = (
  /**
   * @zh 初始值，可以为 Map 实例、数组或者一个初始化的函数
   * @zh-Hant 初始值，可以為 Map 實例、數組或者一個初始化的函數
   * @ru Начальное значение map. Может быть экземпляром Map, массивом пар ключ-значение или функцией, возвращающей начальные записи.
   * @en The initial value of the map. It can be a Map instance, an array of key-value pairs, or a function that returns initial entries.
   */
  initialValue?: Map<K, V> | readonly (readonly [K, V])[] | (() => Map<K, V> | readonly (readonly [K, V])[])
) => {
  readonly map: Map<K, V>
  readonly set: (key: K, value: V) => void
  readonly get: (key: K) => V | undefined
  readonly remove: (key: K) => boolean
  readonly has: (key: K) => boolean
  readonly clear: () => void
  readonly reset: () => void
  readonly size: number
}
