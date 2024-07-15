### useMouse

#### Returns

`UseMouseCursorState`: Mouse Position

#### Arguments

| Argument | Description | Type                        | DefaultValue |
| -------- | ----------- | --------------------------- | ------------ |
| target   | dom element | [BasicTarget](#BasicTarget) | -            |

### UseMouseCursorState

#### Type

`export interface UseMouseCursorState {
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  elementX: number;
  elementY: number;
  elementH: number;
  elementW: number;
  elementPosX: number;
  elementPosY: number;
}`

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
