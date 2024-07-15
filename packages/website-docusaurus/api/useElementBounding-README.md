### useElementBounding

#### Returns

`UseElementBoundingReturn`

#### Arguments

| Argument | Description     | Type                                                                 | DefaultValue |
| -------- | --------------- | -------------------------------------------------------------------- | ------------ |
| target   | target element  | [BasicTarget](#BasicTarget)&lt;Element&gt; **(Required)**            | -            |
| options  | optional params | [UseElementBoundingOptions](#UseElementBoundingOptions) \| undefined | -            |

### UseElementBoundingOptions

| Property     | Description                                  | Type    | DefaultValue |
| ------------ | -------------------------------------------- | ------- | ------------ |
| reset        | Reset values to 0 on component unmounted     | boolean | `true`       |
| windowResize | Listen to window resize event                | boolean | `true`       |
| windowScroll | Listen to window scroll event                | boolean | `true`       |
| immediate    | Immediately call update on component mounted | boolean | `-`          |

### UseElementBoundingReturn

| Property | Description                    | Type                      | DefaultValue |
| -------- | ------------------------------ | ------------------------- | ------------ |
| height   | Height of the element          | number **(Required)**     | `-`          |
| bottom   | Bottom position of the element | number **(Required)**     | `-`          |
| left     | Left position of the element   | number **(Required)**     | `-`          |
| right    | Right position of the element  | number **(Required)**     | `-`          |
| top      | Top position of the element    | number **(Required)**     | `-`          |
| width    | Width of the element           | number **(Required)**     | `-`          |
| x        | X position of the element      | number **(Required)**     | `-`          |
| y        | Y position of the element      | number **(Required)**     | `-`          |
| update   | Manual update                  | () => void **(Required)** | `-`          |

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
