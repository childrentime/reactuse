### Use

#### Returns
`T`: 解析状态值

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|usable|promise 或者 context|[Usable](#Usable)&lt;T&gt;  **(必填)**|-|

### Usable

```js
type Usable<T> = Thenable<T> | Context<T>;
```