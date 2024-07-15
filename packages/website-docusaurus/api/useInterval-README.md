### useInterval

#### Returns

`Pausable`

#### Arguments

| Argument | Description                         | Type                                                   | DefaultValue |
| -------- | ----------------------------------- | ------------------------------------------------------ | ------------ |
| callback | callback                            | () => void **(Required)**                              | -            |
| delay    | Time, if `null` then stop the timer | number \| null \| undefined                            | -            |
| options  | optional params                     | [UseIntervalOptions](#UseIntervalOptions) \| undefined | -            |

### UseIntervalOptions

| Property  | Description                     | Type    | DefaultValue |
| --------- | ------------------------------- | ------- | ------------ |
| immediate | Whether to execute immediately. | boolean | `-`          |
| controls  | Whether to control execution.   | boolean | `-`          |

### Pausable

| Property | Description                                          | Type                                    | DefaultValue |
| -------- | ---------------------------------------------------- | --------------------------------------- | ------------ |
| isActive | A ref indicate whether a pausable instance is active | RefObject&lt;boolean&gt; **(Required)** | `-`          |
| pause    | Temporary pause the effect from executing            | () => void **(Required)**               | `-`          |
| resume   | Resume the effects                                   | () => void **(Required)**               | `-`          |
