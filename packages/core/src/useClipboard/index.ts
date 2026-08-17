import { useCallback, useEffect, useState } from 'react'
import { useEventListener } from '../useEventListener'
import { defaultDocument, defaultWindow } from '../utils/browser'
import { useSupported } from '../useSupported'
import type { UseClipboard } from './interface'

function copyWithExecCommand(txt: string): void {
  const doc = defaultDocument
  if (!doc?.body || typeof doc.execCommand !== 'function') {
    throw new Error('Clipboard is not supported in this environment')
  }

  const textarea = doc.createElement('textarea')
  textarea.value = txt
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '-9999px'
  textarea.style.opacity = '0'
  doc.body.appendChild(textarea)

  try {
    textarea.select()
    if (!doc.execCommand('copy')) {
      throw new Error('Failed to copy text to clipboard')
    }
  }
  finally {
    textarea.parentNode?.removeChild(textarea)
  }
}

export const useClipboard: UseClipboard = (): readonly [
  string,
  (txt: string) => Promise<void>,
  boolean,
] => {
  const [text, setText] = useState('')
  const isSupported = useSupported(
    () => !!defaultWindow?.navigator?.clipboard,
    true,
  )

  const updateText = useCallback(async (): Promise<boolean> => {
    // Check if document is focused before attempting to read clipboard
    if (!defaultDocument || defaultDocument.hasFocus?.() === false) {
      return false
    }

    const clipboard = defaultWindow?.navigator?.clipboard
    if (typeof clipboard?.readText !== 'function') {
      return false
    }

    try {
      const value = await clipboard.readText()
      setText(value)
      return true
    }
    catch (error) {
      // Handle cases where clipboard access is denied or unavailable
      console.warn('Failed to read clipboard:', error)
      return false
    }
  }, [])

  const updateTextFromEvent = useCallback(() => {
    // Read selection before an async clipboard read or cut can clear it.
    const selected = defaultDocument?.getSelection?.()?.toString() ?? ''
    void updateText().then((ok) => {
      if (!ok && selected)
        setText(selected)
    })
  }, [updateText])

  useEventListener('copy', updateTextFromEvent)
  useEventListener('cut', updateTextFromEvent)

  // Also listen for focus events to update clipboard when window regains focus
  useEventListener('focus', updateText, defaultWindow)

  const copy = useCallback(async (txt: string) => {
    setText(txt)

    const clipboard = defaultWindow?.navigator?.clipboard
    if (typeof clipboard?.writeText === 'function') {
      try {
        await clipboard.writeText(txt)
        return
      }
      catch {
        // Fall back to execCommand when Clipboard API access is denied
      }
    }

    try {
      copyWithExecCommand(txt)
    }
    catch (error) {
      console.warn('Failed to write to clipboard:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    updateText()
  }, [updateText])

  return [text, copy, isSupported] as const
}
