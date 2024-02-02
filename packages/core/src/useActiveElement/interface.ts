/**
 * @title useActiveElement
 * @returns @en Returns an instance of the type parameter `T` or `null`.
 * @returns @zh 返回类型参数 `T` 或 `null` 的实例
 */
export type UseActiveElement = <T extends Element>() => T | null;
