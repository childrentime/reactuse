import { useState } from 'react'

// Following these issues I think this is the best way to implement usePrevious:
// https://github.com/childrentime/reactuse/issues/115
// https://github.com/streamich/react-use/issues/2605
// https://github.com/alibaba/hooks/issues/2162
export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState<T>(value)
  const [previous, setPrevious] = useState<T>()

  if (value !== current) {
    setPrevious(current)
    setCurrent(value)
  }

  return previous
}
