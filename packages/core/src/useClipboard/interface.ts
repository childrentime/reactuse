/**
 * @title useClipBoard
 * @returns {readonly [string, (txt: string) => Promise<void>]} Returns a readonly tuple.
 */
export type useClipBoradType = () => readonly [string, (txt: string) => Promise<void>];
