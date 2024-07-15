import type { Ref } from 'react'

/**
 * @title useMergedRef
 */
export type UseMergedRef = <T>(...refs: PossibleRef<T>[]) => (node: T | null) => void

export type PossibleRef<T> = Ref<T> | undefined
