### useKeyModifier

#### Returns
`boolean`: Whether the key is pressed

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|modifier|key modifier|[KeyModifier](#KeyModifier)  **(Required)**|-|
|options|optional params|[UseModifierOptions](#UseModifierOptions) \| undefined |-|

### UseModifierOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|events|Event names that will prompt update to modifier states|(keyof WindowEventMap)[] |`['mousedown', 'mouseup', 'keydown', 'keyup']`|
|initial|Initial value of the returned ref|boolean |`false`|

### KeyModifier

```js
export type KeyModifier = 'Alt' | 'AltGraph' | 'CapsLock' | 'Control' | 'Fn' | 'FnLock' | 'Meta' | 'NumLock' | 'ScrollLock' | 'Shift' | 'Symbol' | 'SymbolLock';
```