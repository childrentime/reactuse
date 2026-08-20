import { act, renderHook } from '@testing-library/react'
import { useEventListener } from '.'

interface Props {
  name: string
  handler: (...args: any[]) => void
  target: any
  options?: any
}

const propsList1: Props[] = [
  {
    name: 'name1',
    handler: () => void 0,
    target: {
      current: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        name: 'target1',
      },
    },
  },
  {
    name: 'name2',
    handler: () => void 0,
    target: {
      current: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        name: 'target2',
      },
    },
  },
]

describe(useEventListener, () => {
  it('should call addEventListener/removeEventListener on mount/unmount', () => {
    checkOnMountAndUnmount(
      propsList1[0],
      'addEventListener',
      'removeEventListener',
    )
  })

  it('should call addEventListener/removeEventListener on deps changes', () => {
    checkOnDepsChanges(
      propsList1[0],
      propsList1[1],
      'addEventListener',
      'removeEventListener',
    )
  })
})

function checkOnMountAndUnmount(
  props: Props,
  addEventListenerName: string,
  removeEventListenerName: string,
) {
  const { unmount } = renderHook(
    (p: Props) => useEventListener(p.name, p.handler, p.target, p.options),
    {
      initialProps: props,
    },
  )
  expect(props.target.current[addEventListenerName]).toHaveBeenCalledTimes(1)
  unmount()
  expect(props.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    1,
  )
}

function checkOnDepsChanges(
  props1: Props,
  props2: Props,
  addEventListenerName: string,
  removeEventListenerName: string,
) {
  const { rerender } = renderHook(
    (p: Props) => useEventListener(p.name, p.handler, p.target, p.options),
    {
      initialProps: props1,
    },
  )
  expect(props1.target.current[addEventListenerName]).toHaveBeenCalledTimes(1)

  // deps are same as previous
  rerender({
    name: props1.name,
    handler: props1.handler,
    target: props1.target,
    options: props1.options,
  })
  expect(props1.target.current[removeEventListenerName]).not.toHaveBeenCalled()

  // name is different from previous
  rerender({
    name: props2.name,
    handler: props1.handler,
    target: props1.target,
    options: props1.options,
  })
  expect(props1.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    1,
  )
  expect(props1.target.current[addEventListenerName]).toHaveBeenCalledTimes(2)

  // options contents is same as previous
  rerender({
    name: props2.name,
    handler: props2.handler,
    target: props1.target,
    options: { a: 'opt1' },
  })
  expect(props1.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    2,
  )

  // options is different from previous
  rerender({
    name: props2.name,
    handler: props2.handler,
    target: props1.target,
    options: props2.options,
  })
  expect(props1.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    3,
  )

  // target is different from previous
  act(() => {
    rerender({
      name: props2.name,
      handler: props2.handler,
      target: props2.target,
      options: props2.options,
    })
  })

  expect(props1.target.current[removeEventListenerName]).toHaveBeenCalledTimes(
    4,
  )
  expect(props2.target.current[addEventListenerName]).toHaveBeenCalledTimes(1)
}

describe('useEventListener cleanup matches the registered listener', () => {
  let element: HTMLDivElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    element.remove()
  })

  // removeEventListener matches on (type, callback, capture), so a listener
  // registered with `capture: true` is only detached when the same flag is
  // passed back on removal.
  it('detaches a capture-phase listener on unmount', () => {
    let calls = 0
    const { unmount } = renderHook(() =>
      useEventListener('click', () => calls++, element, { capture: true }),
    )

    element.dispatchEvent(new Event('click'))
    expect(calls).toBe(1)

    unmount()
    element.dispatchEvent(new Event('click'))
    expect(calls).toBe(1)
  })

  it('detaches a listener registered with the boolean capture form', () => {
    let calls = 0
    const { unmount } = renderHook(() =>
      useEventListener('click', () => calls++, element, true),
    )

    unmount()
    element.dispatchEvent(new Event('click'))
    expect(calls).toBe(0)
  })

  it('passes the options through to removeEventListener', () => {
    const remove = jest.spyOn(element, 'removeEventListener')
    const options = { capture: true }

    const { unmount } = renderHook(() =>
      useEventListener('click', () => void 0, element, options),
    )
    unmount()

    expect(remove).toHaveBeenCalledWith('click', expect.any(Function), options)
  })

  it('detaches a capture-phase listener when the dependencies change', () => {
    let calls = 0
    const { rerender } = renderHook(
      ({ name }: { name: string }) =>
        useEventListener(name, () => calls++, element, { capture: true }),
      { initialProps: { name: 'click' } },
    )

    rerender({ name: 'dblclick' })
    element.dispatchEvent(new Event('click'))
    expect(calls).toBe(0)
  })

  it('does not accumulate capture-phase listeners across mounts', () => {
    let calls = 0
    for (let i = 0; i < 5; i++) {
      renderHook(() =>
        useEventListener('click', () => calls++, element, { capture: true }),
      ).unmount()
    }

    element.dispatchEvent(new Event('click'))
    expect(calls).toBe(0)
  })

  it('still detaches listeners registered without capture', () => {
    let calls = 0
    const { unmount } = renderHook(() =>
      useEventListener('click', () => calls++, element, { passive: true }),
    )

    unmount()
    element.dispatchEvent(new Event('click'))
    expect(calls).toBe(0)
  })
})
