import { act, renderHook } from '@testing-library/react'
import { useCountDown } from '.'

jest.useFakeTimers()

function tick(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    act(() => {
      jest.advanceTimersByTime(1000)
    })
  }
}

it('should count down to zero and stop there', () => {
  const { result } = renderHook(() => useCountDown(2))
  expect(result.current).toEqual(['00', '00', '02'])

  tick(1)
  expect(result.current).toEqual(['00', '00', '01'])

  tick(3)
  expect(result.current).toEqual(['00', '00', '00'])
})

it('should call an inline callback once when the countdown ends', () => {
  const onEnd = jest.fn()
  const { rerender } = renderHook(() => useCountDown(2, undefined, () => onEnd()))

  tick(1)
  expect(onEnd).not.toHaveBeenCalled()

  tick(3)
  rerender()
  rerender()
  expect(onEnd).toHaveBeenCalledTimes(1)
})

it('should not call the callback when started at zero', () => {
  const onEnd = jest.fn()
  renderHook(() => useCountDown(0, undefined, onEnd))

  tick(2)
  expect(onEnd).not.toHaveBeenCalled()
})
