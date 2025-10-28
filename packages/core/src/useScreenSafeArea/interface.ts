import type { DebouncedFunc } from 'lodash-es'

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
 * @returns_zh-Hant 包含以下元素的元組：
 * - 頂部安全距離。
 * - 右邊安全距離。
 * - 底部安全距離。
 * - 左邊安全距離，
 * - 手動更新函數
 * @returns_ru Кортеж со следующими элементами:
 * - верхнее безопасное расстояние.
 * - правое безопасное расстояние.
 * - нижнее безопасное расстояние.
 * - левое безопасное расстояние.
 * - функция ручного обновления.
 */
export type UseScreenSafeArea = () => readonly [string, string, string, string, DebouncedFunc<() => void>]
