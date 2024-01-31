### useCssVar

#### Returns
`readonly [string, (v: string) => void]`: 包含以下元素的元组：
- css 变量值
- 更新 css 变量值的函数

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|prop|prop, eg: --color|string  **(Required)**|-|
|target|dom element|React.RefObject&lt;T&gt;  **(Required)**|-|
|defaultValue|default value|string |-|
|options|options|[UseCssVarOptions](#UseCssVarOptions) |-|

### UseCssVarOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|observe|Use MutationObserver to monitor variable changes|boolean |`false`|