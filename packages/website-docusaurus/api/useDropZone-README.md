### useDropZone

#### Returns

`boolean`: Whether the file is on the zone

#### Arguments

| Argument | Description    | Type                                                          | DefaultValue |
| -------- | -------------- | ------------------------------------------------------------- | ------------ |
| target   | target element | [BasicTarget](#BasicTarget)&lt;EventTarget&gt; **(Required)** | -            |
| onDrop   | drop callback  | ((files: File[] \| null) => void) \| undefined                | -            |

### BasicTarget

```js
export type BasicTarget<T extends TargetType = Element> = (() => TargetValue<T>) | TargetValue<T> | MutableRefObject<TargetValue<T>>
```

### TargetValue

```js
type TargetValue<T> = T | undefined | null
```

### TargetType

```js
type TargetType = HTMLElement | Element | Window | Document | EventTarget
```
