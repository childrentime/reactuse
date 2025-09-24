### useBoolean

#### Returns
`{ readonly value: boolean; readonly setValue: (value: boolean) => void; readonly setTrue: () => void; readonly setFalse: () => void; readonly toggle: () => void; }`: An object with the following properties:
- value: The current boolean value.
- setValue: A function to set the boolean value directly.
- setTrue: A function to set the value to true.
- setFalse: A function to set the value to false.
- toggle: A function to toggle the boolean value.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|initialValue|The initial boolean value. Defaults to false.|boolean \| undefined |-|