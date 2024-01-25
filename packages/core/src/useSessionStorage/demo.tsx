import { useSessionStorage } from "@reactuses/core";

export default () => {
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
