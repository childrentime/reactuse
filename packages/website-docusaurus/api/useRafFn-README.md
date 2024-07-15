### useRafFn

#### Returns

`readonly [() => void, () => void, () => boolean]`: A tuple with the following elements:

- stop function
- start function
  whether function is running

#### Arguments

| Argument        | Description      | Type                                | DefaultValue |
| --------------- | ---------------- | ----------------------------------- | ------------ |
| callback        | callback         | FrameRequestCallback **(Required)** | -            |
| initiallyActive | immediatly start | boolean \| undefined                | -            |
