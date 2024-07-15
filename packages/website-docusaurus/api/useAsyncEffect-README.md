### useAsyncEffect

#### Returns

`void`

#### Arguments

| Argument | Description                 | Type                                          | DefaultValue |
| -------- | --------------------------- | --------------------------------------------- | ------------ |
| effect   | effect that support promise | () =&gt; T \| Promise&lt;T&gt; **(Required)** | -            |
| cleanup  | cleanup function            | (() =&gt; T \| Promise&lt;T&gt;) \| undefined | `() => {}`   |
| deps     | dependency list             | React.DependencyList \| undefined             | -            |
