/**
 * @title useKeyModifier
 * @returns 按键是否被按下
 * @returns_en Whether the key is pressed
 */
export type UseKeyModifier = (
  /**
   * @zh 键位
   * @en key modifier
   */
  modifier: KeyModifier,
  /**
   * @zh 可选参数
   * @en optional params
   */
  options?: UseModifierOptions
) => boolean;

export type KeyModifier =
  | "Alt"
  | "AltGraph"
  | "CapsLock"
  | "Control"
  | "Fn"
  | "FnLock"
  | "Meta"
  | "NumLock"
  | "ScrollLock"
  | "Shift"
  | "Symbol"
  | "SymbolLock";

/**
 * @title UseModifierOptions
 */
export interface UseModifierOptions {
  /**
   * @en Event names that will prompt update to modifier states
   * @zh 更新按键状态的事件
   * @defaultValue ['mousedown', 'mouseup', 'keydown', 'keyup']
   */
  events?: (keyof WindowEventMap)[];

  /**
   * @en Initial value of the returned ref
   * @zh 初始值
   * @defaultValue false
   */
  initial?: boolean;
}
