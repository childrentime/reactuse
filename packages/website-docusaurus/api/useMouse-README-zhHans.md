### useMouse

#### Returns
`UseMouseCursorState`: 鼠标位置

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom元素|[BasicTarget](#BasicTarget) |-|

### UseMouseCursorState

#### Type

`export interface UseMouseCursorState {
  screenX: number
  screenY: number
  clientX: number
  clientY: number
  pageX: number
  pageY: number
  elementX: number
  elementY: number
  elementH: number
  elementW: number
  elementPosX: number
  elementPosY: number
}`


### BasicTarget

```js
export type BasicTarget<T extends TargetType = Element> = (() => TargetValue<T>) | TargetValue<T> | MutableRefObject<TargetValue<T>>;
```

### TargetValue

```js
type TargetValue<T> = T | undefined | null;
```

### TargetType

```js
type TargetType = HTMLElement | Element | Window | Document | EventTarget;
```