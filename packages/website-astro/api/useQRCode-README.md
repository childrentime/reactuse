### UseQRCode

#### Returns
`UseQRCodeReturn`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|text|Text|string  **(Required)**|-|
|options|Options passed to `QRCode.toDataURL`|QRCodeToDataURLOptions \| undefined |-|

### UseQRCodeReturn

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|qrCode|Generated QR code|string  **(Required)**|`-`|
|error|Error|unknown  **(Required)**|`-`|