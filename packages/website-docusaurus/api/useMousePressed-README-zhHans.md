### useMousePressed

#### Returns
`readonly [boolean, UseMousePressedSourceType]`: 包含以下元素的元組：
- 滑鼠是否按下。
- 按下的事件來源。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|[BasicTarget](#basictarget)&lt;Element&gt; |-|
|options|可选参数|[UseMousePressedOptions](#usemousepressedoptions) \| undefined |-|

### UseMousePressedOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|touch|监听 `touchstart` 事件|boolean |`true`|
|drag|监听 `dragStart` 事件|boolean |`true`|
|initialValue|初始值|boolean \| (() => boolean) |`false`|

### UseMousePressedSourceType

#### Type

`export type UseMousePressedSourceType = 'mouse' | 'touch' | null`


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