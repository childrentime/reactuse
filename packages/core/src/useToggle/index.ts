import type { Reducer } from 'react'
import { useReducer } from 'react'
import type { UseToggle } from './interface'

function toggleReducer(state: boolean, nextValue?: any) {
  return typeof nextValue === 'boolean' ? nextValue : !state
}

export const useToggle: UseToggle = (
  initialValue: boolean,
): [boolean, (nextValue?: any) => void] => {
  return useReducer<Reducer<boolean, any>>(toggleReducer, initialValue)
}
