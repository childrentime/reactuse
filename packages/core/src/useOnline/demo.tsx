import { useOnline } from "@reactuses/core";

export default () => {
  const online = useOnline();
  return <div>{JSON.stringify(online)}</div>;
};
