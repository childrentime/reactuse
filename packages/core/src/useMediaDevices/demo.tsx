import { useMediaDevices } from "@reactuses/core";

export default () => {
  const [state] = useMediaDevices({
    requestPermissions: true,
  });

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
