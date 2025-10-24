### UseElementByPoint

#### Returns
`UseElementByPointReturn<M>`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|配置项|[UseElementByPointOptions](#useelementbypointoptions)&lt;M&gt;  **(必填)**|-|

### UseElementByPointOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|x|点的 x 坐标|number \| (() => number)  **(必填)**|`-`|
|y|点的 y 坐标|number \| (() => number)  **(必填)**|`-`|
|document|要查询的文档|Document \| null |`-`|
|multiple|是否查询多个元素|M |`-`|
|interval|查询元素的间隔|number \| 'requestAnimationFrame' |`-`|
|immediate|是否立即查询元素|boolean |`-`|

### UseElementByPointReturn

|参数名|描述|类型|默认值|
|---|---|---|---|
|isSupported|功能是否支持|boolean  **(必填)**|`-`|
|element|查询到的元素|M extends true ? Element[] : Element \| null  **(必填)**|`-`|
|isActive|一个 ref，表示一个 pausable 实例是否处于激活状态|boolean  **(必填)**|`-`|
|pause|暂时暂停效果的执行|[Fn](#fn)  **(必填)**|`-`|
|resume|恢复效果|[Fn](#fn)  **(必填)**|`-`|

### Fn

```js
export type Fn = (this: any, ...args: any[]) => any;
```