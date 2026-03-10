import { useEffect, useState } from 'react'
import type { UseImage, UseImageState } from './interface'

export const useImage: UseImage = (options) => {
  const [state, setState] = useState<UseImageState>({
    isLoading: true,
    error: undefined,
  })

  useEffect(() => {
    const img = new Image()

    img.onload = () => {
      setState({ isLoading: false, error: undefined })
    }

    img.onerror = (error) => {
      setState({ isLoading: false, error })
    }

    if (options.srcset) img.srcset = options.srcset
    if (options.sizes) img.sizes = options.sizes
    img.src = options.src

    setState({ isLoading: true, error: undefined })

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [options.src, options.srcset, options.sizes])

  return state
}
