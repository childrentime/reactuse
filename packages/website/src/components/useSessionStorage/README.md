# useSessionStorage

React side-effect hook that manages a single `sessionStorage` key.

## Usage

```tsx
import { useSessionStorage } from "@reactuses/core";

const Demo = () => {
  // bind string
  const [value, setValue] = useSessionStorage("my-key", "key");

  return (
    <div>
      <div>Value: {value}</div>
      <button onClick={() => setValue("bar")}>bar</button>
      <button onClick={() => setValue("baz")}>baz</button>
      {/* delete data from storage */}
      <button onClick={() => setValue(null)}>Remove</button>
    </div>
  );
};
```

## Type Declarations

>>> Show Type Declarations

```ts
export interface Serializer<T> {
  read(raw: string): T
  write(value: T): string
}

export interface UseStorageOptions<T> {
  /**
   * Custom data serialization
   */
  serializer?: Serializer<T>;
  /**
   * On error callback
   *
   * Default log error to `console.error`
   */
  onError?: (error: unknown) => void;
  /**
   * ignore default value when storage has value
   */
  ignoreDefaults?: boolean;
}

export default function useSessionStorage(
  key: string,
  defaults: string,
  options?: UseStorageOptions<string>
): readonly [string | null, Dispatch<SetStateAction<string | null>>];
export default function useSessionStorage(
  key: string,
  defaults: number,
  options?: UseStorageOptions<number>
): readonly [number | null, Dispatch<SetStateAction<number | null>>];
export default function useSessionStorage(
  key: string,
  defaults: boolean,
  options?: UseStorageOptions<boolean>
): readonly [
  boolean | null,
  Dispatch<SetStateAction<boolean | null>>
];
export default function useSessionStorage<T>(
  key: string,
  defaults: T,
  options?: UseStorageOptions<T>
): readonly [T | null, Dispatch<SetStateAction<T | null>>];
export default function useSessionStorage<T = unknown>(
  key: string,
  defaults: null,
  options?: UseStorageOptions<T>
): readonly [T | null, Dispatch<SetStateAction<T | null>>];

```
>>>

## Examples
