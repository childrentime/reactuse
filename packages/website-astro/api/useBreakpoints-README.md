### Breakpoints

### UseBreakpointsOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|defaultWidth|The viewport width, in pixels, assumed on the server and during hydration. Use it to render the layout most of your visitors will see.|number |`0`|

### UseBreakpointsReturn

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|greaterOrEqual|Whether the viewport is at least as wide as the breakpoint|(k: K) => boolean  **(Required)**|`-`|
|greater|Whether the viewport is wider than the breakpoint|(k: K) => boolean  **(Required)**|`-`|
|smaller|Whether the viewport is narrower than the breakpoint|(k: K) => boolean  **(Required)**|`-`|
|smallerOrEqual|Whether the viewport is at most as wide as the breakpoint|(k: K) => boolean  **(Required)**|`-`|
|between|Whether the viewport is at least as wide as `a` and narrower than `b`|(a: K, b: K) => boolean  **(Required)**|`-`|
|current|Every breakpoint the viewport has reached, from smallest to largest|K[]  **(Required)**|`-`|
|active|The largest breakpoint the viewport has reached, or undefined below the smallest one|K \| undefined  **(Required)**|`-`|

### useBreakpoints

#### Returns
`UseBreakpointsReturn<K>`: A boolean per breakpoint (true once the viewport is at least that wide), comparison helpers, and the current and active breakpoints

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|breakpoints|A map from breakpoint name to its minimum viewport width in pixels|[Breakpoints](#breakpoints)&lt;K&gt;  **(Required)**|-|
|options|Options|[UseBreakpointsOptions](#usebreakpointsoptions) \| undefined |-|