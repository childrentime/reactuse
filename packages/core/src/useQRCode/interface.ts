import type { QRCodeToDataURLOptions } from 'qrcode'

/**
 * @title UseQRCode
 */
export type UseQRCode = (
  /**
   * @zh 文本
   * @en Text
   */
  text: string,
  /**
   * @zh 传递给 `QRCode.toDataURL` 的选项
   * @en Options passed to `QRCode.toDataURL`
   */
  options?: QRCodeToDataURLOptions
) => UseQRCodeReturn

/**
 * @title UseQRCodeReturn
 */
export interface UseQRCodeReturn {
  /**
   * @zh 生成的二维码
   * @en Generated QR code
   */
  qrCode: string
  /**
   * @zh 错误
   * @en Error
   */
  error: unknown
}
