import { useEffect, useState } from 'react'
import { off, on } from '../utils/browser'
import { isNavigator } from '../utils/is'
import type { INetworkInformation, IUseNetworkState, UseNetwork } from './interface'

const nav:
| (Navigator &
  Partial<
    Record<
          'connection' | 'mozConnection' | 'webkitConnection',
      INetworkInformation
    >
  >)
| undefined = isNavigator ? (navigator as any) : undefined

const conn: INetworkInformation | undefined
  = nav && (nav.connection || nav.mozConnection || nav.webkitConnection)

function getConnectionState(
  previousState?: IUseNetworkState,
): IUseNetworkState {
  const online = nav?.onLine
  const previousOnline = previousState?.online

  return {
    online,
    previous: previousOnline,
    since: online !== previousOnline ? new Date() : previousState?.since,
    downlink: conn?.downlink,
    downlinkMax: conn?.downlinkMax,
    effectiveType: conn?.effectiveType,
    rtt: conn?.rtt,
    saveData: conn?.saveData,
    type: conn?.type,
  }
}

export const useNetwork: UseNetwork = (): IUseNetworkState => {
  const [state, setState] = useState(getConnectionState)

  useEffect(() => {
    const handleStateChange = () => {
      setState(getConnectionState)
    }

    on(window, 'online', handleStateChange, { passive: true })
    on(window, 'offline', handleStateChange, { passive: true })

    if (conn) {
      on(conn, 'change', handleStateChange, { passive: true })
    }

    return () => {
      off(window, 'online', handleStateChange)
      off(window, 'offline', handleStateChange)

      if (conn) {
        off(conn, 'change', handleStateChange)
      }
    }
  }, [])

  return state
}
