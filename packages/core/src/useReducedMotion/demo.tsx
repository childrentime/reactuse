import { useReducedMotion } from "@reactuses/core";

export default () => {
  const motion = useReducedMotion(false);

  return <div>ReducedMotion: {JSON.stringify(motion)}</div>;
};
