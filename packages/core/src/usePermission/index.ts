import { useEffect, useState } from 'react'
import { off, on } from '../utils/browser'
import { noop } from '../utils/is'
import type { UsePermission, UsePermissionGeneralPermissionDescriptor, UsePermissionState } from './interface'

export const usePermission: UsePermission = (
  permissionDesc:
    | UsePermissionGeneralPermissionDescriptor
    | UsePermissionGeneralPermissionDescriptor['name'],
): UsePermissionState => {
  const [state, setState] = useState<UsePermissionState>('')

  useEffect(() => {
    const desc
      = typeof permissionDesc === 'string'
        ? ({ name: permissionDesc } as PermissionDescriptor)
        : (permissionDesc as PermissionDescriptor)
    let mounted = true
    let permissionStatus: PermissionStatus | null = null

    const onChange = () => {
      if (!mounted) {
        return
      }
      setState(() => permissionStatus?.state ?? '')
    }

    navigator.permissions?.query(desc)
      .then(status => {
        permissionStatus = status
        on(permissionStatus, 'change', onChange)
        onChange()
      })
      .catch(noop)

    return () => {
      permissionStatus && off(permissionStatus, 'change', onChange)
      mounted = false
      permissionStatus = null
    }
  }, [permissionDesc])

  return state
}
