import { useMemo } from 'react'
import type { DebounceSettings } from 'lodash-es'
import { debounce } from 'lodash-es'
import { isDev, isFunction } from '../utils/is'
import { useLatest } from '../useLatest'
import { useUnmount } from '../useUnmount'
import type { UseDebounceFn } from './interface'

export const useDebounceFn: UseDebounceFn = <T extends (...args: any) => any>(
  fn: T,
  wait?: number,
  options?: DebounceSettings,
) => {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(
        `useDebounceFn expected parameter is a function, got ${typeof fn}`,
      )
    }
  }

  const fnRef = useLatest(fn)

  const debounced = useMemo(
    () =>
      debounce(
        (...args: [...Parameters<T>]): ReturnType<T> => {
          return fnRef.current(...args)
        },
        wait,
        options,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(options), wait],
  )

  useUnmount(() => {
    debounced.cancel()
  })

  return {
    run: debounced,
    cancel: debounced.cancel,
    flush: debounced.flush,
  }
}
