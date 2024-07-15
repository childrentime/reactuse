### UseIdle

#### Returns

`boolean`: whether user is idle

#### Arguments

| Argument     | Description     | Type                                  | DefaultValue                                                        |
| ------------ | --------------- | ------------------------------------- | ------------------------------------------------------------------- |
| ms           | detection time  | number \| undefined                   | `60e3`                                                              |
| initialState | initial value   | boolean \| undefined                  | `false`                                                             |
| events       | listener events | (keyof WindowEventMap)[] \| undefined | `["mousemove","mousedown","resize","keydown","touchstart","wheel"]` |
