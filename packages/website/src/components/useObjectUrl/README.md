# useObjectUrl

Creates an URL for the provided `File`, `Blob`, or `MediaSource` via [URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) and automatically releases the URL via [URL.revokeObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL) when the source changes or the component is unmounted.

## Usage

```tsx
import { useObjectUrl } from "@reactuses/core";
import { ChangeEvent, useState } from "react";

const Demo = () => {
  const [file, setFile] = useState<File>();
  const url = useObjectUrl(file);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const files = target.files;
    setFile(files && files.length > 0 ? files[0] : undefined);
  };
  return (
    <div>
      <p>Select File</p>
      <input type="file" onChange={onFileChange} />
      <p>Object Url</p>
      <div>{url}</div>
    </div>
  );
};
```

## Type Declarations

```ts
export default function useObjectUrl(
  object: Blob | MediaSource | undefined
): string | undefined
```

## Examples
