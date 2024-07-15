### useAsyncEffect

#### Returns

`void`

#### Arguments

| 参数名  | 描述                    | 类型                                          | 默认值     |
| ------- | ----------------------- | --------------------------------------------- | ---------- |
| effect  | 支持promise的副作用函数 | () =&gt; T \| Promise&lt;T&gt; **(必填)**     | -          |
| cleanup | 清理函数                | (() =&gt; T \| Promise&lt;T&gt;) \| undefined | `() => {}` |
| deps    | 依赖列表                | React.DependencyList \| undefined             | -          |
