import { useLayoutEffect } from 'react'
import createUpdateEffect from '../createUpdateEffect'

export const useUpdateLayoutEffect = createUpdateEffect(useLayoutEffect)
