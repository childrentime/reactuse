import { act, renderHook } from '@testing-library/react'
import { useDoubleClick } from '.'

function setUp(props: {
  onSingleClick?: () => void
  onDoubleClick?: () => void
} = {}) {
  const target = document.createElement('div')
  document.body.appendChild(target)

  const rendered = renderHook(() =>
    useDoubleClick({ target, latency: 300, ...props }),
  )

  const click = () => act(() => {
    target.dispatchEvent(new MouseEvent('click'))
  })

  return { ...rendered, target, click }
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

it('should be defined', () => {
  expect(useDoubleClick).toBeDefined()
})

it('should report a single click', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click } = setUp({ onSingleClick, onDoubleClick })

  click()
  act(() => {
    jest.advanceTimersByTime(400)
  })

  expect(onSingleClick).toHaveBeenCalledTimes(1)
  expect(onDoubleClick).not.toHaveBeenCalled()
})

it('should report two clicks inside the latency as a double click', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click } = setUp({ onSingleClick, onDoubleClick })

  click()
  click()
  act(() => {
    jest.advanceTimersByTime(400)
  })

  expect(onDoubleClick).toHaveBeenCalledTimes(1)
  expect(onSingleClick).not.toHaveBeenCalled()
})

it('should report clicks further apart than the latency as two single clicks', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click } = setUp({ onSingleClick, onDoubleClick })

  click()
  act(() => {
    jest.advanceTimersByTime(400)
  })
  click()
  act(() => {
    jest.advanceTimersByTime(400)
  })

  expect(onSingleClick).toHaveBeenCalledTimes(2)
  expect(onDoubleClick).not.toHaveBeenCalled()
})

// `handle(...)` ran during render, so its `let count = 0` was rebuilt on every
// render while `useEventListener` dispatched to the newest closure. A re-render
// between the two clicks therefore lost the first one.
it('should count a double click across a re-render', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click, rerender } = setUp({ onSingleClick, onDoubleClick })

  click()
  rerender()
  click()
  act(() => {
    jest.advanceTimersByTime(400)
  })

  expect(onDoubleClick).toHaveBeenCalledTimes(1)
  expect(onSingleClick).not.toHaveBeenCalled()
})

// The pending timer was never stored, so nothing could cancel it and it ran its
// callback after the component had gone.
it('should not fire a callback after unmount', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click, unmount } = setUp({ onSingleClick, onDoubleClick })

  click()
  unmount()
  expect(jest.getTimerCount()).toBe(0)

  act(() => {
    jest.advanceTimersByTime(400)
  })

  expect(onSingleClick).not.toHaveBeenCalled()
  expect(onDoubleClick).not.toHaveBeenCalled()
})
