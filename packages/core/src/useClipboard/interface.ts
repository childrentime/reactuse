/**
 * @title useClipBoard
 * @returns_en Returns a readonly tuple.
 * @returns 返回只读元组.
 */
export type UseClipBorad = () => readonly [string, (txt: string) => Promise<void>];
