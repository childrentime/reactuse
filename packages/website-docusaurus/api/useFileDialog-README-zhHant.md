### useFileDialog

#### Returns
`readonly [FileList | null, (localOptions?: Partial<UseFileDialogOptions> | undefined) => Promise<FileList | null | undefined>, () => void]`: 包含以下元素的元組：
- 檔案陣列。
- 打開檔案選擇器函數。
- 重設函數。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|-|[UseFileDialogOptions](#UseFileDialogOptions) \| undefined |-|

### UseFileDialogOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|multiple|选择多个文件|boolean |`true`|
|accept|可以接受的文件类型|string |`'*'`|
|capture|[指定设备，可以从麦克风或者摄像头中获取文件](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)|string |`-`|