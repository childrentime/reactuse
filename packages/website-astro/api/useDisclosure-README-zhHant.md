### UseDisclosureProps

|參數名|描述|類型|預設值|
|---|---|---|---|
|isOpen|是否打開，傳了則為受控|boolean |`-`|
|defaultOpen|預設打開狀態|boolean |`-`|
|onClose|關閉時的回調|() => void |`-`|
|onOpen|打開時的回調|() => void |`-`|
|onChange|狀態改變時的回調|(isOpen: boolean \| undefined) => void |`-`|

### useDisclosure

#### Returns
`{ isOpen: boolean; onOpen: () => void; onClose: () => void; onOpenChange: () => void; isControlled: boolean; }`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|props|-|[UseDisclosureProps](#usedisclosureprops) \| undefined |-|