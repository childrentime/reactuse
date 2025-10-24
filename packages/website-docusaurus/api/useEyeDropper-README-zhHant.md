### useEyeDropper

#### Returns
`readonly [boolean, (options?: UseEyeDropperOpenOptions | undefined) => Promise<UseEyeDropperOpenReturnType>]`: 包含以下元素的元組：
- 瀏覽器是否支援該特性。
- 打開顏色選擇器的函數。

#### Arguments


### UseEyeDropperOpenOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|signal|终止信号|AbortSignal |`-`|

### UseEyeDropperOpenReturnType

|參數名|描述|類型|預設值|
|---|---|---|---|
|sRGBHex|rgb 颜色值|string  **(必填)**|`-`|