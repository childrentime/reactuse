import { usePermission } from "@reactuses/core";

export default () => {
  const state = usePermission({ name: "microphone" });

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
