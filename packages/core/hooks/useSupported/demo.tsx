import { useSupported } from "@reactuses/core";

export default () => {
  const isSupported = useSupported(() => "EyeDropper" in window);
  return (
    <div>
      <p>
        window.EyeDropper is {isSupported ? "supported" : "unsupported"} in your
        browser
      </p>
    </div>
  );
};
