### Breakpoints

### UseBreakpointsOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|defaultWidth|在伺服器端和水合期間假定的視口寬度（像素）。可設為大多數訪客會看到的版面對應的寬度。|number |`0`|

### UseBreakpointsReturn

|參數名|描述|類型|預設值|
|---|---|---|---|
|greaterOrEqual|視口寬度是否大於或等於該斷點|(k: K) => boolean  **(必填)**|`-`|
|greater|視口寬度是否大於該斷點|(k: K) => boolean  **(必填)**|`-`|
|smaller|視口寬度是否小於該斷點|(k: K) => boolean  **(必填)**|`-`|
|smallerOrEqual|視口寬度是否小於或等於該斷點|(k: K) => boolean  **(必填)**|`-`|
|between|視口寬度是否大於或等於 `a` 且小於 `b`|(a: K, b: K) => boolean  **(必填)**|`-`|
|current|視口已達到的所有斷點，從小到大排列|K[]  **(必填)**|`-`|
|active|視口已達到的最大斷點，小於最小斷點時為 undefined|K \| undefined  **(必填)**|`-`|

### useBreakpoints

#### Returns
`UseBreakpointsReturn<K>`: 每個斷點對應一個布林值（視口寬度達到該斷點時為 true），以及比較函數和目前、活動斷點

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|breakpoints|斷點名稱到其最小視口寬度（像素）的對應|[Breakpoints](#breakpoints)&lt;K&gt;  **(必填)**|-|
|options|可選參數|[UseBreakpointsOptions](#usebreakpointsoptions) \| undefined |-|