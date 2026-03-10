import { useCallback, useMemo } from 'react'
import { useWindowSize } from '../useWindowSize'
import type { Breakpoints, UseBreakpoints, UseBreakpointsReturn } from './interface'

export const breakpointsTailwind = {
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
}

export const breakpointsBootstrap = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
}

export const breakpointsAntDesign = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

export const useBreakpoints: UseBreakpoints = <K extends string>(breakpoints: Breakpoints<K>): UseBreakpointsReturn<K> => {
  const { width } = useWindowSize()

  const greater = useCallback((key: K) => width > breakpoints[key], [width, breakpoints])
  const greaterOrEqual = useCallback((key: K) => width >= breakpoints[key], [width, breakpoints])
  const smaller = useCallback((key: K) => width < breakpoints[key], [width, breakpoints])
  const smallerOrEqual = useCallback((key: K) => width <= breakpoints[key], [width, breakpoints])
  const between = useCallback((min: K, max: K) => width >= breakpoints[min] && width < breakpoints[max], [width, breakpoints])

  const current = useCallback(() => {
    const entries = Object.entries(breakpoints) as [K, number][]
    const sorted = entries.sort((a, b) => a[1] - b[1])
    return sorted.filter(([, value]) => width >= value).map(([key]) => key)
  }, [width, breakpoints])

  return useMemo(() => ({
    greater,
    greaterOrEqual,
    smaller,
    smallerOrEqual,
    between,
    current,
  }), [greater, greaterOrEqual, smaller, smallerOrEqual, between, current])
}
