/**
 * @title usePreviousDistinct
 * @returns_en The previous distinct value (only updates when value actually changes)
 * @returns_zh 前一个不同的值（仅在值实际改变时更新）
 * @returns_zh-Hant 前一個不同的值（僅在值實際改變時更新）
 */
export type UsePreviousDistinct = <T>(value: T, compare?: (prev: T | undefined, next: T) => boolean) => T | undefined
