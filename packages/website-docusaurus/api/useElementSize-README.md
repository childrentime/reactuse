### useElementSize

#### Returns

`readonly [number, number]`: A tuple with the following elements:

- width
- height

#### Arguments

| Argument | Description                        | Type                                                      | DefaultValue |
| -------- | ---------------------------------- | --------------------------------------------------------- | ------------ |
| target   | dom element                        | [BasicTarget](#BasicTarget)&lt;Element&gt; **(Required)** | -            |
| options  | options passed to `resizeObserver` | ResizeObserverOptions \| undefined                        | -            |

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
