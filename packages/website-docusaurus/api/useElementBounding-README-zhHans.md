### useElementBounding

#### Returns

`UseElementBoundingReturn`

#### Arguments

| 参数名  | 描述     | 类型                                                                 | 默认值 |
| ------- | -------- | -------------------------------------------------------------------- | ------ |
| target  | 目标元素 | [BasicTarget](#BasicTarget)&lt;Element&gt; **(必填)**                | -      |
| options | 可选参数 | [UseElementBoundingOptions](#UseElementBoundingOptions) \| undefined | -      |

### UseElementBoundingOptions

| 参数名       | 描述                 | 类型    | 默认值 |
| ------------ | -------------------- | ------- | ------ |
| reset        | 将数值重置为0        | boolean | `true` |
| windowResize | 是否监听 resize 事件 | boolean | `true` |
| windowScroll | 是否监听 scroll 事件 | boolean | `true` |
| immediate    | 立即更新             | boolean | `-`    |

### UseElementBoundingReturn

| 参数名 | 描述           | 类型                  | 默认值 |
| ------ | -------------- | --------------------- | ------ |
| height | 元素的高度     | number **(必填)**     | `-`    |
| bottom | 元素的底部位置 | number **(必填)**     | `-`    |
| left   | 元素的左侧位置 | number **(必填)**     | `-`    |
| right  | 元素的右侧位置 | number **(必填)**     | `-`    |
| top    | 元素的顶部位置 | number **(必填)**     | `-`    |
| width  | 元素的宽度     | number **(必填)**     | `-`    |
| x      | 元素的 X 位置  | number **(必填)**     | `-`    |
| y      | 元素的 Y 位置  | number **(必填)**     | `-`    |
| update | 手动更新       | () => void **(必填)** | `-`    |

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
