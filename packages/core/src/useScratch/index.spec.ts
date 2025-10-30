import { act, renderHook } from '@testing-library/react'
import { useScratch } from '.'

describe('useScratch', () => {
  let element: HTMLDivElement
  let mockRaf: jest.SpyInstance

  beforeAll(() => {
    mockRaf = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
  })

  afterAll(() => {
    mockRaf.mockRestore()
  })

  beforeEach(() => {
    element = document.createElement('div')
    Object.defineProperty(element, 'offsetHeight', {
      configurable: true,
      value: 100,
    })
    Object.defineProperty(element, 'offsetWidth', {
      configurable: true,
      value: 200,
    })
    document.body.appendChild(element)
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      width: 200,
      height: 100,
      right: 210,
      bottom: 120,
      x: 10,
      y: 20,
      toJSON: () => {},
    })
  })

  afterEach(() => {
    document.body.removeChild(element)
    jest.restoreAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useScratch(element))
    expect(result.current.isScratching).toBe(false)
  })

  it('should track scratch start on mouse down', () => {
    const onScratchStart = jest.fn()
    renderHook(() =>
      useScratch(element, { onScratchStart }),
    )

    act(() => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 60,
      })
      element.dispatchEvent(mouseDownEvent)
    })

    expect(onScratchStart).toHaveBeenCalled()
    expect(onScratchStart).toHaveBeenCalledWith(
      expect.objectContaining({
        isScratching: true,
      }),
    )
  })

  it('should handle disabled option', () => {
    const onScratchStart = jest.fn()
    renderHook(() =>
      useScratch(element, { disabled: true, onScratchStart }),
    )

    act(() => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 60,
      })
      element.dispatchEvent(mouseDownEvent)
    })

    expect(onScratchStart).not.toHaveBeenCalled()
  })

  it('should calculate relative position correctly', () => {
    const onScratchStart = jest.fn()
    renderHook(() => useScratch(element, { onScratchStart }))

    act(() => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 60,
      })
      element.dispatchEvent(mouseDownEvent)
    })

    expect(onScratchStart).toHaveBeenCalledWith(
      expect.objectContaining({
        isScratching: true,
        x: 40, // 50 - 10 (left)
        y: 40, // 60 - 20 (top)
        dx: 0,
        dy: 0,
        elH: 100,
        elW: 200,
      }),
    )
  })
})

