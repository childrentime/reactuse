/**
 * @title useClipBoard
 * @returns_en Returns a readonly tuple.
 * @returns 返回只读元组.
 * @returns_zh-Hant 返回唯讀元組.
 * @returns_ru Возвращает кортеж только для чтения.
 */
export type UseClipboard = () => readonly [string, (txt: string) => Promise<void>]
