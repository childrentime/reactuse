import { useEffect, useLayoutEffect } from 'react'
import { isBrowser } from '../utils/is'

export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect
