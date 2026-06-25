import { useCallback, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { isBrowser, isFunction, isString } from '../utils/is'
import { defaultOptions } from '../utils/defaults'
import { useEventListener } from '../useEventListener'
import type { UseCookie, UseCookieState } from './interface'

// Custom DOM event used to keep sibling useCookie instances in the SAME tab in
// sync. Cookies fire no native cross-tab event at all, so this `window` event is
// the only propagation channel. (`refreshCookie` remains for picking up cookie
// changes made outside the hook — e.g. by the server or a direct `document.cookie`
// write.)
const SAME_TAB_COOKIE_EVENT = 'reactuse:cookie'

interface SameTabCookieDetail {
  key: string
  value: UseCookieState
}

function getInitialState(key: string, defaultValue?: string) {
  // Prevent a React hydration mismatch when a default value is provided.
  if (defaultValue !== undefined) {
    return defaultValue
  }

  if (isBrowser) {
    return Cookies.get(key)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '`useCookie` When server side rendering, defaultValue should be defined to prevent a hydration mismatches.',
    )
  }

  return ''
}

export const useCookie: UseCookie = (
  key: string,
  options: Cookies.CookieAttributes = defaultOptions,
  defaultValue?: string,
) => {
  const [cookieValue, setCookieValue] = useState<UseCookieState>(
    getInitialState(key, defaultValue),
  )

  // Sync with sibling useCookie instances watching the same key in this tab.
  // useEventListener keeps the latest handler in a ref, so the `key` comparison
  // always uses the current key without re-binding (and it's a no-op on the server).
  useEventListener(SAME_TAB_COOKIE_EVENT, (event: CustomEvent<SameTabCookieDetail>) => {
    const { key: evKey, value } = event.detail
    if (evKey === key)
      setCookieValue(value)
  })

  useEffect(() => {
    const getStoredValue = () => {
      const raw = Cookies.get(key)
      if (raw !== undefined && raw !== null) {
        return raw
      }
      else {
        if (defaultValue === undefined) {
          Cookies.remove(key)
        }
        else {
          Cookies.set(key, defaultValue, options)
        }
        return defaultValue
      }
    }

    setCookieValue(getStoredValue())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue, key, JSON.stringify(options)])

  const updateCookie = useCallback(
    (
      newValue: UseCookieState | ((prevState: UseCookieState) => UseCookieState),
    ) => {
      const value = isFunction(newValue) ? newValue(cookieValue) : newValue

      if (value === undefined) {
        Cookies.remove(key)
      }
      else {
        Cookies.set(key, value, options)
      }

      setCookieValue(value)
      // Notify sibling instances in this tab. Our own listener also fires and
      // re-sets the same value, which React bails out on — no self-skip needed.
      window.dispatchEvent(
        new CustomEvent<SameTabCookieDetail>(SAME_TAB_COOKIE_EVENT, {
          detail: { key, value },
        }),
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, cookieValue, JSON.stringify(options)],
  )

  const refreshCookie = useCallback(() => {
    const cookieValue = Cookies.get(key)

    if (isString(cookieValue)) {
      setCookieValue(cookieValue)
    }
  }, [key])

  return [cookieValue, updateCookie, refreshCookie] as const
}
