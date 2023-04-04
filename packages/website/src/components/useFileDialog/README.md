# useFileDialog

Open file dialog with ease.

## Usage

```tsx
import { useFileDialog } from "@reactuses/core";

const Demo = () => {
  const [files, open, reset] = useFileDialog();

  return (
    <div>
      <button onClick={() => open()}> Choose files</button>
      <button
        style={{ marginLeft: 20 }}
        disabled={!files}
        onClick={() => {
          reset();
        }}
      >
        Reset
      </button>
      {files && (
        <div>
          <p>
            You have selected: <b>{files.length} files</b>
            {Array.from(files).map((file) => {
              return <li key={file.name}>{file.name}</li>;
            })}
          </p>
        </div>
      )}
    </div>
  );
};
```

## Type Declarations

```ts
export interface UseFileDialogOptions {
  /**
   * @default true
   */
  multiple?: boolean;
  /**
   * @default '*'
   */
  accept?: string;
  /**
   * Select the input source for the capture file.
   * @see [HTMLInputElement Capture](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)
   */
  capture?: string;
}

export default function useFileDialog(
  options: UseFileDialogOptions = {}
): readonly [
  FileList | null,
  (localOptions?: Partial<UseFileDialogOptions>) => void,
  () => void
];
```

## Examples
