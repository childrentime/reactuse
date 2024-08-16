### UseQRCode

#### Returns
`UseQRCodeReturn`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|text|文本|string  **(必填)**|-|
|options|传递给 `QRCode.toDataURL` 的选项|QRCodeToDataURLOptions \| undefined |-|

### UseQRCodeReturn

|参数名|描述|类型|默认值|
|---|---|---|---|
|qrCode|生成的二维码|string  **(必填)**|`-`|
|error|错误|unknown  **(必填)**|`-`|