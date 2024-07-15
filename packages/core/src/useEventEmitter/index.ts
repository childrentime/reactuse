import { useRef } from 'react'
import type { UseEventEmitterEvent, UseEventEmitterListener } from './interface'

export function useEventEmitter<T, U = void>() {
  const listeners = useRef<UseEventEmitterListener<T, U>[]>([])
  const _disposed = useRef<boolean>(false)
  const _event = useRef<UseEventEmitterEvent<T, U>>((listener: (arg1: T, arg2: U) => any) => {
    listeners.current.push(listener)
    const disposable = {
      dispose: () => {
        if (!_disposed.current) {
          for (let i = 0; i < listeners.current.length; i++) {
            if (listeners.current[i] === listener) {
              listeners.current.splice(i, 1)
              return
            }
          }
        }
      },
    }
    return disposable
  })

  const fire = (arg1: T, arg2: U): void => {
    const queue: UseEventEmitterListener<T, U>[] = []

    for (let i = 0; i < listeners.current.length; i++) {
      queue.push(listeners.current[i])
    }

    for (let i = 0; i < queue.length; i++) {
      queue[i].call(undefined, arg1, arg2)
    }
  }

  const dispose = (): void => {
    if (listeners.current.length !== 0) {
      listeners.current.length = 0
    }
    _disposed.current = true
  }

  return [_event.current, fire, dispose] as const
}
