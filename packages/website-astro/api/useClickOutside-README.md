### useClickOutside

#### Returns
`void`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|[BasicTarget](#basictarget)&lt;Element&gt;  **(Required)**|-|
|handler|listener fucntion|(evt: [EventType](#eventtype)) => void  **(Required)**|-|
|enabled|whether the listener fucntion is enabled|boolean \| undefined |-|

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