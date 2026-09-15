import { useEffect, useState } from 'react'
import type { UseObjectUrl } from './interface'

export const useObjectUrl: UseObjectUrl = (
  object?: Blob | MediaSource,
): string | undefined => {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!object) {
      setUrl(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(object)
    setUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [object])

  return url
}
