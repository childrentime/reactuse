import { useNetwork } from "@reactuses/core";

export default () => {
  const state = useNetwork();

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
