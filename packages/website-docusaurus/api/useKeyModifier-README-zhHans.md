### useKeyModifier

#### Returns

`boolean`: 按键是否被按下

#### Arguments

| 参数名   | 描述     | 类型                                                   | 默认值 |
| -------- | -------- | ------------------------------------------------------ | ------ |
| modifier | 键位     | [KeyModifier](#KeyModifier) **(必填)**                 | -      |
| options  | 可选参数 | [UseModifierOptions](#UseModifierOptions) \| undefined | -      |

### UseModifierOptions

| 参数名  | 描述               | 类型                     | 默认值                                         |
| ------- | ------------------ | ------------------------ | ---------------------------------------------- |
| events  | 更新按键状态的事件 | (keyof WindowEventMap)[] | `['mousedown', 'mouseup', 'keydown', 'keyup']` |
| initial | 初始值             | boolean                  | `false`                                        |

### KeyModifier

```js
export type KeyModifier = 'Alt' | 'AltGraph' | 'CapsLock' | 'Control' | 'Fn' | 'FnLock' | 'Meta' | 'NumLock' | 'ScrollLock' | 'Shift' | 'Symbol' | 'SymbolLock'
```
