### useCookie

#### Returns

`readonly [UseCookieState, (newValue: UseCookieState | ((prevState: UseCookieState) => UseCookieState)) => void, () => void]`: A tuple with the following elements:

- The current value of the cookie.
- A function to update the value of the cookie.
- A function to refresh the value of the cookie, incase other events change it.

#### Arguments

| Argument     | Description                           | Type                  | DefaultValue |
| ------------ | ------------------------------------- | --------------------- | ------------ |
| key          | key                                   | string **(Required)** | -            |
| options      | option pass to `js-cookie`            | any                   | -            |
| defaultValue | defaultValue, must be required in ssr | string \| undefined   | -            |

### useCookieState

#### Type

`export type UseCookieState = string | undefined;`
