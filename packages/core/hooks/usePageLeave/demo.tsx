import { usePageLeave } from "@reactuses/core";

export default () => {
  const isLeft = usePageLeave();

  return <div>isLeft: {JSON.stringify(isLeft)}</div>;
};
