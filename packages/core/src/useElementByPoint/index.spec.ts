import { act, renderHook } from '@testing-library/react'
import { useElementByPoint } from '.'

function patchRaf() {
  let callbacks: Array<(t: number) => void> = []
  ;(global as any).requestAnimationFrame = (cb: (t: number) => void) => {
    callbacks.push(cb)
    return callbacks.length
  }
  ;(global as any).cancelAnimationFrame = jest.fn()
  return {
    flush() {
      const cbs = callbacks
      callbacks = []
      cbs.forEach(cb => cb(0))
    },
  }
}

describe('useElementByPoint', () => {
  it('reports the element under the point', () => {
    const raf = patchRaf()
    const el = document.createElement('div')
    const doc = { elementFromPoint: () => el } as unknown as Document

    const { result } = renderHook(() => useElementByPoint({ x: 1, y: 2, document: doc }))

    act(() => { raf.flush() })
    expect(result.current.element).toBe(el)
  })

  it('does not re-render while the hit list is unchanged in multiple mode', () => {
    const raf = patchRaf()
    const el = document.createElement('div')
    // A real document returns a new array on every call, even when the pointer
    // has not moved.
    const doc = { elementsFromPoint: () => [el] } as unknown as Document

    let renders = 0
    renderHook(() => {
      renders++
      return useElementByPoint({ x: 1, y: 2, document: doc, multiple: true })
    })

    // First frame legitimately moves the state from null to the hit list.
    act(() => { raf.flush() })
    const settled = renders

    act(() => { raf.flush() })
    act(() => { raf.flush() })
    act(() => { raf.flush() })

    expect(renders).toBe(settled)
  })

  it('re-renders when the hit list actually changes', () => {
    const raf = patchRaf()
    const first = document.createElement('div')
    const second = document.createElement('span')
    let hit: Element[] = [first]
    const doc = { elementsFromPoint: () => [...hit] } as unknown as Document

    const { result } = renderHook(() =>
      useElementByPoint({ x: 1, y: 2, document: doc, multiple: true }),
    )

    act(() => { raf.flush() })
    expect(result.current.element).toEqual([first])

    hit = [second, first]
    act(() => { raf.flush() })
    expect(result.current.element).toEqual([second, first])
  })
})
