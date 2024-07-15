### useWebNotification

#### Returns

`UseWebNotificationReturn`

#### Arguments

| Argument           | Description             | Type                 | DefaultValue |
| ------------------ | ----------------------- | -------------------- | ------------ |
| requestPermissions | auto request permission | boolean \| undefined | -            |

### UseWebNotificationReturn

| Property          | Description                  | Type                                                             | DefaultValue |
| ----------------- | ---------------------------- | ---------------------------------------------------------------- | ------------ |
| isSupported       | whether browser support      | boolean **(Required)**                                           | `-`          |
| show              | show function                | [UseWebNotificationShow](#UseWebNotificationShow) **(Required)** | `-`          |
| close             | close function               | () => void **(Required)**                                        | `-`          |
| ensurePermissions | request permissions function | () =&gt; Promise&lt;boolean \| undefined&gt; **(Required)**      | `-`          |
| permissionGranted | permission status            | React.MutableRefObject&lt;boolean&gt; **(Required)**             | `-`          |

### UseWebNotificationShow

#### Returns

`Notification | undefined`

#### Arguments

| Argument | Description                             | Type                             | DefaultValue |
| -------- | --------------------------------------- | -------------------------------- | ------------ |
| title    | notification title                      | string **(Required)**            | -            |
| options  | options passed to `NotificationOptions` | NotificationOptions \| undefined | -            |
