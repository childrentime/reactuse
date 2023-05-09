import { useMediaDevices } from "@reactuses/core";

export default () => {
  const state = useMediaDevices();

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
