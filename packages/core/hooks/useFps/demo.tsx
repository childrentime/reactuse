import { useFps } from "@reactuses/core";

export default () => {
  const fps = useFps();

  return <div>FPS: {fps}</div>;
};
