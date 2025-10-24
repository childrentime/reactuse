### UseDisclosureProps

|參數名|描述|類型|預設值|
|---|---|---|---|
|isOpen|是否打开，传了则为受控|boolean |`-`|
|defaultOpen|默认打开状态|boolean |`-`|
|onClose|关闭时的回调|() => void |`-`|
|onOpen|打开时的回调|() => void |`-`|
|onChange|状态改变时的回调|(isOpen: boolean \| undefined) => void |`-`|

### useDisclosure

#### Returns
`{ isOpen: boolean; onOpen: () => void; onClose: () => void; onOpenChange: () => void; isControlled: boolean; }`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|props|-|[UseDisclosureProps](#UseDisclosureProps) \| undefined |-|