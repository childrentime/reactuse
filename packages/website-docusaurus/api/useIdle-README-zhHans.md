### UseIdle

#### Returns
`boolean`: 是否处于空闲

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|ms|检测时间|number \| undefined |`60e3`|
|initialState|初始值|boolean \| undefined |`false`|
|events|监听的事件|(keyof WindowEventMap)[] \| undefined |`["mousemove","mousedown","resize","keydown","touchstart","wheel"]`|