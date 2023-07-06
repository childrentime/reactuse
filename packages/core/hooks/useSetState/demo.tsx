import { useSetState } from "@reactuses/core";

export default () => {
  const [state, setState] = useSetState({ value1: "value1", value2: "value2" });
  const { value1, value2 } = state;
  return (
    <div>
      <p>value1: {value1}</p>
      <p>value2: {value2}</p>
      <button
        onClick={() => {
          setState({
            value1: "value",
          });
        }}
      >
        change value
      </button>
    </div>
  );
};
