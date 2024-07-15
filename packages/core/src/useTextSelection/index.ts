import { useEffect, useState } from 'react'
import { useEventListener } from '../useEventListener'
import { useUpdate } from '../useUpdate'
import type { UseTextSelection } from './interface'

export const useTextSelection: UseTextSelection = (): Selection | null => {
  const [selection, setSelection] = useState<Selection | null>(null)
  const forceUpdate = useUpdate()

  const handleSelectionChange = () => {
    setSelection(document.getSelection())
    // this is because `document.getSelection` will always return the same object
    forceUpdate()
  }

  useEventListener('selectionchange', handleSelectionChange, () => document)

  useEffect(() => {
    setSelection(document.getSelection())
  }, [])

  return selection
}
