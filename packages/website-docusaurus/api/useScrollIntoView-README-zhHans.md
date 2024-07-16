### useScrollIntoView

#### Returns
`{ scrollIntoView: (animation?: UseScrollIntoViewAnimation | undefined) => void; cancel: () => void; }`: 包含以下元素的对象：
- scrollIntoView：滚动进入视口函数。
- cancel： 取消滚动函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|targetElement|dom对象|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt;  **(必填)**|-|
|params|可选参数|[UseScrollIntoViewParams](#UseScrollIntoViewParams) \| undefined |-|
|scrollElement|滚动容器|[BasicTarget](#BasicTarget)&lt;HTMLElement&gt; |-|

### UseScrollIntoViewAnimation

|参数名|描述|类型|默认值|
|---|---|---|---|
|alignment|基于当前轴的目标元素相对于父元素的对齐方式|'start' \| 'end' \| 'center' |`-`|

### UseScrollIntoViewParams

|参数名|描述|类型|默认值|
|---|---|---|---|
|onScrollFinish|滚动完成回调|() => void |`-`|
|duration|滚动时间|number |`1250`|
|axis|滚动方向|'x' \| 'y' |`y`|
|easing|自定义缓和数学函数|(t: number) => number |`(t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t`|
|offset|最近的边缘和元素之间的附加距离|number |`0`|
|cancelable|指示动画是否可能因用户滚动而中断|boolean |`true`|
|isList|防止内容在具有多个目标的滚动列表中跳跃|boolean |`-`|

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