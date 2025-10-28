import type { Ref } from 'react'

/**
 * @title useMergedRef
 * @returns 合并多个 ref 的函数
 * @returns_en A function that merges multiple refs
 * @returns_zh-Hant 合併多個 ref 的函數
 * @returns_ru Функция, которая объединяет несколько ref
 */
export type UseMergedRef = <T>(...refs: PossibleRef<T>[]) => (node: T | null) => void

export type PossibleRef<T> = Ref<T> | undefined
