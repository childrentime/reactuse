### useClickOutside

#### Returns
`void`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|React.RefObject&lt;Element&gt;  **(必填)**|-|
|handler|监听函数|(evt: [EventType](#EventType)) => void  **(必填)**|-|

### EventType

```js
export type EventType = MouseEvent | TouchEvent;
```