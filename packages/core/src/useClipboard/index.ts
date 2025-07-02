import { useCallback, useEffect, useState } from 'react'
import { useEventListener } from '../useEventListener'
import type { UseClipboard } from './interface'

export const useClipboard: UseClipboard = (): readonly [
  string,
  (txt: string) => Promise<void>,
] => {
  const [text, setText] = useState('')

  const updateText = useCallback(async () => {
    // Check if document is focused before attempting to read clipboard
    if (!document.hasFocus()) {
      return
    }

    try {
      const value = await window.navigator.clipboard.readText()
      setText(value)
    }
    catch (error) {
      // Handle cases where clipboard access is denied or unavailable
      console.warn('Failed to read clipboard:', error)
    }
  }, [])

  useEventListener('copy', updateText)
  useEventListener('cut', updateText)

  // Also listen for focus events to update clipboard when window regains focus
  useEventListener('focus', updateText, window)

  const copy = useCallback(async (txt: string) => {
    setText(txt)

    try {
      await window.navigator.clipboard.writeText(txt)
    }
    catch (error) {
      console.warn('Failed to write to clipboard:', error)
      throw error // Re-throw so caller can handle it
    }
  }, [])

  useEffect(() => {
    updateText()
  }, [updateText])

  return [text, copy] as const
}
