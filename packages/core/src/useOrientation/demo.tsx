import { useOrientation } from "@reactuses/core";

export default () => {
  const [state] = useOrientation();

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
