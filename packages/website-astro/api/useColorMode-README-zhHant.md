### UseColorModeOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|selector|適用於目標元素的 CSS 選擇器|string |`'html'`|
|attribute|應用到目標元素的 html 屬性|string |`'class'`|
|modes|可用的顏色模式|T[]  **(必填)**|`-`|
|defaultValue|預設顏色模式|T |`-`|
|storageKey|將資料持久保存到 localStorage/sessionStorage 的鍵值|string |`'reactuses-color-mode'`|
|storage|儲存對象，可以是localStorage或sessionStorage|() => Storage \| undefined |``localStorage``|
|initialValueDetector|從系統偏好獲取初始顏色模式的函數|() => T |`-`|
|modeClassNames|顏色模式到對應類名或屬性值的映射|Partial&lt;Record&lt;T, string&gt;&gt; |`-`|

### useColorMode

#### Returns
`readonly [T | null, React.Dispatch<React.SetStateAction<T | null>>, () => void]`: 包含以下元素的元組：
- 當前顏色模式值。
- 設定顏色模式的函數。
- 循環切換可用模式的函數。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|-|[UseColorModeOptions](#usecolormodeoptions)&lt;T&gt;  **(必填)**|-|