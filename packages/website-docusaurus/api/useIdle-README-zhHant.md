### UseIdle

#### Returns
`boolean`: 是否處於空閒

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|ms|检测时间|number \| undefined |`60e3`|
|initialState|初始值|boolean \| undefined |`false`|
|events|监听的事件|(keyof WindowEventMap)[] \| undefined |`["mousemove","mousedown","resize","keydown","touchstart","wheel"]`|