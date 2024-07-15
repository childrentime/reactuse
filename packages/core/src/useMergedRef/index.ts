'use client'

import { useMemo } from 'react'
import type { PossibleRef } from './interface'

export function assignRef<T>(
  ref: PossibleRef<T>,
  value: T,
) {
  if (ref == null)
    return

  if (typeof ref === 'function') {
    ref(value)
    return
  }

  try {
    (ref as React.MutableRefObject<T>).current = value
  }
  catch (error) {
    throw new Error(`Cannot assign value '${value}' to ref '${ref}'`)
  }
}

export function mergeRefs<T>(...refs: PossibleRef<T>[]) {
  return (node: T | null) => {
    refs.forEach(ref => {
      assignRef(ref, node)
    })
  }
}

export function useMergedRefs<T>(...refs: PossibleRef<T>[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => mergeRefs(...refs), refs)
}
