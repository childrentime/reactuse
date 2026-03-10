import { useRef } from 'react'
import { useWindowSize } from '../useWindowSize'
import { useLatest } from '../useLatest'
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
  const widthRef = useLatest(width)
  const bpRef = useLatest(breakpoints)

  const actionsRef = useRef<UseBreakpointsReturn<K>>({
    greater: (key: K) => widthRef.current > bpRef.current[key],
    greaterOrEqual: (key: K) => widthRef.current >= bpRef.current[key],
    smaller: (key: K) => widthRef.current < bpRef.current[key],
    smallerOrEqual: (key: K) => widthRef.current <= bpRef.current[key],
    between: (min: K, max: K) => widthRef.current >= bpRef.current[min] && widthRef.current < bpRef.current[max],
    current: () => {
      const entries = Object.entries(bpRef.current) as [K, number][]
      return [...entries].sort((a, b) => a[1] - b[1]).filter(([, value]) => widthRef.current >= value).map(([key]) => key)
    },
  })

  return actionsRef.current
}
