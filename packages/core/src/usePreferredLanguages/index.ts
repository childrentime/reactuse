import { useState } from 'react'
import { useEventListener } from '../useEventListener'
import { isBrowser } from '../utils/is'
import type { UsePreferredLanguages } from './interface'

function getInitialState(defaultState?: string[]): string[] {
  // Prevent a React hydration mismatch when a default value is provided by not defaulting to window.matchMedia(query).matches.
  if (defaultState !== undefined) {
    return defaultState
  }

  if (isBrowser) {
    const navigator = window.navigator
    return navigator.languages as string[]
  }

  // A default value has not been provided, and you are rendering on the server, warn of a possible hydration mismatch when defaulting to false.
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '`usePreferredLanguage` When server side rendering, defaultState should be defined to prevent a hydration mismatches.',
    )
  }

  return ['en']
}

export const usePreferredLanguages: UsePreferredLanguages = (
  defaultLanguages?: string[],
): string[] => {
  const [state, setState] = useState(getInitialState(defaultLanguages))

  useEventListener('languagechange', () => {
    setState(navigator.languages as string[])
  })

  return state
}
