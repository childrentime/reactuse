### UseDarkOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|selector|適用於目標元素的 CSS 選擇器|string |`'html'`|
|attribute|應用到目標元素的 html 屬性|string |`'class'`|
|defaultValue|預設值|boolean |`false`|
|storageKey|將資料持久保存到 localStorage/sessionStorage 的鍵值|string |`'reactuses-color-scheme'`|
|storage|儲存對象，可以是localStorage或sessionStorage|() => Storage |``localStorage``|
|classNameDark|應用到目標元素上黑色類名稱|string  **(必填)**|`-`|
|classNameLight|應用到目標元素上的亮色類名稱|string  **(必填)**|`-`|

### useDarkMode

#### Returns
`readonly [boolean | null, () => void, React.Dispatch<React.SetStateAction<boolean | null>>]`: 包含以下元素的元組：
- 黑暗狀態的當前值。
- 切換黑暗狀態的功能。
- 更新黑暗狀態的功能。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|-|[UseDarkOptions](#usedarkoptions)  **(必填)**|-|