import { useLayoutEffect } from 'react'
import createOnceEffect from '../createOnceEffect'

export const useOnceLayoutEffect = createOnceEffect(useLayoutEffect)
