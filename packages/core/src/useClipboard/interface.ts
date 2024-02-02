/**
 * @title useClipBoard
 * @returns Returns a readonly tuple.
 * @returns {zh} 返回只读元组.
 */
export type UseClipBorad = () => readonly [string, (txt: string) => Promise<void>];
