import { act, renderHook, waitFor } from '@testing-library/react'
import { useCopyToClipboard } from '..'
import { useClipboard } from '.'

describe('useClipboard', () => {
  const originalClipboard = navigator.clipboard
  const originalExecCommand = document.execCommand
  let selectedText = ''

  beforeEach(() => {
    selectedText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: jest.fn(() => {
        const textarea = document.querySelector('textarea')
        textarea?.dispatchEvent(new Event('copy', { bubbles: true }))
        selectedText = ''
        return true
      }),
    })
    jest.spyOn(document, 'hasFocus').mockReturnValue(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: originalExecCommand,
    })
  })

  it('reports Clipboard API support independently from the legacy fallback', async () => {
    const { result } = renderHook(() => useClipboard())

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })
  })

  it('keeps the synchronous selection from an execCommand copy event', async () => {
    const execCommand = document.execCommand as jest.Mock
    selectedText = 'selection snapshot'
    jest.spyOn(document, 'getSelection').mockReturnValue({
      toString: () => selectedText,
    } as Selection)
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current[1]('copy argument')
    })

    expect(result.current[2]).toBe(false)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(result.current[0]).toBe('selection snapshot')
    expect(document.querySelectorAll('textarea')).toHaveLength(0)
  })
  it('keeps selected text from a user copy event after selection is cleared', async () => {
    const getSelection = jest
      .spyOn(document, 'getSelection')
      .mockReturnValue({ toString: () => selectedText } as Selection)
    const { result } = renderHook(() => useClipboard())

    selectedText = 'selected copy text'
    await act(async () => {
      window.dispatchEvent(new Event('copy'))
      selectedText = ''
    })

    await waitFor(() => {
      expect(result.current[0]).toBe('selected copy text')
    })
    expect(getSelection).toHaveBeenCalled()
  })

  it('keeps selected text from a user cut event after selection is cleared', async () => {
    const getSelection = jest
      .spyOn(document, 'getSelection')
      .mockReturnValue({ toString: () => selectedText } as Selection)
    const { result } = renderHook(() => useClipboard())

    selectedText = 'selected cut text'
    await act(async () => {
      window.dispatchEvent(new Event('cut'))
      selectedText = ''
    })

    await waitFor(() => {
      expect(result.current[0]).toBe('selected cut text')
    })
    expect(getSelection).toHaveBeenCalled()
  })

  it('keeps selected text when Clipboard API reading rejects during copy', async () => {
    const readText = jest.fn().mockRejectedValue(new Error('permission denied'))
    const getSelection = jest
      .spyOn(document, 'getSelection')
      .mockReturnValue({ toString: () => selectedText } as Selection)
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText },
    })
    const { result } = renderHook(() => useClipboard())

    await waitFor(() => {
      expect(readText).toHaveBeenCalled()
    })
    expect(getSelection).not.toHaveBeenCalled()

    selectedText = 'selected after failure'
    await act(async () => {
      window.dispatchEvent(new Event('copy'))
      selectedText = ''
    })

    await waitFor(() => {
      expect(result.current[0]).toBe('selected after failure')
    })
    expect(getSelection).toHaveBeenCalled()
  })

  it('updates from the Clipboard API when the window regains focus', async () => {
    const readText = jest.fn().mockResolvedValue('focused clipboard text')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText },
    })
    const { result } = renderHook(() => useClipboard())

    await waitFor(() => {
      expect(readText).toHaveBeenCalledTimes(1)
    })
    readText.mockClear()

    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => {
      expect(readText).toHaveBeenCalledTimes(1)
      expect(result.current[0]).toBe('focused clipboard text')
    })
  })

  it('uses the Clipboard API when it is available', async () => {
    const readText = jest.fn().mockResolvedValue('clipboard text')
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText, writeText },
    })
    const { result } = renderHook(() => useClipboard())

    await waitFor(() => {
      expect(result.current[2]).toBe(true)
      expect(result.current[0]).toBe('clipboard text')
    })

    await act(async () => {
      await result.current[1]('new clipboard text')
    })

    expect(writeText).toHaveBeenCalledWith('new clipboard text')
  })

  it('exposes useCopyToClipboard with the same tuple shape', async () => {
    expect(useCopyToClipboard).toBeDefined()
    const { result } = renderHook(() => useCopyToClipboard())

    await waitFor(() => {
      expect(result.current).toHaveLength(3)
    })
    expect(result.current[2]).toBe(false)
  })
})
