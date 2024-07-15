import { useEffect, useState } from 'react'
import type { DebounceSettings } from 'lodash-es'
import { useDebounceFn } from '../useDebounceFn'
import type { UseDebounce } from './interface'

export const useDebounce: UseDebounce = <T>(
  value: T,
  wait?: number,
  options?: DebounceSettings,
) => {
  const [debounced, setDebounced] = useState(value)

  const { run } = useDebounceFn(
    () => {
      setDebounced(value)
    },
    wait,
    options,
  )

  useEffect(() => {
    run()
  }, [run, value])

  return debounced
}
