### useCountdown

#### Returns

`readonly [string, string, string]`: A tuple with the following elements:

- hour
- minute.
- second.

#### Arguments

| Argument | Description                            | Type                                                     | DefaultValue |
| -------- | -------------------------------------- | -------------------------------------------------------- | ------------ |
| time     | time differ                            | number **(Required)**                                    | -            |
| format   | time format function                   | ((num: number) => [string, string, string]) \| undefined | `HH MM SS`   |
| callback | callback function for end of countdown | (() => void) \| undefined                                | -            |
