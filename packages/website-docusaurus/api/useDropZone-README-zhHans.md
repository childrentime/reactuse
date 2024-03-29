### useDropZone

#### Returns
`boolean`: 文件是否在区域上

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|目标元素|[BasicTarget](#BasicTarget)&lt;EventTarget&gt;  **(必填)**|-|
|onDrop|拖拽释放时候的回调|((files: File[] \| null) => void) \| undefined |-|

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