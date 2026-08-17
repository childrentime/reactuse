import { act, renderHook, waitFor } from '@testing-library/react'
import { useCopyToClipboard } from '..'
import { useClipboard } from '.'

describe('useClipboard', () => {
  const originalClipboard = navigator.clipboard
  const originalExecCommand = document.execCommand

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: jest.fn(() => true),
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

  it('copies with the legacy command when Clipboard API is unavailable', async () => {
    const execCommand = document.execCommand as jest.Mock
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current[1]('copied text')
    })

    expect(result.current[2]).toBe(false)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(result.current[0]).toBe('copied text')
    expect(document.querySelectorAll('textarea')).toHaveLength(0)
  })

  it('reads selected text only from copy events without Clipboard API', async () => {
    const getSelection = jest
      .spyOn(document, 'getSelection')
      .mockReturnValue({ toString: () => 'selected text' } as Selection)
    const { result } = renderHook(() => useClipboard())

    expect(getSelection).not.toHaveBeenCalled()

    await act(async () => {
      window.dispatchEvent(new Event('copy'))
    })

    await waitFor(() => {
      expect(result.current[0]).toBe('selected text')
    })
    expect(getSelection).toHaveBeenCalled()
  })

  it('falls back to selected text when Clipboard API reading fails during copy', async () => {
    const readText = jest.fn().mockRejectedValue(new Error('permission denied'))
    const getSelection = jest
      .spyOn(document, 'getSelection')
      .mockReturnValue({ toString: () => 'selected after failure' } as Selection)
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

    await act(async () => {
      window.dispatchEvent(new Event('copy'))
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
