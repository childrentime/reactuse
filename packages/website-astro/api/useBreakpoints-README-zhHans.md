### Breakpoints

### UseBreakpointsOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|defaultWidth|在服务端和水合期间假定的视口宽度（像素）。可设为大多数访问者会看到的布局对应的宽度。|number |`0`|

### UseBreakpointsReturn

|参数名|描述|类型|默认值|
|---|---|---|---|
|greaterOrEqual|视口宽度是否大于或等于该断点|(k: K) => boolean  **(必填)**|`-`|
|greater|视口宽度是否大于该断点|(k: K) => boolean  **(必填)**|`-`|
|smaller|视口宽度是否小于该断点|(k: K) => boolean  **(必填)**|`-`|
|smallerOrEqual|视口宽度是否小于或等于该断点|(k: K) => boolean  **(必填)**|`-`|
|between|视口宽度是否大于或等于 `a` 且小于 `b`|(a: K, b: K) => boolean  **(必填)**|`-`|
|current|视口已达到的所有断点，从小到大排列|K[]  **(必填)**|`-`|
|active|视口已达到的最大断点，小于最小断点时为 undefined|K \| undefined  **(必填)**|`-`|

### useBreakpoints

#### Returns
`UseBreakpointsReturn<K>`: 每个断点对应一个布尔值（视口宽度达到该断点时为 true），以及比较函数和当前、活动断点

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|breakpoints|断点名称到其最小视口宽度（像素）的映射|[Breakpoints](#breakpoints)&lt;K&gt;  **(必填)**|-|
|options|可选参数|[UseBreakpointsOptions](#usebreakpointsoptions) \| undefined |-|