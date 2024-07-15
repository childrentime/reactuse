import { useEffect, useState } from 'react'
import { defaultOptions } from '../utils/defaults'
import { isBrowser } from '../utils/is'
import type {
  UseTextDirection,
  UseTextDirectionOptions,
  UseTextDirectionValue,
} from './interface'

export const useTextDirection: UseTextDirection = (
  options: UseTextDirectionOptions = defaultOptions,
) => {
  const { selector = 'html', initialValue = 'ltr' } = options
  const getValue = () => {
    if (initialValue !== undefined) {
      return initialValue
    }
    if (isBrowser) {
      return (
        (document
          ?.querySelector(selector)
          ?.getAttribute('dir') as UseTextDirectionValue) ?? initialValue
      )
    }
    // A default value has not been provided, and you are rendering on the server, warn of a possible hydration mismatch when defaulting to false.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '`useTextDirection` When server side rendering, defaultState should be defined to prevent a hydration mismatches.',
      )
    }
    return initialValue
  }
  const [value, setValue] = useState<UseTextDirectionValue>(getValue())

  useEffect(() => {
    setValue(
      document
        ?.querySelector(selector)
        ?.getAttribute('dir') as UseTextDirectionValue ?? initialValue,
    )
  }, [initialValue, selector])

  const set = (value: UseTextDirectionValue) => {
    if (!isBrowser) {
      return
    }
    if (value !== null) {
      document.querySelector(selector)?.setAttribute('dir', value)
    }
    else {
      document.querySelector(selector)?.removeAttribute('dir')
    }
    setValue(value)
  }

  return [value, set] as const
}
