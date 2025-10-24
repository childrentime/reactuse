### UseColorModeOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|selector|适用于目标元素的 CSS 选择器|string |`'html'`|
|attribute|应用到目标元素的 html 属性|string |`'class'`|
|modes|可用的颜色模式|T[]  **(必填)**|`-`|
|defaultValue|默认颜色模式|T |`-`|
|storageKey|将数据持久保存到 localStorage/sessionStorage 的键值|string |`'reactuses-color-mode'`|
|storage|存储对象，可以是localStorage或sessionStorage|() => Storage \| undefined |``localStorage``|
|initialValueDetector|从系统偏好获取初始颜色模式的函数|() => T |`-`|
|modeClassNames|颜色模式到对应类名或属性值的映射|Partial&lt;Record&lt;T, string&gt;&gt; |`-`|

### useColorMode

#### Returns
`readonly [T | null, React.Dispatch<React.SetStateAction<T | null>>, () => void]`: 包含以下元素的元組：
- 當前顏色模式值。
- 設定顏色模式的函數。
- 循環切換可用模式的函數。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|-|[UseColorModeOptions](#UseColorModeOptions)&lt;T&gt;  **(必填)**|-|