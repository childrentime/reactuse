/**
 * @title useWebNotification
 */
export type UseWebNotification = (
  /**
   * @zh 自动请求权限
   * @en auto request permission
   */
  requestPermissions?: boolean
) => UseWebNotificationReturn;

/**
 * @title UseWebNotificationReturn
 */
export interface UseWebNotificationReturn {
  /**
   * @zh 浏览器是否支持
   * @en whether browser support
   */
  readonly isSupported: boolean;
  /**
   * @zh 展示函数
   * @en show function
   */
  readonly show: UseWebNotificationShow;
  /**
   * @zh 关闭函数
   * @en close function
   */
  readonly close: () => void;
  /**
   * @zh 请求权限函数
   * @en request permissions function
   */
  readonly ensurePermissions: () => Promise<boolean | undefined>;
  /**
   * @zh 权限状态
   * @en permission status
   */
  readonly permissionGranted: React.MutableRefObject<boolean>;
}

/**
 * @title UseWebNotificationShow
 */
export type UseWebNotificationShow = (
  /**
   * @zh 通知标题
   * @en notification title
   */
  title: string,
  /**
   * @zh 通知选项
   * @en options passed to `NotificationOptions`
   */
  options?: NotificationOptions
) => Notification | undefined;
