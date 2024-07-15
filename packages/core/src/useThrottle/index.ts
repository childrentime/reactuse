import { useEffect, useState } from 'react'
import type { ThrottleSettings } from 'lodash-es'
import { useThrottleFn } from '../useThrottleFn'
import type { UseThrottle } from './interface'

export const useThrottle: UseThrottle = <T>(
  value: T,
  wait?: number,
  options?: ThrottleSettings,
) => {
  const [throttled, setThrottled] = useState(value)

  const { run } = useThrottleFn(
    () => {
      setThrottled(value)
    },
    wait,
    options,
  )

  useEffect(() => {
    run()
  }, [run, value])

  return throttled
}
