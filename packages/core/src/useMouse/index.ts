import type { BasicTarget } from '../utils/domTarget'
import { getTargetElement } from '../utils/domTarget'
import { useEventListener } from '../useEventListener'
import { useRafState } from '../useRafState'
import { defaultDocument } from '../utils/browser'
import type { UseMouse, UseMouseCursorState } from './interface'

const initState: UseMouseCursorState = {
  screenX: Number.NaN,
  screenY: Number.NaN,
  clientX: Number.NaN,
  clientY: Number.NaN,
  pageX: Number.NaN,
  pageY: Number.NaN,
  elementX: Number.NaN,
  elementY: Number.NaN,
  elementH: Number.NaN,
  elementW: Number.NaN,
  elementPosX: Number.NaN,
  elementPosY: Number.NaN,
}

export const useMouse: UseMouse = (target?: BasicTarget): UseMouseCursorState => {
  const [state, setState] = useRafState(initState)

  useEventListener(
    'mousemove',
    (event: MouseEvent) => {
      const { screenX, screenY, clientX, clientY, pageX, pageY } = event
      const newState = {
        screenX,
        screenY,
        clientX,
        clientY,
        pageX,
        pageY,
        elementX: Number.NaN,
        elementY: Number.NaN,
        elementH: Number.NaN,
        elementW: Number.NaN,
        elementPosX: Number.NaN,
        elementPosY: Number.NaN,
      }
      const targetElement = getTargetElement(target)
      if (targetElement) {
        const { left, top, width, height }
          = targetElement.getBoundingClientRect()
        newState.elementPosX = left + window.pageXOffset
        newState.elementPosY = top + window.pageYOffset
        newState.elementX = pageX - newState.elementPosX
        newState.elementY = pageY - newState.elementPosY
        newState.elementW = width
        newState.elementH = height
      }
      setState(newState)
    },
    defaultDocument,
  )

  return state
}
