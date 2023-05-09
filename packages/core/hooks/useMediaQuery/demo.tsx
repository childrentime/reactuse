import { useMediaQuery } from "@reactuses/core";

export default () => {
  const isWide = useMediaQuery("(min-width: 480px)");

  return <div>Screen is wide: {isWide ? "Yes" : "No"}</div>;
};
