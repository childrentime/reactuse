import { act, renderHook } from '@testing-library/react'
import { useDoubleClick } from '.'

interface Props {
  onSingleClick?: () => void
  onDoubleClick?: () => void
}

// The element is deliberately not attached to the document: dispatchEvent fires
// listeners on a detached node too, so there is nothing to clean up afterwards.
function setUp(props: Props = {}) {
  const target = document.createElement('div')

  const rendered = renderHook(
    (current: Props) => useDoubleClick({ target, latency: 300, ...current }),
    { initialProps: props },
  )

  const click = () => act(() => {
    target.dispatchEvent(new MouseEvent('click'))
  })

  const touchEnd = () => {
    const event = new TouchEvent('touchend', { cancelable: true })
    act(() => {
      target.dispatchEvent(event)
    })
    return event
  }

  const advance = (ms: number) => act(() => {
    jest.advanceTimersByTime(ms)
  })

  return { ...rendered, click, touchEnd, advance }
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
  const { click, advance } = setUp({ onSingleClick, onDoubleClick })

  click()
  advance(400)

  expect(onSingleClick).toHaveBeenCalledTimes(1)
  expect(onDoubleClick).not.toHaveBeenCalled()
})

it('should report two clicks inside the latency as a double click', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click, advance } = setUp({ onSingleClick, onDoubleClick })

  click()
  click()
  advance(400)

  expect(onDoubleClick).toHaveBeenCalledTimes(1)
  expect(onSingleClick).not.toHaveBeenCalled()
})

it('should report clicks further apart than the latency as two single clicks', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click, advance } = setUp({ onSingleClick, onDoubleClick })

  click()
  advance(400)
  click()
  advance(400)

  expect(onSingleClick).toHaveBeenCalledTimes(2)
  expect(onDoubleClick).not.toHaveBeenCalled()
})

// One pending timer per event type, armed by the first click. Arming a timer per
// click made the leftover ones report on their own: with clicks at 0, 100 and
// 350ms the second click's timer fired at 400ms and called onSingleClick with
// that click's event, on top of the double click already reported at 300ms.
it('should keep one pending timer per event type', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click, advance } = setUp({ onSingleClick, onDoubleClick })

  click()
  advance(100)
  click()
  advance(200)
  expect(onDoubleClick).toHaveBeenCalledTimes(1)

  click()
  advance(100)
  expect(onSingleClick).not.toHaveBeenCalled()

  advance(300)
  expect(onSingleClick).toHaveBeenCalledTimes(1)
  expect(onDoubleClick).toHaveBeenCalledTimes(1)
})

// `handle(...)` runs during render, so its state was rebuilt on every render
// while `useEventListener` dispatched to the newest closure. A re-render between
// the two clicks therefore lost the first one.
it('should count a double click across a re-render', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click, advance, rerender } = setUp({ onSingleClick, onDoubleClick })

  click()
  rerender({ onSingleClick, onDoubleClick })
  click()
  advance(400)

  expect(onDoubleClick).toHaveBeenCalledTimes(1)
  expect(onSingleClick).not.toHaveBeenCalled()
})

// The timer outlives the render that armed it, so it has to dispatch to the
// callbacks as they are when it fires. Passing new instances is what makes this
// discriminate: with them captured, the first pair would be called instead.
it('should call the callbacks passed by the latest render', () => {
  const first = jest.fn()
  const second = jest.fn()
  const { click, advance, rerender } = setUp({ onDoubleClick: first })

  click()
  rerender({ onDoubleClick: second })
  click()
  advance(400)

  expect(second).toHaveBeenCalledTimes(1)
  expect(first).not.toHaveBeenCalled()
})

it('should report touchend separately from click', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click, touchEnd, advance } = setUp({ onSingleClick, onDoubleClick })

  click()
  touchEnd()
  advance(400)

  expect(onSingleClick).toHaveBeenCalledTimes(2)
  expect(onDoubleClick).not.toHaveBeenCalled()
})

it('should report two touchends inside the latency as a double click', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { touchEnd, advance } = setUp({ onSingleClick, onDoubleClick })

  touchEnd()
  touchEnd()
  advance(400)

  expect(onDoubleClick).toHaveBeenCalledTimes(1)
  expect(onSingleClick).not.toHaveBeenCalled()
})

it('should cancel the default action of a touchend', () => {
  const { touchEnd } = setUp()

  expect(touchEnd().defaultPrevented).toBe(true)
})

// The pending timer was never stored, so nothing could cancel it and it ran its
// callback after the component had gone.
it('should not fire a callback after unmount', () => {
  const onSingleClick = jest.fn()
  const onDoubleClick = jest.fn()
  const { click, advance, unmount } = setUp({ onSingleClick, onDoubleClick })

  click()
  unmount()
  expect(jest.getTimerCount()).toBe(0)

  advance(400)

  expect(onSingleClick).not.toHaveBeenCalled()
  expect(onDoubleClick).not.toHaveBeenCalled()
})

// The count is reset before the callbacks run, so one that throws does not
// wedge the hook.
it('should keep working after a callback throws', () => {
  let calls = 0
  const onSingleClick = jest.fn(() => {
    calls += 1
    if (calls === 1) {
      throw new Error('boom')
    }
  })
  const { click, advance } = setUp({ onSingleClick })

  click()
  // Advanced outside `act`, since the throw has to surface here rather than be
  // reported through React. This hook sets no state, so nothing needs wrapping.
  expect(() => jest.advanceTimersByTime(400)).toThrow('boom')
  expect(onSingleClick).toHaveBeenCalledTimes(1)

  click()
  advance(400)
  expect(onSingleClick).toHaveBeenCalledTimes(2)
})
