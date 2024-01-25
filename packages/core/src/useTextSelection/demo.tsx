import { useTextSelection } from "@reactuses/core";

export default () => {
  const selection = useTextSelection();
  return (
    <div style={{ padding: 40 }}>
      <p>
        Select some text here or anywhere on the page and it will be displayed
        below
      </p>

      <div>Selected text: {selection?.toString()}</div>
    </div>
  );
};
