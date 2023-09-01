import { useScreenSafeArea } from "@reactuses/core";

export default function Demo() {
  const [top, right, bottom, left] = useScreenSafeArea();
  return (
    <div>
      <div>
        top: <>{top}</>
      </div>
      <div>
        bottom: <>{bottom}</>
      </div>
      <div>
        left: <>{left}</>
      </div>
      <div>
        right: <>{right}</>
      </div>
    </div>
  );
}
