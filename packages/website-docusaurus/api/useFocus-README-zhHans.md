### useFocus

#### Returns
`readonly [boolean, (value: boolean) => void]`: 包含以下元素的元组：
- 元素是否聚焦。
- 更新聚焦状态。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|React.RefObject&lt;HTMLElement \| SVGElement&gt;  **(必填)**|-|
|initialValue|默认值|boolean \| undefined |`false`|