### UseElementByPoint

#### Returns
`UseElementByPointReturn<M>`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|options|[UseElementByPointOptions](#UseElementByPointOptions)&lt;M&gt;  **(Required)**|-|

### UseElementByPointOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|x|The x coordinate of the point|number \| (() => number)  **(Required)**|`-`|
|y|The y coordinate of the point|number \| (() => number)  **(Required)**|`-`|
|document|The document to query|Document \| null |`-`|
|multiple|Whether to query multiple elements|M |`-`|
|interval|The interval to query the element|number \| 'requestAnimationFrame' |`-`|
|immediate|Whether to query the element immediately|boolean |`-`|

### UseElementByPointReturn

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|isSupported|Whether the feature is supported|boolean  **(Required)**|`-`|
|element|The queried element|M extends true ? Element[] : Element \| null  **(Required)**|`-`|
|isActive|A ref indicate whether a pausable instance is active|boolean  **(Required)**|`-`|
|pause|Temporary pause the effect from executing|[Fn](#Fn)  **(Required)**|`-`|
|resume|Resume the effects|[Fn](#Fn)  **(Required)**|`-`|

### Fn

```js
export type Fn = (this: any, ...args: any[]) => any;
```