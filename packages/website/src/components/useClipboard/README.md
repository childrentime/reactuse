# useClipboard

Copy text to a user's clipboard.

## Usage

```tsx
import { useClipboard, usePermission } from "@reactuses/core";
import { useState } from "react";

const Demo = () => {
  const [value, setValue] = useState("");
  const [text, copy] = useClipboard();
  const permissionRead = usePermission("clipboard-read");
  const permissionWrite = usePermission("clipboard-write");
  return (
    <div>
      <p>
        Clipboard Permission: read <b>{permissionRead}</b> | write&nbsp;
        <b>{permissionWrite}</b>
      </p>
      <p>
        Current copied: <code>{text || "none"}</code>
      </p>
      <input
        value={value}
        onChange={(event) => {
          setValue(event.currentTarget.value);
        }}
      />
      <button onClick={() => copy(value)}>Copy</button>
    </div>
  );
};
```

## Type Declarations

```ts
export default function useClipBorad(): readonly [
  string,
  (txt: string) => Promise<void>
]
```

## Examples
