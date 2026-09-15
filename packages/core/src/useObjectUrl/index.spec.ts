import { renderHook } from '@testing-library/react'
import { useObjectUrl } from '.'

let counter = 0
const created: string[] = []
const revoked: string[] = []

beforeEach(() => {
  counter = 0
  created.length = 0
  revoked.length = 0
  globalThis.URL.createObjectURL = jest.fn(() => {
    const url = `blob:mock/${++counter}`
    created.push(url)
    return url
  })
  globalThis.URL.revokeObjectURL = jest.fn((url: string) => {
    revoked.push(url)
  })
})

const first = new Blob(['first'])
const second = new Blob(['second'])

it('should create a url for the object', () => {
  const { result } = renderHook(() => useObjectUrl(first))

  expect(result.current).toBe('blob:mock/1')
  expect(created).toEqual(['blob:mock/1'])
})

it('should revoke the previous url when the object changes', () => {
  const { result, rerender } = renderHook(
    ({ object }) => useObjectUrl(object),
    { initialProps: { object: first } },
  )

  expect(result.current).toBe('blob:mock/1')

  rerender({ object: second })

  expect(result.current).toBe('blob:mock/2')
  expect(revoked).toEqual(['blob:mock/1'])
})

it('should revoke the current url on unmount', () => {
  const { unmount } = renderHook(() => useObjectUrl(first))

  unmount()

  expect(revoked).toEqual(['blob:mock/1'])
})

it('should return undefined without an object', () => {
  const { result } = renderHook(() => useObjectUrl(undefined))

  expect(result.current).toBeUndefined()
  expect(created).toEqual([])
})

it('should drop the url when the object goes away', () => {
  const { result, rerender } = renderHook<string | undefined, { object?: Blob }>(
    ({ object }) => useObjectUrl(object),
    { initialProps: { object: first } },
  )

  rerender({ object: undefined })

  expect(result.current).toBeUndefined()
  expect(revoked).toEqual(['blob:mock/1'])
})
