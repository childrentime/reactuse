# useControlled

React State Hooks that tracks a component is controlled or not.

## Usage

```tsx
import { useControlled } from "@reactuses/core";
import { useState } from "react";

const Demo = () => {
  const [value, setValue] = useControlled({ state: "" });
  const [value1, setValue1] = useState("controlled");
  const [controlledValue, setControlledValue] = useControlled({
    controlled: value1,
  });
  return (
    <div>
      <p>
        uncontrolled input
        <input
          value={value}
          onChange={(v) => {
            setValue(v.target.value);
          }}
          style={{ marginLeft: "2rem" }}
        />
      </p>
      <p>
        controlled input
        <input
          value={controlledValue}
          style={{ marginLeft: "2rem" }}
          onChange={(v) => {
            setControlledValue(v.target.value);
          }}
        />
      </p>
      <button
        onClick={() => {
          setValue1("controlled value");
        }}
      >
        SetControlledValue
      </button>
    </div>
  );
};
```

## Type Declarations

```ts
interface IProps<T> {
  controlled?: T;
  defaultValue?: T;
  state?: T;
}
function useControlled<T = string>({ controlled, defaultValue, state, }: IProps<T>): readonly [T, (newValue: T) => void];
```

## Examples
