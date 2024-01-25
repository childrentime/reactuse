import { useIdle } from "@reactuses/core";

export default () => {
  const isIdle = useIdle(3e3);

  return (
    <div>
      <div>User is idle: {isIdle ? "Yes 😴" : "Nope"}</div>
    </div>
  );
};
