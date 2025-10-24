### useFileDialog

#### Returns
`readonly [FileList | null, (localOptions?: Partial<UseFileDialogOptions> | undefined) => Promise<FileList | null | undefined>, () => void]`: 包含以下元素的元組：
- 檔案陣列。
- 打開檔案選擇器函數。
- 重設函數。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|-|[UseFileDialogOptions](#usefiledialogoptions) \| undefined |-|

### UseFileDialogOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|multiple|选择多个文件|boolean |`true`|
|accept|可以接受的文件类型|string |`'*'`|
|capture|[指定设备，可以从麦克风或者摄像头中获取文件](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)|string |`-`|