import type { QRCodeToDataURLOptions } from 'qrcode'

/**
 * @title UseQRCode
 */
export type UseQRCode = (
  /**
   * @zh 文本
   * @zh-Hant 文本
   * @ru текст
   * @en Text
   */
  text: string,
  /**
   * @zh 传递给 `QRCode.toDataURL` 的选项
   * @zh-Hant 傳遞給 `QRCode.toDataURL` 的選項
   * @ru параметры, передаваемые в `QRCode.toDataURL`
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
   * @zh-Hant 生成的二維碼
   * @ru сгенерированный QR-код
   * @en Generated QR code
   */
  qrCode: string
  /**
   * @zh 错误
   * @zh-Hant 錯誤
   * @ru ошибка
   * @en Error
   */
  error: unknown
}
