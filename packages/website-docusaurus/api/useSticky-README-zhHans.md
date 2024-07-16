### useSticky

#### Returns
`[boolean, React.Dispatch<React.SetStateAction<boolean>>]`: 包含以下元素的元组：
- 当前是否粘滞。
- 更新粘滞值的函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|targetElement|dom元素|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt;  **(必填)**|-|
|params|可选参数|[UseStickyParams](#UseStickyParams)  **(必填)**|-|
|scrollElement|滚动容器|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt; |-|

### UseStickyParams

|参数名|描述|类型|默认值|
|---|---|---|---|
|axis|滚动方向|'x' \| 'y' |`y`|
|nav|沉浸式高度/宽度|number  **(必填)**|`0`|

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