### UseDisclosureProps

| Property    | Description                                                      | Type                                       | DefaultValue |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------ | ------------ |
| isOpen      | Whether the disclosure is open, if passed, it will be controlled | boolean                                    | `-`          |
| defaultOpen | default open state                                               | boolean                                    | `-`          |
| onClose     | Callback when disclosure is closed                               | () => void                                 | `-`          |
| onOpen      | Callback when disclosure is opened                               | ()=> void                                  | `-`          |
| onChange    | Callback when disclosure is changed                              | boolean \| undefined): void **(Required)** | `-`          |

### useDisclosure

#### Returns

`{ isOpen: boolean; onOpen: () => void; onClose: () => void; onOpenChange: () => void; isControlled: boolean; }`

#### Arguments

| Argument | Description | Type                                                   | DefaultValue |
| -------- | ----------- | ------------------------------------------------------ | ------------ |
| props    | -           | [UseDisclosureProps](#UseDisclosureProps) \| undefined | -            |
