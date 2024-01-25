import { useKeyModifier } from "@reactuses/core";

export default () => {
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
