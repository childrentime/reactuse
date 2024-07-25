import QRCode from 'qrcode'
import { useState } from 'react'
import { useDeepCompareEffect } from '../useDeepCompareEffect'
import { defaultOptions } from '../utils/defaults'
import type { UseQRCode } from './interface'

export function generateQRCode(text: string, options?: QRCode.QRCodeToDataURLOptions) {
  return QRCode.toDataURL(text, options)
}

export const useQRCode: UseQRCode = (text: string, options: QRCode.QRCodeToDataURLOptions = defaultOptions) => {
  const [qrCode, setQRCode] = useState<string>('')
  const [error, setError] = useState<unknown>(null)

  useDeepCompareEffect(() => {
    const generate = async () => {
      try {
        const qrCode = await generateQRCode(text, options)
        setQRCode(qrCode)
      }
      catch (error) {
        setError(error)
      }
    }

    generate()
  }, [text, options])

  return {
    qrCode,
    error,
  } as const
}
