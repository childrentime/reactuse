### useMap

#### Returns
`{ readonly map: Map<K, V>; readonly set: (key: K, value: V) => void; readonly get: (key: K) => V | undefined; readonly remove: (key: K) => boolean; readonly has: (key: K) => boolean; readonly clear: () => void; readonly reset: () => void; readonly size: number; }`: 包含以下属性的对象：
- map: 当前的 Map 实例。
- set: 在 map 中设置键值对的函数。
- get: 通过键从 map 中获取值的函数。
- remove: 从 map 中删除键并返回是否存在的函数。
- has: 检查键是否存在于 map 中的函数。
- clear: 清除 map 中所有条目的函数。
- reset: 将 map 重置为其初始状态的函数。
- size: map 的当前大小。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialValue|初始值，可以为 Map 实例、数组或者一个初始化的函数|Map&lt;K, V&gt; \| readonly (readonly [K, V])[] \| (() =&gt; Map&lt;K, V&gt; \| readonly (readonly [K, V])[]) \| undefined |-|