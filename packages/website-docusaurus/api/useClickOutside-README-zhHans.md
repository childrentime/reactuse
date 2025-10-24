### useClickOutside

#### Returns
`void`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|[BasicTarget](#basictarget)&lt;Element&gt;  **(必填)**|-|
|handler|监听函数|(evt: [EventType](#eventtype)) => void  **(必填)**|-|
|enabled|监听函数是否生效|boolean \| undefined |-|

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

### EventType

```js
export type EventType = MouseEvent | TouchEvent;
```