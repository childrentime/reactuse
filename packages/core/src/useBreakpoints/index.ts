import { useCallback, useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { defaultWindow } from '../utils/browser'
import { isDev } from '../utils/is'
import type { UseBreakpoints, UseBreakpointsReturn } from './interface'

export const breakpointsTailwind = {
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
}

function listen(mql: MediaQueryList, onChange: () => void) {
  if ('addEventListener' in mql) {
    mql.addEventListener('change', onChange)
  }
  else {
    (mql as any).addListener?.(onChange)
  }
}

function unlisten(mql: MediaQueryList, onChange: () => void) {
  if ('removeEventListener' in mql) {
    mql.removeEventListener('change', onChange)
  }
  else {
    (mql as any).removeListener?.(onChange)
  }
}

export const useBreakpoints: UseBreakpoints = <K extends string>(
  breakpoints: Record<K, number>,
  options: { defaultWidth?: number } = {},
) => {
  const { defaultWidth = 0 } = options

  if (isDev) {
    for (const [name, width] of Object.entries(breakpoints)) {
      if (typeof width !== 'number' || Number.isNaN(width)) {
        console.error(
          `useBreakpoints: breakpoint "${name}" expected a number, got "${typeof width}".`,
        )
      }
    }
  }

  // Breakpoints are usually passed inline, so key everything on their values
  // rather than on the object's identity.
  const signature = JSON.stringify(
    (Object.entries(breakpoints) as [K, number][]).sort((a, b) => a[1] - b[1]),
  )
  const entries = useMemo(() => JSON.parse(signature) as [K, number][], [signature])

  // One pair of queries per breakpoint: at least as wide, and wider. The other
  // comparisons are their negations.
  const queries = useMemo(() => {
    if (!defaultWindow?.matchMedia) {
      return []
    }
    return entries.map(([, width]) => [
      defaultWindow!.matchMedia(`(min-width: ${width}px)`),
      defaultWindow!.matchMedia(`(min-width: ${width + 0.1}px)`),
    ])
  }, [entries])

  const subscribe = useCallback(
    (onChange: () => void) => {
      queries.forEach(pair => pair.forEach(mql => listen(mql, onChange)))
      return () => {
        queries.forEach(pair => pair.forEach(mql => unlisten(mql, onChange)))
      }
    },
    [queries],
  )

  const getServerSnapshot = () =>
    entries
      .map(([, width]) => `${+(defaultWidth >= width)}${+(defaultWidth > width)}`)
      .join('')

  const getSnapshot = () =>
    queries.length
      ? queries.map(([ge, gt]) => `${+ge.matches}${+gt.matches}`).join('')
      : getServerSnapshot()

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return useMemo(() => {
    const index = new Map(entries.map(([name], i) => [name, i]))
    const flag = (name: K, offset: number) => {
      const i = index.get(name)
      return i !== undefined && snapshot[i * 2 + offset] === '1'
    }
    const greaterOrEqual = (k: K) => flag(k, 0)
    const greater = (k: K) => flag(k, 1)
    const smaller = (k: K) => !greaterOrEqual(k)
    const smallerOrEqual = (k: K) => !greater(k)
    const between = (a: K, b: K) => greaterOrEqual(a) && smaller(b)
    const current = entries.map(([name]) => name).filter(greaterOrEqual)

    const result = {} as Record<K, boolean>
    for (const [name] of entries) {
      result[name] = greaterOrEqual(name)
    }

    return {
      ...result,
      greaterOrEqual,
      greater,
      smaller,
      smallerOrEqual,
      between,
      current,
      active: current[current.length - 1],
    } as UseBreakpointsReturn<K>
  }, [entries, snapshot])
}
