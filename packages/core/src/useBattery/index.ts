import { useEffect, useState } from 'react'
import { useSupported } from '../useSupported'
import type { UseBattery, UseBatteryState } from './interface'

interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

const defaultState: UseBatteryState = {
  isSupported: false,
  charging: false,
  chargingTime: 0,
  dischargingTime: 0,
  level: 0,
}

export const useBattery: UseBattery = () => {
  const isSupported = useSupported(
    () => typeof navigator !== 'undefined' && 'getBattery' in navigator,
  )

  const [state, setState] = useState<UseBatteryState>(defaultState)

  useEffect(() => {
    if (!isSupported)
      return

    setState(prev => prev.isSupported ? prev : { ...prev, isSupported: true })

    let battery: BatteryManager | null = null
    let cancelled = false

    const updateState = () => {
      if (!battery)
        return
      setState({
        isSupported: true,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        level: battery.level,
      })
    };

    (navigator as NavigatorWithBattery).getBattery!().then(b => {
      if (cancelled)
        return
      battery = b
      updateState()

      b.addEventListener('chargingchange', updateState)
      b.addEventListener('chargingtimechange', updateState)
      b.addEventListener('dischargingtimechange', updateState)
      b.addEventListener('levelchange', updateState)
    })

    return () => {
      cancelled = true
      if (battery) {
        battery.removeEventListener('chargingchange', updateState)
        battery.removeEventListener('chargingtimechange', updateState)
        battery.removeEventListener('dischargingtimechange', updateState)
        battery.removeEventListener('levelchange', updateState)
      }
    }
  }, [isSupported])

  return state
}
