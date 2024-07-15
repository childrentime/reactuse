import { useEffect, useState } from 'react'
import type { UseObjectUrl } from './interface'

export const useObjectUrl: UseObjectUrl = (
  object: Blob | MediaSource,
): string | undefined => {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (object) {
      setUrl(URL.createObjectURL(object))
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object])

  return url
}
