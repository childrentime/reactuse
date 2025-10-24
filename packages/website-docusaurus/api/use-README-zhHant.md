### Use

#### Returns
`T`: 解析狀態值

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|usable|promise 或者 context|[Usable](#usable)&lt;T&gt;  **(必填)**|-|

### Usable

```js
type Usable<T> = Thenable<T> | Context<T>;
```