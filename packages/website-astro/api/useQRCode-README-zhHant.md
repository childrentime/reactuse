### UseQRCode

#### Returns
`UseQRCodeReturn`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|text|文本|string  **(必填)**|-|
|options|傳遞給 `QRCode.toDataURL` 的選項|QRCodeToDataURLOptions \| undefined |-|

### UseQRCodeReturn

|參數名|描述|類型|預設值|
|---|---|---|---|
|qrCode|生成的二維碼|string  **(必填)**|`-`|
|error|錯誤|unknown  **(必填)**|`-`|