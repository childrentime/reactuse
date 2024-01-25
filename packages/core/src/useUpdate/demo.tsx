import { useUpdate } from "@reactuses/core";

export default () => {
  const update = useUpdate();

  return (
    <>
      {/* to avoid ssr error beacause date.now() will not be same in server and client */}
      <div suppressHydrationWarning={true}>Time: {Date.now()}</div>
      <button onClick={update}>Update</button>
    </>
  );
};
