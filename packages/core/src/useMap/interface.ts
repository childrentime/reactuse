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
 * - remove: 从 map 中删除键并返回是否存在的函数。
 * - has: 检查键是否存在于 map 中的函数。
 * - clear: 清除 map 中所有条目的函数。
 * - reset: 将 map 重置为其初始状态的函数。
 * - size: map 的当前大小。
 */
export type UseMap<K = any, V = any> = (
  /**
   * @zh 初始值，可以为 Map 实例、数组或者一个初始化的函数
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
