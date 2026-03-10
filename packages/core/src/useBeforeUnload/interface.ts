/**
 * @title useBeforeUnload
 * @returns_en void
 * @returns_zh void
 * @returns_zh-Hant void
 */
export interface UseBeforeUnloadOptions {
  /**
   * @en Whether the beforeunload prompt is enabled
   * @zh 是否启用 beforeunload 提示
   * @zh-Hant 是否啟用 beforeunload 提示
   * @defaultValue true
   */
  enabled?: boolean | (() => boolean);
}

export type UseBeforeUnload = (options?: UseBeforeUnloadOptions | boolean | (() => boolean)) => void;
