### useControlledState

#### Returns

`[T, (value: T) => void]`: A tuple with the following elements:

- The current value.
- A function to update the value.

#### Arguments

| Argument     | Description                | Type                                          | DefaultValue |
| ------------ | -------------------------- | --------------------------------------------- | ------------ |
| value        | controlled value           | T \| undefined **(Required)**                 | -            |
| defaultValue | default value              | T **(Required)**                              | -            |
| onChange     | callback when value change | ((v: T, ...args: any[]) => void) \| undefined | -            |
