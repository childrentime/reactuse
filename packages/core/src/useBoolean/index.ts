import { useState } from 'react'
import { useEvent } from '../useEvent'
import type { UseBoolean } from './interface'

export const useBoolean: UseBoolean = (initialValue = false) => {
  const [value, setValue] = useState(initialValue)

  const setTrue = useEvent(() => {
    setValue(true)
  })

  const setFalse = useEvent(() => {
    setValue(false)
  })

  const toggle = useEvent(() => {
    setValue(prev => !prev)
  })

  const handleSetValue = useEvent((newValue: boolean) => {
    setValue(newValue)
  })

  return {
    value,
    setValue: handleSetValue,
    setTrue,
    setFalse,
    toggle,
  } as const
}
