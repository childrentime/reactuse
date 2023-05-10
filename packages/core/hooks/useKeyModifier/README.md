# useKeyModifier

React Sensor Hook that tracks state of any of the [supported modifiers](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState#browser_compatibility) - see Browser Compatibility notes.

## Usage

```tsx
import { useKeyModifier } from "@reactuses/core";

const Demo = () => {
  const Button = (props: { mode: boolean; name: string }) => {
    const { mode, name } = props;
    return (
      <button style={mode ? { background: "var(--c-input-border-focus)" } : {}}>
        {name}
      </button>
    );
  };

  const capsLock = useKeyModifier("CapsLock");
  const numLock = useKeyModifier("NumLock");
  const scrollLock = useKeyModifier("ScrollLock");
  const shift = useKeyModifier("Shift");
  const control = useKeyModifier("Control");
  const alt = useKeyModifier("Alt");

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <Button mode={capsLock} name="CapsLock" />
        <Button mode={numLock} name="NumLock" />
        <Button mode={scrollLock} name="ScrollLock" />
      </div>
      <div>
        <Button mode={shift} name="Shift" />
        <Button mode={control} name="Control" />
        <Button mode={alt} name="Alt" />
      </div>
    </div>
  );
};
```

## Type Declarations

```ts
export interface UseModifierOptions {
  /**
   * Event names that will prompt update to modifier states
   *
   * @default ['mousedown', 'mouseup', 'keydown', 'keyup']
   */
  events?: (keyof WindowEventMap)[];

  /**
   * Initial value of the returned ref
   *
   * @default false
   */
  initial?: boolean;
}

export default function useKeyModifier(
  modifier: KeyModifier,
  options: UseModifierOptions = {}
): boolean;
```
