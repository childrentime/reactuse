import type { DebouncedFunc } from "lodash-es";

/**
 * @title useScreenSafeArea
 * @returns 包含以下元素的元组：
 * - 顶部安全距离。
 * - 右边安全距离。
 * - 底部安全距离。
 * - 左边安全距离，
 * - 手动更新函数
 * @returns_en A tuple with the following elements:
 * - top safe distance
 * - right safe distance
 * - bottom safe distance
 * - left safe distance
 * - munual update function
 */
export type UseScreenSafeArea = () => readonly [string, string, string, string, DebouncedFunc<() => void>];
