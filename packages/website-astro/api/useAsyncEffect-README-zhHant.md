### useAsyncEffect

#### Returns
`void`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|effect|支持promise的副作用函数|() =&gt; T \| Promise&lt;T&gt;  **(必填)**|-|
|cleanup|清理函数|(() =&gt; T \| Promise&lt;T&gt;) \| undefined |`() => {}`|
|deps|依赖列表|React.DependencyList \| undefined |-|