/**
 * @title useActiveElement
 * @returns_en Returns an instance of the type parameter `T` or `null`.
 * @returns 返回类型参数 `T` 或 `null` 的实例
 */
export type UseActiveElement = <T extends Element>() => T | null
