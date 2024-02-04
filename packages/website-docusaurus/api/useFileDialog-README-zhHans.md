### useFileDialog

#### Returns
`readonly [FileList | null, (localOptions?: Partial<UseFileDialogOptions> | undefined) => void, () => void]`: 包含以下元素的元组：
- 文件数组。
- 打开文件选择器函数。
- 重置函数。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|-|[UseFileDialogOptions](#UseFileDialogOptions) \| undefined |-|

### UseFileDialogOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|multiple|选择多个文件|boolean |`true`|
|accept|可以接受的文件类型|string |`'*'`|
|capture|[指定设备，可以从麦克风或者摄像头中获取文件](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)|string |`-`|