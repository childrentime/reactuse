### useMap

#### Returns
`{ readonly map: Map<K, V>; readonly set: (key: K, value: V) => void; readonly get: (key: K) => V | undefined; readonly remove: (key: K) => boolean; readonly has: (key: K) => boolean; readonly clear: () => void; readonly reset: () => void; readonly size: number; }`: 包含以下屬性的對象：
- map: 當前的 Map 實例。
- set: 在 map 中設定鍵值對的函數。
- get: 通過鍵從 map 中獲取值的函數。
- remove: 從 map 中刪除鍵並返回是否存在的函數。
- has: 檢查鍵是否存在於 map 中的函數。
- clear: 清除 map 中所有條目的函數。
- reset: 將 map 重置為其初始狀態的函數。
- size: map 的當前大小。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialValue|初始值，可以为 Map 实例、数组或者一个初始化的函数|Map&lt;K, V&gt; \| readonly (readonly [K, V])[] \| (() =&gt; Map&lt;K, V&gt; \| readonly (readonly [K, V])[]) \| undefined |-|