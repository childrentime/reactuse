/**
 * @title UseDisclosureProps
 */
export interface UseDisclosureProps {
  /**
   * @en Whether the disclosure is open, if passed, it will be controlled
   * @zh 是否打开，传了则为受控
   * @zh-Hant 是否打開，傳了則為受控
   */
  isOpen?: boolean
  /**
   * @en default open state
   * @zh 默认打开状态
   * @zh-Hant 預設打開狀態
   */
  defaultOpen?: boolean
  /**
   * @en Callback when disclosure is closed
   * @zh 关闭时的回调
   * @zh-Hant 關閉時的回調
   */
  onClose?: () => void
  /**
   * @en Callback when disclosure is opened
   * @zh 打开时的回调
   * @zh-Hant 打開時的回調
   */
  onOpen?: () => void
  /**
   * @en Callback when disclosure is changed
   * @zh 状态改变时的回调
   * @zh-Hant 狀態改變時的回調
   */
  onChange?: (isOpen: boolean | undefined) => void
}

/**
 * @title useDisclosure
 */
export type UseDisclosure = (props?: UseDisclosureProps) => {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onOpenChange: () => void
  isControlled: boolean
}
