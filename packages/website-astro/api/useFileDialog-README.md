### useFileDialog

#### Returns
`readonly [FileList | null, (localOptions?: Partial<UseFileDialogOptions> | undefined) => Promise<FileList | null | undefined>, () => void]`: A tuple with the following elements:
- file array.
- A function to open file dialog.
- A function to reset files

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|-|[UseFileDialogOptions](#usefiledialogoptions) \| undefined |-|

### UseFileDialogOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|multiple|choose multiple file|boolean |`true`|
|accept|accept file type|string |`'*'`|
|capture|[Specify the device to obtain files from the microphone or camera](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)|string |`-`|