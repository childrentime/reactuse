### useClickOutside

#### Returns
`void`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|React.RefObject&lt;Element&gt;  **(Required)**|-|
|handler|listener fucntion|(evt: [EventType](#EventType)) => void  **(Required)**|-|

### EventType

```js
export type EventType = MouseEvent | TouchEvent;
```