import { useCallback, useRef, useState } from 'react'
import { defaultOptions } from '../utils/defaults'
import type { UseFileDialog, UseFileDialogOptions } from './interface'

const DEFAULT_OPTIONS: UseFileDialogOptions = {
  multiple: true,
  accept: '*',
}

export const useFileDialog: UseFileDialog = (
  options: UseFileDialogOptions = defaultOptions,
) => {
  const [files, setFiles] = useState<FileList | null>(null)
  const inputRef = useRef<HTMLInputElement>()
  const fileOpenPromiseRef = useRef<Promise<FileList | null> | null>(null)
  const resolveFileOpenPromiseRef = useRef<(value: FileList | null) => void>()
  const initFn = useCallback(() => {
    if (typeof document === 'undefined') {
      return undefined
    }
    const input = document.createElement('input')
    input.type = 'file'

    input.onchange = (event: Event) => {
      const result = event.target as HTMLInputElement
      setFiles(result.files)
      resolveFileOpenPromiseRef.current?.(result.files)
    }
    return input
  }, [])
  inputRef.current = initFn()

  const open = async (localOptions?: Partial<UseFileDialogOptions>) => {
    if (!inputRef.current) {
      return
    }
    const _options = {
      ...DEFAULT_OPTIONS,
      ...options,
      ...localOptions,
    }

    inputRef.current.multiple = _options.multiple!
    inputRef.current.accept = _options.accept!
    // Only set capture attribute if it's explicitly provided
    if (_options.capture !== undefined) {
      inputRef.current.capture = _options.capture
    }

    fileOpenPromiseRef.current = new Promise(resolve => {
      resolveFileOpenPromiseRef.current = resolve
    })
    inputRef.current.click()
    return fileOpenPromiseRef.current
  }

  const reset = () => {
    setFiles(null)
    resolveFileOpenPromiseRef.current?.(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return [files, open, reset] as const
}
