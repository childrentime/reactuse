### UseMutationObserver

#### Returns

`() => void`: stop listenering function

#### Arguments

| Argument | Description                          | Type                                       | DefaultValue |
| -------- | ------------------------------------ | ------------------------------------------ | ------------ |
| callback | callback                             | MutationCallback **(Required)**            | -            |
| target   | dom对象                              | [BasicTarget](#BasicTarget) **(Required)** | -            |
| options  | options passed to `MutationObserver` | MutationObserverInit \| undefined          | -            |

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
