import { useCallback, useEffect, useState } from 'react'
import type { Platform, UsePlatform } from './interface'

function getPlatform(userAgent: string): Platform {
  if (/iPad|iPhone|iPod|ios/i.test(userAgent)) {
    return 'ios'
  }
  else if (/android/i.test(userAgent)) {
    return 'android'
  }
  else {
    return 'unknown'
  }
}

export const usePlatform: UsePlatform = ({ userAgent } = { userAgent: '' }) => {
  const [ua, setUa] = useState<string>(userAgent || '')
  const [platform, setPlatform] = useState<Platform>(() => {
    if (userAgent) {
      return getPlatform(userAgent)
    }
    return 'unknown'
  })

  useEffect(() => {
    setPlatform(getPlatform(navigator.userAgent))
    setUa(navigator.userAgent)
  }, [])

  const isInMiniProgram = useCallback(() => {
    return /miniprogram/i.test(ua)
  }, [ua])

  const isInWechat = useCallback(() => {
    return /micromessenger/i.test(ua)
  }, [ua])

  const isiPhoneX = useCallback(() => {
    return /iPhoneX/i.test(ua)
  }, [ua])

  return {
    platform,
    isInMiniProgram,
    isInWechat,
    isiPhoneX,
  }
}
