### Use

#### Returns
`T`: resolved state value

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|usable|promise or context|[Usable](#usable)&lt;T&gt;  **(Required)**|-|

### Usable

```js
type Usable<T> = Thenable<T> | Context<T>;
```