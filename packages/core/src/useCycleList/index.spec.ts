import { act, renderHook } from '@testing-library/react'
import { useCycleList } from '.'

function setUp<T>(list: T[], initial?: number) {
  return renderHook(() => useCycleList(list, initial))
}

it('should init with the first item', () => {
  const { result } = setUp(['a', 'b', 'c'])
  expect(result.current[0]).toEqual('a')
})

it('should init at the given index', () => {
  const { result } = setUp(['a', 'b', 'c'], 1)
  expect(result.current[0]).toEqual('b')
})

it('should cycle forward and wrap around', () => {
  const { result } = setUp(['a', 'b', 'c'])
  const next = () => act(() => result.current[1]())

  next()
  expect(result.current[0]).toEqual('b')
  next()
  expect(result.current[0]).toEqual('c')
  next()
  expect(result.current[0]).toEqual('a')
})

it('should cycle backward and wrap around', () => {
  const { result } = setUp(['a', 'b', 'c'])
  act(() => result.current[2]())
  expect(result.current[0]).toEqual('c')
})

it('should accept a step', () => {
  const { result } = setUp(['a', 'b', 'c', 'd'])
  act(() => result.current[1](2))
  expect(result.current[0]).toEqual('c')
  act(() => result.current[2](3))
  expect(result.current[0]).toEqual('d')
})

// Both calls used to read the same `index` from the closure, so the second
// overwrote the first instead of advancing from it.
it('should apply every call when several land in one batch', () => {
  const { result } = setUp(['a', 'b', 'c'])
  act(() => {
    result.current[1]()
    result.current[1]()
  })
  expect(result.current[0]).toEqual('c')
})

it('should cancel out a next and a prev in the same batch', () => {
  const { result } = setUp(['a', 'b', 'c'], 1)
  act(() => {
    result.current[1]()
    result.current[2]()
  })
  expect(result.current[0]).toEqual('b')
})

// `% 0` is NaN, which used to be stored as the index. Reading the value back on
// an empty list cannot show that - `list[NaN]` and `list[0]` are both undefined
// - so the list grows afterwards, where a NaN index stays undefined forever.
it('should keep a usable index when cycling an empty list', () => {
  const { result, rerender } = renderHook(
    (list: string[]) => useCycleList(list),
    { initialProps: [] as string[] },
  )

  act(() => result.current[1]())
  expect(result.current[0]).toBeUndefined()

  rerender(['a', 'b', 'c'])
  expect(result.current[0]).toEqual('a')
})
